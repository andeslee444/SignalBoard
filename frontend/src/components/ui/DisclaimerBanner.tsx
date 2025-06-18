'use client';

import { AlertCircle } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface DisclaimerBannerProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function DisclaimerBanner({ variant = 'default', className = '' }: DisclaimerBannerProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-xs opacity-70 ${className}`}>
        <AlertCircle size={12} />
        <span>For educational purposes only. Not financial advice.</span>
      </div>
    );
  }

  return (
    <GlassCard className={`mb-4 p-3 border-yellow-500/20 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-yellow-500 mb-1">Disclaimer</p>
          <p className="opacity-70">
            This platform is for educational and informational purposes only. 
            Predictions and analysis provided are not financial advice. 
            Always conduct your own research and consult with qualified financial advisors before making investment decisions.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}