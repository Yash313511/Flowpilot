import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.AI_API_KEY;
const MODEL_NAME = process.env.AI_MODEL || 'gemini-2.5-flash';

if (!API_KEY) {
  console.warn('AI_API_KEY is not set. AI features will use fallbacks.');
}

export function getAIClient() {
  if (!API_KEY) return null;
  return new GoogleGenerativeAI(API_KEY);
}

export function getModel() {
  const client = getAIClient();
  if (!client) return null;
  return client.getGenerativeModel({ model: MODEL_NAME });
}

export async function generateJSON<T>(prompt: string, fallback: T): Promise<T> {
  try {
    const model = getModel();
    if (!model) return fallback;

    const result = await model.generateContent(
      `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown backticks, no conversational text, pure JSON only.`
    );
    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      // Find JSON block with regex if extra characters surround it
      const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) {
        return JSON.parse(match[1]) as T;
      }
      throw new Error('No JSON structure found in output');
    }
  } catch (error) {
    console.error('AI generation error:', error);
    return fallback;
  }
}
