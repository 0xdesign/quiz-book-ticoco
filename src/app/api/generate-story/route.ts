import { NextRequest, NextResponse } from 'next/server'
import { QuizData as FullQuizData } from '@/lib/supabase'
import { openaiService } from '@/lib/services'
import { generateImage } from '@/lib/openai'
import { QuizData } from '@/components/QuizForm'
import { sanitizeQuizData, validateQuizData } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
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

    // Split into up to 10 pages
    const paragraphs = storyText
      .split('\n\n')
      .map(p => p.trim())
      .filter(Boolean)
    const pagesText = paragraphs.length >= 10
      ? paragraphs.slice(0, 10)
      : [...paragraphs, ...Array.from({ length: 10 - paragraphs.length }, () => '')]

    // Generate an image for each page
    const tone = getStoryTypeDescription(quizData.storyType)
    const prompts = pagesText.map((pt) => {
      const scene = pt || `A ${tone} scene featuring ${quizData.childName}`
      return `Draw a warm, child-friendly illustration for a children's book page.
Scene description: ${scene}
Main character: ${quizData.childName}, age ${quizData.childAge}, traits: ${quizData.childTraits.join(', ')}
Themes: ${(quizData.favoriteThings || []).join(', ')}
Style: ${tone}. Avoid any text in the image.`
    })

    // Generate images in parallel (no fallback; will error if any image fails)
    let pageImages: string[]
    try {
      pageImages = await Promise.all(
        prompts.map((imgPrompt, idx) =>
          generateImage(imgPrompt).catch((e: any) => {
            const msg = e?.message || 'unknown'
            throw new Error(`Image generation failed on page ${idx + 1}: ${msg}`)
          })
        )
      )
    } catch (e: any) {
      const msg = e?.message || 'Unknown image generation error'
      console.error('Image generation failed:', msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const pages = pagesText.map((text, idx) => ({ text, imageBase64: pageImages[idx] }))
    return NextResponse.json({ storyText, pages })
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
