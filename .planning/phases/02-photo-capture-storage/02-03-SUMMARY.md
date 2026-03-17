---
phase: 02-photo-capture-storage
plan: 03
subsystem: ui
tags: [dnd-kit, react, nextjs, supabase, server-component, presigned-url]

# Dependency graph
requires:
  - phase: 02-photo-capture-storage
    provides: PhotoThumbnail, PhotoUploadZone, photo.actions (updatePhotoOrder, removePhoto), PhotoItem type
  - phase: 01-foundation
    provides: Supabase server client, auth middleware, asset schema, createAsset action

provides:
  - PhotoThumbnailGrid — dnd-kit sortable grid with drag-to-reorder + updatePhotoOrder persistence
  - /assets/[id]/photos Server Component page — loads photos with presigned URLs, renders upload zone + next navigation
  - /assets/[id]/edit-type stub page — Back button target from photos page
  - Wizard redirect to /assets/[id]/photos after createAsset

affects: phase-03-ai-extraction, phase-04-review-form, phase-05-output-formatter

# Tech tracking
tech-stack:
  added: []
  patterns:
    - dnd-kit rectSortingStrategy with PointerSensor distance:8 activationConstraint for mobile tap-drag separation
    - PhotoThumbnailGrid wraps PhotoThumbnail with useSortable; parent page owns photos state (not grid)
    - Optimistic reorder update on drag end without revalidatePath; revert on Server Action failure
    - Server Component generates presigned URLs (createSignedUrl 3600s) before passing to client PhotoUploadZone

key-files:
  created:
    - src/components/asset/PhotoThumbnailGrid.tsx
    - src/app/(app)/assets/[id]/photos/page.tsx
    - src/app/(app)/assets/[id]/edit-type/page.tsx
  modified:
    - src/components/asset/PhotoUploadZone.tsx
    - src/app/(app)/assets/new/page.tsx
    - src/__tests__/PhotoThumbnailGrid.test.tsx

key-decisions:
  - "Test used container.querySelectorAll('img') instead of getAllByRole('img') — img alt='' makes role=presentation in ARIA, not img"
  - "PhotoThumbnailGrid.handleRemove owns removal (calls removePhoto action); PhotoUploadZone.handleRemove removed to avoid duplication"
  - "Uploading placeholders moved to separate grid above PhotoThumbnailGrid in PhotoUploadZone photos-present state"

patterns-established:
  - "Pattern: dnd-kit distance:8 PointerSensor prevents tap-drag conflict on mobile — apply to all future sortable grids"
  - "Pattern: Server Component generates presigned URLs; Client Component receives them as initialPhotos prop"

requirements-completed: [PHOTO-01, PHOTO-02, PHOTO-03]

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 2 Plan 3: PhotoThumbnailGrid, Photos Page, and Wizard Redirect Summary

**dnd-kit drag-to-reorder photo grid (rectSortingStrategy, distance:8 mobile constraint) with Server Component photos page loading presigned URLs and wizard redirecting to /photos after asset creation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T14:41:12Z
- **Completed:** 2026-03-17T14:45:00Z
- **Tasks:** 2
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- PhotoThumbnailGrid wraps PhotoThumbnail with dnd-kit (rectSortingStrategy, PointerSensor distance:8 activationConstraint); optimistic reorder + updatePhotoOrder Server Action persistence
- Photos page Server Component: loads asset + photos + presigned URLs, renders PhotoUploadZone + extraction_stale banner + Next button (extract or review based on photo count)
- Updated wizard to redirect to /assets/[id]/photos after createAsset; edit-type stub created for Back navigation

## Task Commits

1. **Task 1: PhotoThumbnailGrid + tests** - `cb31169` (feat)
2. **Task 2: Photos page + wizard redirect** - `451097a` (feat)

## Files Created/Modified

- `src/components/asset/PhotoThumbnailGrid.tsx` — dnd-kit sortable grid; calls updatePhotoOrder on drag end; drag disabled during upload
- `src/__tests__/PhotoThumbnailGrid.test.tsx` — 3 real tests replacing Wave 0 stubs (thumbnail count, cover badge once, empty array)
- `src/components/asset/PhotoUploadZone.tsx` — updated to use PhotoThumbnailGrid instead of plain grid; handleRemove removed (owned by grid now)
- `src/app/(app)/assets/[id]/photos/page.tsx` — Server Component: auth check, asset load, photos + presigned URLs, extraction_stale banner, PhotoUploadZone, Next navigation
- `src/app/(app)/assets/[id]/edit-type/page.tsx` — stub redirecting to /photos (Phase 4/6 concern)
- `src/app/(app)/assets/new/page.tsx` — one-line change: router.push to /assets/[id]/photos

## Decisions Made

- Used `container.querySelectorAll('img')` in tests instead of `getAllByRole('img')` — images with `alt=""` have ARIA role "presentation", not "img", so Testing Library's role-based query fails.
- PhotoThumbnailGrid now owns removePhoto calls; removed duplicate `handleRemove` from PhotoUploadZone to avoid double-call.
- Uploading placeholders rendered in a separate grid above PhotoThumbnailGrid (not inside it) to keep dnd-kit items list clean.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test query used wrong ARIA role for decorative images**
- **Found during:** Task 1 (TDD GREEN — tests ran but one failed)
- **Issue:** Plan test used `screen.getAllByRole('img')` but `<img alt="">` has role="presentation" in ARIA, making it invisible to role-based queries
- **Fix:** Changed to `container.querySelectorAll('img')` which queries DOM directly regardless of ARIA role
- **Files modified:** src/__tests__/PhotoThumbnailGrid.test.tsx
- **Verification:** All 3 tests pass
- **Committed in:** cb31169 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Minor test query fix; no scope creep or architectural change.

## Issues Encountered

None beyond the ARIA role deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 complete: staff can create an asset, land on /photos, add photos, reorder them, and proceed to AI extraction or manual review
- Phase 3 (AI extraction): /assets/[id]/extract page is the next route target; GPT-4o call with presigned photo URLs
- Blocker noted in STATE.md: GPT-4o structured output prompt needs empirical testing with real Slattery photos before schema is finalised

---
*Phase: 02-photo-capture-storage*
*Completed: 2026-03-17*

## Self-Check: PASSED

All files confirmed present. All commits confirmed in git log.
