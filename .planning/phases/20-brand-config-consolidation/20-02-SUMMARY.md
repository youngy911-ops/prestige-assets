---
phase: 20-brand-config-consolidation
plan: 02
subsystem: ui
tags: [tailwind, css-custom-properties, brand, semantic-tokens]

requires: []
provides:
  - Zero hardcoded hex colors in component/app files
  - All colors use semantic Tailwind tokens backed by CSS custom properties in globals.css
  - Hex smoke test in brand.test.ts enabled and passing
affects: [brand-config-consolidation, ui]

tech-stack:
  added: []
  patterns:
    - "text-destructive / bg-destructive / hover:text-destructive instead of hardcoded #F87171"
    - "bg-card instead of hardcoded #111f11 for elevated surfaces"
    - "bg-background instead of hardcoded #166534 for page-level backgrounds"
    - "ring-offset-background instead of hardcoded #0a1a0a for ring offsets"
    - "global-error.tsx uses inline hex (#0f1f0f, #3a7a3a) — intentional, CSS unavailable at error boundary"

key-files:
  created:
    - src/__tests__/brand.test.ts (hex smoke test, expanded from Plan 01 skeleton)
  modified:
    - src/components/asset/PhotoThumbnailGrid.tsx
    - src/components/auth/LoginForm.tsx
    - src/components/asset/UploadProgressIndicator.tsx
    - src/components/asset/PhotoThumbnail.tsx
    - src/components/asset/PhotoUploadZone.tsx
    - src/components/asset/OutputPanel.tsx
    - src/components/asset/AssetList.tsx
    - src/app/(app)/layout.tsx
    - src/app/(app)/assets/new/page.tsx
    - src/app/global-error.tsx

key-decisions:
  - "global-error.tsx keeps inline hex styles — error boundary renders before CSS loads, so Tailwind classes are unavailable; updated hex to brand-matching values (#0f1f0f, #3a7a3a)"
  - "bg-[#166534] in layout.tsx replaced with bg-background — body background already controls the deep dark green viewport fill, layout wrapper alignment is cosmetic"
  - "bg-[#111f11] in AssetList dropdown replaced with bg-card — card token (oklch 0.20) is the correct elevated surface color"

patterns-established:
  - "Use text-destructive for error text (not #F87171)"
  - "Use bg-card for elevated dark surfaces (not raw hex)"
  - "Use bg-background for full-page backgrounds (not raw hex)"
  - "Use ring-offset-background for ring offsets (not raw hex)"

requirements-completed: [BRAND-03]

duration: 2min
completed: 2026-04-16
---

# Phase 20 Plan 02: Brand Config Consolidation — Hex Color Replacement Summary

**Replaced all hardcoded hex color values (#F87171, #166534, #111f11, #0a1a0a) across 10 component and app files with semantic Tailwind tokens backed by CSS custom properties, and enabled the BRAND-03 hex smoke test**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-16T11:24:57Z
- **Completed:** 2026-04-16T11:27:39Z
- **Tasks:** 2
- **Files modified:** 11 (10 source + 1 test)

## Accomplishments
- 12 hardcoded hex occurrences eliminated across 10 files — all replaced with semantic Tailwind tokens
- global-error.tsx inline hex updated to brand-matching values (#0f1f0f, #3a7a3a) — intentional exception for pre-CSS error boundary
- brand.test.ts hex smoke test unskipped and expanded to cover all 4 banned hex values; all 11 brand tests passing

## Task Commits

1. **Task 1: Replace hardcoded hex colors with semantic Tailwind tokens** - `fb50c4a` (feat)
2. **Task 2: Enable hex smoke test and run full validation** - `0e26145` (test)

**Plan metadata:** (docs commit — see final commit below)

## Files Created/Modified
- `src/components/asset/PhotoThumbnailGrid.tsx` - text-[#F87171] → text-destructive
- `src/components/auth/LoginForm.tsx` - text-[#F87171] → text-destructive
- `src/components/asset/UploadProgressIndicator.tsx` - bg-[#F87171]/60 → bg-destructive/60
- `src/components/asset/PhotoThumbnail.tsx` - hover:text-[#F87171] → hover:text-destructive
- `src/components/asset/PhotoUploadZone.tsx` - text-[#F87171] (x2) → text-destructive
- `src/app/(app)/assets/new/page.tsx` - text-[#F87171] → text-destructive
- `src/components/asset/OutputPanel.tsx` - ring-offset-[#0a1a0a] → ring-offset-background
- `src/components/asset/AssetList.tsx` - bg-[#111f11] → bg-card
- `src/app/(app)/layout.tsx` - bg-[#166534] → bg-background
- `src/app/global-error.tsx` - #166534 → #0f1f0f; #059669 → #3a7a3a
- `src/__tests__/brand.test.ts` - Unskipped and expanded hex smoke test (BRAND-03)

## Decisions Made
- `global-error.tsx` keeps inline hex (not Tailwind classes) — CSS is not loaded at error boundary render time; hex values were updated to match brand palette
- `bg-[#166534]` in layout.tsx replaced with `bg-background` — the body already sets the deep dark green viewport color; layout wrapper alignment is purely semantic
- `bg-[#111f11]` in AssetList dropdown replaced with `bg-card` — the card token (oklch 0.20 0.05 148) is the correct elevated surface color semantically

## Deviations from Plan

None — plan executed exactly as written. One minor adjustment: PhotoUploadZone.tsx had 2 identical strings at different indentation levels; `replace_all` caught the first two but the third needed a targeted edit (resolved in same task).

## Issues Encountered

Pre-existing test failures in `PhotoUploadZone.test.tsx` (4 tests) and other unrelated test files were observed but are out of scope — they fail due to `invariant expected app router to be mounted` (missing Next.js router test setup) and are not caused by color class changes. Logged to deferred items.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- BRAND-03 fully satisfied: zero hardcoded hex in component files, smoke test enforcing it
- All brand colors now controlled via CSS custom properties in globals.css
- Phase 20 plans 01 and 02 complete; brand config consolidation finished

---
*Phase: 20-brand-config-consolidation*
*Completed: 2026-04-16*
