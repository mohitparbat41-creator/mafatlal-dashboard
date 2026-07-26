'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  ReferenceArea,
  Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { chartThemeClass } from './chart-theme';
import { formatTargetCrores } from '@/lib/format';
// Week labels come from the SAME fiscal-week calendar the Sales Submission
// form uses — the chart never defines its own week ranges.
import { weekFullLabel } from '@/features/submit/api/weeks';

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

/** Smallest number of intervals kept visible so a zoom can't collapse the chart. */
const MIN_SPAN = 2;

// Custom tooltip for rich hover experience
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const dataPoint = payload[0]?.payload;
  return (
    <div className='rounded-lg border bg-popover px-3.5 py-2.5 text-xs shadow-xl'>
      <p className='mb-1.5 font-semibold text-popover-foreground'>
        {dataPoint?.week_number
          ? weekFullLabel(dataPoint.week_number)
          : (dataPoint?.date_range ?? '')}
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
  const rows = useMemo(() => data ?? [], [data]);
  const total = rows.length;

  // Visible window as [startIndex, endIndex]; null = full range.
  const [range, setRange] = useState<[number, number] | null>(null);
  // In-progress drag selection (x-axis labels).
  const [selA, setSelA] = useState<string | null>(null);
  const [selB, setSelB] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  const panRef = useRef<{ x: number; s: number; e: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Dataset changed (filters applied) → drop any stale zoom window.
  useEffect(() => {
    setRange(null);
  }, [total]);

  const clamp = useCallback(
    (s: number, e: number): [number, number] => {
      const last = Math.max(0, total - 1);
      let ns = Math.round(s);
      let ne = Math.round(e);
      if (ne - ns < MIN_SPAN) {
        const mid = (ns + ne) / 2;
        ns = Math.round(mid - MIN_SPAN / 2);
        ne = ns + MIN_SPAN;
      }
      if (ns < 0) {
        ne -= ns;
        ns = 0;
      }
      if (ne > last) {
        ns -= ne - last;
        ne = last;
      }
      return [Math.max(0, ns), Math.min(last, ne)];
    },
    [total]
  );

  const [start, end] = range ?? [0, Math.max(0, total - 1)];
  const view = useMemo(() => rows.slice(start, end + 1), [rows, start, end]);
  const zoomed = range !== null && (start > 0 || end < total - 1);

  // Mouse-wheel zoom (anchored at the cursor); Shift+wheel pans.
  // Registered natively so preventDefault works (React wheel handlers are passive).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || total === 0) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const rect = el.getBoundingClientRect();
      const frac = rect.width
        ? Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width))
        : 0.5;
      setRange((prev) => {
        const [s, e] = prev ?? [0, Math.max(0, total - 1)];
        const span = e - s;
        if (ev.shiftKey) {
          const step = Math.max(1, Math.round(span * 0.2)) * (ev.deltaY > 0 ? 1 : -1);
          return clamp(s + step, e + step);
        }
        const factor = ev.deltaY > 0 ? 1.25 : 0.8;
        const newSpan = Math.max(MIN_SPAN, span * factor);
        const anchor = s + span * frac;
        return clamp(anchor - newSpan * frac, anchor + newSpan * (1 - frac));
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [total, clamp]);

  // Commit a drag-selection into a zoom window.
  const commitSelection = () => {
    if (selA && selB && selA !== selB) {
      const i1 = rows.findIndex((d) => d.date_range === selA);
      const i2 = rows.findIndex((d) => d.date_range === selB);
      if (i1 >= 0 && i2 >= 0) setRange(clamp(Math.min(i1, i2), Math.max(i1, i2)));
    }
    setSelA(null);
    setSelB(null);
  };

  // Shift+drag = pan while zoomed.
  const onPanStart = (ev: React.MouseEvent) => {
    if (!ev.shiftKey || !zoomed) return;
    panRef.current = { x: ev.clientX, s: start, e: end };
    setPanning(true);
  };
  const onPanMove = (ev: React.MouseEvent) => {
    const p = panRef.current;
    const el = wrapRef.current;
    if (!p || !el) return;
    const rect = el.getBoundingClientRect();
    const span = p.e - p.s + 1;
    const delta = ((p.x - ev.clientX) / Math.max(1, rect.width)) * span;
    setRange(clamp(p.s + delta, p.e + delta));
  };
  const onPanEnd = () => {
    panRef.current = null;
    setPanning(false);
  };

  if (total === 0) {
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

  // Keep per-point labels/ticks only while they stay legible.
  const dense = view.length > 20;

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-1'>
        <div className='flex items-start justify-between gap-2'>
          <CardTitle className='text-sm font-semibold tracking-tight'>
            Sales vs Target Trend
          </CardTitle>
          {zoomed && (
            <Button
              variant='outline'
              size='sm'
              className='h-7 shrink-0 text-[11px]'
              onClick={() => setRange(null)}
            >
              Reset Zoom
            </Button>
          )}
        </div>
        <CardDescription className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
          <span className='flex items-center gap-1.5'>
            <span className='inline-block h-2.5 w-2.5 rounded-full bg-blue-500' />
            Sales Achieved (Cr)
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='inline-block h-0.5 w-5 border-t-2 border-dashed border-slate-400 dark:border-slate-500' />
            Target (Cr)
          </span>
          <span className='ml-auto text-[10px] text-muted-foreground/70 italic'>
            Drag to zoom · Scroll to zoom · Shift+drag to pan · Double-click to reset
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className='pt-0'>
        <div
          ref={wrapRef}
          className={`h-[420px] w-full select-none ${chartThemeClass}`}
          style={{ cursor: panning ? 'grabbing' : zoomed ? 'grab' : 'crosshair' }}
          onMouseDown={onPanStart}
          onMouseMove={onPanMove}
          onMouseUp={onPanEnd}
          onMouseLeave={onPanEnd}
          onDoubleClick={() => setRange(null)}
        >
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart
              data={view}
              margin={{ top: 24, right: 20, left: 4, bottom: 60 }}
              onMouseDown={(state: any, ev: any) => {
                if (ev?.shiftKey || panRef.current) return;
                if (state?.activeLabel != null) setSelA(String(state.activeLabel));
              }}
              onMouseMove={(state: any) => {
                if (panRef.current || !selA) return;
                if (state?.activeLabel != null) setSelB(String(state.activeLabel));
              }}
              onMouseUp={() => {
                if (!panRef.current) commitSelection();
              }}
            >
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis
                dataKey='date_range'
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                angle={-40}
                textAnchor='end'
                interval={dense ? 'preserveStartEnd' : 0}
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
                isAnimationActive={false}
              >
                {!dense && (
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
                )}
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
                isAnimationActive={false}
              />

              {/* Live drag-to-zoom selection band */}
              {selA && selB && (
                <ReferenceArea
                  x1={selA}
                  x2={selB}
                  stroke='#3b82f6'
                  strokeOpacity={0.4}
                  fill='#3b82f6'
                  fillOpacity={0.12}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
