'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function CheckoutPage() {
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
  const [storyReady, setStoryReady] = useState(false)
  
  const params = useParams()
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  
  const bookId = params.bookId as string

  useEffect(() => {
    fetchBook()
    // Check story generation status every 5 seconds
    const interval = setInterval(checkStoryStatus, 5000)
    return () => clearInterval(interval)
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

  const checkStoryStatus = async () => {
    try {
      const response = await fetch(`/api/books/${bookId}`)
      if (response.ok) {
        const bookData = await response.json()
        if (bookData.story_text && !storyReady) {
          setStoryReady(true)
          setBook(bookData)
        }
      }
    } catch (error) {
      console.error('Error checking story status:', error)
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
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret)

      if (confirmError) {
        setError(confirmError.message || 'Payment confirmation failed')
        setProcessing(false)
        return
      }

      // Payment successful
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Story Status */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-4 h-4 rounded-full ${storyReady ? 'bg-green-500' : 'bg-yellow-500'}`}>
              {!storyReady && <div className="w-4 h-4 animate-pulse bg-yellow-500 rounded-full"></div>}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                {storyReady ? '✅ Story Ready!' : '⏳ Creating Story...'}
              </h3>
              <p className="text-sm text-gray-600">
                {storyReady 
                  ? `${book?.quiz_data?.childName}'s personalized adventure is complete`
                  : `We're crafting ${book?.quiz_data?.childName}'s magical story`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Personalized Story for:</span>
              <span className="font-medium">{book?.quiz_data?.childName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Age:</span>
              <span className="font-medium">{book?.quiz_data?.childAge}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Story Type:</span>
              <span className="font-medium text-sm">
                {book?.quiz_data?.storyType || 'Magical Adventure'}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-blue-600">$19.99</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Payment Information</h2>
          
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
                        '::placeholder': {
                          color: '#aab7c4',
                        },
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
              disabled={!stripe || processing || !storyReady}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Processing Payment...
                </div>
              ) : !storyReady ? (
                'Waiting for Story to Complete...'
              ) : (
                'Complete Purchase - $19.99'
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Secure payment powered by Stripe • Your story will be emailed instantly
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}