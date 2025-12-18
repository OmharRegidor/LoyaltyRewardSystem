import { createClient } from './supabase';

// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * Staff roles in the system
 * - owner: Full access, can manage everything
 * - manager: Can scan and view reports
 * - cashier: Can only scan QR codes
 */
export type StaffRole = 'owner' | 'manager' | 'cashier';

/**
 * Invite status lifecycle
 */
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

/**
 * Staff member record from database
 */
export interface StaffMember {
  id: string;
  user_id: string;
  business_id: string;
  role: StaffRole;
  name: string;
  email: string;
  is_active: boolean | null;
  last_login_at?: string | null;
  last_scan_at: string | null;
  scans_today: number | null;
  points_awarded_today: number | null;
  created_at: string | null;
}

/**
 * Staff invitation record
 */
export interface StaffInvite {
  id: string;
  business_id: string;
  email: string;
  name: string;
  role: Exclude<StaffRole, 'owner'>; // Owners can't be invited
  token: string;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
}

/**
 * Current user's role information
 */
export interface StaffRoleInfo {
  role: StaffRole | null;
  staffId: string | null;
  businessId: string | null;
  businessName: string | null;
}

/**
 * Scan log entry
 */
export interface ScanLogEntry {
  id: string;
  points_awarded: number;
  transaction_amount: number | null;
  scanned_at: string;
  customer_name: string | null;
}

/**
 * Today's staff statistics
 */
export interface StaffTodayStats {
  scansToday: number;
  pointsAwardedToday: number;
}

// ============================================
// RPC RESPONSE TYPES (Internal)
// ============================================

interface AcceptInviteRpcResult {
  success: boolean;
  error?: string;
  business_id?: string;
  staff_id?: string;
  role?: Exclude<StaffRole, 'owner'>;
}

interface StaffTodayStatsRpcResult {
  scans_today: number | null;
  points_awarded_today: number | null;
}

interface RecordScanRpcResult {
  success: boolean;
  error?: string;
  scan_id?: string;
}

// ============================================
// TYPE GUARDS
// ============================================

function isAcceptInviteRpcResult(data: unknown): data is AcceptInviteRpcResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    typeof (data as AcceptInviteRpcResult).success === 'boolean'
  );
}

function isStaffTodayStatsRpcResult(
  data: unknown
): data is StaffTodayStatsRpcResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('scans_today' in data || 'points_awarded_today' in data)
  );
}

function isRecordScanRpcResult(data: unknown): data is RecordScanRpcResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    typeof (data as RecordScanRpcResult).success === 'boolean'
  );
}

// ============================================
// RESULT TYPES (for consistent returns)
// ============================================

export type Result<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// Helper to create success/error results
const success = <T>(data: T): Result<T> => ({ success: true, data });
const failure = (error: string): Result<never> => ({ success: false, error });

// ============================================
// ROLE & ACCESS FUNCTIONS
// ============================================

/**
 * Get current authenticated user's role and business information
 *
 * @returns StaffRoleInfo with role, staffId, businessId, and businessName
 *
 * @example
 * ```ts
 * const { role, businessId } = await getCurrentStaffRole();
 * if (role === 'cashier') {
 *   redirect('/staff');
 * }
 * ```
 */
export async function getCurrentStaffRole(): Promise<StaffRoleInfo> {
  const supabase = createClient();
  const nullResult: StaffRoleInfo = {
    role: null,
    staffId: null,
    businessId: null,
    businessName: null,
  };

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return nullResult;
    }

    // Check if user is a business owner first (most common case)
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
      };
    }

    // Check if user is staff (manager/cashier)
    const { data: staff } = await supabase
      .from('staff')
      .select('id, role, business_id, businesses(name)')
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
      };
    }

    return nullResult;
  } catch (error) {
    console.error('[getCurrentStaffRole] Unexpected error:', error);
    return nullResult;
  }
}

/**
 * Check if a role has permission for an action
 */
export function hasPermission(
  role: StaffRole | null,
  action: 'scan' | 'view_reports' | 'manage_team' | 'manage_rewards'
): boolean {
  if (!role) return false;

  const permissions: Record<StaffRole, string[]> = {
    owner: ['scan', 'view_reports', 'manage_team', 'manage_rewards'],
    manager: ['scan', 'view_reports'],
    cashier: ['scan'],
  };

  return permissions[role]?.includes(action) ?? false;
}

// ============================================
// TEAM MANAGEMENT FUNCTIONS
// ============================================

/**
 * Get all team members for a business
 *
 * @param businessId - The business UUID
 * @returns Array of StaffMember objects, sorted by role then creation date
 */
export async function getTeamMembers(
  businessId: string
): Promise<StaffMember[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('business_id', businessId)
      .order('role', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getTeamMembers] Database error:', error);
      return [];
    }

    return (data ?? []) as StaffMember[];
  } catch (error) {
    console.error('[getTeamMembers] Unexpected error:', error);
    return [];
  }
}

/**
 * Get pending invites for a business
 *
 * @param businessId - The business UUID
 * @returns Array of pending StaffInvite objects
 */
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
      console.error('[getPendingInvites] Database error:', error);
      return [];
    }

    return (data ?? []) as StaffInvite[];
  } catch (error) {
    console.error('[getPendingInvites] Unexpected error:', error);
    return [];
  }
}

/**
 * Send a staff invitation
 *
 * @param businessId - The business UUID
 * @param inviteData - Name, email, and role for the invite
 * @returns Result with the created invite or error message
 */
export async function sendStaffInvite(
  businessId: string,
  inviteData: {
    name: string;
    email: string;
    role: 'manager' | 'cashier';
  }
): Promise<Result<StaffInvite>> {
  const supabase = createClient();

  try {
    // Validate authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return failure('Not authenticated');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = inviteData.email.toLowerCase().trim();

    if (!emailRegex.test(normalizedEmail)) {
      return failure('Invalid email format');
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
      return failure('An invite has already been sent to this email');
    }

    // Check if already a team member
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingStaff) {
      return failure('This person is already a team member');
    }

    // Create the invite
    const { data: invite, error } = await supabase
      .from('staff_invites')
      .insert({
        business_id: businessId,
        email: normalizedEmail,
        name: inviteData.name.trim(),
        role: inviteData.role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[sendStaffInvite] Insert error:', error);
      return failure('Failed to create invite');
    }

    // Log invite link for development
    if (typeof window !== 'undefined') {
      console.info(
        '[sendStaffInvite] Invite link:',
        `${window.location.origin}/invite/${invite.token}`
      );
    }

    return success(invite as StaffInvite);
  } catch (error) {
    console.error('[sendStaffInvite] Unexpected error:', error);
    return failure('An unexpected error occurred');
  }
}

/**
 * Cancel a pending invite
 */
export async function cancelInvite(inviteId: string): Promise<Result<void>> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('staff_invites')
      .update({ status: 'cancelled' })
      .eq('id', inviteId);

    if (error) {
      console.error('[cancelInvite] Database error:', error);
      return failure('Failed to cancel invite');
    }

    return success(undefined);
  } catch (error) {
    console.error('[cancelInvite] Unexpected error:', error);
    return failure('An unexpected error occurred');
  }
}

/**
 * Deactivate a staff member (they can no longer access the system)
 */
export async function deactivateStaff(staffId: string): Promise<Result<void>> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: false })
      .eq('id', staffId);

    if (error) {
      console.error('[deactivateStaff] Database error:', error);
      return failure('Failed to deactivate staff member');
    }

    return success(undefined);
  } catch (error) {
    console.error('[deactivateStaff] Unexpected error:', error);
    return failure('An unexpected error occurred');
  }
}

/**
 * Reactivate a deactivated staff member
 */
export async function reactivateStaff(staffId: string): Promise<Result<void>> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: true })
      .eq('id', staffId);

    if (error) {
      console.error('[reactivateStaff] Database error:', error);
      return failure('Failed to reactivate staff member');
    }

    return success(undefined);
  } catch (error) {
    console.error('[reactivateStaff] Unexpected error:', error);
    return failure('An unexpected error occurred');
  }
}

// ============================================
// INVITE ACCEPTANCE FUNCTIONS
// ============================================

/**
 * Get invite details by token (for the accept invite page)
 */
export async function getInviteByToken(token: string): Promise<
  Result<{
    invite: StaffInvite;
    businessName: string;
  }>
> {
  const supabase = createClient();

  try {
    const { data: invite, error } = await supabase
      .from('staff_invites')
      .select('*, businesses(name)')
      .eq('token', token)
      .single();

    if (error || !invite) {
      return failure('Invite not found');
    }

    if (invite.status !== 'pending') {
      return failure('This invite has already been used');
    }

    if (new Date(invite.expires_at) < new Date()) {
      return failure('This invite has expired');
    }

    const businessData = invite.businesses as { name: string } | null;

    return success({
      invite: invite as StaffInvite,
      businessName: businessData?.name ?? 'Unknown Business',
    });
  } catch (error) {
    console.error('[getInviteByToken] Unexpected error:', error);
    return failure('Failed to fetch invite');
  }
}

/**
 * Accept an invite and create staff record
 */
export async function acceptInvite(token: string): Promise<
  Result<{
    businessId: string;
    role: StaffRole;
  }>
> {
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return failure('Not authenticated');
    }

    // Use the database function to accept invite atomically
    const { data, error } = await supabase.rpc('accept_staff_invite', {
      p_token: token,
      p_user_id: user.id,
    });

    if (error) {
      console.error('[acceptInvite] RPC error:', error);
      return failure(error.message);
    }

    if (!isAcceptInviteRpcResult(data)) {
      return failure('Invalid response from server');
    }

    if (!data.success) {
      return failure(data.error ?? 'Failed to accept invite');
    }

    return success({
      businessId: data.business_id!,
      role: data.role as StaffRole,
    });
  } catch (error) {
    console.error('[acceptInvite] Unexpected error:', error);
    return failure('An unexpected error occurred');
  }
}

// ============================================
// SCANNING & ACTIVITY FUNCTIONS
// ============================================

/**
 * Get today's statistics for a staff member
 */
export async function getStaffTodayStats(
  staffId: string
): Promise<StaffTodayStats> {
  const supabase = createClient();
  const defaultStats: StaffTodayStats = { scansToday: 0, pointsAwardedToday: 0 };

  try {
    const { data, error } = await supabase.rpc('get_staff_today_stats', {
      p_staff_id: staffId,
    });

    if (error) {
      console.error('[getStaffTodayStats] RPC error:', error);
      return defaultStats;
    }

    if (!isStaffTodayStatsRpcResult(data)) {
      return defaultStats;
    }

    return {
      scansToday: data.scans_today ?? 0,
      pointsAwardedToday: data.points_awarded_today ?? 0,
    };
  } catch (error) {
    console.error('[getStaffTodayStats] Unexpected error:', error);
    return defaultStats;
  }
}

/**
 * Record a customer QR scan and award points
 */
export async function recordScan(
  staffId: string,
  customerId: string,
  points: number,
  transactionAmount?: number
): Promise<Result<{ scanId: string }>> {
  const supabase = createClient();

  try {
    // Validate inputs
    if (points <= 0) {
      return failure('Points must be greater than 0');
    }

    const { data, error } = await supabase.rpc('record_customer_scan', {
      p_staff_id: staffId,
      p_customer_id: customerId,
      p_points: points,
      p_amount: transactionAmount ?? undefined,
    });

    if (error) {
      console.error('[recordScan] RPC error:', error);
      return failure(error.message);
    }

    if (!isRecordScanRpcResult(data)) {
      return failure('Invalid response from server');
    }

    if (!data.success) {
      return failure(data.error ?? 'Failed to record scan');
    }

    return success({ scanId: data.scan_id! });
  } catch (error) {
    console.error('[recordScan] Unexpected error:', error);
    return failure('An unexpected error occurred');
  }
}

/**
 * Get scan history for a staff member
 */
export async function getStaffScanHistory(
  staffId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
): Promise<ScanLogEntry[]> {
  const supabase = createClient();
  const { startDate, endDate, limit = 50 } = options;

  try {
    let query = supabase
      .from('scan_logs')
      .select('id, points_awarded, transaction_amount, scanned_at, customers(name)')
      .eq('staff_id', staffId)
      .order('scanned_at', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('scanned_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('scanned_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('[getStaffScanHistory] Database error:', error);
      return [];
    }

    return (data ?? []).map((log: any) => ({
      id: log.id,
      points_awarded: log.points_awarded,
      transaction_amount: log.transaction_amount,
      scanned_at: log.scanned_at ?? new Date().toISOString(),
      customer_name: log.customers?.name ?? null,
    }));
  } catch (error) {
    console.error('[getStaffScanHistory] Unexpected error:', error);
    return [];
  }
}