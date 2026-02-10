'use client';

import { X, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LinkedCustomer } from '@/types/pos.types';

interface CustomerCardProps {
  customer: LinkedCustomer;
  onRemove: () => void;
}

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-600',
  silver: 'bg-slate-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-purple-500',
};

export function CustomerCard({ customer, onRemove }: CustomerCardProps) {
  const tierColor = tierColors[customer.tier.toLowerCase()] || tierColors.bronze;

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${tierColor} flex items-center justify-center`}>
          <User className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-medium">{customer.fullName || 'Customer'}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{customer.phone}</span>
            <span>·</span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>{customer.totalPoints} pts</span>
            </div>
            <Badge variant="secondary" className="capitalize text-xs">
              {customer.tier}
            </Badge>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
