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

export interface CartItem {
  id: string; // Unique ID (usually product_id + variant_id)
  productId: number;
  variantId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  config?: string;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToCart: (newItem) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.id === newItem.id
          );

          if (existingItemIndex >= 0) {
            // Update quantity if item exists
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
            return { items: updatedItems };
          } else {
            // Add new item
            return { items: [...state.items, newItem] };
          }
        });
      },

      removeFromCart: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.id !== id) };
          }
          return {
            items: state.items.map((item) =>
              item.id === id ? { ...item, quantity } : item
            ),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'techmart-cart-storage',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
