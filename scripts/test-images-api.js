import OpenAI from 'openai'

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')
  const client = new OpenAI({ apiKey })
  const prompt = 'Draw a warm, child-friendly illustration of a brave 6-year-old exploring a magical forest, in a colorful picture book style. No text in the image.'
  const res = await client.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: '1024x1024'
  })
  const b64 = res.data?.[0]?.b64_json || ''
  console.log(JSON.stringify({ len: b64.length, ok: !!b64 }))
}

main().catch(err => { console.error(err?.message || err); process.exit(2) })
