"use client"; // <--- This line is ESSENTIAL.

import Link from 'next/link';
import { useCart } from '@/context/CartContext'; 

// Simple SVG for a shopping cart icon
const ShoppingCartIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="w-6 h-6"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.023.824l.737 4.436c.144.86.657 1.637 1.408 1.996l7.85 3.925a2.25 2.5 0 0 0 1.98.05l4.89-2.446c.7-.35.854-1.293.385-1.854a2.25 2.25 0 0 1-.941-.98l-1.39-2.774M18 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM8.25 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
  </svg>
);

const Header: React.FC = () => {
  // This hook connects the header to the cart's state
  const { itemCount } = useCart(); 

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <Link href="/" className="flex-shrink-0">
            <h1 className="text-2xl font-extrabold text-indigo-600 tracking-wider">
              RETAIL.SYS
            </h1>
          </Link>

          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-600 hover:text-indigo-600 transition duration-150 font-medium">
              Products
            </Link>
            <Link href="/orders" className="text-gray-600 hover:text-indigo-600 transition duration-150 font-medium">
              My Orders
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            
            <Link
              href="/cart"
              className="p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition duration-150 relative"
              aria-label={`View shopping cart with ${itemCount} items`}
            >
              <ShoppingCartIcon />
              
              {/* This logic dynamically shows the count */}
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px] h-[20px]">
                  {itemCount}
                </span>
              )}
            </Link>

            <button className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;