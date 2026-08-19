import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Public translation fallback if model is unavailable
async function fetchFallbackTranslation(text: string, sourceLang: string, targetLang: string) {
  const sLang = sourceLang === 'auto' ? 'autodetect' : sourceLang;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${encodeURIComponent(sLang)}|${encodeURIComponent(targetLang)}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const translatedText = data.responseData?.translatedText || text;
      const detected = data.responseData?.detectedLanguage || (sourceLang !== 'auto' ? sourceLang : 'en');
      const matches = (data.matches || [])
        .map((m: { translation: string }) => m.translation)
        .filter((t: string) => t && t.toLowerCase() !== translatedText.toLowerCase())
        .slice(0, 3);

      return {
        translatedText,
        detectedSourceLang: detected,
        alternatives: matches,
      };
    }
  } catch {
    // fallback
  }

  return {
    translatedText: text,
    detectedSourceLang: sourceLang === 'auto' ? 'en' : sourceLang,
    alternatives: [],
  };
}

// Translation API endpoint
app.post('/api/translate', async (req, res) => {
  const { text, sourceLang = 'auto', targetLang = 'es', tone = 'natural' } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required for translation.' });
  }

  const prompt = `You are Lumina Translate, an expert multilingual translator.
Translate the following source text from ${sourceLang === 'auto' ? 'automatically detected source language' : sourceLang} into target language "${targetLang}".
Target tone style: ${tone} (e.g. natural, formal, casual, business, simplified).

Source text:
"""
${text}
"""

Provide the translation, Romanization/phonetics (especially if target or source is Japanese, Chinese, Korean, Arabic, Russian, Hindi, Greek, etc. or for pronunciation assistance), alternative nuanced translations, tone variations, and a brief vocabulary word-by-word breakdown if key terms are present.`;

  if (ai) {
    const modelsToTry = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              'You are Lumina Translate, an expert multilingual translator. Deliver flawless, natural, context-aware translations. Always return well-formed JSON matching the specified schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                translatedText: {
                  type: Type.STRING,
                  description: 'The primary accurate translated text matching the requested tone.',
                },
                detectedSourceLang: {
                  type: Type.STRING,
                  description: 'The detected source language 2-letter ISO code (e.g. en, es, fr, ja, zh).',
                },
                phonetic: {
                  type: Type.STRING,
                  description: 'Phonetic transcription, Romaji, Pinyin, or pronunciation guide.',
                },
                alternatives: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Alternative phrasing or contextual synonyms.',
                },
                toneVariations: {
                  type: Type.OBJECT,
                  properties: {
                    formal: { type: Type.STRING },
                    casual: { type: Type.STRING },
                    business: { type: Type.STRING },
                    simplified: { type: Type.STRING },
                  },
                },
                wordBreakdown: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      translation: { type: Type.STRING },
                      partOfSpeech: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                    },
                    required: ['word', 'translation'],
                  },
                },
                notes: {
                  type: Type.STRING,
                  description: 'Brief cultural context, grammatical notes, or formality nuance if helpful.',
                },
              },
              required: ['translatedText'],
            },
          },
        });

        const outputText = response.text;
        if (outputText) {
          const parsed = JSON.parse(outputText);
          return res.json(parsed);
        }
      } catch {
        // Silently try next model
      }
    }
  }

  // Graceful fallback to public translation service
  try {
    const fallback = await fetchFallbackTranslation(text, sourceLang, targetLang);
    return res.json(fallback);
  } catch {
    return res.json({
      translatedText: text,
      detectedSourceLang: sourceLang === 'auto' ? 'en' : sourceLang,
    });
  }
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Only start listening if run directly (e.g. via tsx server.ts)
if (process.env.NODE_ENV === 'production' || process.argv[1]?.includes('server')) {
  app.listen(PORT, () => {
    console.log(`Translation server running on port ${PORT}`);
  });
}

export default app;
