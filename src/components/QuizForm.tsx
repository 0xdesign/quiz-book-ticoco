'use client'

import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

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
}

export default function QuizForm({ onComplete, onLoading, initialData }: QuizFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<Partial<QuizData>>({
    storyDescription: '',
    childTraits: [],
    favoriteThings: [],
    ...(initialData || {})
  })

  const totalSteps = 6
  const progress = (currentStep / totalSteps) * 100

  const handleNext = () => {
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
        return !!(data.childName?.trim() && data.childAge)
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
    setData(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-base font-semibold text-gray-800">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-base font-medium text-gray-600">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
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
        <div className="flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!isCurrentStepValid()}
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
          >
            {currentStep === totalSteps ? 'Create Story' : 'Next'}
            {currentStep < totalSteps && <ChevronRightIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// Step 1: Free-form Story Description
function StepDescription({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Describe the story you want
        </h2>
        <p className="text-gray-600">
          Share a few sentences about the world, vibe, or key moments you’d love to see. We’ll guide you through a few quick selections next.
        </p>
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-700 mb-3">
          Story description *
        </label>
        <textarea
          value={data.storyDescription || ''}
          onChange={(e) => updateData({ storyDescription: e.target.value })}
          className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition-colors min-h-[160px]"
          placeholder="Example: A cozy bedtime tale where Lina visits a moonlit forest, befriends a shy firefly, and learns that kindness makes you glow inside."
          maxLength={1500}
        />
        <p className="text-sm text-gray-500 mt-2">Required. This guides the AI while still tailoring to your selections.</p>
      </div>
    </div>
  )
}

// Step 1: Child Information
function Step1({ data, updateData }: StepProps) {
  const ages = [
    '3 years', '4 years', '5 years', '6 years', '7 years',
    '8 years', '9 years', '10 years'
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Let's start with the basics
        </h2>
        <p className="text-gray-600">
          We'll use this to create their personalized adventure
        </p>
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-700 mb-3">
          What's your child's first name?
        </label>
        <input
          type="text"
          value={data.childName || ''}
          onChange={(e) => updateData({ childName: e.target.value })}
          className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition-colors"
          placeholder="Enter first name"
          autoComplete="given-name"
          autoCapitalize="words"
          autoFocus
        />
        <p className="text-sm text-gray-500 mt-2">
          We'll use {data.childName || 'their'} name throughout the story—from the title to every page.
        </p>
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-700 mb-3">
          How old are they?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ages.map(age => (
            <button
              key={age}
              onClick={() => updateData({ childAge: age })}
              className={`p-3 rounded-xl border-2 font-medium transition-colors ${
                data.childAge === age
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {age}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Helps us write at the right reading level for {data.childName || 'your child'}.
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          What's {data.childName || 'your child'} like? ✨
        </h2>
        <p className="text-gray-600">
          Select a few words that describe their personality
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {traits.map(trait => (
          <button
            key={trait}
            onClick={() => toggleTrait(trait)}
            className={`p-5 rounded-xl border-2 font-semibold transition-all duration-200 ${
              data.childTraits?.includes(trait)
                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 shadow-md scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            {trait}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500 mt-3 text-center">
        <strong>Pro tip:</strong> Choose 2-3 traits {data.childName || 'they'}'re proud of—our AI will make them the hero who embodies these qualities!
      </p>
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          What does {data.childName || 'your child'} love? 💝
        </h2>
        <p className="text-gray-600">
          Choose their favorite things to include in the story
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {favorites.map(favorite => (
          <button
            key={favorite}
            onClick={() => toggleFavorite(favorite)}
            className={`p-5 rounded-xl border-2 font-semibold transition-all duration-200 ${
              data.favoriteThings?.includes(favorite)
                ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-md scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            {favorite}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500 mt-3 text-center">
        <strong>Example:</strong> If you pick "Dinosaurs" and "Space," {data.childName || 'your child'} might discover dinosaur fossils on a distant planet!
      </p>
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          What kind of story should we create? 📖
        </h2>
        <p className="text-gray-600">
          Choose the perfect adventure for {data.childName || 'your child'}
        </p>
      </div>

      <div className="space-y-4">
        {storyTypes.map(type => (
          <button
            key={type.value}
            onClick={() => updateData({ storyType: type.value })}
            className={`w-full p-6 rounded-xl border-2 text-left transition-all duration-200 ${
              data.storyType === type.value
                ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="font-bold text-xl text-gray-900 mb-2">
              {type.title}
            </div>
            <div className="text-gray-700 text-base leading-relaxed">
              {type.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Step 5: Parent Information & Consent
function Step5({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Almost ready! 🎉
        </h2>
        <p className="text-gray-600">
          We'll email you the personalized story for {data.childName || 'your child'}
        </p>
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-700 mb-3">
          Your email address *
        </label>
        <input
          type="email"
          value={data.parentEmail || ''}
          onChange={(e) => updateData({ parentEmail: e.target.value })}
          className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition-colors"
          placeholder="parent@email.com"
          autoComplete="email"
          inputMode="email"
        />
      </div>

      <div className="bg-blue-50 p-6 rounded-xl">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consent"
            checked={data.parentConsent || false}
            onChange={(e) => updateData({ parentConsent: e.target.checked })}
            className="mt-1 w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="consent" className="text-sm text-gray-700 leading-relaxed">
            I'm {data.childName || 'my child'}'s parent or guardian, and I'd like to create this personalized story for them.
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-3 ml-8">
          (COPPA compliant - your child's privacy is protected)
        </p>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">🔒 Secure & private — We'll only email you the story. No spam, ever.</p>
      </div>

      <div className="text-center mt-2">
        <div className="text-gray-600">You can review the story before any purchase</div>
      </div>
    </div>
  )
}

interface StepProps {
  data: Partial<QuizData>
  updateData: (updates: Partial<QuizData>) => void
}
