'use client';

import { useState, useEffect } from 'react';
import { Receipt, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ManualInvoicePayment {
  id: string;
  amount_centavos: number;
  payment_method: string | null;
  reference_number: string | null;
  payment_date: string;
}

interface ManualInvoice {
  id: string;
  invoice_number: string;
  description: string | null;
  amount_centavos: number;
  amount_paid_centavos: number;
  currency: string;
  status: 'open' | 'partially_paid' | 'paid';
  due_date: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  payments: ManualInvoicePayment[];
}

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

type InvoiceStatus = 'open' | 'partially_paid' | 'paid';

function statusBadge(status: InvoiceStatus) {
  const styles: Record<InvoiceStatus, string> = {
    open: 'bg-blue-100 text-blue-700',
    partially_paid: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
  };
  const labels: Record<InvoiceStatus, string> = {
    open: 'Open',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function ManualInvoiceSection() {
  const [invoices, setInvoices] = useState<ManualInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/billing/manual-invoices')
      .then((r) => r.json())
      .then((data) => setInvoices(data.invoices ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading || invoices.length === 0) return null;

  const totalOutstanding = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.amount_centavos - inv.amount_paid_centavos), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="w-5 h-5 text-gray-400" />
          Invoices & Balance
        </h2>
        {totalOutstanding > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Outstanding balance: <span className="font-semibold text-gray-900">{formatCurrency(totalOutstanding)}</span>
          </p>
        )}
      </div>

      {/* Info Banner */}
      <div className="mx-4 sm:mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Payments are processed by the NoxaLoyalty team. Contact us if you have questions about your invoices.
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {invoices.map((inv) => (
          <div key={inv.id} className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Receipt className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm sm:text-base">{inv.invoice_number}</p>
                    {statusBadge(inv.status)}
                  </div>
                  {inv.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{inv.description}</p>
                  )}
                  {inv.due_date && (
                    <p className="text-xs text-gray-400 mt-0.5">Due: {formatDate(inv.due_date)}</p>
                  )}
                  {inv.period_start && inv.period_end && (
                    <p className="text-xs text-gray-400">
                      Period: {formatDate(inv.period_start)} — {formatDate(inv.period_end)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 ml-8 sm:ml-0">
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(inv.amount_centavos)}</p>
                  {inv.amount_paid_centavos > 0 && inv.status !== 'paid' && (
                    <p className="text-xs text-green-600">
                      Paid: {formatCurrency(inv.amount_paid_centavos)}
                    </p>
                  )}
                  {inv.status !== 'paid' && (
                    <p className="text-xs text-gray-500">
                      Balance: {formatCurrency(inv.amount_centavos - inv.amount_paid_centavos)}
                    </p>
                  )}
                </div>

                {inv.payments.length > 0 && (
                  <button
                    onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {expandedId === inv.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Payment History (expandable) */}
            {expandedId === inv.id && inv.payments.length > 0 && (
              <div className="mt-4 ml-8 bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Payment History
                </p>
                <div className="space-y-2">
                  {inv.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{formatDate(p.payment_date)}</span>
                        {p.payment_method && (
                          <Badge variant="outline" className="text-xs">
                            {p.payment_method}
                          </Badge>
                        )}
                        {p.reference_number && (
                          <span className="text-xs text-gray-400">Ref: {p.reference_number}</span>
                        )}
                      </div>
                      <span className="font-medium text-green-600">
                        {formatCurrency(p.amount_centavos)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
