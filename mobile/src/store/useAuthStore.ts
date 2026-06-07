import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const customStorage = {
  getItem: async (name: string) => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(name);
      }
      return await SecureStore.getItemAsync(name);
    } catch (e) {
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(name, value);
      } else {
        await SecureStore.setItemAsync(name, value);
      }
    } catch (e) {}
  },
  removeItem: async (name: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(name);
      } else {
        await SecureStore.deleteItemAsync(name);
      }
    } catch (e) {}
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
      storage: createJSONStorage(() => customStorage),
    }
  )
);
