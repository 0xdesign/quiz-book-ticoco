/**
 * Comprehensive tests for the service layer
 * Tests both mock and real service integration
 */

import { openaiService, stripeService, emailService, databaseService, devUtils } from '@/lib/services'
import { QuizData } from '@/lib/supabase'

// Mock environment to enable mock mode
const originalEnv = process.env.NODE_ENV
const originalOpenAIKey = process.env.OPENAI_API_KEY

describe('Service Layer Tests', () => {
  beforeEach(() => {
    // Clear all mock data before each test
    devUtils.clearAllMockData()
  })

  afterAll(() => {
    // Restore original environment
    process.env.NODE_ENV = originalEnv
    process.env.OPENAI_API_KEY = originalOpenAIKey
  })

  describe('Mock Mode Detection', () => {
    test('should detect mock mode correctly', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.OPENAI_API_KEY
      
      expect(devUtils.isMockMode()).toBe(true)
    })

    test('should not use mock mode in production', () => {
      process.env.NODE_ENV = 'production'
      process.env.OPENAI_API_KEY = 'test-key'
      
      expect(devUtils.isMockMode()).toBe(false)
    })
  })

  describe('OpenAI Service', () => {
    const sampleQuizData: QuizData = {
      childName: 'Alice',
      childAge: '5',
      childTraits: ['brave', 'kind', 'curious'],
      characters: [],
      themes: ['adventure', 'friendship'],
      storyType: 'A sweet everyday adventure',
      characterForm: 'An ordinary child in a magical story',
      message: 'You are special and loved',
      bonusDetails: []
    }

    test('should generate story with child name included', async () => {
      const story = await openaiService.generateStory(sampleQuizData)
      
      expect(story).toBeTruthy()
      expect(story.length).toBeGreaterThan(100)
      expect(story.toLowerCase()).toContain('alice')
    })

    test('should generate different stories for different story types', async () => {
      const adventureQuiz = { ...sampleQuizData, storyType: 'A sweet everyday adventure' }
      const magicalQuiz = { ...sampleQuizData, storyType: 'A magical and poetic dream' }

      const adventureStory = await openaiService.generateStory(adventureQuiz)
      const magicalStory = await openaiService.generateStory(magicalQuiz)

      expect(adventureStory).toBeTruthy()
      expect(magicalStory).toBeTruthy()
      expect(adventureStory).not.toBe(magicalStory)
    })

    test('should handle different age groups', async () => {
      const youngQuiz = { ...sampleQuizData, childAge: '4' }
      const olderQuiz = { ...sampleQuizData, childAge: '7' }

      const youngStory = await openaiService.generateStory(youngQuiz)
      const olderStory = await openaiService.generateStory(olderQuiz)

      expect(youngStory).toBeTruthy()
      expect(olderStory).toBeTruthy()
      expect(youngStory.toLowerCase()).toContain('alice')
      expect(olderStory.toLowerCase()).toContain('alice')
    })
  })

  describe('Stripe Service', () => {
    test('should create payment intent with correct amount', async () => {
      const paymentIntent = await stripeService.createPaymentIntent(1999)
      
      expect(paymentIntent).toBeTruthy()
      expect(paymentIntent.id).toMatch(/^pi_mock_\d+$/)
      expect(paymentIntent.amount).toBe(1999)
      expect(paymentIntent.currency).toBe('usd')
      expect(paymentIntent.client_secret).toBeTruthy()
    })

    test('should handle payment intent retrieval', async () => {
      const paymentIntent = await stripeService.createPaymentIntent(1999)
      const retrieved = await stripeService.retrievePaymentIntent(paymentIntent.id)
      
      expect(retrieved).toBeTruthy()
      expect(retrieved.id).toBe(paymentIntent.id)
    })
  })

  describe('Email Service', () => {
    test('should send email successfully', async () => {
      const emailOptions = {
        to: 'parent@example.com',
        subject: 'Your personalized story is ready!',
        html: '<h1>Thank you for your purchase</h1>',
        attachments: [{
          filename: 'story.pdf',
          content: 'fake-pdf-content'
        }]
      }

      const result = await emailService.sendEmail(emailOptions)
      
      expect(result).toBeTruthy()
      expect(result.id).toMatch(/^email_mock_\d+$/)
      expect(result.status).toBe('sent')
    })

    test('should track sent emails in mock mode', async () => {
      const emailOptions = {
        to: 'parent@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>'
      }

      await emailService.sendEmail(emailOptions)
      const sentEmails = emailService.getSentEmails()
      
      expect(sentEmails).toHaveLength(1)
      expect(sentEmails[0].to).toBe('parent@example.com')
      expect(sentEmails[0].subject).toBe('Test Email')
    })

    test('should clear sent emails', async () => {
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: 'Test'
      })

      expect(emailService.getSentEmails()).toHaveLength(1)
      
      emailService.clearSentEmails()
      expect(emailService.getSentEmails()).toHaveLength(0)
    })
  })

  describe('Database Service', () => {
    const sampleBookData = {
      quiz_data: {
        childName: 'Bob',
        childAge: '6',
        childTraits: ['funny', 'smart'],
        characters: [],
        themes: ['space', 'robots'],
        storyType: 'A big mission in an imaginary world',
        characterForm: 'A brave astronaut',
        message: 'You can achieve anything',
        bonusDetails: []
      },
      email: 'parent@example.com',
      payment_status: 'pending' as const
    }

    test('should insert book successfully', async () => {
      const { data: book, error } = await databaseService.insertBook(sampleBookData)
      
      expect(error).toBeNull()
      expect(book).toBeTruthy()
      expect(book!.id).toMatch(/^book_mock_\d+$/)
      expect(book!.quiz_data.childName).toBe('Bob')
      expect(book!.email).toBe('parent@example.com')
      expect(book!.payment_status).toBe('pending')
    })

    test('should update book successfully', async () => {
      const { data: book } = await databaseService.insertBook(sampleBookData)
      
      const { data: updated, error } = await databaseService.updateBook(book!.id, {
        story_text: 'Generated story content',
        payment_status: 'completed'
      })
      
      expect(error).toBeNull()
      expect(updated!.story_text).toBe('Generated story content')
      expect(updated!.payment_status).toBe('completed')
    })

    test('should retrieve book by ID', async () => {
      const { data: book } = await databaseService.insertBook(sampleBookData)
      
      const { data: retrieved, error } = await databaseService.getBook(book!.id)
      
      expect(error).toBeNull()
      expect(retrieved!.id).toBe(book!.id)
      expect(retrieved!.quiz_data.childName).toBe('Bob')
    })

    test('should handle non-existent book', async () => {
      const { data, error } = await databaseService.getBook('non-existent-id')
      
      expect(data).toBeNull()
      expect(error).toBeTruthy()
      expect(error!.message).toBe('Book not found')
    })

    test('should create download token', async () => {
      const { data: book } = await databaseService.insertBook(sampleBookData)
      
      const { data: download, error } = await databaseService.createDownloadToken(book!.id)
      
      expect(error).toBeNull()
      expect(download!.token).toMatch(/^dl_mock_\d+_[a-z0-9]+$/)
      expect(download!.book_id).toBe(book!.id)
      expect(download!.downloads_count).toBe(0)
    })

    test('should validate download token', async () => {
      const { data: book } = await databaseService.insertBook(sampleBookData)
      const { data: download } = await databaseService.createDownloadToken(book!.id)
      
      const { data: validated, error } = await databaseService.validateDownloadToken(download!.token)
      
      expect(error).toBeNull()
      expect(validated!.token).toBe(download!.token)
      expect(validated!.book_id).toBe(book!.id)
    })

    test('should reject invalid download token', async () => {
      const { data, error } = await databaseService.validateDownloadToken('invalid-token')
      
      expect(data).toBeNull()
      expect(error).toBeTruthy()
      expect(error!.message).toBe('Invalid download token')
    })

    test('should increment download count', async () => {
      const { data: book } = await databaseService.insertBook(sampleBookData)
      const { data: download } = await databaseService.createDownloadToken(book!.id)
      
      await databaseService.incrementDownloadCount(download!.token)
      const { data: updated } = await databaseService.validateDownloadToken(download!.token)
      
      expect(updated!.downloads_count).toBe(1)
    })

    test('should log events', async () => {
      const { data: book } = await databaseService.insertBook(sampleBookData)
      
      const { data: event, error } = await databaseService.logEvent('quiz_completed', book!.id, {
        child_name: 'Bob',
        story_type: 'adventure'
      })
      
      expect(error).toBeNull()
      expect(event!.event_type).toBe('quiz_completed')
      expect(event!.book_id).toBe(book!.id)
      expect(event!.metadata.child_name).toBe('Bob')
    })
  })

  describe('Development Utilities', () => {
    test('should provide mock data overview', async () => {
      // Create some test data
      const { data: book } = await databaseService.insertBook({
        quiz_data: { childName: 'Test', childAge: '5' } as any,
        email: 'test@example.com',
        payment_status: 'pending'
      })
      
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: 'Test'
      })

      const mockData = devUtils.getMockData()
      
      expect(mockData).toBeTruthy()
      expect(mockData!.books).toHaveLength(1)
      expect(mockData!.emails).toHaveLength(1)
      expect(mockData!.downloads).toHaveLength(0)
      expect(mockData!.events).toHaveLength(0)
    })

    test('should clear all mock data', async () => {
      // Create some test data
      await databaseService.insertBook({
        quiz_data: { childName: 'Test', childAge: '5' } as any,
        email: 'test@example.com',
        payment_status: 'pending'
      })
      
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: 'Test'
      })

      let mockData = devUtils.getMockData()
      expect(mockData!.books).toHaveLength(1)
      expect(mockData!.emails).toHaveLength(1)

      devUtils.clearAllMockData()
      
      mockData = devUtils.getMockData()
      expect(mockData!.books).toHaveLength(0)
      expect(mockData!.emails).toHaveLength(0)
    })
  })
})