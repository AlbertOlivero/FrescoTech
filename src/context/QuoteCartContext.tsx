import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product, QuoteCartItem } from "@/types/product";

interface QuoteCartContextValue {
  items: QuoteCartItem[];
  totalItems: number;
  addItem: (product: Product) => void;
  changeQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

const QuoteCartContext = createContext<QuoteCartContextValue | null>(null);

export function QuoteCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteCartItem[]>([]);

  const value = useMemo<QuoteCartContextValue>(() => ({
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    addItem(product) {
      setItems(current => {
        const existing = current.find(item => item.id === product.id);
        if (existing) return current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        return [...current, { ...product, quantity: 1 }];
      });
    },
    changeQuantity(id, quantity) {
      if (quantity <= 0) setItems(current => current.filter(item => item.id !== id));
      else setItems(current => current.map(item => item.id === id ? { ...item, quantity } : item));
    },
    removeItem(id) { setItems(current => current.filter(item => item.id !== id)); },
    clear() { setItems([]); },
  }), [items]);

  return <QuoteCartContext.Provider value={value}>{children}</QuoteCartContext.Provider>;
}

export function useQuoteCart() {
  const context = useContext(QuoteCartContext);
  if (!context) throw new Error("useQuoteCart debe usarse dentro de QuoteCartProvider");
  return context;
}
