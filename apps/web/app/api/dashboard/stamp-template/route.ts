// apps/web/app/api/dashboard/stamp-template/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase-server';

function createSupabaseClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const service = createServiceClient();
    const { data: template } = await service
      .from('stamp_card_templates')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .maybeSingle();

    return NextResponse.json({ template });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      totalStamps,
      rewardTitle,
      rewardDescription,
      rewardImageUrl,
      minPurchaseAmount,
      autoReset,
      milestones,
    } = body;

    if (!rewardTitle || !totalStamps) {
      return NextResponse.json(
        { error: 'rewardTitle and totalStamps are required' },
        { status: 400 }
      );
    }

    if (totalStamps < 1 || totalStamps > 50) {
      return NextResponse.json(
        { error: 'totalStamps must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Validate milestones
    interface MilestoneInput { position: number; label: string }
    const validatedMilestones: MilestoneInput[] = [];
    if (Array.isArray(milestones)) {
      const seen = new Set<number>();
      for (const m of milestones as MilestoneInput[]) {
        if (!m.position || !m.label || typeof m.position !== 'number' || typeof m.label !== 'string') continue;
        if (m.position < 1 || m.position >= totalStamps) continue;
        if (seen.has(m.position)) continue;
        seen.add(m.position);
        validatedMilestones.push({ position: m.position, label: m.label.slice(0, 20) });
      }
    }

    const service = createServiceClient();

    // Check if active template exists
    const { data: existing } = await service
      .from('stamp_card_templates')
      .select('id')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .maybeSingle();

    const templateData = {
      business_id: business.id,
      title: title || 'Loyalty Card',
      total_stamps: totalStamps,
      reward_title: rewardTitle,
      reward_description: rewardDescription || null,
      reward_image_url: rewardImageUrl || null,
      min_purchase_amount: minPurchaseAmount || 0,
      auto_reset: autoReset !== false,
      is_active: true,
      milestones: validatedMilestones,
    };

    let template;
    if (existing) {
      const { data, error } = await service
        .from('stamp_card_templates')
        .update(templateData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      template = data;
    } else {
      const { data, error } = await service
        .from('stamp_card_templates')
        .insert(templateData)
        .select()
        .single();
      if (error) throw error;
      template = data;
    }

    // Cascade total_stamps & reward_title to active (non-completed) stamp cards
    // Step 1: Auto-complete cards where stamps already meet/exceed new threshold
    const { error: completeErr } = await service
      .from('stamp_cards')
      .update({
        total_stamps: totalStamps,
        stamps_collected: totalStamps,
        reward_title: rewardTitle,
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('template_id', template.id)
      .eq('is_completed', false)
      .eq('is_redeemed', false)
      .gte('stamps_collected', totalStamps);

    if (completeErr) {
      console.error('Error auto-completing stamp cards:', completeErr);
    }

    // Step 2: Update remaining active cards (stamps_collected < new total)
    const { error: cascadeErr } = await service
      .from('stamp_cards')
      .update({
        total_stamps: totalStamps,
        reward_title: rewardTitle,
        milestones: validatedMilestones,
      })
      .eq('template_id', template.id)
      .eq('is_completed', false)
      .eq('is_redeemed', false);

    if (cascadeErr) {
      console.error('Error cascading stamp card changes:', cascadeErr);
    }

    // Step 3: Clear pauses for milestones that were removed
    const milestonePositions = validatedMilestones.map((m: MilestoneInput) => m.position);
    const { error: pauseErr } = await service.rpc('clear_invalid_milestone_pauses' as never, {
      p_template_id: template.id,
      p_valid_positions: milestonePositions,
    } as never);
    if (pauseErr) {
      console.error('Error clearing invalid milestone pauses:', pauseErr);
    }

    return NextResponse.json({ template });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
