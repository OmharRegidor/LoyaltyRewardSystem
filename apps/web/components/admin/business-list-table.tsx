'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PlanBadge, StatusBadge } from '@/components/admin/shared/badges';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Tag,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
} from 'lucide-react';
import type {
  AdminBusinessStats,
  AdminBusinessListResponse,
} from '@/lib/admin';

// ============================================
// TYPES
// ============================================

interface BusinessFilters {
  search: string;
  plan: string;
  type: string;
  status: string;
  sort: string;
  order: string;
  page: number;
}

interface BusinessListTableProps {
  data: AdminBusinessListResponse;
  filters: BusinessFilters;
  searchInput: string;
  selected: Set<string>;
  onSearchInput: (value: string) => void;
  onFilterChange: (key: keyof BusinessFilters, value: string | number) => void;
  onFiltersPatch: (patch: Partial<BusinessFilters>) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onClearSelected: () => void;
  onRefresh: () => void;
}

interface DeleteTarget {
  ids: string[];
  names: string[];
}

// ============================================
// MAIN COMPONENT
// ============================================

export function BusinessListTable({
  data,
  filters,
  searchInput,
  selected,
  onSearchInput,
  onFilterChange,
  onFiltersPatch,
  onToggleSelect,
  onToggleSelectAll,
  onClearSelected,
  onRefresh,
}: BusinessListTableProps) {
  const { businesses, totalCount, facets } = data;
  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  const hasActiveFilters =
    filters.search || filters.plan || filters.type || filters.status;

  const allOnPageSelected =
    businesses.length > 0 && businesses.every((b) => selected.has(b.id));

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [bulkTagValue, setBulkTagValue] = useState('');
  const [bulkTagSubmitting, setBulkTagSubmitting] = useState(false);

  const handleDeleteSingle = (biz: AdminBusinessStats) => {
    setDeleteTarget({ ids: [biz.id], names: [biz.name] });
  };

  const handleDeleteSelected = () => {
    const targets = businesses.filter((b) => selected.has(b.id));
    if (targets.length === 0) return;
    setDeleteTarget({
      ids: targets.map((b) => b.id),
      names: targets.map((b) => b.name),
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const results = await Promise.all(
        deleteTarget.ids.map(async (id, index) => {
          const name = deleteTarget.names[index];
          try {
            const res = await fetch(`/api/admin/businesses/${id}`, { method: 'DELETE' });
            if (!res.ok) {
              const body = (await res.json().catch(() => ({ error: 'Unknown error' }))) as {
                error?: string;
              };
              return { ok: false, name, error: body.error ?? 'Unknown error' };
            }
            return { ok: true, name };
          } catch {
            return { ok: false, name, error: 'Network error' };
          }
        }),
      );
      const failures = results.filter((r) => !r.ok);
      if (failures.length === 0) {
        toast.success(
          deleteTarget.ids.length > 1
            ? `${deleteTarget.ids.length} businesses deleted`
            : `Deleted ${deleteTarget.names[0]}`,
        );
        onClearSelected();
      } else {
        toast.error(
          `Failed to delete ${failures.length} of ${results.length}: ${failures
            .map((f) => `${f.name} (${f.error})`)
            .join(', ')}`,
        );
      }
      onRefresh();
    } catch {
      toast.error('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search businesses or emails..."
            value={searchInput}
            onChange={(e) => onSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Plan Filter */}
        <select
          value={filters.plan}
          onChange={(e) => onFilterChange('plan', e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-500"
        >
          <option value="">All Plans</option>
          {Object.entries(facets.plans).map(([name, count]) => (
            <option key={name} value={name}>
              {name === 'free' ? 'Free' : name} ({count})
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filters.type}
          onChange={(e) => onFilterChange('type', e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-500"
        >
          <option value="">All Types</option>
          {Object.entries(facets.types).map(([name, count]) => (
            <option key={name} value={name}>
              {name} ({count})
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-500"
        >
          <option value="">All Statuses</option>
          {Object.entries(facets.statuses).map(([name, count]) => (
            <option key={name} value={name}>
              {name} ({count})
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={`${filters.sort}:${filters.order}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split(':');
            onFiltersPatch({ sort, order });
          }}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-500"
        >
          <option value="created_at:desc">Newest First</option>
          <option value="created_at:asc">Oldest First</option>
          <option value="transactions_30d:desc">Most Active (30d)</option>
          <option value="customer_count:desc">Most Customers</option>
          <option value="name:asc">Name A-Z</option>
          <option value="name:desc">Name Z-A</option>
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              onFilterChange('search', '');
              onFilterChange('plan', '');
              onFilterChange('type', '');
              onFilterChange('status', '');
            }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
          <span className="text-sm text-orange-600 font-medium">
            {selected.size} selected
          </span>
          <button
            onClick={() => handleExportCsv(filters)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded-md border border-gray-200 transition-colors"
            title="Export all businesses matching the current filters"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => { setBulkTagValue(''); setBulkTagOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded-md border border-gray-200 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            Tag
          </button>
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded-md border border-red-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
          <button
            onClick={onClearSelected}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors ml-auto"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                {/* Checkbox */}
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={onToggleSelectAll}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                </th>
                <SortableHeader
                  label="Business"
                  column="name"
                  currentSort={filters.sort}
                  currentOrder={filters.order}
                  onSort={(col) => handleSort(col, filters, onFiltersPatch)}
                />
                <th className="text-left px-4 py-4 text-gray-500 font-medium">
                  Email
                </th>
                <th className="text-left px-4 py-4 text-gray-500 font-medium">
                  Plan
                </th>
                <th className="text-left px-4 py-4 text-gray-500 font-medium">
                  Status
                </th>
                <SortableHeader
                  label="Customers"
                  column="customer_count"
                  currentSort={filters.sort}
                  currentOrder={filters.order}
                  onSort={(col) => handleSort(col, filters, onFiltersPatch)}
                  className="text-right"
                />
                <SortableHeader
                  label="Txns (30d)"
                  column="transactions_30d"
                  currentSort={filters.sort}
                  currentOrder={filters.order}
                  onSort={(col) => handleSort(col, filters, onFiltersPatch)}
                  className="text-right"
                />
                <th className="text-left px-4 py-4 text-gray-500 font-medium hidden md:table-cell">
                  Type
                </th>
                <SortableHeader
                  label="Created"
                  column="created_at"
                  currentSort={filters.sort}
                  currentOrder={filters.order}
                  onSort={(col) => handleSort(col, filters, onFiltersPatch)}
                />
                <th className="px-4 py-4 text-gray-500 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {businesses.map((biz) => (
                <tr
                  key={biz.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selected.has(biz.id) ? 'bg-orange-50/50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(biz.id)}
                      onChange={() => onToggleSelect(biz.id)}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/businesses/${biz.id}`}
                      className="text-gray-900 font-medium hover:text-orange-600 transition-colors"
                    >
                      {biz.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">
                    {biz.owner_email ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <PlanBadge plan={biz.plan_name} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={biz.subscription_status} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {biz.customer_count}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {biz.transactions_30d}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {biz.business_type ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {biz.created_at
                      ? new Date(biz.created_at).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSingle(biz); }}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete business"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {businesses.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    {hasActiveFilters
                      ? 'No businesses match your filters'
                      : 'No businesses found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationControls
          page={filters.page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(p) => onFilterChange('page', p)}
        />
      )}

      {/* Bulk Tag Dialog */}
      <Dialog open={bulkTagOpen} onOpenChange={(open) => { if (!bulkTagSubmitting) setBulkTagOpen(open); }}>
        <DialogContent className="bg-white border-gray-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Tag selected businesses</DialogTitle>
            <DialogDescription className="text-gray-500">
              Apply a tag to {selected.size} selected {selected.size === 1 ? 'business' : 'businesses'}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Tag name"
              value={bulkTagValue}
              onChange={(e) => setBulkTagValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && bulkTagValue.trim() && !bulkTagSubmitting) {
                  e.preventDefault();
                  (async () => {
                    setBulkTagSubmitting(true);
                    const ok = await applyBulkTag(selected, bulkTagValue);
                    setBulkTagSubmitting(false);
                    if (ok) { setBulkTagOpen(false); onRefresh(); }
                  })();
                }
              }}
              className="!bg-white border-gray-200 text-gray-900"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkTagOpen(false)} disabled={bulkTagSubmitting}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!bulkTagValue.trim() || bulkTagSubmitting) return;
                setBulkTagSubmitting(true);
                const ok = await applyBulkTag(selected, bulkTagValue);
                setBulkTagSubmitting(false);
                if (ok) { setBulkTagOpen(false); onRefresh(); }
              }}
              disabled={!bulkTagValue.trim() || bulkTagSubmitting}
            >
              {bulkTagSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Apply tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget && deleteTarget.ids.length > 1 ? `${deleteTarget.ids.length} businesses` : 'business'}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will permanently delete {deleteTarget && deleteTarget.ids.length > 1 ? 'these businesses' : 'this business'}, including all customers, transactions, rewards, staff, and the owner account. This action cannot be undone.
                </p>
                {deleteTarget && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {deleteTarget.names.map((name, i) => (
                      <p key={i} className="text-sm font-medium text-red-700">{name}</p>
                    ))}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                'Delete permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function SortableHeader({
  label,
  column,
  currentSort,
  currentOrder,
  onSort,
  className = '',
}: {
  label: string;
  column: string;
  currentSort: string;
  currentOrder: string;
  onSort: (column: string) => void;
  className?: string;
}) {
  const isActive = currentSort === column;
  return (
    <th
      className={`px-4 py-4 text-gray-500 font-medium cursor-pointer select-none hover:text-gray-900 transition-colors ${className}`}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentOrder === 'asc' ? (
            <ChevronUp className="w-3.5 h-3.5 text-orange-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-orange-500" />
          )
        ) : (
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
        )}
      </span>
    </th>
  );
}

function PaginationControls({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  const pages = buildPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-400">
        Showing {start}&ndash;{end} of {totalCount}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-300">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-8 h-8 rounded text-sm transition-colors ${
                p === page
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');
  pages.push(total);

  return pages;
}

function handleSort(
  column: string,
  filters: BusinessFilters,
  onFiltersPatch: (patch: Partial<BusinessFilters>) => void,
) {
  if (filters.sort === column) {
    onFiltersPatch({ order: filters.order === 'asc' ? 'desc' : 'asc' });
  } else {
    onFiltersPatch({ sort: column, order: 'desc' });
  }
}

async function handleExportCsv(filters: BusinessFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.plan) params.set('plan', filters.plan);
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  params.set('sort', filters.sort);
  params.set('order', filters.order);
  try {
    const res = await fetch(`/api/admin/businesses/export?${params.toString()}`);
    if (!res.ok) {
      toast.error('Failed to export businesses.');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `businesses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error('Failed to export businesses.');
  }
}

async function applyBulkTag(selected: Set<string>, tag: string): Promise<boolean> {
  const trimmed = tag.trim();
  if (!trimmed) return false;
  try {
    const res = await fetch('/api/admin/businesses/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessIds: Array.from(selected), tag: trimmed }),
    });
    if (!res.ok) {
      toast.error('Failed to apply tags.');
      return false;
    }
    const data = (await res.json()) as { count: number };
    toast.success(`Tagged ${data.count} ${data.count === 1 ? 'business' : 'businesses'} with "${trimmed}"`);
    return true;
  } catch {
    toast.error('Failed to apply tags.');
    return false;
  }
}
