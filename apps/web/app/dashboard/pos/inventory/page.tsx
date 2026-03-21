'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Warehouse,
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
import { Badge } from '@/components/ui/badge';
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
import type {
  Product,
  InventorySummary,
  StockMovementWithProduct,
  StockMovementType,
} from '@/types/pos.types';

export default function InventoryPage() {
  const router = useRouter();
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();
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
      const response = await fetch('/api/dashboard/pos/inventory');
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products);
        setSummary(data.summary);
        setMovements(data.summary?.recent_movements || []);
      }
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

      const response = await fetch(`/api/dashboard/pos/inventory/movements?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setMovements(data.movements);
      }
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

  if (!hasPOS) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Warehouse className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">POS Not Available</h2>
              <p className="text-muted-foreground mb-6">
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
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Inventory</h1>
            <p className="text-muted-foreground">Track stock levels and movements</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPreselectedProductId(undefined);
                setAdjustDialogOpen(true);
              }}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Adjust Stock
            </Button>
            <Button
              onClick={() => {
                setPreselectedProductId(undefined);
                setReceiveDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Receive Stock
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="py-3">
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Products</p>
                      <p className="text-2xl font-bold">{summary?.total_products ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="py-3">
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      (summary?.low_stock_count ?? 0) > 0 ? 'bg-amber-100' : 'bg-muted'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        (summary?.low_stock_count ?? 0) > 0 ? 'text-amber-600' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Low Stock</p>
                      <p className={`text-2xl font-bold ${
                        (summary?.low_stock_count ?? 0) > 0 ? 'text-amber-600' : ''
                      }`}>
                        {summary?.low_stock_count ?? 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="py-3">
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      (summary?.out_of_stock_count ?? 0) > 0 ? 'bg-red-100' : 'bg-muted'
                    }`}>
                      <PackageX className={`h-5 w-5 ${
                        (summary?.out_of_stock_count ?? 0) > 0 ? 'text-red-600' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Out of Stock</p>
                      <p className={`text-2xl font-bold ${
                        (summary?.out_of_stock_count ?? 0) > 0 ? 'text-red-600' : ''
                      }`}>
                        {summary?.out_of_stock_count ?? 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stock Table with Search + Filters */}
            <Card>
              <CardContent className="p-0">
                {/* Search + Stock Filter */}
                <div className="px-4 pt-2 pb-2 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by product or SKU..."
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        className="pl-9"
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
                          variant={stockFilter === f.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStockFilter(f.value)}
                          className="h-8 text-xs sm:text-sm"
                        >
                          {f.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredProducts.length} of {products.length} items
                  </p>
                </div>
                {products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2" />
                    <p>No products yet. Add products in the Products tab.</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2" />
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
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Threshold</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            {product.name}
                            {!product.is_active && (
                              <Badge variant="secondary" className="ml-2">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden sm:table-cell">
                            {product.sku || '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden sm:table-cell">
                            {product.category || '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {product.stock_quantity}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {product.low_stock_threshold}
                          </TableCell>
                          <TableCell>
                            <StockLevelBadge
                              stockQuantity={product.stock_quantity}
                              lowStockThreshold={product.low_stock_threshold}
                            />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
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
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-base">Stock Movement History</CardTitle>
                  <div className="flex gap-2">
                    <Select value={filterProductId} onValueChange={setFilterProductId}>
                      <SelectTrigger className="w-full sm:w-[180px]">
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
                      <SelectTrigger className="w-full sm:w-[160px]">
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
              <CardContent>
                {isLoadingMovements ? (
                  <div className="space-y-3">
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
