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
  modified:
    - src/lib/supabase/server.ts
    - src/lib/review/blocking-fields.ts
    - src/app/(app)/assets/[id]/extract/page.tsx
    - src/app/(app)/assets/[id]/photos/page.tsx

key-decisions:
  - "zodResolver typed as any in useForm — RHF v5 Resolver<Record<string,string>> vs Record<string,unknown> mismatch; typing as any is safe since schema is correctly typed"
  - "Re-extraction conflict banner only shown when dirty fields AND AI returns different non-empty values — prevents spurious banners on clean re-runs"
  - "saveReview uses .eq('user_id', user.id) as ownership guard in addition to RLS — defense in depth"
  - "pin removed from BLOCKING_FIELD_KEYS — PIN is optional per business rules, was incorrectly blocking Save for most asset types"
  - "review/page.tsx omits .eq('user_id', user.id) filter — double filter after .single() returns null in Supabase; RLS enforces ownership"
  - "supabase/server.ts setAll wrapped in try-catch — suppresses Server Component cookie mutation error; middleware handles session refresh"

patterns-established:
  - "Server Action pattern: createClient → getUser → DB op → if(error) return {error} → revalidatePath → redirect (outside try/catch)"
  - "ReviewPageClient owns all review state: checklist, conflictFields, pendingExtraction, saveError"

requirements-completed: [FORM-01, FORM-02, AI-04]

# Metrics
duration: ~90min (including UAT and fixes)
completed: 2026-03-19
---

# Phase 4 Plan 03: Review Workflow Integration Summary

**saveReview Server Action + ReviewPageClient RHF orchestrator wiring the complete /assets/[id]/review end-to-end flow with re-extraction conflict resolution**

## Performance

- **Duration:** ~90 min (including human UAT and fixes)
- **Started:** 2026-03-19T10:48:46Z
- **Completed:** 2026-03-19
- **Tasks:** 3 of 3 (checkpoint approved)
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments
- `saveReview` Server Action: upserts `fields`, `checklist_state`, `status='confirmed'` without touching `extraction_result`; redirects to `/assets/[id]/output` on success
- `ReviewPageClient`: full RHF form orchestrator with real-time checklist recomputation, re-extraction with conflict detection, sticky CTA gated by `canSave()`
- `/assets/[id]/review` page: Server Component that reads asset from DB, passes to client
- TDD: 3 tests covering auth failure, DB failure, and redirect-on-success for `saveReview`
- Human UAT approved — end-to-end flow verified: form pre-fill, confidence highlighting, checklist gating save, save persisting to DB, routing to /output

## Task Commits

Each task was committed atomically:

1. **Task 1: saveReview Server Action (TDD)** - `47239a9` (feat)
2. **Task 2: ReviewPageClient + /assets/[id]/review page** - `b68b395` (feat)
3. **Task 3: Human verification checkpoint** - approved
4. **UAT fixes (4 bugs)** - `831f996` (fix)

## Files Created/Modified
- `src/lib/actions/review.actions.ts` - Server Action: save review data to DB, redirect to output
- `src/__tests__/review.actions.test.ts` - TDD tests: auth error, DB error, redirect on success
- `src/components/asset/ReviewPageClient.tsx` - Client orchestrator: RHF form + checklist + re-extraction + save
- `src/app/(app)/assets/[id]/review/page.tsx` - Server Component: DB read + ReviewPageClient render
- `src/lib/supabase/server.ts` - Wrapped setAll in try-catch for Server Component compatibility
- `src/lib/review/blocking-fields.ts` - Removed 'pin' from blocking keys (optional field)
- `src/app/(app)/assets/[id]/extract/page.tsx` - Added 'capitalize' CSS class to asset type subtitle
- `src/app/(app)/assets/[id]/photos/page.tsx` - Added 'capitalize' CSS class to asset type subtitle

## Decisions Made
- **zodResolver typed as `any`:** RHF v5 Resolver<Record<string,string>> conflicts with Resolver<Record<string,unknown>>; safe as schema is correctly typed at build time
- **Re-extraction conflict detection:** conflicts computed by filtering dirty RHF fields where AI returned a different non-empty value — prevents false positives when AI returns blank values
- **`pin` removed from blocking fields:** UAT confirmed PIN is optional per business rules; was incorrectly blocking Save for nearly all asset types
- **Review page omits `.eq('user_id', user.id)` filter:** RLS enforces ownership; double filter after `.single()` causes Supabase query to return null
- **`setAll` try-catch in server.ts:** Next.js throws on cookie mutation outside Server Action; try-catch is the standard Supabase SSR Server Component pattern

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

**2. [Rule 1 - Bug] supabase/server.ts cookie mutation error in Server Components**
- **Found during:** Task 3 (UAT verification)
- **Issue:** Review page threw "cookies can only be modified in a Server Action or Route Handler" on load, causing intermittent crashes
- **Fix:** Wrapped `setAll` forEach in try-catch with empty catch block; middleware handles actual session refresh
- **Files modified:** `src/lib/supabase/server.ts`
- **Verification:** Review page loaded without error after fix
- **Committed in:** `831f996`

**3. [Rule 1 - Bug] `pin` in BLOCKING_FIELD_KEYS incorrectly blocked Save**
- **Found during:** Task 3 (UAT verification)
- **Issue:** PIN is optional per business rules; blocking key caused Save to be disabled for trucks and most asset types even with VIN/registration filled
- **Fix:** Removed 'pin' from `BLOCKING_FIELD_KEYS`
- **Files modified:** `src/lib/review/blocking-fields.ts`
- **Verification:** Save & Continue enabled after resolving VIN/registration items
- **Committed in:** `831f996`

**4. [Rule 1 - Bug] Redundant `.eq('user_id', user.id)` filter returned null asset**
- **Found during:** Task 3 (UAT verification)
- **Issue:** Double `.eq()` after `.single()` caused the query chain to return null, triggering redirect to /assets/new instead of showing review page
- **Fix:** Removed the redundant user filter from review/page.tsx; RLS already enforces ownership
- **Files modified:** `src/app/(app)/assets/[id]/review/page.tsx`
- **Verification:** Review page loaded correctly with asset data
- **Committed in:** `831f996`

**5. [Rule 2 - Missing] Asset type subtitle not capitalized**
- **Found during:** Task 3 (UAT verification)
- **Issue:** Asset types stored lowercase ('truck', 'excavator') — subtitle displayed as lowercase across pages
- **Fix:** Added `capitalize` CSS class to subtitle `<p>` on extract, photos, and review pages
- **Files modified:** `src/app/(app)/assets/[id]/extract/page.tsx`, `src/app/(app)/assets/[id]/photos/page.tsx`, `src/app/(app)/assets/[id]/review/page.tsx`
- **Verification:** Asset type displayed as "Truck" during UAT
- **Committed in:** `831f996`

---

**Total deviations:** 5 auto-fixed (1 TypeScript type fix, 3 bugs, 1 missing display formatting)
**Impact on plan:** All fixes necessary for correct operation. No scope creep.

## Issues Encountered

**Pre-existing workspace issue (deferred):** `PhotoUploadZone.tsx` had `capture="environment"` removed in a pre-existing uncommitted workspace change, causing its test to fail. This is not introduced by plan 04-03. Documented in `deferred-items.md`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 review workflow complete and UAT-approved
- `saveReview` writes `assets.fields`, `assets.checklist_state`, `assets.status='confirmed'` — Phase 5 can read these to generate descriptions
- `/assets/[id]/output` returns 404 — Phase 5 builds this page
- Phase 5 description generation can begin immediately

---
*Phase: 04-review-form-save*
*Completed: 2026-03-19*
