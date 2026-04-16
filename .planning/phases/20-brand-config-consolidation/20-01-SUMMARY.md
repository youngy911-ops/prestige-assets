---
phase: 20-brand-config-consolidation
plan: 01
subsystem: ui
tags: [brand, config, constants, qr-code, metadata]

# Dependency graph
requires: []
provides:
  - src/lib/constants/brand.ts — single source of truth for all brand strings and QR domain
  - All 4 consumer files (layout.tsx, login/page.tsx, ReportClient.tsx, output/page.tsx) import BRAND
  - QR domain configurable from one location (brand.ts)
affects: [20-02, any plan touching brand strings or QR codes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Brand constants follow the existing `as const` pattern from branches.ts"
    - "Consumer files import { BRAND } from '@/lib/constants/brand'"

key-files:
  created:
    - src/lib/constants/brand.ts
    - src/__tests__/brand.test.ts
  modified:
    - src/app/layout.tsx
    - src/app/(auth)/login/page.tsx
    - src/components/asset/ReportClient.tsx
    - src/app/(app)/assets/[id]/output/page.tsx

key-decisions:
  - "Smoke test for hex #F87171 added but remains skipped — deferred to Plan 02"
  - "describe/route.ts AI prompt left untouched per plan constraint"

patterns-established:
  - "Brand config pattern: export const BRAND = { ... } as const from src/lib/constants/brand.ts"

requirements-completed: [BRAND-01, BRAND-02]

# Metrics
duration: 5min
completed: 2026-04-16
---

# Phase 20 Plan 01: Brand Config Consolidation Summary

**Single `BRAND` config module wires company name, logo monogram, page metadata, report header/footer, and QR domain to one file — eliminating all hardcoded brand strings from consumer UI files**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-16T11:25:00Z
- **Completed:** 2026-04-16T11:27:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `src/lib/constants/brand.ts` with 7 brand fields following the existing `as const` pattern
- Wired BRAND import into all 4 consumer files — zero hardcoded brand strings remain outside brand.ts and the locked AI prompt
- QR domain (`assetbookintool.com`) now configurable from a single location for both output page and report page
- 9 brand unit tests pass; domain smoke test active and green; hex smoke test skipped (Plan 02)

## Task Commits

1. **Task 1: Create brand config module and tests** - `db45879` (feat)
2. **Task 2: Wire brand config into all consumers** - `86bd9db` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/lib/constants/brand.ts` — Brand config single source of truth with 7 fields
- `src/__tests__/brand.test.ts` — Unit tests for all BRAND fields + smoke tests
- `src/app/layout.tsx` — Metadata title/description from BRAND.appTitle/appDescription
- `src/app/(auth)/login/page.tsx` — Logo monogram and heading from BRAND
- `src/components/asset/ReportClient.tsx` — Report header, footer, and QR domain from BRAND
- `src/app/(app)/assets/[id]/output/page.tsx` — QR domain from BRAND.domain

## Decisions Made

- Smoke test for hardcoded hex `#F87171` added but kept skipped — that cleanup is scoped to Plan 02
- `src/app/api/describe/route.ts` explicitly excluded from changes per plan constraint (AI prompt is locked)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Brand config foundation complete; Plan 02 can now reference BRAND for color/theme consolidation
- All QR codes now configurable from `src/lib/constants/brand.ts` — demo-ready

---
*Phase: 20-brand-config-consolidation*
*Completed: 2026-04-16*
