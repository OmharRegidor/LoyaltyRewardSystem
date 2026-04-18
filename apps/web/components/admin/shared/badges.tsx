import { Badge } from '@/components/ui/badge';

export function PlanBadge({ plan }: { plan: string | null | undefined }) {
  if (!plan) {
    return (
      <Badge className="bg-gray-100 text-gray-500 border-gray-200">Free</Badge>
    );
  }
  const isEnterprise = plan.toLowerCase().includes('enterprise');
  return (
    <Badge
      className={
        isEnterprise
          ? 'bg-orange-50 text-orange-700 border-orange-200'
          : 'bg-gray-100 text-gray-500 border-gray-200'
      }
    >
      {plan}
    </Badge>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  expired: 'bg-gray-100 text-gray-500 border-gray-200',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}>
      {status}
    </Badge>
  );
}
