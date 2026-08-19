import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeftRight,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Trash2,
  Bookmark,
  Sparkles,
  RefreshCw,
  Info,
  CornerDownLeft,
  BookOpen,
  SlidersHorizontal,
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { TranslationResult, Tone } from '../types';
import { translateText } from '../utils/translatorApi';
import { getLanguageName, getLanguageSpeechCode } from '../data/languages';
import { toggleFavoriteHistoryItem } from '../utils/storage';

interface TranslatorPanelProps {
  isOnline: boolean;
  onHistoryUpdate?: () => void;
  initialSourceText?: string;
  initialSourceLang?: string;
  initialTargetLang?: string;
}

const TONES: { id: Tone; label: string; desc: string }[] = [
  { id: 'natural', label: 'Natural', desc: 'Standard conversational tone' },
  { id: 'formal', label: 'Formal', desc: 'Polite & respectful' },
  { id: 'casual', label: 'Casual', desc: 'Friendly & informal' },
  { id: 'business', label: 'Business', desc: 'Professional & workplace' },
  { id: 'simplified', label: 'Simplified', desc: 'Clear & straightforward' },
];

const SAMPLE_TEXTS = [
  { text: 'Where can I find the best local coffee shop around here?', label: 'Coffee' },
  { text: 'Thank you very much for your outstanding support and hospitality.', label: 'Gratitude' },
  { text: 'Could you please help me with the directions to the central train station?', label: 'Directions' },
  { text: 'I am delighted to collaborate with your team on this new initiative.', label: 'Business' },
];

export const TranslatorPanel: React.FC<TranslatorPanelProps> = ({
  isOnline,
  onHistoryUpdate,
  initialSourceText = '',
  initialSourceLang = 'auto',
  initialTargetLang = 'es',
}) => {
  const [sourceText, setSourceText] = useState(initialSourceText);
  const [sourceLang, setSourceLang] = useState(initialSourceLang);
  const [targetLang, setTargetLang] = useState(initialTargetLang);
  const [currentTone, setCurrentTone] = useState<Tone>('natural');

  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCopied, setIsCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showDictionary, setShowDictionary] = useState(true);

  const recognitionRef = useRef<any>(null);
  const debounceTimerRef = useRef<any>(null);

  // Sync initial props if changed externally
  useEffect(() => {
    if (initialSourceText) {
      setSourceText(initialSourceText);
    }
  }, [initialSourceText]);

  // Automatic translation triggered on text/language/tone change with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!sourceText.trim()) {
      setResult(null);
      setError(null);
      return;
    }

    // Debounce translation
    debounceTimerRef.current = setTimeout(() => {
      handleTranslate();
    }, 600);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [sourceText, sourceLang, targetLang, currentTone]);

  const handleSelectTone = (tone: Tone) => {
    setCurrentTone(tone);
    if (result && result.toneVariations && result.toneVariations[tone as keyof typeof result.toneVariations]) {
      const variation = result.toneVariations[tone as keyof typeof result.toneVariations];
      if (variation) {
        setResult({
          ...result,
          translatedText: variation,
        });
        return;
      }
    }
    if (sourceText.trim()) {
      handleTranslate(sourceText, tone);
    }
  };

  const handleTranslate = async (forceText?: string, forceTone?: Tone) => {
    const textToTranslate = forceText !== undefined ? forceText : sourceText;
    const toneToUse = forceTone !== undefined ? forceTone : currentTone;
    if (!textToTranslate.trim()) {
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const translation = await translateText({
        text: textToTranslate,
        sourceLang,
        targetLang,
        tone: toneToUse,
      });

      setResult(translation);
      if (onHistoryUpdate) onHistoryUpdate();
    } catch (err: any) {
      setError(err.message || 'Translation failed. Please check connection or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Swap source and target languages
  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      if (result?.detectedSourceLang) {
        const newSource = targetLang;
        const newTarget = result.detectedSourceLang;
        const newText = result.translatedText;
        setSourceLang(newSource);
        setTargetLang(newTarget);
        setSourceText(newText);
      }
      return;
    }

    const prevSource = sourceLang;
    const prevTarget = targetLang;
    const prevResultText = result?.translatedText || '';

    setSourceLang(prevTarget);
    setTargetLang(prevSource);
    if (prevResultText) {
      setSourceText(prevResultText);
    }
  };

  // Copy result to clipboard
  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Text to Speech playback
  const handlePlaySpeech = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    if (isPlayingAudio) {
      setIsPlayingAudio(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const speechCode = getLanguageSpeechCode(langCode);
    utterance.lang = speechCode;
    utterance.rate = playbackSpeed;

    // Select the best voice for the language if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(
      (v) => v.lang.toLowerCase().replace('_', '-') === speechCode.toLowerCase().replace('_', '-')
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  // Voice dictation (Speech to Text)
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = sourceLang === 'auto' ? 'en-US' : getLanguageSpeechCode(sourceLang);

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setSourceText(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;
  const charCount = sourceText.length;

  return (
    <div className="w-full space-y-4">
      {/* Top Language Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-xs dark:border-neutral-800/90 dark:bg-neutral-900 transition-colors">
        <div className="flex flex-wrap items-center gap-2">
          {/* Source Language */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 pl-1">
              From:
            </span>
            <LanguageSelector
              selectedCode={sourceLang}
              onSelect={(code) => setSourceLang(code)}
              isSource={true}
              disabledCodes={[targetLang]}
            />
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwapLanguages}
            title="Swap source and target languages"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-transform active:rotate-180 duration-300 focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          {/* Target Language */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 pl-1">
              To:
            </span>
            <LanguageSelector
              selectedCode={targetLang}
              onSelect={(code) => setTargetLang(code)}
              isSource={false}
              disabledCodes={sourceLang === 'auto' ? [] : [sourceLang]}
            />
          </div>
        </div>

        {/* Tone Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 mr-1 hidden sm:inline" />
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTone(t.id)}
              title={t.desc}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                currentTone === t.id
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Pane Translator Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Text Box */}
        <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 transition-colors">
          {/* Header row */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {sourceLang === 'auto'
                  ? result?.detectedSourceLang
                    ? `Auto (Detected: ${getLanguageName(result.detectedSourceLang)})`
                    : 'Auto Detect'
                  : getLanguageName(sourceLang)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {sourceText && (
                <button
                  onClick={() => {
                    setSourceText('');
                    setResult(null);
                  }}
                  title="Clear text"
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-md transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              {/* Dictation Voice Input */}
              <button
                onClick={toggleVoiceInput}
                title={isListening ? 'Stop listening' : 'Speak into translator'}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                }`}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice'}</span>
              </button>
            </div>
          </div>

          {/* Text Area */}
          <div className="relative flex-1 min-h-[160px]">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter or paste text, or speak to translate instantly..."
              rows={6}
              className="w-full h-full resize-none border-none bg-transparent p-0 text-base sm:text-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-600 leading-relaxed"
            />
          </div>

          {/* Footer Controls & Stats */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500">
            <div className="flex items-center gap-3">
              <span>{charCount} characters</span>
              <span>•</span>
              <span>{wordCount} words</span>
            </div>

            <div className="flex items-center gap-2">
              {sourceText && (
                <button
                  onClick={() => handlePlaySpeech(sourceText, sourceLang === 'auto' ? 'en' : sourceLang)}
                  title="Listen to source pronunciation"
                  className="flex items-center gap-1 rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => handleTranslate()}
                disabled={isLoading || !sourceText.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 font-medium text-white shadow-xs hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white transition-all active:scale-98"
              >
                {isLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CornerDownLeft className="h-3.5 w-3.5" />
                )}
                <span>Translate</span>
              </button>
            </div>
          </div>

          {/* Sample Starter Phrases (when empty) */}
          {!sourceText && (
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-2">
                Quick Samples
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_TEXTS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSourceText(sample.text);
                    }}
                    className="rounded-lg border border-neutral-200 bg-neutral-50/80 px-2.5 py-1 text-xs text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors text-left"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Target Translation Box */}
        <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 transition-colors">
          <div>
            {/* Header row */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {getLanguageName(targetLang)}
                </span>
                {result?.isOffline && (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    Offline Instant Cache
                  </span>
                )}
              </div>

              {/* Action Icons */}
              {result && result.translatedText && (
                <div className="flex items-center gap-1">
                  {/* Speed toggle for pronunciation */}
                  <button
                    onClick={() => setPlaybackSpeed(playbackSpeed === 1.0 ? 0.75 : 1.0)}
                    title={`Speech speed: ${playbackSpeed}x (click to change)`}
                    className="px-1.5 py-0.5 text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 rounded border border-neutral-200 dark:border-neutral-800"
                  >
                    {playbackSpeed}x
                  </button>

                  {/* Text-to-Speech */}
                  <button
                    onClick={() => handlePlaySpeech(result.translatedText, targetLang)}
                    title="Listen to pronunciation"
                    className={`p-1.5 rounded-md transition-colors ${
                      isPlayingAudio
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                        : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {isPlayingAudio ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(result.translatedText)}
                    title="Copy translation"
                    className="flex items-center gap-1 p-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 rounded-md transition-colors"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Translation Output Body */}
            <div className="min-h-[140px] py-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2 text-neutral-400">
                  <RefreshCw className="h-6 w-6 animate-spin text-neutral-500" />
                  <span className="text-xs">Translating contextually...</span>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="font-semibold">{error}</p>
                      {!isOnline && (
                        <p className="mt-1 text-[11px] opacity-90">
                          Tip: In offline mode, Lumina instantly serves previously translated queries and built-in essential phrases.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : result ? (
                <div className="space-y-3">
                  {/* Primary Translated Output */}
                  <p className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-50 leading-relaxed break-words select-text">
                    {result.translatedText}
                  </p>

                  {/* Phonetic / Pronunciation Romanization */}
                  {result.phonetic && (
                    <div className="flex items-center gap-2 rounded-lg bg-neutral-100/80 px-2.5 py-1.5 text-xs font-mono-code text-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-300">
                      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Phonetic:
                      </span>
                      <span>{result.phonetic}</span>
                    </div>
                  )}

                  {/* Alternative Translations */}
                  {result.alternatives && result.alternatives.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                        Alternative Phrasings
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.alternatives.map((alt, i) => (
                          <button
                            key={i}
                            onClick={() => handleCopy(alt)}
                            title="Click to copy alternate phrasing"
                            className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-750 transition-colors text-left"
                          >
                            {alt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cultural Notes */}
                  {result.notes && (
                    <div className="rounded-lg bg-neutral-50 p-2.5 text-xs text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 mr-1">
                        Context note:
                      </span>
                      {result.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400 dark:text-neutral-600">
                  <Sparkles className="h-6 w-6 mb-2 opacity-50" />
                  <p className="text-sm">Translation will appear here in real time</p>
                </div>
              )}
            </div>
          </div>

          {/* Dictionary & Vocabulary Breakdown Card */}
          {result?.wordBreakdown && result.wordBreakdown.length > 0 && (
            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setShowDictionary(!showDictionary)}
                className="flex items-center justify-between w-full text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 py-1"
              >
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Vocabulary Breakdown ({result.wordBreakdown.length})</span>
                </div>
                <span className="text-[11px] font-normal underline">
                  {showDictionary ? 'Hide' : 'Show'}
                </span>
              </button>

              {showDictionary && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {result.wordBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-neutral-100 bg-neutral-50/70 p-2 text-xs dark:border-neutral-800 dark:bg-neutral-800/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {item.word}
                        </span>
                        {item.partOfSpeech && (
                          <span className="text-[10px] italic text-neutral-400">
                            {item.partOfSpeech}
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-300 mt-0.5">
                        {item.translation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
