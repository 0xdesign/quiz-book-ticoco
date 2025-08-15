import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build'
const stripe = new Stripe(stripeKey)

export { stripe }

// Fixed price for all stories
export const STORY_PRICE = 1999 // $19.99 in cents