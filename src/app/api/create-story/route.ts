import { NextRequest, NextResponse } from 'next/server'
import { QuizData as FullQuizData } from '@/lib/supabase'
import { databaseService } from '@/lib/services'
import { QuizData } from '@/components/QuizForm'
import { sanitizeQuizData, validateQuizData } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const quizDataRaw: QuizData = body.quizData || body
    const quizData = sanitizeQuizData(quizDataRaw) as QuizData
    const storyText: string | undefined = body.storyText

    // Validate input
    const { isValid, errors } = validateQuizData(quizData)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 })
    }

    // Transform the simplified quiz data to match our schema
    const transformedQuizData: FullQuizData = {
      childName: quizData.childName,
      childAge: quizData.childAge,
      childTraits: quizData.childTraits || [],
      storyDescription: quizData.storyDescription || undefined,
      characters: [], // No characters in simplified version
      themes: quizData.favoriteThings || [], // Use favoriteThings as themes
      storyType: getStoryTypeDescription(quizData.storyType),
      characterForm: 'An ordinary child in a magical story', // Default form
      message: 'You are unique and special', // Default message
      bonusDetails: [] // No bonus details in simplified version
    }

    // Create book record
    const { data: book, error: bookError } = await databaseService.insertBook({
      quiz_data: transformedQuizData,
      story_text: storyText || null,
      email: quizData.parentEmail,
      payment_status: 'pending'
    })

    if (bookError) {
      console.error('Database error:', bookError)
      return NextResponse.json(
        { error: 'Failed to create book record' },
        { status: 500 }
      )
    }

    // Track story approved event (user reviewed before creating)
    await databaseService.logEvent('story_approved', book.id, {
      child_name: quizData.childName,
      child_age: quizData.childAge,
      num_traits: quizData.childTraits?.length || 0,
      num_favorites: quizData.favoriteThings?.length || 0,
      story_type: quizData.storyType
    })
    return NextResponse.json({ bookId: book.id })
  } catch (error) {
    console.error('Story creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


// Map simplified story types to descriptive ones
function getStoryTypeDescription(storyType: string): string {
  const typeMap: { [key: string]: string } = {
    'everyday-adventure': 'A sweet everyday adventure',
    'magical-journey': 'A magical and poetic dream',
    'brave-hero': 'A big mission in an imaginary world',
    'bedtime-story': 'A calm, soothing bedtime story'
  }
  return typeMap[storyType] || 'A sweet everyday adventure'
}
