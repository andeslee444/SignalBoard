export interface Catalyst {
  id: string;
  type: 'earnings' | 'fda' | 'sec' | 'fed_rates' | 'macro';
  ticker: string;
  title: string;
  description?: string | null;
  event_date: string;
  impact_score: number | null;
  confidence_score: number | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CatalystNode extends Catalyst {
  x?: number; // Position for timeline
  y?: number;
  width?: number;
  height?: number;
}