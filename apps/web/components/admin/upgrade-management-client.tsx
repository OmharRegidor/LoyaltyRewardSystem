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
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Crown,
  Loader2,
  Clock,
  Building2,
  Mail,
} from 'lucide-react';
import type {
  BusinessSearchResult,
  PlanChangeRow,
  PlanChangesResponse,
  PlanOption,
  EnterpriseAccount,
} from '@/lib/admin';

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ============================================
// MAIN COMPONENT
// ============================================

export function UpgradeManagementClient() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BusinessSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Data state
  const [enterpriseAccounts, setEnterpriseAccounts] = useState<EnterpriseAccount[]>([]);
  const [planChanges, setPlanChanges] = useState<PlanChangeRow[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'upgrade' | 'downgrade'>('upgrade');
  const [dialogBusiness, setDialogBusiness] = useState<{ id: string; name: string } | null>(null);
  const [dialogReason, setDialogReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Derived: find free and enterprise plan IDs
  const freePlan = plans.find((p) => p.name === 'free');
  const enterprisePlan = plans.find((p) => p.name === 'enterprise');

  // ---- Data fetching ----

  const fetchData = useCallback(async () => {
    const [enterpriseRes, changesRes] = await Promise.all([
      fetch('/api/admin/enterprise-accounts'),
      fetch('/api/admin/plan-changes'),
    ]);

    if (enterpriseRes.ok) {
      const data: EnterpriseAccount[] = await enterpriseRes.json();
      setEnterpriseAccounts(data);
    }

    if (changesRes.ok) {
      const data: PlanChangesResponse = await changesRes.json();
      setPlanChanges(data.changes);
      setPlans(data.plans);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---- Debounced search ----

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
        if (res.ok) {
          const data: BusinessSearchResult[] = await res.json();
          setSearchResults(data);
        }
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // ---- Actions ----

  function openUpgradeDialog(businessId: string, businessName: string) {
    setDialogAction('upgrade');
    setDialogBusiness({ id: businessId, name: businessName });
    setDialogReason('');
    setDialogOpen(true);
  }

  function openDowngradeDialog(businessId: string, businessName: string) {
    setDialogAction('downgrade');
    setDialogBusiness({ id: businessId, name: businessName });
    setDialogReason('');
    setDialogOpen(true);
  }

  async function handleConfirm() {
    if (!dialogBusiness || submitting) return;

    const targetPlanId =
      dialogAction === 'upgrade' ? enterprisePlan?.id : freePlan?.id;

    if (!targetPlanId) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/businesses/${dialogBusiness.id}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPlanId: targetPlanId,
          reason: dialogReason.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to change plan');

      setDialogOpen(false);
      setDialogBusiness(null);
      setDialogReason('');

      // Clear search results so stale plan badges refresh
      setSearchQuery('');
      setSearchResults([]);

      // Refresh data
      await fetchData();
    } catch {
      // Keep dialog open on error
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Loading state ----

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upgrade Management</h1>
        <p className="text-gray-500 text-sm mt-1">
          Search businesses and manage plan upgrades/downgrades.
        </p>
      </div>

      {/* Search Section */}
      <SearchSection
        query={searchQuery}
        onQueryChange={setSearchQuery}
        results={searchResults}
        searching={searching}
        enterprisePlan={enterprisePlan}
        onUpgrade={openUpgradeDialog}
        onDowngrade={openDowngradeDialog}
      />

      {/* Enterprise Accounts */}
      <EnterpriseAccountsTable
        accounts={enterpriseAccounts}
        onDowngrade={openDowngradeDialog}
      />

      {/* Plan Changes History */}
      <PlanChangesTable changes={planChanges} />

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white border-gray-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {dialogAction === 'upgrade' ? 'Upgrade to Enterprise' : 'Downgrade to Free'}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {dialogAction === 'upgrade'
                ? `Upgrade "${dialogBusiness?.name}" to the Enterprise plan?`
                : `Downgrade "${dialogBusiness?.name}" to the Free plan?`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label className="text-sm text-gray-500 mb-1.5 block">
              Reason (optional)
            </label>
            <Textarea
              placeholder="Why is this plan being changed?"
              value={dialogReason}
              onChange={(e) => setDialogReason(e.target.value)}
              className="!bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={submitting}
              className={
                dialogAction === 'upgrade'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              {dialogAction === 'upgrade' ? 'Confirm Upgrade' : 'Confirm Downgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// SEARCH SECTION
// ============================================

interface SearchSectionProps {
  query: string;
  onQueryChange: (q: string) => void;
  results: BusinessSearchResult[];
  searching: boolean;
  enterprisePlan: PlanOption | undefined;
  onUpgrade: (id: string, name: string) => void;
  onDowngrade: (id: string, name: string) => void;
}

function SearchSection({
  query,
  onQueryChange,
  results,
  searching,
  enterprisePlan,
  onUpgrade,
  onDowngrade,
}: SearchSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        Search Business
      </h2>

      <div className="relative">
        <Input
          placeholder="Search by business name or owner email..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="!bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="text-sm text-gray-400 mt-4">No businesses found.</p>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((biz) => {
            const isEnterprise =
              enterprisePlan &&
              biz.planName?.toLowerCase() === enterprisePlan.display_name.toLowerCase();

            return (
              <div
                key={biz.id}
                className="flex items-center justify-between gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{biz.name}</p>
                    {biz.ownerEmail && (
                      <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {biz.ownerEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={
                      isEnterprise
                        ? 'text-orange-600 border-orange-300 bg-orange-50'
                        : 'text-gray-500 border-gray-300'
                    }
                  >
                    {biz.planName ?? 'Free'}
                  </Badge>

                  {isEnterprise ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-gray-500 border-gray-300 hover:bg-gray-100"
                      onClick={() => onDowngrade(biz.id, biz.name)}
                    >
                      <ArrowDownCircle className="w-3.5 h-3.5" />
                      Downgrade
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50"
                      onClick={() => onUpgrade(biz.id, biz.name)}
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// ENTERPRISE ACCOUNTS TABLE
// ============================================

interface EnterpriseAccountsTableProps {
  accounts: EnterpriseAccount[];
  onDowngrade: (id: string, name: string) => void;
}

function EnterpriseAccountsTable({ accounts, onDowngrade }: EnterpriseAccountsTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Crown className="w-5 h-5 text-orange-500" />
        Enterprise Accounts
        <Badge variant="secondary" className="ml-2">
          {accounts.length}
        </Badge>
      </h2>

      {accounts.length === 0 ? (
        <p className="text-sm text-gray-400">No enterprise accounts yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3 pr-4">
                  Business
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3 pr-4">
                  Owner
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3 pr-4">
                  Upgraded
                </th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.map((account) => (
                <tr key={account.id} className="group">
                  <td className="py-3 pr-4">
                    <span className="text-sm font-medium text-gray-900">{account.businessName}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-gray-500">{account.ownerEmail ?? '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-gray-500">
                      {account.upgradedAt ? formatRelativeTime(account.upgradedAt) : '—'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-gray-500 border-gray-300 hover:bg-gray-100 opacity-60 group-hover:opacity-100 transition-opacity"
                      onClick={() => onDowngrade(account.businessId, account.businessName)}
                    >
                      <ArrowDownCircle className="w-3.5 h-3.5" />
                      Downgrade
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================
// PLAN CHANGES TABLE
// ============================================

interface PlanChangesTableProps {
  changes: PlanChangeRow[];
}

function PlanChangesTable({ changes }: PlanChangesTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-400" />
        Recent Plan Changes
      </h2>

      {changes.length === 0 ? (
        <p className="text-sm text-gray-400">No plan changes recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3 pr-4">
                  Business
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3 pr-4">
                  Change
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3 pr-4">
                  Changed By
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {changes.map((change) => (
                <tr key={change.id}>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-medium text-gray-900">{change.businessName}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="text-gray-500">{change.oldPlanName ?? 'None'}</span>
                      <span className="text-gray-300">&rarr;</span>
                      <span className="text-gray-900 font-medium">{change.newPlanName ?? 'None'}</span>
                    </div>
                    {change.reason && (
                      <p className="text-xs text-gray-400 mt-0.5">{change.reason}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-gray-500">{change.changedByEmail}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-gray-500" title={formatDate(change.createdAt)}>
                      {formatRelativeTime(change.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
