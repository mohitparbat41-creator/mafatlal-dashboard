'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

interface ExecutiveTargetGaugeProps {
  salesAchieved: number;
  totalTarget: number;
  achievementPct: number;
}

/**
 * Format a value that is already expressed in Crores.
 * e.g., 320.45 → "₹320.45 Cr"
 */
const formatCr = (value: number) => {
  if (value === 0) return '₹0 Cr';
  return `₹${parseFloat(value.toFixed(2))} Cr`;
};

export function ExecutiveTargetGauge({
  salesAchieved,
  totalTarget,
  achievementPct
}: ExecutiveTargetGaugeProps) {
  const cappedPct = Math.min(achievementPct, 100);
  const remaining = Math.max(100 - cappedPct, 0);

  const data = [
    { name: 'Achieved', value: cappedPct || 0.1 }, // tiny value so pie renders even at 0
    { name: 'Remaining', value: remaining }
  ];

  // Dynamic color based on performance level
  const getColor = () => {
    if (achievementPct >= 90) return '#22c55e'; // green-500
    if (achievementPct >= 70) return '#f59e0b'; // amber-500
    if (achievementPct >= 40) return '#f97316'; // orange-500
    return '#ef4444';                            // red-500
  };

  const achievedColor = getColor();
  const remainingColor = 'hsl(var(--muted))';

  const hasData = salesAchieved > 0 || totalTarget > 0;

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-semibold tracking-tight'>
          Target Achievement
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col items-center justify-center pt-0'>
        <div className='relative h-[200px] w-[200px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={data}
                cx='50%'
                cy='50%'
                innerRadius={68}
                outerRadius={92}
                startAngle={90}
                endAngle={-270}
                paddingAngle={remaining > 0 ? 2 : 0}
                dataKey='value'
                animationBegin={0}
                animationDuration={1000}
                animationEasing='ease-out'
                stroke='none'
              >
                <Cell fill={achievedColor} />
                <Cell fill={remainingColor} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Centered percentage label */}
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <span
              className='text-3xl font-bold tracking-tight'
              style={{ color: hasData ? achievedColor : 'hsl(var(--muted-foreground))' }}
            >
              {achievementPct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className='mt-2 text-center space-y-1'>
          <p className='text-xs text-muted-foreground'>
            <span className='font-semibold text-foreground'>
              {formatCr(salesAchieved)}
            </span>
            {' / '}
            <span>{formatCr(totalTarget)}</span>
          </p>
          <p className='text-[11px] text-muted-foreground'>
            of Quarterly Target
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
