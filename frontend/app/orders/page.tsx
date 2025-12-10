import Link from 'next/link';
import { getBaseUrl } from '../../utils/config';

// --- Types ---
// This defines the shape of the data we expect from our Orders API
interface Order {
  id: string;
  status: string;
  total: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_zip: string;
}

// --- API Data Fetching Function ---
async function getOrders(): Promise<Order[] | null> {
  try {
    // Use environment variable for Docker, fallback to localhost for local dev
    const baseUrl = getBaseUrl('orders');
    // We fetch data from our Orders API microservice
    const res = await fetch(`${baseUrl}/api/orders`, {
      // We must use 'no-store' to ensure this data is always fresh
      cache: 'no-store', 
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch orders: ${res.statusText}`);
    }

    return res.json();

  } catch (error) {
    console.error('[Orders Page Error]', error);
    return null; // Return null if there was an error
  }
}

// --- React Server Component ---
export default async function OrdersPage() {
  const orders = await getOrders();

  // --- Error State ---
  if (!orders) {
    return (
      <div className="max-w-xl mx-auto p-10 bg-white shadow-xl rounded-xl text-center mt-10">
        <h1 className="text-3xl font-bold text-red-600">API Connection Error</h1>
        <p className="text-gray-600 my-4">
          Failed to connect to the Orders API. Is the orders-api running?
        </p>
      
      </div>
    );
  }

  // --- Empty State ---
  if (orders.length === 0) {
    return (
        <div className="max-w-xl mx-auto p-10 bg-white shadow-xl rounded-xl text-center mt-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">You have no orders</h1>
           <p className="text-gray-600 mb-6">You haven&apos;t placed any orders yet. Once you do, they will show up here.</p>
            <Link 
            href="/" 
            className="inline-block px-6 py-3 text-lg font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150"
            >
            Start Shopping
            </Link>
        </div>
    );
  }

  // --- Success State ---
  return (
    <section className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b pb-4">
        My Order History
      </h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <p className="text-sm font-medium text-gray-500">Order ID</p>
                    <p className="text-lg font-bold text-indigo-600">{order.id}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 text-right">Total</p>
                    <p className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</p>
                </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
                <p className="font-semibold text-gray-700">Status: <span className="text-green-600 capitalize">{order.status}</span></p>
                <p className="mt-1 text-gray-600">
                    Shipping to: <span className="font-medium">{order.shipping_name}</span> at {order.shipping_address}, {order.shipping_city}, {order.shipping_zip}
                </p>
            </div>
            {/* In a real app, we would fetch and show the line items here */}
          </div>
        ))}
      </div>
    </section>
  );
}
