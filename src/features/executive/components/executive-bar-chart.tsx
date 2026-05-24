'use client';

import { ProcessedExecutiveRow } from '../api/types';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList
} from 'recharts';

interface ExecutiveBarChartProps {
  data: ProcessedExecutiveRow[];
}

export function ExecutiveBarChart({ data }: ExecutiveBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-lg border bg-card shadow-sm">
        <p className="text-sm text-muted-foreground">No data available for this period</p>
      </div>
    );
  }

  // Formatting for currency on tooltips and axes
  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value}`;
  };

  return (
    <div className="h-[350px] w-full rounded-lg border bg-card p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="week_number" 
            tickFormatter={(value) => `W${value}`}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            yAxisId="left"
            tickFormatter={formatCurrency}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--popover-foreground))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value: number) => [new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)]}
            labelFormatter={(label) => `Week ${label}`}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar 
            yAxisId="left"
            dataKey="total_sales_achieved" 
            name="Sales Achieved" 
            fill="#64748b" 
            radius={[4, 4, 0, 0]}
          >
            <LabelList dataKey="total_sales_achieved" position="top" fill="#000000" fontSize={12} fontWeight={600} />
          </Bar>
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="weekly_target_amount" 
            name="Weekly Target" 
            stroke="#f97316" /* orange-500 for high contrast */
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
