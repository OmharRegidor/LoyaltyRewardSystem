import { NextRequest, NextResponse } from 'next/server';
import {
  createServiceClient,
  createServerSupabaseClient,
} from '@/lib/supabase-server';
import { generateCardToken } from '@/lib/qr-code';
import { z } from 'zod';

const CardTokenSchema = z.object({
  customerId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const serverSupabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse input
    const body = await request.json();
    const validation = CardTokenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 },
      );
    }

    const { customerId } = validation.data;
    const serviceClient = createServiceClient();

    // Check if customer already has a card token
    const { data: customer } = await serviceClient
      .from('customers')
      .select('id, card_token')
      .eq('id', customerId)
      .single();

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }

    if (customer.card_token) {
      return NextResponse.json({ cardToken: customer.card_token });
    }

    // Generate and save card token
    const cardToken = generateCardToken(customerId);

    await serviceClient
      .from('customers')
      .update({
        card_token: cardToken,
        card_token_created_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    return NextResponse.json({ cardToken });
  } catch (error) {
    console.error('Card token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
