import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES, POPULAR_LANGUAGES, Language } from '../data/languages';

interface LanguageSelectorProps {
  selectedCode: string;
  onSelect: (code: string) => void;
  isSource?: boolean;
  label?: string;
  disabledCodes?: string[];
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedCode,
  onSelect,
  isSource = false,
  label,
  disabledCodes = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const availableLanguages = isSource
    ? SUPPORTED_LANGUAGES
    : SUPPORTED_LANGUAGES.filter((lang) => lang.code !== 'auto');

  const selectedLang =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === selectedCode) ||
    (isSource ? SUPPORTED_LANGUAGES[0] : SUPPORTED_LANGUAGES[1]);

  const filteredLanguages = availableLanguages.filter((lang) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800 shadow-xs hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-700 dark:hover:bg-neutral-850 transition-all focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100"
      >
        {isSource && selectedCode === 'auto' ? (
          <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Detect Language</span>
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {selectedLang.name}
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-normal">
              ({selectedLang.nativeName})
            </span>
          </div>
        )}
        <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform duration-200" />
      </button>

      {/* Full Language Picker Dropdown */}
      {isOpen && (
        <div
          ref={modalRef}
          className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Search bar */}
          <div className="relative mb-2.5">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 40+ languages..."
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-8 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Popular Fast Tags */}
          {!searchQuery && (
            <div className="mb-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5 px-1">
                Popular
              </span>
              <div className="flex flex-wrap gap-1">
                {isSource && (
                  <button
                    onClick={() => {
                      onSelect('auto');
                      setIsOpen(false);
                    }}
                    className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                      selectedCode === 'auto'
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    }`}
                  >
                    Auto Detect
                  </button>
                )}
                {POPULAR_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    disabled={disabledCodes.includes(lang.code)}
                    onClick={() => {
                      onSelect(lang.code);
                      setIsOpen(false);
                    }}
                    className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                      selectedCode === lang.code
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                        : disabledCodes.includes(lang.code)
                        ? 'opacity-40 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Languages List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
            {filteredLanguages.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400">
                No matching languages found.
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = selectedCode === lang.code;
                const isDisabled = disabledCodes.includes(lang.code);

                return (
                  <button
                    key={lang.code}
                    disabled={isDisabled}
                    onClick={() => {
                      onSelect(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold'
                        : isDisabled
                        ? 'opacity-40 cursor-not-allowed text-neutral-400'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{lang.name}</span>
                      <span
                        className={`text-[11px] ${
                          isSelected
                            ? 'text-neutral-300 dark:text-neutral-600'
                            : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                      >
                        {lang.nativeName}
                      </span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
