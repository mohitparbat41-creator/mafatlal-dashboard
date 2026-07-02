'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProcessedExecutiveRow } from '../api/types';
import { cn } from '@/lib/utils';
import { formatINR, formatTargetCrores } from '@/lib/format';
import { departmentHead } from '@/features/submit/api/types';

interface ExecutiveTableProps {
  data: ProcessedExecutiveRow[];
}

// Money columns are full rupees → ₹/L/Cr. (Target columns use formatTargetCrores.)
const formatCrVal = (value: number) => formatINR(value);

const formatPercent = (value: number) => {
  return `${parseFloat(value.toFixed(1))}%`;
};

export function ExecutiveTable({ data }: ExecutiveTableProps) {
  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-semibold tracking-tight'>
          Weekly Performance Matrix
        </CardTitle>
        <CardDescription className='text-xs'>Sales vs Target vs Collections</CardDescription>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='relative max-h-[500px] w-full overflow-auto rounded-lg border'>
          <Table className='w-full caption-bottom text-sm'>
            <TableHeader className='sticky top-0 z-10 bg-card'>
              <TableRow className='border-b-2 hover:bg-transparent'>
                <TableHead className='whitespace-nowrap text-xs font-semibold pl-3'>Week</TableHead>
                <TableHead className='whitespace-nowrap text-xs font-semibold'>
                  Department
                </TableHead>
                <TableHead className='whitespace-nowrap text-right text-xs font-semibold'>
                  Target
                </TableHead>
                <TableHead className='whitespace-nowrap text-right text-xs font-semibold'>
                  Sales
                </TableHead>
                <TableHead className='whitespace-nowrap text-right text-xs font-semibold'>
                  Collections
                </TableHead>
                <TableHead className='whitespace-nowrap text-right text-xs font-semibold'>
                  Outstanding
                </TableHead>
                <TableHead className='whitespace-nowrap text-center text-xs font-semibold'>
                  Sales Ach %
                </TableHead>
                <TableHead className='whitespace-nowrap text-center text-xs font-semibold'>
                  Coll Eff %
                </TableHead>
                <TableHead className='whitespace-nowrap text-right text-xs font-semibold text-muted-foreground'>
                  Cum Target
                </TableHead>
                <TableHead className='whitespace-nowrap text-right text-xs font-semibold text-muted-foreground'>
                  Cum Sales
                </TableHead>
                <TableHead className='whitespace-nowrap text-right text-xs font-semibold text-muted-foreground'>
                  Cum Coll
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className='h-32 text-center'>
                    <p className='text-muted-foreground'>No data available for this period</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow
                    key={`${row.weekly_target_id}-${index}`}
                    className={cn(
                      'transition-colors hover:bg-muted/50',
                      index % 2 === 0 ? 'bg-transparent' : 'bg-muted/30'
                    )}
                  >
                    <TableCell className='font-semibold tabular-nums pl-3'>
                      W{row.week_number}
                    </TableCell>
                    <TableCell className='text-xs max-w-[150px]'>
                      <span className='block truncate'>{row.department_name}</span>
                      {departmentHead(row.department_name) && (
                        <span className='block truncate text-[10px] text-muted-foreground'>
                          {departmentHead(row.department_name)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='text-right tabular-nums text-xs'>
                      {formatTargetCrores(row.weekly_target_amount)}
                    </TableCell>
                    <TableCell className='text-right font-medium tabular-nums text-xs'>
                      {formatCrVal(row.total_sales_achieved)}
                    </TableCell>
                    <TableCell className='text-right tabular-nums text-xs'>
                      {formatCrVal(row.total_collection_amount)}
                    </TableCell>
                    <TableCell className='text-right tabular-nums text-xs'>
                      {formatCrVal(row.outstanding_amount)}
                    </TableCell>

                    {/* Sales Achievement % — color-coded badge */}
                    <TableCell className='text-center'>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                          row.sales_ach_pct >= 100
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : row.sales_ach_pct >= 75
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                        )}
                      >
                        {formatPercent(row.sales_ach_pct)}
                      </span>
                    </TableCell>

                    {/* Collection Efficiency % — color-coded badge */}
                    <TableCell className='text-center'>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                          row.coll_eff_pct >= 90
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : row.coll_eff_pct >= 70
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                        )}
                      >
                        {formatPercent(row.coll_eff_pct)}
                      </span>
                    </TableCell>

                    <TableCell className='text-right text-muted-foreground tabular-nums text-xs'>
                      {formatTargetCrores(row.cum_target)}
                    </TableCell>
                    <TableCell className='text-right text-muted-foreground tabular-nums text-xs'>
                      {formatCrVal(row.cum_sales)}
                    </TableCell>
                    <TableCell className='text-right text-muted-foreground tabular-nums text-xs'>
                      {formatCrVal(row.cum_collection)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
