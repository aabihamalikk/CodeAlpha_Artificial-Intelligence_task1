import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

// Multi-engine fallback translation
async function fetchFallbackTranslation(text: string, sourceLang: string, targetLang: string) {
  const sLang = sourceLang === 'auto' ? 'autodetect' : sourceLang;
  
  // Try MyMemory Translated API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${encodeURIComponent(sLang)}|${encodeURIComponent(targetLang)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

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
    // Continue to next fallback
  }

  // Basic structured return
  return {
    translatedText: text,
    detectedSourceLang: sourceLang === 'auto' ? 'en' : sourceLang,
    alternatives: [],
  };
}

function geminiTranslateDevPlugin(): Plugin {
  return {
    name: 'gemini-translate-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/translate' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            let parsedBody: any = {};
            try {
              parsedBody = JSON.parse(body || '{}');
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Invalid JSON body.' }));
            }

            const { text, sourceLang = 'auto', targetLang = 'es', tone = 'natural' } = parsedBody;

            if (!text || typeof text !== 'string') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Text is required.' }));
            }

            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey) {
              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  },
                },
              });

              const prompt = `You are Lumina Translate, an expert multilingual translator.
Translate the following source text from ${sourceLang === 'auto' ? 'automatically detected source language' : sourceLang} into target language "${targetLang}".
Target tone style: ${tone} (e.g. natural, formal, casual, business, simplified).

Source text:
"""
${text}
"""

Provide the translation, Romanization/phonetics (especially if target or source is Japanese, Chinese, Korean, Arabic, Russian, Hindi, Greek, etc. or for pronunciation assistance), alternative nuanced translations, tone variations, and a brief vocabulary word-by-word breakdown if key terms are present.`;

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

                  if (response.text) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(response.text);
                  }
                } catch {
                  // Silently try next model or fallback without throwing or polluting logs
                }
              }
            }

            // Seamless fallback translation
            try {
              const fallback = await fetchFallbackTranslation(text, sourceLang, targetLang);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify(fallback));
            } catch {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  translatedText: text,
                  detectedSourceLang: sourceLang === 'auto' ? 'en' : sourceLang,
                })
              );
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiTranslateDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
