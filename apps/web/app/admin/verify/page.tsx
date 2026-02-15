// apps/web/app/admin/verify/page.tsx

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  isAdminEmail,
  verifyAdminPin,
  setAdminVerifiedCookie,
} from '@/lib/admin';
import { Shield } from 'lucide-react';

interface VerifyPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminVerifyPage({
  searchParams,
}: VerifyPageProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    redirect('/');
  }

  const email = user.email;
  const { error } = await searchParams;

  async function handleVerify(formData: FormData) {
    'use server';

    const pin = formData.get('pin') as string;
    if (!pin || !verifyAdminPin(pin)) {
      redirect('/admin/verify?error=invalid');
    }

    await setAdminVerifiedCookie(email);
    redirect('/admin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-8 space-y-6 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
            <Shield className="w-7 h-7 text-orange-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Admin Verification</h1>
          <p className="text-sm text-gray-500 text-center">
            Enter your admin PIN to continue
          </p>
          <p className="text-xs text-gray-400 font-mono">{email}</p>
        </div>

        {error === 'invalid' && (
          <p className="text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-xl py-2">
            Invalid PIN. Please try again.
          </p>
        )}

        <form action={handleVerify} className="space-y-4">
          <input
            type="password"
            name="pin"
            placeholder="Enter PIN"
            required
            autoFocus
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
}
