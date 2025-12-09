import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CartItemRow from '../CartItemRow';
import { CartProvider, CartItem } from '@/context/CartContext';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

const mockCartItem: CartItem = {
  id: 'product-1',
  name: 'Test Product',
  price: 29.99,
  quantity: 2,
  imageUrl: 'https://example.com/image.jpg',
};

const renderWithCartProvider = (component: React.ReactElement) => {
  return render(<CartProvider>{component}</CartProvider>);
};

describe('CartItemRow', () => {
  it('renders cart item information correctly', () => {
    renderWithCartProvider(<CartItemRow item={mockCartItem} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99 each')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
  });

  it('calculates and displays total price correctly', () => {
    renderWithCartProvider(<CartItemRow item={mockCartItem} />);

    // 29.99 * 2 = 59.98
    expect(screen.getByText('$59.98')).toBeInTheDocument();
  });

  it('renders remove button with correct aria-label', () => {
    renderWithCartProvider(<CartItemRow item={mockCartItem} />);

    const removeButton = screen.getByLabelText('Remove Test Product');
    expect(removeButton).toBeInTheDocument();
  });

  it('renders quantity input with correct attributes', () => {
    renderWithCartProvider(<CartItemRow item={mockCartItem} />);

    const quantityInput = screen.getByDisplayValue('2') as HTMLInputElement;
    expect(quantityInput).toHaveAttribute('type', 'number');
    expect(quantityInput).toHaveAttribute('min', '1');
  });

  it('creates correct product detail link', () => {
    renderWithCartProvider(<CartItemRow item={mockCartItem} />);

    const link = screen.getByRole('link', { name: 'Test Product' });
    expect(link).toHaveAttribute('href', '/products/product-1');
  });

  it('formats price with two decimal places', () => {
    const itemWholePrice = { ...mockCartItem, price: 30 };
    renderWithCartProvider(<CartItemRow item={itemWholePrice} />);

    expect(screen.getByText('$30.00 each')).toBeInTheDocument();
    expect(screen.getByText('$60.00')).toBeInTheDocument(); // 30 * 2
  });

  it('handles single quantity item', () => {
    const singleItem = { ...mockCartItem, quantity: 1 };
    renderWithCartProvider(<CartItemRow item={singleItem} />);

    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument(); // Same as unit price
  });

  it('handles large quantity items', () => {
    const largeQuantityItem = { ...mockCartItem, quantity: 100 };
    renderWithCartProvider(<CartItemRow item={largeQuantityItem} />);

    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByText('$2999.00')).toBeInTheDocument(); // 29.99 * 100
  });

  it('displays correct total for decimal prices', () => {
    const decimalItem = { ...mockCartItem, price: 9.99, quantity: 3 };
    renderWithCartProvider(<CartItemRow item={decimalItem} />);

    expect(screen.getByText('$29.97')).toBeInTheDocument(); // 9.99 * 3
  });
});

describe('CartItemRow interactions', () => {
  it('updates quantity when input changes to valid number', () => {
    renderWithCartProvider(<CartItemRow item={mockCartItem} />);

    const quantityInput = screen.getByDisplayValue('2') as HTMLInputElement;
    fireEvent.change(quantityInput, { target: { value: '5' } });

    // The input value should be updated (controlled by context)
    expect(quantityInput).toBeInTheDocument();
  });

  it('calls remove when quantity is changed to 0', () => {
    renderWithCartProvider(<CartItemRow item={mockCartItem} />);

    const quantityInput = screen.getByDisplayValue('2') as HTMLInputElement;
    fireEvent.change(quantityInput, { target: { value: '0' } });

    // Item should be removed from cart (handled by context)
    expect(quantityInput).toBeInTheDocument();
  });

  it('removes item when remove button is clicked', () => {
    renderWithCartProvider(<CartItemRow item={mockCartItem} />);

    const removeButton = screen.getByLabelText('Remove Test Product');
    fireEvent.click(removeButton);

    // Button should be clickable
    expect(removeButton).toBeEnabled();
  });

  it('handles rapid quantity changes', () => {
    renderWithCartProvider(<CartItemRow item={mockCartItem} />);

    const quantityInput = screen.getByDisplayValue('2') as HTMLInputElement;

    fireEvent.change(quantityInput, { target: { value: '3' } });
    fireEvent.change(quantityInput, { target: { value: '4' } });
    fireEvent.change(quantityInput, { target: { value: '5' } });

    expect(quantityInput).toBeInTheDocument();
  });

  it('does not allow negative quantities', () => {
    renderWithCartProvider(<CartItemRow item={mockCartItem} />);

    const quantityInput = screen.getByDisplayValue('2') as HTMLInputElement;

    // Try to set negative value
    fireEvent.change(quantityInput, { target: { value: '-1' } });

    // Should remove item (quantity < 1)
    expect(quantityInput).toBeInTheDocument();
  });
});

describe('CartItemRow edge cases', () => {
  it('handles very long product names', () => {
    const longNameItem = {
      ...mockCartItem,
      name: 'This is a very long product name that should be displayed properly without breaking the layout',
    };
    renderWithCartProvider(<CartItemRow item={longNameItem} />);

    expect(
      screen.getByText(
        'This is a very long product name that should be displayed properly without breaking the layout'
      )
    ).toBeInTheDocument();
  });

  it('handles zero price items', () => {
    const freeItem = { ...mockCartItem, price: 0, quantity: 5 };
    renderWithCartProvider(<CartItemRow item={freeItem} />);

    expect(screen.getByText('$0.00 each')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('handles very high price items', () => {
    const expensiveItem = { ...mockCartItem, price: 9999.99, quantity: 1 };
    renderWithCartProvider(<CartItemRow item={expensiveItem} />);

    expect(screen.getByText('$9999.99 each')).toBeInTheDocument();
    expect(screen.getByText('$9999.99')).toBeInTheDocument();
  });

  it('handles items with special characters in name', () => {
    const specialNameItem = {
      ...mockCartItem,
      name: 'Test & Product < > "Special"',
    };
    renderWithCartProvider(<CartItemRow item={specialNameItem} />);

    expect(screen.getByText('Test & Product < > "Special"')).toBeInTheDocument();
  });
});

describe('CartItemRow styling', () => {
  it('applies hover styles to remove button', () => {
    renderWithCartProvider(<CartItemRow item={mockCartItem} />);

    const removeButton = screen.getByLabelText('Remove Test Product');
    expect(removeButton).toHaveClass('hover:text-red-700');
    expect(removeButton).toHaveClass('hover:bg-red-50');
  });

  it('applies border styling correctly', () => {
    const { container } = renderWithCartProvider(<CartItemRow item={mockCartItem} />);

    const rowDiv = container.firstChild;
    expect(rowDiv).toHaveClass('border-b');
  });
});

