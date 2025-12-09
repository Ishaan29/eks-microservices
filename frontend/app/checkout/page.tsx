"use client";

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBaseUrl } from '../../utils/config';

// Simple component to display success message instead of using alert()
const NotificationModal: React.FC<{ orderId: string, onClose: () => void }> = ({ orderId, onClose }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-green-500 mx-auto mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Order Placed!</h3>
            <p className="text-gray-600 mb-6">Your order (ID: **{orderId}**) has been successfully submitted to the **Orders Service**.</p>
            <button
                onClick={onClose}
                className="w-full px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            >
                View Orders
            </button>
        </div>
    </div>
);

// --- Error Modal ---
const ErrorModal: React.FC<{ message: string, onClose: () => void }> = ({ message, onClose }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-red-500 mx-auto mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Order Failed</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
                onClick={onClose}
                className="w-full px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            >
                Close
            </button>
        </div>
    </div>
);

export default function CheckoutPage() {
    const { cart, totalPrice, clearCart, itemCount } = useCart();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // FIX: Initialize with empty strings so placeholders show up
    const [shippingDetails, setShippingDetails] = useState({
        name: '',
        address: '',
        city: '',
        zip: ''
    });

    // Calculations
    const taxRate = 0.08;
    const shippingFee = 9.99;
    const taxAmount = totalPrice * taxRate;
    const grandTotal = totalPrice + taxAmount + shippingFee;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        // Real API Call to Orders Service
        try {
            const orderPayload = {
                cart: cart,
                shippingDetails: shippingDetails,
                total: grandTotal
            };

            // For client-side fetch, we need to use localhost since it runs in the browser
            // The browser doesn't have access to Docker service names
            const API_URL = getBaseUrl('orders');
            if (!API_URL) {
                throw new Error("Configuration Error: NEXT_PUBLIC_ORDERS_API_URL is missing.");
            }
            const response = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderPayload),
            });

            if (!response.ok) {
                throw new Error(`Orders API failed with status: ${response.status}`);
            }

            const result = await response.json();
            
            console.log(`[Checkout] Order placed successfully with ID: ${result.orderId}`);
            console.log("Payload sent:", orderPayload);

            setOrderId(result.orderId);
            clearCart();
        
        } catch (error) {
            console.error("[Checkout Error]", error);
            if (error instanceof TypeError) {
                setErrorMessage("Failed to connect to the Orders API. Is it running on port 8001?");
            } else if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage("An unknown error occurred.");
            }
        }

        setIsSubmitting(false);
    };

    if (itemCount === 0 && !orderId) {
        return (
            <div className="max-w-xl mx-auto p-10 bg-white shadow-xl rounded-xl text-center mt-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Cart is Empty</h1>
                <p className="text-gray-600 mb-6">Please add items to your cart before checking out.</p>
                <Link href="/" className="inline-block px-6 py-3 text-lg font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    const handleModalClose = () => {
        setOrderId(null);
        router.push('/orders');
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-10 border-b pb-4">
                Secure Checkout
            </h1>
            
            <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
                
                {/* 1. Shipping Details (2/3 width) */}
                <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Information</h2>
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-gray-700">Full Name</span>
                            <input
                                type="text"
                                value={shippingDetails.name}
                                onChange={(e) => setShippingDetails({ ...shippingDetails, name: e.target.value })}
                                required
                                placeholder="e.g. John Doe"
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                            />
                        </label>
                        <label className="block">
                            <span className="text-gray-700">Address</span>
                            <input
                                type="text"
                                value={shippingDetails.address}
                                onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                                required
                                placeholder="e.g. 123 Main St"
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                            />
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-gray-700">City</span>
                                <input
                                    type="text"
                                    value={shippingDetails.city}
                                    onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                                    required
                                    placeholder="e.g. New York"
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                />
                            </label>
                            <label className="block">
                                <span className="text-gray-700">ZIP / Postal Code</span>
                                <input
                                    type="text"
                                    value={shippingDetails.zip}
                                    onChange={(e) => setShippingDetails({ ...shippingDetails, zip: e.target.value })}
                                    required
                                    placeholder="e.g. 10001"
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                />
                            </label>
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8 pt-4 border-t">Payment (Mock)</h2>
                    <p className="text-gray-500">
                        Payment processing is mocked. Submitting the order will send the cart to the Orders Service.
                    </p>
                    <div className="mt-4 p-4 border border-indigo-200 bg-indigo-50 rounded-lg">
                        <p className="font-medium text-indigo-700">Visa ending in **** 4242</p>
                    </div>

                </div>

                {/* 2. Order Summary & Submit (1/3 width) */}
                <div className="lg:col-span-1 bg-white p-8 rounded-xl shadow-lg h-fit">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-3">Order Total</h2>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Items Subtotal ({itemCount} items)</span>
                            <span>${totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Shipping & Handling</span>
                            <span>${shippingFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Estimated Tax (8%)</span>
                            <span>${taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-4 border-t border-gray-200">
                            <span className="text-xl font-bold">Grand Total</span>
                            <span className="text-xl font-bold text-green-700">${grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`mt-8 w-full block text-center px-6 py-3 text-lg font-bold rounded-xl shadow-lg text-white transition duration-200 
                            ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 transform hover:scale-[1.01]'}`}
                    >
                        {isSubmitting ? 'Placing Order...' : 'Place Order Now'}
                    </button>
                    
                    <Link href="/cart" className="mt-4 w-full block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                        ← Return to Cart
                    </Link>
                </div>
            </form>

            {/* Success Modal */}
            {orderId && (
                <NotificationModal orderId={orderId} onClose={handleModalClose} />
            )}
            
            {/* Error Modal */}
            {errorMessage && (
                <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />
            )}
        </div>
    );
}