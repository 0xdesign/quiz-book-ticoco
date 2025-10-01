import { NextRequest, NextResponse } from 'next/server'
import { QuizData as FullQuizData } from '@/lib/supabase'
import { openaiService } from '@/lib/services'
import {
  generateImage,
  generateCharacterProfile,
  extractStoryCharacters,
  generateSecondaryCharacterProfile,
  createCharacterDesignDocument
} from '@/lib/openai'
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

    // Extract characters from story
    // Development mode optimization: reduce character count for faster testing
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true'
    const maxSecondaryCharacters = isDevMode ? 2 : 3

    let characters: Array<{ name: string; role: string; importance: number }> = []
    try {
      characters = await extractStoryCharacters(storyText, quizData.childName)
      // Limit characters based on environment
      characters = characters.slice(0, maxSecondaryCharacters)
      console.log(`Extracted ${characters.length} secondary characters:`, characters.map(c => c.name).join(', '))
    } catch (e: any) {
      console.warn('Character extraction failed, continuing without secondary characters:', e?.message)
      // Continue without secondary characters - not critical
    }

    // Generate main character profile
    let mainCharacterProfile: string
    try {
      mainCharacterProfile = await generateCharacterProfile(transformedQuizData)
      console.log('Main character profile generated:', mainCharacterProfile.substring(0, 100) + '...')
    } catch (e: any) {
      const msg = e?.message || 'Unknown character profile generation error'
      console.error('Character profile generation failed:', msg)
      return NextResponse.json({ error: `Character profile generation failed: ${msg}` }, { status: 500 })
    }

    // Generate secondary character profiles (in parallel for speed)
    const secondaryProfiles: Array<{ name: string; profile: string }> = []
    if (characters.length > 0) {
      const results = await Promise.allSettled(
        characters.map(async (char) => {
          const profile = await generateSecondaryCharacterProfile(
            char.name,
            char.role,
            storyText,
            quizData.childName,
            quizData.childAge
          )
          return { name: char.name, profile }
        })
      )

      // Collect successful profiles
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          secondaryProfiles.push(result.value)
          console.log(`Generated profile for ${result.value.name}`)
        } else {
          console.warn(`Failed to generate profile for ${characters[i].name}:`, result.reason?.message)
        }
      })
    }

    // Create unified character design document
    const characterDesignDocument = createCharacterDesignDocument(
      mainCharacterProfile,
      secondaryProfiles
    )

    // Split into pages
    const paragraphs = storyText
      .split('\n\n')
      .map(p => p.trim())
      .filter(Boolean)

    // Development mode: generate fewer images for faster testing
    const targetPageCount = isDevMode ? 5 : 10
    const pagesText = paragraphs.length >= targetPageCount
      ? paragraphs.slice(0, targetPageCount)
      : [...paragraphs.slice(0, targetPageCount), ...Array.from({ length: targetPageCount - Math.min(paragraphs.length, targetPageCount) }, () => '')]

    // Generate an image for each page with limited concurrency
    const tone = getStoryTypeDescription(quizData.storyType)
    const prompts = pagesText.map((pt) => {
      const scene = pt || `A ${tone} scene featuring ${quizData.childName}`
      return `${characterDesignDocument}

SCENE FOR THIS PAGE:
${scene}

ARTISTIC DIRECTION:
- Style: Children's book illustration, ${tone} tone
- Composition: Focus on the characters present in this scene
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
    return NextResponse.json({ storyText, pages, characterProfile: characterDesignDocument })
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
