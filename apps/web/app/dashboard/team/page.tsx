// apps/web/app/dashboard/team/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import {
  InviteModal,
  TeamMemberCard,
  TeamMemberActivity,
} from '@/components/team';
import { UpgradeModal } from '@/components/upgrade-modal';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import {
  Users,
  Plus,
  Mail,
  Clock,
  Copy,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
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
  // Subscription gate
  const { checkAndGate, showUpgradeModal, setShowUpgradeModal } =
    useSubscriptionGate();

  const [teamMembers, setTeamMembers] = useState<StaffMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<StaffInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMemberForActivity, setSelectedMemberForActivity] =
    useState<StaffMember | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Set up real-time subscription for staff stats
  useEffect(() => {
    if (!businessId) return;

    const supabase = createClient();

    // Subscribe to real-time transaction updates to refresh staff stats
    const channel = supabase
      .channel('team-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          // Reload team data when new transaction comes in
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

    const [members, invites] = await Promise.all([
      getTeamMembers(business.id),
      getPendingInvites(business.id),
    ]);

    // Fetch today's stats for each staff member
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        if (member.role === 'owner') return member;

        // Get today's transactions for this staff member
        const { data: todayTx } = await supabase
          .from('transactions')
          .select('points')
          .eq('business_id', business.id)
          .eq('staff_id', member.id)
          .gte('created_at', today.toISOString());

        const scansToday = todayTx?.length || 0;
        const pointsToday =
          todayTx?.reduce((sum, tx) => sum + (tx.points || 0), 0) || 0;

        return {
          ...member,
          scansToday,
          pointsToday,
        };
      }),
    );

    setTeamMembers(membersWithStats);
    setPendingInvites(invites);
    setIsLoading(false);
  };

  // Gated invite handler
  const handleInviteClick = () => {
    if (checkAndGate('Invite Team Member')) {
      setShowInviteModal(true);
    }
  };

  const handleDeactivate = async (staffId: string) => {
    if (
      !confirm(
        'Are you sure you want to deactivate this team member? They will no longer be able to scan customers.',
      )
    ) {
      return;
    }

    const result = await deactivateStaff(staffId);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || 'Failed to deactivate staff member');
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
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Team Management
            </h1>
            <p className="text-gray-500">
              Manage your staff and cashiers
            </p>
          </div>
          <button
            onClick={handleInviteClick}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Plus className="w-5 h-5" />
            Invite Team Member
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-md">
            <p className="text-2xl font-bold text-gray-900">
              {teamMembers.length}
            </p>
            <p className="text-sm text-gray-500">Total Members</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-md">
            <p className="text-2xl font-bold text-green-600">
              {activeMembers.length}
            </p>
            <p className="text-sm text-gray-500">Active Staff</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-md">
            <p className="text-2xl font-bold text-yellow-600">
              {pendingInvites.length}
            </p>
            <p className="text-sm text-gray-500">Pending Invites</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-md">
            <p className="text-2xl font-bold text-gray-400">
              {inactiveMembers.length}
            </p>
            <p className="text-sm text-gray-500">Inactive</p>
          </div>
        </div>

        {/* Pending Invites Section */}
        {pendingInvites.length > 0 && (
          <div className="bg-yellow-50 rounded-2xl border border-yellow-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-yellow-200">
              <h2 className="text-lg font-semibold text-yellow-800 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Invites ({pendingInvites.length})
              </h2>
              <p className="text-sm text-yellow-700 mt-1">
                Share the invite link with your team members
              </p>
            </div>
            <div className="divide-y divide-yellow-200">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {invite.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {invite.email}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 capitalize shrink-0">
                      {invite.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => copyInviteLink(invite.token)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                        copiedToken === invite.token
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                      {copiedToken === invite.token ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel invite"
                    >
                      <XCircle className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Members Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members ({teamMembers.length})
            </h2>
          </div>

          {teamMembers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No team members yet
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Invite your first team member to help manage your loyalty
                program
              </p>
              <button
                onClick={handleInviteClick}
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Invite Team Member
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
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
        <div className="bg-primary/5 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-primary/90">
            <p className="font-medium mb-1">How team roles work:</p>
            <ul className="space-y-1 text-primary/80">
              <li>
                • <strong>Cashiers</strong> can only scan customer QR codes and
                award points
              </li>
              <li>
                • <strong>Managers</strong> can scan QR codes and view reports
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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Invite Team Member"
      />
    </DashboardLayout>
  );
}
