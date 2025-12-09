import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { CartProvider, useCart, CartItem } from '../CartContext';

describe('CartContext', () => {
  describe('CartProvider', () => {
    it('renders children correctly', () => {
      const { getByText } = render(
        <CartProvider>
          <div>Test Child</div>
        </CartProvider>
      );
      expect(getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('useCart hook', () => {
    it('throws error when used outside CartProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useCart());
      }).toThrow('useCart must be used within a CartProvider');
      
      consoleSpy.mockRestore();
    });

    it('provides initial empty cart state', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      expect(result.current.cart).toEqual([]);
      expect(result.current.itemCount).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });
  });

  describe('addToCart', () => {
    it('adds a new item to the cart', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product = {
        id: 'product-1',
        name: 'Test Product',
        price: 29.99,
        imageUrl: 'https://example.com/image.jpg',
      };

      act(() => {
        result.current.addToCart(product);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0]).toEqual({ ...product, quantity: 1 });
      expect(result.current.itemCount).toBe(1);
      expect(result.current.totalPrice).toBe(29.99);
    });

    it('increases quantity when adding existing item', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product = {
        id: 'product-1',
        name: 'Test Product',
        price: 29.99,
        imageUrl: 'https://example.com/image.jpg',
      };

      act(() => {
        result.current.addToCart(product);
        result.current.addToCart(product);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].quantity).toBe(2);
      expect(result.current.itemCount).toBe(2);
      expect(result.current.totalPrice).toBe(59.98);
    });

    it('adds custom quantity to cart', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product = {
        id: 'product-1',
        name: 'Test Product',
        price: 29.99,
        imageUrl: 'https://example.com/image.jpg',
      };

      act(() => {
        result.current.addToCart(product, 5);
      });

      expect(result.current.cart[0].quantity).toBe(5);
      expect(result.current.itemCount).toBe(5);
      expect(result.current.totalPrice).toBeCloseTo(149.95, 2);
    });

    it('adds multiple different items to cart', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product1 = {
        id: 'product-1',
        name: 'Product 1',
        price: 29.99,
        imageUrl: 'image1.jpg',
      };

      const product2 = {
        id: 'product-2',
        name: 'Product 2',
        price: 19.99,
        imageUrl: 'image2.jpg',
      };

      act(() => {
        result.current.addToCart(product1);
        result.current.addToCart(product2);
      });

      expect(result.current.cart).toHaveLength(2);
      expect(result.current.itemCount).toBe(2);
      expect(result.current.totalPrice).toBeCloseTo(49.98, 2);
    });
  });

  describe('updateQuantity', () => {
    it('updates quantity of an existing item', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product = {
        id: 'product-1',
        name: 'Test Product',
        price: 29.99,
        imageUrl: 'image.jpg',
      };

      act(() => {
        result.current.addToCart(product);
        result.current.updateQuantity('product-1', 3);
      });

      expect(result.current.cart[0].quantity).toBe(3);
      expect(result.current.itemCount).toBe(3);
      expect(result.current.totalPrice).toBeCloseTo(89.97, 2);
    });

    it('removes item when quantity is set to 0', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product = {
        id: 'product-1',
        name: 'Test Product',
        price: 29.99,
        imageUrl: 'image.jpg',
      };

      act(() => {
        result.current.addToCart(product);
        result.current.updateQuantity('product-1', 0);
      });

      expect(result.current.cart).toHaveLength(0);
      expect(result.current.itemCount).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });

    it('removes item when quantity is negative', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product = {
        id: 'product-1',
        name: 'Test Product',
        price: 29.99,
        imageUrl: 'image.jpg',
      };

      act(() => {
        result.current.addToCart(product);
        result.current.updateQuantity('product-1', -1);
      });

      expect(result.current.cart).toHaveLength(0);
    });

    it('does not affect other items when updating quantity', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product1 = {
        id: 'product-1',
        name: 'Product 1',
        price: 29.99,
        imageUrl: 'image1.jpg',
      };

      const product2 = {
        id: 'product-2',
        name: 'Product 2',
        price: 19.99,
        imageUrl: 'image2.jpg',
      };

      act(() => {
        result.current.addToCart(product1);
        result.current.addToCart(product2);
        result.current.updateQuantity('product-1', 5);
      });

      expect(result.current.cart).toHaveLength(2);
      expect(result.current.cart[0].quantity).toBe(5);
      expect(result.current.cart[1].quantity).toBe(1);
    });
  });

  describe('removeItem', () => {
    it('removes an item from the cart', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product = {
        id: 'product-1',
        name: 'Test Product',
        price: 29.99,
        imageUrl: 'image.jpg',
      };

      act(() => {
        result.current.addToCart(product);
        result.current.removeItem('product-1');
      });

      expect(result.current.cart).toHaveLength(0);
      expect(result.current.itemCount).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });

    it('removes only the specified item', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product1 = {
        id: 'product-1',
        name: 'Product 1',
        price: 29.99,
        imageUrl: 'image1.jpg',
      };

      const product2 = {
        id: 'product-2',
        name: 'Product 2',
        price: 19.99,
        imageUrl: 'image2.jpg',
      };

      act(() => {
        result.current.addToCart(product1);
        result.current.addToCart(product2);
        result.current.removeItem('product-1');
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].id).toBe('product-2');
      expect(result.current.totalPrice).toBeCloseTo(19.99, 2);
    });

    it('does nothing when removing non-existent item', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product = {
        id: 'product-1',
        name: 'Test Product',
        price: 29.99,
        imageUrl: 'image.jpg',
      };

      act(() => {
        result.current.addToCart(product);
        result.current.removeItem('non-existent-id');
      });

      expect(result.current.cart).toHaveLength(1);
    });
  });

  describe('clearCart', () => {
    it('clears all items from the cart', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product1 = {
        id: 'product-1',
        name: 'Product 1',
        price: 29.99,
        imageUrl: 'image1.jpg',
      };

      const product2 = {
        id: 'product-2',
        name: 'Product 2',
        price: 19.99,
        imageUrl: 'image2.jpg',
      };

      act(() => {
        result.current.addToCart(product1);
        result.current.addToCart(product2);
        result.current.clearCart();
      });

      expect(result.current.cart).toEqual([]);
      expect(result.current.itemCount).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });

    it('works on an already empty cart', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cart).toEqual([]);
    });
  });

  describe('derived state calculations', () => {
    it('calculates itemCount correctly', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product = {
        id: 'product-1',
        name: 'Test Product',
        price: 29.99,
        imageUrl: 'image.jpg',
      };

      act(() => {
        result.current.addToCart(product, 3);
        result.current.addToCart(product, 2);
      });

      expect(result.current.itemCount).toBe(5);
    });

    it('calculates totalPrice correctly with multiple items', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product1 = {
        id: 'product-1',
        name: 'Product 1',
        price: 10.50,
        imageUrl: 'image1.jpg',
      };

      const product2 = {
        id: 'product-2',
        name: 'Product 2',
        price: 25.75,
        imageUrl: 'image2.jpg',
      };

      act(() => {
        result.current.addToCart(product1, 2); // 21.00
        result.current.addToCart(product2, 3); // 77.25
      });

      expect(result.current.totalPrice).toBeCloseTo(98.25, 2);
    });

    it('handles decimal prices correctly', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const product = {
        id: 'product-1',
        name: 'Test Product',
        price: 9.99,
        imageUrl: 'image.jpg',
      };

      act(() => {
        result.current.addToCart(product, 3);
      });

      expect(result.current.totalPrice).toBeCloseTo(29.97, 2);
    });
  });
});

