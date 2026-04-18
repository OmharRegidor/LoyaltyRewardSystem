'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Bell, Check, X, ExternalLink, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface PendingRequest {
  id: string;
  business_id: string;
  business_name: string;
  owner_email: string;
  screenshot_url: string;
  created_at: string;
}

export function NotificationBell() {
  const [pendingCount, setPendingCount] = useState(0);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/upgrade-requests?status=pending&countOnly=true');
      if (res.status === 401) {
        // Session expired — send user back to login instead of looping silently
        window.location.href = '/login';
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setPendingCount(data.count ?? 0);
    } catch {
      // Transient network error — try again on next poll
    }
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/upgrade-requests?status=pending');
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (interval) return;
      interval = setInterval(fetchCount, 60000);
    };
    const stop = () => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    };

    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      start();
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCount();
        start();
      } else {
        stop();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stop();
    };
  }, [fetchCount]);

  useEffect(() => {
    if (open) {
      fetchRequests();
    }
  }, [open]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/upgrade-requests/${id}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setPendingCount((prev) => Math.max(0, prev - 1));
        toast.success('Upgrade approved');
      } else {
        toast.error('Failed to approve upgrade request.');
      }
    } catch {
      toast.error('Failed to approve upgrade request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/upgrade-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setPendingCount((prev) => Math.max(0, prev - 1));
        setRejectingId(null);
        setRejectReason('');
        toast.success('Upgrade rejected');
      } else {
        toast.error('Failed to reject upgrade request.');
      }
    } catch {
      toast.error('Failed to reject upgrade request.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-gray-500 hover:text-gray-900 transition">
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {pendingCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 max-h-[70vh] overflow-hidden flex flex-col"
      >
        <div className="p-3 border-b border-gray-200">
          <h3 className="font-semibold text-sm">Upgrade Requests</h3>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              No pending requests
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((req) => (
                <div key={req.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {req.business_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {req.owner_email}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(req.created_at).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <a
                      href={req.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition shrink-0"
                      title="View screenshot"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {rejectingId === req.id ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        placeholder="Reason (optional)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason('');
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading === req.id}
                          className="flex-1 text-xs bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {actionLoading === req.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Confirm Reject'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={actionLoading === req.id}
                        className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {actionLoading === req.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setRejectingId(req.id)}
                        disabled={actionLoading === req.id}
                        className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
