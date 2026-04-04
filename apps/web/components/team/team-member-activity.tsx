// apps/web/components/team/team-member-activity.tsx

'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Clock, Award, User, Calendar } from 'lucide-react';
import { StaffMember } from '@/lib/staff';
import { createClient } from '@/lib/supabase';

interface ScanLog {
  id: string;
  points_awarded: number;
  transaction_amount: number | null;
  scanned_at: string;
  customer: {
    id: string;
    full_name: string;
  } | null;
}

interface TeamMemberActivityProps {
  member: StaffMember;
  onClose: () => void;
}

export function TeamMemberActivity({
  member,
  onClose,
}: TeamMemberActivityProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    totalPoints: 0,
    avgPointsPerScan: 0,
  });
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>(
    'today'
  );

  useEffect(() => {
    loadActivity();
  }, [member.id, dateRange]);

  const loadActivity = async () => {
    setIsLoading(true);
    const supabase = createClient();

    // Calculate date filter
    let startDate = new Date();
    if (dateRange === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === 'week') {
      const day = startDate.getDay();
      // getDay(): 0=Sun, 1=Mon ... 6=Sat → offset to Monday
      const diffToMonday = day === 0 ? 6 : day - 1;
      startDate.setDate(startDate.getDate() - diffToMonday);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    const { data: logs, error } = await supabase
      .from('scan_logs')
      .select(
        `
        id,
        points_awarded,
        transaction_amount,
        scanned_at,
        customers (
          id,
          full_name
        )
      `
      )
      .eq('staff_id', member.id)
      .gte('scanned_at', startDate.toISOString())
      .order('scanned_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading activity:', error);
      setIsLoading(false);
      return;
    }

    const formattedLogs = (logs || []).map((log) => ({
      ...log,
      customer: log.customers as { id: string; full_name: string } | null,
    }));

    setScanLogs(formattedLogs as ScanLog[]);

    // Calculate stats
    const totalScans = formattedLogs.length;
    const totalPoints = formattedLogs.reduce(
      (sum, log) => sum + (log.points_awarded || 0),
      0
    );
    const avgPointsPerScan =
      totalScans > 0 ? Math.round(totalPoints / totalScans) : 0;

    setStats({ totalScans, totalPoints, avgPointsPerScan });
    setIsLoading(false);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-border/50 border-t-2 border-t-primary">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">
                {member.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground tracking-tight">
                {member.name}
              </h2>
              <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Date Range Tabs */}
        <div className="flex gap-2 p-4 border-b border-border shrink-0">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                dateRange === range
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {range === 'today'
                ? 'Today'
                : range === 'week'
                ? 'This Week'
                : 'This Month'}
            </button>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 shrink-0">
          <div className="text-center">
            <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {stats.totalScans}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Scans
            </p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-primary">
              {stats.totalPoints.toLocaleString()}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Points Awarded
            </p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {stats.avgPointsPerScan}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avg per Scan
            </p>
          </div>
        </div>

        {/* Activity List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : scanLogs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">
                No activity for this period
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {scanLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {log.customer?.full_name || 'Unknown Customer'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTime(log.scanned_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +{log.points_awarded} pts
                      </p>
                      {log.transaction_amount && (
                        <p className="text-xs text-muted-foreground">
                          ₱{log.transaction_amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
