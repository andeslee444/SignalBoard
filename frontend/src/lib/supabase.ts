import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type exports for database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          prediction_score: number
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          prediction_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          prediction_score?: number
          created_at?: string
        }
      }
      catalysts: {
        Row: {
          id: string
          type: 'fda' | 'earnings' | 'fed_rates' | 'macro'
          ticker: string
          title: string
          description: string | null
          event_date: string
          impact_score: number | null
          confidence_score: number | null
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'fda' | 'earnings' | 'fed_rates' | 'macro'
          ticker: string
          title: string
          description?: string | null
          event_date: string
          impact_score?: number | null
          confidence_score?: number | null
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'fda' | 'earnings' | 'fed_rates' | 'macro'
          ticker?: string
          title?: string
          description?: string | null
          event_date?: string
          impact_score?: number | null
          confidence_score?: number | null
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          broker: string
          holdings: Record<string, any>
          last_sync: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          broker: string
          holdings: Record<string, any>
          last_sync?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          broker?: string
          holdings?: Record<string, any>
          last_sync?: string
          created_at?: string
        }
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          catalyst_id: string
          predicted_direction: 'up' | 'down' | null
          predicted_percentage: number | null
          timeframe_days: number
          actual_percentage: number | null
          score: number | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          catalyst_id: string
          predicted_direction?: 'up' | 'down' | null
          predicted_percentage?: number | null
          timeframe_days: number
          actual_percentage?: number | null
          score?: number | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          catalyst_id?: string
          predicted_direction?: 'up' | 'down' | null
          predicted_percentage?: number | null
          timeframe_days?: number
          actual_percentage?: number | null
          score?: number | null
          created_at?: string
          resolved_at?: string | null
        }
      }
      catalyst_outcomes: {
        Row: {
          id: string
          catalyst_id: string
          ticker: string
          price_before: number | null
          price_after: number | null
          percentage_change: number | null
          days_after: number | null
          created_at: string
        }
        Insert: {
          id?: string
          catalyst_id: string
          ticker: string
          price_before?: number | null
          price_after?: number | null
          percentage_change?: number | null
          days_after?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          catalyst_id?: string
          ticker?: string
          price_before?: number | null
          price_after?: number | null
          percentage_change?: number | null
          days_after?: number | null
          created_at?: string
        }
      }
    }
  }
}