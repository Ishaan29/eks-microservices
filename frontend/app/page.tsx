import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { getBaseUrl } from '../utils/config'; 

// Define the Product interface
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
}

// --- NEW: API Data Fetching Function ---
async function getProducts(): Promise<Product[] | null> {
  try {
    // 1. Get the correct URL dynamically using your helper
    // If Server (Docker) -> http://products-api:8000
    // If Browser         -> http://localhost:8000
    const baseUrl = getBaseUrl('products');
    
    // Optional: Log this so you can see in your terminal exactly what URL is being used
    console.log(`[Home Page] Fetching from: ${baseUrl}/api/products`);

    // 2. Fetch data
    const res = await fetch(`${baseUrl}/api/products`, {
      // Use 'no-store' to ensure data is fresh on every request (good for development)
      cache: 'no-store', 
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.statusText}`);
    }

    return res.json();

  } catch (error) {
    console.error('[Home Page Error]', error);
    return null; // Return null if there was an error
  }
}
// --- END NEW FUNCTION ---


export default async function Home() {
  // Call the new API function
  const products = await getProducts();

  // --- Error handling for when the API is down ---
  if (!products) {
    return (
      <div className="max-w-xl mx-auto p-10 bg-white shadow-xl rounded-xl text-center mt-10">
        <h1 className="text-3xl font-bold text-red-600">API Connection Error</h1>
        <p className="text-gray-600 my-4">
          Failed to connect to the Products API.
        </p>
        <p className="text-sm text-gray-500">
          Please ensure the Python FastAPI server (`products-api`) is running.
        </p>
      </div>
    )
  }
  // --- END ERROR HANDLING ---

  return (
    <section className="max-w-7xl mx-auto">
      <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center md:text-left">
        Products
      </h2>
      
      {/* Product Grid Layout (Responsive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}