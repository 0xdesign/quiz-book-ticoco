/**
 * Simple, privacy-focused analytics system for Quiz Book
 * Tracks completion rates, performance metrics, and user flow
 */

import { databaseService } from './services'

export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp?: Date
  sessionId?: string
  userAgent?: string
}

export interface QuizMetrics {
  stepCompletionRates: Record<number, number>
  averageCompletionTime: number
  dropoffPoints: Record<number, number>
  mostPopularTraits: Record<string, number>
  mostPopularThemes: Record<string, number>
  storyTypePreferences: Record<string, number>
}

export interface PerformanceMetrics {
  storyGenerationTime: number[]
  pdfGenerationTime: number[]
  paymentProcessingTime: number[]
  emailDeliveryTime: number[]
  apiResponseTimes: Record<string, number[]>
}

class AnalyticsService {
  private sessionId: string
  private startTime: number
  private events: AnalyticsEvent[] = []
  private isEnabled: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
    this.isEnabled = process.env.ENABLE_ANALYTICS === 'true' || process.env.NODE_ENV === 'production'
  }

  /**
   * Track an analytics event
   */
  async track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionDuration: Date.now() - this.startTime,
        url: typeof window !== 'undefined' ? window.location.pathname : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined
      },
      timestamp: new Date(),
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    }

    // Store locally for batch sending
    this.events.push(analyticsEvent)

    // Send to database (don't await to avoid blocking)
    this.sendEvent(analyticsEvent).catch(error => {
      console.warn('Failed to send analytics event:', error)
    })
  }

  /**
   * Track quiz flow events
   */
  async trackQuizStep(step: number, stepName: string, data?: Record<string, any>) {
    await this.track('quiz_step_completed', {
      step,
      stepName,
      ...data
    })
  }

  async trackQuizDropoff(step: number, reason?: string) {
    await this.track('quiz_dropoff', {
      step,
      reason,
      completionPercentage: (step / 5) * 100
    })
  }

  async trackQuizCompletion(data: {
    completionTime: number
    childAge: string
    traits: string[]
    themes: string[]
    storyType: string
  }) {
    await this.track('quiz_completed', {
      ...data,
      totalSteps: 5
    })
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(metric: string, duration: number, metadata?: Record<string, any>) {
    await this.track('performance_metric', {
      metric,
      duration,
      ...metadata
    })
  }

  async trackStoryGeneration(duration: number, success: boolean, errorType?: string) {
    await this.track('story_generation', { 
      duration, 
      success, 
      errorType 
    })
  }

  async trackPDFGeneration(duration: number, success: boolean, fileSize?: number) {
    await this.track('pdf_generation', { 
      duration, 
      success, 
      fileSize 
    })
  }

  async trackPaymentFlow(step: 'initiated' | 'completed' | 'failed', amount?: number, errorType?: string) {
    await this.track('payment_flow', { 
      step, 
      amount, 
      errorType 
    })
  }

  async trackEmailDelivery(success: boolean, duration?: number, errorType?: string) {
    await this.track('email_delivery', { 
      success, 
      duration, 
      errorType 
    })
  }

  /**
   * Track user experience metrics
   */
  async trackError(error: Error, context?: string) {
    await this.track('error_occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      context
    })
  }

  async trackUserAction(action: string, target?: string, metadata?: Record<string, any>) {
    await this.track('user_action', {
      action,
      target,
      ...metadata
    })
  }

  /**
   * Track conversion funnel
   */
  async trackFunnelStep(step: 'landing' | 'quiz_start' | 'quiz_complete' | 'payment_start' | 'payment_complete' | 'download') {
    await this.track('funnel_step', { step })
  }

  /**
   * Send event to backend
   */
  private async sendEvent(event: AnalyticsEvent) {
    try {
      await databaseService.logEvent('analytics_event', undefined, {
        event_name: event.event,
        properties: event.properties,
        session_id: event.sessionId,
        user_agent: event.userAgent,
        timestamp: event.timestamp
      })
    } catch (error) {
      // Silently fail analytics to avoid affecting user experience
      console.warn('Analytics event failed to send:', error)
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.startTime,
      eventsTracked: this.events.length
    }
  }

  /**
   * Clear session data
   */
  clearSession() {
    this.events = []
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
  }
}

/**
 * React hooks for analytics
 */
export function useAnalytics() {
  const track = (event: string, properties?: Record<string, any>) => {
    analytics.track(event, properties)
  }

  const trackQuizStep = (step: number, stepName: string, data?: Record<string, any>) => {
    analytics.trackQuizStep(step, stepName, data)
  }

  const trackUserAction = (action: string, target?: string, metadata?: Record<string, any>) => {
    analytics.trackUserAction(action, target, metadata)
  }

  const trackError = (error: Error, context?: string) => {
    analytics.trackError(error, context)
  }

  return {
    track,
    trackQuizStep,
    trackUserAction,
    trackError
  }
}

/**
 * Performance tracking utilities
 */
export class PerformanceTracker {
  private startTimes: Map<string, number> = new Map()

  start(operation: string): void {
    this.startTimes.set(operation, performance.now())
  }

  end(operation: string, metadata?: Record<string, any>): number {
    const startTime = this.startTimes.get(operation)
    if (!startTime) {
      console.warn(`No start time found for operation: ${operation}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.startTimes.delete(operation)

    // Track performance metric
    analytics.trackPerformance(operation, duration, metadata)

    return duration
  }

  wrap<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.start(operation)
      
      try {
        const result = await fn()
        this.end(operation, { ...metadata, success: true })
        resolve(result)
      } catch (error) {
        this.end(operation, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        reject(error)
      }
    })
  }
}

/**
 * A/B Testing utilities
 */
export class ABTestManager {
  private tests: Map<string, string> = new Map()

  getVariant(testName: string, variants: string[], userId?: string): string {
    // Use consistent hashing based on session ID or user ID
    const id = userId || analytics.getSessionInfo().sessionId
    const hash = this.hashString(id + testName)
    const variantIndex = hash % variants.length
    const variant = variants[variantIndex]
    
    this.tests.set(testName, variant)
    
    // Track A/B test assignment
    analytics.track('ab_test_assignment', {
      testName,
      variant,
      variants
    })
    
    return variant
  }

  trackConversion(testName: string, conversionType: string = 'default') {
    const variant = this.tests.get(testName)
    if (variant) {
      analytics.track('ab_test_conversion', {
        testName,
        variant,
        conversionType
      })
    }
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

/**
 * Privacy-compliant data collection
 */
export const privacySettings = {
  // Only collect essential metrics by default
  collectUserActions: true,
  collectPerformanceMetrics: true,
  collectErrorReports: true,
  collectDetailedDeviceInfo: false,
  
  // Data retention policy
  retentionDays: 90,
  
  // Anonymize sensitive data
  anonymizeIPs: true,
  hashUserIdentifiers: true
}

// Global instances
export const analytics = new AnalyticsService()
export const performanceTracker = new PerformanceTracker()
export const abTestManager = new ABTestManager()

// Auto-track page views and session start
if (typeof window !== 'undefined') {
  // Track initial page load
  analytics.track('page_view', {
    page: window.location.pathname,
    referrer: document.referrer
  })

  // Track session duration on page unload
  window.addEventListener('beforeunload', () => {
    analytics.track('session_end', {
      sessionDuration: Date.now() - analytics.getSessionInfo().sessionDuration
    })
  })

  // Track performance metrics
  window.addEventListener('load', () => {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    analytics.trackPerformance('page_load', navigationTiming.loadEventEnd - navigationTiming.fetchStart, {
      domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    })
  })
}

export default analytics