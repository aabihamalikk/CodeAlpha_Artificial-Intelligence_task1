import React from 'react';
import { Sun, Moon, Wifi, WifiOff, Bookmark, History, Languages, Mic2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'translator' | 'phrasebook' | 'history' | 'voice';
  setActiveTab: (tab: 'translator' | 'phrasebook' | 'history' | 'voice') => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  isOnline: boolean;
  onToggleOnlineMode?: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  isOnline,
  onToggleOnlineMode,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/90 transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold text-lg shadow-sm">
            <span className="font-serif-display italic text-xl">L</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
            Lumina Translate
          </span>
        </div>

        {/* Navigation Zone */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-neutral-200/80 bg-neutral-100/70 p-1 dark:border-neutral-800 dark:bg-neutral-900/70 text-sm font-medium">
          <button
            onClick={() => setActiveTab('translator')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 transition-all whitespace-nowrap ${
              activeTab === 'translator'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-50 font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
            }`}
          >
            <Languages className="h-4 w-4" />
            <span>Translator</span>
          </button>

          <button
            onClick={() => setActiveTab('phrasebook')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 transition-all whitespace-nowrap ${
              activeTab === 'phrasebook'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-50 font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
            }`}
          >
            <Bookmark className="h-4 w-4" />
            <span>Phrasebook</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-50 font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
            }`}
          >
            <History className="h-4 w-4" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="ml-0.5 rounded-full bg-neutral-200 px-1.5 py-0.2 text-[11px] font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 transition-all whitespace-nowrap ${
              activeTab === 'voice'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-50 font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
            }`}
          >
            <Mic2 className="h-4 w-4" />
            <span>Live Voice</span>
          </button>
        </nav>

        {/* Actions Zone */}
        <div className="flex items-center gap-2">
          {/* Online/Offline Mode Toggle Button */}
          <button
            onClick={onToggleOnlineMode}
            title={isOnline ? 'Currently Online. Click to test Offline Mode' : 'Currently Offline. Click to reconnect'}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer select-none active:scale-95 ${
              isOnline
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-950/80 dark:text-amber-200 ring-2 ring-amber-400/30'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />
                <span>Offline Mode</span>
              </>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle dark mode"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100 active:scale-95"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-neutral-700" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation tab bar */}
      <div className="flex md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/90 px-2 py-1.5 justify-around text-xs font-medium">
        <button
          onClick={() => setActiveTab('translator')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-md ${
            activeTab === 'translator'
              ? 'text-neutral-900 dark:text-neutral-50 font-bold'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <Languages className="h-4 w-4" />
          <span>Translate</span>
        </button>
        <button
          onClick={() => setActiveTab('phrasebook')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-md ${
            activeTab === 'phrasebook'
              ? 'text-neutral-900 dark:text-neutral-50 font-bold'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>Phrasebook</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-md ${
            activeTab === 'history'
              ? 'text-neutral-900 dark:text-neutral-50 font-bold'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <History className="h-4 w-4" />
          <span>History ({historyCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-md ${
            activeTab === 'voice'
              ? 'text-neutral-900 dark:text-neutral-50 font-bold'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <Mic2 className="h-4 w-4" />
          <span>Voice</span>
        </button>
      </div>
    </header>
  );
};
