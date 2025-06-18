'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthForm } from '@/hooks/useAuthForm';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
}

export function SignInModal({ isOpen, onClose, onSwitchToSignUp }: SignInModalProps) {
  const { signIn } = useAuth();
  const { errors, setErrors, validateForm, checkRateLimit, sanitizeFormData, isSubmitting, setIsSubmitting } = useAuthForm();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const formData = { email, password };
    if (!validateForm(formData)) return;

    // Check rate limit
    if (!checkRateLimit(email)) return;

    // Sanitize input
    const sanitized = sanitizeFormData(formData);

    setIsSubmitting(true);
    try {
      await signIn(sanitized.email, password);
      onClose();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Failed to sign in' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={onClose}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <GlassCard
                className="w-full max-w-md p-8"
                hoverable={false}
              >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Sign In
                </h2>
                <button
                  onClick={onClose}
                  className="glass rounded-full p-2 hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm opacity-70 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="trader@signalboard.io"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg 
                               focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm opacity-70 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg 
                               focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {errors.form && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                  >
                    {errors.form}
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg 
                           font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>

                {/* Divider */}
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#0a0a0a] opacity-70">or</span>
                  </div>
                </div>

                {/* Demo Account */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail('demo@signalboard.io');
                    setPassword('demo123');
                  }}
                  className="w-full py-3 glass glass-hover rounded-lg text-sm"
                >
                  Use Demo Account
                </button>

                {/* Switch to Sign Up */}
                <p className="text-center text-sm opacity-70">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToSignUp}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </GlassCard>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}