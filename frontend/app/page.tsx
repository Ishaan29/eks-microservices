import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

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
    // We fetch data from our new API microservice
    const res = await fetch('http://localhost:8000/api/products', {
      // Use 'no-store' to ensure data is fresh on every request (good for development)
      // For production, we'd use 'force-cache' or revalidation
      cache: 'no-store', 
    });

    if (!res.ok) {
      // If the API server is down or returns an error
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

  // --- NEW: Error handling for when the API is down ---
  if (!products) {
    return (
      <div className="max-w-xl mx-auto p-10 bg-white shadow-xl rounded-xl text-center mt-10">
        <h1 className="text-3xl font-bold text-red-600">API Connection Error</h1>
        <p className="text-gray-600 my-4">
          Failed to connect to the Products API at `http://localhost:8000`.
        </p>
        <p className="text-sm text-gray-500">
          Please ensure the Python FastAPI server (`products-api`) is running in a separate terminal.
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