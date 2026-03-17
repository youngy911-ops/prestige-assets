# Roadmap: Prestige Assets — Slattery Auctions Book-In App

## Overview

Six phases derived from the hard dependency chain in the architecture: the Schema Registry must exist before AI extraction can be prompted, before the review form can be rendered, and before output templates can be finalised. Photo upload must precede AI (Route Handler needs storage paths). Review form must precede output (output renders from confirmed field values). Asset list and navigation come last — the core single-asset workflow must be proven before multi-session navigation is built on top of it.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation + Schema Registry** - Auth, Supabase setup, DB schema, and the complete Schema Registry that drives everything downstream
- [ ] **Phase 2: Photo Capture + Storage** - File picker, client-side resize with EXIF correction, Supabase Storage, drag-to-reorder with persistence
- [ ] **Phase 3: AI Extraction** - Route Handler calling GPT-4o, per-field confidence scores, extraction UI and failure states
- [ ] **Phase 4: Review Form + Save** - Dynamic RHF form pre-filled from extraction, low-confidence highlighting, mandatory save step
- [ ] **Phase 5: Output Generation** - Deterministic description templates, structured fields block, Glass's Valuation, copy-to-clipboard
- [ ] **Phase 6: Asset List + Navigation** - Recency-sorted list view, routing, resume editing from list

## Phase Details

### Phase 1: Foundation + Schema Registry
**Goal**: The project is scaffolded, authenticated, and the Schema Registry is complete — every downstream component has a single source of truth to build against
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, ASSET-01, ASSET-02
**Success Criteria** (what must be TRUE):
  1. User can log in with email and password and their session persists across browser refresh
  2. User can create a new asset record and select an asset type from the 7 valid types
  3. Schema Registry exists for all 7 asset types with correct Salesforce field labels, field ordering, AI-extractable flags, and description template stubs
  4. API keys are server-only (no `NEXT_PUBLIC_` prefix, `server-only` import guard in place); Supabase Storage bucket is private; RLS is enabled on all tables
**Plans**: TBD

Plans:
- [ ] 01-01: Next.js 15 scaffold, Supabase project, environment config, auth middleware + login page
- [ ] 01-02: DB schema (assets, asset_photos tables with RLS), Supabase client/server wrappers
- [ ] 01-03: Schema Registry — all 7 asset type definitions (fields, Salesforce labels, sfOrder, AI flags, description template stubs)

### Phase 2: Photo Capture + Storage
**Goal**: Staff can upload photos on a mobile browser or desktop, photos are correctly oriented and resized, and cover photo order persists after refresh
**Depends on**: Phase 1
**Requirements**: PHOTO-01, PHOTO-02, PHOTO-03
**Success Criteria** (what must be TRUE):
  1. User can select photos from a phone camera roll (mobile browser) or file system (desktop) and see them as thumbnails
  2. Uploaded photos are stored in private Supabase Storage and displayed via presigned URL (never a public URL)
  3. A photo taken in portrait or landscape on Android is stored and displayed with correct orientation (EXIF correction applied before upload)
  4. User can drag photos to reorder them; the first photo is designated cover photo; order is unchanged after page reload
**Plans**: TBD

Plans:
- [ ] 02-01: PhotoCapture component — file picker, browser-image-compression resize, EXIF orientation correction via exifr, direct upload to Supabase Storage
- [ ] 02-02: Photo thumbnail grid with presigned URL display, drag-to-reorder via @dnd-kit, cover photo designation, order persistence via Server Action

### Phase 3: AI Extraction
**Goal**: The app can extract VIN/PIN/Serial, make, model, and year from a build plate photo with per-field confidence scores, and staff can see what was and was not successfully extracted
**Depends on**: Phase 2
**Requirements**: AI-01, AI-02
**Success Criteria** (what must be TRUE):
  1. User can trigger AI extraction from uploaded build plate photos and see a loading state while the call is in progress
  2. Extracted fields (VIN/PIN/Serial, make, model, year) appear with per-field confidence indicators (high / medium / low)
  3. When a field cannot be read from the photo, the app shows it as unextracted rather than guessing
  4. Extraction results are never auto-saved — the user must proceed to the review step before any data is written
**Plans**: TBD

Plans:
- [ ] 03-01: /api/extract Route Handler — auth check, signed URL generation, GPT-4o generateObject() call with Zod schema, confidence scores, null-for-unclear instruction
- [ ] 03-02: ExtractionPanel component — trigger button, loading state, result display with confidence indicators, failure and partial-extraction states

### Phase 4: Review Form + Save
**Goal**: Staff must confirm all AI-extracted data in an editable form before any record is saved — there is no path to skip this step
**Depends on**: Phase 3
**Requirements**: FORM-01, FORM-02
**Success Criteria** (what must be TRUE):
  1. The review form renders every Salesforce field for the selected asset type (e.g. ~35 fields for Truck, 2-page schema for Earthmoving) and is pre-filled with AI extraction results
  2. Fields with low-confidence extraction scores are visually distinct from high-confidence fields, prompting staff to verify them
  3. Staff cannot reach the output view without completing and submitting the review form
  4. Saved field values are correctly persisted to the asset record and survive a page reload
**Plans**: TBD

Plans:
- [ ] 04-01: DynamicFieldForm component — RHF + Zod, schema-driven field rendering, pre-fill from extraction result, low-confidence visual highlighting
- [ ] 04-02: Save Server Action — upsert asset record with confirmed field values, revalidation, route to output view on success

### Phase 5: Output Generation
**Goal**: After confirming the review form, staff get two copy-paste-ready blocks correctly formatted for Salesforce — structured fields and description
**Depends on**: Phase 4
**Requirements**: SF-01, SF-02, SF-03
**Success Criteria** (what must be TRUE):
  1. The structured fields block lists every field for the asset type in the correct Salesforce order with the exact Salesforce field labels
  2. The description block matches the strict per-subtype format (correct line ordering, no dot points, no marketing language, "Sold As Is, Untested & Unregistered." footer) and is generated deterministically from field values — not AI text
  3. Each block has its own copy-to-clipboard button that gives visible confirmation when copied
**Plans**: TBD

Plans:
- [ ] 05-01: generateFieldsBlock() — deterministic fields formatter using Schema Registry sfOrder and Salesforce labels, whitespace normalisation, snapshot tests for all 7 asset types
- [ ] 05-02: generateDescription() — deterministic description templates per asset subtype, "Sold As Is" footer, snapshot tests for all subtypes
- [ ] 05-03: OutputPanel component — two copy sections (fields + description), clipboard copy with confirmation

### Phase 6: Asset List + Navigation
**Goal**: Staff can see all asset records sorted by recency, resume an incomplete record from the list, and navigate the full workflow without losing context
**Depends on**: Phase 5
**Requirements**: ASSET-03, ASSET-04
**Success Criteria** (what must be TRUE):
  1. Staff can view a list of all asset records sorted by most recently created/updated, with enough detail to identify each record (asset type, make, model, status)
  2. Staff can tap or click a record in the list to resume editing it — returning to the review form for incomplete records or the output view for completed ones
  3. Navigation between list, new asset wizard, and record detail works correctly from both phone browser and desktop
**Plans**: TBD

Plans:
- [ ] 06-01: Asset list page — Server Component, Supabase query sorted by recency, record summary display, routing to new asset and existing record detail
- [ ] 06-02: Edit flow — load existing record into review form, basic asset status (draft / confirmed) tracking

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Schema Registry | 0/3 | Not started | - |
| 2. Photo Capture + Storage | 0/2 | Not started | - |
| 3. AI Extraction | 0/2 | Not started | - |
| 4. Review Form + Save | 0/2 | Not started | - |
| 5. Output Generation | 0/3 | Not started | - |
| 6. Asset List + Navigation | 0/2 | Not started | - |
