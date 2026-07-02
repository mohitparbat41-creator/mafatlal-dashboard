import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  IconCurrencyRupee,
  IconCash,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertCircle,
  IconBuilding,
  IconCalendarCheck
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { formatINR, formatTargetCrores } from '@/lib/format';

interface ExecutiveKpiCardsProps {
  totalSales: number;
  totalTarget: number;
  totalCollections: number;
  totalOutstanding: number;
  overallSalesAchPct: number;
  overallCollEffPct: number;
  departmentCount: number;
  weekCount: number;
  totalWeeks: number;
}

// Headline currency — full rupees → ₹ / L / Cr.
const formatCrCompact = formatINR;

interface KpiCardConfig {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trendValue: number;
  trendLabel: string;
  progressValue: number;
  colorScheme: 'blue' | 'green' | 'amber' | 'red' | 'indigo' | 'violet';
  invertTrend?: boolean; // true = lower is better (e.g. outstanding)
}

const COLOR_MAP = {
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-950/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
    progressBar: 'bg-blue-500'
  },
  green: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    progressBar: 'bg-emerald-500'
  },
  amber: {
    iconBg: 'bg-amber-100 dark:bg-amber-950/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    progressBar: 'bg-amber-500'
  },
  red: {
    iconBg: 'bg-rose-100 dark:bg-rose-950/40',
    iconColor: 'text-rose-600 dark:text-rose-400',
    progressBar: 'bg-rose-500'
  },
  indigo: {
    iconBg: 'bg-indigo-100 dark:bg-indigo-950/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    progressBar: 'bg-indigo-500'
  },
  violet: {
    iconBg: 'bg-violet-100 dark:bg-violet-950/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
    progressBar: 'bg-violet-500'
  }
};

export function ExecutiveKpiCards({
  totalSales,
  totalTarget,
  totalCollections,
  totalOutstanding,
  overallSalesAchPct,
  overallCollEffPct,
  departmentCount,
  weekCount,
  totalWeeks
}: ExecutiveKpiCardsProps) {
  // Outstanding as % of sales — capped to 1 decimal
  const outstandingPct =
    totalSales > 0 ? parseFloat(((totalOutstanding / totalSales) * 100).toFixed(1)) : 0;

  // Weeks progress — capped to actual quarter weeks
  const safeWeekCount = Math.min(weekCount, totalWeeks);
  const weeksPct = totalWeeks > 0 ? (safeWeekCount / totalWeeks) * 100 : 0;

  const cards: KpiCardConfig[] = [
    {
      title: 'Total Sales',
      value: formatCrCompact(totalSales),
      subtitle: `vs Target ${formatTargetCrores(totalTarget)}`,
      icon: IconCurrencyRupee,
      trendValue: overallSalesAchPct,
      trendLabel: '',
      progressValue: Math.min(overallSalesAchPct, 100),
      colorScheme: 'blue'
    },
    {
      title: 'Total Collections',
      value: formatCrCompact(totalCollections),
      subtitle: `${overallCollEffPct.toFixed(1)}% of Sales`,
      icon: IconCash,
      trendValue: overallCollEffPct,
      trendLabel: '',
      progressValue: Math.min(overallCollEffPct, 100),
      colorScheme: 'green'
    },
    {
      title: 'Coll. Efficiency',
      value: `${overallCollEffPct.toFixed(1)}%`,
      subtitle: 'Collections / Sales',
      icon: IconTrendingUp,
      trendValue: overallCollEffPct,
      trendLabel: '',
      progressValue: Math.min(overallCollEffPct, 100),
      colorScheme: overallCollEffPct >= 80 ? 'green' : 'amber'
    },
    {
      title: 'Outstanding',
      value: formatCrCompact(totalOutstanding),
      subtitle: `${outstandingPct.toFixed(1)}% of Sales`,
      icon: IconAlertCircle,
      trendValue: outstandingPct,
      trendLabel: '',
      progressValue: Math.min(outstandingPct, 100),
      colorScheme: outstandingPct > 30 ? 'red' : 'amber',
      invertTrend: true
    },
    {
      title: 'Departments',
      value: String(departmentCount),
      subtitle: 'Active Departments',
      icon: IconBuilding,
      trendValue: 100,
      trendLabel: 'Reporting',
      progressValue: 100,
      colorScheme: 'indigo'
    },
    {
      title: 'Weeks Done',
      value: `${safeWeekCount} / ${totalWeeks}`,
      subtitle: 'Current Quarter',
      icon: IconCalendarCheck,
      trendValue: weeksPct,
      trendLabel: '',
      progressValue: weeksPct,
      colorScheme: 'violet'
    }
  ];

  return (
    <div className='grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
      {cards.map((card) => {
        const colors = COLOR_MAP[card.colorScheme];
        const Icon = card.icon;

        // For "invertTrend" cards (outstanding), high % = bad
        const isPositive = card.invertTrend ? card.trendValue <= 15 : card.trendValue >= 0;

        const trendColorClass = isPositive
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-rose-600 dark:text-rose-400';

        return (
          <Card
            key={card.title}
            className='shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden'
          >
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4'>
              <CardTitle className='text-xs font-medium text-muted-foreground leading-tight'>
                {card.title}
              </CardTitle>
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  colors.iconBg
                )}
              >
                <Icon className={cn('h-4 w-4', colors.iconColor)} />
              </div>
            </CardHeader>
            <CardContent className='px-4 pb-4 pt-1 space-y-1.5'>
              <div className='text-xl font-bold tracking-tight leading-none'>{card.value}</div>
              <p className='text-[11px] text-muted-foreground leading-tight truncate'>
                {card.subtitle}
              </p>
              <div className='flex items-center gap-1'>
                {card.trendLabel ? (
                  <span
                    className={cn(
                      'text-[11px] font-semibold',
                      'text-indigo-600 dark:text-indigo-400'
                    )}
                  >
                    {card.trendLabel}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 text-[11px] font-semibold',
                      trendColorClass
                    )}
                  >
                    {isPositive ? (
                      <IconTrendingUp className='h-3 w-3' />
                    ) : (
                      <IconTrendingDown className='h-3 w-3' />
                    )}
                    {card.trendValue.toFixed(1)}%
                  </span>
                )}
              </div>
              {/* Mini progress bar with inline color */}
              <div className='h-1.5 w-full rounded-full bg-primary/10'>
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    colors.progressBar
                  )}
                  style={{ width: `${Math.min(card.progressValue, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
