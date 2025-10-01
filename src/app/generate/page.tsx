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

  // Progress tracking for SSE
  const [loadingStage, setLoadingStage] = useState<string>('story')
  const [loadingMessage, setLoadingMessage] = useState<string>('Getting started...')
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [totalSteps, setTotalSteps] = useState<number>(5)
  const [imageProgress, setImageProgress] = useState<{ current: number; total: number } | null>(null)

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
    setLoadingStage('story')
    setLoadingMessage('Getting started...')
    setCurrentStep(1)
    setTotalSteps(5)
    setImageProgress(null)

    // Try SSE endpoint first
    try {
      const response = await fetch('/api/generate-story-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('SSE endpoint not available')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'progress') {
              setLoadingStage(data.stage)
              setLoadingMessage(data.message)
              setCurrentStep(data.step || 1)
              setTotalSteps(data.totalSteps || 5)
              setImageProgress(data.progress || null)
            } else if (data.type === 'complete') {
              setStoryText(data.data.storyText)
              setPages(data.data.pages)
              setLoading(false)
            } else if (data.type === 'error') {
              throw new Error(data.error)
            }
          }
        }
      }
    } catch (e: any) {
      // Fallback to non-streaming endpoint
      console.warn('SSE failed, falling back to standard endpoint:', e?.message)
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
        setLoading(false)
      } catch (e2: any) {
        setError(e2?.message || 'Story generation failed')
        setLoading(false)
      }
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
              {loadingMessage}
            </h2>
            <p className="text-[14px] leading-5 text-[#99A1AF] mb-4">
              Step {currentStep} of {totalSteps}
            </p>
            {imageProgress && (
              <>
                <div className="w-full bg-[#444444] rounded-full h-2 mb-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(imageProgress.current / imageProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-[12px] text-[#99A1AF]">
                  {imageProgress.current} of {imageProgress.total} illustrations
                </p>
              </>
            )}
            {!imageProgress && (
              <p className="text-[12px] text-[#99A1AF]">This may take 30-45 seconds</p>
            )}
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
