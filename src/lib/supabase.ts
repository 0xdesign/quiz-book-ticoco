import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key'

// Only throw error if not in demo mode
if (process.env.NODE_ENV === 'production' && 
    process.env.NEXT_PUBLIC_DEMO_MODE !== 'true' &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  throw new Error('Missing Supabase environment variables in production')
}

// Server-side client with service role key
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Types for our database
export interface Book {
  id: string
  quiz_data: QuizData
  story_text?: string
  pdf_url?: string
  email?: string
  payment_status: 'pending' | 'completed' | 'failed'
  stripe_payment_id?: string
  created_at: string
  updated_at: string
}

export interface Download {
  token: string
  book_id: string
  expires_at: string
  downloads_count: number
  created_at: string
}

export interface Event {
  id: number
  event_type: string
  book_id?: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface QuizData {
  // Section 1: Child Information
  childName: string
  childPhoto?: string
  childAge: string
  childTraits: string[]
  
  // Section 2: Family & Characters
  characters: Array<{
    name: string
    relationship: string
    photo?: string
    appearance?: CharacterAppearance
  }>
  
  // Section 4: Favorite Themes/Settings  
  themes: string[]
  
  // Section 5: Preferred Story Type
  storyType: string
  
  // Section 6: Main Character Form
  characterForm: string
  
  // Section 7: Message to Deliver
  message: string
  
  // Section 8: Optional Details
  bonusDetails: string[]
}

export interface CharacterAppearance {
  gender?: string
  age?: string
  skinColor?: string
  eyeColor?: string
  hairColor?: string
  clothingStyle?: string
  distinctFeatures?: string
  other?: string
}