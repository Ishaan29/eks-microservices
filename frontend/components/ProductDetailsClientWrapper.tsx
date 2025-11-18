"use client"; // <--- This makes it a Client Component

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
// Import the Product type from the page component
import { Product } from '@/app/products/[id]/page'; 

// This component receives the product data fetched by the server
export default function ProductDetailsClientWrapper({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    console.log(`Adding ${quantity} of ${product.name} to cart`);
    addToCart(product, quantity);
  };

  return (
    <div className="flex flex-col">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-3">{product.name}</h1>
      
      <p className="text-4xl font-bold text-indigo-600 mb-6">${product.price.toFixed(2)}</p>
      
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Description</h2>
      <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>
      
      {/* Quantity Selector (Now functional) */}
      <div className="mb-8 flex items-center space-x-4">
        <label htmlFor="quantity" className="font-medium text-gray-700">Quantity:</label>
        <input 
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))} // Ensures quantity is at least 1
          min={1}
          className="w-20 p-2 border border-gray-300 rounded-lg text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* "Add to Cart" Button (Now functional) */}
      <button
        onClick={handleAddToCart}
        className="w-full md:w-2/3 lg:w-1/2 flex items-center justify-center px-6 py-3 border border-transparent text-lg font-bold rounded-xl shadow-lg text-white bg-green-500 hover:bg-green-600 transition duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add to Cart
      </button>
      
      {/* Inventory Status Placeholder */}
      <p className="mt-4 text-sm font-semibold text-green-600">
          (Inventory Status Placeholder: In Stock) 
      </p>
    </div>
  );
}