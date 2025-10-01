import { NextRequest } from 'next/server'
import { QuizData as FullQuizData } from '@/lib/supabase'
import { openaiService } from '@/lib/services'
import {
  generateImage,
  generateCharacterProfile,
  extractStoryCharacters,
  generateSecondaryCharacterProfile,
  createCharacterDesignDocument
} from '@/lib/openai'
import { QuizData } from '@/components/QuizForm'
import { sanitizeQuizData, validateQuizData } from '@/lib/validation'

// Helper to send SSE event
function sendEvent(controller: ReadableStreamDefaultController, data: unknown) {
  const message = `data: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(message))
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const quizDataRaw: QuizData = await request.json()
        const quizData = sanitizeQuizData(quizDataRaw) as QuizData

        const { isValid, errors } = validateQuizData(quizData)
        if (!isValid) {
          sendEvent(controller, {
            type: 'error',
            error: 'Invalid input',
            details: errors
          })
          controller.close()
          return
        }

        const transformedQuizData: FullQuizData = {
          childName: quizData.childName,
          childAge: quizData.childAge,
          childTraits: quizData.childTraits || [],
          storyDescription: quizData.storyDescription || undefined,
          characters: [],
          themes: quizData.favoriteThings || [],
          storyType: getStoryTypeDescription(quizData.storyType),
          characterForm: 'An ordinary child in a magical story',
          message: 'You are unique and special',
          bonusDetails: []
        }

        // STAGE 1: Generate story text
        sendEvent(controller, {
          type: 'progress',
          stage: 'story',
          message: `Writing ${quizData.childName}'s personalized adventure...`,
          step: 1,
          totalSteps: 5
        })

        let storyText: string
        try {
          storyText = await openaiService.generateStory(transformedQuizData)
        } catch (e: any) {
          sendEvent(controller, {
            type: 'error',
            error: `Story generation failed: ${e?.message || 'Unknown error'}`
          })
          controller.close()
          return
        }

        // STAGE 2: Extract characters from story
        sendEvent(controller, {
          type: 'progress',
          stage: 'characters',
          message: 'Meeting the characters...',
          step: 2,
          totalSteps: 5
        })

        let characters: Array<{ name: string; role: string; importance: number }> = []
        try {
          characters = await extractStoryCharacters(storyText, quizData.childName)
          console.log(`Extracted ${characters.length} secondary characters:`, characters.map(c => c.name).join(', '))
        } catch (e: any) {
          console.warn('Character extraction failed, continuing without secondary characters:', e?.message)
          // Continue without secondary characters - not critical
        }

        // STAGE 3: Generate main character profile
        sendEvent(controller, {
          type: 'progress',
          stage: 'profiles-main',
          message: `Designing ${quizData.childName}...`,
          step: 3,
          totalSteps: 5
        })

        let mainCharacterProfile: string
        try {
          mainCharacterProfile = await generateCharacterProfile(transformedQuizData)
        } catch (e: any) {
          sendEvent(controller, {
            type: 'error',
            error: `Character profile generation failed: ${e?.message || 'Unknown error'}`
          })
          controller.close()
          return
        }

        // STAGE 4: Generate secondary character profiles
        const secondaryProfiles: Array<{ name: string; profile: string }> = []
        if (characters.length > 0) {
          sendEvent(controller, {
            type: 'progress',
            stage: 'profiles-secondary',
            message: `Creating supporting cast (${characters.length} characters)...`,
            step: 4,
            totalSteps: 5
          })

          for (let i = 0; i < characters.length; i++) {
            const char = characters[i]
            try {
              const profile = await generateSecondaryCharacterProfile(
                char.name,
                char.role,
                storyText,
                quizData.childName,
                quizData.childAge
              )
              secondaryProfiles.push({ name: char.name, profile })
              console.log(`Generated profile for ${char.name} (${i + 1}/${characters.length})`)
            } catch (e: any) {
              console.warn(`Failed to generate profile for ${char.name}:`, e?.message)
              // Continue without this character's profile - not critical
            }
          }
        }

        // Create unified character design document
        const characterDesignDocument = createCharacterDesignDocument(
          mainCharacterProfile,
          secondaryProfiles
        )

        // Split into pages
        const paragraphs = storyText
          .split('\n\n')
          .map(p => p.trim())
          .filter(Boolean)
        const pagesText = paragraphs.length >= 10
          ? paragraphs.slice(0, 10)
          : [...paragraphs, ...Array.from({ length: 10 - paragraphs.length }, () => '')]

        // STAGE 5: Generate images with progress updates
        const tone = getStoryTypeDescription(quizData.storyType)
        const prompts = pagesText.map((pt) => {
          const scene = pt || `A ${tone} scene featuring ${quizData.childName}`
          return `${characterDesignDocument}

SCENE FOR THIS PAGE:
${scene}

ARTISTIC DIRECTION:
- Style: Children's book illustration, ${tone} tone
- Composition: Focus on the characters present in this scene
- Themes present: ${(quizData.favoriteThings || []).join(', ')}
- CRITICAL: Maintain exact character consistency from reference above
- No text or words in the image`
        })

        const size = (process.env.OPENAI_IMAGE_SIZE as `${number}x${number}`) || '768x768'
        const concurrency = Number(process.env.IMAGE_CONCURRENCY || 4)
        const results: string[] = new Array(prompts.length)
        let completed = 0
        let cursor = 0

        const worker = async () => {
          while (true) {
            const idx = cursor++
            if (idx >= prompts.length) break
            try {
              const img = await generateImage(prompts[idx], { size })
              results[idx] = img
              completed++

              // Send progress update after each image
              sendEvent(controller, {
                type: 'progress',
                stage: 'images',
                message: 'Generating illustrations...',
                step: 5,
                totalSteps: 5,
                progress: {
                  current: completed,
                  total: prompts.length
                }
              })
            } catch (e: any) {
              const msg = e?.message || 'unknown'
              throw new Error(`Image generation failed on page ${idx + 1}: ${msg}`)
            }
          }
        }

        try {
          const workers = Array.from({ length: Math.min(concurrency, prompts.length) }, () => worker())
          await Promise.all(workers)
        } catch (e: any) {
          sendEvent(controller, {
            type: 'error',
            error: e?.message || 'Image generation failed'
          })
          controller.close()
          return
        }

        const pages = pagesText.map((text, idx) => ({ text, imageBase64: results[idx] }))

        // Send complete event
        sendEvent(controller, {
          type: 'complete',
          data: {
            storyText,
            pages,
            characterProfile: characterDesignDocument
          }
        })

        controller.close()
      } catch (error: any) {
        sendEvent(controller, {
          type: 'error',
          error: error?.message || 'Failed to generate story'
        })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

function getStoryTypeDescription(storyType: string): string {
  const typeMap: { [key: string]: string } = {
    'everyday-adventure': 'A sweet everyday adventure',
    'magical-journey': 'A magical and poetic dream',
    'brave-hero': 'A big mission in an imaginary world',
    'bedtime-story': 'A calm, soothing bedtime story'
  }
  return typeMap[storyType] || 'A sweet everyday adventure'
}
