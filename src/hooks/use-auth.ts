'use client';
import { useAuthStore } from '@/store/auth-store';
import { useEffect, useState } from 'react';
import type { User, Role } from '@/lib/types';

interface AuthHookState {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (username: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

export const useAuth = (): AuthHookState => {
  const { user, role, isAuthenticated, login, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This hook ensures that we are reading the state after Zustand has hydrated from localStorage.
    // The AuthProvider should handle the initial hydration delay, but this provides an extra check.
    const unsubscribe = useAuthStore.subscribe(
      (state) => {
        if (state.user !== undefined) { // Check if hydration might be complete
          setIsLoading(false);
        }
      }
    );
    // Initial check
    if (useAuthStore.getState().user !== undefined) {
      setIsLoading(false);
    }
    return () => unsubscribe();
  }, []);
  
  // Return the live state from the store
  // If still loading, might return initial/default values to prevent hydration errors
  if (isLoading && typeof window !== 'undefined') { // Check for window to avoid SSR issues with isLoading initial state
     // This part is tricky. On initial server render, store might not be hydrated.
     // For client components, `useEffect` handles it.
     // To be safe, return a loading state or initial values.
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
