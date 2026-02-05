// apps/web/components/customers/detail-modal.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Calendar,
  TrendingUp,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

interface Customer {
  id: number;
  name: string;
  phone: string;
  points: number;
  visits: number;
  lastVisit: string;
  status: 'active' | 'inactive';
  avatar: string;
  customerId?: string; // Actual UUID from database
}

interface Transaction {
  id: string;
  type: 'earn' | 'redeem';
  points: number;
  description: string | null;
  createdAt: string;
}

interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================
// COMPONENT
// ============================================

const ITEMS_PER_PAGE = 5;

export function CustomerDetailModal({
  customer,
  onClose,
}: CustomerDetailModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [customerId, setCustomerId] = useState<string | null>(
    customer.customerId || null
  );

  // Find customer UUID
  useEffect(() => {
    async function findCustomerId() {
      if (customer.customerId) {
        setCustomerId(customer.customerId);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from('customers')
        .select('id')
        .or(`full_name.ilike.%${customer.name}%,phone.eq.${customer.phone}`)
        .limit(1)
        .maybeSingle();

      if (data) {
        setCustomerId(data.id);
      }
    }

    findCustomerId();
  }, [customer.customerId, customer.name, customer.phone]);

  // Fetch transactions
  useEffect(() => {
    async function fetchTransactions() {
      if (!customerId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const supabase = createClient();

      try {
        // Get total count
        const { count } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customerId);

        setTotalCount(count || 0);

        // Get paginated transactions
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;

        const { data, error } = await supabase
          .from('transactions')
          .select('id, type, points, description, created_at')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .range(offset, offset + ITEMS_PER_PAGE - 1);

        if (error) {
          console.error('Fetch transactions error:', error);
          setTransactions([]);
        } else {
          setTransactions(
            (data || [])
              .filter(
                (tx): tx is typeof tx & { created_at: string } =>
                  tx.created_at !== null
              )
              .map((tx) => ({
                id: tx.id,
                type: tx.type as 'earn' | 'redeem',
                points: tx.points,
                description: tx.description,
                createdAt: tx.created_at,
              }))
          );
        }
      } catch (err) {
        console.error('Fetch transactions error:', err);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [customerId, currentPage]);

  // Realtime subscription for transactions
  useEffect(() => {
    if (!customerId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`transactions-${customerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          if (payload.new && 'id' in payload.new) {
            const newTx: Transaction = {
              id: payload.new.id as string,
              type: payload.new.type as 'earn' | 'redeem',
              points: payload.new.points as number,
              description: payload.new.description as string | null,
              createdAt: payload.new.created_at as string,
            };

            // Add to top if on first page
            if (currentPage === 1) {
              setTransactions((prev) => [
                newTx,
                ...prev.slice(0, ITEMS_PER_PAGE - 1),
              ]);
            }
            setTotalCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <Dialog open={!!customer} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
        </DialogHeader>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Side - Customer Info */}
            <Card className="p-4 sm:p-6 space-y-6 bg-white">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-4">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
                <p className="text-sm text-gray-500">
                  {customer.phone || 'No phone'}
                </p>
                <Badge
                  variant={
                    customer.status === 'active' ? 'default' : 'secondary'
                  }
                  className="mt-2"
                >
                  {customer.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">
                      Total Points
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {customer.points.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">
                      Total Visits
                    </p>
                    <p className="text-lg font-bold text-gray-900">{customer.visits}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Last Visit</p>
                    <p className="text-lg font-bold text-gray-900">{customer.lastVisit}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Right Side - Points History */}
            <Card className="p-4 sm:p-6 flex flex-col bg-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Points History</h4>
                {totalCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {totalCount} transaction{totalCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="flex-1 min-h-[200px] sm:min-h-[280px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    No transactions yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx, idx) => (
                      <motion.div
                        key={tx.id}
                        className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                            tx.type === 'earn'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {tx.type === 'earn' ? '+' : '-'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {tx.description ||
                              (tx.type === 'earn'
                                ? 'Points earned'
                                : 'Points redeemed')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeDate(tx.createdAt)}
                          </p>
                        </div>
                        <p
                          className={`text-sm font-semibold shrink-0 ${
                            tx.type === 'earn'
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}
                        >
                          {tx.type === 'earn' ? '+' : '-'}
                          {tx.points.toLocaleString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
                  <span className="text-xs text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
