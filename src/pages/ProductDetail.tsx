import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import DeleteDialog from "@/components/DeleteDialog";
import { productService } from "@/services/productService";
import type { Product } from "@/services/productService";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
  };

  const nextImage = useCallback(() => {
    setSelectedImage(prev => {
      if (!product?.images?.length) return prev;
      return (prev + 1) % product.images.length;
    });
  }, [product?.images?.length]);

  const prevImage = useCallback(() => {
    setSelectedImage(prev => {
      if (!product?.images?.length) return prev;
      return (prev - 1 + product.images.length) % product.images.length;
    });
  }, [product?.images?.length]);

  const loadProduct = useCallback(async () => {
    if (!id) {
      toast({
        title: "Error",
        description: "Product ID is missing",
        variant: "destructive",
      });
      navigate("/products");
      return;
    }

    try {
      setLoading(true);
      const response = await productService.getProduct(id);
      setProduct(response);
    } catch (error) {
      console.error("Error loading product:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load product';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      navigate("/products");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleDelete = async () => {
    if (!product) return;

    try {
      setIsDeleting(true);
      await productService.deleteProduct(product.id);
      
      toast({
        title: "Success",
        description: `${product.name} has been deleted successfully`,
      });
      
      // Redirect to products list after successful deletion
      navigate("/products");
    } catch (error) {
      console.error("Error deleting product:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  useEffect(() => {
    if (!showFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFullscreen(false);
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreen, prevImage, nextImage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-4">
      <div className="container mx-auto max-w-5xl py-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/products")}
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <Card className="border-border shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-10 p-8">
            <div className="flex flex-col gap-4">
              {product.images && product.images.length > 0 ? (
                <>
                  <div 
                    className="w-full aspect-square rounded-xl overflow-hidden border border-border relative cursor-zoom-in"
                    onClick={() => setShowFullscreen(true)}
                  >
                    <img
                      src={product.images[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-opacity duration-200"
                    />
                    {product.images.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {product.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageClick(index);
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === selectedImage ? 'bg-primary w-6' : 'bg-muted-foreground/50 w-2'
                            }`}
                            aria-label={`View image ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {product.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {product.images.map((image, i) => (
                        <button
                          key={i}
                          onClick={() => handleImageClick(i)}
                          className={`w-full h-24 rounded-lg border overflow-hidden transition-all ${
                            i === selectedImage ? 'ring-2 ring-primary' : 'border-border hover:opacity-80'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${product.name} ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fullscreen Image Viewer */}
                  {showFullscreen && (
                    <div 
                      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                      onClick={() => setShowFullscreen(false)}
                    >
                      <button 
                        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFullscreen(false);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                      
                      <button 
                        className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                      
                      <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
                        <img
                          src={product.images[selectedImage]}
                          alt={product.name}
                          className="max-w-full max-h-[90vh] object-contain"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      <button 
                        className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </button>
                      
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {product.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageClick(index);
                            }}
                            className={`w-3 h-3 rounded-full transition-all ${
                              index === selectedImage ? 'bg-white' : 'bg-white/50'
                            }`}
                            aria-label={`View image ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-96 bg-muted rounded-lg border text-muted-foreground">
                  No image available
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl font-bold">
                      {product.name}
                    </CardTitle>
                    {product.category && (
                      <Badge variant="secondary" className="mt-2">
                        {product.category.name}
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mt-4">Description</h3>
                  <p className="text-muted-foreground mt-2 leading-relaxed">
                    {product.description || "No description available."}
                  </p>
                </div>
              </div>
              <div className="text-3xl font-semibold text-primary">
                    ৳ {product.price.toFixed(2)}
                  </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Link to={`/products/edit/${product.id}`} className="flex-1">
                  <Button className="w-full" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Product
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Product
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        productName={product.name}
      />
    </div>
  );
};

export default ProductDetail;
