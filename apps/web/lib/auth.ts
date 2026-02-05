// apps/web/lib/auth.ts

import { createClient } from './supabase';
import type { Database } from '../../../packages/shared/types/database';

// ============================================
// TYPES
// ============================================

type StaffRole = 'owner' | 'manager' | 'cashier';
type Business = Database['public']['Tables']['businesses']['Row'];

// Helper to generate URL-safe slug from business name
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const random = Math.random().toString(36).substring(2, 8);
  return `${base}-${random}`;
}

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
// HELPER FUNCTIONS FOR STAFF TABLE
// ============================================

async function insertStaffRecord(
  supabase: ReturnType<typeof createClient>,
  record: {
    user_id: string;
    business_id: string;
    role: StaffRole;
    name: string;
    email: string;
  },
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
  businessId: string,
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
  staffId: string,
): Promise<void> {
  await supabase.rpc('update_staff_last_login', { p_staff_id: staffId });
}

// ============================================
// SIGNUP - Requires Email Verification
// ============================================

export async function signupBusinessOwner(
  data: SignupData,
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Validate phone (basic)
    if (data.phone && data.phone.length < 10) {
      return { success: false, error: 'Invalid phone number' };
    }

    // Create auth user with metadata
    // Email confirmation is REQUIRED - user must verify before accessing dashboard
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
        // Redirect URL after email confirmation
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      console.error('Auth signup error:', authError);

      // Handle specific errors
      if (authError.message.includes('already registered')) {
        return {
          success: false,
          error: 'This email is already registered. Please login instead.',
        };
      }

      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'User creation failed' };
    }

    // IMPORTANT: When email confirmation is enabled, session will be NULL
    // User must click the confirmation link in their email first
    // Business and staff records will be created in /auth/callback after confirmation

    return {
      success: true,
      needsEmailConfirmation: true,
      data: {
        user: authData.user,
        redirectTo: '/verify-email',
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
// COMPLETE SIGNUP - Called after email verification
// ============================================

export async function completeSignupAfterVerification(): Promise<AuthResponse> {
  const supabase = createClient();

  try {
    // Get the verified user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Get user error:', userError);
      return { success: false, error: 'Session expired. Please login again.' };
    }

    if (!user) {
      return {
        success: false,
        error: 'No authenticated user found. Please login.',
      };
    }

    // Check if email is confirmed
    if (!user.email_confirmed_at) {
      return { success: false, error: 'Email not yet verified.' };
    }

    // Check if business already exists (prevent duplicates)
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (existingBusiness) {
      // Already set up - just redirect
      return {
        success: true,
        data: {
          user,
          business: existingBusiness as any,
          redirectTo: '/dashboard',
        },
      };
    }

    // Get business info from user metadata
    const metadata = user.user_metadata;
    const businessName =
      metadata?.business_name || metadata?.full_name || 'My Business';

    // Create business
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .insert({
        owner_id: user.id,
        name: businessName,
        slug: generateSlug(businessName),
        points_per_purchase: 10,
      })
      .select()
      .single();

    if (businessError) {
      console.error('Business creation error:', businessError);

      // If it's a unique constraint error, business already exists
      if (businessError.code === '23505') {
        const { data: existingBiz } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        return {
          success: true,
          data: {
            user,
            business: existingBiz || undefined,
            redirectTo: '/dashboard',
          },
        };
      }

      return {
        success: false,
        error: 'Failed to create business. Please try again.',
      };
    }

    // Create staff record for owner
    try {
      await insertStaffRecord(supabase, {
        user_id: user.id,
        business_id: businessData.id,
        role: 'owner',
        name: businessName,
        email: user.email!,
      });
    } catch (staffError) {
      console.error('Staff creation error (non-fatal):', staffError);
      // Continue anyway - staff record is not critical
    }

    // Note: Free subscription is auto-created by database trigger
    // See migration: 20260203000000_auto_free_subscription.sql

    return {
      success: true,
      data: {
        user,
        business: businessData,
        redirectTo: '/dashboard',
      },
    };
  } catch (error: any) {
    console.error('Complete signup error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}
// ============================================
// LOGIN - Simplified version
// ============================================

export async function loginBusinessOwner(
  data: LoginData,
): Promise<AuthResponse> {
  const supabase = createClient();

  try {
    if (!data.email || !data.password) {
      return { success: false, error: 'Email and password are required' };
    }

    // Authenticate
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
        return { success: false, error: 'Please verify your email first.' };
      }
      return { success: false, error: authError.message };
    }

    if (!authData.user || !authData.session) {
      return { success: false, error: 'Login failed' };
    }

    // Check for business (with timeout protection)
    const businessPromise = supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', authData.user.id)
      .maybeSingle();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), 5000),
    );

    let business = null;

    try {
      const result = (await Promise.race([
        businessPromise,
        timeoutPromise,
      ])) as any;
      business = result.data;
    } catch (e) {}

    // If no business, create one
    if (!business) {
      const metadata = authData.user.user_metadata || {};
      const businessName = metadata.business_name || 'My Business';

      try {
        const { data: newBiz } = await supabase
          .from('businesses')
          .insert({
            owner_id: authData.user.id,
            name: businessName,
            slug: generateSlug(businessName),
            points_per_purchase: 10,
          })
          .select()
          .single();

        business = newBiz;

        // Create staff record (fire and forget)
        // Note: Free subscription is auto-created by database trigger
        if (newBiz) {
          supabase
            .rpc('insert_staff_record', {
              p_user_id: authData.user.id,
              p_business_id: newBiz.id,
              p_role: 'owner',
              p_name: businessName,
              p_email: String(authData.user.email),
            })
            .then(() => {});
        }
      } catch (e) {}
    }

    return {
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
        business: business || undefined,
        redirectTo: '/dashboard',
      },
    };
  } catch (error: any) {
    console.error('Auth: Unexpected error', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}

// ============================================
// RESEND VERIFICATION EMAIL
// ============================================

export async function resendVerificationEmail(
  email: string,
): Promise<AuthResponse> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
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
  email: string,
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
  newPassword: string,
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
