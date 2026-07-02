# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**MIL Business Snapshot** — an internal sales-and-collections operations platform for Mafatlal Industries Limited, built by customizing the `next-shadcn-dashboard-starter` template (Next.js 16 App Router, React 19, TypeScript 5.7, Tailwind v4, shadcn/ui). The headline surface is the **Executive "Control Tower"** dashboard at `/dashboard/overview`.

> The git repo and the npm project root are **this** folder (`next-shadcn-dashboard-starter/`); the parent workspace folder is not a git repo. Run all commands from here.

## Commands (npm — not bun)

The lockfile is `package-lock.json`; use **npm**, even though some inherited starter docs/scripts mention bun.

```bash
npm install            # or `npm ci` for a clean, lockfile-exact reinstall
npm run dev            # next dev → http://localhost:3000
npm run build          # next build — the primary correctness gate (there is no test suite)
npm run start          # serve the production build
npm run lint           # oxlint
npm run lint:strict    # oxlint --deny-warnings
npm run format         # oxfmt --write .   (format:check to verify only)
npx oxlint path/to/file.tsx   # lint a single file
```

- **No test runner is configured** (no unit/e2e tests). Validate changes with `npm run lint` + `npm run build`.
- Tooling is **oxlint + oxfmt** (Oxc), not ESLint/Prettier — AGENTS.md is stale on this.
- `npm run lint:fix` shells out to `bun format`; if `bun` isn't installed, use `npm run format` instead.
- Style: single quotes, JSX single quotes, no trailing comma, 2-space indent.

## Auth & RBAC — Supabase, enforced in middleware (not Clerk)

`src/middleware.ts` is the security boundary and runs on every non-static route. It creates a Supabase SSR client, reads the session user, and looks up `user_profiles.role`:

- **Unauthenticated** → redirected to `/auth/sign-in`.
- **`sales` role** → may access **only `/submit`**; any other path redirects back to `/submit`.
- **`management` role** → may access `/dashboard/*` and `/submit`; lands on `/dashboard/overview` after sign-in.

This is real **server-side** RBAC keyed on a Supabase table — not the starter's client-side Clerk nav filtering that AGENTS.md / `docs/nav-rbac.md` describe. `@clerk/nextjs` is still a dependency and some unused starter routes remain (`workspaces`, `billing`, `exclusive`, `profile`), but the **active** auth/RBAC is Supabase.

## Data layer & the Executive Control Tower

- Supabase clients live in `src/utils/supabase/` (`client.ts`, `server.ts`), reading `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (privileged server actions).
- Per-feature API layer is the starter pattern: `api/types.ts → api/service.ts → api/queries.ts` with React Query key factories. Supabase calls live in `service.ts` — e.g. `src/features/executive/api/service.ts` reads the `v_executive_summary` Postgres view plus the `sales_submissions` and `system_notifications` tables.
- **Executive dashboard** (`src/features/executive/`, rendered by `src/app/dashboard/overview/page.tsx`): fetches all rows once, then does **all** aggregation client-side in a single large `useMemo` in `executive-dashboard.tsx` (department + time filters, cumulative running totals, rankings, weekly momentum, collection efficiency, top/low performers). Four sections: KPI cards → primary viz (dual-line Sales-vs-Target chart with a custom transparent `Brush`, target gauge, dept ranking) → diagnostic widgets → weekly performance matrix table.
- **Submit feature** (`src/features/submit/`): the `/submit` Sales Entry form (`submit-form.tsx`, with an `editRecord` edit mode that updates instead of inserts) and the **Submission History** module at `/submit/history` (`submission-history.tsx`) — search / week / date filters, edit (reuses the form in a dialog), delete-with-confirm. RLS scopes it: sales → own department (`user_profiles.department_id`); management → read-all, no writes.
- **Units (IMPORTANT — mixed):** money fields (`sales_achieved`, `collection_amount`, `outstanding_amount`) are stored in **FULL RUPEES** → format with `formatCurrencyFromRupees`/`formatINR` (₹/L/Cr). `weekly_target_amount` is stored in **CRORES** → format with `formatTargetCrores` (never the rupee formatter). All in `src/lib/format.ts`. Because of the mismatch, any sales-vs-target ratio converts sales→Cr (÷1e7) first (see achievement-% calcs in `executive-dashboard.tsx`), and the Sales-vs-Target chart plots in Crores. **Outstanding** is an independent ERP snapshot (NOT sales−collection): aggregate as *latest week per department, then sum*. Percentages capped to 1 decimal.

### Backend changes
Default to **frontend-only** work; never silently alter the DB. The agent can't run DDL on Supabase, so any schema/RLS/view change ships as a **`supabase_migration_*.sql`** file the user runs in the Supabase SQL Editor (existing: `_outstanding`, `_submission_history`). Make such changes only when a task explicitly requires them (the user has authorised adding `outstanding_amount`, `user_profiles.department_id`, and additive RLS policies) — and **extend, never modify**, existing policies. Don't touch `middleware.ts` routing/RBAC.

## Environment

The real required vars are in `.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Note that `env.example.txt` is the **stale** starter template (it documents Clerk keyless mode, not Supabase) — don't rely on it for setup.

## Windows dev notes

This project runs on Windows (PowerShell/cmd.exe). If the checkout was **copied** between machines rather than freshly cloned, `node_modules` and `.next` can carry corrupted/stale artifacts that crash the dev server (`Cannot find module '.../lru-cache'`, or a Turbopack `.sst` "system cannot find the file" panic). Fix: `npm ci`, delete `.next`, then `npm run dev`. Keep npm scripts cmd.exe-safe — the `dev` script is plain `next dev`; don't reintroduce Unix syntax like `2>/dev/null` or `;` into them.

## Inherited starter conventions still in force

Verify against code (AGENTS.md's auth/tooling sections are outdated), but these still hold — see [AGENTS.md](./AGENTS.md), [docs/forms.md](./docs/forms.md), [docs/themes.md](./docs/themes.md):

- **React Query** — server `void prefetchQuery()` + `HydrationBoundary`/`dehydrate`, client `useSuspenseQuery`; `useMutation` + `invalidateQueries({ queryKey: keys.all })` for writes.
- **nuqs** for URL state (`useQueryState` client, `searchParamsCache` server, `shallow: true` for tables).
- **Forms** — `useAppForm` + `useFormFields<T>()` from `@/components/ui/tanstack-form`.
- **Page headers** — use `PageContainer` props (`pageTitle`, `pageDescription`, `pageHeaderAction`); don't import `<Heading>` directly.
- **Icons** — starter convention imports via `@/components/icons` (registry, not raw `@tabler/icons-react`). The executive feature imports tabler icons directly — match the surrounding file's style when editing it.
- **shadcn/ui** (style set in `components.json`) — extend `src/components/ui/*`, don't edit them in place.
