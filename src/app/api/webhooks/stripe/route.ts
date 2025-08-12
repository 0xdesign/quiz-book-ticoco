import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { sendStoryEmail } from '@/lib/email'
import { headers } from 'next/headers'
import crypto from 'crypto'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: unknown) {
      console.error('Webhook signature verification failed:', err instanceof Error ? err.message : 'Unknown error')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle payment success
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any
      const bookId = paymentIntent.metadata?.book_id

      if (!bookId) {
        console.error('No book_id in payment intent metadata')
        return NextResponse.json({ received: true })
      }

      // Update book payment status
      const { data: book, error: updateError } = await supabase
        .from('books')
        .update({ payment_status: 'completed' })
        .eq('stripe_payment_id', paymentIntent.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating book payment status:', updateError)
        return NextResponse.json(
          { error: 'Database update failed' },
          { status: 500 }
        )
      }

      // Create download token
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      const { error: tokenError } = await supabase
        .from('downloads')
        .insert({
          token,
          book_id: bookId,
          expires_at: expiresAt.toISOString()
        })

      if (tokenError) {
        console.error('Error creating download token:', tokenError)
        return NextResponse.json(
          { error: 'Token creation failed' },
          { status: 500 }
        )
      }

      // Send email with download link
      try {
        await sendStoryEmail({
          to: book.email,
          childName: book.quiz_data.childName,
          downloadToken: token
        })

        // Track purchase completion event
        await supabase
          .from('events')
          .insert({
            event_type: 'purchase_completed',
            book_id: bookId,
            metadata: {
              child_name: book.quiz_data.childName,
              parent_email: book.email,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency
            }
          })

        console.log(`Payment completed and email sent for book ${bookId}`)
      } catch (emailError) {
        console.error('Error sending email:', emailError)
        // Don't fail the webhook, but log the error
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}