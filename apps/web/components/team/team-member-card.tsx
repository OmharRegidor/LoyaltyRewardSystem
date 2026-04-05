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
        return 'bg-primary/10 text-primary';
      case 'cashier':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Shield className="w-4 h-4" />;
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
      className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors ${
        !member.is_active ? 'opacity-60' : ''
      }`}
    >
      {/* Member Info */}
      <div className="flex items-center gap-4">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
            member.is_active
              ? 'bg-primary'
              : 'bg-muted-foreground/40'
          }`}
        >
          <span className="text-primary-foreground font-bold text-base">
            {member.name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground truncate text-sm sm:text-base">
              {member.name}
            </p>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium capitalize ${getRoleBadgeStyle(
                member.role
              )}`}
            >
              {getRoleIcon(member.role)}
              {member.role}
            </span>
            {!member.is_active && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {member.email}
          </p>
          {member.role !== 'owner' && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
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
              <p className="font-display text-lg sm:text-xl font-bold tabular-nums tracking-tight text-foreground">
                {member.scans_today || 0}
              </p>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Scans
              </p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg sm:text-xl font-bold tabular-nums tracking-tight text-primary">
                {member.points_awarded_today || 0}
              </p>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Points
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-background rounded-xl shadow-lg border border-border/50 py-1.5 z-50">
                  <button
                    onClick={() => {
                      onViewActivity(member);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 flex items-center gap-2 transition-colors"
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
                      className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors"
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
                      className="w-full px-4 py-2.5 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
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
        <div className="text-sm text-muted-foreground italic">
          Business Owner
        </div>
      )}
    </div>
  );
}
