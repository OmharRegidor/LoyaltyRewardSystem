// apps/web/lib/auth.ts

import { createClient } from './supabase';
import type { Database } from '../../../packages/shared/types/database';

// ============================================
// TYPES
// ============================================

type StaffRole = 'owner' | 'manager' | 'cashier';
type Business = Database['public']['Tables']['businesses']['Row'];

// Manual Staff type until you regenerate database types
interface StaffRecord {
  id: string;
  user_id: string;
  business_id: string;
  role: StaffRole;
  name: string;
  email: string;
  is_active: boolean;
  invited_by: string | null;
  created_at: string;
  last_login: string | null;
}

export interface StaffInfo {
  staff_id: string;
  business_id: string;
  business_name: string;
  role: StaffRole;
  is_active: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  businessName: string;
  businessType: string;
  phone: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
  data?: {
    user?: any;
    session?: any;
    business?: Business;
    staff?: StaffInfo;
    redirectTo?: string;
  };
}

// ============================================
// HELPER: Execute raw SQL for staff table
// ============================================

async function insertStaffRecord(
  supabase: ReturnType<typeof createClient>,
  record: {
    user_id: string;
    business_id: string;
    role: StaffRole;
    name: string;
    email: string;
  }
): Promise<{ data: StaffRecord | null; error: any }> {
  const { data, error } = await supabase.rpc('insert_staff_record', {
    p_user_id: record.user_id,
    p_business_id: record.business_id,
    p_role: record.role,
    p_name: record.name,
    p_email: record.email,
  });

  return { data: data as StaffRecord | null, error };
}

async function getStaffByUserId(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  businessId: string
): Promise<StaffRecord | null> {
  const { data, error } = await supabase.rpc('get_staff_by_user', {
    p_user_id: userId,
    p_business_id: businessId,
  });

  if (error || !data || data.length === 0) return null;
  return data[0] as StaffRecord;
}

async function updateStaffLastLogin(
  supabase: ReturnType<typeof createClient>,
  staffId: string
): Promise<void> {
  await supabase.rpc('update_staff_last_login', { p_staff_id: staffId });
}

// ============================================
// SIGNUP
// ============================================

export async function signupBusinessOwner(
  data: SignupData
): Promise<AuthResponse> {
  const supabase = createClient();

  try {
    // Validate input
    if (!data.email || !data.password || !data.businessName) {
      return { success: false, error: 'Missing required fields' };
    }

    if (data.password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters',
      };
    }

    // Step 1: Create auth user with full metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.businessName,
          display_name: data.businessName,
          phone: data.phone,
          role: 'business_owner',
          business_name: data.businessName,
          business_type: data.businessType,
        },
      },
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'User creation failed' };
    }

    // Check if email confirmation is required
    if (!authData.session) {
      return {
        success: true,
        needsEmailConfirmation: true,
        data: {
          user: authData.user,
          redirectTo: '/check-email',
        },
      };
    }

    // Step 2: Create business entry
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .insert({
        owner_id: authData.user.id,
        name: data.businessName,
        points_per_purchase: 10,
      })
      .select()
      .single();

    if (businessError) {
      console.error('Business creation error:', businessError);
      await supabase.auth.signOut();
      return {
        success: false,
        error: `Failed to create business: ${businessError.message}`,
      };
    }

    // Step 3: Create staff record using RPC
    const { error: staffError } = await insertStaffRecord(supabase, {
      user_id: authData.user.id,
      business_id: businessData.id,
      role: 'owner',
      name: data.businessName,
      email: data.email,
    });

    if (staffError) {
      console.error('Staff creation error (non-fatal):', staffError);
    }

    return {
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
        business: businessData,
        redirectTo: '/dashboard',
      },
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}

// ============================================
// LOGIN
// ============================================

export async function loginBusinessOwner(
  data: LoginData
): Promise<AuthResponse> {
  const supabase = createClient();

  try {
    if (!data.email || !data.password) {
      return { success: false, error: 'Email and password are required' };
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Invalid email or password' };
      }
      if (authError.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Please confirm your email before logging in',
        };
      }
      return { success: false, error: authError.message };
    }

    if (!authData.user || !authData.session) {
      return { success: false, error: 'Login failed' };
    }

    // Check for existing business
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', authData.user.id)
      .maybeSingle();

    if (bizError) {
      console.error('Business fetch error:', bizError);
    }

    if (!business) {
      // Try to create business from user metadata
      const metadata = authData.user.user_metadata;
      if (metadata?.business_name) {
        const { data: newBusiness, error: createBizError } = await supabase
          .from('businesses')
          .insert({
            owner_id: authData.user.id,
            name: metadata.business_name,
            points_per_purchase: 10,
          })
          .select()
          .single();

        if (createBizError) {
          console.error('Business creation on login error:', createBizError);
          await supabase.auth.signOut();
          return { success: false, error: 'Failed to complete account setup.' };
        }

        // Create staff record
        await insertStaffRecord(supabase, {
          user_id: authData.user.id,
          business_id: newBusiness.id,
          role: 'owner',
          name: metadata.business_name || metadata.full_name,
          email: authData.user.email!,
        });

        return {
          success: true,
          data: {
            user: authData.user,
            session: authData.session,
            business: newBusiness,
            redirectTo: '/dashboard',
          },
        };
      }

      await supabase.auth.signOut();
      return {
        success: false,
        error: 'No business account found. Please sign up first.',
      };
    }

    // Get staff info for role-based redirect
    let redirectTo = '/dashboard';

    const staffRecord = await getStaffByUserId(
      supabase,
      authData.user.id,
      business.id
    );

    if (staffRecord) {
      if (staffRecord.role === 'cashier') {
        redirectTo = '/scanner';
      }
      if (!staffRecord.is_active) {
        await supabase.auth.signOut();
        return { success: false, error: 'Your account has been deactivated.' };
      }

      // Update last login
      await updateStaffLastLogin(supabase, staffRecord.id);
    }

    return {
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
        business,
        redirectTo,
      },
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}

// ============================================
// LOGOUT
// ============================================

export async function logout(): Promise<AuthResponse> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// HELPERS
// ============================================

export async function getCurrentUser() {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error: error?.message || null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function getCurrentBusiness(): Promise<Business | null> {
  const supabase = createClient();

  try {
    const { user } = await getCurrentUser();
    if (!user) return null;

    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();

    return business || null;
  } catch (error) {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const { user } = await getCurrentUser();
  return !!user;
}

// ============================================
// PASSWORD RESET
// ============================================

export async function requestPasswordReset(
  email: string
): Promise<AuthResponse> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePassword(
  newPassword: string
): Promise<AuthResponse> {
  const supabase = createClient();

  try {
    if (newPassword.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters',
      };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
