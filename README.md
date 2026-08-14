# MalVector Track

Vector intervention distribution, disposal & insecticide resistance monitoring
for Ghana's National Malaria Elimination Programme (NMEP).

CSCD602 Advanced Software Engineering — Individual Project-Based Examination.
Implements the MVP (FR-1–FR-5) as scoped in `SRS_Effort_Estimation.docx` and
designed in `System_Design.docx`.

**Live application:** https://malvector-track.vercel.app
**Repository:** https://github.com/DayoMama/malvector-track

> **Note on how this was built and verified:** this codebase was originally
> generated in an environment with no network access, so early versions were
> only syntax-checked, not run live. It has since been deployed to a real
> Supabase project and Vercel, and tested end-to-end through the actual UI as
> both District Officer and Admin roles. That process surfaced and fixed
> three real defects — two Row Level Security misconfigurations and one
> missing cross-field validation — documented in full in
> `Testing_Report.docx` and `Technical_Debt_Plan.docx`.

## 1. Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) project
- A [Vercel](https://vercel.com) account for deployment

## 2. Local setup

```bash
npm install
cp .env.local.example .env.local
# edit .env.local with your Supabase project URL + publishable (anon) key
```

## 3. Database setup

In the Supabase SQL editor, run in order:

1. `supabase/schema.sql` — creates tables, indexes, and RLS policies
2. Create your first users via **Authentication > Users > Add user** in the
   Supabase dashboard (one with role you'll assign as `admin`, one or more as
   `officer`)
3. `supabase/seed.sql` — districts, plus profile rows linking `profiles` to
   the auth users you just created (fill in their UUIDs)
4. `supabase/fixes.sql` — two RLS fixes required for the app to work
   correctly: (a) an `is_admin()` helper function that resolves an infinite
   recursion bug in the `profiles` SELECT policy, and (b) a missing INSERT
   policy on `disposal_items` that otherwise silently blocks disposal
   tracking for District Officers. See `Testing_Report.docx` (TR-1, TR-2)
   for full root-cause detail.
5. If you have existing `distribution_cycles` rows created before step 4,
   run the backfill in `supabase/backfill_disposal_items.sql` to generate
   their missing `disposal_items` rows.

## 4. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`.

## 5. Run tests

```bash
npm test
```

`tests/disposal.test.js` covers the shared due-date computation logic
(`lib/disposal.js`) and passes. This is a starting point, not full coverage —
see `Technical_Debt_Plan.docx` for what's intentionally deferred, notably:
- Integration tests against the API routes (`app/api/**/route.js`)
- RLS tests: confirm an officer in District A cannot read/write District B's
  rows
- Automated regression tests for the two RLS defects fixed in
  `supabase/fixes.sql`, so future policy changes can't silently reintroduce
  them

## 6. Deploy

1. Push this repo to GitHub
2. Import it in Vercel
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as
   Vercel environment variables (the Supabase "Publishable key" is used as
   the anon key value)
4. Deploy
5. Run `supabase/fixes.sql` (see Section 3, step 4) against your Supabase
   project — the app will not function correctly without it

Live URL, admin/officer test credentials, and the repo link are recorded in
`Deployment_and_Source_Links.txt` per the exam's Part C submission format.

## 7. What's implemented (MVP scope)

| Requirement | Status |
|---|---|
| FR-1 Login with role-based routing | ✅ Implemented and tested |
| FR-2 Log distribution cycle | ✅ Implemented and tested |
| FR-3 Auto-flag disposal/replacement + mark done | ✅ Implemented and tested |
| FR-4 Record resistance result | ✅ Implemented |
| FR-5 Admin dashboard (compliance, hotspots, redistribution flags) | ✅ Implemented and tested |
| FR-6 Manage users (Should-have) | ❌ not implemented — see Technical_Debt_Plan.docx |
| FR-7 Export CSV (Should-have) | ❌ not implemented — see Technical_Debt_Plan.docx |
| FR-8–FR-10 (map view, alerts, offline) | ❌ explicitly deferred — Future Evolution |

See `Testing_Report.docx` Section 4 for the small number of checks (direct
URL access control, resistance-form submission) not explicitly re-verified
after the RLS fixes and flagged for a final pass rather than assumed to pass.

## 8. Project structure

```
app/
  login/            UC-1 Login
  distribution/      UC-2 Log Distribution Cycle
  disposal/          UC-3 Track Disposal & Replacement
  resistance/         UC-4 Record Resistance Result
  dashboard/          UC-5 Admin Dashboard
  api/                Route handlers (server-side validation + Supabase writes)
lib/
  supabaseClient.js   Browser Supabase client
  supabaseServer.js   Server Supabase client (cookie-aware, for RLS)
  disposal.js         Shared due-date logic (resolves TD-6 duplication)
middleware.js         Session refresh + route protection
supabase/
  schema.sql          Tables, indexes, RLS policies
  seed.sql            Synthetic sample data (disclosed per SRS 1.2)
  fixes.sql            RLS fixes found during live testing — required, see Section 3
  backfill_disposal_items.sql   One-time backfill for pre-fix data
tests/
  disposal.test.js    Unit tests for lib/disposal.js
```

## 9. Acknowledged tools

Built with AI pair-programming assistance (Claude), disclosed per
Examination Rule 6. See SRS Section 2.5 (Assumptions and Dependencies).
