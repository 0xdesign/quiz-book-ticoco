'use client'

import React from 'react'
import { QuizData } from './QuizForm'
import { GradientBackground } from '@/components/ui/noisy-gradient-backgrounds'
import CurvedLoop from '@/components/ui/curved-loop'

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#0A0A0A]">
      <GradientBackground
        gradientOrigin="bottom-middle"
        noiseIntensity={0.15}
        noisePatternSize={90}
        noisePatternRefreshInterval={2}
      />
      <div className="relative z-10 min-h-screen py-12 px-4">
        {/* Curved Loop Title */}
        <div className="mb-24">
          <CurvedLoop
            marqueeText={coverTitle}
            speed={2}
            curveAmount={400}
            direction="left"
            interactive={true}
          />
          <p className="text-[18px] leading-7 text-[#99A1AF] text-center mt-6">
            Starring {quizData.childName}, age {quizData.childAge?.replace(' years', '')}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">

        {/* Pages */}
        {paragraphs.map((p, i) => (
          <div key={i} className="bg-[#1F2023] border border-[#444444] rounded-[24px] p-8 mb-8 grid md:grid-cols-2 gap-8 items-start hover:border-white/30 transition-colors duration-300">
            {pages && pages[i]?.imageBase64 ? (
              <img
                src={`data:image/png;base64,${pages[i]!.imageBase64}`}
                alt={`Story page ${i + 1}`}
                className="w-full rounded-xl object-cover aspect-square"
              />
            ) : (
              <div className="w-full rounded-xl bg-[#0A0A0A] border-2 border-dashed border-[#444444] aspect-square flex items-center justify-center">
                <span className="text-[14px] text-[#99A1AF]">Image {i + 1}</span>
              </div>
            )}
            <div className="text-white leading-relaxed text-[16px] whitespace-pre-wrap">{p}</div>
          </div>
        ))}

        <div className="bg-[#1F2023] border border-[#444444] rounded-[24px] p-8 mb-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="text-[24px] leading-7 font-bold text-white">Want to Adjust Anything?</h2>
              <p className="text-[14px] leading-5 text-[#99A1AF]">You're in control! Tweak details or generate a fresh adventure.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onEdit}
                className="flex-1 h-[56px] rounded-full border-2 border-[#D1D5DC] text-white font-semibold hover:bg-white/10 transition-colors duration-200"
              >
                Edit Details
              </button>
              <button
                onClick={onRegenerate}
                className="flex-1 h-[56px] rounded-full border-2 border-white text-white font-semibold hover:bg-white/10 transition-colors duration-200"
              >
                Try Another Story
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 h-[56px] rounded-full border-2 border-[#444444] text-[#99A1AF] font-semibold hover:bg-white/10 transition-colors duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="text-center bg-[#1F2023] border border-[#444444] rounded-[24px] p-8">
          <div className="flex flex-col gap-6">
            <button
              onClick={onContinue}
              className="w-full sm:w-auto h-[56px] bg-white text-[#1E2939] font-bold text-[18px] px-12 rounded-full hover:bg-white/90 transition-colors duration-200"
            >
              I Love It — Continue to Checkout
            </button>
            <p className="text-[14px] leading-5 text-[#99A1AF]">Just $19.99 • Delivered instantly • Secure payment</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
