import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Icons } from '@/components/icons';

interface ExecutiveKpiCardsProps {
  totalSales: number;
  totalTarget: number;
  totalCollections: number;
  totalOutstanding: number;
  overallSalesAchPct: number;
  overallCollEffPct: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

export function ExecutiveKpiCards({
  totalSales,
  totalTarget,
  totalCollections,
  totalOutstanding,
  overallSalesAchPct,
  overallCollEffPct
}: ExecutiveKpiCardsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <Card className='shadow-sm transition-shadow hover:shadow-md'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Sales Achieved</CardTitle>
          <Icons.trendingUp className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{formatCurrency(totalSales)}</div>
          <p className='text-muted-foreground mt-1 text-xs'>
            <span
              className={
                overallSalesAchPct >= 100
                  ? 'font-medium text-emerald-600 dark:text-emerald-400'
                  : 'font-medium text-rose-600 dark:text-rose-400'
              }
            >
              {overallSalesAchPct.toFixed(1)}%
            </span>{' '}
            overall achievement
          </p>
        </CardContent>
      </Card>

      <Card className='shadow-sm transition-shadow hover:shadow-md'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Target</CardTitle>
          <Icons.adjustments className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{formatCurrency(totalTarget)}</div>
          <p className='text-muted-foreground mt-1 text-xs'>
            Cumulative baseline target
          </p>
        </CardContent>
      </Card>

      <Card className='shadow-sm transition-shadow hover:shadow-md'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Collections</CardTitle>
          <Icons.check className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{formatCurrency(totalCollections)}</div>
          <p className='text-muted-foreground mt-1 text-xs'>
            <span className='font-medium text-blue-600 dark:text-blue-400'>
              {overallCollEffPct.toFixed(1)}%
            </span>{' '}
            collection efficiency
          </p>
        </CardContent>
      </Card>

      <Card className='shadow-sm transition-shadow hover:shadow-md'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Outstanding</CardTitle>
          <Icons.warning className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{formatCurrency(totalOutstanding)}</div>
          <p className='text-muted-foreground mt-1 text-xs'>
            Pending collection amount
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
