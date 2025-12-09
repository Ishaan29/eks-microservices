import { getBaseUrl } from '../config';

describe('config utility', () => {
  const originalWindow = global.window;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore environment variables after each test
    process.env = originalEnv;
    global.window = originalWindow;
  });

  describe('getBaseUrl', () => {
    describe('products service', () => {
      it('returns INTERNAL_PRODUCTS_API_URL on server', () => {
        // @ts-ignore
        delete global.window;
        process.env.INTERNAL_PRODUCTS_API_URL = 'http://products-service:8000';
        process.env.NEXT_PUBLIC_PRODUCTS_API_URL = 'http://localhost:8000';

        const url = getBaseUrl('products');
        expect(url).toBe('http://products-service:8000');
      });

      it('returns NEXT_PUBLIC_PRODUCTS_API_URL on client', () => {
        global.window = {} as any;
        process.env.INTERNAL_PRODUCTS_API_URL = 'http://products-service:8000';
        process.env.NEXT_PUBLIC_PRODUCTS_API_URL = 'http://localhost:8000';

        const url = getBaseUrl('products');
        expect(url).toBe('http://localhost:8000');
      });

      it('returns empty string when env vars are not set on server', () => {
        // @ts-ignore
        delete global.window;
        delete process.env.INTERNAL_PRODUCTS_API_URL;
        delete process.env.NEXT_PUBLIC_PRODUCTS_API_URL;

        const url = getBaseUrl('products');
        expect(url).toBe('');
      });

      it('returns empty string when env vars are not set on client', () => {
        global.window = {} as any;
        delete process.env.INTERNAL_PRODUCTS_API_URL;
        delete process.env.NEXT_PUBLIC_PRODUCTS_API_URL;

        const url = getBaseUrl('products');
        expect(url).toBe('');
      });
    });

    describe('orders service', () => {
      it('returns INTERNAL_ORDERS_API_URL on server', () => {
        // @ts-ignore
        delete global.window;
        process.env.INTERNAL_ORDERS_API_URL = 'http://orders-service:8001';
        process.env.NEXT_PUBLIC_ORDERS_API_URL = 'http://localhost:8001';

        const url = getBaseUrl('orders');
        expect(url).toBe('http://orders-service:8001');
      });

      it('returns NEXT_PUBLIC_ORDERS_API_URL on client', () => {
        global.window = {} as any;
        process.env.INTERNAL_ORDERS_API_URL = 'http://orders-service:8001';
        process.env.NEXT_PUBLIC_ORDERS_API_URL = 'http://localhost:8001';

        const url = getBaseUrl('orders');
        expect(url).toBe('http://localhost:8001');
      });

      it('returns empty string when env vars are not set on server', () => {
        // @ts-ignore
        delete global.window;
        delete process.env.INTERNAL_ORDERS_API_URL;
        delete process.env.NEXT_PUBLIC_ORDERS_API_URL;

        const url = getBaseUrl('orders');
        expect(url).toBe('');
      });

      it('returns empty string when env vars are not set on client', () => {
        global.window = {} as any;
        delete process.env.INTERNAL_ORDERS_API_URL;
        delete process.env.NEXT_PUBLIC_ORDERS_API_URL;

        const url = getBaseUrl('orders');
        expect(url).toBe('');
      });
    });

    describe('inventory service', () => {
      it('returns INTERNAL_INVENTORY_API_URL on server', () => {
        // @ts-ignore
        delete global.window;
        process.env.INTERNAL_INVENTORY_API_URL = 'http://inventory-service:8002';
        process.env.NEXT_PUBLIC_INVENTORY_API_URL = 'http://localhost:8002';

        const url = getBaseUrl('inventory');
        expect(url).toBe('http://inventory-service:8002');
      });

      it('returns NEXT_PUBLIC_INVENTORY_API_URL on client', () => {
        global.window = {} as any;
        process.env.INTERNAL_INVENTORY_API_URL = 'http://inventory-service:8002';
        process.env.NEXT_PUBLIC_INVENTORY_API_URL = 'http://localhost:8002';

        const url = getBaseUrl('inventory');
        expect(url).toBe('http://localhost:8002');
      });

      it('returns empty string when env vars are not set on server', () => {
        // @ts-ignore
        delete global.window;
        delete process.env.INTERNAL_INVENTORY_API_URL;
        delete process.env.NEXT_PUBLIC_INVENTORY_API_URL;

        const url = getBaseUrl('inventory');
        expect(url).toBe('');
      });

      it('returns empty string when env vars are not set on client', () => {
        global.window = {} as any;
        delete process.env.INTERNAL_INVENTORY_API_URL;
        delete process.env.NEXT_PUBLIC_INVENTORY_API_URL;

        const url = getBaseUrl('inventory');
        expect(url).toBe('');
      });
    });

    describe('unknown service', () => {
      it('returns empty string for unknown service name', () => {
        // @ts-ignore
        delete global.window;
        const url = getBaseUrl('unknown');
        expect(url).toBe('');
      });

      it('returns empty string for empty service name', () => {
        // @ts-ignore
        delete global.window;
        const url = getBaseUrl('');
        expect(url).toBe('');
      });
    });

    describe('server vs client detection', () => {
      it('correctly identifies server environment', () => {
        // @ts-ignore
        delete global.window;
        process.env.INTERNAL_PRODUCTS_API_URL = 'http://internal-url';
        process.env.NEXT_PUBLIC_PRODUCTS_API_URL = 'http://public-url';

        const url = getBaseUrl('products');
        expect(url).toBe('http://internal-url');
      });

      it('correctly identifies client environment', () => {
        global.window = {} as any;
        process.env.INTERNAL_PRODUCTS_API_URL = 'http://internal-url';
        process.env.NEXT_PUBLIC_PRODUCTS_API_URL = 'http://public-url';

        const url = getBaseUrl('products');
        expect(url).toBe('http://public-url');
      });
    });

    describe('edge cases', () => {
      it('handles whitespace in service name', () => {
        const url = getBaseUrl(' products ');
        expect(url).toBe('');
      });

      it('handles case sensitivity in service name', () => {
        const url = getBaseUrl('Products');
        expect(url).toBe('');
      });

      it('handles null environment variables gracefully', () => {
        // @ts-ignore
        delete global.window;
        process.env.INTERNAL_PRODUCTS_API_URL = undefined as any;

        const url = getBaseUrl('products');
        expect(url).toBe('');
      });
    });
  });

  describe('service name validation', () => {
    const validServices = ['products', 'orders', 'inventory'];

    validServices.forEach((service) => {
      it(`accepts valid service name: ${service}`, () => {
        // @ts-ignore
        delete global.window;
        const url = getBaseUrl(service);
        expect(typeof url).toBe('string');
      });
    });
  });

  describe('URL format validation', () => {
    it('returns URL without trailing slash', () => {
      // @ts-ignore
      delete global.window;
      process.env.INTERNAL_PRODUCTS_API_URL = 'http://products-service:8000';

      const url = getBaseUrl('products');
      expect(url).not.toMatch(/\/$/);
    });

    it('preserves protocol in URL', () => {
      // @ts-ignore
      delete global.window;
      process.env.INTERNAL_PRODUCTS_API_URL = 'https://products-service:8000';

      const url = getBaseUrl('products');
      expect(url).toMatch(/^https:\/\//);
    });
  });
});

