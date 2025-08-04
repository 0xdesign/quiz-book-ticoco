import OpenAI from 'openai'
import { QuizData } from './supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

export async function generateStory(quizData: QuizData): Promise<string> {
  // Build character descriptions
  let characterContext = ''
  if (quizData.characters && quizData.characters.length > 0) {
    characterContext = '\n\nAdditional Characters:\n'
    quizData.characters.forEach(char => {
      characterContext += `- ${char.name} (${char.relationship})`
      if (char.appearance) {
        const appearanceDetails = Object.values(char.appearance).filter(v => v).join(', ')
        if (appearanceDetails) {
          characterContext += `: ${appearanceDetails}`
        }
      }
      characterContext += '\n'
    })
  }

  // Build photo context
  let photoContext = ''
  if (quizData.childPhoto) {
    photoContext += '\nThe child has uploaded a photo - describe them authentically based on visual cues.'
  }
  if (quizData.characters?.some(c => c.photo)) {
    photoContext += '\nSome characters have photos - incorporate their authentic appearance.'
  }

  // Build themes string
  const themesString = quizData.themes?.join(', ') || 'general adventure'
  
  // Build bonus details string  
  const bonusString = quizData.bonusDetails?.join(', ') || ''

  // Create comprehensive prompt
  const prompt = `Create a personalized children's story with these specifications:

MAIN CHARACTER:
- Name: ${quizData.childName}
- Age: ${quizData.childAge}
- Personality Traits: ${quizData.childTraits.join(', ')}
- Character Form: ${quizData.characterForm}${photoContext}

STORY DETAILS:
- Story Type: ${quizData.storyType}
- Core Message: ${quizData.message}
- Themes to Include: ${themesString}${characterContext}

SPECIAL ELEMENTS TO INCLUDE:
${bonusString ? `- Fun details: ${bonusString}` : '- No specific bonus details requested'}

REQUIREMENTS:
- Exactly 10 paragraphs (3-4 sentences each)
- Use ${quizData.childName}'s name at least 15 times throughout
- Age-appropriate vocabulary for ${quizData.childAge}
- Naturally incorporate all family members/characters mentioned
- Weave in the selected themes organically
- The story should convey the message: "${quizData.message}"
- Include any bonus details in a fun, natural way
- End with ${quizData.childName} embodying the core message
- Maintain a ${getStoryTone(quizData.storyType)} tone throughout

Format: Return ONLY the story text, with paragraphs separated by double line breaks.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a talented children\'s book author who creates personalized stories that captivate young readers. Write engaging, age-appropriate stories that make children feel special and loved.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.8,
    max_tokens: 2000
  })
  
  return completion.choices[0].message.content || ''
}

// Get appropriate tone based on story type
function getStoryTone(type: string): string {
  const toneMap: { [key: string]: string } = {
    'A sweet everyday adventure': 'warm and comforting',
    'A big mission in an imaginary world': 'exciting and adventurous',
    'A fantastic treasure hunt': 'thrilling and mysterious',
    'A magical and poetic dream': 'whimsical and enchanting',
    'A playful learning journey': 'educational and fun',
    'A fun exploration of a new place': 'curious and discovering',
    'A surprise party with twists': 'playful and surprising',
    'An adventure with a talking animal': 'friendly and imaginative',
    'An extraordinary sports competition': 'energetic and inspiring',
    'A calm, soothing bedtime story': 'peaceful and gentle'
  }
  return toneMap[type] || 'engaging and positive'
}