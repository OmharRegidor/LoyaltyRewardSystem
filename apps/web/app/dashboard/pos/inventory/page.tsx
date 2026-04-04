'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  PackageX,
  Plus,
  SlidersHorizontal,
  MoreHorizontal,
  ArrowDownToLine,
  Search,
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { createClient } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  POSNavTabs,
  StockLevelBadge,
  ReceiveStockDialog,
  AdjustStockDialog,
  StockMovementTable,
} from '@/components/pos';
import { cachedFetch } from '@/lib/client-cache';
import { useBusinessType } from '@/hooks/useBusinessType';
import type {
  Product,
  InventorySummary,
  StockMovementWithProduct,
  StockMovementType,
} from '@/types/pos.types';

export default function InventoryPage() {
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();
  const { isService, isHybrid } = useBusinessType();
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [movements, setMovements] = useState<StockMovementWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);

  // Dialog state
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [preselectedProductId, setPreselectedProductId] = useState<string | undefined>();


  // Movement filter state
  const [filterProductId, setFilterProductId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Stock filter state
  const [stockSearch, setStockSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'in-stock'>('all');

  const hasPOS = subscription?.plan?.hasPOS ?? false;

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (stockFilter === 'low') {
      filtered = filtered.filter(p => p.stock_quantity <= p.low_stock_threshold);
    } else if (stockFilter === 'in-stock') {
      filtered = filtered.filter(p => p.stock_quantity > p.low_stock_threshold);
    }
    if (stockSearch.trim()) {
      const q = stockSearch.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [products, stockFilter, stockSearch]);

  const loadInventory = useCallback(async () => {
    try {
      const data = await cachedFetch<{ products: Product[]; summary: InventorySummary }>('/api/dashboard/pos/inventory');
      setProducts(data.products);
      setSummary(data.summary);
      setMovements(data.summary?.recent_movements || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMovements = useCallback(async () => {
    setIsLoadingMovements(true);
    try {
      const params = new URLSearchParams();
      if (filterProductId && filterProductId !== 'all') {
        params.set('product_id', filterProductId);
      }
      if (filterType && filterType !== 'all') {
        params.set('movement_type', filterType);
      }
      params.set('limit', '50');

      const data = await cachedFetch<{ movements: StockMovementWithProduct[] }>(`/api/dashboard/pos/inventory/movements?${params.toString()}`);
      setMovements(data.movements);
    } catch (err) {
      console.error('Failed to load movements:', err);
    } finally {
      setIsLoadingMovements(false);
    }
  }, [filterProductId, filterType]);

  useEffect(() => {
    if (hasPOS) {
      loadInventory();
    }
  }, [hasPOS, loadInventory]);

  useEffect(() => {
    if (hasPOS && !isLoading) {
      loadMovements();
    }
  }, [hasPOS, isLoading, loadMovements]);

  // Fetch business ID for realtime subscriptions
  const [businessId, setBusinessId] = useState<string | null>(null);
  useEffect(() => {
    async function fetchBusinessId() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      if (business) setBusinessId(business.id);
    }
    fetchBusinessId();
  }, []);

  // Realtime subscriptions for stock updates
  useEffect(() => {
    if (!businessId) return;

    const supabase = createClient();

    const productsChannel = supabase
      .channel(`inventory-products-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          loadInventory();
        },
      )
      .subscribe();

    const movementsChannel = supabase
      .channel(`inventory-movements-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_movements',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          loadMovements();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(movementsChannel);
    };
  }, [businessId, loadInventory, loadMovements]);

  const handleReceiveForProduct = (productId: string) => {
    setPreselectedProductId(productId);
    setReceiveDialogOpen(true);
  };

  const handleAdjustForProduct = (productId: string) => {
    setPreselectedProductId(productId);
    setAdjustDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    loadInventory();
    loadMovements();
  };

  if (isLoadingSubscription) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground mt-1">Track stock levels and movements</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-border/60"
              onClick={() => {
                setPreselectedProductId(undefined);
                setAdjustDialogOpen(true);
              }}
            >
              <SlidersHorizontal className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Adjust Stock</span>
            </Button>
            <Button
              size="sm"
              className="shadow-sm"
              onClick={() => {
                setPreselectedProductId(undefined);
                setReceiveDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Receive Stock</span>
            </Button>
          </div>
        </div>

        {/* Sub-Navigation */}
        <POSNavTabs />

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card className="py-4 border border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Products</p>
                      <p className="font-display text-2xl font-bold tracking-tight mt-0.5">{summary?.total_products ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="py-4 border border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                      (summary?.low_stock_count ?? 0) > 0
                        ? 'bg-gradient-to-br from-amber-100 to-amber-50 ring-1 ring-amber-200/60'
                        : 'bg-gradient-to-br from-muted to-muted/50 ring-1 ring-border/30'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        (summary?.low_stock_count ?? 0) > 0 ? 'text-amber-600' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Low Stock</p>
                      <p className={`font-display text-2xl font-bold tracking-tight mt-0.5 ${
                        (summary?.low_stock_count ?? 0) > 0 ? 'text-amber-600' : ''
                      }`}>
                        {summary?.low_stock_count ?? 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="py-4 border border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                      (summary?.out_of_stock_count ?? 0) > 0
                        ? 'bg-gradient-to-br from-red-100 to-red-50 ring-1 ring-red-200/60'
                        : 'bg-gradient-to-br from-muted to-muted/50 ring-1 ring-border/30'
                    }`}>
                      <PackageX className={`h-5 w-5 ${
                        (summary?.out_of_stock_count ?? 0) > 0 ? 'text-red-600' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Out of Stock</p>
                      <p className={`font-display text-2xl font-bold tracking-tight mt-0.5 ${
                        (summary?.out_of_stock_count ?? 0) > 0 ? 'text-red-600' : ''
                      }`}>
                        {summary?.out_of_stock_count ?? 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Service info for hybrid/service businesses */}
            {(isHybrid || isService) && (
              <div className="flex items-start sm:items-center gap-2 rounded-lg bg-blue-50 border-l-4 border-l-blue-400 px-3 sm:px-4 py-3 text-xs sm:text-sm text-blue-700">
                <Package className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
                <p>Inventory tracking applies to products only. Services are managed in the <a href="/dashboard/pos/products" className="font-medium underline">Catalog</a> tab.</p>
              </div>
            )}

            {/* Stock Table with Search + Filters */}
            <Card className="border border-border/50 shadow-card overflow-hidden">
              <CardContent className="p-0">
                {/* Search + Stock Filter */}
                <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 space-y-3 border-b border-border/30">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative flex-1 sm:max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        placeholder="Search by product or SKU..."
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        className="pl-9 bg-muted/30 border-border/40 focus:bg-background"
                      />
                    </div>
                    <div className="flex gap-1.5 sm:ml-auto">
                      {([
                        { value: 'all', label: 'All' },
                        { value: 'low', label: 'Low Stock' },
                        { value: 'in-stock', label: 'In Stock' },
                      ] as const).map((f) => (
                        <Button
                          key={f.value}
                          variant={stockFilter === f.value ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setStockFilter(f.value)}
                          className={`h-8 text-xs sm:text-sm ${
                            stockFilter !== f.value ? 'text-muted-foreground hover:text-foreground' : ''
                          }`}
                        >
                          {f.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    Showing {filteredProducts.length} of {products.length} items
                  </p>
                </div>
                {products.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm">No products yet. Add products in the Products tab.</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm">No products match your filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/30 bg-muted/20">
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 pl-4 sm:pl-6">Product</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">SKU</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Category</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Stock</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 hidden sm:table-cell">Threshold</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
                        <TableHead className="w-[50px] pr-4 sm:pr-6" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id} className="hover:bg-muted/50 transition-colors border-border/20">
                          <TableCell className="font-medium pl-4 sm:pl-6">
                            <span className="truncate block max-w-[120px] sm:max-w-none">{product.name}</span>
                            {!product.is_active && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Inactive</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground hidden sm:table-cell font-mono text-xs">
                            {product.sku || '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                            {product.category || '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-sm font-semibold">
                            {product.stock_quantity}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-sm text-muted-foreground hidden sm:table-cell">
                            {product.low_stock_threshold}
                          </TableCell>
                          <TableCell>
                            <StockLevelBadge
                              stockQuantity={product.stock_quantity}
                              lowStockThreshold={product.low_stock_threshold}
                            />
                          </TableCell>
                          <TableCell className="pr-4 sm:pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleReceiveForProduct(product.id)}>
                                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                                  Receive Stock
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAdjustForProduct(product.id)}>
                                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                                  Adjust Stock
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

            {/* Movement History */}
            <Card className="border border-border/50 shadow-card overflow-hidden">
              <CardHeader className="border-b border-border/30 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="font-display text-lg font-semibold tracking-tight">Stock Movement History</CardTitle>
                  <div className="flex gap-2">
                    <Select value={filterProductId} onValueChange={setFilterProductId}>
                      <SelectTrigger className="w-full sm:w-[180px] bg-muted/30 border-border/40">
                        <SelectValue placeholder="All Products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full sm:w-[160px] bg-muted/30 border-border/40">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sale">Sale</SelectItem>
                        <SelectItem value="void_restore">Void Restore</SelectItem>
                        <SelectItem value="receiving">Receiving</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 py-0">
                {isLoadingMovements ? (
                  <div className="space-y-4 py-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <StockMovementTable movements={movements} />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Dialogs */}
      <ReceiveStockDialog
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        products={products}
        preselectedProductId={preselectedProductId}
        onSuccess={handleDialogSuccess}
      />
      <AdjustStockDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        products={products}
        preselectedProductId={preselectedProductId}
        onSuccess={handleDialogSuccess}
      />
    </DashboardLayout>
  );
}
