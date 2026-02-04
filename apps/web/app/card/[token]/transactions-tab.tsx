// apps/web/app/card/[token]/transactions-tab.tsx

'use client';

import { TrendingUp, TrendingDown, Gift, Clock, AlertCircle } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Transaction {
  id: string;
  type: 'earn' | 'redeem' | 'adjust' | 'expire';
  points: number;
  description: string | null;
  created_at: string;
  reward_title: string | null;
}

interface TransactionsTabProps {
  transactions: Transaction[];
}

// ============================================
// HELPERS
// ============================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

function getTransactionIcon(type: Transaction['type']) {
  switch (type) {
    case 'earn':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'redeem':
      return <Gift className="w-4 h-4 text-purple-500" />;
    case 'adjust':
      return <AlertCircle className="w-4 h-4 text-blue-500" />;
    case 'expire':
      return <Clock className="w-4 h-4 text-gray-400" />;
    default:
      return <TrendingUp className="w-4 h-4 text-gray-400" />;
  }
}

function getTransactionLabel(tx: Transaction): string {
  switch (tx.type) {
    case 'earn':
      return tx.description || 'Points earned';
    case 'redeem':
      return tx.reward_title ? `Redeemed: ${tx.reward_title}` : 'Reward redeemed';
    case 'adjust':
      return tx.description || 'Points adjusted';
    case 'expire':
      return tx.description || 'Points expired';
    default:
      return tx.description || 'Transaction';
  }
}

// ============================================
// COMPONENT
// ============================================

export function TransactionsTab({ transactions }: TransactionsTabProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
        <p className="text-gray-500 text-sm">
          Your points history will appear here after your first purchase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.map((tx, index) => {
        const isPositive = tx.type === 'earn' || (tx.type === 'adjust' && tx.points > 0);

        return (
          <div
            key={tx.id}
            className={`flex items-center gap-3 py-3 ${
              index !== transactions.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            {/* Icon */}
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
              {getTransactionIcon(tx.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {getTransactionLabel(tx)}
              </p>
              <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
            </div>

            {/* Points */}
            <div
              className={`text-sm font-semibold ${
                isPositive ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {isPositive ? '+' : ''}
              {tx.points.toLocaleString()} pts
            </div>
          </div>
        );
      })}
    </div>
  );
}
