'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import StoryReview, { type StoryPage } from '@/components/StoryReview'
import type { QuizData } from '@/components/QuizForm'
import { GradientBackground } from '@/components/ui/noisy-gradient-backgrounds'

export default function GeneratePage() {
  const router = useRouter()
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [storyText, setStoryText] = useState('')
  const [pages, setPages] = useState<StoryPage[] | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // Load quiz data from session and kick off generation
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('quizData')
      if (!raw) {
        router.push('/quiz')
        return
      }
      const data = JSON.parse(raw) as QuizData
      setQuizData(data)
    } catch {
      router.push('/quiz')
    }
  }, [router])

  const generate = useCallback(async (data: QuizData) => {
    setLoading(true)
    setError(null)
    setStoryText('')
    setPages(undefined)
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to generate story')
      }

      const result = await response.json()
      setStoryText(result.storyText as string)
      setPages(result.pages as StoryPage[] | undefined)
    } catch (e: any) {
      setError(e?.message || 'Story generation failed')
    } finally {
      setLoading(false)
    }
  }, [])

  // Trigger generation once quizData is ready
  useEffect(() => {
    if (quizData) {
      generate(quizData)
    }
  }, [quizData, generate])

  const handleEdit = () => router.push('/quiz')

  const handleRegenerate = () => {
    if (quizData) generate(quizData)
  }

  const handleContinue = async () => {
    if (!quizData || !storyText) return
    setCreating(true)
    try {
      const response = await fetch('/api/create-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizData, storyText })
      })

      const json = await response.json()
      if (!response.ok || json?.error) {
        throw new Error(json?.error || 'Failed to create story record')
      }

      const { bookId } = json as { bookId: string }
      if (!bookId) throw new Error('Missing bookId from server')
      router.push(`/checkout/${bookId}`)
    } catch (e: any) {
      setError(e?.message || 'Failed to continue to checkout')
    } finally {
      setCreating(false)
    }
  }

  if (!quizData) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#0A0A0A]">
        <GradientBackground
          gradientOrigin="bottom-middle"
          noiseIntensity={0.15}
          noisePatternSize={90}
          noisePatternRefreshInterval={2}
        />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="bg-[#1F2023] border border-[#444444] rounded-[24px] p-8 text-center max-w-md w-full">
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-6"></div>
            <p className="text-[18px] leading-7 font-medium text-white">Preparing your story...</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#0A0A0A]">
        <GradientBackground
          gradientOrigin="bottom-middle"
          noiseIntensity={0.15}
          noisePatternSize={90}
          noisePatternRefreshInterval={2}
        />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="bg-[#1F2023] border border-[#444444] rounded-[24px] p-8 text-center max-w-md w-full">
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-6"></div>
            <h2 className="text-[24px] leading-7 font-bold text-white mb-3">
              Creating {quizData.childName}'s personalized adventure…
            </h2>
            <p className="text-[14px] leading-5 text-[#99A1AF]">This can take ~10–20 seconds</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#0A0A0A]">
        <GradientBackground
          gradientOrigin="bottom-middle"
          noiseIntensity={0.15}
          noisePatternSize={90}
          noisePatternRefreshInterval={2}
        />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="bg-[#1F2023] border border-[#444444] rounded-[24px] p-8 text-center max-w-md w-full">
            <div className="text-5xl mb-6">❌</div>
            <h2 className="text-[24px] leading-7 font-bold text-white mb-3">
              We couldn't create the story
            </h2>
            <p className="text-[14px] leading-5 text-[#99A1AF] mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRegenerate}
                className="w-full h-[56px] rounded-full bg-white text-[#1E2939] font-semibold transition-colors duration-200 hover:bg-white/90"
              >
                Try Again
              </button>
              <button
                onClick={handleEdit}
                className="w-full h-[56px] rounded-full border-2 border-[#D1D5DC] text-white font-semibold transition-colors duration-200 hover:bg-white/10"
              >
                Edit Details
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full h-[56px] rounded-full border-2 border-[#444444] text-[#99A1AF] font-semibold transition-colors duration-200 hover:bg-white/10"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <StoryReview
      storyText={storyText}
      pages={pages}
      quizData={quizData}
      onEdit={handleEdit}
      onRegenerate={handleRegenerate}
      onContinue={handleContinue}
      onCancel={() => router.push('/quiz')}
    />
  )
}
