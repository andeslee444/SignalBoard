'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { exponentialBackoff } from '@/utils/exponentialBackoff';
import { notificationManager } from '@/components/ui/NotificationToast';

type UserRole = 'trader' | 'admin' | 'guest';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  role: UserRole;
  portfolio_public: boolean;
  prediction_accuracy: number;
  total_predictions: number;
  successful_predictions: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const supabase = createClient();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
        scheduleSessionRefresh(session);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
        
        // Schedule refresh for new sessions
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          scheduleSessionRefresh(session);
        }
      } else {
        setProfile(null);
        
        // Clear refresh timer on sign out
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies omitted intentionally - supabase client is stable and scheduleSessionRefresh is memoized

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Session refresh with exponential backoff
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await exponentialBackoff(
        async () => {
          const result = await supabase.auth.refreshSession();
          if (result.error) throw result.error;
          return result;
        },
        {
          maxRetries: 3,
          onRetry: (attempt, error) => {
            console.warn(`Session refresh attempt ${attempt} failed:`, error);
          }
        }
      );

      if (session) {
        setSession(session);
        setUser(session.user);
        scheduleSessionRefresh(session);
      }
    } catch (error) {
      console.error('Failed to refresh session after retries:', error);
      notificationManager.show({
        type: 'error',
        title: 'Session Expired',
        message: 'Please sign in again to continue',
        duration: 5000,
      });
      await signOut();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]); // scheduleSessionRefresh and signOut are stable functions defined in the component

  // Schedule session refresh before expiry
  const scheduleSessionRefresh = useCallback((session: Session) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Refresh 5 minutes before token expires
    const expiresAt = session.expires_at;
    if (!expiresAt) return;

    const expiresIn = expiresAt * 1000 - Date.now();
    const refreshIn = Math.max(expiresIn - 5 * 60 * 1000, 0);

    if (refreshIn > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshSession();
      }, refreshIn);
    }
  }, [refreshSession]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}