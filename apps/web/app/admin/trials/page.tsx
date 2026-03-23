'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Timer, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface TrialBusiness {
  business_id: string;
  business_name: string;
  owner_email: string | null;
  business_type: string | null;
  trial_ends_at: string;
  status: string;
  created_at: string | null;
}

function getTrialState(trialEndsAt: string): {
  label: string;
  daysLeft: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
} {
  const end = new Date(trialEndsAt).getTime();
  const now = Date.now();
  const diffMs = end - now;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = diffMs <= 0;
  const isExpiringSoon = !isExpired && daysLeft <= 3;

  if (isExpired) {
    const daysAgo = Math.abs(daysLeft);
    return {
      label: daysAgo === 0 ? 'Expired today' : `Expired ${daysAgo}d ago`,
      daysLeft,
      isExpired: true,
      isExpiringSoon: false,
    };
  }

  return {
    label: daysLeft === 1 ? '1 day left' : `${daysLeft} days left`,
    daysLeft,
    isExpired: false,
    isExpiringSoon,
  };
}

function TrialTimer({ trialEndsAt }: { trialEndsAt: string }) {
  const [state, setState] = useState(() => getTrialState(trialEndsAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setState(getTrialState(trialEndsAt));
    }, 60_000); // update every minute
    return () => clearInterval(interval);
  }, [trialEndsAt]);

  if (state.isExpired) {
    return (
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-sm font-medium text-red-600">{state.label}</span>
      </div>
    );
  }

  if (state.isExpiringSoon) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
        <span className="text-sm font-medium text-amber-600">{state.label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-green-500" />
      <span className="text-sm font-medium text-green-600">{state.label}</span>
    </div>
  );
}

function TrialProgress({ trialEndsAt, createdAt }: { trialEndsAt: string; createdAt: string | null }) {
  const end = new Date(trialEndsAt).getTime();
  const now = Date.now();
  // Trial is 14 days, so start = end - 14 days
  const start = createdAt ? new Date(createdAt).getTime() : end - 14 * 24 * 60 * 60 * 1000;
  const total = end - start;
  const elapsed = now - start;
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));

  const barColor =
    pct >= 100 ? 'bg-red-500' : pct >= 78 ? 'bg-amber-500' : 'bg-green-500';

  return (
    <div className="w-full">
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1 text-right">
        {Math.round(pct)}% elapsed
      </p>
    </div>
  );
}

export default function AdminTrialsPage() {
  const [trials, setTrials] = useState<TrialBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');

  const fetchTrials = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/trials');
      if (res.ok) {
        const data = await res.json();
        setTrials(data.trials);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrials();
  }, [fetchTrials]);

  const filteredTrials = trials.filter((t) => {
    const state = getTrialState(t.trial_ends_at);
    switch (filter) {
      case 'active':
        return !state.isExpired;
      case 'expiring':
        return state.isExpiringSoon;
      case 'expired':
        return state.isExpired;
      default:
        return true;
    }
  });

  const activeCount = trials.filter((t) => !getTrialState(t.trial_ends_at).isExpired).length;
  const expiringCount = trials.filter((t) => getTrialState(t.trial_ends_at).isExpiringSoon).length;
  const expiredCount = trials.filter((t) => getTrialState(t.trial_ends_at).isExpired).length;

  if (loading) {
    return (
      <AdminLayout adminEmail="">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-white border border-gray-200 rounded-2xl animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminEmail="">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trial Monitor</h1>
            <p className="text-gray-500 mt-1">
              Track all 14-day Enterprise free trials
            </p>
          </div>
          <button
            onClick={() => fetchTrials(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`bg-white border rounded-2xl p-5 text-left transition-all ${filter === 'all' ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Timer className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-gray-500">Total Trials</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{trials.length}</p>
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`bg-white border rounded-2xl p-5 text-left transition-all ${filter === 'active' ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm text-gray-500">Active</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          </button>
          <button
            onClick={() => setFilter('expiring')}
            className={`bg-white border rounded-2xl p-5 text-left transition-all ${filter === 'expiring' ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-sm text-gray-500">Expiring Soon</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{expiringCount}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">within 3 days</p>
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`bg-white border rounded-2xl p-5 text-left transition-all ${filter === 'expired' ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-sm text-gray-500">Expired</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
          </button>
        </div>

        {/* Trials Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {filter === 'all'
                ? 'All Trials'
                : filter === 'active'
                  ? 'Active Trials'
                  : filter === 'expiring'
                    ? 'Expiring Soon'
                    : 'Expired Trials'}
              <span className="text-gray-400 font-normal ml-2">
                ({filteredTrials.length})
              </span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left bg-gray-50/50">
                  <th className="px-6 py-3 font-medium">Business</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Time Remaining</th>
                  <th className="px-6 py-3 font-medium w-32">Progress</th>
                  <th className="px-6 py-3 font-medium">Trial Ends</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTrials.map((trial) => {
                  const state = getTrialState(trial.trial_ends_at);
                  return (
                    <tr key={trial.business_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/businesses/${trial.business_id}`}
                          className="text-gray-900 font-medium hover:text-orange-600 transition-colors"
                        >
                          {trial.business_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-500 truncate max-w-[180px]">
                        {trial.owner_email ?? 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-500 capitalize">
                        {trial.business_type ?? '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            state.isExpired
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : state.isExpiringSoon
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                          }
                        >
                          {state.isExpired
                            ? 'Expired'
                            : state.isExpiringSoon
                              ? 'Expiring Soon'
                              : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <TrialTimer trialEndsAt={trial.trial_ends_at} />
                      </td>
                      <td className="px-6 py-4">
                        <TrialProgress
                          trialEndsAt={trial.trial_ends_at}
                          createdAt={trial.created_at}
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(trial.trial_ends_at).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          }
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredTrials.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      {filter === 'all'
                        ? 'No trials yet'
                        : `No ${filter} trials`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
