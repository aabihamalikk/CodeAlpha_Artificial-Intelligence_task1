import React from 'react';
import { WifiOff, Database, CheckCircle2 } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  cacheCount: number;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, cacheCount }) => {
  if (isOnline) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-900 shadow-xs dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-200 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-200/60 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
            <WifiOff className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold">Offline Mode Active</p>
            <p className="text-[11px] opacity-85">
              You can still search phrases, listen to pronunciation, and access {cacheCount} cached translations.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium bg-amber-200/50 dark:bg-amber-900/50 px-2.5 py-1 rounded-md">
          <Database className="h-3.5 w-3.5" />
          <span>Local Cache Ready</span>
        </div>
      </div>
    </div>
  );
};
