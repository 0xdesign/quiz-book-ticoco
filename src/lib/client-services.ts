// Client-side services for static deployment
import { initializeDemoData, mockSupabase, mockOpenAI, mockStripe, mockResend } from './mock-services'
import { generateStoryFromTemplate } from './demo-config'
import { QuizData } from '@/components/QuizForm'

// Initialize demo data on first load
if (typeof window !== 'undefined') {
  initializeDemoData()
}

// Client-side story creation
export async function createStoryClient(quizData: QuizData): Promise<{ bookId: string }> {
  // Transform quiz data
  const transformedData = {
    childName: quizData.childName,
    childAge: quizData.childAge,
    childTraits: quizData.childTraits || [],
    favoriteThings: quizData.favoriteThings || [],
    storyType: quizData.storyType,
    storyTheme: quizData.storyType,
    parentEmail: quizData.parentEmail,
    parentConsent: quizData.parentConsent
  }
  
  // Generate story from template
  const story = generateStoryFromTemplate(transformedData)
  
  // Create book record in local storage
  const bookResult = await mockSupabase.from('books').insert({
    quiz_data: transformedData,
    story_text: story.content,
    story_title: story.title,
    email: quizData.parentEmail,
    payment_status: 'pending'
  }).select().single()
  
  if (bookResult.error) {
    throw new Error('Failed to create book')
  }
  
  return { bookId: bookResult.data.id }
}

// Client-side payment creation
export async function createPaymentIntentClient(bookId: string): Promise<{ clientSecret: string }> {
  const result = await mockStripe.paymentIntents.create({
    amount: 1999,
    currency: 'usd',
    metadata: { bookId }
  })
  
  return { clientSecret: result.client_secret }
}

// Client-side checkout session
export async function createCheckoutSessionClient(bookId: string, email: string): Promise<{ url: string }> {
  const session = await mockStripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Personalized Children\'s Book',
          description: 'A magical story created just for your child'
        },
        unit_amount: 1999
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${window.location.origin}/success/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${window.location.origin}/checkout/${bookId}`,
    customer_email: email,
    metadata: { bookId }
  })
  
  // Simulate checkout by going directly to success page
  const successUrl = `/success/${bookId}?session_id=${session.id}&demo=true`
  
  return { url: successUrl }
}

// Client-side book retrieval
export async function getBookClient(bookId: string) {
  const result = await mockSupabase.from('books').select().eq('id', bookId).single()
  return result.data
}

// Client-side PDF generation (using browser)
export async function generatePDFClient(bookId: string): Promise<Blob> {
  const book = await getBookClient(bookId)
  if (!book) throw new Error('Book not found')
  
  // Create a simple text file as PDF placeholder for demo
  const content = `${book.story_title || 'Your Story'}\n\n${book.story_text || 'Story content'}\n\nCreated for: ${book.quiz_data.childName}`
  const blob = new Blob([content], { type: 'text/plain' })
  
  // In a real implementation, you would use a library like jsPDF
  return blob
}

// Client-side download token generation
export async function createDownloadTokenClient(bookId: string): Promise<string> {
  const result = await mockSupabase.from('books').update({
    download_token: `demo_token_${Date.now()}_${bookId}`,
    download_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }).eq('id', bookId).select().single()
  
  return result.data?.download_token || ''
}

// Client-side email simulation
export async function sendEmailClient(to: string, subject: string, html: string) {
  return mockResend.emails.send({ to, subject, html })
}