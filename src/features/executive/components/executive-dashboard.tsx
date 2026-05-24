'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useQueryState } from 'nuqs';
import { executiveSummaryQueryOptions } from '../api/queries';
import { ProcessedExecutiveRow } from '../api/types';
import { ExecutiveKpiCards } from './executive-kpi-cards';
import { ExecutiveTable } from './executive-table';
import { ExecutiveBarChart } from './executive-bar-chart';
import { Icons } from '@/components/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const DEPARTMENTS = [
  'All',
  'Corporate',
  'Digital Infrastructure',
  'Healthcare',
  'Hygiene Institution',
  'MIL Traditional Textile',
  'Home Furnishing',
  'MSD Traditional Textile',
  'Online Business',
  'Uniform Solution'
];

export function ExecutiveDashboard() {
  const [departmentFilter, setDepartmentFilter] = useQueryState('department', {
    defaultValue: 'All',
    shallow: true
  });

  const [timeFilter, setTimeFilter] = useQueryState('time', {
    defaultValue: 'All',
    shallow: true
  });

  const { data, isLoading, error } = useQuery(
    executiveSummaryQueryOptions(departmentFilter)
  );

  console.log('DEBUG: Fetched Rows from Supabase (data):', data);

  // Frontend Calculations Engine
  const { processedData, totals, chartData } = useMemo(() => {
    if (!data) return { processedData: [], totals: null, chartData: [] };

    const now = new Date();
    
    const filteredData = data.filter((row) => {
      if (timeFilter === 'All') return true;
      if (!row.latest_submission_time) return false;
      
      const subTime = new Date(row.latest_submission_time).getTime();
      const diffDays = (now.getTime() - subTime) / (1000 * 3600 * 24);
      
      switch (timeFilter) {
        case 'Last 2 days': return diffDays <= 2;
        case 'Last 7 days': return diffDays <= 7;
        case 'Last 15 days': return diffDays <= 15;
        case 'Last 1 month': return diffDays <= 30;
        case 'Last 2 months': return diffDays <= 60;
        default: return true;
      }
    });

    let runTarget = 0;
    let runSales = 0;
    let runColl = 0;
    
    let totalOutstanding = 0;

    const processedData: ProcessedExecutiveRow[] = filteredData.map((row) => {
      // Safely cast to Number to handle Postgres numeric string returns or nulls
      const safeTarget = Number(row.weekly_target_amount) || 0;
      const safeSales = Number(row.total_sales_achieved) || 0;
      const safeColl = Number(row.total_collection_amount) || 0;
      const safeOutstanding = Number(row.outstanding_amount) || 0;

      runTarget += safeTarget;
      runSales += safeSales;
      runColl += safeColl;
      totalOutstanding += safeOutstanding;

      const sales_ach_pct =
        safeTarget > 0
          ? (safeSales / safeTarget) * 100
          : 0;

      const coll_eff_pct =
        safeSales > 0
          ? (safeColl / safeSales) * 100
          : 0;

      // Update the row with safe parsed values
      return {
        ...row,
        weekly_target_amount: safeTarget,
        total_sales_achieved: safeSales,
        total_collection_amount: safeColl,
        outstanding_amount: safeOutstanding,
        sales_ach_pct,
        coll_eff_pct,
        cum_target: runTarget,
        cum_sales: runSales,
        cum_collection: runColl
      };
    });

    const overallSalesAchPct = runTarget > 0 ? (runSales / runTarget) * 100 : 0;
    const overallCollEffPct = runSales > 0 ? (runColl / runSales) * 100 : 0;

    const totalsObj = {
      totalSales: runSales,
      totalTarget: runTarget,
      totalCollections: runColl,
      totalOutstanding: totalOutstanding,
      overallSalesAchPct,
      overallCollEffPct
    };

    console.log('DEBUG: Parsed Dashboard Data (processedData):', processedData);
    console.log('DEBUG: KPI Calculation Inputs (totalsObj):', totalsObj);

    // Aggregate chart data by week so weeks appear once (W1, W2, W3...)
    const chartDataMap = new Map<number, any>();
    processedData.forEach((row) => {
      if (!chartDataMap.has(row.week_number)) {
        chartDataMap.set(row.week_number, {
          week_number: row.week_number,
          weekly_target_amount: 0,
          total_sales_achieved: 0,
        });
      }
      const entry = chartDataMap.get(row.week_number);
      entry.weekly_target_amount += row.weekly_target_amount;
      entry.total_sales_achieved += row.total_sales_achieved;
    });
    const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.week_number - b.week_number);

    console.log('DEBUG: Chart Dataset (chartData):', chartData);

    return { processedData, totals: totalsObj, chartData };
  }, [data, timeFilter]);

  if (error) {
    return (
      <div className='flex h-96 items-center justify-center text-destructive'>
        Failed to load dashboard data: {error.message}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Filters Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h2 className='text-2xl font-bold tracking-tight'>Control Tower</h2>
        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>Time:</span>
            <Select
              value={timeFilter}
              onValueChange={setTimeFilter}
            >
              <SelectTrigger className='w-[150px]'>
                <SelectValue placeholder='Select time' />
              </SelectTrigger>
              <SelectContent>
                {['All', 'Last 2 days', 'Last 7 days', 'Last 15 days', 'Last 1 month', 'Last 2 months'].map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>Department:</span>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className='w-[200px]'>
                <SelectValue placeholder='Select department' />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className='flex h-96 items-center justify-center'>
          <Icons.spinner className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      ) : (
        <>
          {totals && <ExecutiveKpiCards {...totals} />}
          
          <div className='mt-8'>
            <h3 className='mb-4 text-lg font-semibold tracking-tight'>Sales vs Target Pipeline</h3>
            <ExecutiveBarChart data={chartData} />
          </div>

          <div className='mt-8'>
            <h3 className='mb-4 text-lg font-semibold tracking-tight'>Performance Matrix (Finalized)</h3>
            <ExecutiveTable data={processedData} />
          </div>
        </>
      )}
    </div>
  );
}
