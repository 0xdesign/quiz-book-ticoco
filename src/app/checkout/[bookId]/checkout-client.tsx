'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { TrustBadges } from '@/components/ui/TrustBadges'
import { ExitIntentModal } from '@/components/ExitIntentModal'
// Demo mode removed; always use real Stripe flow

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo')

export default function CheckoutClient() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  )
}

function CheckoutForm() {
  const [book, setBook] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storyReady, setStoryReady] = useState(true)
  
  const params = useParams()
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  
  const bookId = params.bookId as string

  useEffect(() => {
    fetchBook()
  }, [bookId])

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/books/${bookId}`)
      if (!response.ok) {
        throw new Error('Book not found')
      }
      const bookData = await response.json()
      setBook(bookData)
      setStoryReady(!!bookData.story_text)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching book:', error)
      setError('Story not found')
      setLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements || processing) return

    setProcessing(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    // Create payment method
    const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    })

    if (methodError) {
      setError(methodError.message || 'Payment method creation failed')
      setProcessing(false)
      return
    }

    // Create payment intent
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId,
          paymentMethodId: paymentMethod.id
        }),
      })

      const { clientSecret, error: serverError } = await response.json()

      if (serverError) {
        setError(serverError)
        setProcessing(false)
        return
      }

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement
        }
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment confirmation failed')
        setProcessing(false)
        return
      }

      // Redirect to success page after confirmation
      router.push(`/success/${bookId}`)
    } catch (error) {
      console.error('Payment error:', error)
      setError('Payment processing failed')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-700">Loading your story details...</p>
        </div>
      </div>
    )
  }

  if (error && !book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ExitIntentModal bookId={bookId} childName={book?.quiz_data?.childName} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
        {/* Story Summary */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-8 mb-8 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-xl text-gray-900">Story Ready!</h3>
          </div>
          <p className="text-base text-gray-700 leading-relaxed">{book?.quiz_data?.childName}'s personalized story looks amazing. Complete your purchase to receive the PDF via email.</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-700 font-medium">Personalized Story for:</span>
              <span className="font-bold text-gray-900">{book?.quiz_data?.childName}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-700 font-medium">Age:</span>
              <span className="font-bold text-gray-900">{book?.quiz_data?.childAge}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-700 font-medium">Story Type:</span>
              <span className="font-bold text-gray-900 text-sm">
                {book?.quiz_data?.storyType || 'Magical Adventure'}
              </span>
            </div>
            <div className="border-t-2 border-gray-200 pt-4 flex justify-between items-center text-2xl font-bold">
              <span className="text-gray-900">Total:</span>
              <span className="text-blue-600">$19.99</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Secure Payment 🔒</h2>
          <p className="text-base text-gray-700 mb-6 leading-relaxed">
            All payments are encrypted and processed securely by Stripe. We never store your card details.
          </p>
          <div className="mb-8">
            <TrustBadges context="checkout" />
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Information
              </label>
              <div className="border border-gray-300 rounded-lg p-4">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 w-4 h-4"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I confirm that I am the parent/guardian of {book?.quiz_data?.childName} and 
                  I consent to this purchase. The personalized story will be delivered to{' '}
                  <span className="font-medium">{book?.email}</span> immediately after payment.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!stripe || processing}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-xl py-5 rounded-xl shadow-2xl hover:from-blue-600 hover:to-purple-600 hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {processing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-6 h-6 border-4 border-white border-t-transparent rounded-full"></div>
                  Processing Payment...
                </div>
              ) : !storyReady ? (
                'Waiting for Story to Complete...'
              ) : (
                'Get My Story Now - $19.99'
              )}
            </button>

            <p className="text-sm text-gray-600 text-center mt-4 font-medium">
              ✅ Instant delivery  💯 Secure payment by Stripe  🔒 Your data is protected
            </p>
          </form>
        </div>
      </div>
    </div>
    </div>
  )
}
