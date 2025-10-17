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
  async getProducts(offset: number = 0, limit: number = 50, categoryId?: string): Promise<{ products: Product[]; total: number }> {
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch products:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
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
      throw error;
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
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to delete product');
    }

    return response.json();
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
