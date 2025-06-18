import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function useRequireAuth(requiredRole?: 'trader' | 'admin') {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to home if not authenticated
      router.push('/');
    } else if (!loading && requiredRole && profile?.role !== requiredRole && profile?.role !== 'admin') {
      // Redirect if user doesn't have required role (admins can access everything)
      router.push('/');
    }
  }, [user, profile, loading, requiredRole, router]);

  return { user, profile, loading };
}