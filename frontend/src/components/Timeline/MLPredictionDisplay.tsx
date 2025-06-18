'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Clock } from 'lucide-react';
import { useMLPrediction } from '@/hooks/useMLPrediction';
import { GlassCard } from '../ui/GlassCard';

interface MLPredictionDisplayProps {
  catalystId: string;
  ticker: string;
}

export function MLPredictionDisplay({ catalystId, ticker }: MLPredictionDisplayProps) {
  const { getPrediction, loading, error } = useMLPrediction();
  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    getPrediction(catalystId).then(setPrediction);
  }, [catalystId, getPrediction]);

  if (loading) {
    return (
      <GlassCard className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded w-32 mb-2"></div>
          <div className="h-8 bg-white/20 rounded w-full mb-4"></div>
          <div className="h-4 bg-white/20 rounded w-48"></div>
        </div>
      </GlassCard>
    );
  }

  if (error || !prediction) {
    return null;
  }

  const impactPercent = Math.round(prediction.impact_prediction * 100);
  const confidencePercent = Math.round(prediction.confidence_score * 100);
  const { lower_bound, upper_bound } = prediction.price_movement_range;

  // Determine sentiment
  const expectedMovement = (lower_bound + upper_bound) / 2;
  const isBullish = expectedMovement > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            AI Prediction
          </h3>
          <span className="text-xs opacity-50">XGBoost v1.0</span>
        </div>

        {/* Impact & Confidence */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm opacity-70 mb-1">Impact Score</p>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-bold ${
                impactPercent >= 70 ? 'text-red-400' :
                impactPercent >= 40 ? 'text-orange-400' :
                'text-cyan-400'
              }`}>
                {impactPercent}%
              </span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    impactPercent >= 70 ? 'bg-red-500' :
                    impactPercent >= 40 ? 'bg-orange-500' :
                    'bg-cyan-400'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${impactPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm opacity-70 mb-1">Confidence</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-white/90">
                {confidencePercent}%
              </span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${confidencePercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Price Movement Prediction */}
        <div className="glass rounded-lg p-4">
          <p className="text-sm opacity-70 mb-2">Expected Price Movement</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isBullish ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <span className="text-lg font-semibold">
                {expectedMovement > 0 ? '+' : ''}{expectedMovement.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm opacity-70">
              Range: {lower_bound.toFixed(1)}% to {upper_bound > 0 ? '+' : ''}{upper_bound.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        {prediction.risk_factors.length > 0 && (
          <div>
            <p className="text-sm opacity-70 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Risk Factors
            </p>
            <div className="space-y-1">
              {prediction.risk_factors.map((factor: string, i: number) => (
                <div key={i} className="text-sm opacity-80 pl-6">
                  • {factor}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Historical Events */}
        {prediction.similar_historical_events.length > 0 && (
          <div>
            <p className="text-sm opacity-70 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Similar Historical Events
            </p>
            <div className="space-y-2">
              {prediction.similar_historical_events.map((event: any, i: number) => (
                <div key={i} className="glass rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold">{event.ticker}</span>
                      <span className="opacity-70 ml-2">
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={event.actual_movement > 0 ? 'text-green-400' : 'text-red-400'}>
                        {event.actual_movement > 0 ? '+' : ''}{event.actual_movement.toFixed(1)}%
                      </div>
                      <div className="text-xs opacity-50">
                        {Math.round(event.similarity_score * 100)}% match
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-xs opacity-50 italic border-t border-white/10 pt-4">
          AI predictions are for educational purposes only. Not financial advice.
        </div>
      </GlassCard>
    </motion.div>
  );
}