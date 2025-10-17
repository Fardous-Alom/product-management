import { authService } from './authService';

const API_BASE_URL = 'https://api.bitechx.com';

export interface Category {
  id: string;
  name: string;
  image: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  slug: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No authentication token found');

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const productService = {
  
  async getProducts(
    offset: number = 0, 
    limit: number = 50, 
    categoryId?: string, 
    retryCount: number = 0
  ): Promise<{ products: Product[]; total: number }> {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000; // 1 second base delay

    try {
      const url = new URL(`${API_BASE_URL}/products`);
      url.searchParams.append('offset', offset.toString());
      url.searchParams.append('limit', limit.toString());
      if (categoryId) {
        url.searchParams.append('categoryId', categoryId);
      }

      console.log('Fetching products from:', url.toString());

      const response = await fetch(url.toString(), {
        headers: getAuthHeaders()
      });

      console.log('Response status:', response.status);

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        if (retryCount < MAX_RETRIES) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter 
            ? parseInt(retryAfter, 10) * 1000 
            : Math.min(BASE_DELAY * Math.pow(2, retryCount), 30000); // Cap at 30 seconds
          
          console.log(`Rate limited. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.getProducts(offset, limit, categoryId, retryCount + 1);
        }
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch products:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // Handle other potential errors
        if (response.status === 401) {
          // Handle unauthorized (token might be expired)
          authService.logout();
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
        
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }

      // Try to get total count from headers (common in REST APIs)
      const totalCount = response.headers.get('x-total-count');
      const data = await response.json();

      console.log('API Response data:', data);

      // Handle different response formats
      if (Array.isArray(data)) {
        const products = data as Product[];
        const total = totalCount ? parseInt(totalCount, 10) : products.length;
        console.log(`Returning ${products.length} products, total: ${total}`);
        return { products, total };
      }

      // Handle object response with products and total
      const products = data.products || data.data || [];
      const total = data.total || data.totalCount || (totalCount ? parseInt(totalCount, 10) : 0);

      console.log(`Returning ${products.length} products, total: ${total}`);

      return { products, total };
    } catch (error) {
      console.error('Error in getProducts:', error);
      if (retryCount < MAX_RETRIES && !(error instanceof Error && error.message.includes('Session expired'))) {
        const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), 30000);
        console.log(`Retrying after error in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getProducts(offset, limit, categoryId, retryCount + 1);
      }
      throw error instanceof Error ? error : new Error('Failed to fetch products');
    }
  },

  async searchProducts(query: string): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products/search?searchedText=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to search products');
    }

    return response.json();
  },

 async getProduct(identifier: string): Promise<Product> {
  try {
    // First try to get by ID
    const response = await fetch(`${API_BASE_URL}/products/${identifier}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      // If we get an array, return the first item (shouldn't happen with a direct ID)
      return Array.isArray(data) ? data[0] : data;
    }

    // If not found, try to search by ID in the products list
    const productsResponse = await this.getProducts(0, 1, undefined, identifier);
    
    if (productsResponse.products.length > 0) {
      return productsResponse.products[0];
    }

    throw new Error('Product not found');
  } catch (error) {
    console.error('Error in getProduct:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch product');
  }
},

  async createProduct(productData: Omit<Product, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'category'> & { categoryId: string }): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      throw new Error('Failed to create product');
    }

    return response.json();
  },

  async updateProduct(
    id: string,
    productData: {
      name: string;
      description?: string;
      price: number;
      categoryId: string;
      images?: string[];
    }
  ): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        categoryId: productData.categoryId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update product');
    }

    return response.json();
  },

  async deleteProduct(id: string): Promise<{ id: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete product');
    }

    // The API returns the deleted product data, but we only need the ID
    const result = await response.json();
    return { id: result.id };
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete product');
  }
},

  async getCategories(searchText?: string, offset: number = 0, limit: number = 10): Promise<{ categories: Category[]; total: number }> {
    let url = `${API_BASE_URL}/categories?offset=${offset}&limit=${limit}`;

    if (searchText) {
      url = `${API_BASE_URL}/categories/search?searchedText=${encodeURIComponent(searchText)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const categories = await response.json();

    // Get total count from response headers if available, otherwise use the length of returned categories
    const total = response.headers.get('x-total-count')
      ? parseInt(response.headers.get('x-total-count') || '0', 10)
      : categories.length;

    return {
      categories,
      total
    };
  }
};
