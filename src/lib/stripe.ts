import Stripe from 'stripe'

// Create stripe instance only if API key is available
let stripe: Stripe | null = null

if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'demo_key') {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
}

export { stripe }

// Fixed price for all stories
export const STORY_PRICE = 1999 // $19.99 in cents