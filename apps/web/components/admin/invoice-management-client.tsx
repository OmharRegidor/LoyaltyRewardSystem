'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Receipt,
  Search,
  Plus,
  Loader2,
  Building2,
  Mail,
  Eye,
  Ban,
  CreditCard,
} from 'lucide-react';
import type {
  BusinessSearchResult,
  ManualInvoiceWithBusiness,
  ManualInvoicePayment,
} from '@/lib/admin';

// ============================================
// HELPERS
// ============================================

function formatCurrency(centavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(centavos / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

type InvoiceStatus = 'open' | 'partially_paid' | 'paid' | 'void';

function statusBadge(status: InvoiceStatus) {
  const styles: Record<InvoiceStatus, string> = {
    open: 'text-blue-600 border-blue-300 bg-blue-50',
    partially_paid: 'text-amber-600 border-amber-300 bg-amber-50',
    paid: 'text-green-600 border-green-300 bg-green-50',
    void: 'text-gray-500 border-gray-300 bg-gray-50',
  };
  const labels: Record<InvoiceStatus, string> = {
    open: 'Open',
    partially_paid: 'Partial',
    paid: 'Paid',
    void: 'Void',
  };
  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status]}
    </Badge>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface InvoiceDetailData extends ManualInvoiceWithBusiness {
  payments: ManualInvoicePayment[];
}

export function InvoiceManagementClient() {
  const [invoices, setInvoices] = useState<ManualInvoiceWithBusiness[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Create invoice dialog
  const [createOpen, setCreateOpen] = useState(false);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<InvoiceDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Record payment dialog
  const [paymentOpen, setPaymentOpen] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/admin/invoices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices);
        setTotalCount(data.totalCount);
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const openDetail = async (invoiceId: string) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}`);
      if (res.ok) {
        setDetailInvoice(await res.json());
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleVoid = async (invoiceId: string) => {
    const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'void' }),
    });
    if (res.ok) {
      setDetailOpen(false);
      setDetailInvoice(null);
      await fetchInvoices();
    }
  };

  // Summary stats
  const totalOutstanding = invoices
    .filter((inv) => inv.status === 'open' || inv.status === 'partially_paid')
    .reduce((sum, inv) => sum + (inv.amount_centavos - inv.amount_paid_centavos), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.amount_paid_centavos, 0);
  const openCount = invoices.filter(
    (inv) => inv.status === 'open' || inv.status === 'partially_paid',
  ).length;

  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage manual invoices for enterprise billing.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-sm text-gray-500">Outstanding Balance</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-sm text-gray-500">Total Collected</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-sm text-gray-500">Open Invoices</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{openCount}</p>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gray-400" />
            Invoices
            <Badge variant="secondary" className="ml-2">
              {totalCount}
            </Badge>
          </h2>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44 !bg-white border-gray-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {invoices.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No invoices found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Invoice #', 'Business', 'Amount', 'Paid', 'Balance', 'Status', 'Due Date', 'Created'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3 pr-4"
                      >
                        {h}
                      </th>
                    ),
                  )}
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="group">
                    <td className="py-3 pr-4">
                      <span className="text-sm font-medium text-gray-900">{inv.invoice_number}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="text-sm text-gray-900">{inv.business_name}</p>
                        {inv.owner_email && (
                          <p className="text-xs text-gray-400">{inv.owner_email}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-900">
                      {formatCurrency(inv.amount_centavos)}
                    </td>
                    <td className="py-3 pr-4 text-sm text-green-600">
                      {formatCurrency(inv.amount_paid_centavos)}
                    </td>
                    <td className="py-3 pr-4 text-sm font-medium text-gray-900">
                      {formatCurrency(inv.amount_centavos - inv.amount_paid_centavos)}
                    </td>
                    <td className="py-3 pr-4">{statusBadge(inv.status)}</td>
                    <td className="py-3 pr-4 text-sm text-gray-500">
                      {inv.due_date ? formatDate(inv.due_date) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-500">
                      {formatRelativeTime(inv.created_at)}
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity"
                        onClick={() => openDetail(inv.id)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalCount > 20 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Page {page} of {Math.ceil(totalCount / 20)}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page * 20 >= totalCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          fetchInvoices();
        }}
      />

      {/* Invoice Detail Dialog */}
      <InvoiceDetailDialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailInvoice(null);
        }}
        invoice={detailInvoice}
        loading={detailLoading}
        onVoid={handleVoid}
        onRecordPayment={() => setPaymentOpen(true)}
      />

      {/* Record Payment Dialog */}
      {detailInvoice && (
        <RecordPaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          invoiceId={detailInvoice.id}
          remainingCentavos={detailInvoice.amount_centavos - detailInvoice.amount_paid_centavos}
          onRecorded={async () => {
            setPaymentOpen(false);
            // Refresh detail
            const res = await fetch(`/api/admin/invoices/${detailInvoice.id}`);
            if (res.ok) setDetailInvoice(await res.json());
            await fetchInvoices();
          }}
        />
      )}
    </div>
  );
}

// ============================================
// CREATE INVOICE DIALOG
// ============================================

function CreateInvoiceDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BusinessSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessSearchResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [description, setDescription] = useState('Enterprise Annual Subscription');
  const [amount, setAmount] = useState('999.90');
  const [dueDate, setDueDate] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Business search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/businesses/search?q=${encodeURIComponent(searchQuery.trim())}`,
        );
        if (res.ok) setSearchResults(await res.json());
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Auto-set period dates
  useEffect(() => {
    if (!periodStart && !periodEnd) {
      const now = new Date();
      setPeriodStart(now.toISOString().slice(0, 10));
      const nextYear = new Date(now);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setPeriodEnd(nextYear.toISOString().slice(0, 10));
    }
  }, [periodStart, periodEnd]);

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedBusiness(null);
    setDescription('Enterprise Annual Subscription');
    setAmount('999.90');
    setDueDate('');
    setPeriodStart('');
    setPeriodEnd('');
    setNotes('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedBusiness) return;
    const amountPHP = parseFloat(amount);
    if (!amountPHP || amountPHP <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    const amountCentavos = Math.round(amountPHP * 100);

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          description: description.trim(),
          amountCentavos,
          dueDate: dueDate || undefined,
          periodStart: periodStart || undefined,
          periodEnd: periodEnd || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create invoice');
      }

      resetForm();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="bg-white border-gray-200 rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Create Invoice</DialogTitle>
          <DialogDescription className="text-gray-500">
            Generate a manual invoice for an enterprise business.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Business Search */}
          {!selectedBusiness ? (
            <div>
              <label className="text-sm text-gray-500 mb-1.5 block">Business</label>
              <div className="relative">
                <Input
                  placeholder="Search by business name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="!bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {searchResults.map((biz) => (
                    <button
                      key={biz.id}
                      onClick={() => {
                        setSelectedBusiness(biz);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{biz.name}</p>
                        {biz.ownerEmail && (
                          <p className="text-xs text-gray-400 truncate">{biz.ownerEmail}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs shrink-0">
                        {biz.planName ?? 'Free'}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-sm text-gray-500 mb-1.5 block">Business</label>
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedBusiness.name}</p>
                    {selectedBusiness.ownerEmail && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {selectedBusiness.ownerEmail}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedBusiness(null)}
                  className="text-gray-400 hover:text-gray-900"
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="!bg-white border-gray-200 text-gray-900"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">Amount (PHP)</label>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="!bg-white border-gray-200 text-gray-900 pl-8"
                min={0.01}
                step={0.01}
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">&#8369;</span>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">Due Date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="!bg-white border-gray-200 text-gray-900"
            />
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-500 mb-1.5 block">Period Start</label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="!bg-white border-gray-200 text-gray-900"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1.5 block">Period End</label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="!bg-white border-gray-200 text-gray-900"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">Notes (optional)</label>
            <Textarea
              placeholder="Internal notes about this invoice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="!bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none"
              rows={2}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedBusiness}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
            Create Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// INVOICE DETAIL DIALOG
// ============================================

function InvoiceDetailDialog({
  open,
  onOpenChange,
  invoice,
  loading,
  onVoid,
  onRecordPayment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceDetailData | null;
  loading: boolean;
  onVoid: (id: string) => void;
  onRecordPayment: () => void;
}) {
  const [voidConfirm, setVoidConfirm] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setVoidConfirm(false);
      }}
    >
      <DialogContent className="bg-white border-gray-200 rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
        {loading || !invoice ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-gray-900 flex items-center gap-3">
                {invoice.invoice_number}
                {statusBadge(invoice.status)}
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                {invoice.business_name}
                {invoice.owner_email && ` — ${invoice.owner_email}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Description</p>
                  <p className="text-gray-900">{invoice.description || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Amount</p>
                  <p className="text-gray-900 font-semibold">
                    {formatCurrency(invoice.amount_centavos)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Paid</p>
                  <p className="text-green-600 font-semibold">
                    {formatCurrency(invoice.amount_paid_centavos)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Remaining</p>
                  <p className="text-gray-900 font-semibold">
                    {formatCurrency(invoice.amount_centavos - invoice.amount_paid_centavos)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Due Date</p>
                  <p className="text-gray-900">{invoice.due_date ? formatDate(invoice.due_date) : '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Period</p>
                  <p className="text-gray-900">
                    {invoice.period_start && invoice.period_end
                      ? `${formatDate(invoice.period_start)} — ${formatDate(invoice.period_end)}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Created By</p>
                  <p className="text-gray-900">{invoice.created_by_email}</p>
                </div>
                <div>
                  <p className="text-gray-400">Created</p>
                  <p className="text-gray-900">{formatDate(invoice.created_at)}</p>
                </div>
                {invoice.notes && (
                  <div className="col-span-2">
                    <p className="text-gray-400">Notes</p>
                    <p className="text-gray-900">{invoice.notes}</p>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment History</h3>
                {invoice.payments.length === 0 ? (
                  <p className="text-sm text-gray-400">No payments recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          {['Date', 'Amount', 'Method', 'Reference', 'Recorded By'].map((h) => (
                            <th
                              key={h}
                              className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-2 pr-3"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoice.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2 pr-3 text-sm text-gray-900">
                              {formatDate(p.payment_date)}
                            </td>
                            <td className="py-2 pr-3 text-sm text-green-600 font-medium">
                              {formatCurrency(p.amount_centavos)}
                            </td>
                            <td className="py-2 pr-3 text-sm text-gray-500">
                              {p.payment_method || '—'}
                            </td>
                            <td className="py-2 pr-3 text-sm text-gray-500">
                              {p.reference_number || '—'}
                            </td>
                            <td className="py-2 text-sm text-gray-500">{p.recorded_by_email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {invoice.status !== 'void' && invoice.status !== 'paid' && (
                <>
                  {!voidConfirm ? (
                    <Button
                      variant="outline"
                      className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => setVoidConfirm(true)}
                    >
                      <Ban className="w-4 h-4" />
                      Void Invoice
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="gap-1.5 bg-red-500 text-white hover:bg-red-600"
                      onClick={() => onVoid(invoice.id)}
                    >
                      Confirm Void
                    </Button>
                  )}
                  <Button
                    onClick={onRecordPayment}
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    Record Payment
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// RECORD PAYMENT DIALOG
// ============================================

function RecordPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  remainingCentavos,
  onRecorded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  remainingCentavos: number;
  onRecorded: () => void;
}) {
  const [amount, setAmount] = useState(String(remainingCentavos / 100));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset amount when remaining changes
  useEffect(() => {
    setAmount(String(remainingCentavos / 100));
  }, [remainingCentavos]);

  const resetForm = () => {
    setAmount(String(remainingCentavos / 100));
    setPaymentMethod('');
    setReferenceNumber('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setError(null);
  };

  const handleSubmit = async () => {
    const amountPHP = parseFloat(amount);
    if (!amountPHP || amountPHP <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    const amountCentavos = Math.round(amountPHP * 100);
    if (amountCentavos > remainingCentavos) {
      setError(`Amount cannot exceed remaining balance of ${formatCurrency(remainingCentavos)}`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCentavos,
          paymentMethod: paymentMethod || undefined,
          referenceNumber: referenceNumber.trim() || undefined,
          paymentDate: paymentDate || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to record payment');
      }

      resetForm();
      onRecorded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="bg-white border-gray-200 rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Record Payment</DialogTitle>
          <DialogDescription className="text-gray-500">
            Remaining balance: {formatCurrency(remainingCentavos)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">Amount (PHP)</label>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="!bg-white border-gray-200 text-gray-900 pl-8"
                min={0.01}
                step={0.01}
                max={remainingCentavos / 100}
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">&#8369;</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">Payment Method</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="!bg-white border-gray-200">
                <SelectValue placeholder="Select method..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="GCash">GCash</SelectItem>
                <SelectItem value="Maya">Maya</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">Reference Number</label>
            <Input
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Bank ref, transaction ID, etc."
              className="!bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">Payment Date</label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="!bg-white border-gray-200 text-gray-900"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">Notes (optional)</label>
            <Textarea
              placeholder="Payment notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="!bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none"
              rows={2}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
