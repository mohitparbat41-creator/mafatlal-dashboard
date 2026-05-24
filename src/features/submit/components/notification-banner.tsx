'use client';

import { useQuery } from '@tanstack/react-query';
import { activeNotificationQueryOptions } from '../api/queries';
import { Icons } from '@/components/icons';

export function NotificationBanner() {
  const { data: message, isLoading } = useQuery(activeNotificationQueryOptions());

  if (isLoading || !message) {
    return null; // Don't show anything if loading or no active message
  }

  return (
    <div className='mb-6 flex items-start gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-600 dark:text-yellow-400'>
      <Icons.info className='mt-0.5 h-5 w-5 shrink-0' />
      <div className='flex flex-col gap-1'>
        <h4 className='text-sm font-semibold tracking-tight'>Management Announcement</h4>
        <p className='text-sm'>{message}</p>
      </div>
    </div>
  );
}
