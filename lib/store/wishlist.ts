"use client";

/**
 * The anonymous wishlist store (PROMPTS.md Phase 6 item 4) — Zustand, persisted to localStorage,
 * same try/catch-guarded storage pattern as lib/store/cart.ts (Phase 5). Holds only product ids.
 *
 * This store is the SOURCE OF TRUTH only while signed out. Once signed in, the DB
 * (`wishlist_items`, via lib/actions/wishlist.ts) is the source of truth instead — the header
 * count and every wishlist toggle switch to it (see components/layout/HeaderClient.tsx and
 * components/auth/AccountSync.tsx, which merges this store's contents into the account exactly
 * once per sign-in and then leaves the DB in charge).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

const safeStorage = {
  getItem(name: string): string | null {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem(name: string, value: string): void {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Storage unavailable — the wishlist still works for this session, it just won't persist.
    }
  },
  removeItem(name: string): void {
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignore.
    }
  },
};

interface WishlistState {
  productIds: number[];
  toggle: (productId: number) => void;
  has: (productId: number) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) => {
        const has = get().productIds.includes(productId);
        set({ productIds: has ? get().productIds.filter((id) => id !== productId) : [...get().productIds, productId] });
      },
      has: (productId) => get().productIds.includes(productId),
      clear: () => set({ productIds: [] }),
    }),
    {
      name: "dm-wishlist",
      storage: {
        getItem: (name) => {
          const raw = safeStorage.getItem(name);
          return raw ? JSON.parse(raw) : null;
        },
        setItem: (name, value) => safeStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => safeStorage.removeItem(name),
      },
    },
  ),
);

export function selectWishlistCount(state: WishlistState): number {
  return state.productIds.length;
}
