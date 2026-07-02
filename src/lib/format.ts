export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      ...opts
    }).format(new Date(date));
  } catch {
    return '';
  }
}

/**
 * Shared number formatting for the Executive dashboard.
 *
 * Money is stored in the DB as FULL RUPEES (raw precision, never rounded in the
 * database). These helpers format for DISPLAY only, using Indian business units:
 *   < ₹1 L       → grouped rupees    (₹95,400)
 *   ₹1 L – <₹1 Cr → Lakhs, ≤1 dp      (₹27.6 L)
 *   ≥ ₹1 Cr      → Crores, ≤2 dp      (₹12.45 Cr)
 */

/** Round to at most 1 decimal place, dropping a trailing `.0` (169.44 → "169.4", 169 → "169"). */
export function formatNumber1(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Percentage with a maximum of 1 decimal place: `169.43999999999997` → `"169.4%"`. */
export function formatPercent(value: number): string {
  return `${formatNumber1(value)}%`;
}

// Round to `maxDecimals` and drop trailing zeros: 12.40 → "12.4", 12.00 → "12".
function trimDecimals(n: number, maxDecimals: number): string {
  const f = 10 ** maxDecimals;
  return String(Math.round(n * f) / f);
}

/**
 * Format a FULL-RUPEE amount for display (₹ / L / Cr). The stored value is never
 * mutated — only its presentation. e.g. 2760660 → "₹27.6 L", 124500000 → "₹12.45 Cr".
 */
export function formatINR(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '₹0';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${sign}₹${trimDecimals(abs / 1e7, 2)} Cr`;
  if (abs >= 1e5) return `${sign}₹${trimDecimals(abs / 1e5, 1)} L`;
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
}

/** Same tiers as {@link formatINR} but without the ₹ prefix (dense table cells / chart axes). */
export function formatINRValue(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '0';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${sign}${trimDecimals(abs / 1e7, 2)} Cr`;
  if (abs >= 1e5) return `${sign}${trimDecimals(abs / 1e5, 1)} L`;
  return `${sign}${Math.round(abs).toLocaleString('en-IN')}`;
}

/**
 * Money fields (sales_achieved, collection_amount, outstanding_amount) are stored
 * in FULL RUPEES → format to ₹ / L / Cr. Canonical name for the rupee formatter.
 */
export const formatCurrencyFromRupees = formatINR;

/**
 * weekly_target_amount (master_targets) is stored ALREADY IN CRORES — display it
 * directly as Crores, never via the rupee formatter.
 *   23 → "₹23 Cr" · 29.43 → "₹29.43 Cr" · 450 → "₹450 Cr"
 */
export function formatTargetCrores(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '₹0';
  const sign = value < 0 ? '-' : '';
  return `${sign}₹${trimDecimals(Math.abs(value), 2)} Cr`;
}
