/**
 * Tailwind utility classes that re-theme Recharts internals so axes, grid lines
 * and tick labels stay readable in BOTH light and dark mode.
 *
 * Why: the theme tokens are OKLCH values, so inline `fill='hsl(var(--border))'`
 * is invalid CSS and silently fails (axes/grid vanish — worst in dark mode).
 * Targeting Recharts' own class names with Tailwind colour utilities applies the
 * colour via real CSS, where `var()` resolves correctly and adapts per theme.
 *
 * Apply to the wrapper <div> around <ResponsiveContainer>.
 */
export const chartThemeClass = [
  '[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground',
  '[&_.recharts-cartesian-grid_line]:stroke-border/60',
  '[&_.recharts-cartesian-axis-line]:stroke-border/50',
  '[&_.recharts-cartesian-axis-tick-line]:stroke-border/50'
].join(' ');
