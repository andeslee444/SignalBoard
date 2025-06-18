'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Catalyst } from '@/types/catalyst';
import { notificationManager } from '@/components/ui/NotificationToast';

export function useCatalysts() {
  const [catalysts, setCatalysts] = useState<Catalyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchCatalysts();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('catalysts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'catalysts',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCatalyst = payload.new as Catalyst;
            setCatalysts(prev => [...prev, newCatalyst]);
            
            // Show notification for new catalyst
            notificationManager.show({
              type: 'info',
              title: 'New Catalyst Added',
              message: `${newCatalyst.ticker}: ${newCatalyst.title}`,
              duration: 5000,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedCatalyst = payload.new as Catalyst;
            
            setCatalysts(prev => {
              const oldCatalyst = prev.find(c => c.id === updatedCatalyst.id);
              
              // Check if impact score significantly changed
              if (oldCatalyst && Math.abs((oldCatalyst.impact_score || 0) - (updatedCatalyst.impact_score || 0)) > 0.2) {
                notificationManager.show({
                  type: 'warning',
                  title: 'Catalyst Updated',
                  message: `${updatedCatalyst.ticker} impact score changed significantly`,
                  duration: 5000,
                });
              }
              
              return prev.map(c => c.id === updatedCatalyst.id ? updatedCatalyst : c);
            });
          } else if (payload.eventType === 'DELETE') {
            setCatalysts(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // supabase client is stable, fetchCatalysts doesn't need to be in deps

  async function fetchCatalysts() {
    try {
      setLoading(true);
      
      // Fetch catalysts for the next 30 days
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from('catalysts')
        .select('*')
        .gte('event_date', today.toISOString())
        .lte('event_date', thirtyDaysFromNow.toISOString())
        .order('event_date', { ascending: true });

      if (error) throw error;

      setCatalysts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch catalysts');
    } finally {
      setLoading(false);
    }
  }

  return { catalysts, loading, error, refetch: fetchCatalysts };
}