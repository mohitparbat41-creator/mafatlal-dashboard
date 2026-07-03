'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  IconTrophy,
  IconAlertTriangle,
  IconArrowUp,
  IconArrowDown,
  IconArrowRight
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { formatPercent, formatINRValue } from '@/lib/format';
import { chartThemeClass } from './chart-theme';
import { departmentHead } from '@/features/submit/api/types';

// ─── Types ───────────────────────────────────────────────────────────────

export interface OutstandingWeekEntry {
  week_number: number;
  date_range: string;
  outstanding: number;
}

export interface MomentumEntry {
  department: string;
  currentWeekSales: number;
  previousWeekSales: number;
}

export interface CollectionEfficiencyWeek {
  week: number;
  efficiencyPct: number;
}

export interface PerformerInfo {
  department: string;
  achievementPct: number;
}

interface ExecutiveDiagnosticWidgetsProps {
  outstandingByWeek: OutstandingWeekEntry[];
  momentumData: MomentumEntry[];
  collectionEfficiencyData: CollectionEfficiencyWeek[];
  topPerformer: PerformerInfo | null;
  lowPerformer: PerformerInfo | null;
}

// ─── Utilities ───────────────────────────────────────────────────────────

// Full-rupee outstanding → compact ₹/L/Cr value.
const formatCrShort = (value: number) => formatINRValue(value);

// ─── Overall Outstanding by Week ─────────────────────────────────────────

function OutstandingByWeekChart({ data }: { data: OutstandingWeekEntry[] }) {
  if (!data.length) return null;

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md h-full'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-semibold tracking-tight'>
          Overall Outstanding by Week
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className={`h-[210px] w-full ${chartThemeClass}`}>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis
                dataKey='week_number'
                tickFormatter={(v) => `W${v}`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickFormatter={(v) => formatCrShort(v)}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                width={54}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className='rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl'>
                      <p className='font-semibold text-popover-foreground'>
                        {d.date_range || `Week ${d.week_number}`}
                      </p>
                      <p className='mt-1 text-muted-foreground'>
                        Outstanding:{' '}
                        <span className='font-mono font-semibold text-popover-foreground'>
                          {formatCrShort(d.outstanding)}
                        </span>
                      </p>
                    </div>
                  );
                }}
                cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
              />
              <Line
                type='monotone'
                dataKey='outstanding'
                stroke='#f43f5e'
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5.5, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={700}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Weekly Momentum Tracker ─────────────────────────────────────────────

function WeeklyMomentum({ data }: { data: MomentumEntry[] }) {
  if (!data.length) return null;

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md h-full'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-semibold tracking-tight'>Weekly Momentum</CardTitle>
        <p className='text-[11px] text-muted-foreground -mt-1'>vs Last Week</p>
      </CardHeader>
      <CardContent className='pt-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='text-xs py-2'>Department</TableHead>
              <TableHead className='text-center text-xs py-2 w-14'>▲▼</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => {
              const diff = entry.currentWeekSales - entry.previousWeekSales;
              let icon: React.ReactNode;
              let colorClass: string;

              if (diff > 0) {
                icon = <IconArrowUp className='h-4 w-4' />;
                colorClass = 'text-emerald-600 dark:text-emerald-400';
              } else if (diff < 0) {
                icon = <IconArrowDown className='h-4 w-4' />;
                colorClass = 'text-rose-600 dark:text-rose-400';
              } else {
                icon = <IconArrowRight className='h-4 w-4' />;
                colorClass = 'text-amber-600 dark:text-amber-400';
              }

              return (
                <TableRow key={entry.department} className='border-0'>
                  <TableCell className='py-1.5 text-xs font-medium max-w-[120px]'>
                    <span className='block truncate'>{entry.department}</span>
                    {departmentHead(entry.department) && (
                      <span className='block truncate text-[10px] font-normal text-muted-foreground'>
                        {departmentHead(entry.department)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className='py-1.5 text-center'>
                    <span className={cn('inline-flex items-center justify-center', colorClass)}>
                      {icon}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── Collection Efficiency Trend ─────────────────────────────────────────

function CollectionEfficiencyChart({ data }: { data: CollectionEfficiencyWeek[] }) {
  if (!data.length) return null;

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md h-full'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-semibold tracking-tight'>
          Collection Efficiency Trend (%)
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className={`h-[210px] w-full ${chartThemeClass}`}>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis
                dataKey='week'
                tickFormatter={(v) => `W${v}`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                domain={[
                  (min: number) => Math.max(0, Math.floor(min - 5)),
                  (max: number) => Math.ceil(max + 5)
                ]}
                tickFormatter={(v) => formatPercent(v)}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                width={44}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className='rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl'>
                      <p className='font-semibold text-popover-foreground'>Week {d.week}</p>
                      <p className='mt-1 text-muted-foreground'>
                        Efficiency:{' '}
                        <span className='font-mono font-semibold text-popover-foreground'>
                          {formatPercent(d.efficiencyPct)}
                        </span>
                      </p>
                    </div>
                  );
                }}
                cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
              />
              <Line
                type='monotone'
                dataKey='efficiencyPct'
                stroke='#8b5cf6'
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5.5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={700}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Top & Low Performer Cards ───────────────────────────────────────────

function PerformerCards({
  topPerformer,
  lowPerformer
}: {
  topPerformer: PerformerInfo | null;
  lowPerformer: PerformerInfo | null;
}) {
  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md h-full'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-semibold tracking-tight'>
          Best &amp; Needs Attention
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='grid grid-cols-2 gap-3'>
          {/* Top Performer */}
          <div className='flex flex-col items-center rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-center dark:border-emerald-800/40 dark:bg-emerald-950/20'>
            <div className='mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40'>
              <IconTrophy className='h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400' />
            </div>
            <p className='text-[10px] font-medium text-emerald-700 dark:text-emerald-400'>
              Top Performer
            </p>
            <p className='mt-1 text-xs font-bold text-foreground leading-tight'>
              {topPerformer?.department || '—'}
            </p>
            <p className='mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400'>
              {topPerformer ? formatPercent(topPerformer.achievementPct) : '—'}
            </p>
            <p className='text-[10px] text-muted-foreground'>Achievement</p>
          </div>

          {/* Low Performer */}
          <div className='flex flex-col items-center rounded-lg border border-rose-200 bg-rose-50/50 p-3 text-center dark:border-rose-800/40 dark:bg-rose-950/20'>
            <div className='mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40'>
              <IconAlertTriangle className='h-4.5 w-4.5 text-rose-600 dark:text-rose-400' />
            </div>
            <p className='text-[10px] font-medium text-rose-700 dark:text-rose-400'>
              Needs Attention
            </p>
            <p className='mt-1 text-xs font-bold text-foreground leading-tight'>
              {lowPerformer?.department || '—'}
            </p>
            <p className='mt-1 text-base font-bold text-rose-600 dark:text-rose-400'>
              {lowPerformer ? formatPercent(lowPerformer.achievementPct) : '—'}
            </p>
            <p className='text-[10px] text-muted-foreground'>Achievement</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Combined Export ──────────────────────────────────────────────────────

export function ExecutiveDiagnosticWidgets({
  outstandingByWeek,
  momentumData,
  collectionEfficiencyData,
  topPerformer,
  lowPerformer
}: ExecutiveDiagnosticWidgetsProps) {
  return (
    <div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-12'>
      <div className='lg:col-span-3'>
        <OutstandingByWeekChart data={outstandingByWeek} />
      </div>
      <div className='lg:col-span-2'>
        <WeeklyMomentum data={momentumData} />
      </div>
      <div className='lg:col-span-4'>
        <CollectionEfficiencyChart data={collectionEfficiencyData} />
      </div>
      <div className='lg:col-span-3'>
        <PerformerCards topPerformer={topPerformer} lowPerformer={lowPerformer} />
      </div>
    </div>
  );
}
