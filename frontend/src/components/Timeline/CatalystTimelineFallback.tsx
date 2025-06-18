'use client';

import { RefreshCw } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface CatalystTimelineFallbackProps {
  onRetry?: () => void;
}

export function CatalystTimelineFallback({ onRetry }: CatalystTimelineFallbackProps) {
  return (
    <GlassCard className="p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Timeline Temporarily Unavailable</h3>
          <p className="opacity-70 mb-4">
            We&apos;re having trouble loading the catalyst timeline. This might be due to high traffic or a temporary issue.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 
                       rounded-lg transition-colors"
            >
              Reload Timeline
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}