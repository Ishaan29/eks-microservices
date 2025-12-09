// Add ': string' after serviceName
export const getBaseUrl = (serviceName: string) => {
  const isServer = typeof window === 'undefined';

  if (serviceName === 'products') {
    return isServer 
      ? process.env.INTERNAL_PRODUCTS_API_URL || ''
      : process.env.NEXT_PUBLIC_PRODUCTS_API_URL || '';
  }

  if (serviceName === 'orders') {
    return isServer 
      ? process.env.INTERNAL_ORDERS_API_URL || ''
      : process.env.NEXT_PUBLIC_ORDERS_API_URL || '';
  }

  if (serviceName === 'inventory') {
    return isServer 
      ? process.env.INTERNAL_INVENTORY_API_URL || ''
      : process.env.NEXT_PUBLIC_INVENTORY_API_URL || '';
  }
  
  return '';
};