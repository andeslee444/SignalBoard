'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';

interface WatchlistButtonProps {
  ticker: string;
  className?: string;
}

export function WatchlistButton({ ticker, className = '' }: WatchlistButtonProps) {
  const { user } = useAuth();
  const [isWatching, setIsWatching] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      checkWatchlistStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ticker]); // checkWatchlistStatus is defined inline and uses current values

  const checkWatchlistStatus = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('watchlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('ticker', ticker)
      .single();

    setIsWatching(!!data && !error);
  };

  const toggleWatchlist = async () => {
    if (!user) {
      // Could open sign in modal here
      alert('Please sign in to use watchlist');
      return;
    }

    setLoading(true);

    try {
      if (isWatching) {
        // Remove from watchlist
        const { error } = await supabase
          .from('watchlists')
          .delete()
          .eq('user_id', user.id)
          .eq('ticker', ticker);

        if (!error) {
          setIsWatching(false);
        }
      } else {
        // Add to watchlist
        const { error } = await supabase
          .from('watchlists')
          .insert({
            user_id: user.id,
            ticker: ticker,
          });

        if (!error) {
          setIsWatching(true);
        }
      }
    } catch (err) {
      console.error('Watchlist error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWatchlist}
      disabled={loading}
      className={`flex items-center gap-2 glass glass-hover rounded-lg px-3 py-2 text-sm transition-all ${
        isWatching ? 'bg-purple-500/20 border-purple-500/50' : ''
      } ${className}`}
      title={isWatching ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {isWatching ? <EyeOff size={16} /> : <Eye size={16} />}
      {isWatching ? 'Watching' : 'Watch'}
    </button>
  );
}