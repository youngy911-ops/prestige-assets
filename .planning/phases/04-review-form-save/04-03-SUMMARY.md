---
phase: 04-review-form-save
plan: 03
subsystem: ui
tags: [react-hook-form, zod, supabase, next.js, server-actions]

# Dependency graph
requires:
  - phase: 04-01
    provides: buildFormSchema, buildDefaultValues, buildChecklist, canSave utilities
  - phase: 04-02
    provides: DynamicFieldForm, MissingInfoChecklist, FieldRow components

provides:
  - saveReview Server Action (upserts fields + checklist_state + status='confirmed')
  - ReviewPageClient — RHF form orchestrator with re-extraction and conflict resolution
  - /assets/[id]/review page — Server Component reading DB + rendering ReviewPageClient

affects:
  - Phase 05 (output page receives assets confirmed via saveReview)
  - Phase 03 (re-extraction triggered from review page via /api/extract)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Action redirect outside try/catch (Next.js requirement)
    - zodResolver typed as `any` to resolve Record<string,string> vs unknown mismatch in RHF v5+
    - Re-extraction conflict detection: compare dirty RHF fields vs AI values, store pending result

key-files:
  created:
    - src/lib/actions/review.actions.ts
    - src/__tests__/review.actions.test.ts
    - src/components/asset/ReviewPageClient.tsx
    - src/app/(app)/assets/[id]/review/page.tsx
  modified: []

key-decisions:
  - "zodResolver typed as any in useForm — RHF v5 Resolver<Record<string,string>> vs Record<string,unknown> mismatch; typing as any is safe since schema is correctly typed"
  - "Re-extraction conflict banner only shown when dirty fields AND AI returns different non-empty values — prevents spurious banners on clean re-runs"
  - "saveReview uses .eq('user_id', user.id) as ownership guard in addition to RLS — defense in depth"

patterns-established:
  - "Server Action pattern: createClient → getUser → DB op → if(error) return {error} → revalidatePath → redirect (outside try/catch)"
  - "ReviewPageClient owns all review state: checklist, conflictFields, pendingExtraction, saveError"

requirements-completed: [FORM-01, FORM-02, AI-04]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 4 Plan 03: Review Workflow Integration Summary

**saveReview Server Action + ReviewPageClient RHF orchestrator wiring the complete /assets/[id]/review end-to-end flow with re-extraction conflict resolution**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-19T10:48:46Z
- **Completed:** 2026-03-19T10:52:30Z
- **Tasks:** 2 of 3 (checkpoint pending human verification)
- **Files modified:** 4 created

## Accomplishments
- `saveReview` Server Action: upserts `fields`, `checklist_state`, `status='confirmed'` without touching `extraction_result`; redirects to `/assets/[id]/output` on success
- `ReviewPageClient`: full RHF form orchestrator with real-time checklist recomputation, re-extraction with conflict detection, sticky CTA gated by `canSave()`
- `/assets/[id]/review` page: Server Component that reads asset from DB, passes to client
- TDD: 3 tests covering auth failure, DB failure, and redirect-on-success for `saveReview`

## Task Commits

Each task was committed atomically:

1. **Task 1: saveReview Server Action (TDD)** - `47239a9` (feat)
2. **Task 2: ReviewPageClient + /assets/[id]/review page** - `b68b395` (feat)
3. **Task 3: Human verification checkpoint** - pending

## Files Created/Modified
- `src/lib/actions/review.actions.ts` - Server Action: save review data to DB, redirect to output
- `src/__tests__/review.actions.test.ts` - TDD tests: auth error, DB error, redirect on success
- `src/components/asset/ReviewPageClient.tsx` - Client orchestrator: RHF form + checklist + re-extraction + save
- `src/app/(app)/assets/[id]/review/page.tsx` - Server Component: DB read + ReviewPageClient render

## Decisions Made
- **zodResolver typed as `any`:** RHF v5 Resolver<Record<string,string>> conflicts with Resolver<Record<string,unknown>>; safe as schema is correctly typed at build time
- **Re-extraction conflict detection:** conflicts computed by filtering dirty RHF fields where AI returned a different non-empty value — prevents false positives when AI returns blank values

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript error: zodResolver type mismatch**
- **Found during:** Task 2 (ReviewPageClient)
- **Issue:** `zodResolver(schema)` returns `Resolver<Record<string,unknown>>` but `useForm<ReviewFormValues>` expects `Resolver<Record<string,string>>` — `tsc --noEmit` returned error TS2322
- **Fix:** Typed resolver as `any` with explanatory comment — preserves Zod validation while satisfying TypeScript compiler
- **Files modified:** `src/components/asset/ReviewPageClient.tsx`
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `b68b395` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 TypeScript type fix)
**Impact on plan:** Single compiler fix, no behavioral change. No scope creep.

## Issues Encountered

**Pre-existing workspace issue (deferred):** `PhotoUploadZone.tsx` had `capture="environment"` removed in a pre-existing uncommitted workspace change, causing its test to fail. This is not introduced by plan 04-03. Documented in `deferred-items.md`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 review workflow complete — ready for human verification at checkpoint
- After checkpoint approval: Phase 5 (output/description generation) can build on the confirmed asset state
- `/assets/[id]/output` route is the next page to build (Phase 5)

---
*Phase: 04-review-form-save*
*Completed: 2026-03-19*
