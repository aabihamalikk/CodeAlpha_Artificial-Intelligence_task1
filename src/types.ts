export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  popular?: boolean;
  speechCode?: string;
}

export type Tone = 'natural' | 'formal' | 'casual' | 'business' | 'simplified';

export interface WordBreakdown {
  word: string;
  translation: string;
  partOfSpeech?: string;
  explanation?: string;
}

export interface TranslationResult {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  detectedSourceLang?: string;
  phonetic?: string; // Romaji / Pinyin / IPA or phonetic spelling
  alternatives?: string[];
  toneVariations?: {
    formal?: string;
    casual?: string;
    business?: string;
    simplified?: string;
  };
  wordBreakdown?: WordBreakdown[];
  notes?: string;
  timestamp: number;
  isFavorite?: boolean;
  isOffline?: boolean;
}

export interface PhraseItem {
  id: string;
  category: 'essentials' | 'travel' | 'dining' | 'emergency' | 'business' | 'shopping' | 'numbers';
  translations: Record<string, { text: string; phonetic?: string }>;
}

export type ThemeMode = 'light' | 'dark' | 'system';
