'use client'

import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export interface QuizData {
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
}

export default function QuizForm({ onComplete, onLoading }: QuizFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<Partial<QuizData>>({
    childTraits: [],
    favoriteThings: []
  })

  const totalSteps = 5
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
        return !!(data.childName?.trim() && data.childAge)
      case 2:
        return (data.childTraits?.length || 0) > 0
      case 3:
        return (data.favoriteThings?.length || 0) > 0
      case 4:
        return !!data.storyType
      case 5:
        return !!(data.parentEmail?.trim() && data.parentConsent)
      default:
        return false
    }
  }

  const updateData = (updates: Partial<QuizData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {currentStep === 1 && (
            <Step1 data={data} updateData={updateData} />
          )}
          {currentStep === 2 && (
            <Step2 data={data} updateData={updateData} />
          )}
          {currentStep === 3 && (
            <Step3 data={data} updateData={updateData} />
          )}
          {currentStep === 4 && (
            <Step4 data={data} updateData={updateData} />
          )}
          {currentStep === 5 && (
            <Step5 data={data} updateData={updateData} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!isCurrentStepValid()}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {currentStep === totalSteps ? 'Create Story' : 'Next'}
            {currentStep < totalSteps && <ChevronRightIcon className="w-5 h-5" />}
          </button>
        </div>
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
          Tell us about your child! 👶
        </h2>
        <p className="text-gray-600">
          We'll use this to create their personalized adventure
        </p>
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-700 mb-3">
          What's your child's first name? *
        </label>
        <input
          type="text"
          value={data.childName || ''}
          onChange={(e) => updateData({ childName: e.target.value })}
          className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition-colors"
          placeholder="Enter first name"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-lg font-medium text-gray-700 mb-3">
          How old are they? *
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {traits.map(trait => (
          <button
            key={trait}
            onClick={() => toggleTrait(trait)}
            className={`p-4 rounded-xl border-2 font-medium transition-colors ${
              data.childTraits?.includes(trait)
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {trait}
          </button>
        ))}
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          What does {data.childName || 'your child'} love? 💝
        </h2>
        <p className="text-gray-600">
          Choose their favorite things to include in the story
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {favorites.map(favorite => (
          <button
            key={favorite}
            onClick={() => toggleFavorite(favorite)}
            className={`p-4 rounded-xl border-2 font-medium transition-colors ${
              data.favoriteThings?.includes(favorite)
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {favorite}
          </button>
        ))}
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
            className={`w-full p-6 rounded-xl border-2 text-left transition-colors ${
              data.storyType === type.value
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold text-lg text-gray-800 mb-2">
              {type.title}
            </div>
            <div className="text-gray-600">
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
            <span className="font-medium text-gray-800">COPPA Compliance:</span> I confirm that I am the parent or legal guardian of {data.childName || 'this child'} and I consent to the creation of a personalized story. I understand this story will be delivered via email for $19.99.
          </label>
        </div>
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-gray-800 mb-2">$19.99</div>
        <div className="text-gray-600">One-time payment • Instant delivery</div>
      </div>
    </div>
  )
}

interface StepProps {
  data: Partial<QuizData>
  updateData: (updates: Partial<QuizData>) => void
}