import Stripe from 'stripe'

// Create stripe instance; require key to be present
let stripe: Stripe | null = null

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
}

export { stripe }

// Fixed price for all stories
export const STORY_PRICE = 1999 // $19.99 in cents
