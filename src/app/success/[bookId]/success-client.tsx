'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function SuccessClient() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Animation */}
        <div className="mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-2xl">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Payment Successful! 🎉
          </h1>
          <p className="text-2xl text-gray-700 font-medium">
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

        {/* Sibling Upsell */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-8 shadow-xl mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Have more than one child? 👨‍👩‍👧‍👦</h3>
          <p className="text-gray-700 text-base mb-6 leading-relaxed">Give each of your kids their own personalized adventure!</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg px-8 py-4 rounded-xl hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 mb-5"
          >
            Create Another Story - $19.99
          </button>
          <ul className="text-base text-gray-700 space-y-3 text-left">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold text-lg">✓</span>
              <span>Reduces sibling rivalry</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold text-lg">✓</span>
              <span>Each child feels equally special</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold text-lg">✓</span>
              <span>Perfect for different ages/interests</span>
            </li>
          </ul>
        </div>

        {/* Referral Incentive */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold mb-3">Know another parent who'd love this? 💙</h3>
          <p className="text-lg mb-6 leading-relaxed opacity-95">Share Ticoco with others who might enjoy creating their own personalized story!</p>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Ticoco - Personalized Children\'s Stories',
                  text: `I just created an amazing personalized story for ${book?.quiz_data?.childName} with Ticoco! You should try it too!`,
                  url: window.location.origin
                })
              } else {
                // Fallback to copying URL
                navigator.clipboard.writeText(window.location.origin)
                alert('Link copied to clipboard!')
              }
            }}
            className="bg-white text-blue-600 font-bold text-lg px-8 py-3 rounded-xl hover:bg-gray-100 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Share Ticoco
          </button>
        </div>
      </div>
    </div>
  )
}
