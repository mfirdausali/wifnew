'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { StoreProvider } from '@/src/providers/StoreProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AuthProvider>{children}</AuthProvider>
    </StoreProvider>
  );
}