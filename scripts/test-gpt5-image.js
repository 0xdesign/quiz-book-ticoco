#!/usr/bin/env node
// Minimal GPT-5 image generation smoke test using the Responses API
// - Reads OPENAI_API_KEY from env (optionally OPENAI_ORG_ID)
// - Defaults model to 'gpt-5' but can be overridden via OPENAI_MODEL or --model
// - Writes a PNG to scripts/output/gpt5-test.png

const fs = require('fs')
const path = require('path')

// Best-effort: load .env.local if present and OPENAI_API_KEY not already set
try {
  if (!process.env.OPENAI_API_KEY && fs.existsSync(path.join(process.cwd(), '.env.local'))) {
    const envLines = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)
    for (const line of envLines) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (!m) continue
      const key = m[1]
      let val = m[2]
      // Strip surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  }
} catch {}

if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in environment')
  process.exit(1)
}

const argModelIdx = process.argv.findIndex(a => a === '--model')
const cliModel = argModelIdx !== -1 ? process.argv[argModelIdx + 1] : undefined
const model = cliModel || process.env.OPENAI_MODEL || 'gpt-5'

async function main() {
  const OpenAI = require('openai')
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID || process.env.OPENAI_ORGANIZATION || undefined,
    project: process.env.OPENAI_PROJECT || process.env.OPENAI_PROJECT_ID || undefined
  })

  const prompt = process.env.OPENAI_IMAGE_PROMPT ||
    'Draw a warm, storybook-style illustration of a friendly robot reading a bedtime story to a child under a starry sky. No text in the image.'

  console.log(`Creating image via Responses API | model=${model}`)
  try {
    const response = await client.responses.create({
      model,
      input: [
        {
          role: 'user',
          content: [{ type: 'input_text', text: prompt }]
        }
      ],
      tools: [{ type: 'image_generation' }],
      tool_choice: { type: 'image_generation' }
    })

    // Log output types for quick diagnostics
    const types = Array.isArray(response?.output) ? response.output.map(o => o?.type) : []
    console.log('Output types:', types.join(', ') || '(none)')

    const imageData = (response.output || [])
      .filter(o => o.type === 'image_generation_call')
      .map(o => o.result)

    if (!imageData.length) {
      console.error('No image_generation_call result found in response.output')
      process.exit(2)
    }

    const outDir = path.join(process.cwd(), 'scripts', 'output')
    const outPath = path.join(outDir, 'gpt5-test.png')
    fs.mkdirSync(outDir, { recursive: true })
    const buf = Buffer.from(imageData[0], 'base64')
    fs.writeFileSync(outPath, buf)
    console.log(`Wrote image: ${outPath} (${buf.length} bytes)`) 
  } catch (err) {
    const m = err?.message || String(err)
    console.error('Image generation failed:', m)
    if (err?.status) console.error('Status:', err.status)
    if (err?.code) console.error('Code:', err.code)
    if (err?.response?.data) {
      try { console.error('Body:', JSON.stringify(err.response.data)) } catch {}
    }
    process.exit(3)
  }
}

main()
