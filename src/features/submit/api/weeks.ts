// Business-week calendar for the April→March fiscal year.
// Single source of truth shared by the Sales Entry form (week dropdown +
// status colours) and Submission History (3-week visibility/edit window).

export const FISCAL_WEEKS = [
  'Week 1: 01-Apr to 05-Apr',
  'Week 2: 06-Apr to 12-Apr',
  'Week 3: 13-Apr to 19-Apr',
  'Week 4: 20-Apr to 26-Apr',
  'Week 5: 27-Apr to 03-May',
  'Week 6: 04-May to 10-May',
  'Week 7: 11-May to 17-May',
  'Week 8: 18-May to 24-May',
  'Week 9: 25-May to 31-May',
  'Week 10: 01-Jun to 07-Jun',
  'Week 11: 08-Jun to 14-Jun',
  'Week 12: 15-Jun to 21-Jun',
  'Week 13: 22-Jun to 28-Jun',
  'Week 14: 29-Jun to 05-Jul',
  'Week 15: 06-Jul to 12-Jul',
  'Week 16: 13-Jul to 19-Jul',
  'Week 17: 20-Jul to 26-Jul',
  'Week 18: 27-Jul to 02-Aug',
  'Week 19: 03-Aug to 09-Aug',
  'Week 20: 10-Aug to 16-Aug',
  'Week 21: 17-Aug to 23-Aug',
  'Week 22: 24-Aug to 30-Aug',
  'Week 23: 31-Aug to 06-Sep',
  'Week 24: 07-Sep to 13-Sep',
  'Week 25: 14-Sep to 20-Sep',
  'Week 26: 21-Sep to 27-Sep',
  'Week 27: 28-Sep to 04-Oct',
  'Week 28: 05-Oct to 11-Oct',
  'Week 29: 12-Oct to 18-Oct',
  'Week 30: 19-Oct to 25-Oct',
  'Week 31: 26-Oct to 01-Nov',
  'Week 32: 02-Nov to 08-Nov',
  'Week 33: 09-Nov to 15-Nov',
  'Week 34: 16-Nov to 22-Nov',
  'Week 35: 23-Nov to 29-Nov',
  'Week 36: 30-Nov to 06-Dec',
  'Week 37: 07-Dec to 13-Dec',
  'Week 38: 14-Dec to 20-Dec',
  'Week 39: 21-Dec to 27-Dec',
  'Week 40: 28-Dec to 03-Jan',
  'Week 41: 04-Jan to 10-Jan',
  'Week 42: 11-Jan to 17-Jan',
  'Week 43: 18-Jan to 24-Jan',
  'Week 44: 25-Jan to 31-Jan',
  'Week 45: 01-Feb to 07-Feb',
  'Week 46: 08-Feb to 14-Feb',
  'Week 47: 15-Feb to 21-Feb',
  'Week 48: 22-Feb to 28-Feb',
  'Week 49: 01-Mar to 07-Mar',
  'Week 50: 08-Mar to 14-Mar',
  'Week 51: 15-Mar to 21-Mar',
  'Week 52: 22-Mar to 28-Mar',
  'Week 53: 29-Mar to 31-Mar'
];

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11
};

/** Calendar year in which the fiscal year containing `today` started (01-Apr). */
function fiscalYearStart(today: Date): number {
  return today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
}

/**
 * The business week (1–53) containing `today`, derived from FISCAL_WEEKS.
 * Jan–Mar labels belong to the calendar year after the fiscal start.
 */
export function getCurrentWeekNumber(today: Date = new Date()): number {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const fy = fiscalYearStart(t);
  for (let i = 0; i < FISCAL_WEEKS.length; i++) {
    const m = FISCAL_WEEKS[i].match(/^Week (\d+): (\d{2})-([A-Za-z]{3}) to (\d{2})-([A-Za-z]{3})$/);
    if (!m) continue;
    const toDate = (day: string, mon: string) =>
      new Date(MONTHS[mon] >= 3 ? fy : fy + 1, MONTHS[mon], parseInt(day, 10));
    if (t >= toDate(m[2], m[3]) && t <= toDate(m[4], m[5])) return parseInt(m[1], 10);
  }
  return FISCAL_WEEKS.length; // only reachable if the label table has a gap
}

/** Sales users can see / edit / delete only this many trailing business weeks. */
export const SALES_WEEK_WINDOW = 3;

/** True while `weekNumber` is still inside the trailing window ending at `currentWeek`. */
export function isWithinSalesWindow(
  weekNumber: number,
  currentWeek: number = getCurrentWeekNumber()
): boolean {
  return weekNumber > currentWeek - SALES_WEEK_WINDOW;
}

/**
 * The exact week numbers a Sales user may see/edit — the trailing window
 * (current + the SALES_WEEK_WINDOW-1 prior weeks), e.g. [13, 14, 15] on Week 15.
 * Used to scope the Supabase fetch so older rows are never even queried.
 */
export function salesWindowWeeks(currentWeek: number = getCurrentWeekNumber()): number[] {
  const weeks: number[] = [];
  for (let w = Math.max(1, currentWeek - SALES_WEEK_WINDOW + 1); w <= currentWeek; w++) {
    weeks.push(w);
  }
  return weeks;
}

/**
 * Build the `weekly_target_id` values a Sales department may access for the
 * current window — both zero-padded and unpadded forms (W_D03_5 and W_D03_05)
 * so the server `.in(...)` filter matches whatever format a row was stored in.
 */
export function salesWindowTargetIds(
  departmentId: string,
  currentWeek: number = getCurrentWeekNumber()
): string[] {
  const ids = new Set<string>();
  for (const w of salesWindowWeeks(currentWeek)) {
    ids.add(`W_${departmentId}_${w}`);
    ids.add(`W_${departmentId}_${String(w).padStart(2, '0')}`);
  }
  return Array.from(ids);
}
