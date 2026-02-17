'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  ScrollText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import type { AuditLogEntry, AuditLogsResponse } from '@/lib/admin';

// ============================================
// HELPERS
// ============================================

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const SEVERITY_STYLES: Record<string, string> = {
  info: 'text-blue-600 border-blue-300 bg-blue-50',
  warning: 'text-yellow-700 border-yellow-300 bg-yellow-50',
  error: 'text-red-600 border-red-300 bg-red-50',
  critical: 'text-red-800 border-red-500 bg-red-100',
};

function severityStyle(severity: string): string {
  return SEVERITY_STYLES[severity] ?? 'text-gray-600 border-gray-300 bg-gray-50';
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AuditLogsClient() {
  // Filter state
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [businessSearch, setBusinessSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Data state
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Debounce ref for business search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedBusinessSearch, setDebouncedBusinessSearch] = useState('');

  // Debounce business search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedBusinessSearch(businessSearch);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [businessSearch]);

  // Fetch data
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(page));
    if (eventTypeFilter) searchParams.set('eventType', eventTypeFilter);
    if (severityFilter) searchParams.set('severity', severityFilter);
    if (debouncedBusinessSearch) searchParams.set('businessSearch', debouncedBusinessSearch);
    if (dateFrom) searchParams.set('dateFrom', dateFrom);
    if (dateTo) searchParams.set('dateTo', dateTo);

    try {
      const res = await fetch(`/api/admin/audit-logs?${searchParams.toString()}`);
      if (res.ok) {
        const data: AuditLogsResponse = await res.json();
        setLogs(data.logs);
        setTotalCount(data.totalCount);
        setPageSize(data.pageSize);
        if (data.eventTypes.length > 0) {
          setEventTypes(data.eventTypes);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [page, eventTypeFilter, severityFilter, debouncedBusinessSearch, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  // Clear all filters
  const clearFilters = () => {
    setEventTypeFilter('');
    setSeverityFilter('');
    setBusinessSearch('');
    setDebouncedBusinessSearch('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasFilters = eventTypeFilter || severityFilter || businessSearch || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-orange-500" />
          Audit Logs
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          View system events and activity logs across all businesses.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Event Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event Type
            </label>
            <select
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            >
              <option value="">All Events</option>
              {eventTypes.map((et) => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            >
              <option value="">All</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Business Search */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Business
            </label>
            <Input
              placeholder="Search business name..."
              value={businessSearch}
              onChange={(e) => setBusinessSearch(e.target.value)}
              className="h-9 w-48 !bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm"
            />
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            />
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-9 gap-1.5 text-gray-500 border-gray-300 hover:bg-gray-100"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ScrollText className="w-10 h-10 mb-3" />
            <p className="text-sm">No audit logs found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-8" />
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                      Time
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                      Event Type
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                      Severity
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                      Business
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => {
                    const isExpanded = expandedRow === log.id;
                    return (
                      <LogRow
                        key={log.id}
                        log={log}
                        isExpanded={isExpanded}
                        onToggle={() =>
                          setExpandedRow(isExpanded ? null : log.id)
                        }
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                Showing {rangeStart}–{rangeEnd} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="gap-1 text-gray-600 border-gray-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="gap-1 text-gray-600 border-gray-300"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// LOG ROW (expandable)
// ============================================

interface LogRowProps {
  log: AuditLogEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

function LogRow({ log, isExpanded, onToggle }: LogRowProps) {
  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-gray-700 whitespace-nowrap">
            {formatDateTime(log.createdAt)}
          </span>
        </td>
        <td className="px-4 py-3">
          <code className="text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
            {log.eventType}
          </code>
        </td>
        <td className="px-4 py-3">
          <Badge
            variant="outline"
            className={`text-xs capitalize ${severityStyle(log.severity)}`}
          >
            {log.severity}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-gray-600">
            {log.businessName ?? '—'}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-4 py-3 bg-gray-50">
            <div className="ml-8">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Details
              </p>
              <pre className="text-xs text-gray-700 bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-64">
                {log.details
                  ? JSON.stringify(log.details, null, 2)
                  : 'No details available'}
              </pre>
              {log.userId && (
                <p className="text-xs text-gray-400 mt-2">
                  User ID: {log.userId}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
