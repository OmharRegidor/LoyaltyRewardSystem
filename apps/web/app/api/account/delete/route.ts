import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    // Get the auth token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Use admin client for all operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify the user's token
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 1. Get all customer IDs for this user
    const { data: customers } = await adminClient
      .from('customers')
      .select('id')
      .eq('user_id', user.id);

    const customerIds = customers?.map((c: { id: string }) => c.id) || [];

    if (customerIds.length > 0) {
      // 2. Delete customer_businesses links
      await adminClient
        .from('customer_businesses')
        .delete()
        .in('customer_id', customerIds);

      // 3. Delete transactions
      await adminClient
        .from('transactions')
        .delete()
        .in('customer_id', customerIds);

      // 4. Delete customers
      await adminClient
        .from('customers')
        .delete()
        .eq('user_id', user.id);
    }

    // 5. Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
