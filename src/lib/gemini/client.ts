import { GoogleGenerativeAI } from '@google/generative-ai';

// Singleton pattern for Gemini client
let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// Text generation model
export function getTextModel() {
  const client = getGeminiClient();
  return client.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 4096,
      topP: 0.95,
      topK: 40,
    },
  });
}

// Image generation model
export function getImageModel() {
  const client = getGeminiClient();
  return client.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
  });
}

