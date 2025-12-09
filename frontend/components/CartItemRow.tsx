"use client";

import React from 'react';
import { CartItem, useCart } from '@/context/CartContext';
import Link from 'next/link';

interface CartItemRowProps {
  item: CartItem;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item }) => {
  const { updateQuantity, removeItem } = useCart();

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(event.target.value, 10);
    if (newQuantity >= 1) {
      updateQuantity(item.id, newQuantity);
    } else {
      removeItem(item.id);
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
      
      <div className="flex items-center space-x-4 w-1/2">
        <div 
          className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0"
          style={{ 
            backgroundImage: `url(${item.imageUrl})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        >
        </div>
        <div>
          <Link href={`/products/${item.id}`} className="text-lg font-semibold text-gray-800 hover:text-indigo-600">
            {item.name}
          </Link>
          <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
        </div>
      </div>
      
      <div className="w-1/4 flex justify-center">
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={handleQuantityChange}
          className="w-16 p-2 border border-gray-300 rounded-lg text-center"
        />
      </div>

      <div className="w-1/4 text-right">
        <p className="text-lg font-bold text-indigo-600">${(item.price * item.quantity).toFixed(2)}</p>
      </div>
      
      <div className="w-1/12 text-right">
        <button
          onClick={() => removeItem(item.id)}
          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition duration-150"
          aria-label={`Remove ${item.name}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CartItemRow;