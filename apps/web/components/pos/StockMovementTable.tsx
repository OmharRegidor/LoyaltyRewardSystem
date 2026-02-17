'use client';

import { Badge } from '@/components/ui/badge';
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
  return new Date(dateString).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getMovementTypeBadge(type: StockMovementType) {
  switch (type) {
    case 'sale':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Sale</Badge>;
    case 'void_restore':
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Void Restore</Badge>;
    case 'receiving':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Receiving</Badge>;
    case 'adjustment':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Adjustment</Badge>;
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
}

export function StockMovementTable({ movements }: StockMovementTableProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No stock movements recorded yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Stock After</TableHead>
            <TableHead className="hidden sm:table-cell">By</TableHead>
            <TableHead className="hidden sm:table-cell">Reason / Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell className="whitespace-nowrap text-sm">
                {formatDate(movement.created_at)}
              </TableCell>
              <TableCell className="font-medium">{movement.product_name}</TableCell>
              <TableCell>{getMovementTypeBadge(movement.movement_type)}</TableCell>
              <TableCell className="text-right font-mono">
                <span className={movement.quantity >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                </span>
              </TableCell>
              <TableCell className="text-right font-mono">{movement.stock_after}</TableCell>
              <TableCell className="text-sm hidden sm:table-cell">{movement.performer_name || '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate hidden sm:table-cell">
                {movement.reason || movement.notes || '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
