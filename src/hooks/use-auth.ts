'use client';
import { useAuthStore } from '@/store/auth-store';
import { useEffect, useState } from 'react';
import type { User, Role } from '@/lib/types';

interface AuthHookState {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<User | null>;
  logout: () => void;
  isLoading: boolean;
}

export const useAuth = (): AuthHookState => {
  const { user, role, isAuthenticated, login, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe(
      (state) => {
        if (state.user !== undefined) { 
          setIsLoading(false);
        }
      }
    );
    if (useAuthStore.getState().user !== undefined) {
      setIsLoading(false);
    }
    return () => unsubscribe();
  }, []);
  
  if (isLoading && typeof window !== 'undefined') { 
     const hydratedState = useAuthStore.getState();
     return { 
        user: hydratedState.user, 
        role: hydratedState.role, 
        isAuthenticated: hydratedState.isAuthenticated, 
        login, 
        logout, 
        isLoading: true 
    };
  }

  return { user, role, isAuthenticated, login, logout, isLoading: false };
};
