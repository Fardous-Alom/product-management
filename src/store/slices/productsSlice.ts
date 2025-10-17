import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { productService, Product, Category } from '@/services/productService';

interface ProductsState {
  products: Product[];
  categories: {
    categories: Category[];
    total: number;
  } | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  totalCount: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
}

const initialState: ProductsState = {
  products: [],
  categories: null,
  loading: false,
  error: null,
  currentPage: 1,
  itemsPerPage: 9,
  searchQuery: '',
  totalCount: 0,
};

interface ApiResponse {
  products: Product[];
  total: number;
  data?: Product[];
  totalCount?: number;
}

export const fetchProducts = createAsyncThunk<{ products: Product[]; total: number }, void, { state: { products: ProductsState } }>(
  'products/fetchProducts',
  async (_, { getState }) => {
    const state = getState();
    const { currentPage, itemsPerPage, searchQuery } = state.products;

    try {
      const offset = (currentPage - 1) * itemsPerPage;

      if (searchQuery) {
        const results = await productService.searchProducts(searchQuery);
        const products = Array.isArray(results) ? results : [];
        return {
          products,
          total: products.length
        };
      }

      const response = await productService.getProducts(offset, itemsPerPage) as ApiResponse | Product[];

      // Handle different response formats
      let products: Product[] = [];
      let total = 0;

      if (Array.isArray(response)) {
        products = response;
        total = response.length;
      } else {
        products = response.products || response.data || [];
        total = response.total || response.totalCount || products.length;
      }

      console.log('API Response:', { products, total });

      return { products, total };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch products');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { categories, total } = await productService.getCategories();
      return { categories, total };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch categories';
      return rejectWithValue(message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: string, { rejectWithValue }) => {
    try {
      await productService.deleteProduct(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete product');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.currentPage = 1; // Reset to first page when search query changes
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalCount = action.payload.total;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = {
          categories: action.payload.categories,
          total: action.payload.total
        };
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch categories';
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(product => product.id !== action.payload);
        state.totalCount = Math.max(0, state.totalCount - 1);
      });
  },
});

export const { setSearchQuery, setCurrentPage } = productsSlice.actions;
export default productsSlice.reducer;

export type { Product };
