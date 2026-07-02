'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseHealthQueryOptions } from '../api/queries';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { IconDatabase, IconActivity, IconRefresh, IconAlertTriangle } from '@tabler/icons-react';

/** Re-renders every second so the "last sync" label stays live. */
function useRelativeTime(ts: number | undefined) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  if (!ts) return '—';
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s} sec ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)} hr ago`;
}

function Stat({
  icon: Icon,
  label,
  value,
  valueClass
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className='flex items-center gap-1.5'>
      <Icon className='h-3.5 w-3.5 text-muted-foreground' />
      <span className='text-xs text-muted-foreground'>{label}</span>
      <span className={cn('text-xs font-semibold tabular-nums', valueClass)}>{value}</span>
    </div>
  );
}

export function ExecutiveHealthWidget() {
  const { data, isLoading, isFetching, isError, dataUpdatedAt } = useQuery(
    supabaseHealthQueryOptions()
  );
  const lastSync = useRelativeTime(dataUpdatedAt || undefined);

  const checking = isLoading;
  const ok = !!data?.ok && !isError;

  return (
    <Card
      className={cn(
        'flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 shadow-sm transition-colors',
        !ok &&
          !checking &&
          'border-amber-400/60 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-950/20'
      )}
    >
      <div className='flex items-center gap-2'>
        <span className='relative flex h-2.5 w-2.5'>
          {ok && (
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
          )}
          <span
            className={cn(
              'relative inline-flex h-2.5 w-2.5 rounded-full',
              checking ? 'bg-muted-foreground' : ok ? 'bg-emerald-500' : 'bg-amber-500'
            )}
          />
        </span>
        <span className='text-sm font-semibold'>
          {checking ? 'Checking Supabase…' : ok ? 'Supabase Connected' : 'Supabase Unavailable'}
        </span>
      </div>

      <Stat
        icon={IconDatabase}
        label='Database'
        value={checking ? '…' : ok ? 'Healthy' : 'Down'}
        valueClass={
          ok
            ? 'text-emerald-600 dark:text-emerald-400'
            : !checking
              ? 'text-amber-600 dark:text-amber-400'
              : undefined
        }
      />
      <Stat icon={IconActivity} label='Latency' value={data ? `${data.latencyMs} ms` : '—'} />
      <Stat icon={IconRefresh} label='Last Sync' value={isFetching ? 'syncing…' : lastSync} />

      {!ok && !checking && (
        <span className='ml-auto flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400'>
          <IconAlertTriangle className='h-3.5 w-3.5' />
          Backend connection issue — data may be stale
        </span>
      )}
    </Card>
  );
}
