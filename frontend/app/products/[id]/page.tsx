import Link from 'next/link';
import ProductDetailsClientWrapper from '@/components/ProductDetailsClientWrapper';
import { getBaseUrl } from '../../../utils/config';

// Define the same Product interface for consistency
export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
}

// This function simulates fetching data
async function getProduct(id: string): Promise<Product | undefined> {
  try {
    // Use environment variable for Docker, fallback to localhost for local dev
    const baseUrl = getBaseUrl('products');
    // Connects to your Products API running on port 8000
    const res = await fetch(`${baseUrl}/api/products/${id}`, {
      cache: 'no-store', 
    });

    if (!res.ok) {
      return undefined; 
    }
    
    return res.json();

  } catch (error) {
    console.error(`[Detail Page Error]`, error);
    return undefined; 
  }
}

// FIX: In Next.js 15, params is a Promise. We must await it.
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>; 
}) {
  // 1. Await the params object to get the ID
  const { id } = await params;
  
  // 2. Fetch data using the ID
  const product = await getProduct(id);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-xl mt-10 text-center">
        <h1 className="text-3xl font-bold text-red-600">Product Not Found (404)</h1>
        <p className="mt-4 text-gray-600">
          The product with ID **{id}** could not be located in the catalog.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          (Or the Products API at `http://localhost:8000` might be offline)
        </p>
        <Link href="/" className="mt-6 inline-block text-indigo-600 hover:text-indigo-800 font-medium">
          ← Back to all products
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 bg-white shadow-2xl rounded-xl">
      <Link href="/" className="mb-6 inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition duration-150">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Products
      </Link>
      
      <div className="md:grid md:grid-cols-2 gap-12 mt-4">
        
        {/* Product Image Section (Server-side) */}
        <div className="mb-8 md:mb-0">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-auto rounded-xl shadow-lg object-cover" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="aspect-[4/3] bg-gray-200 rounded-xl flex items-center justify-center">
              <span className="text-gray-500 text-lg font-semibold">Image Not Available</span>
            </div>
          )}
        </div>
        
        {/* Product Details Section (Client-side wrapper) */}
        <ProductDetailsClientWrapper product={product} />

      </div>
    </div>
  );
}