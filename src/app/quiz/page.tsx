'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import QuizForm, { QuizData } from '@/components/QuizForm'

export default function QuizPage() {
  const [storyPrompt, setStoryPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Retrieve the stored prompt
    const prompt = sessionStorage.getItem('storyPrompt')
    if (!prompt) {
      // If no prompt, redirect back to home
      router.push('/')
      return
    }
    setStoryPrompt(prompt)
  }, [router])

  const handleComplete = async (data: QuizData) => {
    // Store complete quiz data
    sessionStorage.setItem('quizData', JSON.stringify(data))

    // Redirect to story generation
    router.push(`/generate`)
  }

  if (!storyPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <QuizForm
      initialData={{ storyDescription: storyPrompt }}
      onComplete={handleComplete}
      onLoading={setLoading}
      startAtStep={2}
    />
  )
}