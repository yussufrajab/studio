import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Role } from '@/lib/types';
import { ROLES } from '@/lib/constants';

interface AuthState {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<User | null>;
  logout: () => void;
  setUserManually: (user: User) => void; 
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      login: async (username, password) => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });

          if (!response.ok) {
            return null;
          }

          const user: User = await response.json();
          set({ user, role: user.role, isAuthenticated: true });
          return user;
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      },
      logout: () => {
        set({ user: null, role: null, isAuthenticated: false });
      },
      setUserManually: (user: User) => {
        set({ user, role: user.role, isAuthenticated: true });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage), 
    }
  )
);
