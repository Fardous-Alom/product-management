import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, LogOut } from 'lucide-react';
import { 
  fetchProducts, 
  fetchCategories, 
  setSearchQuery, 
  setCurrentPage,
  deleteProduct,
  Product
} from '@/store/slices/productsSlice';
import { RootState, AppDispatch } from '@/store/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const Products = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    products, 
    loading, 
    totalCount, 
    currentPage, 
    itemsPerPage, 
    searchQuery,
    error: productsError 
  } = useSelector((state: RootState) => state.products);
  
  const { logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch categories when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchCategories()).unwrap();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load categories',
          variant: 'destructive',
        });
      }
    };
    
    loadData();
  }, [dispatch, toast]);

  // Show error toast if there's an error loading products
  useEffect(() => {
    if (productsError) {
      toast({
        title: 'Error',
        description: productsError,
        variant: 'destructive',
      });
    }
  }, [productsError, toast]);

  // Fetch products when component mounts or search query changes
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('Fetching products...', { searchQuery, currentPage, itemsPerPage });
        const resultAction = await dispatch(fetchProducts());
        if (fetchProducts.fulfilled.match(resultAction)) {
          console.log('Products loaded successfully:', resultAction.payload);
        }
      } catch (error) {
        console.error('Error in products effect:', error);
      }
    };

    loadProducts();
  }, [dispatch, searchQuery, currentPage, itemsPerPage]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  
  // Debug logs
  if (process.env.NODE_ENV === 'development') {
    console.log('Products State:', {
      productsCount: products.length,
      totalCount,
      itemsPerPage,
      totalPages,
      currentPage,
      loading,
      error: productsError
    });
  }
  
  // The API already handles pagination, so we can use products directly
  const paginatedProducts = products;

  // Handle product deletion
  const handleDelete = useCallback(async (id: string) => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      await dispatch(deleteProduct(id)).unwrap();
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      // Refresh products after deletion
      await dispatch(fetchProducts());
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, isDeleting, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Product Manager</h1>
          <Button 
            onClick={() => {
              logout();
              navigate('/auth');
            }} 
            variant="ghost" 
            size="sm"
            disabled={isDeleting}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="pl-10"
              disabled={loading}
            />
          </div>
          <Link to="/products/create">
            <Button disabled={loading || isDeleting}>
              <Plus className="w-4 h-4 mr-2" />
              Create Product
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchQuery ? 'No products found matching your search.' : 'No products yet. Create your first product!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => !loading && dispatch(setCurrentPage(Math.max(1, currentPage - 1)))}
                      className={currentPage === 1 || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => !loading && dispatch(setCurrentPage(page))}
                        isActive={currentPage === page}
                        className={loading ? 'pointer-events-none' : 'cursor-pointer'}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => !loading && dispatch(setCurrentPage(Math.min(totalPages, currentPage + 1)))}
                      className={currentPage === totalPages || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Products;
