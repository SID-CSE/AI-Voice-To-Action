import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length === 0) {
  throw new Error('GEMINI_API_KEY is not configured.');
}

const models = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
];
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { timeout: 20_000, retryOptions: { attempts: 1 } },
});

for (const model of models) {
  const started = Date.now();
  try {
    const response = await ai.models.generateContent({
      model,
      contents: 'Return exactly JSON: {"ok":true}',
      config: { responseMimeType: 'application/json', temperature: 0 },
    });
    console.log(JSON.stringify({
      model,
      status: 'working',
      elapsedMs: Date.now() - started,
      response: Boolean(response.text),
    }));
  } catch (error) {
    console.log(JSON.stringify({
      model,
      status: 'unavailable_or_quota_limited',
      elapsedMs: Date.now() - started,
      error: String(error instanceof Error ? error.message : error).slice(0, 240),
    }));
  }
}
