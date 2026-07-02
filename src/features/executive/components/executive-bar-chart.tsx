'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  Brush,
  Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { chartThemeClass } from './chart-theme';
import { formatTargetCrores } from '@/lib/format';

interface ChartDataPoint {
  week_number: number;
  date_range: string;
  weekly_target_amount: number;
  total_sales_achieved: number;
}

interface ExecutiveBarChartProps {
  data: ChartDataPoint[];
}

// Chart data is in Crores (target's native unit; sales converted upstream).
const formatYAxis = (value: number) =>
  value >= 10 ? `${Math.round(value)}` : `${parseFloat(value.toFixed(1))}`;

const formatLabel = (value: number) => {
  if (value === 0) return '';
  return `${parseFloat(value.toFixed(2))}`;
};

// Custom tooltip for rich hover experience
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const dataPoint = payload[0]?.payload;
  return (
    <div className='rounded-lg border bg-popover px-3.5 py-2.5 text-xs shadow-xl'>
      <p className='mb-1.5 font-semibold text-popover-foreground'>
        {dataPoint?.date_range || `Week ${dataPoint?.week_number}`}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className='flex items-center gap-2 py-0.5'>
          <span
            className='inline-block h-2 w-2 rounded-full'
            style={{ backgroundColor: entry.color }}
          />
          <span className='text-muted-foreground'>
            {entry.dataKey === 'total_sales_achieved' ? 'Sales' : 'Target'}:
          </span>
          <span className='font-mono font-semibold text-popover-foreground'>
            {formatTargetCrores(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ExecutiveBarChart({ data }: ExecutiveBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className='shadow-sm'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-semibold tracking-tight'>
            Sales vs Target Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex h-[420px] items-center justify-center'>
            <p className='text-sm text-muted-foreground'>No data available for this period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show brush only if we have more than 6 data points
  const showBrush = data.length > 6;
  const brushEndIndex = Math.min(data.length - 1, 11); // Show max 12 weeks initially

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-1'>
        <CardTitle className='text-sm font-semibold tracking-tight'>
          Sales vs Target Trend
        </CardTitle>
        <CardDescription className='flex items-center gap-4 text-xs'>
          <span className='flex items-center gap-1.5'>
            <span className='inline-block h-2.5 w-2.5 rounded-full bg-blue-500' />
            Sales Achieved (Cr)
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='inline-block h-0.5 w-5 border-t-2 border-dashed border-slate-400 dark:border-slate-500' />
            Target (Cr)
          </span>
          {showBrush && (
            <span className='ml-auto text-[10px] text-muted-foreground/70 italic'>
              Drag to zoom
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className={`h-[420px] w-full ${chartThemeClass}`}>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart
              data={data}
              margin={{ top: 24, right: 20, left: 4, bottom: showBrush ? 60 : 80 }}
            >
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis
                dataKey='date_range'
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                angle={-40}
                textAnchor='end'
                interval={0}
                height={72}
              />
              <YAxis
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Sales line — solid, blue */}
              <Line
                type='monotone'
                dataKey='total_sales_achieved'
                stroke='#3b82f6'
                strokeWidth={2.5}
                dot={{
                  r: 3.5,
                  fill: '#3b82f6',
                  strokeWidth: 2,
                  stroke: '#fff'
                }}
                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={700}
                animationEasing='ease-out'
              >
                <LabelList
                  dataKey='total_sales_achieved'
                  position='top'
                  formatter={formatLabel}
                  style={{
                    fill: 'var(--foreground)',
                    fontSize: 9,
                    fontWeight: 600
                  }}
                  offset={8}
                />
              </Line>

              {/* Target line — dashed, gray */}
              <Line
                type='monotone'
                dataKey='weekly_target_amount'
                stroke='#94a3b8'
                strokeWidth={2}
                strokeDasharray='6 4'
                dot={false}
                activeDot={{ r: 5, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={700}
                animationEasing='ease-out'
              />

              {/* Brush / Zoom — only when there are many data points */}
              {showBrush && (
                <Brush
                  dataKey='date_range'
                  height={20}
                  stroke='#94a3b8'
                  fill='transparent'
                  travellerWidth={4}
                  startIndex={0}
                  endIndex={brushEndIndex}
                  tickFormatter={() => ''}
                >
                  <LineChart>
                    <Line
                      dataKey='total_sales_achieved'
                      stroke='#3b82f6'
                      strokeWidth={1}
                      dot={false}
                    />
                  </LineChart>
                </Brush>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
