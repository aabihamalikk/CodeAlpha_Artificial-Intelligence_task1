import { TranslationResult, Tone } from '../types';
import { getCachedTranslation, saveTranslationToCache, saveTranslationToHistory } from './storage';

export interface TranslateOptions {
  text: string;
  sourceLang: string;
  targetLang: string;
  tone?: Tone;
}

// Client fallback to public MyMemory API when offline or when backend is unavailable
async function fetchPublicTranslateFallback(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  const sLang = sourceLang === 'auto' ? 'autodetect' : sourceLang;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${encodeURIComponent(sLang)}|${encodeURIComponent(targetLang)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fallback translation failed: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.responseStatus !== 200 && data.responseStatus !== '200') {
    throw new Error(data.responseDetails || 'Translation failed');
  }

  const translatedText = data.responseData?.translatedText || '';
  const detected = data.responseData?.detectedLanguage || (sourceLang !== 'auto' ? sourceLang : 'en');
  const matches = (data.matches || [])
    .map((m: { translation: string }) => m.translation)
    .filter((t: string) => t && t.toLowerCase() !== translatedText.toLowerCase())
    .slice(0, 3);

  const result: TranslationResult = {
    id: 'res-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    sourceText: text,
    translatedText,
    sourceLang: sourceLang === 'auto' ? detected : sourceLang,
    targetLang,
    detectedSourceLang: detected,
    alternatives: matches,
    timestamp: Date.now(),
    isOffline: false,
  };

  return result;
}

export async function translateText(options: TranslateOptions): Promise<TranslationResult> {
  const { text, sourceLang, targetLang, tone = 'natural' } = options;

  if (!text || !text.trim()) {
    throw new Error('Please enter text to translate.');
  }

  // 1. Check local offline cache first if offline or exact hit exists
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const cached = getCachedTranslation(text, sourceLang, targetLang, tone);

  if (!isOnline) {
    if (cached) {
      return cached;
    }
    throw new Error(
      'You are offline. This specific sentence has not been cached yet. Try one of your saved phrases or reconnect to translate new text.'
    );
  }

  // 2. Call server-side translation endpoint
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        sourceLang,
        targetLang,
        tone,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.translatedText) {
        const result: TranslationResult = {
          id: 'res-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          sourceText: text,
          translatedText: data.translatedText,
          sourceLang: sourceLang === 'auto' ? (data.detectedSourceLang || 'auto') : sourceLang,
          targetLang,
          detectedSourceLang: data.detectedSourceLang,
          phonetic: data.phonetic,
          alternatives: data.alternatives || [],
          toneVariations: data.toneVariations,
          wordBreakdown: data.wordBreakdown,
          notes: data.notes,
          timestamp: Date.now(),
          isOffline: false,
        };

        // Save to cache & history
        saveTranslationToCache(result, tone);
        saveTranslationToHistory(result);
        return result;
      }
    }
  } catch (backendError) {
    console.warn('Server translation request error, trying fallback translation:', backendError);
  }

  // 3. Resilient fallback to public translation API if server endpoint was unavailable
  try {
    const fallbackResult = await fetchPublicTranslateFallback(text, sourceLang, targetLang);
    saveTranslationToCache(fallbackResult, tone);
    saveTranslationToHistory(fallbackResult);
    return fallbackResult;
  } catch (fallbackError) {
    // If fallback network fails but we have an existing local cache match, return it
    if (cached) {
      return cached;
    }
    throw new Error(
      fallbackError instanceof Error
        ? fallbackError.message
        : 'Translation could not be completed. Please try again.'
    );
  }
}
