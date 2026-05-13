import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@workspace/api-client-react";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  images?: string | null;
  storeName?: string | null;
}

interface CartState {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      cartItems: [],
      addToCart: (product, quantity = 1) =>
        set((state) => {
          const existing = state.cartItems.find((item) => item.productId === product.id);
          if (existing) {
            return {
              cartItems: state.cartItems.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            cartItems: [
              ...state.cartItems,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity,
                images: product.images,
                storeName: product.storeName,
              },
            ],
          };
        }),
      removeFromCart: (productId) =>
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        })),
      clearCart: () => set({ cartItems: [] }),
    }),
    {
      name: "emb_cart",
    }
  )
);
