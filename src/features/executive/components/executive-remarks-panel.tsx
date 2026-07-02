'use client';

import { useQuery } from '@tanstack/react-query';
import { recentRemarksQueryOptions } from '../api/queries';
import { departmentHead } from '@/features/submit/api/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconMessage2, IconMoodEmpty, IconUser } from '@tabler/icons-react';

// Deterministic left-border accent per department (stable across renders).
const ACCENTS = [
  'border-l-blue-500',
  'border-l-emerald-500',
  'border-l-amber-500',
  'border-l-violet-500',
  'border-l-rose-500',
  'border-l-cyan-500',
  'border-l-indigo-500',
  'border-l-teal-500',
  'border-l-orange-500'
];
function accentFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function userName(email: string): string {
  return email ? email.split('@')[0] : 'Unknown';
}

function fullDateTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ExecutiveRemarksPanel() {
  const { data, isLoading } = useQuery(recentRemarksQueryOptions());

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-2'>
        <div className='flex items-center gap-2'>
          <IconMessage2 className='h-4 w-4 text-muted-foreground' />
          <CardTitle className='text-sm font-semibold tracking-tight'>Department Remarks</CardTitle>
        </div>
        <CardDescription className='text-xs'>
          Recent activity &amp; comments from submissions — latest first
        </CardDescription>
      </CardHeader>
      <CardContent className='pt-0'>
        {isLoading ? (
          <div className='grid gap-2.5 sm:grid-cols-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='h-16 animate-pulse rounded-md bg-muted/50' />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className='flex h-[200px] flex-col items-center justify-center gap-2 text-muted-foreground'>
            <IconMoodEmpty className='h-8 w-8' />
            <p className='text-sm'>No remarks submitted yet</p>
          </div>
        ) : (
          <ScrollArea className='h-[360px] pr-3'>
            <div className='grid gap-2.5 sm:grid-cols-2'>
              {data.map((r) => (
                <div
                  key={r.record_id}
                  className={`rounded-md border border-l-4 bg-card p-3 transition-colors hover:bg-muted/40 ${accentFor(
                    r.department_name
                  )}`}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <span className='flex min-w-0 flex-col leading-tight'>
                      <span className='truncate text-xs font-semibold text-foreground'>
                        {r.department_name}
                      </span>
                      {departmentHead(r.department_name) && (
                        <span className='truncate text-[10px] font-normal text-muted-foreground'>
                          {departmentHead(r.department_name)}
                        </span>
                      )}
                    </span>
                    <div className='flex shrink-0 items-center gap-1.5'>
                      <span className='rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground'>
                        Week {r.week_number || '—'}
                      </span>
                      <span className='text-[10px] text-muted-foreground tabular-nums'>
                        {timeAgo(r.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className='mt-1 text-xs leading-snug text-muted-foreground'>“{r.remarks}”</p>
                  <div className='mt-2 flex items-center justify-between gap-2 border-t pt-1.5 text-[10px] text-muted-foreground'>
                    <span className='flex min-w-0 items-center gap-1'>
                      <IconUser className='h-3 w-3 shrink-0' />
                      <span className='truncate'>{userName(r.user_email)}</span>
                    </span>
                    <span className='shrink-0 tabular-nums'>{fullDateTime(r.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
