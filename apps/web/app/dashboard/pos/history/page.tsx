'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  XCircle,
  Banknote,
  CreditCard,
  Smartphone,
  Receipt,
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { POSNavTabs } from '@/components/pos';
import { cachedFetch } from '@/lib/client-cache';
import type { Sale, SaleWithItems, PaymentMethod } from '@/types/pos.types';

function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PaymentDisplay {
  label: string;
  icon: typeof Banknote;
  color: string;
}

const paymentMethodConfig: Record<PaymentMethod, PaymentDisplay> = {
  cash: { label: 'Cash', icon: Banknote, color: 'text-emerald-600' },
  gcash: { label: 'GCash', icon: Smartphone, color: 'text-blue-600' },
  maya: { label: 'Maya', icon: Smartphone, color: 'text-green-600' },
  card: { label: 'Card', icon: CreditCard, color: 'text-violet-600' },
};

export default function POSHistoryPage() {
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);
  const [isLoadingSale, setIsLoadingSale] = useState(false);
  const [filter, setFilter] = useState({
    payment_method: '',
    status: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [voidTarget, setVoidTarget] = useState<{ id: string; saleNumber: string } | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);
  const limit = 20;

  const hasPOS = subscription?.plan?.hasPOS ?? false;

  // Load sales
  useEffect(() => {
    const loadSales = async () => {
      if (!hasPOS) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', limit.toString());
        params.set('offset', ((page - 1) * limit).toString());

        if (filter.payment_method && filter.payment_method !== 'all') {
          params.set('payment_method', filter.payment_method);
        }
        if (filter.status && filter.status !== 'all') {
          params.set('status', filter.status);
        }

        const data = await cachedFetch<{ sales: Sale[] }>(`/api/dashboard/pos/sales?${params}`);
        setSales(data.sales);
      } catch (err) {
        console.error('Failed to load sales:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSales();
  }, [hasPOS, page, filter.payment_method, filter.status]);

  const handleViewSale = async (saleId: string) => {
    setIsLoadingSale(true);
    try {
      const data = await cachedFetch<{ sale: SaleWithItems }>(`/api/dashboard/pos/sales/${saleId}`);
      setSelectedSale(data.sale);
    } catch (err) {
      console.error('Failed to load sale:', err);
    } finally {
      setIsLoadingSale(false);
    }
  };

  const handleVoidSale = async () => {
    if (!voidTarget || !voidReason.trim()) return;

    setIsVoiding(true);
    try {
      const response = await fetch(`/api/dashboard/pos/sales/${voidTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ void_reason: voidReason.trim() }),
      });

      if (response.ok) {
        setSales((prev) =>
          prev.map((s) =>
            s.id === voidTarget.id ? { ...s, status: 'voided' as const } : s
          )
        );
        if (selectedSale?.id === voidTarget.id) {
          setSelectedSale((prev) => prev ? { ...prev, status: 'voided' } : null);
        }
        setVoidTarget(null);
        setVoidReason('');
      }
    } catch (err) {
      console.error('Failed to void sale:', err);
    } finally {
      setIsVoiding(false);
    }
  };

  // Client-side search filtering
  const filteredSales = filter.search
    ? sales.filter((sale) =>
        sale.sale_number.toLowerCase().includes(filter.search.toLowerCase())
      )
    : sales;

  if (isLoadingSubscription) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border/20">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Sales History
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            View and manage your sales transactions
          </p>
        </div>

        {/* Sub-Navigation */}
        <POSNavTabs />

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search sale #..."
              value={filter.search}
              onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
              className="pl-9 w-full sm:w-[180px] h-9 text-sm bg-white border-border/50"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={filter.payment_method}
              onValueChange={(value) => {
                setFilter((prev) => ({ ...prev, payment_method: value }));
                setPage(1);
              }}
            >
              <SelectTrigger className="flex-1 sm:w-[150px] h-9 text-sm bg-white border-border/50">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="gcash">GCash</SelectItem>
                <SelectItem value="maya">Maya</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.status}
              onValueChange={(value) => {
                setFilter((prev) => ({ ...prev, status: value }));
                setPage(1);
              }}
            >
              <SelectTrigger className="flex-1 sm:w-[140px] h-9 text-sm bg-white border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="voided">Voided</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sales Table */}
        <Card className="shadow-card border border-border/50 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3.5 border-b border-border/20 last:border-0">
                    <Skeleton className="h-4 w-20 hidden sm:block" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-12 hidden sm:block" />
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </div>
                ))}
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-background flex items-center justify-center mb-5 shadow-xs">
                  <Receipt className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-foreground/70">
                  {filter.search ? 'No matching sales found' : 'No sales found'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {filter.search
                    ? `No results for "${filter.search}"`
                    : 'Sales will appear here once completed'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/40 hover:bg-transparent">
                      <TableHead className="hidden sm:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Sale #
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Total
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Payment
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="hidden sm:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Points
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => {
                      const paymentConfig = paymentMethodConfig[(sale.payment_method ?? 'cash') as PaymentMethod];
                      const PaymentIcon = paymentConfig.icon;

                      return (
                        <TableRow
                          key={sale.id}
                          className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors duration-150"
                        >
                          <TableCell className="font-mono text-sm text-muted-foreground hidden sm:table-cell">
                            {sale.sale_number}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(sale.created_at)}
                          </TableCell>
                          <TableCell className="font-medium text-sm tabular-nums">
                            {formatPrice(sale.total_centavos)}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <PaymentIcon className={`h-3.5 w-3.5 ${paymentConfig.color}`} />
                              <span className="text-muted-foreground">
                                {paymentConfig.label}
                              </span>
                            </span>
                          </TableCell>
                          <TableCell>
                            {sale.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600/80 bg-red-50 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                Voided
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm tabular-nums">
                            {sale.points_earned > 0 ? (
                              <span className="text-primary font-medium">+{sale.points_earned}</span>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleViewSale(sale.id)}
                                title="View sale details"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {sale.status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => setVoidTarget({ id: sale.id, saleNumber: sale.sale_number })}
                                  title="Void this sale"
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredSales.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Page {page}
              <span className="mx-1.5 text-border">|</span>
              Showing {(page - 1) * limit + 1}–{(page - 1) * limit + filteredSales.length} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-2 sm:px-3 border-border/50"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={sales.length < limit}
                className="h-8 px-2 sm:px-3 border-border/50"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sale Detail Dialog */}
      <Dialog open={selectedSale !== null} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="max-w-md border-t-2 border-t-primary max-h-[95dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg tracking-tight">
              Sale <span className="font-mono text-muted-foreground">#{selectedSale?.sale_number}</span>
            </DialogTitle>
          </DialogHeader>
          {isLoadingSale ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-4 w-40" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>
          ) : selectedSale && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                {formatDate(selectedSale.created_at)}
              </p>

              {/* Items */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Items
                </p>
                {selectedSale.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span className="text-foreground">
                      {item.name}
                      <span className="text-muted-foreground ml-1.5">x{item.quantity}</span>
                    </span>
                    <span className="tabular-nums font-medium">{formatPrice(item.total_centavos)}</span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-border/40" />

              {/* Summary */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatPrice(selectedSale.subtotal_centavos)}</span>
                </div>
                {selectedSale.discount_centavos > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span className="tabular-nums">-{formatPrice(selectedSale.discount_centavos)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPrice(selectedSale.total_centavos)}</span>
                </div>
              </div>

              <div className="h-px bg-border/40" />

              {/* Payment & Status */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="inline-flex items-center gap-1.5">
                    {(() => {
                      const config = paymentMethodConfig[(selectedSale.payment_method ?? 'cash') as PaymentMethod];
                      const Icon = config.icon;
                      return (
                        <>
                          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                          {config.label}
                        </>
                      );
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  {selectedSale.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600/80 bg-red-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      Voided
                    </span>
                  )}
                </div>
                {selectedSale.points_earned > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Points Earned</span>
                    <span className="text-primary font-medium">+{selectedSale.points_earned}</span>
                  </div>
                )}
              </div>

              {selectedSale.status === 'voided' && selectedSale.void_reason && (
                <>
                  <div className="h-px bg-border/40" />
                  <div className="text-sm bg-red-50/50 rounded-lg p-3 border border-red-100/50">
                    <span className="text-muted-foreground">Void Reason: </span>
                    <span className="text-foreground">{selectedSale.void_reason}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Void Confirmation Dialog */}
      <AlertDialog open={voidTarget !== null} onOpenChange={(open) => { if (!open) { setVoidTarget(null); setVoidReason(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Void Sale #{voidTarget?.saleNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The sale will be marked as voided and any points earned will not be reversed automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="void-reason">Reason *</Label>
            <Input
              id="void-reason"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g., Customer refund, duplicate entry"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoidSale}
              disabled={!voidReason.trim() || isVoiding}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isVoiding ? 'Voiding...' : 'Void Sale'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
