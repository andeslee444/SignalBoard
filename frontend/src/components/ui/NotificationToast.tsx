'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationToastProps {
  notification: Notification | null;
  onDismiss: () => void;
}

export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  useEffect(() => {
    if (notification && notification.duration) {
      const timer = setTimeout(onDismiss, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  const typeColors = {
    info: 'from-blue-400 to-cyan-400',
    success: 'from-green-400 to-emerald-400',
    warning: 'from-orange-400 to-yellow-400',
    error: 'from-red-400 to-pink-400',
  };

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <GlassCard className="p-4 pr-12">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full bg-gradient-to-br ${typeColors[notification.type]}`}>
                <Bell size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{notification.title}</h4>
                {notification.message && (
                  <p className="text-sm opacity-70 mt-1">{notification.message}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={onDismiss}
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Global notification manager
class NotificationManager {
  private listeners: Set<(notification: Notification | null) => void> = new Set();
  private currentNotification: Notification | null = null;

  subscribe(listener: (notification: Notification | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  show(notification: Omit<Notification, 'id'>) {
    this.currentNotification = {
      ...notification,
      id: Date.now().toString(),
      duration: notification.duration || 5000,
    };
    
    this.listeners.forEach(listener => listener(this.currentNotification));
  }

  dismiss() {
    this.currentNotification = null;
    this.listeners.forEach(listener => listener(null));
  }
}

export const notificationManager = new NotificationManager();

// Hook to use notifications
export function useNotification() {
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    return notificationManager.subscribe(setNotification);
  }, []);

  return {
    notification,
    showNotification: (n: Omit<Notification, 'id'>) => notificationManager.show(n),
    dismissNotification: () => notificationManager.dismiss(),
  };
}