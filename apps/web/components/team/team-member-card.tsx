// apps/web/components/team/team-member-card.tsx

'use client';

import { useState } from 'react';
import {
  UserCheck,
  UserX,
  MoreVertical,
  Clock,
  Activity,
  Shield,
  User,
} from 'lucide-react';
import { StaffMember } from '@/lib/staff';

interface TeamMemberCardProps {
  member: StaffMember;
  onDeactivate: (staffId: string) => void;
  onReactivate: (staffId: string) => void;
  onViewActivity: (member: StaffMember) => void;
}

export function TeamMemberCard({
  member,
  onDeactivate,
  onReactivate,
  onViewActivity,
}: TeamMemberCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'manager':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'cashier':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Shield className="w-4 h-4" />;
      case 'manager':
        return <Activity className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const formatLastActivity = (date: string | null) => {
    if (!date) return 'Never';

    const now = new Date();
    const lastActivity = new Date(date);
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return lastActivity.toLocaleDateString();
  };

  return (
    <div
      className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
        !member.is_active ? 'opacity-60' : ''
      }`}
    >
      {/* Member Info */}
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            member.is_active
              ? 'bg-linear-to-br from-cyan-500 to-blue-500'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span className="text-white font-bold text-lg">
            {member.name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {member.name}
            </p>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeStyle(
                member.role
              )}`}
            >
              {getRoleIcon(member.role)}
              {member.role}
            </span>
            {!member.is_active && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {member.email}
          </p>
          {member.role !== 'owner' && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>Last scan: {formatLastActivity(member.last_scan_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats & Actions (for non-owners) */}
      {member.role !== 'owner' && (
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Today's Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {member.scans_today || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Scans Today
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                {member.points_awarded_today || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Points Today
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <button
                    onClick={() => {
                      onViewActivity(member);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    View Activity
                  </button>

                  {member.is_active ? (
                    <button
                      onClick={() => {
                        onDeactivate(member.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <UserX className="w-4 h-4" />
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onReactivate(member.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Reactivate
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Owner badge - no actions */}
      {member.role === 'owner' && (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic">
          Business Owner
        </div>
      )}
    </div>
  );
}
