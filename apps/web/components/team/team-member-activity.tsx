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
    name: string;
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
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
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
          name
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
      customer: String(log.customers),
    }));

    setScanLogs(formattedLogs as any);

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold">
                {member.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {member.name}
              </h2>
              <p className="text-sm text-gray-500 capitalize">{member.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Date Range Tabs */}
        <div className="flex gap-2 p-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRange === range
                  ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 shrink-0">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalScans}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total Scans
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {stats.totalPoints.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Points Awarded
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.avgPointsPerScan}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Avg per Scan
            </p>
          </div>
        </div>

        {/* Activity List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
          ) : scanLogs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No activity for this period
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {scanLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                        <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {log.customer?.name || 'Unknown Customer'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatTime(log.scanned_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        +{log.points_awarded} pts
                      </p>
                      {log.transaction_amount && (
                        <p className="text-xs text-gray-500">
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
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
