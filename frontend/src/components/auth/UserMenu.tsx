'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Settings, Trophy, Eye, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '../ui/GlassCard';

export function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || !profile) return null;

  const roleColors = {
    admin: 'from-red-400 to-orange-400',
    trader: 'from-purple-400 to-pink-400',
    guest: 'from-gray-400 to-gray-500',
  };

  const roleLabels = {
    admin: 'Admin',
    trader: 'Trader',
    guest: 'Guest',
  };

  return (
    <div className="relative">
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 glass glass-hover rounded-full px-4 py-2"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={profile.avatar_url} 
              alt={profile.username || 'User'} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold">
              {(profile.username || profile.email)?.[0]?.toUpperCase()}
            </span>
          )}
        </div>

        {/* Username/Email */}
        <span className="text-sm font-medium">
          {profile.username || profile.email.split('@')[0]}
        </span>

        {/* Role Badge */}
        <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${roleColors[profile.role]} text-white`}>
          {roleLabels[profile.role]}
        </span>

        <ChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-64 z-50"
            >
              <GlassCard className="py-2">
                {/* Profile Info */}
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-medium">{profile.full_name || 'Trader'}</p>
                  <p className="text-xs opacity-70">{profile.email}</p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="text-center">
                      <p className="text-xs opacity-50">Accuracy</p>
                      <p className="text-lg font-bold text-green-400">
                        {Math.round((profile.prediction_accuracy || 0.5) * 100)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs opacity-50">Predictions</p>
                      <p className="text-lg font-bold">
                        {profile.total_predictions || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <MenuItem
                    icon={<User size={16} />}
                    label="Profile Settings"
                    onClick={() => {
                      // TODO: Open profile settings
                      setIsOpen(false);
                    }}
                  />
                  
                  <MenuItem
                    icon={<Trophy size={16} />}
                    label="Leaderboard"
                    onClick={() => {
                      // TODO: Navigate to leaderboard
                      setIsOpen(false);
                    }}
                  />
                  
                  <MenuItem
                    icon={<Eye size={16} />}
                    label="Watchlist"
                    onClick={() => {
                      // TODO: Open watchlist
                      setIsOpen(false);
                    }}
                  />
                  
                  <MenuItem
                    icon={<Settings size={16} />}
                    label="Settings"
                    onClick={() => {
                      // TODO: Open settings
                      setIsOpen(false);
                    }}
                  />
                  
                  {profile.role === 'admin' && (
                    <MenuItem
                      icon={<Settings size={16} />}
                      label="Admin Panel"
                      className="text-orange-400"
                      onClick={() => {
                        // TODO: Navigate to admin
                        setIsOpen(false);
                      }}
                    />
                  )}
                </div>

                {/* Sign Out */}
                <div className="border-t border-white/10 py-2">
                  <MenuItem
                    icon={<LogOut size={16} />}
                    label="Sign Out"
                    className="text-red-400"
                    onClick={async () => {
                      await signOut();
                      setIsOpen(false);
                    }}
                  />
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

function MenuItem({ icon, label, onClick, className = '' }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors ${className}`}
    >
      <span className="opacity-70">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}