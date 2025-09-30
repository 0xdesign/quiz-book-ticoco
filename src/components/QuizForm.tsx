'use client'

import { useState } from 'react'
import { GradientBackground } from '@/components/ui/noisy-gradient-backgrounds'
import { Component as Counter } from '@/components/ui/counter'

export interface QuizData {
  // New: Required free-form description to guide the story
  storyDescription: string
  childName: string
  childAge: string
  childTraits: string[]
  favoriteThings: string[]
  storyType: string
  parentEmail: string
  parentConsent: boolean
}

interface QuizFormProps {
  onComplete: (data: QuizData) => void
  onLoading?: (loading: boolean) => void
  initialData?: Partial<QuizData>
  startAtStep?: number
}

export default function QuizForm({ onComplete, onLoading, initialData, startAtStep = 1 }: QuizFormProps) {
  const [currentStep, setCurrentStep] = useState(startAtStep)
  const [data, setData] = useState<Partial<QuizData>>({
    storyDescription: '',
    childAge: '5 years',
    childTraits: [],
    favoriteThings: [],
    ...(initialData || {})
  })

  const totalSteps = 6
  const progress = (currentStep / totalSteps) * 100

  const handleNext = () => {
    // Persist data to sessionStorage before moving to next step
    sessionStorage.setItem('quizData', JSON.stringify(data))

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!isCurrentStepValid()) return
    
    const completeData: QuizData = {
      storyDescription: data.storyDescription || '',
      childName: data.childName || '',
      childAge: data.childAge || '',
      childTraits: data.childTraits || [],
      favoriteThings: data.favoriteThings || [],
      storyType: data.storyType || '',
      parentEmail: data.parentEmail || '',
      parentConsent: data.parentConsent || false
    }

    onLoading?.(true)
    onComplete(completeData)
  }

  const isCurrentStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!data.storyDescription?.trim()
      case 2:
        // Only child's name is required; age is optional and defaults visually
        return !!data.childName?.trim()
      case 3:
        return (data.childTraits?.length || 0) > 0
      case 4:
        return (data.favoriteThings?.length || 0) > 0
      case 5:
        return !!data.storyType
      case 6:
        return !!(data.parentEmail?.trim() && data.parentConsent)
      default:
        return false
    }
  }

  const updateData = (updates: Partial<QuizData>) => {
    const newData = { ...data, ...updates }
    setData(newData)
    // Persist immediately on any data change
    sessionStorage.setItem('quizData', JSON.stringify(newData))
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
      <div className="relative z-10 min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="max-w-[672px] mx-auto flex flex-col gap-10">
        {/* Progressive Summaries (show all preceding steps) */}
        {(() => {
          const STORY_TYPE_LABELS: Record<string, string> = {
            'everyday-adventure': 'Everyday Adventure',
            'magical-journey': 'Magical Journey',
            'brave-hero': 'Brave Hero',
            'bedtime-story': 'Bedtime Story',
          }

          const items: { label: string; value: string; editStep: number }[] = []

          if (currentStep >= 2 && data.storyDescription?.trim()) {
            items.push({
              label: 'Story Prompt',
              value: data.storyDescription.trim(),
              editStep: 1,
            })
          }
          if (currentStep >= 3 && data.childName) {
            items.push({
              label: 'Name',
              value: data.childName,
              editStep: 2,
            })
          }
          if (currentStep >= 3 && data.childAge) {
            items.push({
              label: 'Age',
              value: data.childAge.replace(' years', ''),
              editStep: 2,
            })
          }
          if (currentStep >= 4 && (data.childTraits?.length || 0) > 0) {
            items.push({
              label: 'Personality',
              value: (data.childTraits || []).join(', '),
              editStep: 3,
            })
          }
          if (currentStep >= 5 && (data.favoriteThings?.length || 0) > 0) {
            items.push({
              label: 'Theme',
              value: (data.favoriteThings || []).join(', '),
              editStep: 4,
            })
          }
          if (currentStep >= 6 && (data.storyType || '').length > 0) {
            items.push({
              label: 'Story Type',
              value: STORY_TYPE_LABELS[data.storyType as string] || (data.storyType as string),
              editStep: 5,
            })
          }

          if (items.length === 0) return null

          // Separate Story Prompt from other items
          const storyPromptItem = items.find(item => item.label === 'Story Prompt')
          const otherItems = items.filter(item => item.label !== 'Story Prompt')

          return (
            <div className="flex flex-col gap-[12px]">
              {/* Story Prompt - Full Width */}
              {storyPromptItem && (
                <button
                  onClick={() => setCurrentStep(storyPromptItem.editStep)}
                  className="backdrop-blur-sm bg-white/20 border border-white/30 rounded-full w-full px-[12px] py-[8px] hover:bg-white/30 transition-colors cursor-pointer"
                >
                  <div className="flex gap-[12px] items-center">
                    <span className="text-[14px] font-sans font-semibold leading-[18px] text-[#1f2023]/50 shrink-0">
                      {storyPromptItem.label}
                    </span>
                    <p className="text-[14px] font-sans font-semibold leading-[18px] text-[#1c1c1e] flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
                      {storyPromptItem.value}
                    </p>
                  </div>
                </button>
              )}

              {/* Other Items - Wrapped */}
              {otherItems.length > 0 && (
                <div className="flex flex-wrap gap-[12px]">
                  {otherItems.map((item, idx) => (
                    <button
                      key={`${item.label}-${idx}`}
                      onClick={() => setCurrentStep(item.editStep)}
                      className="backdrop-blur-sm bg-white/20 border border-white/30 rounded-full px-[12px] py-[8px] hover:bg-white/30 transition-colors cursor-pointer"
                    >
                      <div className="flex gap-[4px] items-center whitespace-nowrap">
                        <span className="text-[14px] font-sans font-semibold leading-[18px] text-[#1f2023]/50">
                          {item.label}
                        </span>
                        <span className="text-[14px] font-sans font-semibold leading-[18px] text-[#1c1c1e]">
                          {item.value}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* Question Content */}
        <div className="bg-[#1F2023] border border-[#444444] rounded-[24px] p-6 w-full">
          {currentStep === 1 && (
            <StepDescription data={data} updateData={updateData} />
          )}
          {currentStep === 2 && (
            <Step1 data={data} updateData={updateData} />
          )}
          {currentStep === 3 && (
            <Step2 data={data} updateData={updateData} />
          )}
          {currentStep === 4 && (
            <Step3 data={data} updateData={updateData} />
          )}
          {currentStep === 5 && (
            <Step4 data={data} updateData={updateData} />
          )}
          {currentStep === 6 && (
            <Step5 data={data} updateData={updateData} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 items-center justify-center w-full">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center w-[330px] h-[56px] rounded-full border-2 border-white text-white font-semibold transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!isCurrentStepValid()}
            className="flex items-center justify-center w-[330px] h-[56px] rounded-full bg-white text-[#1E2939] font-semibold border border-transparent transition-colors duration-200 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === totalSteps ? 'Create Story' : 'Next'}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

// Step 1: Free-form Story Description
function StepDescription({ data, updateData }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-[24px] leading-7 font-bold text-white text-center">
          Describe the story you want
        </h2>
        <p className="text-[14px] leading-5 text-[#99A1AF] text-center">
          Share a few sentences about the world, vibe, or key moments you'd love to see. We'll guide you through a few quick selections next.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[18px] font-medium leading-7 text-white">
          Story description *
        </label>
        <textarea
          value={data.storyDescription || ''}
          onChange={(e) => updateData({ storyDescription: e.target.value })}
          className="w-full p-[18px] bg-[#0A0A0A] border-2 border-[#444444] rounded-xl text-[18px] text-white placeholder:text-[#99A1AF] focus:border-blue-500 focus:outline-none transition-colors min-h-[160px]"
          placeholder="Example: A cozy bedtime tale where Lina visits a moonlit forest, befriends a shy firefly, and learns that kindness makes you glow inside."
          maxLength={1500}
        />
        <p className="text-[14px] leading-5 text-[#99A1AF]">
          Required. This guides the AI while still tailoring to your selections.
        </p>
      </div>
    </div>
  )
}

// Step 1: Child Information
function Step1({ data, updateData }: StepProps) {
  // Parse age from string like "5 years" to number
  const getCurrentAge = (): number => {
    if (!data.childAge) return 5;
    const match = data.childAge.match(/\d+/);
    return match ? parseInt(match[0]) : 5;
  };

  const handleAgeChange = (value: number) => {
    updateData({ childAge: `${value} years` });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="text-[18px] font-medium leading-7 text-white">
          What's your child's first name?
        </label>
        <input
          type="text"
          value={data.childName || ''}
          onChange={(e) => updateData({ childName: e.target.value })}
          className="w-full p-[18px] bg-[#0A0A0A] border-2 border-[#444444] rounded-xl text-[18px] text-white placeholder:text-[#99A1AF] focus:border-blue-500 focus:outline-none transition-colors"
          placeholder="Enter first name"
          autoComplete="given-name"
          autoCapitalize="words"
          autoFocus
        />
        <p className="text-[14px] leading-5 text-[#99A1AF]">
          We'll use their name throughout the story—from the title to every page.
        </p>
      </div>

      <div className="flex flex-col h-[184px] justify-between">
        <label className="text-[18px] font-medium leading-7 text-white">
          How old are they?
        </label>
        <div className="flex justify-start">
          <Counter
            initialValue={getCurrentAge()}
            min={3}
            max={10}
            step={1}
            onChange={handleAgeChange}
            places={[10, 1]}
            fontSize={80}
            padding={5}
            fontWeight={900}
          />
        </div>
        <p className="text-[14px] leading-5 text-[#99A1AF]">
          Helps us write at the right reading level for your child.
        </p>
      </div>
    </div>
  )
}

// Step 2: Child's Personality
function Step2({ data, updateData }: StepProps) {
  const traits = [
    'Curious', 'Playful', 'Brave', 'Kind', 'Funny',
    'Creative', 'Energetic', 'Gentle', 'Smart', 'Adventurous',
    'Caring', 'Determined'
  ]

  const toggleTrait = (trait: string) => {
    const currentTraits = data.childTraits || []
    const newTraits = currentTraits.includes(trait)
      ? currentTraits.filter(t => t !== trait)
      : [...currentTraits, trait]
    updateData({ childTraits: newTraits })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-[24px] leading-7 font-bold text-white text-center">
          What's {data.childName || 'your child'} like?
        </h2>
        <p className="text-[14px] leading-5 text-[#99A1AF] text-center">
          Pick 2–3 that feel most true
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {traits.map(trait => {
            const isSelected = !!data.childTraits?.includes(trait)
            return (
              <button
                key={trait}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleTrait(trait)}
                className={`inline-flex items-center justify-center rounded-full border-2 px-4 py-3 text-[16px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSelected
                    ? 'bg-white text-[#1E2939] border-white'
                    : 'border-[#D1D5DC] text-white hover:bg-white/10'
                }`}
              >
                {trait}
              </button>
            )
          })}
        </div>
        <p className="text-[12px] leading-4 text-[#99A1AF] text-center">
          You can change these later — they personalize the tone of the story.
        </p>
      </div>
    </div>
  )
}

// Step 3: Favorite Things
function Step3({ data, updateData }: StepProps) {
  const favorites = [
    'Animals', 'Space', 'Dinosaurs', 'Princesses', 'Pirates',
    'Cars & Trucks', 'Sports', 'Music', 'Art', 'Nature',
    'Superheroes', 'Magic'
  ]

  const toggleFavorite = (favorite: string) => {
    const currentFavorites = data.favoriteThings || []
    const newFavorites = currentFavorites.includes(favorite)
      ? currentFavorites.filter(f => f !== favorite)
      : [...currentFavorites, favorite]
    updateData({ favoriteThings: newFavorites })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-[24px] leading-7 font-bold text-white text-center">
          What does {data.childName || 'your child'} love?
        </h2>
        <p className="text-[14px] leading-5 text-[#99A1AF] text-center">
          Pick a few favorites to weave into the story
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {favorites.map(favorite => {
            const isSelected = !!data.favoriteThings?.includes(favorite)
            return (
              <button
                key={favorite}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleFavorite(favorite)}
                className={`inline-flex items-center justify-center rounded-full border-2 px-4 py-3 text-[16px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSelected
                    ? 'bg-white text-[#1E2939] border-white'
                    : 'border-[#D1D5DC] text-white hover:bg-white/10'
                }`}
              >
                {favorite}
              </button>
            )
          })}
        </div>
        <p className="text-[12px] leading-4 text-[#99A1AF] text-center">
          You can adjust these later — they shape the scenes and details.
        </p>
      </div>
    </div>
  )
}

// Step 4: Story Type
function Step4({ data, updateData }: StepProps) {
  const storyTypes = [
    {
      value: 'everyday-adventure',
      title: 'Everyday Adventure',
      description: 'A fun story about daily life with a special twist'
    },
    {
      value: 'magical-journey',
      title: 'Magical Journey',
      description: 'An enchanting tale full of magic and wonder'
    },
    {
      value: 'brave-hero',
      title: 'Brave Hero',
      description: 'An exciting adventure where your child saves the day'
    },
    {
      value: 'bedtime-story',
      title: 'Bedtime Story',
      description: 'A gentle, soothing story perfect for sleepy time'
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-[24px] leading-7 font-bold text-white text-center">
          What kind of story should we create?
        </h2>
        <p className="text-[14px] leading-5 text-[#99A1AF] text-center">
          Choose the perfect adventure for {data.childName || 'your child'}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {storyTypes.map(type => {
          const isSelected = data.storyType === type.value
          return (
            <button
              key={type.value}
              onClick={() => updateData({ storyType: type.value })}
              className={`w-full p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-white text-[#1E2939] border-white'
                  : 'border-[#D1D5DC] text-white hover:bg-white/10'
              }`}
            >
              <div className={`font-bold text-[18px] leading-7 mb-2 ${isSelected ? 'text-[#1E2939]' : 'text-white'}`}>
                {type.title}
              </div>
              <div className={`text-[14px] leading-5 ${isSelected ? 'text-[#1E2939]' : 'text-[#99A1AF]'}`}>
                {type.description}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Step 5: Parent Information & Consent
function Step5({ data, updateData }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-[24px] leading-7 font-bold text-white text-center">
          Almost ready!
        </h2>
        <p className="text-[14px] leading-5 text-[#99A1AF] text-center">
          We'll email you the personalized story for {data.childName || 'your child'}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[18px] font-medium leading-7 text-white">
          Your email address *
        </label>
        <input
          type="email"
          value={data.parentEmail || ''}
          onChange={(e) => updateData({ parentEmail: e.target.value })}
          className="w-full p-[18px] bg-[#0A0A0A] border-2 border-[#444444] rounded-xl text-[18px] text-white placeholder:text-[#99A1AF] focus:border-blue-500 focus:outline-none transition-colors"
          placeholder="parent@email.com"
          autoComplete="email"
          inputMode="email"
        />
      </div>

      <div className="bg-white/10 border border-white/20 p-6 rounded-xl">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consent"
            checked={data.parentConsent || false}
            onChange={(e) => updateData({ parentConsent: e.target.checked })}
            className="mt-1 w-5 h-5 text-blue-500 bg-[#0A0A0A] border-2 border-[#444444] rounded focus:ring-blue-500"
          />
          <label htmlFor="consent" className="text-[14px] leading-5 text-white">
            I'm {data.childName || 'my child'}'s parent or guardian, and I'd like to create this personalized story for them.
          </label>
        </div>
        <p className="text-[12px] leading-4 text-[#99A1AF] mt-3 ml-8">
          (COPPA compliant - your child's privacy is protected)
        </p>
      </div>

      <div className="text-center">
        <p className="text-[14px] leading-5 text-[#99A1AF]">🔒 Secure & private — We'll only email you the story. No spam, ever.</p>
      </div>

      <div className="text-center">
        <p className="text-[14px] leading-5 text-[#99A1AF]">You can review the story before any purchase</p>
      </div>
    </div>
  )
}

interface StepProps {
  data: Partial<QuizData>
  updateData: (updates: Partial<QuizData>) => void
}
