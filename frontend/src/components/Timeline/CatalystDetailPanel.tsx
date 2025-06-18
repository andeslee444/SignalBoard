'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Catalyst } from '@/types/catalyst';
import { MLPredictionDisplay } from './MLPredictionDisplay';
import { WatchlistButton } from '../catalyst/WatchlistButton';
import { useAuth } from '@/contexts/AuthContext';

interface CatalystDetailPanelProps {
  catalyst: Catalyst | null;
  onClose: () => void;
}

export function CatalystDetailPanel({ catalyst, onClose }: CatalystDetailPanelProps) {
  const { user } = useAuth();
  
  if (!catalyst) return null;

  const impactPercentage = catalyst.impact_score ? Math.round(catalyst.impact_score * 100) : 0;
  const confidencePercentage = catalyst.confidence_score ? Math.round(catalyst.confidence_score * 100) : 0;

  return (
    <AnimatePresence>
      {catalyst && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed right-0 top-0 h-full w-full md:w-[400px] z-50 p-4"
        >
          <GlassCard className="h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-xs font-mono opacity-70 uppercase">
                  {catalyst.type} • {catalyst.ticker}
                </span>
                <h2 className="text-xl font-semibold mt-1">
                  {catalyst.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="glass rounded-full p-2 hover:bg-white/10 transition-colors"
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </div>

            {/* Event Date */}
            <div className="mb-6">
              <p className="text-sm opacity-70 mb-1">Event Date</p>
              <p className="text-lg font-medium">
                {format(new Date(catalyst.event_date), 'MMMM d, yyyy')}
              </p>
              <p className="text-sm opacity-50">
                {format(new Date(catalyst.event_date), 'EEEE, h:mm a')}
              </p>
            </div>

            {/* Impact & Confidence Scores */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm opacity-70 mb-2">Impact Score</p>
                <div className="relative">
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        catalyst.impact_score && catalyst.impact_score >= 0.8 ? 'bg-red-500' :
                        catalyst.impact_score && catalyst.impact_score >= 0.6 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${impactPercentage}%` }}
                    />
                  </div>
                  <p className="text-2xl font-bold mt-2">{impactPercentage}%</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm opacity-70 mb-2">Confidence</p>
                <div className="relative">
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${confidencePercentage}%` }}
                    />
                  </div>
                  <p className="text-2xl font-bold mt-2">{confidencePercentage}%</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {catalyst.description && (
              <div className="mb-6">
                <p className="text-sm opacity-70 mb-2">Summary</p>
                <p className="text-sm leading-relaxed">
                  {catalyst.description}
                </p>
              </div>
            )}

            {/* Metadata */}
            {catalyst.metadata && Object.keys(catalyst.metadata).length > 0 && (
              <div className="mb-6">
                <p className="text-sm opacity-70 mb-2">Additional Details</p>
                <div className="space-y-2">
                  {Object.entries(catalyst.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="opacity-70">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="font-mono">
                        {typeof value === 'number' && key.includes('cap') 
                          ? `$${(value / 1e9).toFixed(1)}B`
                          : String(value)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <WatchlistButton ticker={catalyst.ticker} className="w-full justify-center" />
              
              <button 
                className="w-full glass glass-hover rounded-lg py-3 px-4 text-sm font-medium"
                disabled={!user}
                title={!user ? 'Sign in to set alerts' : 'Set alert for this catalyst'}
              >
                🔔 Set Alert
              </button>
              
              <button 
                className="w-full glass glass-hover rounded-lg py-3 px-4 text-sm font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20"
                disabled={!user}
                title={!user ? 'Sign in to play prediction game' : 'Make your prediction'}
              >
                🎮 Launch Prediction Game
              </button>
            </div>

            {/* ML Predictions */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <MLPredictionDisplay 
                catalystId={catalyst.id} 
                ticker={catalyst.ticker} 
              />
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}