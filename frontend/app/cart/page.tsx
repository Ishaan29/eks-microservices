"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import CartItemRow from '@/components/CartItemRow';

export default function CartPage() {
  const { cart, itemCount, totalPrice, clearCart } = useCart();

  const taxRate = 0.08;
  const taxAmount = totalPrice * taxRate;
  const grandTotal = totalPrice + taxAmount;

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-10 bg-white shadow-xl rounded-xl text-center mt-10">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mx-auto mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.023.824l.737 4.436c.144.86.657 1.637 1.408 1.996l7.85 3.925a2.25 2.25 0 0 0 1.98.05l4.89-2.446c.7-.35.854-1.293.385-1.854a2.25 2.25 0 0 1-.941-.98l-1.39-2.774M18 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM8.25 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
        </svg>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Link 
          href="/" 
          className="inline-block px-6 py-3 text-lg font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-10 border-b pb-4">
        Shopping Cart ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
      </h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
          
          <div className="hidden sm:flex text-sm font-semibold text-gray-500 pb-3 border-b">
            <span className="w-1/2">Product</span>
            <span className="w-1/4 text-center">Quantity</span>
            <span className="w-1/4 text-right">Subtotal</span>
            <span className="w-1/12 text-right"></span>
          </div>
          
          <div className="divide-y divide-gray-200">
            {cart.map(item => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </div>

          <button
            onClick={clearCart}
            className="mt-6 text-sm text-red-500 hover:text-red-700 font-medium transition duration-150"
          >
            Clear Cart
          </button>
        </div>
        
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-3">Order Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({itemCount} items)</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Estimated Tax (8%)</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <span className="text-xl font-bold">Order Total</span>
              <span className="text-xl font-bold text-indigo-700">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <Link 
            href="/checkout" 
            className="mt-8 w-full block text-center px-6 py-3 text-lg font-bold rounded-xl shadow-lg text-white bg-green-500 hover:bg-green-600 transition duration-200"
          >
            Proceed to Checkout
          </Link>

          <Link href="/" className="mt-4 w-full block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}