'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getBookClient, createCheckoutSessionClient } from '@/lib/client-services'
import { DEMO_MODE } from '@/lib/demo-config'

export default function DemoCheckoutPage() {
  const [book, setBook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = params.bookId as string
  const isDemoSuccess = searchParams.get('demo') === 'true'

  useEffect(() => {
    fetchBook()
  }, [bookId])

  const fetchBook = async () => {
    try {
      const bookData = await getBookClient(bookId)
      setBook(bookData)
      setLoading(false)
      
      // If coming from demo checkout, auto-redirect to success
      if (isDemoSuccess) {
        setTimeout(() => {
          router.push(`/success/${bookId}?demo=true`)
        }, 1000)
      }
    } catch (error) {
      console.error('Error fetching book:', error)
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (!book) return
    
    setProcessing(true)
    try {
      const { url } = await createCheckoutSessionClient(bookId, book.email)
      router.push(url)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Demo checkout failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your story details...</p>
        </div>
      </div>
    )
  }

  if (isDemoSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Demo Payment Successful!</h2>
          <p className="text-green-600">Redirecting to your story...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Complete Your Purchase</h1>
          
          {book && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Story Details</h3>
              <p className="text-sm text-gray-600">
                Personalized story for: <span className="font-medium">{book.quiz_data?.childName}</span>
              </p>
              <p className="text-sm text-gray-600">
                Age: {book.quiz_data?.childAge} years old
              </p>
            </div>
          )}
          
          <div className="mb-6">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <span className="font-medium">Personalized Children's Book</span>
              <span className="font-bold text-lg">$19.99</span>
            </div>
          </div>

          {DEMO_MODE && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Demo Mode:</strong> Click "Pay Now" to simulate a successful payment.
                No real charges will be made.
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Test card: 4242 4242 4242 4242
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (for delivery)
              </label>
              <input
                type="email"
                value={book?.email || ''}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
              />
            </div>

            {DEMO_MODE && (
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-2">Demo Payment Form</p>
                <div className="space-y-2">
                  <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleCheckout}
            disabled={processing}
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {processing ? 'Processing...' : 'Pay Now - $19.99'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Your story will be available for download immediately after payment
          </p>
        </div>
      </div>
    </div>
  )
}