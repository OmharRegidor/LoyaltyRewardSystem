// apps/web/lib/staff.ts
/**
 * Staff Management Module
 *
 * Handles cashier invitations and team management.
 * Note: Only 'cashier' role is used for invites. Managers share owner credentials.
 */

import { createClient } from './supabase';

// ============================================
// TYPES
// ============================================

export type StaffRole = 'owner' | 'cashier';

export interface StaffMember {
  id: string;
  user_id: string;
  business_id: string;
  role: StaffRole;
  name: string;
  email: string;
  branch_name?: string | null;
  is_active: boolean | null;
  last_login_at?: string | null;
  last_scan_at: string | null;
  scans_today: number | null;
  points_awarded_today: number | null;
  created_at: string | null;
}

export interface StaffInvite {
  id: string;
  business_id: string;
  email: string;
  name: string;
  role: 'cashier';
  branch_name?: string | null;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
}

export interface StaffRoleInfo {
  role: StaffRole | null;
  staffId: string | null;
  businessId: string | null;
  businessName: string | null;
  branchName: string | null;
}

type StaffTodayStatsRPC = {
  scans_today: number | null;
  points_awarded_today: number | null;
};

// ============================================
// ROLE & ACCESS FUNCTIONS
// ============================================

export async function getCurrentStaffRole(): Promise<StaffRoleInfo> {
  const supabase = createClient();
  const nullResult: StaffRoleInfo = {
    role: null,
    staffId: null,
    businessId: null,
    businessName: null,
    branchName: null,
  };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return nullResult;

    // Check if user is a business owner
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (business) {
      return {
        role: 'owner',
        staffId: null,
        businessId: business.id,
        businessName: business.name,
        branchName: null,
      };
    }

    // Check if user is staff (cashier)
    const { data: staff } = await supabase
      .from('staff')
      .select('*, businesses(name)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (staff) {
      const businessData = staff.businesses as { name: string } | null;
      return {
        role: staff.role as StaffRole,
        staffId: staff.id,
        businessId: staff.business_id,
        businessName: businessData?.name ?? null,
        branchName: staff.branch_name ?? null,
      };
    }

    return nullResult;
  } catch (error) {
    console.error('[getCurrentStaffRole] Error:', error);
    return nullResult;
  }
}

// ============================================
// TEAM MANAGEMENT
// ============================================

export async function getTeamMembers(
  businessId: string
): Promise<StaffMember[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getTeamMembers] Error:', error);
      return [];
    }

    return (data ?? []) as StaffMember[];
  } catch (error) {
    console.error('[getTeamMembers] Error:', error);
    return [];
  }
}

export async function getPendingInvites(
  businessId: string
): Promise<StaffInvite[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('staff_invites')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getPendingInvites] Error:', error);
      return [];
    }

    return (data ?? []) as StaffInvite[];
  } catch (error) {
    console.error('[getPendingInvites] Error:', error);
    return [];
  }
}

// ============================================
// INVITE FUNCTIONS
// ============================================

interface SendInviteParams {
  name: string;
  email: string;
  role?: 'cashier'; // Only cashier supported
  branchName?: string;
}

interface SendInviteResult {
  success: boolean;
  error?: string;
  data?: StaffInvite;
  invite?: StaffInvite; // For backwards compatibility
}

export async function sendStaffInvite(
  businessId: string,
  params: SendInviteParams
): Promise<SendInviteResult> {
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = params.email.toLowerCase().trim();

    if (!emailRegex.test(normalizedEmail)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('staff_invites')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvite) {
      return {
        success: false,
        error: 'An invite has already been sent to this email',
      };
    }

    // Check if already a team member
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingStaff) {
      return { success: false, error: 'This person is already a team member' };
    }

    console.log('📤 Creating invite with data:', {
      business_id: businessId,
      email: normalizedEmail,
      name: params.name.trim(),
      role: 'cashier',
      branch_name: params.branchName?.trim() || null,
      invited_by: user.id,
    });

    // Create the invite
    const { data: invite, error } = await supabase
      .from('staff_invites')
      .insert({
        business_id: businessId,
        email: normalizedEmail,
        name: params.name.trim(),
        role: 'cashier', // Always cashier
        branch_name: params.branchName?.trim() || null,
        invited_by: user.id,
      })
      .select()
      .maybeSingle();

    console.log('📥 Insert response:', { invite, error });

    if (error) {
      console.error('[sendStaffInvite] Insert error:', error);
      return {
        success: false,
        error: `Failed to create invite: ${error.message}`,
      };
    }

    if (!invite) {
      console.error('[sendStaffInvite] No invite returned from insert');
      return {
        success: false,
        error: 'Failed to create invite. No data returned.',
      };
    }

    if (!invite.token) {
      console.error(
        '[sendStaffInvite] Invite created but has no token:',
        invite
      );
      return {
        success: false,
        error: 'Failed to generate invite token. Please try again.',
      };
    }

    console.log('✅ Invite created successfully:', {
      id: invite.id,
      token: invite.token,
      email: invite.email,
    });

    const typedInvite = invite as StaffInvite;

    return {
      success: true,
      data: typedInvite,
      invite: typedInvite, // For backwards compatibility
    };
  } catch (error) {
    console.error('[sendStaffInvite] Error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function cancelInvite(
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('staff_invites')
      .update({ status: 'cancelled' })
      .eq('id', inviteId);

    if (error) {
      return { success: false, error: 'Failed to cancel invite' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deactivateStaff(
  staffId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: false })
      .eq('id', staffId);

    if (error) {
      return { success: false, error: 'Failed to deactivate staff' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function reactivateStaff(
  staffId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: true })
      .eq('id', staffId);

    if (error) {
      return { success: false, error: 'Failed to reactivate staff' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================
// INVITE ACCEPTANCE
// ============================================

export async function getInviteByToken(token: string): Promise<{
  success: boolean;
  invite?: StaffInvite;
  businessName?: string;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const { data: invite, error } = await supabase
      .from('staff_invites')
      .select('*, businesses(name)')
      .eq('token', token)
      .maybeSingle();

    if (error || !invite) {
      return { success: false, error: 'Invite not found' };
    }

    if (invite.status !== 'pending') {
      return { success: false, error: 'This invite has already been used' };
    }

    if (new Date(invite.expires_at) < new Date()) {
      return { success: false, error: 'This invite has expired' };
    }

    const businessData = invite.businesses as { name: string } | null;

    return {
      success: true,
      invite: invite as StaffInvite,
      businessName: businessData?.name ?? 'Unknown Business',
    };
  } catch (error) {
    console.error('[getInviteByToken] Error:', error);
    return { success: false, error: 'Failed to fetch invite' };
  }
}

// In apps/web/lib/staff.ts - Replace the acceptInvite function

export async function acceptInvite(token: string): Promise<{
  success: boolean;
  error?: string;
  data?: {
    businessId: string;
    role: string;
  };
  // For backwards compatibility
  businessId?: string;
  role?: string;
}> {
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated. Please login first.',
      };
    }

    const { data, error } = await supabase.rpc('accept_staff_invite', {
      p_token: token,
      p_user_id: user.id,
    });

    if (error) {
      console.error('[acceptInvite] RPC error:', error);
      return { success: false, error: error.message };
    }

    const result = data as {
      success: boolean;
      error?: string;
      business_id?: string;
      role?: string;
    };

    if (!result?.success) {
      return {
        success: false,
        error: result?.error ?? 'Failed to accept invite',
      };
    }

    return {
      success: true,
      data: {
        businessId: result.business_id ?? '',
        role: result.role ?? 'cashier',
      },
      // Backwards compatibility
      businessId: result.business_id,
      role: result.role,
    };
  } catch (error) {
    console.error('[acceptInvite] Error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================
// STAFF ACTIVITY (for scanner page)
// ============================================

export async function getStaffTodayStats(staffId: string): Promise<{
  scansToday: number;
  pointsAwardedToday: number;
}> {
  const supabase = createClient();
  const defaultStats = { scansToday: 0, pointsAwardedToday: 0 };

  try {
    const { data, error } = await supabase.rpc('get_staff_today_stats', {
      p_staff_id: staffId,
    });

    if (error || !data) {
      return defaultStats;
    }

    const stats = data as StaffTodayStatsRPC;

    return {
      scansToday: stats.scans_today ?? 0,
      pointsAwardedToday: stats.points_awarded_today ?? 0,
    };
  } catch (error) {
    return defaultStats;
  }
}

export async function recordScan(
  staffId: string,
  customerId: string,
  points: number,
  amount?: number
): Promise<{ success: boolean; error?: string; scanId?: string }> {
  const supabase = createClient();

  try {
    if (points <= 0) {
      return { success: false, error: 'Points must be greater than 0' };
    }

    const { data, error } = await supabase.rpc('record_customer_scan', {
      p_staff_id: staffId,
      p_customer_id: customerId,
      p_points: points,
      p_amount: amount ?? undefined,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const result = data as {
      success: boolean;
      error?: string;
      scan_id?: string;
    };

    if (!result?.success) {
      return {
        success: false,
        error: result?.error ?? 'Failed to record scan',
      };
    }

    return { success: true, scanId: result.scan_id };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}
