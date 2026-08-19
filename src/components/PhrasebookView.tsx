import React, { useState } from 'react';
import {
  Volume2,
  Copy,
  Check,
  Search,
  BookOpen,
  ArrowRight,
  Compass,
  Utensils,
  AlertTriangle,
  ShoppingBag,
  Briefcase,
  Layers,
} from 'lucide-react';
import { OFFLINE_PHRASEBOOK } from '../data/offlinePhrases';
import { SUPPORTED_LANGUAGES, getLanguageName, getLanguageSpeechCode } from '../data/languages';
import { LanguageSelector } from './LanguageSelector';

interface PhrasebookViewProps {
  onSelectPhraseToTranslate: (text: string, sourceLang: string, targetLang: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Phrases', icon: Layers },
  { id: 'essentials', label: 'Essentials', icon: BookOpen },
  { id: 'travel', label: 'Travel & Transit', icon: Compass },
  { id: 'dining', label: 'Food & Dining', icon: Utensils },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'business', label: 'Business', icon: Briefcase },
];

export const PhrasebookView: React.FC<PhrasebookViewProps> = ({ onSelectPhraseToTranslate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sourceLang, setSourceLang] = useState<string>('en');
  const [targetLang, setTargetLang] = useState<string>('es');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handlePlaySpeech = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageSpeechCode(langCode);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPhrases = OFFLINE_PHRASEBOOK.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    const sourceData = item.translations[sourceLang] || item.translations['en'];
    const targetData = item.translations[targetLang] || item.translations['es'];

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      (sourceData && sourceData.text.toLowerCase().includes(q)) ||
      (targetData && targetData.text.toLowerCase().includes(q)) ||
      (targetData && targetData.phonetic?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Language Pairs */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Offline Phrasebook
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Curated everyday expressions with pronunciation guides. Works 100% offline anytime.
            </p>
          </div>

          {/* Quick Language Selector */}
          <div className="flex items-center gap-2">
            <LanguageSelector
              selectedCode={sourceLang}
              onSelect={(code) => setSourceLang(code)}
              isSource={false}
            />
            <ArrowRight className="h-4 w-4 text-neutral-400" />
            <LanguageSelector
              selectedCode={targetLang}
              onSelect={(code) => setTargetLang(code)}
              isSource={false}
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search phrases, translations, or phonetics..."
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-4 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-100"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                isSelected
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Phrase Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredPhrases.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-neutral-400">
            No phrases found for &quot;{searchQuery}&quot;.
          </div>
        ) : (
          filteredPhrases.map((phrase) => {
            const source = phrase.translations[sourceLang] || phrase.translations['en'] || { text: '' };
            const target = phrase.translations[targetLang] || phrase.translations['es'] || { text: '' };

            return (
              <div
                key={phrase.id}
                className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
              >
                <div>
                  {/* Category Tag */}
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    <span>{phrase.category}</span>
                    <span className="font-normal text-neutral-400 lowercase">
                      {getLanguageName(sourceLang)} → {getLanguageName(targetLang)}
                    </span>
                  </div>

                  {/* Source Phrase */}
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {source.text}
                  </p>

                  {/* Target Phrase */}
                  <p className="text-base font-semibold text-neutral-950 dark:text-neutral-50 mb-1">
                    {target.text}
                  </p>

                  {/* Phonetic Pronunciation Guide */}
                  {target.phonetic && (
                    <p className="text-xs font-mono-code text-neutral-500 dark:text-neutral-400 bg-neutral-100/70 dark:bg-neutral-800/70 px-2 py-1 rounded inline-block">
                      {target.phonetic}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 text-xs">
                  <button
                    onClick={() =>
                      onSelectPhraseToTranslate(source.text, sourceLang, targetLang)
                    }
                    className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 font-medium underline underline-offset-2"
                  >
                    Open in Translator
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePlaySpeech(target.text, targetLang)}
                      title="Listen"
                      className="p-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 rounded-md transition-colors"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCopy(target.text, phrase.id)}
                      title="Copy translation"
                      className="p-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 rounded-md transition-colors"
                    >
                      {copiedId === phrase.id ? (
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
