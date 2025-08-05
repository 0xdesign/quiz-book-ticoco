/**
 * Mock services for development and testing
 * Allows the app to run without real API keys
 */

import { QuizData } from './supabase'

// Environment check for mock mode
export const IS_MOCK_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.FORCE_MOCK_MODE === 'true' || (process.env.NODE_ENV === 'development' && !process.env.OPENAI_API_KEY)

// Mock story templates based on story type and age
const STORY_TEMPLATES = {
  'A sweet everyday adventure': {
    '3-5': (name: string) => `Once upon a time, there was a wonderful child named ${name} who loved to explore their neighborhood. Every morning, ${name} would wake up with a big smile, ready for a new adventure. Today was special because ${name} had decided to help their neighbors in any way they could.

${name} started by watering Mrs. Johnson's flowers next door. The colorful petals sparkled with water drops as ${name} carefully tended to each plant. "Thank you so much, ${name}!" said Mrs. Johnson with a warm smile.

Next, ${name} helped Mr. Garcia carry his groceries from the car. Even though ${name} was small, they carried the light bags with pride. Mr. Garcia was so grateful that he gave ${name} a fresh apple from his shopping.

As ${name} walked down the street, they noticed Mrs. Chen struggling to catch her escaped cat, Whiskers. Without hesitation, ${name} gently called to Whiskers and helped guide the furry friend back to safety.

The mail carrier, Ms. Rodriguez, was having trouble reaching a high mailbox. ${name} quickly ran to get a small stool from their garage and helped Ms. Rodriguez deliver all the letters properly.

By lunchtime, ${name} had helped five different neighbors! Word spread quickly about ${name}'s kindness, and soon everyone in the neighborhood knew about their helpful spirit.

In the afternoon, ${name} organized a small cleanup of the local park. Other children joined in, inspired by ${name}'s example of caring for their community.

As the sun began to set, ${name} reflected on their wonderful day. They realized that helping others made them feel incredibly happy and proud of themselves.

That evening, ${name}'s family celebrated their kind heart with a special dinner. Everyone shared stories about ${name}'s helpful adventures throughout the day.

From that day forward, ${name} became known as the kindest, most helpful person in the neighborhood, showing everyone that even small acts of kindness can make a big difference in the world.`,
    
    '6-8': (name: string) => `${name} had always been curious about the world around them, but today something extraordinary was about to happen. As they walked to school on this crisp autumn morning, ${name} discovered a mysterious map tucked under a park bench.

The map showed their entire neighborhood, but with strange symbols and pathways that ${name} had never noticed before. There were hidden gardens, secret trails, and even what looked like an underground tunnel system beneath their feet.

After school, ${name} decided to follow the first symbol on the map. It led them to the old oak tree behind the library, where they found a small wooden box buried beneath the fallen leaves. Inside was a compass and a note that read: "For the brave explorer who seeks to help others."

Following the compass needle, ${name} ventured into parts of their neighborhood they'd never explored. The first stop was an elderly man's garden where vegetables were ready for harvest but too much work for one person.

${name} spent the afternoon helping harvest tomatoes, carrots, and beans. The grateful gardener, Mr. Thompson, explained that he donated these vegetables to the local food bank but needed help gathering them.

The next symbol led ${name} to the community center, where children were struggling with their homework. Using skills they'd learned in school, ${name} became a tutor, helping younger kids with reading and math problems.

As the week continued, ${name} followed more symbols on the mysterious map. Each location revealed someone who needed help: a dog walker with too many pets, a baker who needed assistance preparing for a large order, and an artist who was painting a community mural.

By following the map's guidance, ${name} had unknowingly become the neighborhood's unofficial helper, bringing people together and solving problems wherever they went.

On Sunday evening, ${name} returned to the oak tree where their adventure began. There, they found all the people they had helped throughout the week, gathered for a surprise celebration in their honor.

As everyone cheered and thanked ${name} for their kindness and dedication, they realized that the real treasure wasn't gold or jewels - it was the joy that comes from helping others and building a stronger community together.`
  },
  
  'A magical and poetic dream': {
    '3-5': (name: string) => `In a land where dreams float like colorful bubbles and stars dance in daylight, there lived a special child named ${name}. Every night when ${name} closed their eyes, they would travel to the Dream Realm, a place where anything was possible.

Tonight was different, though. As ${name} drifted off to sleep, they found themselves in a garden made entirely of clouds. Flowers bloomed in rainbow colors, and butterflies were made of shimmering moonbeams.

"Welcome, dear ${name}," said a gentle voice. A wise owl made of starlight perched nearby, its eyes twinkling like diamonds. "The Dream Realm needs your help. The Grumpy Clouds have stolen all the happy dreams!"

${name} looked around and saw that half the garden was gray and sad. Children's dreams were trapped in dark storm clouds that rumbled with worry and fear.

"Don't worry," said ${name} bravely. "I'll help bring back the happy dreams!" The star-owl smiled and gave ${name} a magical dream-catcher that glowed with warm, golden light.

As ${name} walked through the gray area, they gently shook the dream-catcher. Wherever its light touched, the dark clouds began to smile and turn bright colors again.

${name} discovered that the Grumpy Clouds weren't mean - they were just sad because nobody ever thanked them for bringing rain to help flowers grow. ${name} gave each cloud a big hug and said "thank you."

Suddenly, all the clouds began to laugh and dance, releasing thousands of beautiful dreams back into the sky. Dreams of flying, playing with unicorns, and having tea parties with friendly dragons filled the air.

The wise star-owl was so impressed with ${name}'s kindness that they were given a special gift: the ability to share happy dreams with other children who needed them.

When ${name} woke up the next morning, they found the magical dream-catcher beside their bed, glowing softly. From that day forward, ${name} would sprinkle dream-dust around their neighborhood, helping everyone have the most wonderful dreams.`
  }
}

// Mock OpenAI service  
export class MockOpenAIService {
  async generateStory(quizData: QuizData): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const storyType = quizData.storyType
    const childAge = quizData.childAge
    const childName = quizData.childName
    
    // Get appropriate story template
    const templates = STORY_TEMPLATES[storyType as keyof typeof STORY_TEMPLATES]
    if (templates) {
      const ageGroup = this.getAgeGroup(childAge)
      const template = templates[ageGroup as keyof typeof templates]
      if (template) {
        return template(childName)
      }
    }
    
    // Fallback generic story
    return this.generateGenericStory(quizData)
  }
  
  private getAgeGroup(age: string): string {
    const ageNum = parseInt(age)
    if (ageNum <= 5) return '3-5'
    return '6-8'
  }
  
  private generateGenericStory(quizData: QuizData): string {
    const { childName, childTraits, message, storyType } = quizData
    const traits = childTraits.join(', ')
    
    return `Once upon a time, there was a wonderful child named ${childName} who was known for being ${traits}. ${childName} lived in a beautiful place where adventure was always just around the corner.

One sunny morning, ${childName} discovered something amazing that would change their day completely. With their ${traits} nature, ${childName} knew exactly what to do.

As ${childName} embarked on this new adventure, they met many interesting characters who needed help. Being naturally ${traits}, ${childName} was always ready to lend a helping hand.

Through their journey, ${childName} learned that ${message}. This important lesson would stay with ${childName} forever and help them in all future adventures.

The story type "${storyType}" brought ${childName} exactly the kind of excitement they were looking for. Every step of the way, ${childName} showed just how ${traits} they truly were.

In the end, ${childName} realized that the greatest adventures come from following your heart and being true to yourself. ${childName} returned home with new wisdom and a heart full of joy.

From that day forward, ${childName} carried the lesson that ${message}, sharing this wisdom with everyone they met.

And so, ${childName} continued to have wonderful adventures, always remembering to be ${traits} and kind to others.

The neighborhood was lucky to have someone like ${childName}, who showed everyone what it means to be truly special.

${childName}'s story reminds us all that we each have unique gifts to share with the world, just like ${childName} shared theirs.`
  }
}

// Mock Stripe service
export class MockStripeService {
  async createPaymentIntent(amount: number, currency: string = 'usd') {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_${Date.now()}_secret_test`,
      amount,
      currency,
      status: 'requires_payment_method'
    }
  }
  
  async confirmPayment(paymentIntentId: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Randomly succeed or fail for testing
    const success = Math.random() > 0.1 // 90% success rate
    
    return {
      id: paymentIntentId,
      status: success ? 'succeeded' : 'failed',
      amount: 1999,
      currency: 'usd'
    }
  }
}

// Mock email service
export class MockEmailService {
  private sentEmails: Array<{
    to: string
    subject: string
    html: string
    attachments?: Array<{
      filename: string
      content: string
    }>
    sentAt: Date
  }> = []
  
  async sendEmail(options: {
    to: string
    subject: string
    html: string
    attachments?: Array<{
      filename: string
      content: string
    }>
  }) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Store sent email for testing verification
    this.sentEmails.push({
      ...options,
      sentAt: new Date()
    })
    
    console.log('📧 Mock Email Sent:', {
      to: options.to,
      subject: options.subject,
      hasAttachments: !!options.attachments?.length
    })
    
    return {
      id: `email_mock_${Date.now()}`,
      status: 'sent'
    }
  }
  
  // Helper method for testing
  getSentEmails() {
    return this.sentEmails
  }
  
  clearSentEmails() {
    this.sentEmails = []
  }
}

// Mock Supabase service
export class MockSupabaseService {
  private books: Map<string, any> = new Map()
  private downloads: Map<string, any> = new Map()
  private events: Array<any> = []
  
  async insertBook(bookData: any) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const book = {
      id: `book_mock_${Date.now()}`,
      ...bookData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    this.books.set(book.id, book)
    return { data: book, error: null }
  }
  
  async updateBook(bookId: string, updates: any) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const book = this.books.get(bookId)
    if (!book) {
      return { data: null, error: { message: 'Book not found' } }
    }
    
    const updatedBook = {
      ...book,
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    this.books.set(bookId, updatedBook)
    return { data: updatedBook, error: null }
  }
  
  async getBook(bookId: string) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const book = this.books.get(bookId)
    return book ? { data: book, error: null } : { data: null, error: { message: 'Book not found' } }
  }
  
  async createDownloadToken(bookId: string) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const token = `dl_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const download = {
      token,
      book_id: bookId,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      downloads_count: 0,
      created_at: new Date().toISOString()
    }
    
    this.downloads.set(token, download)
    return { data: download, error: null }
  }
  
  async validateDownloadToken(token: string) {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const download = this.downloads.get(token)
    if (!download) {
      return { data: null, error: { message: 'Invalid download token' } }
    }
    
    if (new Date(download.expires_at) < new Date()) {
      return { data: null, error: { message: 'Download token expired' } }
    }
    
    return { data: download, error: null }
  }
  
  async incrementDownloadCount(token: string) {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const download = this.downloads.get(token)
    if (download) {
      download.downloads_count += 1
      this.downloads.set(token, download)
    }
    
    return { data: download, error: null }
  }
  
  async logEvent(eventType: string, bookId?: string, metadata?: Record<string, unknown>) {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const event = {
      id: this.events.length + 1,
      event_type: eventType,
      book_id: bookId,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    }
    
    this.events.push(event)
    return { data: event, error: null }
  }
  
  // Helper methods for testing
  getAllBooks() {
    return Array.from(this.books.values())
  }
  
  getAllDownloads() {
    return Array.from(this.downloads.values())
  }
  
  getAllEvents() {
    return this.events
  }
  
  clearAllData() {
    this.books.clear()
    this.downloads.clear()
    this.events = []
  }
}

// Export mock instances
export const mockOpenAI = new MockOpenAIService()
export const mockStripe = new MockStripeService()
export const mockEmail = new MockEmailService()
export const mockSupabase = new MockSupabaseService()