'use client'

import { useState } from 'react'
import QuizForm, { QuizData } from '@/components/QuizForm'
import { useRouter } from 'next/navigation'
import StoryReview from '@/components/StoryReview'
import { FAQ } from '@/components/FAQ'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [pendingQuiz, setPendingQuiz] = useState<QuizData | null>(null)
  const [storyText, setStoryText] = useState<string>('')
  const [pages, setPages] = useState<Array<{ text: string; imageBase64?: string }>>([])
  const [progress, setProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')
  const router = useRouter()

  const generateStory = async (quizData: QuizData) => {
    let timerId: ReturnType<typeof setInterval> | null = null
    let messageTimer: ReturnType<typeof setInterval> | null = null

    const messages = [
      `Creating ${quizData.childName}'s magical adventure...`,
      `Weaving in ${quizData.childName}'s favorite things...`,
      `Bringing ${quizData.childName}'s personality to life...`,
      `Almost ready! Adding final touches...`
    ]

    try {
      setLoading(true)
      setProgress(10)
      setLoadingMessage(messages[0])

      let messageIndex = 0
      messageTimer = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length
        setLoadingMessage(messages[messageIndex])
      }, 10000) // Change message every 10 seconds

      timerId = setInterval(() => setProgress(p => Math.min(p + 5, 90)), 400)
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      })

      if (!response.ok) {
        let message = 'Failed to generate story'
        try {
          const err = await response.json()
          if (err?.error) message = err.error
        } catch {}
        throw new Error(message)
      }

      const { storyText, pages } = await response.json()
      setPendingQuiz(quizData)
      setStoryText(storyText)
      setPages(pages || [])
      setShowReview(true)
      setShowQuiz(false)
    } catch (error) {
      console.error('Error generating story:', error)
      alert(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setProgress(100)
      setTimeout(() => setLoading(false), 300)
      if (timerId) clearInterval(timerId)
      if (messageTimer) clearInterval(messageTimer)
    }
  }

  const handleQuizComplete = async (quizData: QuizData) => {
    await generateStory(quizData)
  }

  const handleRegenerate = async () => {
    if (!pendingQuiz) return
    await generateStory(pendingQuiz)
  }

  const handleContinue = async () => {
    if (!pendingQuiz) return
    try {
      setLoading(true)
      const response = await fetch('/api/create-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizData: pendingQuiz, storyText })
      })
      if (!response.ok) throw new Error('Failed to prepare checkout')
      const { bookId } = await response.json()
      router.push(`/checkout/${bookId}`)
    } catch (err) {
      console.error(err)
      alert('Could not continue. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  let content: React.ReactNode
  if (showReview && pendingQuiz) {
    content = (
      <StoryReview
        storyText={storyText}
        pages={pages}
        quizData={pendingQuiz}
        onEdit={() => { setShowQuiz(true); setShowReview(false) }}
        onRegenerate={handleRegenerate}
        onContinue={handleContinue}
        onCancel={() => { setShowReview(false); setPendingQuiz(null); setPages([]); setStoryText('') }}
      />
    )
  } else if (showQuiz) {
    content = (
      <QuizForm
        onComplete={handleQuizComplete}
        onLoading={setLoading}
        initialData={pendingQuiz || undefined}
      />
    )
  } else {
    content = (
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
              Turn Your Child Into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500">
                the Hero of Their Own Adventure
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-3">
              In just 5 minutes, create a one-of-a-kind story featuring your child's name, personality, and favorite things. Ready to read instantly.
            </p>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              No templates. No waiting. Just a story as special as they are.
            </p>
          </div>

          {/* Problem-Solution Section */}
          <div className="max-w-2xl mx-auto text-center mb-16 px-4">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              Does your child light up when they hear their name in a story?
            </h3>
            <p className="text-lg text-gray-600 mb-4">
              Every parent wants their child to feel special, confident, and loved. But finding a truly personalized book means waiting weeks for a pre-written template with just their name swapped in.
            </p>
            <p className="text-lg text-gray-700 font-medium">
              What if you could give them a completely unique adventure—written just for them—in the time it takes to finish your coffee?
            </p>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mb-4">
                <div className="text-4xl">⚡</div>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-3">Instant Magic</h3>
              <p className="text-gray-600 text-base leading-relaxed">Start reading together in minutes, not weeks. No shipping, no waiting.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center mb-4">
                <div className="text-4xl">🎨</div>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-3">Truly One-of-a-Kind</h3>
              <p className="text-gray-600 text-base leading-relaxed">AI-powered storytelling means every word is written for your child—not from a template.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mb-4">
                <div className="text-4xl">🛡️</div>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-3">Review Before You Buy</h3>
              <p className="text-gray-600 text-base leading-relaxed">See the complete story first. Love it or regenerate it. You're in control.</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mb-12">
            <button
              onClick={() => setShowQuiz(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-xl px-12 py-5 rounded-2xl shadow-2xl hover:from-blue-600 hover:to-purple-600 hover:shadow-3xl transform hover:scale-105 transition-all duration-300 ease-out"
            >
              Create My Child's Story
            </button>
            <p className="text-gray-600 text-base mt-4 font-medium">✓ 5-minute quiz  ✓ Preview your story  ✓ No payment until you love it</p>
          </div>

          {/* Social Proof */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
              Join 10,000+ Parents Who've Made Their Child the Hero
            </h3>
            <p className="text-sm text-gray-500 mb-6 text-center">Here's what families are saying:</p>
            <div className="space-y-6 text-left">
              <div className="bg-gradient-to-br from-blue-50 to-blue-25 rounded-xl p-6 border border-blue-100 shadow-sm">
                <div className="flex justify-center mb-3">
                  <span className="text-yellow-500 text-lg">⭐⭐⭐⭐⭐</span>
                </div>
                <p className="text-gray-800 text-base leading-relaxed mb-4">
                  "Emma was so excited to see her name throughout the whole story! She asks me to read it every night. This is already her favorite book—and we've only had it for three days!"
                </p>
                <p className="text-sm text-gray-600 font-medium">- Sarah M., mom of 5-year-old Emma</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-25 rounded-xl p-6 border border-purple-100 shadow-sm">
                <div className="flex justify-center mb-3">
                  <span className="text-yellow-500 text-lg">⭐⭐⭐⭐⭐</span>
                </div>
                <p className="text-gray-800 text-base leading-relaxed mb-4">
                  "I was skeptical about the price, but after seeing how the story perfectly captured Alex's love of dinosaurs AND his brave personality, it's worth every penny. He's asked me to read it 7 times already!"
                </p>
                <p className="text-sm text-gray-600 font-medium">- Mike D., dad of 6-year-old Alex</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-25 rounded-xl p-6 border border-green-100 shadow-sm">
                <div className="flex justify-center mb-3">
                  <span className="text-yellow-500 text-lg">⭐⭐⭐⭐⭐</span>
                </div>
                <p className="text-gray-800 text-base leading-relaxed mb-4">
                  "We've tried other personalized books, but they all felt the same with just the name changed. This was completely different—a real story written specifically for Lily. Amazing!"
                </p>
                <p className="text-sm text-gray-600 font-medium">- Jessica T., mom of 4-year-old Lily</p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 mb-16 px-4">
            <FAQ />
          </div>

          {/* Final CTA */}
          <div className="mt-16 mb-12 text-center">
            <button
              onClick={() => setShowQuiz(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-xl px-12 py-5 rounded-2xl shadow-2xl hover:from-blue-600 hover:to-purple-600 hover:shadow-3xl transform hover:scale-105 transition-all duration-300 ease-out"
            >
              Create My Child's Story
            </button>
            <p className="text-gray-600 text-base mt-4 font-medium">✓ 5-minute quiz  ✓ Preview your story  ✓ No payment until you love it</p>
          </div>

          {/* Trust Signals */}
          <div className="mt-16 max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="text-2xl">🔒</div>
                </div>
                <h4 className="font-bold text-gray-900 text-base mb-1">Secure Payment</h4>
                <p className="text-sm text-gray-600">Powered by Stripe</p>
              </div>
              <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="text-2xl">🛡️</div>
                </div>
                <h4 className="font-bold text-gray-900 text-base mb-1">COPPA Compliant</h4>
                <p className="text-sm text-gray-600">Privacy protected</p>
              </div>
              <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="text-2xl">⚡</div>
                </div>
                <h4 className="font-bold text-gray-900 text-base mb-1">Instant Delivery</h4>
                <p className="text-sm text-gray-600">No shipping wait</p>
              </div>
              <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="text-2xl">💯</div>
                </div>
                <h4 className="font-bold text-gray-900 text-base mb-1">Satisfaction</h4>
                <p className="text-sm text-gray-600">Love it or regenerate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  }

  return (
    <>
      {content}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 text-center w-full max-w-md">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-gray-800 font-semibold mb-4">{loadingMessage || 'Generating story...'}</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-gray-500">This can take up to a minute. We're creating something special!</p>
          </div>
        </div>
      )}
    </>
  )
}
