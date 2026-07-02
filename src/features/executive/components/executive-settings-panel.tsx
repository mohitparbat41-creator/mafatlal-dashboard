'use client';

import { useQuery } from '@tanstack/react-query';
import { supabaseHealthQueryOptions } from '../api/queries';
import { useExecUiStore } from './executive-ui-store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { IconDownload } from '@tabler/icons-react';

function relTime(ts?: number) {
  if (!ts) return '—';
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s} sec ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)} hr ago`;
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className='flex items-center justify-between text-xs'>
      <span className='text-muted-foreground'>{label}</span>
      <span className={cn('font-semibold tabular-nums', valueClass)}>{value}</span>
    </div>
  );
}

export function ExecutiveSettingsPanel() {
  const showHealth = useExecUiStore((s) => s.showHealth);
  const onToggleHealth = useExecUiStore((s) => s.setShowHealth);
  const exportCsv = useExecUiStore((s) => s.exportCsv);
  const canExport = useExecUiStore((s) => s.canExport);

  const { data, isLoading, isError, isFetching, dataUpdatedAt } = useQuery(
    supabaseHealthQueryOptions()
  );
  const ok = !!data?.ok && !isError;

  return (
    <div className='space-y-3.5'>
      {/* ── Backend Health ── */}
      <section>
        <p className='mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
          Backend Health
        </p>
        <div className='space-y-1.5 rounded-md border p-2.5'>
          <div className='flex items-center gap-2'>
            <span className='relative flex h-2.5 w-2.5'>
              {ok && (
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
              )}
              <span
                className={cn(
                  'relative inline-flex h-2.5 w-2.5 rounded-full',
                  isLoading ? 'bg-muted-foreground' : ok ? 'bg-emerald-500' : 'bg-amber-500'
                )}
              />
            </span>
            <span className='text-sm font-medium'>
              {isLoading ? 'Checking…' : ok ? 'Supabase Connected' : 'Supabase Unavailable'}
            </span>
          </div>
          <Separator className='my-1' />
          <Row
            label='Database'
            value={isLoading ? '…' : ok ? 'Healthy' : 'Down'}
            valueClass={
              ok
                ? 'text-emerald-600 dark:text-emerald-400'
                : !isLoading
                  ? 'text-amber-600 dark:text-amber-400'
                  : undefined
            }
          />
          <Row label='Latency' value={data ? `${data.latencyMs} ms` : '—'} />
          <Row
            label='Last Sync'
            value={isFetching ? 'syncing…' : relTime(dataUpdatedAt || undefined)}
          />
        </div>
      </section>

      {/* ── Display ── */}
      <section>
        <p className='mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
          Display
        </p>
        <div className='flex items-center justify-between gap-3'>
          <Label htmlFor='health-toggle' className='text-sm font-medium'>
            Pin health bar to dashboard
          </Label>
          <Switch id='health-toggle' checked={showHealth} onCheckedChange={onToggleHealth} />
        </div>
      </section>

      {/* ── Export ── */}
      <section>
        <p className='mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
          Export Data
        </p>
        <Button
          variant='outline'
          size='sm'
          className='w-full gap-2'
          onClick={() => exportCsv?.()}
          disabled={!canExport}
        >
          <IconDownload className='h-3.5 w-3.5' />
          Export current view (CSV)
        </Button>
        <p className='mt-1 text-[11px] text-muted-foreground'>
          Downloads the weekly performance matrix for the active filters.
        </p>
      </section>
    </div>
  );
}
