'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ExecutiveLoadingSkeleton() {
  return (
    <div className='space-y-6 animate-in fade-in-0 duration-300'>
      {/* Section 1: KPI Cards Skeleton */}
      <div className='grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className='shadow-sm'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-8 w-8 rounded-full' />
            </CardHeader>
            <CardContent className='space-y-3'>
              <Skeleton className='h-7 w-28' />
              <Skeleton className='h-3 w-32' />
              <Skeleton className='h-2 w-full rounded-full' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section 2: Primary Visualizations Skeleton */}
      <div className='grid gap-4 grid-cols-1 lg:grid-cols-12'>
        <Card className='lg:col-span-5 shadow-sm'>
          <CardHeader>
            <Skeleton className='h-5 w-48' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-[300px] w-full rounded-lg' />
          </CardContent>
        </Card>
        <Card className='lg:col-span-3 shadow-sm'>
          <CardHeader>
            <Skeleton className='h-5 w-36' />
          </CardHeader>
          <CardContent className='flex items-center justify-center'>
            <Skeleton className='h-[220px] w-[220px] rounded-full' />
          </CardContent>
        </Card>
        <Card className='lg:col-span-4 shadow-sm'>
          <CardHeader>
            <Skeleton className='h-5 w-52' />
          </CardHeader>
          <CardContent className='space-y-3'>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className='flex items-center gap-3'>
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-5 flex-1 rounded-full' />
                <Skeleton className='h-4 w-12' />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Diagnostic Widgets Skeleton */}
      <div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-12'>
        <Card className='lg:col-span-3 shadow-sm'>
          <CardHeader>
            <Skeleton className='h-5 w-44' />
          </CardHeader>
          <CardContent className='space-y-2'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-8 w-full rounded' />
            ))}
          </CardContent>
        </Card>
        <Card className='lg:col-span-2 shadow-sm'>
          <CardHeader>
            <Skeleton className='h-5 w-36' />
          </CardHeader>
          <CardContent className='space-y-2'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-8 w-full rounded' />
            ))}
          </CardContent>
        </Card>
        <Card className='lg:col-span-4 shadow-sm'>
          <CardHeader>
            <Skeleton className='h-5 w-44' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-[200px] w-full rounded-lg' />
          </CardContent>
        </Card>
        <Card className='lg:col-span-3 shadow-sm'>
          <CardHeader>
            <Skeleton className='h-5 w-40' />
          </CardHeader>
          <CardContent className='grid grid-cols-2 gap-3'>
            <Skeleton className='h-32 rounded-lg' />
            <Skeleton className='h-32 rounded-lg' />
          </CardContent>
        </Card>
      </div>

      {/* Section 4: Table Skeleton */}
      <Card className='shadow-sm'>
        <CardHeader>
          <Skeleton className='h-5 w-64' />
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <Skeleton className='h-10 w-full rounded' />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className='h-10 w-full rounded' />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
