import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Role } from '@/lib/types';
import { USERS } from '@/lib/constants';

interface AuthState {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (username: string) => boolean;
  logout: () => void;
  setUserManually: (user: User) => void; // For demo role switching
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      login: (username) => {
        const foundUser = USERS.find(u => u.username === username);
        if (foundUser) {
          set({ user: foundUser, role: foundUser.role, isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null, role: null, isAuthenticated: false });
      },
      setUserManually: (user: User) => { // For demo purposes to easily switch roles
        set({ user, role: user.role, isAuthenticated: true });
      }
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
