import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export const SUPPORTED_MODELS = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Direkomendasikan - Cepat & Akurat)', tier: 'Standard' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Sangat Cepat)', tier: 'Standard' }
];

export const DEFAULT_MODEL = 'gemini-3.8-flash';
export const DEFAULT_VERIFICATION_MODEL = 'gemini-3.8-flash';

export function hasValidGeminiKey(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10);
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY tidak ditemukan di environment server. Pastikan API key telah terkonfigurasi di Secrets.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 6000,
  label = 'Panggilan Gemini AI'
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} melebihi batas waktu ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}
