'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

interface PredictionResponse {
  catalyst_id?: string;
  impact_prediction: number;
  confidence_score: number;
  price_movement_range: {
    lower_bound: number;
    upper_bound: number;
  };
  risk_factors: string[];
  similar_historical_events: Array<{
    ticker: string;
    event_date: string;
    actual_movement: number;
    similarity_score: number;
  }>;
}

interface UseMLPredictionReturn {
  getPrediction: (catalystId: string) => Promise<PredictionResponse | null>;
  loading: boolean;
  error: string | null;
}

export function useMLPrediction(): UseMLPredictionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const getPrediction = useCallback(async (catalystId: string): Promise<PredictionResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      // First check if we have a cached prediction
      const { data: existingPrediction } = await supabase
        .from('ml_predictions')
        .select('*')
        .eq('catalyst_id', catalystId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // If prediction exists and is less than 1 hour old, return it
      if (existingPrediction && 
          new Date(existingPrediction.created_at).getTime() > Date.now() - 3600000) {
        setLoading(false);
        return {
          catalyst_id: catalystId,
          impact_prediction: Number(existingPrediction.impact_prediction),
          confidence_score: Number(existingPrediction.confidence_score),
          price_movement_range: {
            lower_bound: Number(existingPrediction.price_range_lower),
            upper_bound: Number(existingPrediction.price_range_upper)
          },
          risk_factors: existingPrediction.risk_factors || [],
          similar_historical_events: [] // Would need to store/fetch separately
        };
      }

      // Otherwise, call the Edge Function for a fresh prediction
      const { data, error: fnError } = await supabase.functions.invoke('predict-catalyst', {
        body: { catalyst_id: catalystId }
      });

      if (fnError) throw fnError;

      setLoading(false);
      return data as PredictionResponse;

    } catch (err) {
      console.error('ML Prediction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get prediction');
      setLoading(false);
      return null;
    }
  }, [supabase]);

  return { getPrediction, loading, error };
}

// Hook for getting predictions for multiple catalysts
export function useBatchMLPredictions() {
  const supabase = createClient();
  const [predictions, setPredictions] = useState<Map<string, PredictionResponse>>(new Map());
  const [loading, setLoading] = useState(false);

  const getPredictionsForCatalysts = useCallback(async (catalystIds: string[]) => {
    if (catalystIds.length === 0) return;

    setLoading(true);

    try {
      // Fetch existing predictions from database
      const { data: existingPredictions } = await supabase
        .from('ml_predictions')
        .select('*')
        .in('catalyst_id', catalystIds)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

      const predictionsMap = new Map<string, PredictionResponse>();
      const needsFresh: string[] = [];

      // Process existing predictions
      if (existingPredictions) {
        existingPredictions.forEach(pred => {
          predictionsMap.set(pred.catalyst_id.toString(), {
            catalyst_id: pred.catalyst_id.toString(),
            impact_prediction: Number(pred.impact_prediction),
            confidence_score: Number(pred.confidence_score),
            price_movement_range: {
              lower_bound: Number(pred.price_range_lower),
              upper_bound: Number(pred.price_range_upper)
            },
            risk_factors: pred.risk_factors || [],
            similar_historical_events: []
          });
        });
      }

      // Identify which catalysts need fresh predictions
      catalystIds.forEach(id => {
        if (!predictionsMap.has(id)) {
          needsFresh.push(id);
        }
      });

      // Fetch fresh predictions for missing ones
      if (needsFresh.length > 0) {
        // In production, we'd batch these requests
        const freshPromises = needsFresh.map(async (id) => {
          try {
            const { data } = await supabase.functions.invoke('predict-catalyst', {
              body: { catalyst_id: id }
            });
            return { id, data };
          } catch (err) {
            console.error(`Failed to get prediction for ${id}:`, err);
            return null;
          }
        });

        const freshResults = await Promise.all(freshPromises);
        freshResults.forEach(result => {
          if (result?.data) {
            predictionsMap.set(result.id, result.data);
          }
        });
      }

      setPredictions(predictionsMap);
      setLoading(false);
    } catch (err) {
      console.error('Batch prediction error:', err);
      setLoading(false);
    }
  }, [supabase]);

  return { predictions, getPredictionsForCatalysts, loading };
}