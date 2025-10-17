import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, X, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { RootState, AppDispatch } from '@/store/store';
import { fetchCategories } from '@/store/slices/productsSlice';
import { productService } from '@/services/productService';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  
  // Get categories with proper default value
  const { categories = [], loading: categoriesLoading } = useSelector(
    (state: RootState) => ({
      categories: Array.isArray(state.products.categories?.categories) 
        ? state.products.categories.categories 
        : [],
      loading: state.products.loading
    })
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!id;

  useEffect(() => {
  const loadData = async () => {
    try {
      if (isEditMode && id) {
        const product = await productService.getProduct(id);
        setName(product.name);
        setDescription(product.description || '');
        setPrice(product.price.toString());
        setCategoryId(product.category?.id || '');
        setImages(product.images || []);
      }
      await dispatch(fetchCategories());
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load product data',
        variant: 'destructive',
      });
      navigate('/products');
    }
  };

  loadData();
}, [id, isEditMode, navigate, toast, dispatch]);
useEffect(() => {
  return () => {
    images.forEach(url => URL.revokeObjectURL(url));
  };
}, [images]);
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'Price must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleImageUpload = async (files: FileList | null) => {
  if (!files || files.length === 0) return;
  
  setIsUploading(true);
  try {
    // In a real app, upload files to your server here
    const newImages = Array.from(files).map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImages]);
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to upload images',
      variant: 'destructive',
    });
  } finally {
    setIsUploading(false);
  }
};
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;
  setLoading(true);

  try {
    const productData = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      categoryId: categoryId,
      images: images
    };

    if (isEditMode && id) {
      await productService.updateProduct(id, productData);
      toast({ 
        title: 'Success',
        description: 'Product updated successfully!',
      });
    } else {
      await productService.createProduct(productData);
      toast({
        title: 'Success',
        description: 'Product created successfully!',
      });
    }
    navigate('/products');
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message || 'Failed to save product',
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/products')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <Card className="border-border shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isEditMode ? 'Edit Product' : 'Create New Product'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="text-destructive text-sm">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
  <Label>Product Images</Label>
  <div className="flex flex-wrap gap-4">
    {images.map((image, index) => (
      <div key={index} className="relative group">
        <img
          src={image}
          alt={`Product ${index + 1}`}
          className="h-24 w-24 rounded-md object-cover border"
        />
        <button
          type="button"
          onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ))}
    <label className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center w-24 h-24 cursor-pointer hover:bg-muted/50 transition-colors">
      <UploadCloud className="h-6 w-6 text-muted-foreground mb-1" />
      <span className="text-xs text-muted-foreground text-center">
        {isUploading ? 'Uploading...' : 'Add Image'}
      </span>
      <input
        type="file"
        className="hidden"
        accept="image/*"
        multiple
        onChange={(e) => handleImageUpload(e.target.files)}
        disabled={isUploading}
      />
    </label>
  </div>
</div>
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-destructive text-sm">{errors.price}</p>
                )}
              </div>

              {categoriesLoading ? (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="h-10 flex items-center px-3 py-2 text-sm text-muted-foreground border rounded-md">
                    Loading categories...
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          No categories available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/products')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductForm;
