import OpenAI from 'openai'

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY')
    process.exit(1)
  }
  const client = new OpenAI({ apiKey })
  const model = process.env.OPENAI_MODEL || 'gpt-5'
  const prompt = 'Draw a warm, child-friendly illustration of a brave 6-year-old exploring a magical forest, in a colorful picture book style. No text in the image.'
  const response = await client.responses.create({
    model,
    input: [
      { role: 'user', content: [{ type: 'input_text', text: prompt }] }
    ],
    tools: [{ type: 'image_generation' }],
    tool_choice: { type: 'image_generation' }
  })
  const images = (response.output || []).filter(o => o.type === 'image_generation_call').map(o => o.result)
  console.log(JSON.stringify({ count: images.length, firstLen: images[0]?.length || 0 }))
}

main().catch(err => { console.error(err?.message || err); process.exit(2) })
