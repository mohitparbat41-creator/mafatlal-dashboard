'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ProcessedExecutiveRow } from '../api/types';
import { cn } from '@/lib/utils';

interface ExecutiveTableProps {
  data: ProcessedExecutiveRow[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export function ExecutiveTable({ data }: ExecutiveTableProps) {
  return (
    <div className='rounded-md border bg-card shadow-sm'>
      <div className='relative w-full overflow-auto'>
        <Table className='w-full caption-bottom text-sm'>
          <TableHeader>
            <TableRow>
              <TableHead className='whitespace-nowrap'>Week</TableHead>
              <TableHead className='whitespace-nowrap'>Month</TableHead>
              <TableHead className='whitespace-nowrap'>Quarter</TableHead>
              <TableHead className='whitespace-nowrap'>Date Range</TableHead>
              <TableHead className='whitespace-nowrap text-right'>Weekly Target</TableHead>
              <TableHead className='whitespace-nowrap text-right'>Total Sales</TableHead>
              <TableHead className='whitespace-nowrap text-right'>Collections</TableHead>
              <TableHead className='whitespace-nowrap text-right'>Outstanding</TableHead>
              <TableHead className='whitespace-nowrap text-center'>Sales Ach %</TableHead>
              <TableHead className='whitespace-nowrap text-center'>Coll Eff %</TableHead>
              <TableHead className='whitespace-nowrap text-right'>Cum. Target</TableHead>
              <TableHead className='whitespace-nowrap text-right'>Cum. Sales</TableHead>
              <TableHead className='whitespace-nowrap text-right'>Cum. Coll.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className='h-32 text-center'>
                  <p className="text-muted-foreground">No data available for this period</p>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.weekly_target_id}>
                  <TableCell className='font-medium'>{row.week_number}</TableCell>
                  <TableCell>{row.month}</TableCell>
                  <TableCell>{row.quarter}</TableCell>
                  <TableCell className='whitespace-nowrap'>{row.date_range}</TableCell>
                  <TableCell className='text-right'>{formatCurrency(row.weekly_target_amount)}</TableCell>
                  <TableCell className='text-right'>{formatCurrency(row.total_sales_achieved)}</TableCell>
                  <TableCell className='text-right'>{formatCurrency(row.total_collection_amount)}</TableCell>
                  <TableCell className='text-right'>{formatCurrency(row.outstanding_amount)}</TableCell>
                  
                  {/* Conditional Formatting for Sales Ach % */}
                  <TableCell className='text-center'>
                    <div
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        row.sales_ach_pct >= 100
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      )}
                    >
                      {formatPercent(row.sales_ach_pct)}
                    </div>
                  </TableCell>
                  
                  <TableCell className='text-center font-medium'>
                    {formatPercent(row.coll_eff_pct)}
                  </TableCell>
                  <TableCell className='text-right text-muted-foreground'>
                    {formatCurrency(row.cum_target)}
                  </TableCell>
                  <TableCell className='text-right text-muted-foreground'>
                    {formatCurrency(row.cum_sales)}
                  </TableCell>
                  <TableCell className='text-right text-muted-foreground'>
                    {formatCurrency(row.cum_collection)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
