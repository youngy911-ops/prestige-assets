---
phase: 2
slug: photo-capture-storage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + @testing-library/react 16.3.2 |
| **Config file** | `vitest.config.ts` (exists — jsdom environment, globals: true) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | PHOTO-02, PHOTO-03 | unit | `npm test -- src/__tests__/photo.actions.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 0 | PHOTO-01 | unit | `npm test -- src/__tests__/PhotoUploadZone.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 0 | PHOTO-03 | unit | `npm test -- src/__tests__/PhotoThumbnailGrid.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | PHOTO-02 | unit | `npm test -- src/__tests__/photo.actions.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | PHOTO-01 | unit | `npm test -- src/__tests__/PhotoUploadZone.test.tsx` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | PHOTO-03 | unit | `npm test -- src/__tests__/PhotoThumbnailGrid.test.tsx` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | PHOTO-03 | unit | `npm test -- src/__tests__/photo.actions.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/photo.actions.test.ts` — stubs for insertPhoto (PHOTO-02: auth check, 80-photo cap, insert success), removePhoto (PHOTO-02), updatePhotoOrder (PHOTO-03); follow `asset.actions.test.ts` mock pattern
- [ ] `src/__tests__/PhotoUploadZone.test.tsx` — stubs for PHOTO-01 (input attributes: `accept="image/*"`, `multiple`, `capture="environment"`; Add Photos button disabled at 80-photo cap; button disabled during upload)
- [ ] `src/__tests__/PhotoThumbnailGrid.test.tsx` — stubs for PHOTO-03 (cover badge on index-0 thumbnail only; grid renders correct photo count)

*No new framework install needed — Vitest + @testing-library/react already installed from Phase 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full upload→display→reorder flow on mobile | PHOTO-01, PHOTO-02, PHOTO-03 | Requires real device camera roll access, touch gestures, and network | Upload photos on iOS Safari + Android Chrome; verify thumbnails display, drag-to-reorder works, cover badge on position-0 |
| EXIF orientation correction bakes pixels correctly | PHOTO-02 | Canvas pixel data requires visual inspection; automated test would need known-EXIF test fixture | Upload a known portrait-orientation JPEG (EXIF rotation=90); verify thumbnail displays upright and that canvas pixel readout confirms correct orientation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
