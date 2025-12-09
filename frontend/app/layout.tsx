import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Your global styles

// 1. Import the Provider
import { CartProvider } from '@/context/CartContext'; 

import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Microservice Storefront | Retail Demo",
  description: "A demonstration of a scalable online retail system frontend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 2. Wrap the ENTIRE application in the provider */}
        <CartProvider>
          <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Header and Footer are INSIDE the provider */}
            <Header />
            
            <main className="flex-grow p-4 md:p-8">
              {children}
            </main>
            
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}