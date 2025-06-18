'use client';

import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationToast, useNotification } from "@/components/ui/NotificationToast";

export function Providers({ children }: { children: React.ReactNode }) {
  const { notification, dismissNotification } = useNotification();

  return (
    <AuthProvider>
      {children}
      <NotificationToast notification={notification} onDismiss={dismissNotification} />
    </AuthProvider>
  );
}