// apps/web/app/dashboard/settings/team/page.tsx

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

    setTeamMembers(members);
    setPendingInvites(invites);
    setIsLoading(false);
  };

  const handleDeactivate = async (staffId: string) => {
    if (
      !confirm(
        'Are you sure you want to deactivate this team member? They will no longer be able to scan customers.'
      )
    ) {
      return;
    }

    const result = await deactivateStaff(staffId);
    if (result.success) {
      loadData();
    }
  };

  const handleReactivate = async (staffId: string) => {
    const result = await reactivateStaff(staffId);
    if (result.success) {
      loadData();
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      </DashboardLayout>
    );
  }

  // Count active vs inactive
  const activeMembers = teamMembers.filter(
    (m) => m.is_active && m.role !== 'owner'
  );
  const inactiveMembers = teamMembers.filter((m) => !m.is_active);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Team Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage your staff and cashiers
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-linear-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            <Plus className="w-5 h-5" />
            Invite Team Member
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {teamMembers.length}
            </p>
            <p className="text-sm text-gray-500">Total Members</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-green-600">
              {activeMembers.length}
            </p>
            <p className="text-sm text-gray-500">Active Staff</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-yellow-600">
              {pendingInvites.length}
            </p>
            <p className="text-sm text-gray-500">Pending Invites</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-400">
              {inactiveMembers.length}
            </p>
            <p className="text-sm text-gray-500">Inactive</p>
          </div>
        </div>

        {/* Pending Invites Section */}
        {pendingInvites.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-yellow-200 dark:border-yellow-800">
              <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Invites ({pendingInvites.length})
              </h2>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Share the invite link with your team members
              </p>
            </div>
            <div className="divide-y divide-yellow-200 dark:divide-yellow-800">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {invite.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {invite.email}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 capitalize shrink-0">
                      {invite.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => copyInviteLink(invite.token)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                        copiedToken === invite.token
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                      {copiedToken === invite.token ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members ({teamMembers.length})
            </h2>
          </div>

          {teamMembers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No team members yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Invite your first team member to help manage your loyalty
                program
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Invite Team Member
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {teamMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  onDeactivate={handleDeactivate}
                  onReactivate={handleReactivate}
                  onViewActivity={(m) => setSelectedMemberForActivity(m)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">How team roles work:</p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
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
    </DashboardLayout>
  );
}
