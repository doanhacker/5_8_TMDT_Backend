import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// Safe memory storage to prevent crashes in Expo Go
const memoryStorageItems: Record<string, string> = {};

const safeStorage = {
  getItem: (name: string) => {
    return memoryStorageItems[name] || null;
  },
  setItem: (name: string, value: string) => {
    memoryStorageItems[name] = value;
  },
  removeItem: (name: string) => {
    delete memoryStorageItems[name];
  },
};

interface User {
  id?: number;
  email: string;
  full_name: string;
  phone_number?: string;
  role?: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      
      setAuth: (user, token) => {
        set({ user, token });
      },

      logout: () => {
        set({ user: null, token: null });
      },
    }),
    {
      name: 'techmart-auth-storage',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
