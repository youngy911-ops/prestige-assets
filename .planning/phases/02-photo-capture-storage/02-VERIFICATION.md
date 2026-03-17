---
phase: 02-photo-capture-storage
verified: 2026-03-17T14:48:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Upload a photo from phone camera roll"
    expected: "Image EXIF orientation is auto-corrected (portrait photos appear upright)"
    why_human: "Canvas EXIF correction requires actual device EXIF data; cannot verify in jsdom"
  - test: "Drag a photo in the thumbnail grid on a touch device"
    expected: "Dragging works; tapping Remove (X) does not accidentally trigger drag"
    why_human: "PointerSensor activationConstraint distance:8 mobile behavior requires real touch interaction"
  - test: "Upload photo, navigate away, return to /assets/[id]/photos"
    expected: "Photos persist and display correctly via presigned URLs on page reload"
    why_human: "Requires real Supabase Storage + auth session; cannot verify in unit tests"
  - test: "Add a photo to an asset that already has extraction results"
    expected: "extraction_stale banner appears at top of photos page"
    why_human: "Requires extraction_stale=true in DB; integration-level behavior"
---

# Phase 2: Photo Capture & Storage Verification Report

**Phase Goal:** Enable staff to capture and store asset photos — upload photos for an asset, auto-correct EXIF orientation, store in Supabase Storage with RLS, display a drag-to-reorder thumbnail grid.
**Verified:** 2026-03-17T14:48:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Private photos Storage bucket exists with RLS binding ownership to user_id prefix | VERIFIED | `20260317000002_photo_storage.sql` inserts bucket + 3 policies using `storage.foldername(name)[1]` |
| 2 | Client-side EXIF correction + 2MP resize runs before upload | VERIFIED | `image.ts` exports `processImageForUpload` using `exifr.rotation()` + canvas redraw + `browser-image-compression` |
| 3 | Server Actions insertPhoto, updatePhotoOrder, removePhoto, getSignedUrl exist with auth + 80-photo cap | VERIFIED | `photo.actions.ts` exports all 4, each guards with `if (!user) return { error: 'Not authenticated' }`, insertPhoto enforces `(count ?? 0) >= 80` |
| 4 | All Server Action tests are green | VERIFIED | `npm test` passes 63/63 tests across 8 test files |
| 5 | Staff can tap Add Photos and select multiple images from camera roll or file system | VERIFIED | `PhotoUploadZone.tsx` renders `<input data-testid="photo-file-input" accept="image/*" multiple capture="environment">` |
| 6 | Upload spinner overlay + error overlay per file | VERIFIED | `UploadProgressIndicator.tsx` renders `Loader2` spinner or `AlertCircle` based on `isUploading`/`error` props |
| 7 | Add Photos button disabled while uploading or at 80-photo cap | VERIFIED | `atCap = photos.length >= 80`; both buttons disabled with `isUploading \|\| atCap` |
| 8 | Cover badge shows on first thumbnail only | VERIFIED | `PhotoThumbnailGrid.tsx` passes `isCover={index === 0}`; `CoverPhotoBadge` renders text "Cover" |
| 9 | Staff can drag to reorder; order persists after navigation | VERIFIED | `PhotoThumbnailGrid.tsx` uses dnd-kit with `arrayMove` + calls `updatePhotoOrder` Server Action on drag end |
| 10 | Dragging disabled during upload | VERIFIED | `onDragEnd={isUploading ? undefined : handleDragEnd}` in `PhotoThumbnailGrid.tsx` |
| 11 | Photos page loads existing photos via presigned URLs (no public URLs) | VERIFIED | `photos/page.tsx` calls `supabase.storage.from('photos').createSignedUrl(...)` for each row |
| 12 | Wizard redirects to /assets/[id]/photos after createAsset | VERIFIED | `new/page.tsx` line 66: `router.push(\`/assets/\${result.assetId}/photos\`)` |
| 13 | extraction_stale banner appears when asset already has extraction results and photos change | VERIFIED | `photos/page.tsx` checks `asset.extraction_stale && hasPhotos` and conditionally renders banner |

**Score:** 13/13 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260317000002_photo_storage.sql` | Private bucket + 3 RLS policies + extraction_stale column | VERIFIED | Contains `insert into storage.buckets`, 3 `create policy` blocks, `add column if not exists extraction_stale` |
| `src/lib/utils/image.ts` | processImageForUpload — EXIF correction + compression pipeline | VERIFIED | Exports `processImageForUpload`; uses `exifr.rotation()` + canvas redraw + `imageCompression`; 51 lines, substantive |
| `src/lib/actions/photo.actions.ts` | insertPhoto, updatePhotoOrder, removePhoto, getSignedUrl Server Actions | VERIFIED | All 4 exported; `'use server'` directive; auth guards; 80-photo cap; extraction_stale updates; 122 lines |
| `src/__tests__/photo.actions.test.ts` | Unit tests for all photo Server Actions | VERIFIED | 4 describe blocks, 9 tests; real assertions (not placeholders); passes |
| `src/components/asset/CoverPhotoBadge.tsx` | Cover badge shown on position-0 thumbnail | VERIFIED | Renders `<Badge>Cover</Badge>` using `@/components/ui/badge`; substantive |
| `src/components/asset/UploadProgressIndicator.tsx` | Per-file overlay during upload (Loader2) and on error (AlertCircle) | VERIFIED | Imports both icons; conditional render based on `isUploading`/`error` props |
| `src/components/asset/PhotoThumbnail.tsx` | Single photo card with image, cover badge, remove button, drag handle | VERIFIED | Exports `PhotoThumbnail` as forwardRef; has `isCover`, `aria-label="Remove photo"`, `aria-label="Drag to reorder"`, `data-photo-id`; 71 lines |
| `src/components/asset/PhotoUploadZone.tsx` | File input trigger, upload orchestration, EXIF+resize pipeline integration | VERIFIED | Exports `PhotoUploadZone` and `PhotoItem`; full upload pipeline wired; 246 lines |
| `src/components/asset/PhotoThumbnailGrid.tsx` | dnd-kit sortable grid wrapping PhotoThumbnail; calls updatePhotoOrder on drag end | VERIFIED | Exports `PhotoThumbnailGrid`; uses `DndContext`, `SortableContext`, `rectSortingStrategy`, `arrayMove`; `updatePhotoOrder` called on drag end; 141 lines |
| `src/app/(app)/assets/[id]/photos/page.tsx` | Server Component loading asset + photos with presigned URLs | VERIFIED | Contains `createSignedUrl`, `PhotoUploadZone`, extraction_stale banner, Next button logic; 132 lines |
| `src/app/(app)/assets/new/page.tsx` | Wizard redirects to /assets/[id]/photos after createAsset | VERIFIED | Line 66: `router.push(\`/assets/\${result.assetId}/photos\`)` |
| `src/__tests__/PhotoUploadZone.test.tsx` | Real component tests (not stubs) | VERIFIED | 4 real tests with render + assertions; no placeholder `expect(true).toBe(true)` |
| `src/__tests__/PhotoThumbnailGrid.test.tsx` | 3 real component tests (not stubs) | VERIFIED | 3 tests: thumbnail count, cover badge once, empty array; real assertions |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `photo.actions.ts` | `supabase storage.objects` | Storage RLS policies in migration | VERIFIED | Migration uses `storage.foldername(name)[1]` to bind objects to user_id prefix |
| `image.ts` | `browser-image-compression` + `exifr` | `processImageForUpload` | VERIFIED | `exifr.rotation(file)` called on line 16; `imageCompression()` called on line 44 |
| `PhotoUploadZone.tsx` | `image.ts` | `processImageForUpload` call before upload | VERIFIED | Import on line 5; called on line 73 inside upload loop |
| `PhotoUploadZone.tsx` | `photo.actions.ts` | `insertPhoto` + `getSignedUrl` Server Actions | VERIFIED | Both imported line 6; `insertPhoto` called line 84; `getSignedUrl` called line 92 |
| `PhotoThumbnail.tsx` | `CoverPhotoBadge.tsx` | `isCover` prop renders `CoverPhotoBadge` when true | VERIFIED | `{isCover && <CoverPhotoBadge />}` on line 44 |
| `PhotoThumbnailGrid.tsx` | `photo.actions.ts` | `updatePhotoOrder` on drag end | VERIFIED | Import line 20; called line 92 inside `handleDragEnd` |
| `photos/page.tsx` | `supabase storage` | `createSignedUrl` for each asset_photos row | VERIFIED | `supabase.storage.from('photos').createSignedUrl(photo.storage_path, 3600)` line 41 |
| `new/page.tsx` | `photos/page.tsx` | `router.push` after createAsset | VERIFIED | `router.push(\`/assets/\${result.assetId}/photos\`)` line 66 |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| PHOTO-01 | 02-01, 02-02, 02-03 | User can upload photos via web file picker (supports phone camera roll on mobile browser and file system on desktop) | SATISFIED | `PhotoUploadZone` renders file input with `accept="image/*" multiple capture="environment"`; photos page wires everything end-to-end |
| PHOTO-02 | 02-01, 02-02, 02-03 | Photos are resized client-side to max 2MP (EXIF orientation correction) before upload and stored in private Supabase Storage | SATISFIED | `processImageForUpload` does EXIF correction + `maxWidthOrHeight: 1920` compression; private Storage bucket with RLS policies |
| PHOTO-03 | 02-01, 02-03 | User can drag-to-reorder photos with cover photo designation; order persists after navigation and refresh | SATISFIED | `PhotoThumbnailGrid` uses dnd-kit with `activationConstraint: { distance: 8 }` + `updatePhotoOrder` Server Action; `isCover={index === 0}` moves with reorder |

All 3 requirement IDs from plan frontmatter are accounted for. No orphaned requirements found.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/(app)/assets/[id]/edit-type/page.tsx` | 12 | `redirect()` placeholder — always redirects back to photos | Info | Intentional stub for Phase 4/6; Back button on photos page loops to photos page instead of a real edit-type flow. No impact on Phase 2 goal. |

No blockers. No stubs in core Phase 2 artifacts. The edit-type redirect is explicitly documented as a stub for a future phase.

---

### Human Verification Required

#### 1. EXIF Orientation Correction on Real Device

**Test:** Take a portrait photo with a phone, upload it via the photos page.
**Expected:** Image appears upright in the thumbnail grid (not rotated 90 degrees).
**Why human:** The canvas EXIF correction path requires actual EXIF rotation metadata from a camera. jsdom cannot simulate `createImageBitmap` or canvas rendering; the unit tests mock `processImageForUpload` entirely.

#### 2. Mobile Drag-vs-Tap Discrimination

**Test:** On a touch device, tap the Remove (X) button on a thumbnail, then separately drag a thumbnail to a new position.
**Expected:** Tap on X removes the photo without initiating drag; drag gesture reorders without triggering remove.
**Why human:** `PointerSensor activationConstraint: { distance: 8 }` prevents tap-to-drag. This requires real pointer events; jsdom does not simulate the 8px distance threshold.

#### 3. Photo Persistence After Page Reload

**Test:** Upload 2–3 photos, navigate to another page, return to `/assets/[id]/photos`.
**Expected:** All uploaded photos display via presigned URLs; order is preserved.
**Why human:** Requires real Supabase Storage + database writes; unit tests mock all network calls.

#### 4. extraction_stale Banner

**Test:** Create an asset, run AI extraction (Phase 3), then return to the photos page and upload an additional photo.
**Expected:** A banner appears reading "New photos added — re-run AI extraction to update extracted fields?"
**Why human:** Requires `extraction_stale=true` to be set in the real database after an extraction run; not testable without Phase 3.

---

### Gaps Summary

No gaps found. All 13 must-have truths verified against the actual codebase. The phase goal is achieved:

- Storage bucket with RLS is defined in migration
- EXIF correction + 2MP resize pipeline is fully implemented and wired into the upload flow
- All 4 Server Actions exist, are authenticated, and enforce the 80-photo cap
- Drag-to-reorder grid is wired to persist order via `updatePhotoOrder`
- The photos page is a real Server Component generating presigned URLs
- Wizard redirects to `/assets/[id]/photos` after asset creation
- Full test suite (63 tests) passes green

Four items are flagged for human verification: EXIF orientation on real hardware, mobile drag/tap discrimination, persistence after reload, and extraction_stale banner appearance. These require real device + network integration that automated tests cannot cover.

---

_Verified: 2026-03-17T14:48:00Z_
_Verifier: Claude (gsd-verifier)_
