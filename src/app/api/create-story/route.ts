import { NextRequest, NextResponse } from 'next/server'
import { QuizData as FullQuizData } from '@/lib/supabase'
import { openaiService, databaseService } from '@/lib/services'
import { generatePDF } from '@/lib/pdf'
import { QuizData } from '@/components/QuizForm'

export async function POST(request: NextRequest) {
  try {
    const quizData: QuizData = await request.json()

    // Validate required fields
    if (!quizData.childName || !quizData.childAge || !quizData.parentEmail || !quizData.parentConsent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Transform the simplified quiz data to match our schema
    const transformedQuizData: FullQuizData = {
      childName: quizData.childName,
      childAge: quizData.childAge,
      childTraits: quizData.childTraits || [],
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

    // Track quiz completion event
    await databaseService.logEvent('quiz_completed', book.id, {
      child_name: quizData.childName,
      child_age: quizData.childAge,
      num_traits: quizData.childTraits?.length || 0,
      num_favorites: quizData.favoriteThings?.length || 0,
      story_type: quizData.storyType
    })

    // Immediately start story generation (don't wait for it)
    generateStoryInBackground(book.id, transformedQuizData)

    return NextResponse.json({ bookId: book.id })
  } catch (error) {
    console.error('Story creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Background story generation
async function generateStoryInBackground(bookId: string, quizData: FullQuizData) {
  try {
    // Generate the story
    const storyText = await openaiService.generateStory(quizData)
    
    // Generate PDF
    const pdfPath = await generatePDF(storyText, quizData.childName)
    
    // Update book record
    await databaseService.updateBook(bookId, {
      story_text: storyText,
      pdf_url: pdfPath
    })

    console.log(`Story generated for book ${bookId}`)
  } catch (error) {
    console.error(`Background story generation failed for book ${bookId}:`, error)
    
    // Update book with error status
    await databaseService.updateBook(bookId, {
      payment_status: 'failed'
    })
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