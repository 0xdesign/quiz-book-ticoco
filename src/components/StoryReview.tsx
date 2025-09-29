'use client'

import React from 'react'
import { QuizData } from './QuizForm'

export interface StoryPage {
  text: string
  imageBase64?: string
}

interface StoryReviewProps {
  storyText: string
  pages?: StoryPage[]
  quizData: QuizData
  onEdit: () => void
  onRegenerate: () => void
  onContinue: () => void
  onCancel?: () => void
}

export default function StoryReview({ storyText, pages, quizData, onEdit, onRegenerate, onContinue, onCancel }: StoryReviewProps) {
  const paragraphs = pages && pages.length
    ? pages.map(p => p.text)
    : storyText.split('\n\n').filter(p => p.trim())
  const coverTitle = `${quizData.childName}'s ${quizData.storyType.replace('-', ' ')}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Cover */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-3xl shadow-2xl p-12 mb-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="text-6xl mb-6">📖</div>
            <h1 className="text-4xl font-bold mb-3">{coverTitle}</h1>
            <p className="text-lg opacity-95">Starring {quizData.childName}, age {quizData.childAge}</p>
          </div>
        </div>

        {/* Pages */}
        {paragraphs.map((p, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-xl p-8 mb-8 grid md:grid-cols-2 gap-8 items-start hover:shadow-2xl transition-shadow duration-300">
            {pages && pages[i]?.imageBase64 ? (
              <img
                src={`data:image/png;base64,${pages[i]!.imageBase64}`}
                alt={`Story page ${i + 1}`}
                className="w-full rounded-xl object-cover aspect-square shadow-md"
              />
            ) : (
              <div className="w-full rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 aspect-square flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                <span className="text-sm">Image {i + 1}</span>
              </div>
            )}
            <div className="text-gray-800 leading-relaxed text-base whitespace-pre-wrap">{p}</div>
          </div>
        ))}

        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Want to Adjust Anything?</h2>
          <p className="text-gray-700 text-base mb-6 leading-relaxed">You're in control! Tweak details or generate a fresh adventure.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={onEdit} className="flex-1 py-4 px-6 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">
              Edit Details
            </button>
            <button onClick={onRegenerate} className="flex-1 py-4 px-6 border-2 border-blue-500 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 hover:border-blue-600 transition-all duration-200">
              Try Another Story
            </button>
            <button onClick={onCancel} className="flex-1 py-4 px-6 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">
              Cancel
            </button>
          </div>
        </div>

        <div className="text-center bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <button
            onClick={onContinue}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-xl px-12 py-5 rounded-2xl shadow-2xl hover:from-blue-600 hover:to-purple-600 hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
          >
            I Love It — Continue to Checkout
          </button>
          <p className="text-base text-gray-600 mt-4 font-medium">Just $19.99 • Delivered instantly • Secure payment</p>
        </div>
      </div>
    </div>
  )
}
