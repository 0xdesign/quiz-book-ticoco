'use client'

import { useState } from 'react'
import QuizForm, { QuizData } from '@/components/QuizForm'
import { useRouter } from 'next/navigation'
import { createStoryClient } from '@/lib/client-services'
import { DEMO_MODE } from '@/lib/demo-config'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const router = useRouter()

  const handleQuizComplete = async (quizData: QuizData) => {
    try {
      setLoading(true)
      
      if (DEMO_MODE) {
        // Use client-side service for demo
        const { bookId } = await createStoryClient(quizData)
        
        // Add a small delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Redirect to payment page
        router.push(`/checkout/${bookId}`)
      } else {
        // Use API route for production
        const response = await fetch('/api/create-story', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quizData),
        })

        if (!response.ok) {
          throw new Error('Failed to create story')
        }

        const { bookId } = await response.json()
        
        // Redirect to payment page
        router.push(`/checkout/${bookId}`)
      }
    } catch (error) {
      console.error('Error creating story:', error)
      alert('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (showQuiz) {
    return (
      <QuizForm 
        onComplete={handleQuizComplete}
        onLoading={setLoading}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
              Ticoco
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 font-medium">
              Personalized Stories for Your Child
            </p>
          </div>

          {/* Main Value Prop */}
          <div className="mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-6 leading-tight">
              Create a magical story starring <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500">
                your child as the hero
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Answer 5 quick questions and we'll create a personalized children's book featuring your child's name, personality, and favorite things.
            </p>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold text-gray-800 mb-2">Ready in Minutes</h3>
              <p className="text-gray-600 text-sm">Complete our quick quiz and get your story instantly</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="font-semibold text-gray-800 mb-2">Completely Unique</h3>
              <p className="text-gray-600 text-sm">Every story is personalized with your child's details</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-3xl mb-3">💝</div>
              <h3 className="font-semibold text-gray-800 mb-2">They'll Love It</h3>
              <p className="text-gray-600 text-sm">Stories designed to make your child feel special</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mb-8">
            <button
              onClick={() => setShowQuiz(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200"
            >
              Create Your Child's Story - $19.99
            </button>
            <p className="text-gray-500 text-sm mt-3">
              5-minute quiz • Instant download • One-time payment
            </p>
          </div>

          {/* Sample Preview */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Here's what parents are saying:
            </h3>
            <div className="space-y-4 text-left">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-gray-700 italic">
                  "Emma was so excited to see her name throughout the whole story! She asks me to read it every night."
                </p>
                <p className="text-sm text-gray-500 mt-2">- Sarah M., mom of 5-year-old Emma</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-gray-700 italic">
                  "The story perfectly captured my son's love of dinosaurs and his brave personality. Worth every penny!"
                </p>
                <p className="text-sm text-gray-500 mt-2">- Mike D., dad of 6-year-old Alex</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-700">Creating your child's magical story...</p>
          </div>
        </div>
      )}
    </div>
  )
}
