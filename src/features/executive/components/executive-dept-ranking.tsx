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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent } from '@/lib/format';
import { departmentHead } from '@/features/submit/api/types';
import { chartThemeClass } from './chart-theme';

export interface DeptRankingEntry {
  department: string;
  achievementPct: number;
}

interface ExecutiveDeptRankingProps {
  data: DeptRankingEntry[];
}

const getBarColor = (pct: number) => {
  if (pct >= 100) return '#22c55e'; // green-500
  if (pct >= 75) return '#3b82f6'; // blue-500
  if (pct >= 50) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
};

// Truncate long department names cleanly
const truncateName = (name: string, maxLen = 22) => {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen) + '…';
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div className='rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl'>
      <p className='font-semibold text-popover-foreground'>{entry.department}</p>
      {departmentHead(entry.department) && (
        <p className='text-[10px] text-muted-foreground'>{departmentHead(entry.department)}</p>
      )}
      <p className='mt-1 text-muted-foreground'>
        Achievement:{' '}
        <span className='font-mono font-semibold text-popover-foreground'>
          {formatPercent(entry.achievementPct)}
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
  const sortedData = [...data].sort((a, b) => b.achievementPct - a.achievementPct);

  // Dynamic chart height: at least 300px, 44px per dept (taller bars / roomier rows)
  const chartHeight = Math.max(300, sortedData.length * 44);

  // X-axis domain: cap at max+15% to give label space, minimum 120%
  const maxPct = Math.max(...sortedData.map((d) => d.achievementPct));
  const xMax = Math.max(maxPct * 1.15, 120);

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-semibold tracking-tight'>
          Department Performance (% Achievement)
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0'>
        <div style={{ height: chartHeight }} className={`w-full ${chartThemeClass}`}>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={sortedData}
              layout='vertical'
              margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray='3 3' horizontal={false} />
              <XAxis
                type='number'
                domain={[0, xMax]}
                tickFormatter={(v) => formatPercent(v)}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickCount={6}
              />
              <YAxis
                type='category'
                dataKey='department'
                width={140}
                tickFormatter={(name) => truncateName(name)}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11.5 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#94a3b8', opacity: 0.15 }} />
              <Bar
                dataKey='achievementPct'
                radius={[0, 4, 4, 0]}
                barSize={22}
                animationDuration={700}
                animationEasing='ease-out'
                isAnimationActive={true}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.achievementPct)} />
                ))}
                <LabelList
                  dataKey='achievementPct'
                  position='right'
                  formatter={(v: number) => formatPercent(v)}
                  style={{
                    fill: 'var(--foreground)',
                    fontSize: 11,
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
