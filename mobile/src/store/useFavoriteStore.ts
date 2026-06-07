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

export interface FavoriteItem {
  id: string; // Unique ID (usually product_id)
  productId: number;
  name: string;
  price: number;
  image: string;
}

interface FavoriteState {
  items: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addFavorite: (newItem) => {
        set((state) => {
          const exists = state.items.some((item) => item.id === newItem.id);
          if (exists) return state;
          return { items: [...state.items, newItem] };
        });
      },

      removeFavorite: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      isFavorite: (id) => {
        return get().items.some((item) => item.id === id);
      },

      clearFavorites: () => set({ items: [] }),
    }),
    {
      name: 'techmart-favorite-storage',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
