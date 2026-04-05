// apps/web/app/dashboard/team/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import {
  InviteModal,
  TeamMemberCard,
  TeamMemberActivity,
} from '@/components/team';
import {
  Users,
  Plus,
  Mail,
  Clock,
  Copy,
  XCircle,
  Loader2,
  AlertCircle,
  UserX,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getTeamMembers,
  getPendingInvites,
  cancelInvite,
  deactivateStaff,
  reactivateStaff,
  StaffMember,
  StaffInvite,
} from '@/lib/staff';
import { createClient } from '@/lib/supabase';

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<StaffMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<StaffInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMemberForActivity, setSelectedMemberForActivity] =
    useState<StaffMember | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Set up real-time subscription for staff stats
  useEffect(() => {
    if (!businessId) return;

    const supabase = createClient();

    // Subscribe to real-time scan log updates to refresh staff stats
    const channel = supabase
      .channel('team-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scan_logs',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          // Reload team data when new scan comes in
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  const loadData = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!business) {
      setIsLoading(false);
      return;
    }

    setBusinessId(business.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [members, invites, { data: todayScans }] = await Promise.all([
      getTeamMembers(business.id),
      getPendingInvites(business.id),
      supabase
        .from('scan_logs')
        .select('staff_id, points_awarded, scanned_at')
        .eq('business_id', business.id)
        .gte('scanned_at', today.toISOString()),
    ]);

    // Compute today's stats per staff member from scan_logs
    const statsMap = new Map<string, { scans: number; points: number; lastScan: string | null }>();
    for (const scan of todayScans ?? []) {
      const existing = statsMap.get(scan.staff_id) ?? { scans: 0, points: 0, lastScan: null };
      existing.scans += 1;
      existing.points += scan.points_awarded || 0;
      if (!existing.lastScan || (scan.scanned_at && scan.scanned_at > existing.lastScan)) {
        existing.lastScan = scan.scanned_at;
      }
      statsMap.set(scan.staff_id, existing);
    }

    const membersWithStats = members.map((member) => {
      const stats = statsMap.get(member.id);
      if (!stats) return member;
      return {
        ...member,
        scans_today: stats.scans,
        points_awarded_today: stats.points,
        last_scan_at: stats.lastScan || member.last_scan_at,
      };
    });

    setTeamMembers(membersWithStats);
    setPendingInvites(invites);
    setIsLoading(false);
  };

  const handleInviteClick = () => {
    setShowInviteModal(true);
  };

  const handleDeactivate = (staffId: string) => {
    const member = teamMembers.find((m) => m.id === staffId) || null;
    setDeactivateTarget(member);
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsDeactivating(true);

    const result = await deactivateStaff(deactivateTarget.id);
    setIsDeactivating(false);
    setDeactivateTarget(null);

    if (result.success) {
      loadData();
    }
  };

  const handleReactivate = async (staffId: string) => {
    const result = await reactivateStaff(staffId);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || 'Failed to reactivate staff member');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Cancel this invite?')) return;

    const result = await cancelInvite(inviteId);
    if (result.success) {
      loadData();
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleViewActivity = (member: StaffMember) => {
    setSelectedMemberForActivity(member);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6 overflow-hidden">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-5 w-56 mt-2 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-48 rounded-xl" />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-background rounded-xl p-4 border border-border/50 shadow-card">
                <Skeleton className="h-7 w-10 mb-1 rounded-lg" />
                <Skeleton className="h-4 w-24 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Team members list skeleton */}
          <div className="bg-background rounded-2xl border border-border/50 shadow-card">
            <div className="p-4 sm:p-6 border-b border-border">
              <Skeleton className="h-6 w-44 rounded-lg" />
            </div>
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 sm:p-6 flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-36 rounded-lg" />
                    <Skeleton className="h-4 w-48 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Count active vs inactive
  const activeMembers = teamMembers.filter(
    (m) => m.is_active && m.role !== 'owner',
  );
  const inactiveMembers = teamMembers.filter((m) => !m.is_active);

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Team Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your staff and cashiers
            </p>
          </div>
          <button
            onClick={handleInviteClick}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Invite Team Member</span>
            <span className="sm:hidden">Invite</span>
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-background rounded-xl p-4 border border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {teamMembers.length}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Members</p>
          </div>
          <div className="bg-background rounded-xl p-4 border border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-emerald-600">
              {activeMembers.length}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Staff</p>
          </div>
          <div className="bg-background rounded-xl p-4 border border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-amber-600">
              {pendingInvites.length}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending Invites</p>
          </div>
          <div className="bg-background rounded-xl p-4 border border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                <UserX className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-muted-foreground">
              {inactiveMembers.length}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Inactive</p>
          </div>
        </div>

        {/* Pending Invites Section */}
        {pendingInvites.length > 0 && (
          <div className="bg-amber-50/50 rounded-2xl border border-amber-200/60 overflow-hidden shadow-card">
            <div className="p-4 sm:p-6 border-b border-amber-200/60">
              <h2 className="font-display text-base sm:text-lg font-semibold text-amber-800 flex items-center gap-2 tracking-tight">
                <Clock className="w-5 h-5" />
                Pending Invites ({pendingInvites.length})
              </h2>
              <p className="text-sm text-amber-700/80 mt-1">
                Share the invite link with your team members
              </p>
            </div>
            <div className="divide-y divide-amber-200/60">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-amber-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate text-sm sm:text-base">
                        {invite.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {invite.email}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-100/60 rounded-lg text-xs font-medium text-amber-700 capitalize shrink-0">
                      {invite.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => copyInviteLink(invite.token)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium ${
                        copiedToken === invite.token
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                      {copiedToken === invite.token ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      className="p-2 hover:bg-destructive/10 rounded-xl transition-colors"
                      title="Cancel invite"
                    >
                      <XCircle className="w-5 h-5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Members Section */}
        <div className="bg-background rounded-2xl border border-border/50 shadow-card">
          <div className="p-4 sm:p-6 border-b border-border">
            <h2 className="font-display text-base sm:text-lg font-semibold text-foreground flex items-center gap-2 tracking-tight">
              <Users className="w-5 h-5 text-muted-foreground" />
              Team Members ({teamMembers.length})
            </h2>
          </div>

          {teamMembers.length === 0 ? (
            <div className="p-12 text-center bg-gradient-to-b from-muted/30 to-background">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-primary/60" />
              </div>
              <h3 className="font-display text-lg font-medium text-foreground mb-2">
                No team members yet
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Invite your first team member to help manage your loyalty
                program
              </p>
              <button
                onClick={handleInviteClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                Invite Team Member
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {teamMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  onDeactivate={handleDeactivate}
                  onReactivate={handleReactivate}
                  onViewActivity={handleViewActivity}
                />
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-primary/5 rounded-xl p-4 flex items-start gap-3 border border-primary/10">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-primary/90">
            <p className="font-medium mb-1">How team roles work:</p>
            <ul className="space-y-1 text-primary/80">
              <li>
                • <strong>Cashiers</strong> can only scan customer QR codes and
                award points
              </li>
              <li>
                • Deactivated members cannot access the system until reactivated
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showInviteModal && businessId && (
        <InviteModal
          businessId={businessId}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            loadData();
          }}
        />
      )}

      {selectedMemberForActivity && (
        <TeamMemberActivity
          member={selectedMemberForActivity}
          onClose={() => setSelectedMemberForActivity(null)}
        />
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border/50 border-t-2 border-t-destructive">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center shrink-0">
                <UserX className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Deactivate Member
              </h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to deactivate{' '}
              <span className="font-medium text-foreground">
                {deactivateTarget.name}
              </span>
              ? They will no longer be able to scan customers.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeactivateTarget(null)}
                disabled={isDeactivating}
                className="flex-1 py-2.5 bg-muted hover:bg-muted/80 rounded-xl font-medium transition-colors text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivate}
                disabled={isDeactivating}
                className="flex-1 py-2.5 bg-destructive hover:bg-destructive/90 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeactivating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Deactivate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
