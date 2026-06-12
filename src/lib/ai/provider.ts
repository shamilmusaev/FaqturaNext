import 'server-only'
import { createOpenAI } from '@ai-sdk/openai'

// Single place that knows which model the AI features run on, so swapping it
// (or the provider) is a one-line change.
export const AI_MODEL_ID = 'gpt-4.1-mini'

/** True when the OpenAI key is present; endpoints short-circuit when it isn't. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

/** The language model used by Magic Fill and text polishing. */
export function aiModel() {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openai(AI_MODEL_ID)
}
