---
phase: 02-photo-capture-storage
plan: "02"
subsystem: ui
tags: [react, supabase, storage, image-upload, lucide-react, shadcn, tailwind, vitest]

requires:
  - phase: 02-photo-capture-storage-01
    provides: "processImageForUpload (EXIF+resize), insertPhoto/removePhoto/getSignedUrl Server Actions, asset_photos DB table, Storage bucket"

provides:
  - "CoverPhotoBadge: absolute-positioned badge for cover photo (position-0)"
  - "UploadProgressIndicator: per-file upload overlay (Loader2) and error overlay (AlertCircle)"
  - "PhotoThumbnail: single photo card with image, cover badge, upload overlay, remove button (32px), drag handle"
  - "PhotoUploadZone: full upload orchestrator — file picker, EXIF pipeline, Storage upload, DB insert, signed URL display"
  - "PhotoItem interface: exported for downstream use in Plan 03 PhotoThumbnailGrid"

affects:
  - 02-03-photo-thumbnail-grid
  - 03-ai-extraction

tech-stack:
  added: []
  patterns:
    - "PhotoThumbnail uses forwardRef to accept dnd-kit sortable refs from parent (PhotoThumbnailGrid in Plan 03)"
    - "dragHandleProps passthrough via spread — keeps thumbnail pure, drag logic in parent"
    - "TDD pattern: write RED tests against interface before implementation, then GREEN"
    - "Upload flow: processImageForUpload -> supabase.storage.upload (BrowserClient) -> insertPhoto SA -> getSignedUrl SA -> state"
    - "Uploading placeholders via Set<string> of tempIds — cleaned up in finally block per file"

key-files:
  created:
    - src/components/asset/CoverPhotoBadge.tsx
    - src/components/asset/UploadProgressIndicator.tsx
    - src/components/asset/PhotoThumbnail.tsx
    - src/components/asset/PhotoUploadZone.tsx
  modified:
    - src/__tests__/PhotoUploadZone.test.tsx

key-decisions:
  - "PhotoThumbnail accepts dnd-kit props (dragHandleProps, style, isDragging) via passthrough — useSortable called in PhotoThumbnailGrid (Plan 03), not in PhotoThumbnail itself"
  - "PhotoUploadZone renders PhotoThumbnail directly (no dnd-kit) in Plan 02; Plan 03 refactors to PhotoThumbnailGrid wrapper"
  - "Upload placeholder uses Camera+animate-pulse (not UploadProgressIndicator) since tempId items have no signedUrl yet"

patterns-established:
  - "forwardRef pattern for dnd-kit sortable integration: ref + style + dragHandleProps all passed from parent"
  - "80-photo cap: atCap = photos.length >= 80 disables Add Photos button client-side; server also enforces"
  - "Error display: AlertCircle + text-[#F87171] for all upload error states (consistent with app error pattern)"

requirements-completed:
  - PHOTO-01
  - PHOTO-02

duration: 3min
completed: 2026-03-17
---

# Phase 02 Plan 02: Upload Component Suite Summary

**CoverPhotoBadge, UploadProgressIndicator, PhotoThumbnail, and PhotoUploadZone — full upload-side component suite with EXIF+resize pipeline, 80-photo cap, and presigned URL display**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T14:36:10Z
- **Completed:** 2026-03-17T14:38:41Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Built 3 small UI components (CoverPhotoBadge, UploadProgressIndicator, PhotoThumbnail) that compose into the full photo card
- Built PhotoUploadZone orchestrating the full upload pipeline: file selection, EXIF+resize via processImageForUpload, Supabase Storage upload, insertPhoto Server Action, getSignedUrl Server Action, state update
- Replaced Wave 0 test stubs with 4 real passing PhotoUploadZone tests (TDD: RED commit then GREEN implementation)
- Full test suite at 62 passing tests

## Task Commits

Each task was committed atomically:

1. **Task 1: CoverPhotoBadge, UploadProgressIndicator, and PhotoThumbnail** - `6e996f9` (feat)
2. **Task 2 RED: Failing PhotoUploadZone tests** - `40b8796` (test)
3. **Task 2 GREEN: PhotoUploadZone implementation** - `26017ed` (feat)

**Plan metadata:** (docs commit — see below)

_Note: TDD task 2 has two commits (test RED → feat GREEN)_

## Files Created/Modified
- `src/components/asset/CoverPhotoBadge.tsx` - Badge with accent border/bg shown on position-0 thumbnail
- `src/components/asset/UploadProgressIndicator.tsx` - Overlay with Loader2 (uploading) or AlertCircle+red tint (error)
- `src/components/asset/PhotoThumbnail.tsx` - forwardRef card with image, cover badge, upload overlay, 32px remove/drag buttons
- `src/components/asset/PhotoUploadZone.tsx` - Upload orchestrator, file input, empty/photos-present states, PhotoItem export
- `src/__tests__/PhotoUploadZone.test.tsx` - Replaced Wave 0 stubs with 4 real tests

## Decisions Made
- PhotoThumbnail accepts dnd-kit passthrough props (dragHandleProps, style, isDragging) but does not call useSortable itself — keeps component pure and lets PhotoThumbnailGrid (Plan 03) own the drag logic
- PhotoUploadZone uses uploading placeholders with a Set<string> of tempIds (Camera+animate-pulse) rather than UploadProgressIndicator, since temp items have no signedUrl for the img tag yet
- Plan 03 will refactor the inline grid in PhotoUploadZone to PhotoThumbnailGrid

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CoverPhotoBadge, UploadProgressIndicator, PhotoThumbnail, PhotoUploadZone all ready for Plan 03
- PhotoItem interface exported from PhotoUploadZone for PhotoThumbnailGrid consumption
- PhotoThumbnail's forwardRef + dragHandleProps interface is ready for dnd-kit sortable integration
- Plan 03 (PhotoThumbnailGrid + drag-to-reorder) can proceed

---
*Phase: 02-photo-capture-storage*
*Completed: 2026-03-17*

## Self-Check: PASSED

All created files verified present. All task commits (6e996f9, 40b8796, 26017ed) confirmed in git log.
