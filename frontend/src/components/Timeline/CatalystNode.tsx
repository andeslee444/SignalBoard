'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { CatalystNode as CatalystNodeType } from '@/types/catalyst';
import { format } from 'date-fns';

interface CatalystNodeProps {
  catalyst: CatalystNodeType;
  isSelected?: boolean;
  onClick?: (catalyst: CatalystNodeType) => void;
}

export function CatalystNode({ catalyst, isSelected, onClick }: CatalystNodeProps) {
  // Determine glow color based on impact score (updated thresholds)
  const getGlowType = (score: number | null) => {
    if (!score) return 'none';
    if (score >= 0.7) return 'danger';  // ≥70% - High impact
    if (score >= 0.4) return 'warning'; // 40-70% - Medium impact
    return 'primary'; // <40% - Low impact (cyan)
  };

  // Get catalyst type icon
  const getTypeIcon = (type: string) => {
    const icons = {
      earnings: '📊',
      fda: '💊',
      sec: '📋',
      fed_rates: '🏦',
    };
    return icons[type as keyof typeof icons] || '📌';
  };

  return (
    <motion.div
      className="catalyst-node"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layoutId={catalyst.id}
    >
      <GlassCard
        glow={getGlowType(catalyst.impact_score)}
        className={`
          cursor-pointer select-none
          min-w-[200px] max-w-[300px]
          ${isSelected ? 'ring-2 ring-white/50' : ''}
          ${catalyst.impact_score && catalyst.impact_score >= 0.7 ? 'pulse-danger' : ''}
        `}
        onClick={() => onClick?.(catalyst)}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="text-2xl" role="img" aria-label={catalyst.type}>
            {getTypeIcon(catalyst.type)}
          </span>
          <span className="text-xs font-mono opacity-70">
            {catalyst.ticker}
          </span>
        </div>
        
        <h3 className="text-sm font-semibold mb-1 line-clamp-2">
          {catalyst.title}
        </h3>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs opacity-70">
            {format(new Date(catalyst.event_date), 'MMM d')}
          </span>
          
          <div className="flex items-center gap-2">
            {catalyst.impact_score && (
              <div 
                className="w-16 h-1 bg-white/20 rounded-full overflow-hidden"
                title={`Impact: ${Math.round(catalyst.impact_score * 100)}%`}
              >
                <div 
                  className={`h-full transition-all duration-500 ${
                    catalyst.impact_score >= 0.7 ? 'bg-red-500' :
                    catalyst.impact_score >= 0.4 ? 'bg-orange-500' :
                    'bg-cyan-400'
                  }`}
                  style={{ width: `${catalyst.impact_score * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}