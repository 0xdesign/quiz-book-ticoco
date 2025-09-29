# Implementing the **GPT‑5** option in this codebase

This repository already calls GPT‑5 for both story text and images via the **Responses API**. This guide shows:

1. what’s in place,
2. what toggles to expose (env + per‑request),
3. optional improvements (fallbacks, concurrency, logging),
4. how to test.

---

## 0) What’s already wired up

* **Story text** is generated with `openai.responses.create({ model: 'gpt-5', ... })` in `src/lib/openai.ts`, with robust parsing of `response.output` and `response.output_text` for SDK shape differences. Max output tokens: 2000.  

* **Images** are produced by GPT‑5 through the **`image_generation` tool** on the Responses API, forcing the tool with `tool_choice: { type: 'image_generation' }`. We return **base64** for each page. 

* `/api/generate-story` builds **10 page prompts** and generates **10 images in parallel** with `Promise.all`, returning `{ storyText, pages[] }` where each page includes `imageBase64`. 

* The **review UI** renders each page image with `data:image/png;base64,...`. 

> Heads‑up: to run locally you only need `OPENAI_API_KEY` in `.env.local`. This variable already exists in `.env.example`. 

Also note the repo already documents GPT‑5 behavior (reasoning effort, verbosity, Responses API) and that **temperature/top_p are not supported by GPT‑5**—you should use `reasoning.effort`, `text.verbosity`, and `max_output_tokens`. 

> **README drift:** the root README still says *“AI Story Generation: OpenAI GPT‑4”*. Update to GPT‑5 to avoid confusion. 

---

## 1) Make GPT‑5 a selectable **option**

You can ship this in two layers:

### A) Global defaults (env toggles)

Add the following **optional** env variables:

```bash
# .env.local (optional tuning)
OPENAI_MODEL=gpt-5            # or gpt-5-mini / gpt-4.1
OPENAI_REASONING=medium       # minimal | low | medium | high
OPENAI_VERBOSITY=medium       # low | medium | high
OPENAI_MAX_OUTPUT_TOKENS=2000 # number
OPENAI_IMAGE_SIZE=1024x1024   # e.g. 1024x1024, 1024x1536
OPENAI_IMAGE_FORMAT=png       # png | jpeg | webp
```

Wire them in `src/lib/openai.ts`:

```diff
 import OpenAI from 'openai'
 import { QuizData } from './supabase'

 let openai: OpenAI | null = null
 if (process.env.OPENAI_API_KEY) {
   openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
 }

 +const MODEL = process.env.OPENAI_MODEL || 'gpt-5'
 +const REASONING = (process.env.OPENAI_REASONING as
 +  | 'minimal' | 'low' | 'medium' | 'high') || 'medium'
 +const VERBOSITY = (process.env.OPENAI_VERBOSITY as
 +  | 'low' | 'medium' | 'high') || 'medium'
 +const MAX_OUT_TOK = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 2000)
 +const IMG_SIZE = (process.env.OPENAI_IMAGE_SIZE as `${number}x${number}`) || '1024x1024'
 +const IMG_FORMAT = (process.env.OPENAI_IMAGE_FORMAT as 'png' | 'jpeg' | 'webp') || 'png'

 -export async function generateStory(quizData: QuizData): Promise<string> {
 +export async function generateStory(
 +  quizData: QuizData,
 +  opts?: {
 +    model?: string
 +    reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
 +    verbosity?: 'low' | 'medium' | 'high'
 +    maxOutputTokens?: number
 +  }
 +): Promise<string> {
   if (!openai) throw new Error('OpenAI is not configured. Set OPENAI_API_KEY environment variable.')

   // ... build prompt (unchanged) ...

 -  const response: any = await (openai as any).responses.create({
 -    model: 'gpt-5',
 -    input: prompt,
 -    max_output_tokens: 2000
 -  })
 +  const response: any = await (openai as any).responses.create({
 +    model: opts?.model || MODEL,
 +    input: prompt,
 +    reasoning: { effort: opts?.reasoningEffort || REASONING },
 +    text: { verbosity: opts?.verbosity || VERBOSITY },
 +    max_output_tokens: opts?.maxOutputTokens ?? MAX_OUT_TOK,
 +  })

   // ... existing output parsing remains ...
 }

 -export async function generateImage(prompt: string, options?: {
 -  size?: `${number}x${number}`
 -  format?: 'png' | 'jpeg' | 'webp'
 -}): Promise<string> {
 +export async function generateImage(
 +  prompt: string,
 +  options?: {
 +    size?: `${number}x${number}`
 +    format?: 'png' | 'jpeg' | 'webp'
 +    model?: string
 +  }
 +): Promise<string> {
   if (!openai) throw new Error('OpenAI is not configured. Set OPENAI_API_KEY environment variable.')
 -  const size = options?.size || '1024x1024'
 +  const size = options?.size || IMG_SIZE
 +  const format = options?.format || IMG_FORMAT

   const tool: any = {
     type: 'image_generation',
 -    options: { size, format: options?.format || 'png' }
 +    options: { size, format }
   }
   const response: any = await (openai as any).responses.create({
 -    model: 'gpt-5',
 +    model: options?.model || MODEL,
     input: prompt,
     tools: [tool],
     tool_choice: { type: 'image_generation' }
   })
   // ... existing base64 extraction remains ...
 }
```

Those calls continue to use the **Responses API** (required for GPT‑5) and the `image_generation` tool. The text controls (`reasoning.effort`, `text.verbosity`, `max_output_tokens`) are the **correct knobs for GPT‑5** (temperature/top_p are not supported on GPT‑5). 

> FYI: When you invoke the image tool, the base image model is **`gpt-image-1`** under the hood; the mainline model (here GPT‑5) orchestrates the tool call. The tool returns a base64 image that you’re already surfacing. 

### B) Per‑request overrides (API‑level)

Your service layer already forwards directly to the real OpenAI call: `openaiService.generateStory(quizData)` in `src/lib/services.ts`. We’ll allow an **optional second parameter** and pass it through (no breaking changes):

```diff
 // src/lib/services.ts
 export const openaiService = {
 -  async generateStory(quizData: QuizData): Promise<string> {
 -    return realGenerateStory(quizData)
 +  async generateStory(
 +    quizData: QuizData,
 +    opts?: {
 +      model?: string
 +      reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
 +      verbosity?: 'low' | 'medium' | 'high'
 +      maxOutputTokens?: number
 +    }
 +  ): Promise<string> {
 +    return realGenerateStory(quizData, opts)
   }
 }
```

If/when you want UI control, you can add an optional `model` (or `options`) field to the `/api/generate-story` body and thread it into `openaiService.generateStory(quizData, options)`. The existing route already reads/validates the quiz body and calls `openaiService.generateStory(...)`—you’d just pass the extra object through. 

---

## 2) Image generation knobs

The route composes **10 prompts** and calls `generateImage(...)` for each page. That’s where you may adjust **size/format** envs above without touching the route. The route already fails fast if any image fails. 

If you need to audit or tune outputs, you can log the tool call’s **`revised_prompt`** (the model’s auto‑optimized prompt for image generation) which is available on each `image_generation_call`. That field is described in the project’s image guide. 

---

## 3) Optional improvements (recommended but not required)

### A) Concurrency control for image calls

Right now, all 10 images are generated in parallel. That’s fast, but spiky. If you’d like to cap concurrency (e.g., 3 at a time) without adding dependencies:

```ts
// inside /api/generate-story route, replace Promise.all with a simple queue
const results: string[] = []
const concurrency = 3
for (let i = 0; i < prompts.length; i += concurrency) {
  const batch = prompts.slice(i, i + concurrency)
  const batchResults = await Promise.all(
    batch.map((imgPrompt, idx) =>
      generateImage(imgPrompt).catch((e: any) => {
        const msg = e?.message || 'unknown'
        throw new Error(`Image generation failed on page ${i + idx + 1}: ${msg}`)
      })
    )
  )
  results.push(...batchResults)
}
const pageImages = results
```

(Everything else in the route stays the same.) The current route shape and error messaging are fine as‑is. 

### B) Stream partial images (advanced UX)

If you want progressive previews, you can implement streaming for image generation. The repo’s image doc shows partial‑image streaming with the Images API; adapt as needed if you decide to switch from tool calls to direct `images.generate`. 

### C) Log the revised prompt for quality review

When extracting each `image_generation_call` from `response.output`, also read `revised_prompt` and dump it to logs for prompt tuning sessions. The doc shows where it appears. 

### D) Fallback model

Add a defensive fallback to `gpt-4.1` if `gpt-5` is temporarily unavailable:

```ts
const tryModels = [MODEL, 'gpt-4.1']
let response
for (const m of tryModels) {
  try {
    response = await (openai as any).responses.create({
      model: m, input: prompt, reasoning: { effort: REASONING },
      text: { verbosity: VERBOSITY }, max_output_tokens: MAX_OUT_TOK
    })
    break
  } catch (err) {
    if (m === tryModels[tryModels.length - 1]) throw err
  }
}
```

*(Note: the existing code already uses the Responses API which is the right surface for GPT‑5.)* 

---

## 4) Testing the integration

### Smoke test (local)

1. Set `OPENAI_API_KEY` (and any optional envs from §1A). 
2. `npm run dev`
3. Submit the quiz and check that:

   * the story renders (10 paragraphs),
   * each page shows an image (base64 `<img ...>` in `StoryReview`). 

### API test (cURL)

```bash
curl -sS -X POST http://localhost:3000/api/generate-story \
  -H 'Content-Type: application/json' \
  -d '{
        "childName":"Ava",
        "childAge":"6",
        "childTraits":["curious","brave","kind"],
        "favoriteThings":["dinosaurs","space","rainbows"],
        "storyType":"magical-journey",
        "parentEmail":"test@example.com",
        "parentConsent": true
      }' | jq .
```

You should receive JSON with `storyText` and a `pages[]` array where `pages[i].imageBase64` is populated. 

---

## 5) Notes and gotchas

* **Use Responses API controls** for GPT‑5 (reasoning, verbosity, max tokens). Avoid `temperature`, `top_p`, `logprobs`—GPT‑5 rejects them. The code in this repo already uses the right parameters. 
* **`OPENAI_API_KEY` is required.** The OpenAI client is created only when the key is present; missing keys throw a clear error. 
* **Image generation tool**: we intentionally force `tool_choice: { type: 'image_generation' }` to ensure an image is returned each time. That’s already in `generateImage`. 
* **UI pipeline**: `/api/generate-story` produces `{storyText, pages[]}`; the Review page renders that without extra work. PDFs are **text‑only** today; images aren’t embedded (documented elsewhere in repo).  

---

## 6) Finish work / cleanup checklist

* [ ] Set `OPENAI_MODEL=gpt-5` in production (or leave default; code already defaults to GPT‑5). 
* [ ] Optionally expose a **“Model”** toggle in admin/UI and pass through to `openaiService.generateStory(quizData, { model: 'gpt-5' | 'gpt-5-mini' | 'gpt-4.1' })`. 
* [ ] Update **README** line from GPT‑4 → GPT‑5. 
* [ ] (Optional) Add concurrency cap for images if you see rate spikes. 
* [ ] (Optional) Log `revised_prompt` for tuning sessions. 

---

## Appendix: Where things live

* **Text + image client:** `src/lib/openai.ts` (Responses API, GPT‑5, image tool, output parsing). 
* **API route:** `src/app/api/generate-story/route.ts` (sanitization/validation, text generation call, 10 image calls). 
* **Service layer:** `src/lib/services.ts` (forwarders; safe place to inject options). 
* **UI renderer:** `src/components/StoryReview.tsx` (renders base64 images). 
* **Env sample:** `.env.example` (includes `OPENAI_API_KEY`). 
* **SDK:** package.json uses `openai@^4.104.0`. This is compatible with Responses API used here. 
* **Image tool behavior:** project’s `openai_image_generation.md` (examples + notes). 

---

That’s it. With the diffs above you get:

* **Global** GPT‑5 defaults via env,
* **Per‑request** overrides ready to use,
* Clean path to optional streaming/concurrency/logging improvements.

If you want me to generate a small PR patch (diff) for all edits above in one file, say the word and I’ll bundle it.

