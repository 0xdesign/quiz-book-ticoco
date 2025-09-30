'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { GradientBackground } from '@/components/ui/noisy-gradient-backgrounds'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const examplePrompts = [
    '🚀 Space adventure to mars',
    '🌳 Magical forest exploration',
    '🐳 Underwater treasure hunt'
  ]

  const handleSubmit = () => {
    if (!prompt.trim() || loading) return

    // Store the prompt in sessionStorage
    sessionStorage.setItem('storyPrompt', prompt)

    // Navigate to next step (quiz or story details)
    router.push('/quiz')
  }

  const handleExampleClick = async (example: string) => {
    if (loading) return

    setLoading(true)

    try {
      // Call OpenAI to generate a 280 character story description
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: example })
      })

      if (!response.ok) throw new Error('Failed to generate prompt')

      const data = await response.json()
      setPrompt(data.description)
    } catch (error) {
      console.error('Error generating prompt:', error)
      // Fallback to a default description
      setPrompt(`Create an exciting ${example.replace(/[^\w\s]/gi, '')} story with magical elements and brave characters.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#0A0A0A]">
      {/* Animated Gradient Background */}
      <GradientBackground
        gradientOrigin="bottom-middle"
        noiseIntensity={0.15}
        noisePatternSize={90}
        noisePatternRefreshInterval={2}
      />

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-[72px]">
        {/* Header */}
        <div className="max-w-[768px] w-full pb-8 space-y-3">
          <h1 className="font-bold text-5xl leading-[48px] white text-center">
            A story for every child
          </h1>
          <p className="font-normal text-base leading-6 text-white/80 text-center">
            Fill your child's imagination with a magical story made just for them.
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-6 items-center w-full max-w-[681px]">
          {/* Text Area Card */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="w-full bg-[#1f2023] border border-[#444444] rounded-[24px] p-6 space-y-3"
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                // Submit on Enter (but allow Shift+Enter for new line)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="Example: Create a magical adventure story for my 5-year-old daughter Emma who loves unicorns and being brave. She has curly brown hair and loves solving puzzles..."
              className="w-full h-12 bg-transparent text-base leading-6 text-white placeholder:text-[#99a1af] resize-none outline-none"
              disabled={loading}
            />

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!prompt.trim() || loading}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 hover:scale-110 hover:shadow-lg active:scale-95 active:shadow-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1f2023] transition-all duration-200 ease-out shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-6 h-6 text-black" />
                )}
              </button>
            </div>
          </form>

          {/* Example Prompts */}
          <div className="flex flex-wrap gap-2 items-center justify-center w-full max-w-[768px]">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                disabled={loading}
                className="backdrop-blur-sm bg-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.3)] rounded-xl px-3 py-3 text-sm leading-5 text-black hover:bg-[rgba(255,255,255,0.3)] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
