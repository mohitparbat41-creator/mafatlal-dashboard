'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useQueryState } from 'nuqs';
import { executiveSummaryQueryOptions } from '../api/queries';
import { ProcessedExecutiveRow } from '../api/types';
import { ExecutiveKpiCards } from './executive-kpi-cards';
import { ExecutiveTable } from './executive-table';
import { ExecutiveBarChart } from './executive-bar-chart';
import { ExecutiveTargetGauge } from './executive-target-gauge';
import { ExecutiveDeptRanking, DeptRankingEntry } from './executive-dept-ranking';
import {
  ExecutiveDiagnosticWidgets,
  OutstandingEntry,
  MomentumEntry,
  CollectionEfficiencyWeek,
  PerformerInfo
} from './executive-diagnostic-widgets';
import { ExecutiveLoadingSkeleton } from './executive-loading-skeleton';
import { IconFilter } from '@tabler/icons-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ALL_DEPARTMENTS = [
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

const TOTAL_WEEKS_IN_QUARTER = 13;

export function ExecutiveDashboard() {
  // Multi-select department filter (client-side state — filtering done in useMemo)
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]); // empty = All

  const [timeFilter, setTimeFilter] = useQueryState('time', {
    defaultValue: 'All',
    shallow: true
  });

  // Fetch all data (no server-side dept filter — we multi-filter client-side)
  const { data, isLoading, error } = useQuery(
    executiveSummaryQueryOptions('All')
  );

  // ─── Frontend Calculations Engine ─────────────────────────────────────

  const {
    processedData,
    totals,
    chartData,
    departmentRanking,
    outstandingData,
    momentumData,
    collectionEfficiencyData,
    topPerformer,
    lowPerformer,
    departmentCount,
    weekCount
  } = useMemo(() => {
    if (!data)
      return {
        processedData: [],
        totals: null,
        chartData: [],
        departmentRanking: [],
        outstandingData: [],
        momentumData: [],
        collectionEfficiencyData: [],
        topPerformer: null,
        lowPerformer: null,
        departmentCount: 0,
        weekCount: 0
      };

    const now = new Date();

    // Step 1: Apply department multi-filter
    const deptFiltered =
      selectedDepts.length === 0
        ? data
        : data.filter((row) => selectedDepts.includes(row.department_name));

    // Step 2: Apply time filter
    const timeFiltered = deptFiltered.filter((row) => {
      if (timeFilter === 'All') return true;
      if (!row.latest_submission_time) return false;
      const subTime = new Date(row.latest_submission_time).getTime();
      const diffDays = (now.getTime() - subTime) / (1000 * 3600 * 24);
      switch (timeFilter) {
        case 'FYTD': return true; // All data year-to-date
        case 'Last 7 days': return diffDays <= 7;
        case 'Last 15 days': return diffDays <= 15;
        case 'Last 1 month': return diffDays <= 30;
        case 'Last 2 months': return diffDays <= 60;
        default: return true;
      }
    });

    // Step 3: Only include weeks that have actual sales data (latest_submission_time is not null)
    // This prevents future weeks with zero data from polluting charts
    const filteredData = timeFiltered.filter(
      (row) => row.latest_submission_time !== null && row.latest_submission_time !== undefined
    );

    // Step 4: Process each row with cumulative totals
    let runTarget = 0;
    let runSales = 0;
    let runColl = 0;
    let totalOutstanding = 0;

    const processedData: ProcessedExecutiveRow[] = filteredData.map((row) => {
      const safeTarget = Number(row.weekly_target_amount) || 0;
      const safeSales = Number(row.total_sales_achieved) || 0;
      const safeColl = Number(row.total_collection_amount) || 0;
      // Outstanding = sales - collections for this week/dept
      const safeOutstanding = Math.max(safeSales - safeColl, 0);

      runTarget += safeTarget;
      runSales += safeSales;
      runColl += safeColl;
      totalOutstanding += safeOutstanding;

      const sales_ach_pct =
        safeTarget > 0 ? parseFloat(((safeSales / safeTarget) * 100).toFixed(1)) : 0;

      const coll_eff_pct =
        safeSales > 0 ? parseFloat(((safeColl / safeSales) * 100).toFixed(1)) : 0;

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

    const overallSalesAchPct =
      runTarget > 0 ? parseFloat(((runSales / runTarget) * 100).toFixed(1)) : 0;
    const overallCollEffPct =
      runSales > 0 ? parseFloat(((runColl / runSales) * 100).toFixed(1)) : 0;

    const totalsObj = {
      totalSales: runSales,
      totalTarget: runTarget,
      totalCollections: runColl,
      totalOutstanding: totalOutstanding,
      overallSalesAchPct,
      overallCollEffPct
    };

    // ─── Chart data (aggregated by week, with date_range labels) ────────

    const chartDataMap = new Map<
      number,
      {
        week_number: number;
        date_range: string;
        weekly_target_amount: number;
        total_sales_achieved: number;
      }
    >();
    processedData.forEach((row) => {
      if (!chartDataMap.has(row.week_number)) {
        chartDataMap.set(row.week_number, {
          week_number: row.week_number,
          date_range: row.date_range || `W${row.week_number}`,
          weekly_target_amount: 0,
          total_sales_achieved: 0
        });
      }
      const entry = chartDataMap.get(row.week_number)!;
      entry.weekly_target_amount += row.weekly_target_amount;
      entry.total_sales_achieved += row.total_sales_achieved;
    });
    const chartData = Array.from(chartDataMap.values()).sort(
      (a, b) => a.week_number - b.week_number
    );

    // ─── Department-level aggregation ───────────────────────────────────

    const deptMap = new Map<
      string,
      {
        totalTarget: number;
        totalSales: number;
        totalColl: number;
        totalOutstanding: number;
        weekSales: Map<number, number>;
      }
    >();

    processedData.forEach((row) => {
      const dept = row.department_name;
      if (!deptMap.has(dept)) {
        deptMap.set(dept, {
          totalTarget: 0,
          totalSales: 0,
          totalColl: 0,
          totalOutstanding: 0,
          weekSales: new Map()
        });
      }
      const d = deptMap.get(dept)!;
      d.totalTarget += row.weekly_target_amount;
      d.totalSales += row.total_sales_achieved;
      d.totalColl += row.total_collection_amount;
      // Outstanding per dept = sales - collections (never negative)
      d.totalOutstanding += Math.max(row.total_sales_achieved - row.total_collection_amount, 0);

      d.weekSales.set(
        row.week_number,
        (d.weekSales.get(row.week_number) || 0) + row.total_sales_achieved
      );
    });

    // Department ranking — capped at 1 decimal
    const departmentRanking: DeptRankingEntry[] = [];
    deptMap.forEach((val, dept) => {
      departmentRanking.push({
        department: dept,
        achievementPct:
          val.totalTarget > 0
            ? parseFloat(((val.totalSales / val.totalTarget) * 100).toFixed(1))
            : 0
      });
    });

    // Outstanding heatmap
    const outstandingData: OutstandingEntry[] = [];
    deptMap.forEach((val, dept) => {
      outstandingData.push({
        department: dept,
        outstanding: val.totalOutstanding
      });
    });

    // Momentum: compare latest two weeks per department
    const allWeeks = Array.from(
      new Set(processedData.map((r) => r.week_number))
    ).sort((a, b) => a - b);

    const currentWeek = allWeeks[allWeeks.length - 1];
    const previousWeek =
      allWeeks.length > 1 ? allWeeks[allWeeks.length - 2] : currentWeek;

    const momentumData: MomentumEntry[] = [];
    deptMap.forEach((val, dept) => {
      momentumData.push({
        department: dept,
        currentWeekSales: val.weekSales.get(currentWeek) || 0,
        previousWeekSales: val.weekSales.get(previousWeek) || 0
      });
    });

    // Collection efficiency per week (capped to 1 decimal)
    const weekAggMap = new Map<
      number,
      { sales: number; collections: number }
    >();
    processedData.forEach((row) => {
      if (!weekAggMap.has(row.week_number)) {
        weekAggMap.set(row.week_number, { sales: 0, collections: 0 });
      }
      const w = weekAggMap.get(row.week_number)!;
      w.sales += row.total_sales_achieved;
      w.collections += row.total_collection_amount;
    });

    const collectionEfficiencyData: CollectionEfficiencyWeek[] = Array.from(
      weekAggMap.entries()
    )
      .sort((a, b) => a[0] - b[0])
      .map(([week, val]) => ({
        week,
        efficiencyPct:
          val.sales > 0
            ? parseFloat(((val.collections / val.sales) * 100).toFixed(1))
            : 0
      }));

    // Top & Low performers
    const sortedDepts = [...departmentRanking].sort(
      (a, b) => b.achievementPct - a.achievementPct
    );
    const topPerformer: PerformerInfo | null =
      sortedDepts.length > 0
        ? {
            department: sortedDepts[0].department,
            achievementPct: sortedDepts[0].achievementPct
          }
        : null;
    const lowPerformer: PerformerInfo | null =
      sortedDepts.length > 0
        ? {
            department: sortedDepts[sortedDepts.length - 1].department,
            achievementPct: sortedDepts[sortedDepts.length - 1].achievementPct
          }
        : null;

    const departmentCount = deptMap.size;
    const weekCount = allWeeks.length;

    return {
      processedData,
      totals: totalsObj,
      chartData,
      departmentRanking,
      outstandingData,
      momentumData,
      collectionEfficiencyData,
      topPerformer,
      lowPerformer,
      departmentCount,
      weekCount
    };
  }, [data, timeFilter, selectedDepts]);

  // ─── Error State ──────────────────────────────────────────────────────

  if (error) {
    return (
      <div className='flex h-96 items-center justify-center text-destructive'>
        Failed to load dashboard data: {error.message}
      </div>
    );
  }

  // ─── Department filter label ──────────────────────────────────────────
  const deptFilterLabel =
    selectedDepts.length === 0
      ? 'All Departments'
      : selectedDepts.length === 1
        ? selectedDepts[0]
        : `${selectedDepts.length} Departments`;

  const toggleDept = (dept: string) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className='space-y-6'>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Executive Sales Overview
          </h1>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Real-time performance dashboard for sales and collections
          </p>
        </div>

        {/* Filters Row */}
        <div className='flex flex-wrap items-center gap-2'>
          {/* Time Period Filter */}
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className='h-9 w-[180px] text-xs font-medium'>
              <SelectValue placeholder='Select period' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>FYTD Performance</SelectItem>
              <SelectItem value='Last 7 days'>Last 7 Days</SelectItem>
              <SelectItem value='Last 15 days'>Last 15 Days</SelectItem>
              <SelectItem value='Last 1 month'>Last 1 Month</SelectItem>
              <SelectItem value='Last 2 months'>Last 2 Months</SelectItem>
            </SelectContent>
          </Select>

          {/* Department Multi-Select */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='h-9 gap-2 text-xs font-medium'
              >
                <IconFilter className='h-3.5 w-3.5 text-muted-foreground' />
                <span className='max-w-[140px] truncate'>{deptFilterLabel}</span>
                {selectedDepts.length > 0 && (
                  <Badge
                    variant='secondary'
                    className='ml-0.5 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center'
                  >
                    {selectedDepts.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-[220px]'
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuLabel className='text-xs font-semibold text-muted-foreground'>
                Filter by Department
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className='flex gap-2 px-2 py-1.5'>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 flex-1 text-[10px]'
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedDepts(ALL_DEPARTMENTS);
                  }}
                >
                  Select All
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 flex-1 text-[10px]'
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedDepts([]);
                  }}
                >
                  Clear All
                </Button>
              </div>
              <DropdownMenuSeparator />

              {ALL_DEPARTMENTS.map((dept) => (
                <DropdownMenuCheckboxItem
                  key={dept}
                  checked={selectedDepts.includes(dept)}
                  onCheckedChange={() => toggleDept(dept)}
                  onSelect={(e) => e.preventDefault()}
                  className='text-xs'
                >
                  {dept}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <ExecutiveLoadingSkeleton />
      ) : (
        <div className='space-y-6 animate-in fade-in-0 duration-300'>
          {/* SECTION 1: KPI Cards */}
          {totals && (
            <ExecutiveKpiCards
              {...totals}
              departmentCount={departmentCount}
              weekCount={weekCount}
              totalWeeks={TOTAL_WEEKS_IN_QUARTER}
            />
          )}

          {/* SECTION 2: Primary Visualizations */}
          <div className='grid gap-4 grid-cols-1 lg:grid-cols-12'>
            <div className='lg:col-span-5'>
              <ExecutiveBarChart data={chartData} />
            </div>
            <div className='lg:col-span-3'>
              <ExecutiveTargetGauge
                salesAchieved={totals?.totalSales ?? 0}
                totalTarget={totals?.totalTarget ?? 0}
                achievementPct={totals?.overallSalesAchPct ?? 0}
              />
            </div>
            <div className='lg:col-span-4'>
              <ExecutiveDeptRanking data={departmentRanking} />
            </div>
          </div>

          {/* SECTION 3: Diagnostic Widgets */}
          <ExecutiveDiagnosticWidgets
            outstandingData={outstandingData}
            momentumData={momentumData}
            collectionEfficiencyData={collectionEfficiencyData}
            topPerformer={topPerformer}
            lowPerformer={lowPerformer}
          />

          {/* SECTION 4: Performance Matrix */}
          <ExecutiveTable data={processedData} />
        </div>
      )}
    </div>
  );
}
