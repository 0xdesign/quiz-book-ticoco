import { NextRequest, NextResponse } from 'next/server'
import { QuizData as FullQuizData } from '@/lib/supabase'
import { openaiService } from '@/lib/services'
import { generateImage, generateCharacterProfile } from '@/lib/openai'
import { QuizData } from '@/components/QuizForm'
import { sanitizeQuizData, validateQuizData } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const start = Date.now()
    const quizDataRaw: QuizData = await request.json()
    const quizData = sanitizeQuizData(quizDataRaw) as QuizData

    const { isValid, errors } = validateQuizData(quizData)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 })
    }

    const transformedQuizData: FullQuizData = {
      childName: quizData.childName,
      childAge: quizData.childAge,
      childTraits: quizData.childTraits || [],
      storyDescription: quizData.storyDescription || undefined,
      characters: [],
      themes: quizData.favoriteThings || [],
      storyType: getStoryTypeDescription(quizData.storyType),
      characterForm: 'An ordinary child in a magical story',
      message: 'You are unique and special',
      bonusDetails: []
    }

    let storyText: string
    try {
      storyText = await openaiService.generateStory(transformedQuizData)
    } catch (e: any) {
      const msg = e?.message || 'Unknown story generation error'
      console.error('Story generation failed:', msg)
      return NextResponse.json({ error: `Story generation failed: ${msg}` }, { status: 500 })
    }

    // Generate character profile for consistent images
    let characterProfile: string
    try {
      characterProfile = await generateCharacterProfile(transformedQuizData)
      console.log('Character profile generated:', characterProfile.substring(0, 100) + '...')
    } catch (e: any) {
      const msg = e?.message || 'Unknown character profile generation error'
      console.error('Character profile generation failed:', msg)
      return NextResponse.json({ error: `Character profile generation failed: ${msg}` }, { status: 500 })
    }

    // Split into up to 10 pages
    const paragraphs = storyText
      .split('\n\n')
      .map(p => p.trim())
      .filter(Boolean)
    const pagesText = paragraphs.length >= 10
      ? paragraphs.slice(0, 10)
      : [...paragraphs, ...Array.from({ length: 10 - paragraphs.length }, () => '')]

    // Generate an image for each page with limited concurrency
    const tone = getStoryTypeDescription(quizData.storyType)
    const prompts = pagesText.map((pt) => {
      const scene = pt || `A ${tone} scene featuring ${quizData.childName}`
      return `${characterProfile}

CONSISTENCY REQUIREMENT: Use the EXACT character design described above. Same hair, same eyes, same outfit, same features in every image. This is image for one scene in a 10-page book - the character must look identical across all pages.

SCENE FOR THIS PAGE:
${scene}

ARTISTIC DIRECTION:
- Style: Children's book illustration, ${tone} tone
- Composition: Focus on the main character ${quizData.childName}
- Themes present: ${(quizData.favoriteThings || []).join(', ')}
- CRITICAL: Maintain exact character consistency from reference above
- No text or words in the image`
    })

    const size = (process.env.OPENAI_IMAGE_SIZE as `${number}x${number}`) || '768x768'
    const concurrency = Number(process.env.IMAGE_CONCURRENCY || 4)
    const results: string[] = new Array(prompts.length)
    let cursor = 0
    const worker = async () => {
      while (true) {
        const idx = cursor++
        if (idx >= prompts.length) break
        try {
          const img = await generateImage(prompts[idx], { size })
          results[idx] = img
        } catch (e: any) {
          const msg = e?.message || 'unknown'
          throw new Error(`Image generation failed on page ${idx + 1}: ${msg}`)
        }
      }
    }
    try {
      const workers = Array.from({ length: Math.min(concurrency, prompts.length) }, () => worker())
      await Promise.all(workers)
    } catch (e: any) {
      const msg = e?.message || 'Unknown image generation error'
      console.error('Image generation failed:', msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const pages = pagesText.map((text, idx) => ({ text, imageBase64: results[idx] }))
    const elapsed = Date.now() - start
    console.log(`Story + images generated in ${elapsed}ms (text + ${prompts.length} images)`)
    return NextResponse.json({ storyText, pages, characterProfile })
  } catch (error: any) {
    const msg = error?.message || 'Failed to generate story'
    console.error('Story generation error (unhandled):', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function getStoryTypeDescription(storyType: string): string {
  const typeMap: { [key: string]: string } = {
    'everyday-adventure': 'A sweet everyday adventure',
    'magical-journey': 'A magical and poetic dream',
    'brave-hero': 'A big mission in an imaginary world',
    'bedtime-story': 'A calm, soothing bedtime story'
  }
  return typeMap[storyType] || 'A sweet everyday adventure'
}
