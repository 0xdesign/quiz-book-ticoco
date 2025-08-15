import OpenAI from 'openai'
import { QuizData } from './supabase'

interface StoryResult {
  story: string
  quality: QualityScore
  metadata: StoryMetadata
}

interface QualityScore {
  overall: number
  nameUsage: number
  themeIntegration: number
  messageClarity: number
  ageAppropriateness: number
}

interface StoryMetadata {
  wordCount: number
  paragraphCount: number
  nameCount: number
  readingLevel: string
  generationTime: number
}

interface PromptTemplate {
  system: string
  user: string
  temperature: number
  maxTokens: number
}

class OptimizedOpenAIService {
  private client: OpenAI | null = null
  private promptTemplates: Map<string, PromptTemplate>
  private qualityValidator: StoryValidator
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY = 2000
  
  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }
    
    this.promptTemplates = this.initializeTemplates()
    this.qualityValidator = new StoryValidator()
  }
  
  private initializeTemplates(): Map<string, PromptTemplate> {
    const templates = new Map<string, PromptTemplate>()
    
    // Optimized templates for different story types
    templates.set('default', {
      system: `You are a master children's book author with expertise in creating personalized, engaging stories that:
1. Use consistent character traits and behaviors throughout
2. Maintain narrative coherence from beginning to end
3. Integrate themes naturally without forcing them
4. Create emotional connections with young readers
5. Use age-appropriate vocabulary and sentence structures

Your stories are known for their vivid imagery, perfect pacing, and meaningful messages that resonate with children.`,
      user: '',
      temperature: 0.7,
      maxTokens: 2000
    })
    
    templates.set('adventure', {
      system: `You are an expert adventure story writer for children. Your stories feature:
- Exciting but safe adventures appropriate for young readers
- Clear problem-solving that children can follow
- Positive role models and teamwork
- Satisfying resolutions that reinforce the core message`,
      user: '',
      temperature: 0.75,
      maxTokens: 2000
    })
    
    templates.set('bedtime', {
      system: `You are a specialist in calming bedtime stories that:
- Use gentle, soothing language
- Include repetitive, calming phrases
- Build to a peaceful, sleepy conclusion
- Avoid exciting or stimulating content
- Create a sense of safety and comfort`,
      user: '',
      temperature: 0.6,
      maxTokens: 1800
    })
    
    return templates
  }
  
  async generateStoryWithQuality(quizData: QuizData): Promise<StoryResult> {
    const startTime = Date.now()
    
    // Try generation with retries for quality
    let bestStory: string | null = null
    let bestQuality: QualityScore | null = null
    let attempts = 0
    
    while (attempts < this.MAX_RETRIES) {
      attempts++
      
      try {
        const story = await this.generateStoryAttempt(quizData, attempts)
        const quality = await this.validateStoryQuality(story, quizData)
        
        if (!bestQuality || quality.overall > bestQuality.overall) {
          bestStory = story
          bestQuality = quality
        }
        
        // If quality is good enough, stop retrying
        if (quality.overall >= 0.85) {
          break
        }
        
        // Wait before retry with adjusted parameters
        if (attempts < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY)
        }
      } catch (error) {
        console.error(`Story generation attempt ${attempts} failed:`, error)
        if (attempts === this.MAX_RETRIES) {
          throw error
        }
      }
    }
    
    if (!bestStory || !bestQuality) {
      throw new Error('Failed to generate story after all attempts')
    }
    
    const metadata = this.extractMetadata(bestStory, quizData)
    metadata.generationTime = Date.now() - startTime
    
    return {
      story: bestStory,
      quality: bestQuality,
      metadata
    }
  }
  
  private async generateStoryAttempt(quizData: QuizData, attempt: number): Promise<string> {
    if (!this.client) {
      // Use mock service if no API key
      return this.generateMockStory(quizData)
    }
    
    const prompt = this.optimizePromptForConsistency(quizData, attempt)
    const template = this.selectTemplate(quizData.storyType)
    
    const completion = await this.client.chat.completions.create({
      model: attempt === 1 ? 'gpt-4' : 'gpt-4-turbo-preview', // Use turbo for retries
      messages: [
        {
          role: 'system',
          content: template.system
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: template.temperature + (attempt - 1) * 0.05, // Slightly increase creativity on retries
      max_tokens: template.maxTokens,
      presence_penalty: 0.2,
      frequency_penalty: 0.3
    })
    
    return completion.choices[0].message.content || ''
  }
  
  private optimizePromptForConsistency(quizData: QuizData, attempt: number): string {
    // Build character descriptions with consistent formatting
    let characterContext = ''
    if (quizData.characters && quizData.characters.length > 0) {
      characterContext = '\n\n📚 SUPPORTING CHARACTERS (must appear in story):\n'
      quizData.characters.forEach((char, index) => {
        characterContext += `${index + 1}. ${char.name} (${char.relationship})`
        if (char.appearance) {
          const appearanceDetails = Object.values(char.appearance).filter(v => v).join(', ')
          if (appearanceDetails) {
            characterContext += `\n   Appearance: ${appearanceDetails}`
          }
        }
        characterContext += `\n   Role: Should appear at least 2-3 times in meaningful ways\n`
      })
    }

    // Build photo context with specific instructions
    let photoContext = ''
    if (quizData.childPhoto) {
      photoContext += '\n⭐ Visual Reference: The child has uploaded a photo - incorporate authentic visual details naturally.'
    }
    if (quizData.characters?.some(c => c.photo)) {
      photoContext += '\n⭐ Character Photos: Some characters have photos - maintain visual consistency throughout.'
    }

    // Build themes string with emphasis
    const themesString = quizData.themes?.join(', ') || 'general adventure'
    
    // Build bonus details string with structure
    const bonusString = quizData.bonusDetails?.join(', ') || ''
    
    // Add consistency rules based on attempt
    const consistencyRules = attempt > 1 ? `

🔧 CONSISTENCY REQUIREMENTS (STRICT):
- ${quizData.childName} must exhibit the SAME personality traits throughout
- Character relationships must remain consistent
- Story logic must be internally coherent
- Themes must be woven throughout, not just mentioned
- The message "${quizData.message}" must be clearly demonstrated, not just stated` : ''

    // Create comprehensive, structured prompt
    const prompt = `Create a personalized children's story following this EXACT structure:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 PROTAGONIST PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Name: ${quizData.childName} (USE EXACTLY 15-20 TIMES)
• Age: ${quizData.childAge} years old
• Core Traits: ${quizData.childTraits.map(t => t.toUpperCase()).join(' | ')}
• Character Form: ${quizData.characterForm}
${photoContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 STORY SPECIFICATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Genre: ${quizData.storyType}
• Tone: ${this.getStoryTone(quizData.storyType)}
• Central Message: "${quizData.message}"
• Key Themes: ${themesString}
${characterContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ SPECIAL ELEMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${bonusString ? `Fun Details to Include: ${bonusString}` : 'No specific bonus details'}
${consistencyRules}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 STRICT FORMATTING REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. EXACTLY 10 paragraphs (3-4 sentences each)
2. Paragraph 1: Introduce ${quizData.childName} and setting
3. Paragraphs 2-3: Establish the situation/problem
4. Paragraphs 4-6: Main adventure/journey
5. Paragraphs 7-8: Challenge and growth
6. Paragraph 9: Resolution and message realization
7. Paragraph 10: Satisfying conclusion with ${quizData.childName} embodying the message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ QUALITY CHECKLIST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☐ ${quizData.childName}'s traits remain consistent throughout
☐ All mentioned characters appear meaningfully
☐ Vocabulary appropriate for age ${quizData.childAge}
☐ Themes integrated naturally, not forced
☐ Message demonstrated through actions, not just stated
☐ Story has clear beginning, middle, and end
☐ Emotional arc appropriate for story type

OUTPUT: Return ONLY the story text with paragraphs separated by double line breaks. No titles, no extra formatting.`

    return prompt
  }
  
  private async validateStoryQuality(story: string, quizData: QuizData): Promise<QualityScore> {
    return this.qualityValidator.validate(story, quizData)
  }
  
  private selectTemplate(storyType: string): PromptTemplate {
    if (storyType.toLowerCase().includes('bedtime')) {
      return this.promptTemplates.get('bedtime')!
    }
    if (storyType.toLowerCase().includes('adventure') || storyType.toLowerCase().includes('mission')) {
      return this.promptTemplates.get('adventure')!
    }
    return this.promptTemplates.get('default')!
  }
  
  private extractMetadata(story: string, quizData: QuizData): StoryMetadata {
    const words = story.split(/\s+/).length
    const paragraphs = story.split(/\n\n+/).length
    const nameCount = (story.match(new RegExp(quizData.childName, 'gi')) || []).length
    
    // Estimate reading level
    const avgWordLength = story.replace(/\s+/g, '').length / words
    const avgSentenceLength = words / (story.split(/[.!?]+/).length - 1)
    let readingLevel = 'Early Elementary'
    
    if (avgWordLength > 5 && avgSentenceLength > 15) {
      readingLevel = 'Upper Elementary'
    } else if (avgWordLength > 4.5 && avgSentenceLength > 12) {
      readingLevel = 'Middle Elementary'
    }
    
    return {
      wordCount: words,
      paragraphCount: paragraphs,
      nameCount,
      readingLevel,
      generationTime: 0 // Will be set by caller
    }
  }
  
  private async generateMockStory(quizData: QuizData): Promise<string> {
    // Fallback mock story generation
    await this.delay(1000) // Simulate API call
    
    const paragraphs = [
      `Once upon a time, there was a wonderful ${quizData.childAge}-year-old named ${quizData.childName}. ${quizData.childName} was known for being ${quizData.childTraits[0]} and ${quizData.childTraits[1]}. Every day was a new adventure waiting to begin.`,
      
      `One sunny morning, ${quizData.childName} woke up feeling especially ${quizData.childTraits[2] || 'excited'}. Today was going to be special, though ${quizData.childName} didn't know it yet. The air seemed to sparkle with possibility.`,
      
      // ... Add 8 more paragraphs following the template
    ]
    
    return paragraphs.join('\n\n')
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  private getStoryTone(type: string): string {
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
}

/**
 * Story quality validator
 */
class StoryValidator {
  validate(story: string, quizData: QuizData): QualityScore {
    const nameCount = (story.match(new RegExp(quizData.childName, 'gi')) || []).length
    const nameUsage = Math.min(nameCount / 15, 1) // Target 15+ uses
    
    // Check theme integration
    let themeScore = 0
    if (quizData.themes) {
      const themeMentions = quizData.themes.filter(theme => 
        story.toLowerCase().includes(theme.toLowerCase())
      ).length
      themeScore = themeMentions / quizData.themes.length
    }
    
    // Check message clarity (simple heuristic)
    const messageWords = quizData.message.toLowerCase().split(' ')
    const messageIntegration = messageWords.filter(word => 
      story.toLowerCase().includes(word)
    ).length / messageWords.length
    
    // Age appropriateness (based on sentence complexity)
    const sentences = story.split(/[.!?]+/).filter(s => s.trim())
    const avgSentenceLength = story.split(/\s+/).length / sentences.length
    const targetLength = quizData.childAge <= 5 ? 10 : quizData.childAge <= 8 ? 12 : 15
    const ageScore = 1 - Math.abs(avgSentenceLength - targetLength) / targetLength
    
    const overall = (nameUsage + themeScore + messageIntegration + ageScore) / 4
    
    return {
      overall,
      nameUsage,
      themeIntegration: themeScore,
      messageClarity: messageIntegration,
      ageAppropriateness: Math.max(0, ageScore)
    }
  }
}

// Export singleton instance
const openaiService = new OptimizedOpenAIService()

export async function generateStory(quizData: QuizData): Promise<string> {
  try {
    const result = await openaiService.generateStoryWithQuality(quizData)
    console.log('Story quality score:', result.quality)
    console.log('Story metadata:', result.metadata)
    return result.story
  } catch (error) {
    console.error('Story generation failed:', error)
    // Return a fallback story
    return `Once upon a time, ${quizData.childName} went on an amazing adventure...`
  }

export { OptimizedOpenAIService }