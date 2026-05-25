'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export interface DeptRankingEntry {
  department: string;
  achievementPct: number;
}

interface ExecutiveDeptRankingProps {
  data: DeptRankingEntry[];
}

const getBarColor = (pct: number) => {
  if (pct >= 100) return '#22c55e'; // green-500
  if (pct >= 75) return '#3b82f6';  // blue-500
  if (pct >= 50) return '#f59e0b';  // amber-500
  return '#ef4444';                  // red-500
};

// Truncate long department names cleanly
const truncateName = (name: string, maxLen = 16) => {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen) + '…';
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div className='rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl'>
      <p className='font-semibold text-popover-foreground'>{entry.department}</p>
      <p className='mt-1 text-muted-foreground'>
        Achievement:{' '}
        <span className='font-mono font-semibold text-popover-foreground'>
          {entry.achievementPct.toFixed(1)}%
        </span>
      </p>
    </div>
  );
}

export function ExecutiveDeptRanking({ data }: ExecutiveDeptRankingProps) {
  if (!data || data.length === 0) {
    return (
      <Card className='shadow-sm'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-semibold tracking-tight'>
            Department Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex h-[300px] items-center justify-center'>
            <p className='text-sm text-muted-foreground'>No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort descending by achievement %
  const sortedData = [...data].sort(
    (a, b) => b.achievementPct - a.achievementPct
  );

  // Dynamic chart height: at least 280px, 38px per dept
  const chartHeight = Math.max(280, sortedData.length * 38);

  // X-axis domain: cap at max+15 to give label space, minimum 125%
  const maxPct = Math.max(...sortedData.map((d) => d.achievementPct));
  const xMax = Math.max(maxPct * 1.2, 125);

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-semibold tracking-tight'>
          Department Performance (% Achievement)
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0 pr-2'>
        <div style={{ height: chartHeight }} className='w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={sortedData}
              layout='vertical'
              margin={{ top: 4, right: 52, left: 4, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                horizontal={false}
                stroke='hsl(var(--border))'
              />
              <XAxis
                type='number'
                domain={[0, xMax]}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickCount={5}
              />
              <YAxis
                type='category'
                dataKey='department'
                width={120}
                tickFormatter={(name) => truncateName(name)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10.5 }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
              />
              <Bar
                dataKey='achievementPct'
                radius={[0, 4, 4, 0]}
                barSize={18}
                animationDuration={700}
                animationEasing='ease-out'
                isAnimationActive={true}
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.achievementPct)}
                  />
                ))}
                <LabelList
                  dataKey='achievementPct'
                  position='right'
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                  style={{
                    fill: 'hsl(var(--foreground))',
                    fontSize: 10,
                    fontWeight: 700
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
