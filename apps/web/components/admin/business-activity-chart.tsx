'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { ActivityDataPoint } from '@/lib/admin';

interface BusinessActivityChartProps {
  data: ActivityDataPoint[];
}

const chartConfig: ChartConfig = {
  transactions: {
    label: 'Transactions',
    color: '#a855f7',
  },
  new_customers: {
    label: 'New Customers',
    color: '#f97316',
  },
};

function formatDateLabel(day: string): string {
  const d = new Date(day + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function BusinessActivityChart({ data }: BusinessActivityChartProps) {
  const hasData = data.some(
    (d) => d.transactions > 0 || d.new_customers > 0,
  );

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
        No activity data in the last 30 days
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="day"
          tickFormatter={formatDateLabel}
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={formatDateLabel} />}
        />
        <ChartLegend content={<ChartLegendContent className="text-gray-900" />} />
        <Line
          type="monotone"
          dataKey="transactions"
          stroke="var(--color-transactions)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="new_customers"
          stroke="var(--color-new_customers)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
