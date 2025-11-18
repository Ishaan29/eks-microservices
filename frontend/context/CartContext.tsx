"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// --- Types ---
interface CartItem {
  id: string; // Product ID
  name: string;
  price: number;
  quantity: number;
  imageUrl: string; // FIX: Ensures image is available
}

interface CartContextType {
  cart: CartItem[];
  itemCount: number;
  totalPrice: number;
  addToCart: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// --- Provider Component ---
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Derived state calculations
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (product: Omit<CartItem, 'quantity'>, quantityToAdd: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);

      if (existingItem) {
        // If product exists, update its quantity
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      } else {
        // If product is new, add it to the cart
        return [...prevCart, { ...product, quantity: quantityToAdd, imageUrl: (product as CartItem).imageUrl }]; 
      }
    });
    console.log(`[Cart] Added/Updated: ${product.name} x${quantityToAdd}`);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== id);
      }
      return prevCart.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const removeItem = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{
      cart,
      itemCount,
      totalPrice,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

// --- Custom Hook ---
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider. Check app/layout.tsx');
  }
  return context;
};

export type { CartItem };