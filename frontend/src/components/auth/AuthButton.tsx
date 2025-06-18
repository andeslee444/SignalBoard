'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from './UserMenu';
import { SignInModal } from './SignInModal';
import { SignUpModal } from './SignUpModal';
import { LogIn } from 'lucide-react';

export function AuthButton() {
  const { user, loading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  if (loading) {
    return (
      <div className="w-32 h-10 glass rounded-full animate-pulse" />
    );
  }

  if (user) {
    return <UserMenu />;
  }

  return (
    <>
      <button
        onClick={() => setShowSignIn(true)}
        className="flex items-center gap-2 glass glass-hover rounded-full px-4 py-2 text-sm font-medium"
      >
        <LogIn size={16} />
        Sign In
      </button>

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSwitchToSignUp={() => {
          setShowSignIn(false);
          setShowSignUp(true);
        }}
      />

      <SignUpModal
        isOpen={showSignUp}
        onClose={() => setShowSignUp(false)}
        onSwitchToSignIn={() => {
          setShowSignUp(false);
          setShowSignIn(true);
        }}
      />
    </>
  );
}