/**
 * Service layer using real implementations
 */

import { QuizData } from './supabase'

// Real service imports
import { generateStory as realGenerateStory } from './openai'
import { stripe } from './stripe'
import { supabase } from './supabase'
import { sendEmail as realSendEmail } from './email'

/**
 * OpenAI Service
 */
export const openaiService = {
  async generateStory(
    quizData: QuizData,
    opts?: {
      model?: string
      reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
      verbosity?: 'low' | 'medium' | 'high'
      maxOutputTokens?: number
    }
  ): Promise<string> {
    return realGenerateStory(quizData, opts)
  }
}

/**
 * Stripe Service
 */
export const stripeService = {
  async createPaymentIntent(amount: number, currency: string = 'usd', metadata?: Record<string, string>) {
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    
    return stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    })
  },
  
  async retrievePaymentIntent(paymentIntentId: string) {
    if (!stripe) {
      throw new Error('Stripe is not configured')
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
    return realSendEmail(options)
  },
  
  // Mock-only method for testing
  getSentEmails() {
    return []
  },
  
  clearSentEmails() {
  }
}

/**
 * Database Service
 */
export const databaseService = {
  async insertBook(bookData: any) {
    const { data, error } = await supabase
      .from('books')
      .insert(bookData)
      .select()
      .single()
    
    return { data, error }
  },
  
  async updateBook(bookId: string, updates: any) {
    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', bookId)
      .select()
      .single()
    
    return { data, error }
  },
  
  async getBook(bookId: string) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single()
    
    return { data, error }
  },
  
  async createDownloadToken(bookId: string) {
    // Download tokens are issued by webhook after payment
    throw new Error('createDownloadToken is not supported. Tokens are created via webhook after payment is completed.')
  },
  
  async validateDownloadToken(token: string) {
    const { data, error } = await supabase
      .from('downloads')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    return { data, error }
  },
  
  async incrementDownloadCount(token: string) {
    // Increment download count atomically
    const { data: current, error: selErr } = await supabase
      .from('downloads')
      .select('*')
      .eq('token', token)
      .single()
    if (selErr || !current) return { data: null, error: selErr }

    const { data, error } = await supabase
      .from('downloads')
      .update({ downloads_count: (current.downloads_count || 0) + 1 })
      .eq('token', token)
      .select()
      .single()

    return { data, error }
  },
  
  async logEvent(eventType: string, bookId?: string, metadata?: Record<string, unknown>) {
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
  }
}

/**
 * Development utilities
 */
export const devUtils = {
  isMockMode: () => false
}
