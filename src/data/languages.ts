import { Language } from '../types';

export type { Language };

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'auto', name: 'Detect Language', nativeName: 'Auto Detect', popular: false },
  { code: 'en', name: 'English', nativeName: 'English', popular: true, speechCode: 'en-US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', popular: true, speechCode: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', popular: true, speechCode: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', popular: true, speechCode: 'de-DE' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', popular: true, speechCode: 'it-IT' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', popular: true, speechCode: 'pt-PT' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', popular: true, speechCode: 'zh-CN' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', popular: false, speechCode: 'zh-TW' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', popular: true, speechCode: 'ja-JP' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', popular: true, speechCode: 'ko-KR' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', popular: true, speechCode: 'ar-SA' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', popular: true, speechCode: 'hi-IN' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', popular: true, speechCode: 'ru-RU' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', popular: false, speechCode: 'nl-NL' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', popular: false, speechCode: 'tr-TR' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', popular: false, speechCode: 'pl-PL' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', popular: false, speechCode: 'uk-UA' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', popular: false, speechCode: 'vi-VN' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', popular: false, speechCode: 'th-TH' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', popular: false, speechCode: 'id-ID' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', popular: false, speechCode: 'el-GR' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', popular: false, speechCode: 'he-IL' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', popular: false, speechCode: 'sv-SE' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', popular: false, speechCode: 'da-DK' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', popular: false, speechCode: 'fi-FI' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', popular: false, speechCode: 'nb-NO' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', popular: false, speechCode: 'cs-CZ' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', popular: false, speechCode: 'ro-RO' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', popular: false, speechCode: 'hu-HU' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', popular: false, speechCode: 'bn-BD' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', popular: false, speechCode: 'fa-IR' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', popular: false, speechCode: 'ur-PK' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', popular: false, speechCode: 'ms-MY' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino', popular: false, speechCode: 'fil-PH' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', popular: false, speechCode: 'sw-KE' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', popular: false, speechCode: 'ca-ES' },
  { code: 'la', name: 'Latin', nativeName: 'Latina', popular: false, speechCode: 'la' },
];

export const POPULAR_LANGUAGES = SUPPORTED_LANGUAGES.filter(
  (lang) => lang.popular && lang.code !== 'auto'
);

export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === code.toLowerCase());
  return lang ? lang.name : code.toUpperCase();
}

export function getLanguageSpeechCode(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === code.toLowerCase());
  return lang?.speechCode || code;
}
