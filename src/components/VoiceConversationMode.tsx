import React, { useState, useRef } from 'react';
import { Mic, MicOff, Volume2, ArrowLeftRight, Play, Square, MessageSquare } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { translateText } from '../utils/translatorApi';
import { getLanguageName, getLanguageSpeechCode } from '../data/languages';

interface ConversationTurn {
  id: string;
  speaker: 'user1' | 'user2';
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

export const VoiceConversationMode: React.FC = () => {
  const [lang1, setLang1] = useState('en');
  const [lang2, setLang2] = useState('es');
  const [activeSpeaker, setActiveSpeaker] = useState<'user1' | 'user2' | null>(null);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [interimText, setInterimText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const recognitionRef = useRef<any>(null);

  const startListening = (speaker: 'user1' | 'user2') => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    if (activeSpeaker) {
      recognitionRef.current?.stop();
    }

    setActiveSpeaker(speaker);
    setInterimText('');

    const source = speaker === 'user1' ? lang1 : lang2;
    const target = speaker === 'user1' ? lang2 : lang1;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = getLanguageSpeechCode(source);

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInterimText(text);
      };

      recognition.onend = async () => {
        setActiveSpeaker(null);
        if (interimText.trim()) {
          processTranslation(interimText, source, target, speaker);
        }
      };

      recognition.onerror = (e: any) => {
        console.error('Speech error:', e);
        setActiveSpeaker(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setActiveSpeaker(null);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setActiveSpeaker(null);
  };

  const processTranslation = async (
    text: string,
    source: string,
    target: string,
    speaker: 'user1' | 'user2'
  ) => {
    setIsTranslating(true);
    try {
      const res = await translateText({
        text,
        sourceLang: source,
        targetLang: target,
        tone: 'natural',
      });

      const newTurn: ConversationTurn = {
        id: 'turn-' + Date.now(),
        speaker,
        sourceText: text,
        translatedText: res.translatedText,
        sourceLang: source,
        targetLang: target,
        timestamp: Date.now(),
      };

      setConversation((prev) => [...prev, newTurn]);
      setInterimText('');

      // Auto-speak translated output
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(res.translatedText);
        utterance.lang = getLanguageSpeechCode(target);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('Voice translation failed:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const playSpeech = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageSpeechCode(langCode);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-4">
      {/* Top Language Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-neutral-500" />
            <span>Two-Way Live Conversation</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Tap a microphone to speak. The app translates and speaks back in the other language.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector
            selectedCode={lang1}
            onSelect={(c) => setLang1(c)}
            isSource={false}
          />
          <ArrowLeftRight className="h-4 w-4 text-neutral-400" />
          <LanguageSelector
            selectedCode={lang2}
            onSelect={(c) => setLang2(c)}
            isSource={false}
          />
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="min-h-[300px] max-h-[460px] overflow-y-auto space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        {conversation.length === 0 && !interimText && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-neutral-400">
            <Mic className="h-8 w-8 mb-2 text-neutral-300 dark:text-neutral-700" />
            <p className="font-semibold text-neutral-600 dark:text-neutral-300">
              Start conversation
            </p>
            <p className="mt-0.5">
              Press Person 1 ({getLanguageName(lang1)}) or Person 2 ({getLanguageName(lang2)}) button below.
            </p>
          </div>
        )}

        {conversation.map((turn) => {
          const isP1 = turn.speaker === 'user1';
          return (
            <div
              key={turn.id}
              className={`flex flex-col ${isP1 ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 ${
                  isP1
                    ? 'rounded-tl-xs bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                    : 'rounded-tr-xs bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] uppercase font-bold opacity-60 mb-1">
                  <span>
                    {isP1 ? `Speaker 1 (${getLanguageName(turn.sourceLang)})` : `Speaker 2 (${getLanguageName(turn.sourceLang)})`}
                  </span>
                  <button
                    onClick={() => playSpeech(turn.translatedText, turn.targetLang)}
                    className="hover:opacity-100"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs opacity-75">{turn.sourceText}</p>
                <p className="text-sm font-semibold mt-1">{turn.translatedText}</p>
              </div>
            </div>
          );
        })}

        {/* Interim / Live Speech Bubbles */}
        {interimText && (
          <div
            className={`flex flex-col ${
              activeSpeaker === 'user1' ? 'items-start' : 'items-end'
            }`}
          >
            <div className="max-w-[80%] rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-900 dark:text-amber-300 animate-pulse">
              <span className="font-semibold block mb-0.5">Listening live...</span>
              {interimText}
            </div>
          </div>
        )}
      </div>

      {/* Big Tactile Dual Microphone Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Speaker 1 Mic */}
        <button
          onClick={() =>
            activeSpeaker === 'user1' ? stopListening() : startListening('user1')
          }
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
            activeSpeaker === 'user1'
              ? 'border-red-500 bg-red-500 text-white shadow-lg animate-pulse'
              : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-850 text-neutral-900 dark:text-neutral-100'
          }`}
        >
          {activeSpeaker === 'user1' ? (
            <Square className="h-6 w-6 mb-1" />
          ) : (
            <Mic className="h-6 w-6 mb-1 text-neutral-700 dark:text-neutral-300" />
          )}
          <span className="text-xs font-semibold">
            {activeSpeaker === 'user1' ? 'Stop Listening' : `Speak ${getLanguageName(lang1)}`}
          </span>
          <span className="text-[11px] opacity-60">Speaker 1</span>
        </button>

        {/* Speaker 2 Mic */}
        <button
          onClick={() =>
            activeSpeaker === 'user2' ? stopListening() : startListening('user2')
          }
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
            activeSpeaker === 'user2'
              ? 'border-red-500 bg-red-500 text-white shadow-lg animate-pulse'
              : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-850 text-neutral-900 dark:text-neutral-100'
          }`}
        >
          {activeSpeaker === 'user2' ? (
            <Square className="h-6 w-6 mb-1" />
          ) : (
            <Mic className="h-6 w-6 mb-1 text-neutral-700 dark:text-neutral-300" />
          )}
          <span className="text-xs font-semibold">
            {activeSpeaker === 'user2' ? 'Stop Listening' : `Speak ${getLanguageName(lang2)}`}
          </span>
          <span className="text-[11px] opacity-60">Speaker 2</span>
        </button>
      </div>
    </div>
  );
};
