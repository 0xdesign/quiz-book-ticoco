'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function SuccessPage() {
  const [book, setBook] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  
  const bookId = params.bookId as string

  useEffect(() => {
    fetchBook()
  }, [bookId])

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/books/${bookId}`)
      if (response.ok) {
        const bookData = await response.json()
        setBook(bookData)
      }
    } catch (error) {
      console.error('Error fetching book:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            {book?.quiz_data?.childName}'s personalized story is on its way!
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">What happens next?</h2>
          
          <div className="space-y-6 text-left">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Check your email</h3>
                <p className="text-gray-600">
                  We've sent your personalized story to <span className="font-medium">{book?.email}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Download your PDF</h3>
                <p className="text-gray-600">
                  Click the download link in the email to get your story PDF
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Enjoy reading together!</h3>
                <p className="text-gray-600">
                  Watch {book?.quiz_data?.childName}'s face light up as they hear their own adventure
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Story Details */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Your Story Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Starring:</span>
              <span className="ml-2 font-medium">{book?.quiz_data?.childName}</span>
            </div>
            <div>
              <span className="text-gray-600">Age:</span>
              <span className="ml-2 font-medium">{book?.quiz_data?.childAge}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Story Type:</span>
              <span className="ml-2 font-medium">{book?.quiz_data?.storyType}</span>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-2">Love the story?</h3>
          <p className="mb-4">Share the magic with friends and family!</p>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Ticoco - Personalized Children\'s Stories',
                  text: `I just created an amazing personalized story for ${book?.quiz_data?.childName} with Ticoco!`,
                  url: window.location.origin
                })
              } else {
                // Fallback for browsers without native sharing
                navigator.clipboard.writeText(window.location.origin)
                alert('Link copied to clipboard!')
              }
            }}
            className="bg-white text-blue-600 font-medium px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Share Ticoco
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Questions? Reply to the email we sent you or visit our{' '}
            <a href="#" className="text-blue-500 hover:underline">support page</a>
          </p>
        </div>
      </div>
    </div>
  )
}