import { NextRequest, NextResponse } from 'next/server'
import { STORY_PRICE } from '@/lib/stripe'
import { stripeService, databaseService } from '@/lib/services'

export async function POST(request: NextRequest) {
  try {
    const { bookId, paymentMethodId } = await request.json()

    if (!bookId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get book details
    const { data: book, error: bookError } = await databaseService.getBook(bookId)

    if (bookError || !book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    if (book.payment_status === 'completed') {
      return NextResponse.json(
        { error: 'Payment already completed' },
        { status: 400 }
      )
    }

    // Create payment intent with metadata so webhook can resolve book
    const paymentIntent = await stripeService.createPaymentIntent(
      STORY_PRICE,
      'usd',
      { book_id: bookId }
    )

    // Update book with payment intent ID
    await databaseService.updateBook(bookId, {
      stripe_payment_id: paymentIntent.id
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    })
  } catch (error: unknown) {
    console.error('Payment intent creation error:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment processing failed' },
      { status: 500 }
    )
  }
}
