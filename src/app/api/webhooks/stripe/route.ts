import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { sendStoryEmail } from '@/lib/email'
import { generatePDF } from '@/lib/pdf'
import { headers } from 'next/headers'
import crypto from 'crypto'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      console.error('Stripe is not configured')
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }
    
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
      const metadataBookId = paymentIntent.metadata?.book_id as string | undefined

      // Update the book by matching stripe_payment_id first (set earlier)
      let bookUpdate = await supabase
        .from('books')
        .update({ payment_status: 'completed' })
        .eq('stripe_payment_id', paymentIntent.id)
        .select()
        .single()

      // If no match, fall back to metadata book_id
      if ((bookUpdate.error || !bookUpdate.data) && metadataBookId) {
        bookUpdate = await supabase
          .from('books')
          .update({ payment_status: 'completed', stripe_payment_id: paymentIntent.id })
          .eq('id', metadataBookId)
          .select()
          .single()
      }

      const book = bookUpdate.data
      const updateError = bookUpdate.error

      if (updateError) {
        console.error('Error updating book payment status:', updateError)
        return NextResponse.json(
          { error: 'Database update failed' },
          { status: 500 }
        )
      }

      // Ensure PDF is generated now that payment is completed
      try {
        if (!book.story_text) {
          throw new Error('Missing story_text for PDF generation')
        }
        const pdfPath = await generatePDF(book.story_text, book.quiz_data.childName)
        await supabase
          .from('books')
          .update({ pdf_url: pdfPath })
          .eq('id', book.id)
      } catch (pdfError) {
        console.error('PDF generation in webhook failed:', pdfError)
        return NextResponse.json(
          { error: 'PDF generation failed' },
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
          book_id: book.id,
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
            book_id: book.id,
            metadata: {
              child_name: book.quiz_data.childName,
              parent_email: book.email,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency
            }
          })

        console.log(`Payment completed and email sent for book ${book.id}`)
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
