/**
 * Comprehensive data validation for Quiz Book application
 * Includes quiz input validation, COPPA compliance, and security checks
 */

import { QuizData } from '@/components/QuizForm'

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Validates quiz form data comprehensively
 */
export function validateQuizData(data: Partial<QuizData>): ValidationResult {
  const errors: ValidationError[] = []

  // Validate required story description
  if (!data.storyDescription || !data.storyDescription.trim()) {
    errors.push({
      field: 'storyDescription',
      message: 'Please enter a brief description of the story you want',
      code: 'REQUIRED'
    })
  } else if (data.storyDescription.length > 1500) {
    errors.push({
      field: 'storyDescription',
      message: 'Description is too long (max 1500 characters)',
      code: 'MAX_LENGTH'
    })
  }

  // Validate child name
  if (!data.childName) {
    errors.push({
      field: 'childName',
      message: 'Child\'s name is required',
      code: 'REQUIRED'
    })
  } else if (data.childName.length < 2) {
    errors.push({
      field: 'childName',
      message: 'Child\'s name must be at least 2 characters long',
      code: 'MIN_LENGTH'
    })
  } else if (data.childName.length > 50) {
    errors.push({
      field: 'childName',
      message: 'Child\'s name must be less than 50 characters',
      code: 'MAX_LENGTH'
    })
  } else if (!isValidName(data.childName)) {
    errors.push({
      field: 'childName',
      message: 'Child\'s name contains invalid characters',
      code: 'INVALID_FORMAT'
    })
  }

  // Validate child age
  if (!data.childAge) {
    errors.push({
      field: 'childAge',
      message: 'Child\'s age is required',
      code: 'REQUIRED'
    })
  } else if (!isValidAge(data.childAge)) {
    errors.push({
      field: 'childAge',
      message: 'Please select a valid age',
      code: 'INVALID_VALUE'
    })
  }

  // Validate child traits
  if (!data.childTraits || data.childTraits.length === 0) {
    errors.push({
      field: 'childTraits',
      message: 'Please select at least one personality trait',
      code: 'REQUIRED'
    })
  } else if (data.childTraits.length > 3) {
    errors.push({
      field: 'childTraits',
      message: 'Please select no more than 3 personality traits',
      code: 'MAX_ITEMS'
    })
  } else if (!areValidTraits(data.childTraits)) {
    errors.push({
      field: 'childTraits',
      message: 'Invalid personality traits selected',
      code: 'INVALID_VALUE'
    })
  }

  // Validate favorite things
  if (!data.favoriteThings || data.favoriteThings.length === 0) {
    errors.push({
      field: 'favoriteThings',
      message: 'Please select at least one favorite thing',
      code: 'REQUIRED'
    })
  } else if (data.favoriteThings.length > 4) {
    errors.push({
      field: 'favoriteThings',
      message: 'Please select no more than 4 favorite things',
      code: 'MAX_ITEMS'
    })
  } else if (!areValidFavoriteThings(data.favoriteThings)) {
    errors.push({
      field: 'favoriteThings',
      message: 'Invalid favorite things selected',
      code: 'INVALID_VALUE'
    })
  }

  // Validate story type
  if (!data.storyType) {
    errors.push({
      field: 'storyType',
      message: 'Please select a story type',
      code: 'REQUIRED'
    })
  } else if (!isValidStoryType(data.storyType)) {
    errors.push({
      field: 'storyType',
      message: 'Invalid story type selected',
      code: 'INVALID_VALUE'
    })
  }

  // Validate parent email
  if (!data.parentEmail) {
    errors.push({
      field: 'parentEmail',
      message: 'Parent email is required',
      code: 'REQUIRED'
    })
  } else if (!isValidEmail(data.parentEmail)) {
    errors.push({
      field: 'parentEmail',
      message: 'Please enter a valid email address',
      code: 'INVALID_FORMAT'
    })
  } else if (data.parentEmail.length > 255) {
    errors.push({
      field: 'parentEmail',
      message: 'Email address is too long',
      code: 'MAX_LENGTH'
    })
  }

  // Validate COPPA consent
  if (!data.parentConsent) {
    errors.push({
      field: 'parentConsent',
      message: 'Parental consent is required for children under 13',
      code: 'COPPA_REQUIRED'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates individual fields for real-time feedback
 */
export function validateField(field: string, value: any, context?: Partial<QuizData>): ValidationResult {
  const errors: ValidationError[] = []

  switch (field) {
    case 'childName':
      if (value && !isValidName(value)) {
        errors.push({
          field: 'childName',
          message: 'Name contains invalid characters',
          code: 'INVALID_FORMAT'
        })
      }
      if (value && value.length > 50) {
        errors.push({
          field: 'childName',
          message: 'Name is too long (max 50 characters)',
          code: 'MAX_LENGTH'
        })
      }
      break

    case 'parentEmail':
      if (value && !isValidEmail(value)) {
        errors.push({
          field: 'parentEmail',
          message: 'Please enter a valid email address',
          code: 'INVALID_FORMAT'
        })
      }
      break

    case 'childTraits':
      if (value && value.length > 3) {
        errors.push({
          field: 'childTraits',
          message: 'Maximum 3 traits allowed',
          code: 'MAX_ITEMS'
        })
      }
      break

    case 'favoriteThings':
      if (value && value.length > 4) {
        errors.push({
          field: 'favoriteThings',
          message: 'Maximum 4 favorites allowed',
          code: 'MAX_ITEMS'
        })
      }
      break

    case 'storyDescription':
      if (typeof value === 'string' && value.length > 1500) {
        errors.push({
          field: 'storyDescription',
          message: 'Description is too long (max 1500 characters)',
          code: 'MAX_LENGTH'
        })
      }
      break
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * COPPA compliance validation
 */
export function validateCOPPACompliance(data: Partial<QuizData>): ValidationResult {
  const errors: ValidationError[] = []

  // All children using this service are assumed to be under 13
  // so parental consent is always required
  if (!data.parentConsent) {
    errors.push({
      field: 'parentConsent',
      message: 'This service is for children under 13. Parental consent is required by COPPA (Children\'s Online Privacy Protection Act).',
      code: 'COPPA_CONSENT_REQUIRED'
    })
  }

  if (!data.parentEmail) {
    errors.push({
      field: 'parentEmail',
      message: 'Parent or guardian email is required for COPPA compliance',
      code: 'COPPA_EMAIL_REQUIRED'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Security validation to prevent malicious input
 */
export function validateSecurity(data: Partial<QuizData>): ValidationResult {
  const errors: ValidationError[] = []

  // Check for potentially malicious content
  const textFields = ['childName', 'parentEmail', 'storyDescription']
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,  // Script tags
    /javascript:/gi,                  // JavaScript URLs
    /on\w+\s*=/gi,                   // Event handlers
    /expression\s*\(/gi,             // CSS expressions
    /vbscript:/gi,                   // VBScript URLs
    /data:\s*text\/html/gi           // Data URLs with HTML
  ]

  textFields.forEach(field => {
    const value = (data as any)[field]
    if (typeof value === 'string') {
      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(value)) {
          errors.push({
            field,
            message: 'Input contains potentially unsafe content',
            code: 'SECURITY_VIOLATION'
          })
        }
      })
    }
  })

  // Check for excessive length (potential DoS)
  const maxTotalLength = 2000
  const totalLength = Object.values(data)
    .filter(v => typeof v === 'string')
    .join('').length
  
  if (totalLength > maxTotalLength) {
    errors.push({
      field: 'general',
      message: 'Total input length exceeds security limits',
      code: 'EXCESSIVE_LENGTH'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Helper validation functions
 */
function isValidName(name: string): boolean {
  // Allow letters, spaces, hyphens, apostrophes, and common international characters
  const namePattern = /^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u2C60-\u2C7F\uA720-\uA7FF\s'-]+$/
  return namePattern.test(name.trim())
}

function isValidEmail(email: string): boolean {
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailPattern.test(email.trim().toLowerCase())
}

function isValidAge(age: string): boolean {
  if (!age) return false
  // Accept values like "5" or "5 years"
  const match = age.match(/\d{1,2}/)
  if (!match) return false
  const num = parseInt(match[0], 10)
  return num >= 3 && num <= 12
}

function areValidTraits(traits: string[]): boolean {
  const validTraits = [
    'Curious', 'Playful', 'Brave', 'Kind', 'Funny', 'Creative',
    'Energetic', 'Gentle', 'Smart', 'Adventurous', 'Caring', 'Determined',
    // Legacy/extended
    'Athletic', 'Helpful', 'Artistic', 'Musical'
  ]
  return traits.every(trait => validTraits.includes(trait))
}

function areValidFavoriteThings(things: string[]): boolean {
  const validThings = [
    'Animals', 'Space', 'Dinosaurs', 'Princesses', 'Pirates',
    'Cars & Trucks', 'Sports', 'Music', 'Art', 'Nature',
    'Superheroes', 'Magic',
    // Legacy/extended
    'Ocean', 'Forest', 'Cars', 'Books', 'Adventure', 'Family', 'Friends'
  ]
  return things.every(thing => validThings.includes(thing))
}

function isValidStoryType(type: string): boolean {
  const validTypes = [
    'everyday-adventure',
    'magical-journey', 
    'brave-hero',
    'bedtime-story'
  ]
  return validTypes.includes(type)
}

/**
 * Sanitize input to prevent XSS and other attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 255) // Limit length
}

/**
 * Sanitize entire quiz data object
 */
export function sanitizeQuizData(data: Partial<QuizData>): Partial<QuizData> {
  return {
    ...data,
    childName: data.childName ? sanitizeInput(data.childName) : undefined,
    parentEmail: data.parentEmail ? sanitizeInput(data.parentEmail.toLowerCase()) : undefined,
    childTraits: data.childTraits ? data.childTraits.map(trait => sanitizeInput(trait)) : undefined,
    favoriteThings: data.favoriteThings ? data.favoriteThings.map(thing => sanitizeInput(thing)) : undefined,
    storyType: data.storyType ? sanitizeInput(data.storyType) : undefined,
    storyDescription: data.storyDescription ? sanitizeLongText(data.storyDescription) : undefined
  }
}

export function sanitizeLongText(input: string): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .substring(0, 1500)
}
