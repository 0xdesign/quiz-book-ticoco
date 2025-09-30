'use client'

import StoryReview, { type StoryPage } from '@/components/StoryReview'
import type { QuizData } from '@/components/QuizForm'

export default function TestStoryPage() {
  const mockQuizData: QuizData = {
    storyDescription: 'A magical adventure where Luna discovers a secret garden',
    childName: 'Luna',
    childAge: '7 years',
    childTraits: ['Brave', 'Curious', 'Creative'],
    favoriteThings: ['Animals', 'Magic', 'Nature'],
    storyType: 'magical-journey',
    parentEmail: 'test@example.com',
    parentConsent: true
  }

  const mockStoryText = `Once upon a time, in a cozy little house at the edge of a great forest, there lived a brave and curious girl named Luna. She was seven years old and loved nothing more than exploring the mysterious woods behind her home.

One sunny morning, Luna noticed something peculiar - a golden butterfly with shimmering wings dancing near the forest entrance. The butterfly seemed to be beckoning her to follow.

Luna followed the magical butterfly deeper into the forest than she had ever been before. The trees grew taller, their branches creating a canopy of emerald green above her head.

Suddenly, she found herself standing before a magnificent garden gate covered in twisting vines and blooming flowers of every color imaginable. The golden butterfly landed gently on the gate's handle.

As Luna pushed open the gate, she gasped in wonder. Before her lay a secret garden filled with talking animals, glowing flowers, and trees that sang gentle melodies in the breeze.

A wise old owl perched on a crystal fountain greeted her warmly. "Welcome, Luna! We've been waiting for someone with a brave heart and curious spirit to discover our magical sanctuary."

Luna spent the afternoon making friends with the garden's enchanted creatures - a family of rabbits who told jokes, a deer who could paint rainbows, and butterflies who carried messages between the flowers.

As the sun began to set, painting the sky in shades of pink and gold, Luna knew it was time to return home. The animals promised the garden would always be there whenever she needed a magical escape.

Luna walked back through the forest, her heart full of joy and wonder. She couldn't wait to return to her new secret place and see what other adventures awaited her.

That night, as Luna drifted off to sleep, she smiled knowing that the magic of the secret garden would be with her in her dreams, and that tomorrow would bring new adventures to discover.`

  const mockPages: StoryPage[] = mockStoryText
    .split('\n\n')
    .filter(p => p.trim())
    .map(text => ({ text }))

  return (
    <StoryReview
      storyText={mockStoryText}
      pages={mockPages}
      quizData={mockQuizData}
      onEdit={() => console.log('Edit clicked')}
      onRegenerate={() => console.log('Regenerate clicked')}
      onContinue={() => console.log('Continue clicked')}
      onCancel={() => console.log('Cancel clicked')}
    />
  )
}
