'use client';

import { useAuth } from '@/components/providers/supabase-auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

export default function ProfileViewPage() {
  const { user, role } = useAuth();

  return (
    <div className='flex w-full flex-col gap-6 p-4'>
      <Card className='rounded-xl border shadow-sm'>
        <CardHeader>
          <CardTitle className='text-lg font-semibold'>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center gap-3'>
            <div className='bg-muted flex size-10 items-center justify-center rounded-lg'>
              <Icons.user className='size-5' />
            </div>
            <div>
              <p className='text-sm font-medium'>{user?.email || '—'}</p>
              <p className='text-muted-foreground text-xs capitalize'>{role || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
