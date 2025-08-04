/**
 * Comprehensive error handling system for Quiz Book application
 * Handles network failures, API timeouts, validation errors, and user-friendly messaging
 */

import { databaseService } from './services'

export enum ErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  VALIDATION = 'VALIDATION',
  API = 'API',
  PAYMENT = 'PAYMENT',
  STORY_GENERATION = 'STORY_GENERATION',
  PDF_GENERATION = 'PDF_GENERATION',
  EMAIL_DELIVERY = 'EMAIL_DELIVERY',
  SECURITY = 'SECURITY',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType
  message: string
  userMessage: string
  code?: string
  details?: Record<string, any>
  timestamp: Date
  retryable: boolean
  retryAfterMs?: number
}

export class QuizBookError extends Error {
  public readonly type: ErrorType
  public readonly userMessage: string
  public readonly code?: string
  public readonly details?: Record<string, any>
  public readonly retryable: boolean
  public readonly retryAfterMs?: number

  constructor(appError: Omit<AppError, 'timestamp'>) {
    super(appError.message)
    this.name = 'QuizBookError'
    this.type = appError.type
    this.userMessage = appError.userMessage
    this.code = appError.code
    this.details = appError.details
    this.retryable = appError.retryable
    this.retryAfterMs = appError.retryAfterMs
  }
}

/**
 * Error handling utilities
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: AppError[] = []

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Handle and classify errors
   */
  handleError(error: unknown, context?: string): AppError {
    const appError = this.classifyError(error, context)
    this.logError(appError, context)
    return appError
  }

  /**
   * Classify error types and provide user-friendly messages
   */
  private classifyError(error: unknown, context?: string): AppError {
    let appError: AppError

    if (error instanceof QuizBookError) {
      return {
        type: error.type,
        message: error.message,
        userMessage: error.userMessage,
        code: error.code,
        details: error.details,
        timestamp: new Date(),
        retryable: error.retryable,
        retryAfterMs: error.retryAfterMs
      }
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      appError = {
        type: ErrorType.NETWORK,
        message: error.message,
        userMessage: 'Unable to connect to our servers. Please check your internet connection and try again.',
        timestamp: new Date(),
        retryable: true,
        retryAfterMs: 3000
      }
    } else if (error instanceof Error && error.name === 'AbortError') {
      appError = {
        type: ErrorType.TIMEOUT,
        message: 'Request timed out',
        userMessage: 'The request took too long to complete. Please try again.',
        timestamp: new Date(),
        retryable: true,
        retryAfterMs: 5000
      }
    } else if (error instanceof Error && error.message.includes('429')) {
      appError = {
        type: ErrorType.RATE_LIMIT,
        message: 'Rate limit exceeded',
        userMessage: 'Too many requests. Please wait a moment before trying again.',
        timestamp: new Date(),
        retryable: true,
        retryAfterMs: 30000
      }
    } else if (error instanceof Error && error.message.includes('payment')) {
      appError = {
        type: ErrorType.PAYMENT,
        message: error.message,
        userMessage: 'There was an issue processing your payment. Please check your payment information and try again.',
        timestamp: new Date(),
        retryable: true,
        retryAfterMs: 0
      }
    } else if (context === 'story-generation') {
      appError = {
        type: ErrorType.STORY_GENERATION,
        message: error instanceof Error ? error.message : 'Unknown story generation error',
        userMessage: 'We\'re having trouble creating your story right now. Please try again in a few minutes.',
        timestamp: new Date(),
        retryable: true,
        retryAfterMs: 10000
      }
    } else if (context === 'pdf-generation') {
      appError = {
        type: ErrorType.PDF_GENERATION,
        message: error instanceof Error ? error.message : 'Unknown PDF generation error',
        userMessage: 'We\'re having trouble creating your PDF. Please try again.',
        timestamp: new Date(),
        retryable: true,
        retryAfterMs: 5000
      }
    } else if (context === 'email-delivery') {
      appError = {
        type: ErrorType.EMAIL_DELIVERY,
        message: error instanceof Error ? error.message : 'Unknown email delivery error',
        userMessage: 'We\'re having trouble sending your story. Please contact support if this continues.',
        timestamp: new Date(),
        retryable: true,
        retryAfterMs: 15000
      }
    } else {
      appError = {
        type: ErrorType.UNKNOWN,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        userMessage: 'Something unexpected happened. Please try again or contact support if the problem continues.',
        timestamp: new Date(),
        retryable: true,
        retryAfterMs: 5000
      }
    }

    return appError
  }

  /**
   * Log errors for debugging and monitoring
   */
  private async logError(error: AppError, context?: string) {
    // Add to in-memory log
    this.errorLog.push(error)
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('QuizBook Error:', {
        type: error.type,
        message: error.message,
        context,
        timestamp: error.timestamp,
        details: error.details
      })
    }

    // Log to database for monitoring
    try {
      await databaseService.logEvent('error_occurred', undefined, {
        error_type: error.type,
        error_message: error.message,
        context,
        user_message: error.userMessage,
        retryable: error.retryable,
        code: error.code,
        details: error.details
      })
    } catch (dbError) {
      // Don't throw if logging fails
      console.error('Failed to log error to database:', dbError)
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errorLog.slice(-limit)
  }

  /**
   * Clear error log
   */
  clearErrors(): void {
    this.errorLog = []
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number
      baseDelayMs?: number
      maxDelayMs?: number
      backoffMultiplier?: number
      retryCondition?: (error: unknown) => boolean
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelayMs = 1000,
      maxDelayMs = 10000,
      backoffMultiplier = 2,
      retryCondition = () => true
    } = options

    let lastError: unknown
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        // Don't retry if this is the last attempt
        if (attempt === maxAttempts) {
          break
        }

        // Don't retry if condition fails
        if (!retryCondition(error)) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelayMs * Math.pow(backoffMultiplier, attempt - 1),
          maxDelayMs
        )

        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }
}

/**
 * Timeout handler for API calls
 */
export class TimeoutHandler {
  static async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string = 'Operation timed out'
  ): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const error = new Error(timeoutMessage)
        error.name = 'AbortError'
        reject(error)
      }, timeoutMs)
    })

    return Promise.race([operation, timeout])
  }
}

/**
 * Circuit breaker pattern for failing services
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private maxFailures: number = 5,
    private timeoutMs: number = 60000,
    private retryTimeoutMs: number = 30000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.retryTimeoutMs) {
        this.state = 'HALF_OPEN'
      } else {
        throw new QuizBookError({
          type: ErrorType.API,
          message: 'Circuit breaker is open',
          userMessage: 'Service is temporarily unavailable. Please try again later.',
          retryable: true,
          retryAfterMs: this.retryTimeoutMs - (Date.now() - this.lastFailureTime)
        })
      }
    }

    try {
      const result = await TimeoutHandler.withTimeout(operation(), this.timeoutMs)
      
      // Success - reset failures
      this.failures = 0
      this.state = 'CLOSED'
      
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()

      if (this.failures >= this.maxFailures) {
        this.state = 'OPEN'
      }

      throw error
    }
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state
  }

  reset(): void {
    this.failures = 0
    this.lastFailureTime = 0
    this.state = 'CLOSED'
  }
}

/**
 * Pre-configured error handlers for common operations
 */
export const errorHandlers = {
  // Story generation with retries and circuit breaker
  storyGeneration: new CircuitBreaker(3, 30000, 60000),
  
  // Payment processing with immediate retry
  paymentProcessing: new CircuitBreaker(2, 10000, 30000),
  
  // PDF generation with quick retry
  pdfGeneration: new CircuitBreaker(3, 15000, 30000),
  
  // Email delivery with longer timeout
  emailDelivery: new CircuitBreaker(3, 20000, 60000)
}

/**
 * Utility functions for common error scenarios
 */
export const errorUtils = {
  /**
   * Check if error is retryable
   */
  isRetryable(error: unknown): boolean {
    if (error instanceof QuizBookError) {
      return error.retryable
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      return true
    }
    
    return false
  },

  /**
   * Get retry delay from error
   */
  getRetryDelay(error: unknown): number | undefined {
    if (error instanceof QuizBookError) {
      return error.retryAfterMs
    }
    
    return undefined
  },

  /**
   * Create user-friendly error message
   */
  getUserMessage(error: unknown): string {
    if (error instanceof QuizBookError) {
      return error.userMessage
    }
    
    const errorHandler = ErrorHandler.getInstance()
    const appError = errorHandler.handleError(error)
    return appError.userMessage
  },

  /**
   * Safe error logging that won't throw
   */
  safeLog(error: unknown, context?: string): void {
    try {
      const errorHandler = ErrorHandler.getInstance()
      errorHandler.handleError(error, context)
    } catch (logError) {
      console.error('Failed to log error safely:', logError)
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()