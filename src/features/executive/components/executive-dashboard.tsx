'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
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
import { ExecutiveRemarksPanel } from './executive-remarks-panel';
import { ExecutiveHealthWidget } from './executive-health-widget';
import { IconFilter, IconCalendar } from '@tabler/icons-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { useExecUiStore } from './executive-ui-store';
import { DEPARTMENTS, departmentHead } from '@/features/submit/api/types';

// Derived from the single canonical list so names/order never drift.
const ALL_DEPARTMENTS = DEPARTMENTS.map((d) => d.name);

const TOTAL_WEEKS_IN_QUARTER = 13;

const fmtRange = (d: Date) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const PERIOD_PRESETS = [
  { value: 'All', label: 'FYTD Performance' },
  { value: 'Last 7 days', label: 'Last 7 Days' },
  { value: 'Last 15 days', label: 'Last 15 Days' },
  { value: 'Last 1 month', label: 'Last 1 Month' },
  { value: 'Last 2 months', label: 'Last 2 Months' }
];

export function ExecutiveDashboard() {
  // Multi-select department filter (client-side state — filtering done in useMemo)
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]); // empty = All

  const [timeFilter, setTimeFilter] = useQueryState('time', {
    defaultValue: 'All',
    shallow: true
  });

  // Health bar visibility + CSV export are controlled from the sidebar Settings
  // panel via a shared store. Hydrate persisted state on mount.
  const showHealth = useExecUiStore((s) => s.showHealth);
  const hydrateHealth = useExecUiStore((s) => s.hydrate);
  const registerExport = useExecUiStore((s) => s.registerExport);
  useEffect(() => {
    hydrateHealth();
  }, [hydrateHealth]);

  // Custom date range (takes precedence over FYTD presets when set)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Integrated period filter popover (presets + calendar, committed via Apply)
  const [dateOpen, setDateOpen] = useState(false);
  const [draftPreset, setDraftPreset] = useState<string>('All');
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined);

  const openPeriod = (open: boolean) => {
    setDateOpen(open);
    if (open) {
      setDraftPreset(timeFilter);
      setDraftRange(dateRange);
    }
  };
  const applyPeriod = () => {
    if (draftRange?.from) {
      setDateRange(draftRange);
    } else {
      setTimeFilter(draftPreset);
      setDateRange(undefined);
    }
    setDateOpen(false);
  };
  const clearPeriod = () => {
    setTimeFilter('All');
    setDateRange(undefined);
    setDraftPreset('All');
    setDraftRange(undefined);
    setDateOpen(false);
  };

  // Fetch all data (no server-side dept filter — we multi-filter client-side)
  const { data, isLoading, error } = useQuery(executiveSummaryQueryOptions('All'));

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

    // Step 2: Apply time filter (custom date range takes precedence over FYTD presets)
    const timeFiltered = deptFiltered.filter((row) => {
      if (dateRange?.from) {
        if (!row.latest_submission_time) return false;
        const subT = new Date(row.latest_submission_time).getTime();
        const fromT = new Date(dateRange.from).setHours(0, 0, 0, 0);
        const toT = dateRange.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : now.getTime();
        return subT >= fromT && subT <= toT;
      }
      if (timeFilter === 'All') return true;
      if (!row.latest_submission_time) return false;
      const subTime = new Date(row.latest_submission_time).getTime();
      const diffDays = (now.getTime() - subTime) / (1000 * 3600 * 24);
      switch (timeFilter) {
        case 'FYTD':
          return true; // All data year-to-date
        case 'Last 7 days':
          return diffDays <= 7;
        case 'Last 15 days':
          return diffDays <= 15;
        case 'Last 1 month':
          return diffDays <= 30;
        case 'Last 2 months':
          return diffDays <= 60;
        default:
          return true;
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
    // Outstanding is a point-in-time ERP snapshot, NOT transactional: track the
    // LATEST submitted week's balance per department (within the filtered range).
    const latestOutstanding = new Map<string, { week: number; value: number }>();

    const processedData: ProcessedExecutiveRow[] = filteredData.map((row) => {
      const safeTarget = Number(row.weekly_target_amount) || 0;
      const safeSales = Number(row.total_sales_achieved) || 0;
      const safeColl = Number(row.total_collection_amount) || 0;
      const safeOutstanding = Number(row.outstanding_amount) || 0;

      runTarget += safeTarget;
      runSales += safeSales;
      runColl += safeColl;

      const prevOut = latestOutstanding.get(row.department_name);
      if (!prevOut || row.week_number >= prevOut.week) {
        latestOutstanding.set(row.department_name, {
          week: row.week_number,
          value: safeOutstanding
        });
      }

      // sales is full rupees, target is Crores → convert sales to Cr (÷1e7) for
      // a correct achievement %.
      const sales_ach_pct =
        safeTarget > 0 ? parseFloat(((safeSales / 1e7 / safeTarget) * 100).toFixed(1)) : 0;

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
      runTarget > 0 ? parseFloat(((runSales / 1e7 / runTarget) * 100).toFixed(1)) : 0;
    const overallCollEffPct =
      runSales > 0 ? parseFloat(((runColl / runSales) * 100).toFixed(1)) : 0;

    // Company outstanding = sum of each department's LATEST outstanding balance
    // (never a sum across weeks — that would double-count a point-in-time value).
    let totalOutstanding = 0;
    latestOutstanding.forEach((v) => {
      totalOutstanding += v.value;
    });

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
      // Chart plots in Crores (the target's native unit): convert sales → Cr.
      entry.total_sales_achieved += row.total_sales_achieved / 1e7;
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
          weekSales: new Map()
        });
      }
      const d = deptMap.get(dept)!;
      d.totalTarget += row.weekly_target_amount;
      d.totalSales += row.total_sales_achieved;
      d.totalColl += row.total_collection_amount;

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
            ? parseFloat(((val.totalSales / 1e7 / val.totalTarget) * 100).toFixed(1))
            : 0
      });
    });

    // Outstanding heatmap — each department's LATEST outstanding balance.
    const outstandingData: OutstandingEntry[] = [];
    latestOutstanding.forEach((v, dept) => {
      outstandingData.push({
        department: dept,
        outstanding: v.value
      });
    });

    // Momentum: compare latest two weeks per department
    const allWeeks = Array.from(new Set(processedData.map((r) => r.week_number))).sort(
      (a, b) => a - b
    );

    const currentWeek = allWeeks[allWeeks.length - 1];
    const previousWeek = allWeeks.length > 1 ? allWeeks[allWeeks.length - 2] : currentWeek;

    const momentumData: MomentumEntry[] = [];
    deptMap.forEach((val, dept) => {
      momentumData.push({
        department: dept,
        currentWeekSales: val.weekSales.get(currentWeek) || 0,
        previousWeekSales: val.weekSales.get(previousWeek) || 0
      });
    });

    // Collection efficiency per week (capped to 1 decimal)
    const weekAggMap = new Map<number, { sales: number; collections: number }>();
    processedData.forEach((row) => {
      if (!weekAggMap.has(row.week_number)) {
        weekAggMap.set(row.week_number, { sales: 0, collections: 0 });
      }
      const w = weekAggMap.get(row.week_number)!;
      w.sales += row.total_sales_achieved;
      w.collections += row.total_collection_amount;
    });

    const collectionEfficiencyData: CollectionEfficiencyWeek[] = Array.from(weekAggMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([week, val]) => ({
        week,
        efficiencyPct:
          val.sales > 0 ? parseFloat(((val.collections / val.sales) * 100).toFixed(1)) : 0
      }));

    // Top & Low performers
    const sortedDepts = [...departmentRanking].sort((a, b) => b.achievementPct - a.achievementPct);
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
  }, [data, timeFilter, selectedDepts, dateRange]);

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

  // CSV export of the current weekly matrix (respects active filters)
  const exportCsv = () => {
    if (!processedData.length) return;
    const header = [
      'Week',
      'Department',
      'Target (Cr)',
      'Sales (Cr)',
      'Collections (Cr)',
      'Outstanding (Cr)',
      'Sales Ach %',
      'Coll Eff %'
    ];
    const esc = (v: unknown) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = processedData.map((r) =>
      [
        `W${r.week_number}`,
        r.department_name,
        r.weekly_target_amount,
        r.total_sales_achieved,
        r.total_collection_amount,
        r.outstanding_amount,
        r.sales_ach_pct,
        r.coll_eff_pct
      ]
        .map(esc)
        .join(',')
    );
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Expose the (filter-aware) export to the sidebar Settings panel
  useEffect(() => {
    registerExport(exportCsv, processedData.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-register when filtered data changes
  }, [processedData, registerExport]);

  // ─── Error State ──────────────────────────────────────────────────────
  if (error) {
    return (
      <div className='flex h-96 items-center justify-center text-destructive'>
        Failed to load dashboard data: {error.message}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className='space-y-6'>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Executive Sales Overview</h1>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Real-time performance dashboard for sales and collections
          </p>
        </div>

        {/* Filters Row */}
        <div className='flex flex-wrap items-center gap-2'>
          {/* Integrated Period filter: FYTD presets + custom calendar range */}
          <Popover open={dateOpen} onOpenChange={openPeriod}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className={`h-9 w-[200px] justify-start gap-2 text-xs font-medium ${
                  dateRange?.from ? 'border-primary/50 text-primary' : ''
                }`}
              >
                <IconCalendar className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
                <span className='truncate'>
                  {dateRange?.from
                    ? dateRange.to
                      ? `${fmtRange(dateRange.from)} – ${fmtRange(dateRange.to)}`
                      : fmtRange(dateRange.from)
                    : (PERIOD_PRESETS.find((p) => p.value === timeFilter)?.label ??
                      'FYTD Performance')}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align='start' className='w-auto p-0'>
              <div className='flex flex-col sm:flex-row'>
                <div className='flex flex-col gap-1 border-b p-2 sm:border-b-0 sm:border-r'>
                  {PERIOD_PRESETS.map((p) => (
                    <Button
                      key={p.value}
                      variant={!draftRange?.from && draftPreset === p.value ? 'secondary' : 'ghost'}
                      size='sm'
                      className='h-8 justify-start text-xs font-medium'
                      onClick={() => {
                        setDraftPreset(p.value);
                        setDraftRange(undefined);
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
                <Calendar
                  mode='range'
                  selected={draftRange}
                  onSelect={(r) => setDraftRange(r)}
                  numberOfMonths={2}
                  defaultMonth={draftRange?.from}
                  captionLayout='dropdown'
                  startMonth={new Date(2024, 0)}
                  endMonth={new Date(2027, 11)}
                  classNames={{
                    months: 'flex flex-col sm:flex-row gap-6',
                    dropdowns: 'flex items-center justify-center gap-2',
                    dropdown_root:
                      'relative inline-flex items-center rounded-md border bg-background px-2 py-1 hover:bg-accent',
                    caption_label: 'flex items-center gap-1 text-sm font-medium',
                    dropdown: 'absolute inset-0 h-full w-full cursor-pointer opacity-0'
                  }}
                />
              </div>
              <div className='flex items-center justify-between gap-2 border-t px-3 py-2'>
                <span className='text-[11px] text-muted-foreground'>
                  {draftRange?.from ? 'Custom range selected' : 'Preset or custom range'}
                </span>
                <div className='flex gap-2'>
                  <Button variant='ghost' size='sm' className='h-7 text-xs' onClick={clearPeriod}>
                    Clear
                  </Button>
                  <Button size='sm' className='h-7 text-xs' onClick={applyPeriod}>
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Department Multi-Select */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='h-9 gap-2 text-xs font-medium'>
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
                  <span className='flex flex-col leading-tight'>
                    <span>{dept}</span>
                    {departmentHead(dept) && (
                      <span className='text-[10px] text-muted-foreground'>
                        {departmentHead(dept)}
                      </span>
                    )}
                  </span>
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
          {/* SECTION 0: Infrastructure health monitor (toggle in settings) */}
          {showHealth && <ExecutiveHealthWidget />}

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
            <div className='lg:col-span-8'>
              <ExecutiveBarChart data={chartData} />
            </div>
            <div className='lg:col-span-4'>
              <ExecutiveTargetGauge
                salesAchieved={totals?.totalSales ?? 0}
                totalTarget={totals?.totalTarget ?? 0}
                achievementPct={totals?.overallSalesAchPct ?? 0}
              />
            </div>
          </div>

          {/* SECTION 2b: Department Performance (full width for roomy bars + labels) */}
          <ExecutiveDeptRanking data={departmentRanking} />

          {/* SECTION 3: Diagnostic Widgets */}
          <ExecutiveDiagnosticWidgets
            outstandingData={outstandingData}
            momentumData={momentumData}
            collectionEfficiencyData={collectionEfficiencyData}
            topPerformer={topPerformer}
            lowPerformer={lowPerformer}
          />

          {/* SECTION 3b: Department Remarks */}
          <ExecutiveRemarksPanel />

          {/* SECTION 4: Performance Matrix */}
          <ExecutiveTable data={processedData} />
        </div>
      )}
    </div>
  );
}
