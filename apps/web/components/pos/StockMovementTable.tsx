'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { StockMovementWithProduct, StockMovementType } from '@/types/pos.types';

interface StockMovementTableProps {
  movements: StockMovementWithProduct[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const datePart = date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}

const movementTypeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  sale: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  void_restore: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  receiving: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  adjustment: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

const movementTypeLabels: Record<string, string> = {
  sale: 'Sale',
  void_restore: 'Void Restore',
  receiving: 'Receiving',
  adjustment: 'Adjustment',
};

function getMovementTypeBadge(type: StockMovementType) {
  const style = movementTypeStyles[type] ?? { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' };
  const label = movementTypeLabels[type] ?? type;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

export function StockMovementTable({ movements }: StockMovementTableProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No stock movements recorded yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50">
            <TableHead className="pl-4 sm:pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Date</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Product</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Type</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Qty</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 hidden sm:table-cell">Stock After</TableHead>
            <TableHead className="hidden md:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">By</TableHead>
            <TableHead className="hidden md:table-cell pr-4 sm:pr-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Reason / Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement, index) => (
            <TableRow
              key={movement.id}
              className={`hover:bg-muted/50 transition-colors border-border/30 ${
                index % 2 === 1 ? 'bg-muted/20' : ''
              }`}
            >
              <TableCell className="pl-4 sm:pl-6 whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
                {formatDate(movement.created_at)}
              </TableCell>
              <TableCell className="font-medium text-xs sm:text-sm max-w-[100px] sm:max-w-none truncate">{movement.product_name}</TableCell>
              <TableCell>{getMovementTypeBadge(movement.movement_type)}</TableCell>
              <TableCell className="text-right font-mono tabular-nums text-xs sm:text-sm">
                <span className={`font-semibold ${movement.quantity >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                </span>
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums text-sm text-muted-foreground hidden sm:table-cell">{movement.stock_after}</TableCell>
              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{movement.performer_name || '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate hidden md:table-cell pr-4 sm:pr-6">
                {movement.reason || movement.notes || '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
