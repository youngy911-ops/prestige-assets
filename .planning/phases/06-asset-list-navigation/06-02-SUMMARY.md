---
phase: 06-asset-list-navigation
plan: 02
subsystem: ui
tags: [next-navigation, tailwind, localStorage, supabase, vitest]

# Dependency graph
requires:
  - phase: 06-01
    provides: getAssets Server Action, AssetSummary type, relativeTime utility, BottomNav, layout integration
provides:
  - AssetStatusBadge component (draft/confirmed variants)
  - AssetCard updated with SCHEMA_REGISTRY displayName, AssetStatusBadge, relativeTime
  - BranchPickerScreen component (first-visit branch selector)
  - AssetList Client Component (branch chip, fetch, loading/error/empty states)
  - page.tsx Client Component shell (localStorage gating, branch picker or list)
  - Output page Book In New Asset button styled consistently
affects:
  - Staff can now navigate to / and see branch asset list (ASSET-03, ASSET-04)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "localStorage-gated Client Component: undefined initial state hydration guard"
    - "AssetList: useEffect getAssets fetch with branch dependency, error/loading/empty states"
    - "Branch chip: inline branch list expand/collapse in AssetList"
    - "AssetStatusBadge: cn() variant pattern for draft/confirmed badge colors"

key-files:
  created:
    - src/components/asset/AssetStatusBadge.tsx
    - src/components/asset/BranchPickerScreen.tsx
    - src/components/asset/AssetList.tsx
  modified:
    - src/components/asset/AssetCard.tsx (SCHEMA_REGISTRY displayName, AssetStatusBadge, relativeTime, spec styling)
    - src/app/(app)/page.tsx (full replacement — use client localStorage-gated shell)
    - src/app/(app)/assets/[id]/output/page.tsx (Book In New Asset button styling)

key-decisions:
  - "page.tsx is a use client component with undefined initial state to prevent hydration mismatch"
  - "Book In New Asset is Link-only (no confirmAsset action) — saveReview already sets status confirmed per RESEARCH Pitfall 5"
  - "Branch change UI is inline expand/collapse list in AssetList (not a native select) for visual consistency"

requirements-completed: [ASSET-03, ASSET-04]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 6 Plan 02: Asset List UI Summary

**AssetStatusBadge, BranchPickerScreen, updated AssetCard, AssetList Client Component with branch chip and fetch states, and localStorage-gated page.tsx shell — completing the asset list and navigation UI**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T01:41:25Z
- **Completed:** 2026-03-21T01:44:13Z
- **Tasks:** 2 (Task 3 is human checkpoint — not executed)
- **Files modified:** 6

## Accomplishments

- AssetStatusBadge: draft (navy `bg-[#1E3A5F] text-white`) and confirmed (muted `bg-white/15 text-white/65`) badge variants using `cn()`
- AssetCard: updated from plan 01 scaffold to full spec — SCHEMA_REGISTRY `displayName`, AssetStatusBadge component, `relativeTime(updated_at)` in Row 3, 3-row card layout per UI-SPEC
- BranchPickerScreen: "Select your branch" heading + body copy, wraps BranchSelector with `selected={null}`
- AssetList: `'use client'` component — `useEffect` calls `getAssets(branch)`, renders loading/error/empty/list states; inline branch chip with expand/collapse to change branch
- page.tsx: full replacement — `'use client'` with `undefined` initial state hydration guard, localStorage read on mount, renders BranchPickerScreen or AssetList
- Output page: Book In New Asset button class updated from border/bg-background to navy fill `bg-[#1E3A5F] h-11` matching project button style
- Full test suite: 207/207 passing

## Task Commits

1. **Task 1: AssetStatusBadge, AssetCard (spec styling), BranchPickerScreen** — `3697dbc` (feat)
2. **Task 2: AssetList Client Component, page.tsx replacement, output page cleanup** — `b450440` (feat)

## Files Created/Modified

- `src/components/asset/AssetStatusBadge.tsx` — New: draft/confirmed badge with cn() variant colors
- `src/components/asset/AssetCard.tsx` — Updated: SCHEMA_REGISTRY displayName, AssetStatusBadge, relativeTime, spec card layout
- `src/components/asset/BranchPickerScreen.tsx` — New: first-visit branch picker screen wrapping BranchSelector
- `src/components/asset/AssetList.tsx` — New: Client Component with getAssets fetch, branch chip, all list states
- `src/app/(app)/page.tsx` — Full replacement: use client localStorage-gated shell
- `src/app/(app)/assets/[id]/output/page.tsx` — Book In New Asset button styling updated

## Decisions Made

- **AssetCard updated (not rewritten):** Plan 01 created AssetCard as a minimal scaffold to pass tests. Plan 02 updated it to match the full UI-SPEC (SCHEMA_REGISTRY, AssetStatusBadge, relativeTime, 3-row layout) while keeping all 6 AssetCard tests green.
- **Book In New Asset is Link-only:** RESEARCH.md Pitfall 5 confirms saveReview already sets `status: 'confirmed'` unconditionally. No `confirmAsset` Server Action needed — the Link to `/assets/new` is sufficient.
- **Branch change UI is inline expand/collapse:** An inline list in AssetList (not a native `<select>`) matches existing BranchSelector visual style.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all components implemented cleanly on first attempt; all 207 tests pass.

## User Setup Required

None — no external service configuration required.

## Next Steps (Human Checkpoint)

Task 3 is a `checkpoint:human-verify` requiring manual browser verification:
1. Run `npm run dev`
2. Verify branch picker on first visit (no localStorage)
3. Verify asset list loads after branch selection
4. Verify branch chip changes branch and re-fetches
5. Verify resume routing (draft → /review, confirmed → /output)
6. Verify bottom nav active states
7. Verify "Book In New Asset" navigates to /assets/new

## Self-Check: PASSED

All output files exist:
- src/components/asset/AssetStatusBadge.tsx — FOUND
- src/components/asset/AssetCard.tsx — FOUND
- src/components/asset/BranchPickerScreen.tsx — FOUND
- src/components/asset/AssetList.tsx — FOUND
- src/app/(app)/page.tsx — FOUND
- src/app/(app)/assets/[id]/output/page.tsx — FOUND

All task commits verified:
- 3697dbc (Task 1) — FOUND
- b450440 (Task 2) — FOUND

---
*Phase: 06-asset-list-navigation*
*Completed: 2026-03-21*
