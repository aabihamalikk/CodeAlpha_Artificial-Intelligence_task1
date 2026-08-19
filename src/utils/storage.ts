import { TranslationResult, ThemeMode } from '../types';
import { OFFLINE_PHRASEBOOK } from '../data/offlinePhrases';

const CACHE_KEY = 'lumina_translation_cache_v1';
const HISTORY_KEY = 'lumina_translation_history_v1';
const THEME_KEY = 'lumina_theme_preference';
const MAX_HISTORY_ITEMS = 100;

export function getCachedTranslation(
  text: string,
  sourceLang: string,
  targetLang: string,
  tone: string = 'natural'
): TranslationResult | null {
  try {
    const cleanText = text.trim().toLowerCase();
    const cacheRaw = localStorage.getItem(CACHE_KEY);
    if (cacheRaw) {
      const cache: Record<string, TranslationResult> = JSON.parse(cacheRaw);
      const key = `${sourceLang}_${targetLang}_${cleanText}_${tone}`;
      if (cache[key]) {
        return { ...cache[key], isOffline: true };
      }
      // Check flexible match without tone
      const flexibleKey = `${sourceLang}_${targetLang}_${cleanText}_natural`;
      if (cache[flexibleKey]) {
        return { ...cache[flexibleKey], isOffline: true };
      }
    }

    // Check offline phrasebook
    for (const phrase of OFFLINE_PHRASEBOOK) {
      for (const [sCode, sData] of Object.entries(phrase.translations)) {
        if (
          (sourceLang === 'auto' || sourceLang === sCode) &&
          sData.text.toLowerCase().trim() === cleanText
        ) {
          const targetData = phrase.translations[targetLang];
          if (targetData) {
            return {
              id: 'offline-' + Date.now(),
              sourceText: text,
              translatedText: targetData.text,
              sourceLang: sCode,
              targetLang,
              detectedSourceLang: sCode,
              phonetic: targetData.phonetic,
              notes: 'Retrieved from offline instant dictionary',
              timestamp: Date.now(),
              isOffline: true,
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error reading from translation cache:', err);
  }
  return null;
}

export function saveTranslationToCache(item: TranslationResult, tone: string = 'natural'): void {
  try {
    const cleanText = item.sourceText.trim().toLowerCase();
    const key = `${item.sourceLang}_${item.targetLang}_${cleanText}_${tone}`;
    const cacheRaw = localStorage.getItem(CACHE_KEY);
    const cache: Record<string, TranslationResult> = cacheRaw ? JSON.parse(cacheRaw) : {};
    cache[key] = item;
    
    // Limit cache size to 250 items to keep localStorage lightweight
    const keys = Object.keys(cache);
    if (keys.length > 250) {
      delete cache[keys[0]];
    }
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('Error saving to cache:', err);
  }
}

export function getTranslationHistory(): TranslationResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading history:', err);
  }
  return [];
}

export function saveTranslationToHistory(item: TranslationResult): TranslationResult[] {
  try {
    const current = getTranslationHistory();
    // Check if duplicate of most recent
    const filtered = current.filter(
      (h) =>
        !(
          h.sourceText.trim().toLowerCase() === item.sourceText.trim().toLowerCase() &&
          h.targetLang === item.targetLang &&
          h.sourceLang === item.sourceLang
        )
    );
    const updated = [item, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Error saving history:', err);
    return [];
  }
}

export function toggleFavoriteHistoryItem(id: string): TranslationResult[] {
  try {
    const history = getTranslationHistory();
    const updated = history.map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Error toggling favorite:', err);
    return [];
  }
}

export function deleteHistoryItem(id: string): TranslationResult[] {
  try {
    const history = getTranslationHistory();
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Error deleting history item:', err);
    return [];
  }
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.warn('Error clearing history:', err);
  }
}

export function getThemePreference(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'system';
}

export function saveThemePreference(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // fallback
  }
}
