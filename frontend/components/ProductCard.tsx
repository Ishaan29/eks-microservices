"use client"; // <--- This line is ESSENTIAL.

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext'; 

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string; 
  description: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart(); 

  const handleAddToCart = () => {
    // This call passes the full product object to the context
    addToCart(product); 
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 overflow-hidden border border-gray-100">
      
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square bg-gray-200 flex items-center justify-center cursor-pointer">
            {product.imageUrl ? (
                <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="h-full w-full object-cover" 
                    referrerPolicy="no-referrer"
                />
                ) : (
                <span className="text-gray-500 text-sm font-semibold">{product.name}</span>
            )}
        </div>
      </Link>

      <div className="p-5">
        <Link href={`/products/${product.id}`} className="block">
          <h3 className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition duration-150 truncate">
            {product.name}
          </h3>
        </Link>
        
        <p className="mt-1 text-2xl font-bold text-indigo-600">
          ${product.price.toFixed(2)}
        </p>

        <button
          className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-500 hover:bg-green-600 transition duration-150 transform hover:scale-[1.02]"
          onClick={handleAddToCart}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;