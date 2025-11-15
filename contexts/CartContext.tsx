import React, {createContext, useContext, useMemo, useState} from "react";
import {MarketplaceItem} from "../types";

export type CartEntry = {
  id: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  maxQuantity: number;
};

type CartCtx = {
  entries: CartEntry[];
  add: (item: MarketplaceItem, qty?: number) => void;
  changeQuantity: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  total: number;
  count: number;
};

const Ctx = createContext<CartCtx>({
  entries: [],
  add: () => {
  },
  changeQuantity: () => {
  },
  remove: () => {
  },
  clear: () => {
  },
  total: 0,
  count: 0,
});

export function CartProvider({children}: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<CartEntry[]>([]);

  const add = (item: MarketplaceItem, qty: number = 1) => {
    setEntries((prev) => {
      const max = Math.max(1, item.stock ?? 1);
      const i = prev.findIndex((e) => e.id === item.id);
      if (i >= 0) {
        const nextQty = Math.min(prev[i].quantity + qty, prev[i].maxQuantity);
        if (nextQty <= 0) return prev.filter((e) => e.id !== item.id);
        const cp = [...prev];
        cp[i] = {...cp[i], quantity: nextQty};
        return cp;
      }
      const initial = Math.min(qty, max);
      if (initial <= 0) return prev;
      return [
        ...prev,
        {
          id: item.id,
          price: item.price,
          imageUrl: item.imageUrl,
          quantity: initial,
          maxQuantity: max,
        },
      ];
    });
  };

  const changeQuantity = (id: string, qty: number) => {
    setEntries((prev) => {
      const i = prev.findIndex((e) => e.id === id);
      if (i < 0) return prev;
      if (qty <= 0) return prev.filter((e) => e.id !== id);
      const bounded = Math.min(qty, prev[i].maxQuantity);
      const cp = [...prev];
      cp[i] = {...cp[i], quantity: bounded};
      return cp;
    });
  };

  const remove = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const clear = () => setEntries([]);

  const total = useMemo(() => entries.reduce((s, e) => s + e.price * e.quantity, 0), [entries]);
  const count = useMemo(() => entries.reduce((s, e) => s + e.quantity, 0), [entries]);

  const value = useMemo(() => ({entries, add, changeQuantity, remove, clear, total, count}), [entries, total, count]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  return useContext(Ctx);
}