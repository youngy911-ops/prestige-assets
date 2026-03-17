---
phase: 02-photo-capture-storage
plan: 01
subsystem: database
tags: [supabase, storage, rls, image-processing, exifr, browser-image-compression, dnd-kit, server-actions, vitest]

# Dependency graph
requires:
  - phase: 01-foundation-schema-registry
    provides: asset_photos table schema, assets table, createClient server pattern, Server Action mock pattern

provides:
  - Private photos Supabase Storage bucket with 3 RLS policies (insert/select/delete by userId prefix)
  - extraction_stale boolean column on assets table
  - processImageForUpload: EXIF correction via exifr.rotation() + canvas redraw + browser-image-compression
  - insertPhoto Server Action: auth guard + 80-photo cap + extraction_stale update
  - removePhoto Server Action: auth guard + extraction_stale update
  - updatePhotoOrder Server Action: batch sort_order update, no revalidatePath
  - getSignedUrl Server Action: 1-hour signed URL for private bucket
  - photo.actions.test.ts: 9 unit tests covering all 4 actions
  - PhotoUploadZone.test.tsx: Wave 0 stub placeholders for Plan 02
  - PhotoThumbnailGrid.test.tsx: Wave 0 stub placeholders for Plan 03

affects:
  - 02-02-photo-upload-zone (uses insertPhoto, getSignedUrl, processImageForUpload, PhotoUploadZone tests)
  - 02-03-photo-thumbnail-grid (uses updatePhotoOrder, removePhoto, PhotoThumbnailGrid tests)
  - 03-ai-extraction (uses extraction_stale flag and getSignedUrl)

# Tech tracking
tech-stack:
  added:
    - browser-image-compression (client-side JPEG compression to 1920px)
    - exifr (EXIF metadata reading for rotation correction)
    - "@dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities" (drag-and-drop for photo reorder, used in Plan 03)
  patterns:
    - Storage path pattern: {userId}/{assetId}/{filename} — enforced by RLS foldername(name)[1] check
    - extraction_stale pattern: set true on insertPhoto/removePhoto when assets.fields != '{}' — signals Phase 3 re-extraction needed
    - Server Action mock pattern: mockFrom with callCount discriminator for multi-query actions

key-files:
  created:
    - supabase/migrations/20260317000002_photo_storage.sql
    - src/lib/utils/image.ts
    - src/lib/actions/photo.actions.ts
    - src/__tests__/photo.actions.test.ts
    - src/__tests__/PhotoUploadZone.test.tsx
    - src/__tests__/PhotoThumbnailGrid.test.tsx
  modified:
    - package.json (added browser-image-compression, exifr, @dnd-kit/*)
    - package-lock.json

key-decisions:
  - "updatePhotoOrder does NOT call revalidatePath — client does optimistic update; full page revalidation would cause flicker on drag"
  - "processImageForUpload uses canvas redraw to bake EXIF rotation into pixels, then browser-image-compression without preserveExif — ensures GPT-4o receives correctly oriented pixel data in Phase 3"
  - "Storage RLS uses storage.foldername(name)[1] to bind object ownership to userId prefix — path pattern {userId}/{assetId}/{filename}"
  - "extraction_stale conditional on fields != '{}' — only marks stale when extraction has already occurred, avoiding unnecessary re-extraction on fresh assets"

patterns-established:
  - "Multi-query Server Action mock: use callCount discriminator in mockFrom.mockImplementation to return different chain for each DB call"
  - "Wave 0 test stubs: create placeholder tests with expect(true).toBe(true) in Plan 01 so component plans can replace with real tests without changing file structure"

requirements-completed: [PHOTO-01, PHOTO-02, PHOTO-03]

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 02 Plan 01: Photo Storage Foundation Summary

**Private Supabase Storage bucket with 3 RLS policies, EXIF-correcting image processor using exifr + canvas + browser-image-compression, and 4 authenticated Server Actions (insertPhoto/removePhoto/updatePhotoOrder/getSignedUrl) with 60/60 tests passing**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T14:31:01Z
- **Completed:** 2026-03-17T14:33:48Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Storage migration with private `photos` bucket, 3 Storage RLS policies enforcing `{userId}/{assetId}/{filename}` prefix ownership, and `extraction_stale` boolean on assets table
- `processImageForUpload` client utility: reads EXIF rotation with exifr, redraws canvas to bake orientation into pixels (for correct GPT-4o input in Phase 3), compresses to max 1920px JPEG at 0.85 quality
- 4 photo Server Actions with auth guards: `insertPhoto` (80-cap + extraction_stale), `removePhoto` (extraction_stale), `updatePhotoOrder` (no revalidatePath), `getSignedUrl` (1-hour signed URL)
- 9 unit tests for photo actions + Wave 0 stub tests for PhotoUploadZone and PhotoThumbnailGrid — full suite 60/60 green

## Task Commits

Each task was committed atomically:

1. **Task 1: Storage migration + image processing utility** - `96b0d87` (feat)
2. **Task 2: Photo Server Actions + Wave 0 test scaffolds** - `3579df3` (feat)

## Files Created/Modified

- `supabase/migrations/20260317000002_photo_storage.sql` - Private photos bucket, 3 Storage RLS policies, extraction_stale column on assets
- `src/lib/utils/image.ts` - processImageForUpload: exifr EXIF rotation correction + canvas redraw + browser-image-compression pipeline
- `src/lib/actions/photo.actions.ts` - insertPhoto, removePhoto, updatePhotoOrder, getSignedUrl Server Actions
- `src/__tests__/photo.actions.test.ts` - 9 unit tests: auth checks, 80-cap enforcement, DB operations, signed URL
- `src/__tests__/PhotoUploadZone.test.tsx` - Wave 0 stub (2 placeholder tests for Plan 02)
- `src/__tests__/PhotoThumbnailGrid.test.tsx` - Wave 0 stub (2 placeholder tests for Plan 03)
- `package.json` / `package-lock.json` - Added browser-image-compression, exifr, @dnd-kit packages

## Decisions Made

- `updatePhotoOrder` does not call `revalidatePath` — client does optimistic update on drag; server revalidation would cause visible flicker
- `processImageForUpload` uses canvas redraw to bake orientation pixels, then compresses without `preserveExif: true` — ensures Phase 3 GPT-4o vision receives correctly oriented raw pixel data
- Storage RLS uses `storage.foldername(name)[1]` to enforce userId prefix ownership — path pattern `{userId}/{assetId}/{filename}`
- `extraction_stale` only set when `assets.fields != '{}'` — avoids unnecessary re-extraction on fresh draft assets with no prior extraction

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

The Storage migration (`20260317000002_photo_storage.sql`) needs to be applied to Supabase:
- Local: `npx supabase db reset` or `npx supabase migration up`
- Production: `npx supabase db push`

The `photos` bucket and RLS policies are created idempotently by the migration.

## Next Phase Readiness

- All utilities and Server Actions exist — Plan 02 (PhotoUploadZone component) and Plan 03 (PhotoThumbnailGrid) can import from `photo.actions.ts` and `utils/image.ts` immediately
- Wave 0 stub tests in PhotoUploadZone.test.tsx and PhotoThumbnailGrid.test.tsx are ready to be replaced with real component tests in Plans 02 and 03
- @dnd-kit packages installed and ready for Plan 03 drag-and-drop implementation

---
*Phase: 02-photo-capture-storage*
*Completed: 2026-03-17*
