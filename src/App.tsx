import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TranslatorPanel } from './components/TranslatorPanel';
import { PhrasebookView } from './components/PhrasebookView';
import { HistoryView } from './components/HistoryView';
import { VoiceConversationMode } from './components/VoiceConversationMode';
import { OfflineBanner } from './components/OfflineBanner';
import { getThemePreference, saveThemePreference, getTranslationHistory } from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'translator' | 'phrasebook' | 'history' | 'voice'>('translator');
  
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = getThemePreference();
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Network & Simulated Offline state
  const [realIsOnline, setRealIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [forceOfflineSimulation, setForceOfflineSimulation] = useState<boolean>(false);

  const effectiveIsOnline = realIsOnline && !forceOfflineSimulation;

  const [historyCount, setHistoryCount] = useState<number>(() => getTranslationHistory().length);

  // Cross-view navigation state (e.g. clicking phrase from Phrasebook/History to translate)
  const [panelSourceText, setPanelSourceText] = useState<string>('');
  const [panelSourceLang, setPanelSourceLang] = useState<string>('auto');
  const [panelTargetLang, setPanelTargetLang] = useState<string>('es');

  // Handle dark mode class on <html> and <body>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      saveThemePreference('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      saveThemePreference('light');
    }
  }, [isDark]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setRealIsOnline(true);
    const handleOffline = () => setRealIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshHistoryCount = () => {
    setHistoryCount(getTranslationHistory().length);
  };

  const handleToggleOnlineMode = () => {
    setForceOfflineSimulation((prev) => !prev);
  };

  const handleSelectPhraseToTranslate = (text: string, sLang: string, tLang: string) => {
    setPanelSourceText(text);
    setPanelSourceLang(sLang);
    setPanelTargetLang(tLang);
    setActiveTab('translator');
  };

  return (
    <div className="min-h-screen bg-neutral-100/60 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      {/* Navbar adhering to the single-row, 3-zone contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
        isOnline={effectiveIsOnline}
        onToggleOnlineMode={handleToggleOnlineMode}
        historyCount={historyCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Offline Banner when offline */}
        <OfflineBanner isOnline={effectiveIsOnline} cacheCount={historyCount} />

        {/* Dynamic Tab View */}
        {activeTab === 'translator' && (
          <TranslatorPanel
            isOnline={effectiveIsOnline}
            onHistoryUpdate={refreshHistoryCount}
            initialSourceText={panelSourceText}
            initialSourceLang={panelSourceLang}
            initialTargetLang={panelTargetLang}
          />
        )}

        {activeTab === 'phrasebook' && (
          <PhrasebookView onSelectPhraseToTranslate={handleSelectPhraseToTranslate} />
        )}

        {activeTab === 'history' && (
          <HistoryView
            onSelectToTranslate={handleSelectPhraseToTranslate}
            onHistoryChanged={refreshHistoryCount}
          />
        )}

        {activeTab === 'voice' && <VoiceConversationMode />}
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-neutral-200/80 bg-white/50 dark:border-neutral-800/80 dark:bg-neutral-950/50 py-6 mt-12 transition-colors">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              Lumina Translate
            </span>
            <span>—</span>
            <span>Minimalist Multilingual Engine with Offline Cache</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  effectiveIsOnline ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
              {effectiveIsOnline ? 'Online Engine Active' : 'Offline Cache Active'}
            </span>
            <span>•</span>
            <span>40+ Languages Supported</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
