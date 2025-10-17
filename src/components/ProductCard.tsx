import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Edit, Eye, ImageOff } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/store/slices/productsSlice';
import { useToast } from '@/hooks/use-toast';
import DeleteDialog from './DeleteDialog';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

const ProductCard = ({ product, onDelete, isDeleting }: ProductCardProps) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteClick = async () => {
    try {
      setIsLoading(true);
      await onDelete(product.id);
      toast({ title: 'Product deleted successfully!', variant: 'default' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className=" flex flex-col border-border hover:shadow-lg transition-shadow duration-300">
        {/* Product Image */}
        <div className="relative aspect-square">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover rounded-t-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageOff className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {product.name}
            </CardTitle>
            {product.category && (
              <Badge variant="outline" className="shrink-0">
                {product.category.name}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-2 flex-1">
          {product.description && (
            <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-auto">
            <span className="text-2xl font-bold text-foreground">
              ৳ {Number(product.price).toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">
              {product.id.slice(0, 8)}
            </span>
          </div>
        </CardContent>

        <CardFooter className="pt-2">
          <div className="flex w-full gap-2">
            <Link to={`/products/${product.slug || product.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            </Link>
            <Link to={`/products/edit/${product.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting || isLoading}
              className="px-3"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteClick}
        productName={product.name}
      />
    </>
  );
};

export default ProductCard;
