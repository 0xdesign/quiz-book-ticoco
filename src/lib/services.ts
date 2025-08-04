/**
 * Service layer that switches between real and mock implementations
 * based on environment configuration
 */

import { QuizData } from './supabase'
import { IS_MOCK_MODE, mockOpenAI, mockStripe, mockEmail, mockSupabase } from './mocks'

// Real service imports
import { generateStory as realGenerateStory } from './openai'
import { stripe } from './stripe'
import { supabase } from './supabase'
import { sendEmail as realSendEmail } from './email'

/**
 * OpenAI Service
 */
export const openaiService = {
  async generateStory(quizData: QuizData): Promise<string> {
    if (IS_MOCK_MODE) {
      console.log('🤖 Using mock OpenAI service')
      return mockOpenAI.generateStory(quizData)
    }
    return realGenerateStory(quizData)
  }
}

/**
 * Stripe Service
 */
export const stripeService = {
  async createPaymentIntent(amount: number, currency: string = 'usd') {
    if (IS_MOCK_MODE) {
      console.log('💳 Using mock Stripe service')
      return mockStripe.createPaymentIntent(amount, currency)
    }
    
    return stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    })
  },
  
  async retrievePaymentIntent(paymentIntentId: string) {
    if (IS_MOCK_MODE) {
      console.log('💳 Using mock Stripe service for retrieval')
      return mockStripe.confirmPayment(paymentIntentId)
    }
    
    return stripe.paymentIntents.retrieve(paymentIntentId)
  }
}

/**
 * Email Service
 */
export const emailService = {
  async sendEmail(options: {
    to: string
    subject: string
    html: string
    attachments?: Array<{
      filename: string
      content: string
    }>
  }) {
    if (IS_MOCK_MODE) {
      console.log('📧 Using mock email service')
      return mockEmail.sendEmail(options)
    }
    
    return realSendEmail(options)
  },
  
  // Mock-only method for testing
  getSentEmails() {
    if (IS_MOCK_MODE) {
      return mockEmail.getSentEmails()
    }
    return []
  },
  
  clearSentEmails() {
    if (IS_MOCK_MODE) {
      mockEmail.clearSentEmails()
    }
  }
}

/**
 * Database Service
 */
export const databaseService = {
  async insertBook(bookData: any) {
    if (IS_MOCK_MODE) {
      console.log('🗄️ Using mock database service')
      return mockSupabase.insertBook(bookData)
    }
    
    const { data, error } = await supabase
      .from('books')
      .insert(bookData)
      .select()
      .single()
    
    return { data, error }
  },
  
  async updateBook(bookId: string, updates: any) {
    if (IS_MOCK_MODE) {
      console.log('🗄️ Using mock database service for update')
      return mockSupabase.updateBook(bookId, updates)
    }
    
    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', bookId)
      .select()
      .single()
    
    return { data, error }
  },
  
  async getBook(bookId: string) {
    if (IS_MOCK_MODE) {
      console.log('🗄️ Using mock database service for retrieval')
      return mockSupabase.getBook(bookId)
    }
    
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single()
    
    return { data, error }
  },
  
  async createDownloadToken(bookId: string) {
    if (IS_MOCK_MODE) {
      console.log('🗄️ Using mock database service for download token')
      return mockSupabase.createDownloadToken(bookId)
    }
    
    const token = `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    const { data, error } = await supabase
      .from('downloads')
      .insert({
        token,
        book_id: bookId,
        expires_at: expiresAt.toISOString(),
        downloads_count: 0
      })
      .select()
      .single()
    
    return { data, error }
  },
  
  async validateDownloadToken(token: string) {
    if (IS_MOCK_MODE) {
      console.log('🗄️ Using mock database service for token validation')
      return mockSupabase.validateDownloadToken(token)
    }
    
    const { data, error } = await supabase
      .from('downloads')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    return { data, error }
  },
  
  async incrementDownloadCount(token: string) {
    if (IS_MOCK_MODE) {
      console.log('🗄️ Using mock database service for download count')
      return mockSupabase.incrementDownloadCount(token)
    }
    
    const { data, error } = await supabase
      .rpc('increment_download_count', { download_token: token })
    
    return { data, error }
  },
  
  async logEvent(eventType: string, bookId?: string, metadata?: Record<string, unknown>) {
    if (IS_MOCK_MODE) {
      console.log('🗄️ Using mock database service for event logging')
      return mockSupabase.logEvent(eventType, bookId, metadata)
    }
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        event_type: eventType,
        book_id: bookId,
        metadata: metadata || {}
      })
      .select()
      .single()
    
    return { data, error }
  },
  
  // Mock-only methods for testing
  getAllBooks() {
    if (IS_MOCK_MODE) {
      return mockSupabase.getAllBooks()
    }
    return []
  },
  
  getAllDownloads() {
    if (IS_MOCK_MODE) {
      return mockSupabase.getAllDownloads()
    }
    return []
  },
  
  getAllEvents() {
    if (IS_MOCK_MODE) {
      return mockSupabase.getAllEvents()
    }
    return []
  },
  
  clearAllData() {
    if (IS_MOCK_MODE) {
      mockSupabase.clearAllData()
    }
  }
}

/**
 * Development utilities
 */
export const devUtils = {
  isMockMode: () => IS_MOCK_MODE,
  
  getMockData() {
    if (!IS_MOCK_MODE) return null
    
    return {
      books: databaseService.getAllBooks(),
      downloads: databaseService.getAllDownloads(),
      events: databaseService.getAllEvents(),
      emails: emailService.getSentEmails()
    }
  },
  
  clearAllMockData() {
    if (!IS_MOCK_MODE) return
    
    databaseService.clearAllData()
    emailService.clearSentEmails()
    console.log('🧹 All mock data cleared')
  }
}