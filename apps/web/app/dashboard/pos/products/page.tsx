'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Upload,
  X,
  ImageIcon,
  Search,
  Tag,
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { POSNavTabs } from '@/components/pos';
import type { Product, ProductFormData } from '@/types/pos.types';

function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

const defaultFormData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  category: '',
  sku: '',
  image_url: '',
  is_active: true,
  stock_quantity: 0,
  low_stock_threshold: 5,
};

export default function POSProductsPage() {
  const router = useRouter();
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const hasPOS = subscription?.plan?.hasPOS ?? false;

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const p of products) {
      cats.add(p.category || 'Uncategorized');
    }
    return ['All', ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (activeCategory !== 'All') {
      filtered = filtered.filter(p => (p.category || 'Uncategorized') === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [products, activeCategory, searchQuery]);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      if (!hasPOS) return;

      setIsLoading(true);
      try {
        const response = await fetch('/api/dashboard/pos/products');
        const data = await response.json();

        if (response.ok) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [hasPOS]);

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price_centavos / 100,
        category: product.category || '',
        sku: product.sku || '',
        image_url: product.image_url || '',
        is_active: product.is_active,
        low_stock_threshold: product.low_stock_threshold,
      });
      setImagePreview(product.image_url || null);
    } else {
      setSelectedProduct(null);
      setFormData(defaultFormData);
      setImagePreview(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
    setFormData(defaultFormData);
    setImagePreview(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload image. Please try again.');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image_url: '' }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!formData.name || formData.price <= 0) return;

    setIsSaving(true);
    try {
      // Strip empty strings from optional fields so Zod .optional() treats them as absent
      const payload = {
        ...formData,
        description: formData.description || undefined,
        category: formData.category || undefined,
        sku: formData.sku || undefined,
        image_url: formData.image_url || undefined,
      };

      const url = selectedProduct
        ? `/api/dashboard/pos/products/${selectedProduct.id}`
        : '/api/dashboard/pos/products';
      const method = selectedProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();

        if (selectedProduct) {
          setProducts((prev) =>
            prev.map((p) => (p.id === selectedProduct.id ? data.product : p))
          );
        } else {
          setProducts((prev) => [...prev, data.product]);
        }

        handleCloseDialog();
      }
    } catch (err) {
      console.error('Failed to save product:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/dashboard/pos/products/${selectedProduct.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  if (isLoadingSubscription) {
    return (
      <DashboardLayout>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1.5 sm:space-y-2">
              <Skeleton className="h-7 sm:h-8 w-28 sm:w-36" />
              <Skeleton className="h-4 w-48 sm:w-64" />
            </div>
            <Skeleton className="h-9 sm:h-10 w-28 sm:w-32" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 sm:p-4 border rounded-lg">
                <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasPOS) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)] px-4">
          <Card className="max-w-md w-full">
            <CardContent className="flex flex-col items-center text-center py-8 sm:py-12">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">POS Not Available</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Point of Sale is available on the Enterprise plan.
              </p>
              <Button onClick={() => router.push('/dashboard/settings')}>
                View Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">Products</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {products.length > 0
                ? `${products.length} product${products.length === 1 ? '' : 's'} in your catalog`
                : 'Manage your product catalog for POS'}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="sm" className="shrink-0 sm:size-default">
            <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
            <span className="hidden xs:inline">Add Product</span>
            <span className="xs:hidden">Add</span>
          </Button>
        </div>

        {/* Sub-Navigation */}
        <POSNavTabs />

        {/* Products */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-8 w-64" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 mb-2" />
              <p>No products yet</p>
              <p className="text-sm">Add products to use them in POS</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter Buttons */}
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className="h-8 text-xs sm:text-sm"
                >
                  {cat !== 'All' && <Tag className="h-3 w-3 mr-1.5" />}
                  {cat}
                </Button>
              ))}
            </div>

            {/* Product Table */}
            <Card>
              <CardContent className="p-0">
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Package className="h-10 w-10 mb-2" />
                    <p>No products match your filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="hidden sm:table-cell">SKU</TableHead>
                          <TableHead className="hidden sm:table-cell">Category</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Stock</TableHead>
                          <TableHead className="w-[50px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{product.name}</p>
                                  {!product.is_active && (
                                    <Badge variant="secondary" className="text-[10px] mt-0.5">Inactive</Badge>
                                  )}
                                  <p className="text-xs text-muted-foreground sm:hidden">
                                    {product.sku || '—'} · {product.category || 'Uncategorized'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">
                              {product.sku || '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">
                              {product.category || 'Uncategorized'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatPrice(product.price_centavos)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              <span className={cn(
                                product.stock_quantity <= product.low_stock_threshold && 'text-amber-600 font-semibold',
                                product.stock_quantity === 0 && 'text-red-600 font-semibold'
                              )}>
                                {product.stock_quantity}
                              </span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleOpenDialog(product)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedProduct(product);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-h-[95dvh] sm:max-h-[85vh] flex flex-col overflow-hidden p-4 sm:p-6">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {selectedProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
          </DialogHeader>

          <form id="product-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-3 sm:space-y-4 py-3 sm:py-4 overflow-y-auto flex-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
            {/* Name & Price side by side on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Product name"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="price">Price (₱) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Food, Drinks"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                  placeholder="Optional SKU"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {!selectedProduct && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="stock_quantity">Initial Stock</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>
              )}

              <div className={cn('space-y-1.5 sm:space-y-2', selectedProduct && 'col-span-2 sm:col-span-1')}>
                <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  value={formData.low_stock_threshold || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="5"
                  min="0"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label>Product Image</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative w-full h-28 sm:h-32 rounded-lg overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-24 sm:h-32 flex flex-col items-center justify-center gap-1.5 sm:gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                      <span className="text-xs sm:text-sm">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                      <span className="text-xs sm:text-sm text-muted-foreground">Click to upload image</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">Max 2MB</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </form>

          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="product-form"
              disabled={isSaving || !formData.name || formData.price <= 0}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
