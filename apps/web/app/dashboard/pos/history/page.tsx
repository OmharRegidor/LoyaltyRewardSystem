'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  XCircle,
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  maya: 'Maya',
  card: 'Card',
};

export default function POSHistoryPage() {
  const router = useRouter();
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
  const limit = 20;

  const hasPOS = subscription?.plan?.hasPOS ?? false;

  // Load sales
  useEffect(() => {
    const loadSales = async () => {
      if (!hasPOS) return;

      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', limit.toString());
        params.set('offset', ((page - 1) * limit).toString());

        if (filter.payment_method) {
          params.set('payment_method', filter.payment_method);
        }
        if (filter.status) {
          params.set('status', filter.status);
        }

        const response = await fetch(`/api/dashboard/pos/sales?${params}`);
        const data = await response.json();

        if (response.ok) {
          setSales(data.sales);
        }
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
      const response = await fetch(`/api/dashboard/pos/sales/${saleId}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedSale(data.sale);
      }
    } catch (err) {
      console.error('Failed to load sale:', err);
    } finally {
      setIsLoadingSale(false);
    }
  };

  const handleVoidSale = async (saleId: string) => {
    const reason = prompt('Enter reason for voiding this sale:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/dashboard/pos/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ void_reason: reason }),
      });

      if (response.ok) {
        setSales((prev) =>
          prev.map((s) =>
            s.id === saleId ? { ...s, status: 'voided' as const } : s
          )
        );
        if (selectedSale?.id === saleId) {
          setSelectedSale((prev) => prev ? { ...prev, status: 'voided' } : null);
        }
      }
    } catch (err) {
      console.error('Failed to void sale:', err);
    }
  };

  if (isLoadingSubscription) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Sales History</h1>
            <p className="text-muted-foreground">View and manage your sales transactions</p>
          </div>
          <Button onClick={() => router.push('/dashboard/pos')}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            New Sale
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4">
              <Select
                value={filter.payment_method}
                onValueChange={(value) => {
                  setFilter((prev) => ({ ...prev, payment_method: value }));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Payment Method" />
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-2" />
                <p>No sales found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">Sale #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium hidden sm:table-cell">{sale.sale_number}</TableCell>
                      <TableCell>{formatDate(sale.created_at)}</TableCell>
                      <TableCell>{formatPrice(sale.total_centavos)}</TableCell>
                      <TableCell>{paymentMethodLabels[sale.payment_method]}</TableCell>
                      <TableCell>
                        <Badge
                          variant={sale.status === 'completed' ? 'default' : 'destructive'}
                        >
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {sale.points_earned > 0 ? `+${sale.points_earned}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleViewSale(sale.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {sale.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleVoidSale(sale.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {sales.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} - {(page - 1) * limit + sales.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={sales.length < limit}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sale Detail Dialog */}
      <Dialog open={selectedSale !== null} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sale #{selectedSale?.sale_number}</DialogTitle>
          </DialogHeader>
          {isLoadingSale ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : selectedSale && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {formatDate(selectedSale.created_at)}
              </div>

              {/* Items */}
              <div className="space-y-2">
                {selectedSale.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>{formatPrice(item.total_centavos)}</span>
                  </div>
                ))}
              </div>

              <hr />

              {/* Summary */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedSale.subtotal_centavos)}</span>
                </div>
                {selectedSale.discount_centavos > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(selectedSale.discount_centavos)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(selectedSale.total_centavos)}</span>
                </div>
              </div>

              <hr />

              {/* Payment & Status */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span>{paymentMethodLabels[selectedSale.payment_method]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={selectedSale.status === 'completed' ? 'default' : 'destructive'}
                  >
                    {selectedSale.status}
                  </Badge>
                </div>
                {selectedSale.points_earned > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Points Earned</span>
                    <span className="text-primary">+{selectedSale.points_earned}</span>
                  </div>
                )}
              </div>

              {selectedSale.status === 'voided' && selectedSale.void_reason && (
                <>
                  <hr />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Void Reason: </span>
                    <span>{selectedSale.void_reason}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
