'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Search,
  LogIn,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { AdminUsersResponse } from '@/app/api/admin/users/route';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  business_owner: 'Business Owner',
  staff: 'Staff',
  customer: 'Customer',
};

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-orange-50 text-orange-700 border-orange-200',
  business_owner: 'bg-blue-50 text-blue-700 border-blue-200',
  staff: 'bg-purple-50 text-purple-700 border-purple-200',
  customer: 'bg-gray-100 text-gray-600 border-gray-200',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge className={ROLE_STYLES[role] ?? 'bg-gray-100 text-gray-500 border-gray-200'}>
      {ROLE_LABELS[role] ?? role}
    </Badge>
  );
}

export function AdminUsersClient() {
  const [role, setRole] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [impersonateTarget, setImpersonateTarget] = useState<
    { userId: string; email: string; role: string } | null
  >(null);
  const [impersonating, setImpersonating] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (role) params.set('role', role);
      if (search) params.set('search', search);
      if (page > 1) params.set('page', String(page));
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [role, search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleImpersonate = async () => {
    if (!impersonateTarget || impersonating) return;
    setImpersonating(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: impersonateTarget.userId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Failed to start impersonation');
      }
      const payload = (await res.json()) as { activationUrl: string };
      window.open(payload.activationUrl, '_blank', 'noopener,noreferrer');
      setImpersonateTarget(null);
      toast.success('Impersonation link opened in a new tab');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start impersonation');
    } finally {
      setImpersonating(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
        <p className="text-gray-500 mt-1">
          {data ? `${data.totalCount} users` : 'Loading…'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-orange-500"
        >
          <option value="">All Roles</option>
          <option value="business_owner">Business Owners</option>
          <option value="staff">Staff</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </select>
        {(search || role) && (
          <button
            onClick={() => { setSearchInput(''); setRole(''); setPage(1); }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Business</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Created</th>
                <th className="px-4 py-3 text-gray-500 font-medium w-36"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && !data ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : data && data.users.length > 0 ? (
                data.users.map((u) => (
                  <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 truncate max-w-[260px]">{u.email ?? '—'}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell truncate max-w-[220px]">
                      {u.businessId ? (
                        <Link href={`/admin/businesses/${u.businessId}`} className="hover:text-orange-600 transition-colors">
                          {u.businessName ?? 'Unknown'}
                          {u.businessCount > 1 && <span className="text-gray-400"> +{u.businessCount - 1}</span>}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(u.role === 'business_owner' || u.role === 'staff') ? (
                        <button
                          onClick={() => setImpersonateTarget({ userId: u.userId, email: u.email ?? '', role: u.role })}
                          className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 transition-colors"
                          title="Log in as this user"
                        >
                          <LogIn className="w-4 h-4" />
                          Login as
                        </button>
                      ) : u.role === 'customer' ? (
                        <button
                          disabled
                          className="inline-flex items-center gap-1 text-sm text-gray-300 cursor-not-allowed"
                          title="Customer view coming soon"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    {search || role ? 'No users match your filters' : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Page {data.page} of {totalPages} · {data.totalCount} total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={data.page <= 1}
              className="p-2 text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={data.page >= totalPages}
              className="p-2 text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!impersonateTarget}
        onOpenChange={(open) => { if (!open && !impersonating) setImpersonateTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Login as {impersonateTarget?.email}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  You will be signed in as this {impersonateTarget?.role === 'business_owner' ? 'business owner' : 'staff member'} in a new tab.
                </p>
                <p className="text-sm">
                  <strong>Read-only mode</strong> — you will not be able to create, update, or delete anything while impersonating. A red banner will appear at the top of the page.
                </p>
                <p className="text-sm text-gray-500">
                  This action is logged to the audit trail. The activation link expires in 5 minutes and can only be used once.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={impersonating}>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleImpersonate} disabled={impersonating}>
                {impersonating && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                Open impersonation tab
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
