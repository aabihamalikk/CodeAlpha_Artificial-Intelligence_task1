import React, { useState } from 'react';
import {
  History,
  Star,
  Trash2,
  Copy,
  Check,
  Volume2,
  ArrowRight,
  Download,
  Search,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { TranslationResult } from '../types';
import { getLanguageName, getLanguageSpeechCode } from '../data/languages';
import {
  getTranslationHistory,
  deleteHistoryItem,
  toggleFavoriteHistoryItem,
  clearAllHistory,
} from '../utils/storage';

interface HistoryViewProps {
  onSelectToTranslate: (text: string, sourceLang: string, targetLang: string) => void;
  onHistoryChanged: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onSelectToTranslate,
  onHistoryChanged,
}) => {
  const [historyItems, setHistoryItems] = useState<TranslationResult[]>(getTranslationHistory());
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshHistory = () => {
    setHistoryItems(getTranslationHistory());
    onHistoryChanged();
  };

  const handleToggleFavorite = (id: string) => {
    const updated = toggleFavoriteHistoryItem(id);
    setHistoryItems(updated);
    onHistoryChanged();
  };

  const handleDelete = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistoryItems(updated);
    onHistoryChanged();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all translation history?')) {
      clearAllHistory();
      refreshHistory();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePlaySpeech = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageSpeechCode(langCode);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(historyItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lumina_translations_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredHistory = historyItems.filter((item) => {
    if (favoritesOnly && !item.isFavorite) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.sourceText.toLowerCase().includes(q) ||
      item.translatedText.toLowerCase().includes(q) ||
      getLanguageName(item.sourceLang).toLowerCase().includes(q) ||
      getLanguageName(item.targetLang).toLowerCase().includes(q)
    );
  });

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 transition-colors">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <History className="h-5 w-5 text-neutral-500" />
            <span>Translation History & Saved Phrases</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {historyItems.length} cached translations available offline
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {historyItems.length > 0 && (
            <>
              <button
                onClick={handleExportJSON}
                title="Export history to JSON"
                className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-750 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export</span>
              </button>

              <button
                onClick={handleClearAll}
                title="Clear all history"
                className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search through saved and recent translations..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-4 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-100"
          />
        </div>

        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
            favoritesOnly
              ? 'border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
              : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800'
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-amber-400 text-amber-500' : ''}`} />
          <span>Favorites Only</span>
        </button>
      </div>

      {/* History Items List */}
      <div className="space-y-2.5">
        {filteredHistory.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-xs text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900">
            {searchQuery
              ? 'No matching translations found.'
              : favoritesOnly
              ? 'No starred translations yet. Click the star icon on any entry to save it to your favorites.'
              : 'No translation history yet. Enter any phrase above to translate.'}
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
            >
              <div className="flex-1 space-y-1.5">
                {/* Language Pair & Timestamp */}
                <div className="flex items-center gap-2 text-[11px] font-semibold text-neutral-400">
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {getLanguageName(item.sourceLang)}
                  </span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {getLanguageName(item.targetLang)}
                  </span>
                  <span>•</span>
                  <span>{formatTime(item.timestamp)}</span>
                </div>

                {/* Source and Translation */}
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  {item.sourceText}
                </p>
                <p className="text-sm font-semibold text-neutral-950 dark:text-neutral-50 line-clamp-2">
                  {item.translatedText}
                </p>

                {item.phonetic && (
                  <p className="text-[11px] font-mono-code text-neutral-500 dark:text-neutral-400">
                    {item.phonetic}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end md:self-center border-t md:border-t-0 pt-2 md:pt-0 border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() =>
                    onSelectToTranslate(item.sourceText, item.sourceLang, item.targetLang)
                  }
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-750 transition-colors"
                >
                  Translate Again
                </button>

                <button
                  onClick={() => handlePlaySpeech(item.translatedText, item.targetLang)}
                  title="Listen"
                  className="p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 rounded-md transition-colors"
                >
                  <Volume2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => handleCopy(item.translatedText, item.id)}
                  title="Copy translation"
                  className="p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 rounded-md transition-colors"
                >
                  {copiedId === item.id ? (
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>

                <button
                  onClick={() => handleToggleFavorite(item.id)}
                  title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  className="p-1.5 rounded-md transition-colors text-neutral-400 hover:text-amber-500"
                >
                  <Star
                    className={`h-4 w-4 ${
                      item.isFavorite ? 'fill-amber-400 text-amber-500' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  title="Delete from history"
                  className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
