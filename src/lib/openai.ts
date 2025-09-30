import OpenAI from 'openai'
import { QuizData } from './supabase'

// Create OpenAI instance only if API key is available
let openai: OpenAI | null = null

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID || process.env.OPENAI_ORGANIZATION,
    project: process.env.OPENAI_PROJECT || process.env.OPENAI_PROJECT_ID
  })
}

// Export the OpenAI client for direct access when needed
export { openai }

// Global defaults (overridable via environment variables)
const MODEL = process.env.OPENAI_MODEL || 'gpt-5'
const REASONING = (process.env.OPENAI_REASONING as 'minimal' | 'low' | 'medium' | 'high') || 'medium'
const VERBOSITY = (process.env.OPENAI_VERBOSITY as 'low' | 'medium' | 'high') || 'medium'
const MAX_OUT_TOK = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 2000)
const IMG_SIZE = (process.env.OPENAI_IMAGE_SIZE as `${number}x${number}`) || '1024x1024'
const IMG_FORMAT = (process.env.OPENAI_IMAGE_FORMAT as 'png' | 'jpeg' | 'webp') || 'png'

export async function generateStory(
  quizData: QuizData,
  opts?: {
    model?: string
    reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
    verbosity?: 'low' | 'medium' | 'high'
    maxOutputTokens?: number
  }
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI is not configured. Set OPENAI_API_KEY environment variable.')
  }
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

  // Optional user-provided free-form description
  const descriptionContext = quizData.storyDescription && quizData.storyDescription.trim()
    ? `\n\nUSER INPUT DESCRIPTION (high-level guidance):\n${quizData.storyDescription.trim()}`
    : ''

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
- Themes to Include: ${themesString}${characterContext}${descriptionContext}

SPECIAL ELEMENTS TO INCLUDE:
${bonusString ? `- Fun details: ${bonusString}` : '- No specific bonus details requested'}

REQUIREMENTS:
- Exactly 10 paragraphs (3-4 sentences each)
- Use ${quizData.childName}'s name at least 15 times throughout
- Age-appropriate vocabulary for ${quizData.childAge}
- Naturally incorporate all family members/characters mentioned
- Weave in the selected themes organically
 - The story should convey the message: "${quizData.message}"
 - Follow the user's description above as high-level guidance while still meeting all constraints.
- Include any bonus details in a fun, natural way
- End with ${quizData.childName} embodying the core message
- Maintain a ${getStoryTone(quizData.storyType)} tone throughout

Format: Return ONLY the story text, with paragraphs separated by double line breaks.`

  // Use Responses API with GPT-5 (or provided model)
  const tryTextModels = [opts?.model || MODEL, 'gpt-4.1']
  let response: any
  for (const m of tryTextModels) {
    try {
      const base: any = {
        model: m,
        input: prompt,
        max_output_tokens: opts?.maxOutputTokens ?? MAX_OUT_TOK
      }
      // Only attach reasoning/text verbosity knobs for models that support it
      if (m.startsWith('gpt-5')) {
        base.reasoning = { effort: opts?.reasoningEffort || REASONING }
        base.text = { verbosity: opts?.verbosity || VERBOSITY, format: { type: 'text' } }
      }
      response = await (openai as any).responses.create(base)
      break
    } catch (err) {
      if (m === tryTextModels[tryTextModels.length - 1]) throw err
    }
  }

  // Prefer aggregated text if provided
  if (response?.output_text) return response.output_text as string

  // Extract text from output array in common shapes
  const fragments: string[] = []
  try {
    // Minimal debug of response shape for troubleshooting
    try {
      const types = Array.isArray((response as any)?.output) ? (response as any).output.map((o: any) => o?.type) : []
      console.log('generateStory.output.types', types)
    } catch {}
    if (Array.isArray((response as any)?.output)) {
      for (const item of (response as any).output) {
        if (item?.type === 'message') {
          const contents = Array.isArray(item.content) ? item.content : []
          for (const c of contents) {
            if (typeof c?.text === 'string') fragments.push(c.text)
            else if (c?.type && typeof c?.text === 'string') fragments.push(c.text)
            else if (typeof c?.content === 'string') fragments.push(c.content)
          }
        } else if (typeof item?.text === 'string') {
          fragments.push(item.text)
        } else if (typeof item?.content === 'string') {
          fragments.push(item.content)
        }
      }
    }
  } catch {}

  let text = fragments.join('\n\n').trim()

  // As a last resort, scan the object for any plausible text fields
  if (!text) {
    const collected: string[] = []
    const visit = (node: any, depth: number) => {
      if (!node || depth > 6) return
      if (typeof node === 'string') return
      if (Array.isArray(node)) {
        for (const n of node) visit(n, depth + 1)
        return
      }
      if (typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
          if ((k === 'text' || k === 'output_text' || k === 'value') && typeof v === 'string') {
            const s = v.trim()
            if (s) collected.push(s)
          }
          visit(v as any, depth + 1)
        }
      }
    }
    visit(response, 0)
    text = collected.join('\n\n').trim()
  }

  if (!text) throw new Error('GPT-5 did not return text output')
  return text
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

// Removed demo/mock story generation

// Generate detailed character profile for consistent image generation
export async function generateCharacterProfile(
  quizData: QuizData,
  opts?: {
    model?: string
    reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
    maxOutputTokens?: number
  }
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI is not configured. Set OPENAI_API_KEY environment variable.')
  }

  // Build context from quiz data
  const traitsString = quizData.childTraits?.join(', ') || ''
  const themesString = quizData.themes?.join(', ') || ''

  let photoContext = ''
  if (quizData.childPhoto) {
    photoContext = '\nNote: The child has uploaded a photo. Base the description on authentic visual cues from the photo.'
  }

  const prompt = `Create a detailed visual character description for a children's book illustration. This description will be used to generate multiple images, so it must be EXTREMELY SPECIFIC to ensure the character looks identical in every scene.

CHARACTER INFORMATION:
- Name: ${quizData.childName}
- Age: ${quizData.childAge}
- Personality: ${traitsString}
- Story themes: ${themesString}${photoContext}

Create a comprehensive character profile that includes:

1. PHYSICAL FEATURES (be very specific):
   - Exact hair color, length, and style (e.g., "shoulder-length wavy auburn hair with side-swept bangs")
   - Eye color and shape (e.g., "large round hazel eyes")
   - Skin tone (e.g., "warm light brown skin with rosy cheeks")
   - Facial features (e.g., "small button nose, friendly smile showing gap between front teeth")
   - Build and proportions for age (e.g., "small energetic build, typical 5-year-old proportions")

2. CLOTHING (exact details):
   - Specific colors and style (e.g., "bright yellow t-shirt with a cartoon sun on the front, blue denim overalls")
   - Distinctive details (e.g., "left overall strap unbuckled, red sneakers with white laces")

3. DISTINGUISHING FEATURES:
   - Any unique characteristics (e.g., "three small freckles across nose bridge", "always wears a red hair bow")

4. ARTISTIC STYLE NOTES:
   - Consistent art direction (e.g., "Pixar-style 3D illustration" or "flat 2D storybook style")
   - Expression guidance (e.g., "friendly, curious expression with slight smile")

Format the response as a detailed character reference that can be prepended to image prompts. Be extremely specific about every visual detail. This description must remain consistent across all 10 book pages.

Start with "CHARACTER REFERENCE FOR ALL IMAGES:" and make it 150-200 words.`

  // Use Responses API with GPT-5
  const tryModels = [opts?.model || MODEL, 'gpt-4.1']
  let response: any
  for (const m of tryModels) {
    try {
      const base: any = {
        model: m,
        input: prompt,
        max_output_tokens: opts?.maxOutputTokens ?? 500
      }
      if (m.startsWith('gpt-5')) {
        base.reasoning = { effort: opts?.reasoningEffort || 'low' }
        base.text = { verbosity: 'high', format: { type: 'text' } }
      }
      response = await (openai as any).responses.create(base)
      break
    } catch (err) {
      if (m === tryModels[tryModels.length - 1]) throw err
    }
  }

  // Extract text from response
  if (response?.output_text) return response.output_text as string

  const fragments: string[] = []
  if (Array.isArray((response as any)?.output)) {
    for (const item of (response as any).output) {
      if (item?.type === 'message') {
        const contents = Array.isArray(item.content) ? item.content : []
        for (const c of contents) {
          if (typeof c?.text === 'string') fragments.push(c.text)
        }
      } else if (typeof item?.text === 'string') {
        fragments.push(item.text)
      }
    }
  }

  const text = fragments.join('\n\n').trim()
  if (!text) throw new Error('Failed to generate character profile')
  return text
}

// Generate a single image using the Responses API image_generation tool
export async function generateImage(
  prompt: string,
  options?: {
    size?: `${number}x${number}`
    format?: 'png' | 'jpeg' | 'webp'
    model?: string
  }
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI is not configured. Set OPENAI_API_KEY environment variable.')
  }

  const size = options?.size || IMG_SIZE
  const format = options?.format || IMG_FORMAT

  // GPT-5 with image_generation tool via Responses API only (no fallback)
  const tool: any = { type: 'image_generation' }
  // Skip text-only models for image generation to avoid retries
  const preferredModel = options?.model || (MODEL.startsWith('gpt-5') ? undefined : MODEL)
  const tryImageModels = [
    preferredModel,
    'gpt-4o',
    'gpt-4.1',
    'gpt-4o-mini',
    'gpt-4.1-mini'
  ].filter(Boolean) as string[]
  let response: any
  let lastErr: any
  for (const m of tryImageModels) {
    try {
      response = await (openai as any).responses.create({
        model: m,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: prompt }
            ]
          }
        ],
        tools: [tool],
        tool_choice: { type: 'image_generation' }
      })
      lastErr = null
      break
    } catch (err: any) {
      lastErr = err
      if (m === tryImageModels[tryImageModels.length - 1]) throw err
    }
  }
  const imageData: string[] = (response.output || [])
    .filter((o: any) => o.type === 'image_generation_call')
    .map((o: any) => o.result)
  if (imageData.length === 0) {
    throw new Error('Image generation returned no output')
  }
  return imageData[0]
}
