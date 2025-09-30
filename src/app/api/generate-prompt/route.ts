import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const { theme } = await req.json()

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme is required' },
        { status: 400 }
      )
    }

    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI is not configured' },
        { status: 500 }
      )
    }

    // Generate a 280 character story description using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a creative children\'s story writer. Generate a 280 character story description based on the theme provided. Focus on the story concept and adventure, WITHOUT including specific character details like name, age, gender, or physical appearance - those will be added later. Keep it exciting and age-appropriate for children.'
        },
        {
          role: 'user',
          content: `Generate a 280 character story description for this theme: ${theme}`
        }
      ],
      max_tokens: 100,
      temperature: 0.9,
    })

    const description = response.choices[0]?.message?.content?.trim() || ''

    // Ensure it's under 280 characters
    const truncatedDescription = description.length > 280
      ? description.substring(0, 277) + '...'
      : description

    return NextResponse.json({ description: truncatedDescription })

  } catch (error) {
    console.error('Error generating prompt:', error)
    return NextResponse.json(
      { error: 'Failed to generate prompt description' },
      { status: 500 }
    )
  }
}