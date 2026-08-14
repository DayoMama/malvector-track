# MalVector Track

Vector intervention distribution, disposal & insecticide resistance monitoring
for Ghana's National Malaria Elimination Programme (NMEP).

CSCD602 Advanced Software Engineering — Individual Project-Based Examination.
Implements the MVP (FR-1–FR-5) as scoped in `SRS_Effort_Estimation.docx` and
designed in `System_Design.docx`.

> **Note on how this was built:** this codebase was generated in an
> environment with no network access, so it has been syntax-checked
> (Node `--check` for `.js`, an esbuild JSX parse for `.jsx`) but has **not**
> been run against a live `npm install` / `next dev` / real Supabase project.
> Budget time in the Testing & Refinement phase to run it for real, fix
> anything that surfaces, and capture that as your Testing Report evidence.

## 1. Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) project
- A [Vercel](https://vercel.com) account for deployment

## 2. Local setup

```bash
npm install
cp .env.local.example .env.local
# edit .env.local with your Supabase project URL + anon key
```

## 3. Database setup

In the Supabase SQL editor, run in order:

1. `supabase/schema.sql` — creates tables, indexes, and RLS policies
2. Create your first users via **Authentication > Users > Add user** in the
   Supabase dashboard (one with role you'll assign as `admin`, one or more as
   `officer`)
3. `supabase/seed.sql` — districts, plus commented-out example rows showing
   how to link `profiles` to the auth users you just created (uncomment and
   fill in their UUIDs)

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
(`lib/disposal.js`). This is a starting point, not full coverage — see
`Technical_Debt_Plan.docx` (TD-5) for what's intentionally deferred, and
expand this suite during the Testing & Refinement phase with:
- Integration tests against the API routes (`app/api/**/route.js`)
- RLS tests: confirm an officer in District A cannot read/write District B's
  rows (directly related to TD-11, Critical)

## 6. Deploy

1. Push this repo to GitHub
2. Import it in Vercel
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as
   Vercel environment variables
4. Deploy

Record the live URL, admin/officer test credentials, and repo link in
`Deployment_and_Source_Links.txt` per the exam's Part C submission format.

## 7. What's implemented (MVP scope)

| Requirement | Status |
|---|---|
| FR-1 Login with role-based routing | ✅ |
| FR-2 Log distribution cycle | ✅ |
| FR-3 Auto-flag disposal/replacement + mark done | ✅ |
| FR-4 Record resistance result | ✅ |
| FR-5 Admin dashboard (compliance, hotspots, redistribution flags) | ✅ |
| FR-6 Manage users (Should-have) | ❌ not implemented — see Technical_Debt_Plan.docx TD-8 |
| FR-7 Export CSV (Should-have) | ❌ not implemented — see Technical_Debt_Plan.docx TD-8 |
| FR-8–FR-10 (map view, alerts, offline) | ❌ explicitly deferred — Future Evolution |

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
tests/
  disposal.test.js    Unit tests for lib/disposal.js
```

## 9. Acknowledged tools

Built with AI pair-programming assistance (Claude), disclosed per Examination
Rule 6. See SRS Section 2.5 (Assumptions and Dependencies).
