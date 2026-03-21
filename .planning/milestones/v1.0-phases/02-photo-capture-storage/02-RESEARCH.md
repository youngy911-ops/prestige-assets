# Phase 2: Photo Capture + Storage - Research

**Researched:** 2026-03-17
**Domain:** Browser image processing, Supabase Storage, React drag-to-reorder
**Confidence:** HIGH — core library APIs verified via official docs and GitHub; architecture patterns established in Phase 1

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Asset DB record is created at the end of the wizard step via `createAsset` Server Action — before photos
- Photo upload lives on a dedicated route `/assets/[id]/photos` (not inside `/assets/new`)
- Wizard flow: `/assets/new` → branch → type → subtype → `[createAsset]` → redirect to `/assets/[id]/photos`
- Back button on the photo upload page returns to the wizard (`/assets/[id]/edit-type` or equivalent); already-uploaded photos stay attached to the record
- Photos are **optional** — staff can proceed without uploading any photos
- "Next" button is always enabled; label or hint text changes based on photo count
- On "Next": if photos present → `/assets/[id]/extract`; if no photos → `/assets/[id]/review`
- Hard cap: **80 photos per asset** — enforced client-side (disable Add Photos at 80) and server-side (reject upload if already 80)
- Phase 3 sends **all uploaded photos** to GPT-4o — no special build plate tagging UI in Phase 2
- Cover photo (position-0) is for display purposes only — not a build plate indicator
- Photos are editable at any time while asset is in **draft** status
- When photos are added/removed on an asset with existing AI extraction results, show a banner prompt: "New photos added — re-run AI extraction to update extracted fields?" with [Re-run Extraction] / [Keep existing results] options; Phase 2 sets an `extraction_stale` flag on the asset record
- Library choices: `browser-image-compression` for resize, `exifr` for EXIF correction, `@dnd-kit/sortable` + `@dnd-kit/core` for drag-to-reorder

### Claude's Discretion

- Exact Storage path structure for photos (`{user_id}/{asset_id}/{filename}` or similar)
- Extraction stale flag — DB column name and type
- Client-side feedback when hard cap is reached (toast, inline message, etc.)
- Exact "Next" button label and hint text copy (supplement UI-SPEC copywriting contract)

### Deferred Ideas (OUT OF SCOPE)

- Auto photo ordering by type (AI classification per photo — Phase 3 backlog)
- Photo annotation / labelling (related to auto-ordering above)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PHOTO-01 | User can upload photos via web file picker (supports phone camera roll on mobile browser and file system on desktop) | `<input type="file" accept="image/*" multiple capture="environment">` pattern; PhotoUploadZone component; mobile `capture` attribute triggers camera roll on iOS/Android |
| PHOTO-02 | Photos are resized client-side to max 2MP (with EXIF orientation correction) before upload and stored in private Supabase Storage | `browser-image-compression` v2.0.2 with `maxWidthOrHeight: 1920` + `exifr` for reading orientation + canvas transform; direct BrowserClient upload to private bucket; presigned URLs via `createSignedUrl` for display |
| PHOTO-03 | User can drag-to-reorder photos with cover photo designation; order persists after navigation and refresh | `@dnd-kit/core` v6.3.1 + `@dnd-kit/sortable` v10.0.0 with `SortableContext`, `useSortable`, `arrayMove`; Server Action to persist `sort_order` in `asset_photos` table |
</phase_requirements>

---

## Summary

Phase 2 implements three discrete capabilities on a dedicated `/assets/[id]/photos` route: (1) file selection and client-side image processing, (2) private Supabase Storage upload with presigned URL display, and (3) drag-to-reorder with server-persisted position. All three capabilities have well-established library solutions already locked in by the CONTEXT decisions — the research confirms these are the correct choices and documents their precise APIs.

The most technically nuanced part of this phase is EXIF orientation correction (PHOTO-02). The `browser-image-compression` library does not automatically correct EXIF rotation — it only reads/copies it via `preserveExif`. Correct approach: read orientation with `exifr` first, then draw onto a canvas with the correct transform, then compress the canvas output. This must happen before the Supabase upload.

The drag-to-reorder pattern (@dnd-kit) is straightforward for a 2D photo grid using `rectSortingStrategy`. The persistence model is simple: on `onDragEnd`, call `arrayMove` to reorder local state, then fire a Server Action to batch-update `sort_order` values in `asset_photos`.

**Primary recommendation:** Build PhotoCapture (file input + EXIF processing + upload) and PhotoThumbnailGrid (presigned display + drag-to-reorder) as two separate client components mounted together on the `/assets/[id]/photos` page (Server Component parent for initial data load).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `browser-image-compression` | 2.0.2 | Client-side resize to max 2MP before upload | Locked by CONTEXT; widely used; handles WebWorker compression with configurable dimension constraints |
| `exifr` | 7.1.3 | Read EXIF orientation value before canvas redraw | Locked by CONTEXT; fastest JS EXIF reader; `rotation()` method returns deg/rad/scale for canvas transform |
| `@dnd-kit/core` | 6.3.1 | Drag-and-drop context provider + sensors | Locked by CONTEXT; React 19 compatible; accessible (keyboard nav built-in) |
| `@dnd-kit/sortable` | 10.0.0 | Sortable context + useSortable hook + arrayMove | Locked by CONTEXT; provides rectSortingStrategy for grids |
| `@dnd-kit/utilities` | 3.x | CSS transform utilities (CSS.Transform.toString) | Companion to sortable; needed for transform style application |
| `@supabase/ssr` | 0.9.0 | BrowserClient for upload; ServerClient for signed URL generation | Already installed Phase 1; direct client→Storage upload is the established pattern |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | 0.577.0 | Camera, GripVertical, X, Loader2, AlertCircle icons | Already installed; used per UI-SPEC icon inventory |
| `zod` | 4.3.6 | Validate Server Action inputs (photo count cap, sort order array) | Already installed; follow Phase 1 Server Action pattern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `exifr` + canvas | `browser-image-compression` `preserveExif: true` | `preserveExif` keeps EXIF metadata but does NOT rotate the canvas — image displays sideways on browsers that don't auto-rotate. Must use exifr + canvas redraw. |
| `@dnd-kit` | `react-beautiful-dnd` | react-beautiful-dnd is deprecated/unmaintained as of 2023; dnd-kit is its replacement and React 19 compatible |
| Direct BrowserClient upload | Upload via Server Action | Routing multi-MB photos through Next.js doubles bandwidth; direct BrowserClient upload is the established project pattern (ARCHITECTURE.md Decision 3) |

**Installation:**
```bash
npm install browser-image-compression exifr @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/(app)/assets/
│   └── [id]/
│       ├── photos/
│       │   └── page.tsx              # Server Component — loads asset + existing photos
│       └── edit-type/
│           └── page.tsx              # Back-navigation target (wizard correction)
├── components/asset/
│   ├── PhotoUploadZone.tsx           # 'use client' — file input, EXIF processing, upload
│   ├── PhotoThumbnailGrid.tsx        # 'use client' — dnd-kit sortable grid
│   ├── PhotoThumbnail.tsx            # 'use client' — single card: image, badge, remove, handle
│   ├── CoverPhotoBadge.tsx           # UI element — Badge variant, position-0 indicator
│   └── UploadProgressIndicator.tsx   # UI element — per-file overlay during upload
└── lib/
    ├── actions/
    │   └── photo.actions.ts          # 'use server' — insertPhoto, updatePhotoOrder, removePhoto
    └── utils/
        └── image.ts                  # Client-side: processImageForUpload (exifr + canvas + compress)
```

### Pattern 1: EXIF Orientation Correction + Resize (PHOTO-02)

**What:** Read EXIF orientation with `exifr.rotation()`, redraw onto a canvas with correct transform, then compress via `browser-image-compression`.

**When to use:** Every file selected, before Supabase upload. Android portrait shots are the primary failure case.

**Why canvas redraw, not `preserveExif`:** `preserveExif: true` copies EXIF metadata to the compressed file, but browsers that auto-rotate `<img>` elements will double-rotate. Canvas redraw strips EXIF and bakes orientation into pixels — produces a clean, correctly-oriented image regardless of browser.

**Example:**
```typescript
// src/lib/utils/image.ts
// Source: exifr GitHub docs (MikeKovarik/exifr) + browser-image-compression README
import imageCompression from 'browser-image-compression'
import * as exifr from 'exifr'

export async function processImageForUpload(file: File): Promise<File> {
  // 1. Read EXIF rotation metadata
  const rotation = await exifr.rotation(file).catch(() => null)

  // 2. If rotation needed, redraw onto canvas to bake orientation into pixels
  let sourceFile: File = file
  if (rotation && rotation.deg !== 0) {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap
    const canvas = document.createElement('canvas')
    const deg = rotation.deg
    const swap = deg === 90 || deg === 270
    canvas.width = swap ? height : width
    canvas.height = swap ? width : height
    const ctx = canvas.getContext('2d')!
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((deg * Math.PI) / 180)
    ctx.scale(rotation.scaleX ?? 1, rotation.scaleY ?? 1)
    ctx.drawImage(bitmap, -width / 2, -height / 2)
    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), 'image/jpeg', 0.95)
    )
    sourceFile = new File([blob], file.name, { type: 'image/jpeg' })
  }

  // 3. Compress: max 2MP (~1920px longest side)
  return imageCompression(sourceFile, {
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.85,
  })
}
```

### Pattern 2: Direct BrowserClient Upload to Private Storage (PHOTO-02)

**What:** Upload the processed file to the private `photos` bucket using the Supabase BrowserClient (anon key). RLS enforces that only the authenticated user can write to their own prefix.

**When to use:** After `processImageForUpload` returns the compressed File.

**Storage path convention (Claude's discretion):** `{userId}/{assetId}/{timestamp}-{originalFilename}` — timestamp prefix prevents collisions on same-name re-uploads.

```typescript
// Source: Supabase Storage docs — supabase.com/docs/guides/storage/uploads/standard-uploads
// Inside PhotoUploadZone ('use client')
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const storagePath = `${userId}/${assetId}/${Date.now()}-${processedFile.name}`

const { data, error } = await supabase.storage
  .from('photos')
  .upload(storagePath, processedFile, {
    contentType: 'image/jpeg',
    upsert: false,
  })

// On success: call Server Action to insert asset_photos record
if (data) {
  await insertPhoto({ assetId, storagePath: data.path, sortOrder: nextIndex })
}
```

### Pattern 3: Presigned URL Generation for Display (PHOTO-02)

**What:** The private bucket cannot serve images via public URL. A Server Component loads existing photos and generates short-lived signed URLs for initial display. The client does not call `createSignedUrl` directly — this keeps the presigned URL generation on the server.

**When to use:** The `/assets/[id]/photos` page.tsx (Server Component) fetches photos and generates signed URLs before passing to client components.

```typescript
// Source: Supabase docs — supabase.com/docs/reference/javascript/storage-from-createsignedurl
// In app/(app)/assets/[id]/photos/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: photos } = await supabase
  .from('asset_photos')
  .select('id, storage_path, sort_order')
  .eq('asset_id', assetId)
  .order('sort_order', { ascending: true })

const photosWithUrls = await Promise.all(
  (photos ?? []).map(async (photo) => {
    const { data } = await supabase.storage
      .from('photos')
      .createSignedUrl(photo.storage_path, 3600) // 1 hour
    return { ...photo, signedUrl: data?.signedUrl ?? null }
  })
)
```

**Note on freshly uploaded photos:** After upload, the client has the storage path. To display the new thumbnail immediately without refetching, call `createSignedUrl` from a thin Server Action that takes a `storagePath` and returns a signed URL. This avoids a full page reload for each new photo.

### Pattern 4: Drag-to-Reorder Grid (PHOTO-03)

**What:** `@dnd-kit/sortable` wrapping the photo grid. On `onDragEnd`, `arrayMove` reorders local state, then a Server Action batch-updates `sort_order` in `asset_photos`.

**Key configuration for photo grid:** Use `rectSortingStrategy` (2D grid strategy), not `verticalListSortingStrategy`.

```typescript
// Source: dndkit.com/presets/sortable docs
// PhotoThumbnailGrid.tsx ('use client')
import {
  DndContext, closestCenter, PointerSensor,
  KeyboardSensor, useSensors, useSensor, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, rectSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// In the grid component:
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor)
)

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over || active.id === over.id) return
  const oldIndex = photos.findIndex((p) => p.id === active.id)
  const newIndex = photos.findIndex((p) => p.id === over.id)
  const reordered = arrayMove(photos, oldIndex, newIndex)
  setPhotos(reordered) // optimistic update
  updatePhotoOrder(reordered.map((p, i) => ({ id: p.id, sortOrder: i })))
}

// Render:
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={photos.map(p => p.id)} strategy={rectSortingStrategy}>
    {photos.map((photo, index) => (
      <PhotoThumbnail key={photo.id} photo={photo} isCover={index === 0} />
    ))}
  </SortableContext>
</DndContext>

// In PhotoThumbnail (useSortable):
const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: photo.id })
const style = { transform: CSS.Transform.toString(transform), transition }
```

**`activationConstraint: { distance: 8 }`:** Critical for mobile — without this, tapping to remove a photo activates drag. 8px movement threshold distinguishes tap from drag.

### Pattern 5: Server Actions for Photo DB Operations

**What:** Three new Server Actions in `src/lib/actions/photo.actions.ts` following the established Phase 1 pattern.

```typescript
// 'use server' — src/lib/actions/photo.actions.ts
export async function insertPhoto(params: {
  assetId: string
  storagePath: string
  sortOrder: number
}): Promise<{ id: string } | { error: string }>

export async function updatePhotoOrder(
  updates: Array<{ id: string; sortOrder: number }>
): Promise<{ success: true } | { error: string }>

export async function removePhoto(
  photoId: string
): Promise<{ success: true } | { error: string }>
```

**Server-side 80-photo cap enforcement:**
```typescript
// In insertPhoto — count existing photos before insert
const { count } = await supabase
  .from('asset_photos')
  .select('*', { count: 'exact', head: true })
  .eq('asset_id', params.assetId)
if ((count ?? 0) >= 80) return { error: 'Photo limit reached' }
```

### Pattern 6: extraction_stale Flag

**What:** When a photo is added or removed on an asset that already has AI extraction results, set `extraction_stale = true` on the `assets` record.

**DB column (Claude's discretion — recommending):** `extraction_stale boolean not null default false` on `assets` table. Simple boolean, reset to `false` when re-extraction completes in Phase 3.

**Implementation:** `insertPhoto` and `removePhoto` Server Actions check whether the asset has `fields` populated (non-empty JSONB), and if so, `update assets set extraction_stale = true where id = assetId`.

### Anti-Patterns to Avoid

- **Routing photos through a Server Action for upload:** Server Actions are not designed for binary file streaming. Direct BrowserClient→Storage upload is the correct pattern per ARCHITECTURE.md.
- **Using `preserveExif: true` alone for EXIF correction:** This preserves EXIF metadata in the output file but does NOT physically rotate the image pixels. Modern browsers that respect `image-orientation: from-image` will auto-rotate for display, but canvas operations (used in Phase 3 by GPT-4o) will receive the un-rotated pixel data. Always use exifr + canvas redraw.
- **Drag-to-reorder without `activationConstraint`:** Without a distance threshold, tapping a thumbnail on mobile triggers drag instead of the tap action (remove, focus). Set `distance: 8`.
- **Generating signed URLs in a client component:** Signed URLs are generated using the service-role or anon key on the server. The client component receives the URL as a prop from the Server Component parent — it does not call `createSignedUrl` directly.
- **Global revalidatePath on every photo operation:** Photo order updates are frequent; calling `revalidatePath('/assets/[id]/photos')` on each drag will cause flicker. Use optimistic updates client-side and only revalidate on page-impacting changes (photo insert/delete).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image resize before upload | Custom Canvas resize loop | `browser-image-compression` | Handles WebWorker threading, iterative compression, dimension constraints, MIME type conversion — dozens of edge cases |
| EXIF orientation reading | Manual binary JPEG parsing | `exifr` | EXIF binary format has many variants (JPEG, TIFF, HEIC, PNG); exifr handles all of them including iOS-specific quirks |
| Drag-to-reorder | CSS pointer events + manual position tracking | `@dnd-kit/sortable` | Accessibility (keyboard navigation, screen reader announcements), touch/pointer normalization, auto-scroll on drag near edges, collision detection |
| Sort order after reorder | Manual index recalculation | `arrayMove` from `@dnd-kit/sortable` | One-line array reorder from old to new index |

**Key insight:** EXIF orientation is the most common source of "photo rotated 90 degrees" bugs in web upload flows. The combination of `exifr.rotation()` + canvas redraw is the established correct pattern. Do not shortcut this.

---

## Common Pitfalls

### Pitfall 1: EXIF Double-Rotation on Modern Browsers

**What goes wrong:** Staff uploads an Android portrait photo. The photo appears correctly rotated in the thumbnail grid (browser auto-rotates `<img>` using EXIF). The photo is stored in Supabase with the EXIF still present. Phase 3 sends the stored image to GPT-4o — GPT-4o reads raw pixel data (not EXIF), sees the image sideways.

**Why it happens:** `preserveExif: true` in browser-image-compression keeps the EXIF rotation tag intact. `<img>` elements obey `image-orientation: from-image` (now default in Chrome, Firefox, Safari) so they display correctly — but raw canvas operations don't.

**How to avoid:** Use `exifr.rotation()` + canvas redraw to bake the correct orientation into pixels before compression. Strip EXIF (do not use `preserveExif: true`). The output JPEG has correct pixel orientation and no EXIF rotation tag.

**Warning signs:** Photos look correct in thumbnails but arrive at the AI Phase 3 as landscape when taken in portrait.

### Pitfall 2: Touch Tap vs Drag Conflict on Mobile

**What goes wrong:** User taps the remove button (X) on a thumbnail. The tap activates the dnd-kit drag instead, moving the photo instead of deleting it.

**Why it happens:** Without `activationConstraint`, any `pointerdown` event starts a drag. The remove button's `click` and the drag's `pointerdown` compete.

**How to avoid:** Configure `PointerSensor` with `activationConstraint: { distance: 8 }`. This requires 8px of pointer movement before drag activates. Normal taps (< 8px movement) pass through to click handlers.

**Warning signs:** Remove button unresponsive on mobile; photos move when user intends to tap controls.

### Pitfall 3: Race Condition — Upload Complete Before insertPhoto Finishes

**What goes wrong:** User uploads 5 photos rapidly. The Supabase Storage upload succeeds for all 5 before any `insertPhoto` Server Action completes. Sort order is wrong because `nextIndex` is calculated from stale local state.

**Why it happens:** Multiple concurrent uploads all read the same `photos.length` to determine `sortOrder` before any Server Action response updates local state.

**How to avoid:** Track uploads with a pending counter separate from the committed photo list. Calculate `sortOrder` using `committedPhotos.length + pendingUploadIndex` where `pendingUploadIndex` is the upload's position in the current batch. Or: after all uploads in a batch complete, re-fetch the photo list from the DB and re-sort.

**Warning signs:** Photos arrive in the grid in wrong order after rapid multi-select upload.

### Pitfall 4: Signed URL Expiry in Long Sessions

**What goes wrong:** Staff starts the upload flow, leaves the page open for >1 hour, returns to add more photos. The existing thumbnails show broken images (signed URLs expired).

**Why it happens:** Signed URLs are generated at page load with 3600s expiry. After 1 hour they're invalid.

**How to avoid:** For the photo page, 1-hour expiry is acceptable for MVP given the use case (on-site session is < 1 hour). Document this limit. If needed in a future phase, switch to 86400s (24 hours) or re-fetch signed URLs on focus.

**Warning signs:** Broken `<img>` elements after leaving page open.

### Pitfall 5: Supabase Storage RLS for the photos Bucket

**What goes wrong:** Photos fail to upload despite correct auth. Logs show "Unauthorized" from Supabase Storage.

**Why it happens:** The Storage bucket's RLS policies on `storage.objects` must mirror the application's intent. Phase 1 created the `asset_photos` table with correct RLS, but the Storage bucket RLS must be separately configured.

**How to avoid:** Ensure a migration creates these Storage RLS policies (not covered in Phase 1 migration):
```sql
-- Allow authenticated users to upload to their own prefix
create policy "users_upload_own_photos"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to read their own photos
create policy "users_read_own_photos"
  on storage.objects for select
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to delete their own photos
create policy "users_delete_own_photos"
  on storage.objects for delete
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```
The path convention `{userId}/{assetId}/{filename}` ensures `(storage.foldername(name))[1]` returns the userId for RLS matching.

**Warning signs:** Supabase Storage returns 403/Unauthorized; upload works in Supabase dashboard but not via app.

---

## Code Examples

### Full Upload Flow in PhotoUploadZone

```typescript
// Source: Architecture established in ARCHITECTURE.md (Photo Upload Flow detail)
async function handleFilesSelected(files: FileList) {
  const fileArray = Array.from(files).slice(0, 80 - photos.length) // client cap
  setUploading(true)

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i]
    try {
      // 1. EXIF correct + compress
      const processed = await processImageForUpload(file)

      // 2. Upload to Supabase Storage
      const storagePath = `${userId}/${assetId}/${Date.now()}-${processed.name}`
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(storagePath, processed, { contentType: 'image/jpeg' })
      if (error) throw error

      // 3. Get signed URL for immediate display
      const signedUrl = await getSignedUrl(data.path) // thin Server Action

      // 4. Persist to asset_photos table
      const result = await insertPhoto({
        assetId,
        storagePath: data.path,
        sortOrder: photos.length + i,
      })
      if ('error' in result) throw new Error(result.error)

      // 5. Add to local state
      setPhotos(prev => [...prev, { id: result.id, storagePath: data.path, signedUrl, sortOrder: prev.length }])
    } catch (err) {
      setUploadErrors(prev => [...prev, { filename: file.name, error: String(err) }])
    }
  }
  setUploading(false)
}
```

### Supabase Storage bucket creation (migration)

```sql
-- Phase 2 migration: create private photos bucket + Storage RLS
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "users_upload_own_photos"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users_read_own_photos"
  on storage.objects for select
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users_delete_own_photos"
  on storage.objects for delete
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

### extraction_stale migration

```sql
-- Phase 2 migration: add extraction_stale flag to assets
alter table public.assets
  add column if not exists extraction_stale boolean not null default false;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-beautiful-dnd` | `@dnd-kit/sortable` | 2023 (rbd deprecated) | dnd-kit is now the default; rbd has known issues with React 18+ strict mode |
| auth-helpers-nextjs | `@supabase/ssr` | 2023 | Already adopted in Phase 1; do not reintroduce old package |
| `exif-js` / `piexifjs` | `exifr` | ~2021 | exifr is significantly faster, handles more formats, actively maintained |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Do not use — unmaintained, React 18+ issues
- `@supabase/auth-helpers-nextjs`: Already replaced in Phase 1 with `@supabase/ssr`
- `piexifjs` / `exif-js`: Older EXIF libraries; exifr is the correct current choice

---

## Open Questions

1. **Storage bucket already created in Phase 1?**
   - What we know: Phase 1 migration (20260317000001_initial_schema.sql) creates `assets` and `asset_photos` tables but does NOT create the `photos` storage bucket or Storage RLS policies
   - What's unclear: Was the bucket created manually in the Supabase dashboard during Phase 1 execution?
   - Recommendation: Phase 2 plan should include a new migration that creates the bucket and Storage RLS policies with `on conflict do nothing` guards to be idempotent

2. **getSignedUrl Server Action for newly uploaded photos**
   - What we know: After upload, the client has the storage path but needs a signed URL for immediate thumbnail display without a full page reload
   - What's unclear: Whether to create a dedicated `getSignedUrl` Server Action or rely on page-level revalidation
   - Recommendation: Create a minimal `getSignedUrl(storagePath: string): Promise<string>` Server Action — cleaner than full page revalidate after each photo

3. **Multi-photo upload concurrency**
   - What we know: Staff selects multiple photos at once; `browser-image-compression` with `useWebWorker: true` processes them in parallel
   - What's unclear: Whether to upload all photos concurrently to Storage or sequentially
   - Recommendation: Process EXIF+compress sequentially (WebWorker handles one at a time anyway) but start uploads concurrently — 5 photos uploading in parallel is fine on mobile broadband

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — validation architecture section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` (exists — jsdom environment, globals: true) |
| Setup file | `vitest.setup.ts` (exists — imports @testing-library/jest-dom) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PHOTO-01 | File input renders with correct attributes (`accept="image/*"`, `multiple`, `capture="environment"`) | unit | `npm test -- src/__tests__/photo.actions.test.ts` | Wave 0 |
| PHOTO-01 | Add Photos button disabled when uploads in progress | unit | `npm test -- src/__tests__/PhotoUploadZone.test.tsx` | Wave 0 |
| PHOTO-01 | Add Photos button disabled at 80-photo cap | unit | `npm test -- src/__tests__/PhotoUploadZone.test.tsx` | Wave 0 |
| PHOTO-02 | `insertPhoto` Server Action returns error when not authenticated | unit | `npm test -- src/__tests__/photo.actions.test.ts` | Wave 0 |
| PHOTO-02 | `insertPhoto` Server Action returns error when asset already has 80 photos | unit | `npm test -- src/__tests__/photo.actions.test.ts` | Wave 0 |
| PHOTO-02 | `insertPhoto` Server Action inserts record and returns photo id | unit | `npm test -- src/__tests__/photo.actions.test.ts` | Wave 0 |
| PHOTO-02 | `removePhoto` Server Action deletes record and returns success | unit | `npm test -- src/__tests__/photo.actions.test.ts` | Wave 0 |
| PHOTO-03 | `updatePhotoOrder` Server Action updates sort_order for all provided ids | unit | `npm test -- src/__tests__/photo.actions.test.ts` | Wave 0 |
| PHOTO-03 | Cover photo badge renders on index-0 thumbnail, not on others | unit | `npm test -- src/__tests__/PhotoThumbnailGrid.test.tsx` | Wave 0 |
| PHOTO-01/02/03 | Full upload→display→reorder flow on mobile | manual | Manual test on real device (iOS Safari + Android Chrome) | Manual only |
| PHOTO-02 | EXIF orientation correction bakes pixels correctly | manual | Manual test: upload known EXIF-rotated JPEG, verify display and canvas readout | Manual only |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/photo.actions.test.ts` — covers Server Action behavior for PHOTO-02 and PHOTO-03 (insertPhoto, updatePhotoOrder, removePhoto) — follow existing `asset.actions.test.ts` mock pattern
- [ ] `src/__tests__/PhotoUploadZone.test.tsx` — covers PHOTO-01 client component behavior (input attributes, disabled states)
- [ ] `src/__tests__/PhotoThumbnailGrid.test.tsx` — covers PHOTO-03 cover badge logic, grid rendering

---

## Sources

### Primary (HIGH confidence)

- `ARCHITECTURE.md` (project doc) — Photo upload flow, direct BrowserClient pattern, Storage path convention
- `02-CONTEXT.md` (project doc) — All locked implementation decisions
- `02-UI-SPEC.md` (project doc) — Component inventory, interaction contract, library choices
- Phase 1 migration (`20260317000001_initial_schema.sql`) — Confirmed `asset_photos` table schema (id, asset_id, storage_path, sort_order, created_at)
- Phase 1 `asset.actions.ts` — Established Server Action pattern to follow
- Supabase Storage docs (supabase.com/docs/guides/storage) — upload method, createSignedUrl parameters
- dndkit.com/presets/sortable — Sortable API: DndContext, SortableContext, useSortable, rectSortingStrategy, arrayMove
- exifr GitHub (github.com/MikeKovarik/exifr) — `rotation()` method, orientation examples

### Secondary (MEDIUM confidence)

- browser-image-compression GitHub (github.com/Donaldcwl/browser-image-compression) — v2.0.2 API options including `maxWidthOrHeight`, `exifOrientation`, `preserveExif`; confirmed EXIF auto-correction is NOT default
- @dnd-kit/core v6.3.1, @dnd-kit/sortable v10.0.0 — current versions confirmed via WebSearch npm results (published ~1 year ago, no breaking changes noted)

### Tertiary (LOW confidence)

- exifr version 7.1.3 — confirmed via libraries.io; last release date uncertain from research; library appears maintained (1.2k stars, active issues)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries locked by CONTEXT, versions confirmed from npm/GitHub sources
- Architecture: HIGH — patterns follow established Phase 1 conventions + official Supabase/dnd-kit docs
- Pitfalls: HIGH for EXIF and touch conflicts (well-documented issues); MEDIUM for Storage RLS (need to verify bucket creation status)
- Validation: HIGH — existing Vitest infrastructure fully usable, mock pattern established in Phase 1 tests

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (30 days — stable libraries, no fast-moving surface)
