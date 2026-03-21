# Roadmap: Prestige Assets — Slattery Auctions Book-In App

## Overview

Six phases derived from the hard dependency chain in the architecture: the Schema Registry must exist before AI extraction can be prompted, before the review form can be rendered, and before output templates can be finalised. Photo upload must precede AI (Route Handler needs storage paths). Review form must precede output (output renders from confirmed field values). Asset list and navigation come last — the core single-asset workflow must be proven before multi-session navigation is built on top of it.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation + Schema Registry** - Auth, Supabase setup, DB schema, and the complete Schema Registry that drives everything downstream (completed 2026-03-17)
- [x] **Phase 2: Photo Capture + Storage** - File picker, client-side resize with EXIF correction, Supabase Storage, drag-to-reorder with persistence (completed 2026-03-17)
- [x] **Phase 3: AI Extraction** - Route Handler calling GPT-4o, per-field confidence scores, extraction UI and failure states (completed 2026-03-18)
- [x] **Phase 4: Review Form + Save** - Dynamic RHF form pre-filled from extraction, low-confidence highlighting, mandatory save step (completed 2026-03-19)
- [x] **Phase 5: Output Generation** - GPT-4o description generation, deterministic fields block, copy-to-clipboard (completed 2026-03-21)
- [x] **Phase 6: Asset List + Navigation** - Recency-sorted list view, routing, resume editing from list (completed 2026-03-21)

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
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Scaffold + vitest + auth middleware + login page + app shell (Wave 1)
- [ ] 01-02-PLAN.md — DB schema (assets + asset_photos + RLS), BRANCHES constant, createAsset Server Action (Wave 2)
- [ ] 01-03-PLAN.md — Schema Registry (all 7 asset types, subtypes, fields) + New Asset wizard (Wave 2, parallel with 01-02)

### Phase 2: Photo Capture + Storage
**Goal**: Staff can upload photos on a mobile browser or desktop, photos are correctly oriented and resized, and cover photo order persists after refresh
**Depends on**: Phase 1
**Requirements**: PHOTO-01, PHOTO-02, PHOTO-03
**Success Criteria** (what must be TRUE):
  1. User can select photos from a phone camera roll (mobile browser) or file system (desktop) and see them as thumbnails
  2. Uploaded photos are stored in private Supabase Storage and displayed via presigned URL (never a public URL)
  3. A photo taken in portrait or landscape on Android is stored and displayed with correct orientation (EXIF correction applied before upload)
  4. User can drag photos to reorder them; the first photo is designated cover photo; order is unchanged after page reload
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Storage migration + image processing utility (processImageForUpload) + photo Server Actions + Wave 0 test scaffolds (Wave 1)
- [ ] 02-02-PLAN.md — CoverPhotoBadge + UploadProgressIndicator + PhotoThumbnail + PhotoUploadZone with upload orchestration (Wave 2)
- [ ] 02-03-PLAN.md — PhotoThumbnailGrid (dnd-kit drag-to-reorder) + /assets/[id]/photos page + wizard redirect (Wave 3)

### Phase 3: AI Extraction
**Goal**: Staff enter inspection notes and trigger AI extraction — the app processes both photos and notes to extract all Salesforce fields with confidence scores, and staff can see exactly what was and was not confidently extracted
**Depends on**: Phase 2
**Requirements**: AI-01, AI-02, AI-03
**Success Criteria** (what must be TRUE):
  1. User can trigger AI extraction from photos alone — photos-only is a fully supported workflow requiring no inspection notes
  2. AI analyses all visible plates and markings in photos (build plate, compliance plate, weight rating plate, cab card etc.) to extract every possible Salesforce field with per-field confidence scores (high / medium / low)
  3. Staff can optionally add freeform "Inspection notes" before extraction — when provided, notes are passed to AI alongside photos to improve accuracy (km, hours, number of keys, service history etc. that photos cannot capture)
  4. User sees a loading state while extraction is in progress
  5. When a field cannot be determined from photos or notes, the app shows it as unextracted rather than guessing
  6. Extraction results are never auto-saved — the user must proceed to the review step before any data is written
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — DB migration + Schema Registry (inspectionPriority flag) + saveInspectionNotes Server Action + buildExtractionSchema + /api/extract Route Handler + Wave 0 test scaffolds (Wave 1)
- [ ] 03-02-PLAN.md — ConfidenceBadge + InspectionNotesSection + ExtractionTriggerState + ExtractionLoadingState + ExtractionResultPanel + ExtractionFailureState + /assets/[id]/extract page + photos page extension + human checkpoint (Wave 2)
- [ ] 03-03-PLAN.md — Fix stale test assertions (truck field count, route response shape) + remove dead import in route.ts (Wave 3, gap closure)

### Phase 4: Review Form + Save
**Goal**: Staff must confirm all AI-extracted data in an editable form, work through a missing-information checklist, and save — there is no path to skip these steps
**Depends on**: Phase 3
**Requirements**: FORM-01, FORM-02, AI-04
**Success Criteria** (what must be TRUE):
  1. The review form renders every Salesforce field for the selected asset type (e.g. ~35 fields for Truck, 2-page schema for Earthmoving) and is pre-filled with AI extraction results
  2. Fields with low-confidence extraction scores are visually distinct from high-confidence fields, prompting staff to verify them
  3. Before saving, a "Missing information" checklist appears showing every field AI could not confidently extract — blocking fields (VIN, rego) cannot be dismissed without a value or explicit "unknown" override; optional fields (e.g. engine hours) can be marked "not applicable"
  4. Staff can update inspection notes and re-trigger AI extraction from the review screen to fill gaps
  5. Staff cannot reach the output view without completing the review form and resolving or dismissing all checklist items
  6. Saved field values plus checklist state (flagged / dismissed-na / confirmed / unknown) are correctly persisted to Supabase and survive a page reload
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — DB migration (checklist_state), npm installs (react-hook-form, shadcn textarea/checkbox/select), blocking-fields.ts, build-form-schema.ts, build-checklist.ts with TDD (Wave 1)
- [ ] 04-02-PLAN.md — FieldRow, DynamicFieldForm, ChecklistItem, MissingInfoChecklist components with TDD (Wave 2)
- [ ] 04-03-PLAN.md — saveReview Server Action (TDD) + ReviewPageClient + /assets/[id]/review page + human checkpoint (Wave 3)

### Phase 5: Output Generation
**Goal**: After confirming the review form, staff get two copy-paste-ready blocks correctly formatted for Salesforce — structured fields and GPT-4o description
**Depends on**: Phase 4
**Requirements**: SF-01, SF-02, SF-03
**Success Criteria** (what must be TRUE):
  1. The structured fields block lists every field for the asset type in the correct Salesforce order with the exact Salesforce field labels
  2. The description block is generated by GPT-4o using a locked system prompt (correct line ordering, no dot points, no marketing language, "Sold As Is, Untested & Unregistered." footer) — editable before copy-paste
  3. Each block has its own copy-to-clipboard button that gives visible confirmation when copied
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — generateFieldsBlock() utility + Wave 0 test scaffolds for all three test files (Wave 1)
- [ ] 05-02-PLAN.md — DB migration (assets.description), /api/describe Route Handler, saveReview stale-clear patch (Wave 1, parallel with 05-01)
- [ ] 05-03-PLAN.md — FieldsBlock + DescriptionBlock + OutputPanel components + /assets/[id]/output page + human checkpoint (Wave 2)

### Phase 6: Asset List + Navigation
**Goal**: Staff can see all asset records sorted by recency, resume an incomplete record from the list, and navigate the full workflow without losing context
**Depends on**: Phase 5
**Requirements**: ASSET-03, ASSET-04
**Success Criteria** (what must be TRUE):
  1. Staff can view a list of all asset records sorted by most recently created/updated, with enough detail to identify each record (asset type, make, model, status)
  2. Staff can tap or click a record in the list to resume editing it — returning to the review form for incomplete records or the output view for completed ones
  3. Navigation between list, new asset wizard, and record detail works correctly from both phone browser and desktop
**Plans**: 2 plans

Plans:
- [ ] 06-01-PLAN.md — Wave-0 test scaffolds + getAssets Server Action + relativeTime utility + BottomNav component + layout integration + createAsset revalidatePath fix (Wave 1)
- [ ] 06-02-PLAN.md — AssetStatusBadge + AssetCard + BranchPickerScreen + AssetList + page.tsx replacement + output page cleanup + human checkpoint (Wave 2)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Schema Registry | 3/3 | Complete   | 2026-03-17 |
| 2. Photo Capture + Storage | 3/3 | Complete   | 2026-03-17 |
| 3. AI Extraction | 3/3 | Complete   | 2026-03-18 |
| 4. Review Form + Save | 3/3 | Complete   | 2026-03-19 |
| 5. Output Generation | 3/3 | Complete   | 2026-03-21 |
| 6. Asset List + Navigation | 2/2 | Complete   | 2026-03-21 |

### Phase 06.1: AI Extraction Quality (INSERTED)

**Goal:** GPT-4o extracts significantly more fields per asset — field-specific descriptions (label + aiHint + options) embedded in the Zod schema replace generic prompts, new fields enabled across earthmoving/agriculture/forklift/trailer, and buildSystemPrompt gains explicit plate-type routing
**Requirements**: none (quality improvement, no new v1 requirement IDs)
**Depends on:** Phase 6
**Plans:** 2/4 plans executed

Plans:
- [ ] 06.1-01-PLAN.md — Add aiHint to FieldDefinition, getAIExtractableFieldDefs, update buildExtractionSchema + buildSystemPrompt, add tests (Wave 1)
- [ ] 06.1-02-PLAN.md — Add aiHint to all 21 aiExtractable truck fields (Wave 2, parallel)
- [ ] 06.1-03-PLAN.md — Enable + annotate earthmoving (8 new fields) and agriculture (5 new fields) schemas (Wave 2, parallel)
- [ ] 06.1-04-PLAN.md — Enable + annotate forklift (6 new fields), trailer (6 new fields), caravan (hints only) schemas (Wave 2, parallel)
