'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
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
  ClipboardList,
  Clock,
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useBusinessType } from '@/hooks/useBusinessType';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
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
import { cachedFetch, invalidateCachePrefix } from '@/lib/client-cache';
import { cn } from '@/lib/utils';
import { POSNavTabs } from '@/components/pos';
import { ServiceFormDialog } from '@/components/pos/ServiceFormDialog';
import { PRICING_TYPE_LABELS, DURATION_UNIT_LABELS } from '@/types/service.types';
import type { Product, ProductFormData } from '@/types/pos.types';
import type { Service, DurationUnit } from '@/types/service.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(centavos: number): string {
  return `\u20B1${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function formatDuration(minutes: number, unit: DurationUnit): string {
  const label = DURATION_UNIT_LABELS[unit] ?? unit;
  return `${minutes} ${label.toLowerCase()}`;
}

interface DeleteTarget {
  type: 'product' | 'service';
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Default form data
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function POSProductsPage() {
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();
  const { isService, isProduct, isHybrid, isLoading: isLoadingBusinessType } = useBusinessType();

  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Service state
  const [services, setServices] = useState<Service[]>([]);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Shared state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const hasPOS = subscription?.plan?.hasPOS ?? false;

  // Derived flags
  const showProducts = isProduct || isHybrid;
  const showServices = isService || isHybrid;

  // Dynamic labels
  const pageTitle = isService ? 'Services' : isHybrid ? 'Catalog' : 'Products';
  const itemLabel = isService ? 'service' : isHybrid ? 'item' : 'product';

  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------

  const categories = useMemo(() => {
    const cats = new Set<string>();
    if (showProducts) {
      for (const p of products) {
        cats.add(p.category || 'Uncategorized');
      }
    }
    if (showServices) {
      for (const s of services) {
        cats.add(s.category || 'Uncategorized');
      }
    }
    return ['All', ...Array.from(cats).sort()];
  }, [products, services, showProducts, showServices]);

  // ---------------------------------------------------------------------------
  // Filtered items
  // ---------------------------------------------------------------------------

  const filteredProducts = useMemo(() => {
    if (!showProducts) return [];
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
  }, [products, activeCategory, searchQuery, showProducts]);

  const filteredServices = useMemo(() => {
    if (!showServices) return [];
    let filtered = services;
    if (activeCategory !== 'All') {
      filtered = filtered.filter(s => (s.category || 'Uncategorized') === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [services, activeCategory, searchQuery, showServices]);

  const totalItems = filteredProducts.length + filteredServices.length;
  const allItemsCount = products.length + services.length;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!hasPOS || isLoadingBusinessType) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const fetches: Promise<void>[] = [];

        if (showProducts) {
          fetches.push(
            cachedFetch<{ products: Product[] }>('/api/dashboard/pos/products')
              .then(data => { if (data.products) setProducts(data.products); })
          );
        }

        if (showServices) {
          fetches.push(
            cachedFetch<{ services: Service[] }>('/api/dashboard/pos/services')
              .then(data => { if (data.services) setServices(data.services); })
          );
        }

        await Promise.all(fetches);
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [hasPOS, isLoadingBusinessType, showProducts, showServices]);

  // ---------------------------------------------------------------------------
  // Product dialog handlers
  // ---------------------------------------------------------------------------

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

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload image. Please try again.');
        return;
      }

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

  // ---------------------------------------------------------------------------
  // Service dialog handlers
  // ---------------------------------------------------------------------------

  const handleOpenServiceDialog = (service?: Service) => {
    setSelectedService(service ?? null);
    setIsServiceDialogOpen(true);
  };

  const handleServiceSave = (saved: Service) => {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  };

  // ---------------------------------------------------------------------------
  // Delete handler (product or service)
  // ---------------------------------------------------------------------------

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const endpoint =
        deleteTarget.type === 'product'
          ? `/api/dashboard/pos/products/${deleteTarget.id}`
          : `/api/dashboard/pos/services/${deleteTarget.id}`;

      const response = await fetch(endpoint, { method: 'DELETE' });

      if (response.ok) {
        if (deleteTarget.type === 'product') {
          setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        } else {
          setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        }
      }
    } catch (err) {
      console.error(`Failed to delete ${deleteTarget.type}:`, err);
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading / gate states
  // ---------------------------------------------------------------------------

  if (isLoadingSubscription || isLoadingBusinessType) {
    return (
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6">
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

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const searchPlaceholder = isHybrid
    ? 'Search products, services, or SKU...'
    : isService
      ? 'Search services...'
      : 'Search products or SKU...';

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {allItemsCount > 0
                ? `${allItemsCount} ${itemLabel}${allItemsCount === 1 ? '' : 's'} in your catalog`
                : `Manage your ${itemLabel} catalog for POS`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showServices && (
              <Button onClick={() => handleOpenServiceDialog()} size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Add Service</span>
                <span className="sm:hidden">Service</span>
              </Button>
            )}
            {showProducts && (
              <Button onClick={() => handleOpenDialog()} size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Product</span>
              </Button>
            )}
          </div>
        </div>

        {/* Sub-Navigation */}
        <POSNavTabs />

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-11 w-full max-w-sm rounded-xl" />
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
        ) : allItemsCount === 0 ? (
          /* Empty state */
          <Card className="shadow-card border border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground">
              {isService ? (
                <ClipboardList className="h-12 w-12 sm:h-14 sm:w-14 mb-3" />
              ) : (
                <Package className="h-12 w-12 sm:h-14 sm:w-14 mb-3" />
              )}
              <p className="font-display font-semibold text-lg text-foreground">
                No {itemLabel}s yet
              </p>
              <p className="text-sm mt-1">
                Add {itemLabel}s to use them in POS
              </p>
              <div className="flex gap-2 mt-5">
                {showServices && (
                  <Button onClick={() => handleOpenServiceDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Service
                  </Button>
                )}
                {showProducts && (
                  <Button onClick={() => handleOpenDialog()} variant={showServices ? 'outline' : 'default'}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Product
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search */}
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl pl-10"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'h-8 rounded-full text-xs sm:text-sm hover:scale-[1.02] transition-all',
                  )}
                >
                  {cat !== 'All' && <Tag className="h-3 w-3 mr-1.5" />}
                  {cat}
                </Button>
              ))}
            </div>

            {/* Table */}
            <Card className="shadow-card border border-border/50">
              <CardContent className="p-0">
                {totalItems === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Package className="h-10 w-10 mb-2" />
                    <p>No {itemLabel}s match your filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs uppercase tracking-wider">
                            {isHybrid ? 'Item' : pageTitle.slice(0, -1)}
                          </TableHead>
                          {isHybrid && (
                            <TableHead className="text-xs uppercase tracking-wider hidden sm:table-cell">
                              Type
                            </TableHead>
                          )}
                          <TableHead className="text-xs uppercase tracking-wider hidden sm:table-cell">
                            SKU
                          </TableHead>
                          <TableHead className="text-xs uppercase tracking-wider hidden sm:table-cell">
                            Category
                          </TableHead>
                          <TableHead className="text-xs uppercase tracking-wider text-right">
                            Price
                          </TableHead>
                          {showServices && (
                            <TableHead className="text-xs uppercase tracking-wider text-center hidden sm:table-cell">
                              Duration
                            </TableHead>
                          )}
                          {showProducts && (
                            <TableHead className="text-xs uppercase tracking-wider text-right">
                              Stock
                            </TableHead>
                          )}
                          <TableHead className="w-[50px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Service rows */}
                        {filteredServices.map((service) => (
                          <TableRow
                            key={`svc-${service.id}`}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                                  {service.image_url ? (
                                    <img
                                      src={service.image_url}
                                      alt={service.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-display font-semibold truncate text-sm sm:text-base">
                                    {service.name}
                                  </p>
                                  {!service.is_active && (
                                    <Badge variant="secondary" className="text-[10px] mt-0.5">
                                      Inactive
                                    </Badge>
                                  )}
                                  <p className="text-xs text-muted-foreground sm:hidden">
                                    {service.category || 'Uncategorized'}
                                    {service.duration_minutes
                                      ? ` \u00B7 ${formatDuration(service.duration_minutes, service.duration_unit)}`
                                      : ''}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            {isHybrid && (
                              <TableCell className="hidden sm:table-cell">
                                <Badge variant="outline" className="text-xs">
                                  Service
                                </Badge>
                              </TableCell>
                            )}
                            <TableCell className="text-muted-foreground hidden sm:table-cell font-mono text-xs">
                              &mdash;
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">
                              {service.category || 'Uncategorized'}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatPrice(service.price_centavos)}
                              {service.pricing_type !== 'fixed' && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  / {PRICING_TYPE_LABELS[service.pricing_type]?.toLowerCase()}
                                </span>
                              )}
                            </TableCell>
                            {showServices && (
                              <TableCell className="text-center hidden sm:table-cell">
                                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatDuration(service.duration_minutes, service.duration_unit)}
                                </span>
                              </TableCell>
                            )}
                            {showProducts && (
                              <TableCell className="text-right text-muted-foreground">
                                &mdash;
                              </TableCell>
                            )}
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleOpenServiceDialog(service)}
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setDeleteTarget({
                                        type: 'service',
                                        id: service.id,
                                        name: service.name,
                                      });
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

                        {/* Product rows */}
                        {filteredProducts.map((product) => (
                          <TableRow
                            key={`prod-${product.id}`}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-display font-semibold truncate text-sm sm:text-base">
                                    {product.name}
                                  </p>
                                  {!product.is_active && (
                                    <Badge variant="secondary" className="text-[10px] mt-0.5">
                                      Inactive
                                    </Badge>
                                  )}
                                  <p className="text-xs text-muted-foreground sm:hidden">
                                    {product.sku || '\u2014'} \u00B7 {product.category || 'Uncategorized'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            {isHybrid && (
                              <TableCell className="hidden sm:table-cell">
                                <Badge variant="outline" className="text-xs">
                                  Product
                                </Badge>
                              </TableCell>
                            )}
                            <TableCell className="text-muted-foreground hidden sm:table-cell font-mono text-xs">
                              {product.sku || '\u2014'}
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">
                              {product.category || 'Uncategorized'}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatPrice(product.price_centavos)}
                            </TableCell>
                            {showServices && (
                              <TableCell className="text-center hidden sm:table-cell text-muted-foreground">
                                &mdash;
                              </TableCell>
                            )}
                            {showProducts && (
                              <TableCell className="text-right font-mono">
                                <span
                                  className={cn(
                                    'inline-flex items-center justify-end px-2 py-0.5 rounded-md text-xs font-semibold',
                                    product.stock_quantity === 0
                                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                      : product.stock_quantity <= product.low_stock_threshold
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                  )}
                                >
                                  {product.stock_quantity}
                                </span>
                              </TableCell>
                            )}
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleOpenDialog(product)}
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setDeleteTarget({
                                        type: 'product',
                                        id: product.id,
                                        name: product.name,
                                      });
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
          {/* Subtle top gradient accent */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-t-lg" />

          <DialogHeader className="shrink-0">
            <DialogTitle className="font-display">
              {selectedProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
          </DialogHeader>

          <form
            id="product-form"
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            className="space-y-3 sm:space-y-4 py-3 sm:py-4 overflow-y-auto flex-1 -mx-4 px-4 sm:-mx-6 sm:px-6"
          >
            {/* Name & Price */}
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
                <Label htmlFor="price">Price ({'\u20B1'}) *</Label>
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
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Click to upload image
                      </span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">Max 2MB</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Active Toggle - bordered box with helper text */}
            <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Inactive products won&apos;t appear in POS
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </form>

          <DialogFooter className="shrink-0 pt-2 border-t">
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
              ) : selectedProduct ? (
                'Save Changes'
              ) : (
                'Add Product'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <ServiceFormDialog
        open={isServiceDialogOpen}
        onOpenChange={(open) => {
          setIsServiceDialogOpen(open);
          if (!open) setSelectedService(null);
        }}
        service={selectedService}
        onSave={handleServiceSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === 'service' ? 'Service' : 'Product'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteTarget(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
