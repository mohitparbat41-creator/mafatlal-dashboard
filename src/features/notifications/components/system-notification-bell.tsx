'use client';

import { useQuery } from '@tanstack/react-query';
import { activeNotificationQueryOptions } from '@/features/submit/api/queries';
import { Icons } from '@/components/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export function SystemNotificationBell() {
  const { data: message, isLoading } = useQuery(activeNotificationQueryOptions());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative h-8 w-8'>
          <Icons.notification className='h-5 w-5' />
          {!isLoading && message && (
            <span className='absolute top-1 right-1 flex h-2 w-2'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75'></span>
              <span className='relative inline-flex h-2 w-2 rounded-full bg-red-500'></span>
            </span>
          )}
          <span className='sr-only'>Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80 p-4'>
        <div className='flex flex-col gap-2'>
          <h4 className='font-semibold leading-none tracking-tight'>Announcements</h4>
          {isLoading ? (
            <p className='text-sm text-muted-foreground'>Loading...</p>
          ) : message ? (
            <div className='rounded-md bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400'>
              {message}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>No new announcements.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
