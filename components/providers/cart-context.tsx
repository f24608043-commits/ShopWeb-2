'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  productId: string;
  variationId?: string | null;
  productName: string;
  productSlug: string;
  image: string;
  variationDetails?: string | null;
  unitPrice: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, variationId?: string | null) => void;
  updateQuantity: (productId: string, variationId: string | null | undefined, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ecommerce_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on client mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync cart to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem: CartContextType['addItem'] = (newItem) => {
    const qtyToAdd = newItem.quantity || 1;
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === newItem.productId && i.variationId === newItem.variationId
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += qtyToAdd;
        return updated;
      }

      return [
        ...prev,
        {
          productId: newItem.productId,
          variationId: newItem.variationId || null,
          productName: newItem.productName,
          productSlug: newItem.productSlug,
          image: newItem.image,
          variationDetails: newItem.variationDetails || null,
          unitPrice: newItem.unitPrice,
          quantity: qtyToAdd,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeItem = (productId: string, variationId?: string | null) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variationId === variationId))
    );
  };

  const updateQuantity = (productId: string, variationId: string | null | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variationId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.variationId === variationId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
