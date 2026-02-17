import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';
import type { AuditLogEntry, AuditLogsResponse } from '@/lib/admin';

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const user = await getApiUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  const params = request.nextUrl.searchParams;

  const eventType = params.get('eventType') || '';
  const severity = params.get('severity') || '';
  const businessSearch = params.get('businessSearch')?.trim() || '';
  const dateFrom = params.get('dateFrom') || '';
  const dateTo = params.get('dateTo') || '';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));

  // If searching by business name, resolve matching business IDs first
  let businessIds: string[] | null = null;
  if (businessSearch) {
    const { data: matchedBusinesses } = await service
      .from('businesses')
      .select('id')
      .ilike('name', `%${businessSearch}%`);

    businessIds = (matchedBusinesses ?? []).map((b) => b.id);

    if (businessIds.length === 0) {
      // No businesses match — return empty results
      const response: AuditLogsResponse = {
        logs: [],
        totalCount: 0,
        page,
        pageSize: PAGE_SIZE,
        eventTypes: [],
      };
      return NextResponse.json(response);
    }
  }

  // Build audit logs query
  let query = service
    .from('audit_logs')
    .select('*, businesses(name)', { count: 'exact' });

  if (eventType) {
    query = query.eq('event_type', eventType);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  if (businessIds) {
    query = query.in('business_id', businessIds);
  }

  if (dateFrom) {
    query = query.gte('created_at', `${dateFrom}T00:00:00`);
  }

  if (dateTo) {
    query = query.lte('created_at', `${dateTo}T23:59:59`);
  }

  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  // Fetch distinct event types for filter dropdown
  const eventTypesQuery = service
    .from('audit_logs')
    .select('event_type');

  const [dataResult, eventTypesResult] = await Promise.all([
    query,
    eventTypesQuery,
  ]);

  if (dataResult.error) {
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 },
    );
  }

  // Extract unique event types
  const uniqueEventTypes = [
    ...new Set(
      (eventTypesResult.data ?? []).map((r) => r.event_type),
    ),
  ].sort();

  interface AuditLogRow {
    id: string;
    event_type: string;
    severity: string | null;
    business_id: string | null;
    user_id: string | null;
    details: Record<string, unknown> | null;
    created_at: string | null;
    businesses: { name: string } | null;
  }

  const logs: AuditLogEntry[] = ((dataResult.data ?? []) as unknown as AuditLogRow[]).map(
    (row) => ({
      id: row.id,
      eventType: row.event_type,
      severity: row.severity ?? 'info',
      businessId: row.business_id,
      businessName: row.businesses?.name ?? null,
      userId: row.user_id,
      details: row.details,
      createdAt: row.created_at ?? '',
    }),
  );

  const response: AuditLogsResponse = {
    logs,
    totalCount: dataResult.count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    eventTypes: uniqueEventTypes,
  };

  return NextResponse.json(response);
}
