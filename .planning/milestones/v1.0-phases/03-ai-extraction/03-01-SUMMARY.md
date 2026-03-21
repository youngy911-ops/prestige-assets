---
phase: 03-ai-extraction
plan: 01
subsystem: server-side-extraction
tags: [ai, extraction, schema-registry, supabase, route-handler, server-action, tdd]
dependency_graph:
  requires: []
  provides:
    - POST /api/extract Route Handler
    - buildExtractionSchema() Zod schema builder
    - getInspectionPriorityFields() schema registry helper
    - saveInspectionNotes Server Action
    - supabase migration 20260318000003_extraction.sql
  affects:
    - src/lib/schema-registry/types.ts
    - src/lib/schema-registry/index.ts
    - src/lib/schema-registry/schemas/* (all 7)
tech_stack:
  added:
    - ai (Vercel AI SDK v6)
    - "@ai-sdk/openai"
  patterns:
    - generateText + Output.object() (not deprecated generateObject)
    - TDD with vitest vi.mock for supabase, ai, and @ai-sdk/openai
    - Server Action with 'use server' + auth + revalidatePath pattern
key_files:
  created:
    - supabase/migrations/20260318000003_extraction.sql
    - src/lib/ai/extraction-schema.ts
    - src/lib/actions/inspection.actions.ts
    - src/app/api/extract/route.ts
    - src/__tests__/extraction-schema.test.ts
    - src/__tests__/extract-route.test.ts
    - src/__tests__/inspection-actions.test.ts
  modified:
    - src/lib/schema-registry/types.ts (inspectionPriority flag added)
    - src/lib/schema-registry/index.ts (getInspectionPriorityFields exported)
    - src/lib/schema-registry/schemas/truck.ts (5 inspectionPriority flags)
    - src/lib/schema-registry/schemas/trailer.ts (4 inspectionPriority flags)
    - src/lib/schema-registry/schemas/earthmoving.ts (4 inspectionPriority flags)
    - src/lib/schema-registry/schemas/agriculture.ts (4 inspectionPriority flags)
    - src/lib/schema-registry/schemas/forklift.ts (3 inspectionPriority flags)
    - src/lib/schema-registry/schemas/caravan.ts (4 inspectionPriority flags)
decisions:
  - "Used generateText + Output.object() from AI SDK v6 — generateObject is deprecated in v6"
  - "getInspectionPriorityFields() returns FieldDefinition[] sorted by sfOrder ascending — enables UI rendering in consistent order"
  - "Test expectations corrected from plan's behavior block to match sorted-by-sfOrder output (plan behavior block listed fields in non-sorted order)"
  - "Pre-existing PhotoUploadZone test failure deferred — existed before phase 03, out of scope"
metrics:
  duration: "7 minutes"
  completed: "2026-03-18"
  tasks_completed: 2
  files_created: 7
  files_modified: 9
---

# Phase 03 Plan 01: DB Migration + Server-Side Extraction Pipeline Summary

**One-liner:** Complete server-side extraction pipeline: Zod schema builder per asset type + GPT-4o Route Handler using AI SDK v6 generateText + inspectionPriority schema registry extension.

## What Was Built

Two atomic commits delivering the complete server-side extraction pipeline:

**Task 1: DB migration + Schema Registry foundation**
- `supabase/migrations/20260318000003_extraction.sql` — adds `extraction_result jsonb` and `inspection_notes text` columns to the assets table
- Extended `FieldDefinition` type with optional `inspectionPriority?: boolean` flag
- Marked inspection-priority fields across all 7 asset schemas (truck: 5, trailer: 4, earthmoving: 4, agriculture: 4, forklift: 3, caravan: 4, general_goods: 0)
- Added `getInspectionPriorityFields(assetType)` to schema-registry index — filters and sorts by sfOrder ascending

**Task 2: AI extraction implementation**
- `src/lib/ai/extraction-schema.ts` — `buildExtractionSchema()` generates a Zod object schema with `{ value: string|null, confidence: 'high'|'medium'|'low'|null }` per aiExtractable field, plus `buildSystemPrompt()` and `buildUserPrompt()` helpers
- `src/lib/actions/inspection.actions.ts` — `saveInspectionNotes` Server Action with auth check, DB update on `inspection_notes`, and `revalidatePath`
- `src/app/api/extract/route.ts` — POST Route Handler: auth, assetId validation, asset + photo fetch, signed URL generation, GPT-4o call via `generateText + Output.object()`, writes `extraction_result + extraction_stale: false` — never touches `assets.fields`
- Installed `ai` and `@ai-sdk/openai` packages

## Test Results

- 85 tests passing (8 in extraction-schema.test.ts, 5 in extract-route.test.ts, 4 in inspection-actions.test.ts, plus all pre-existing tests)
- 1 pre-existing failure in PhotoUploadZone.test.tsx (not caused by phase 03 work — deferred)
- `npm run build` passes cleanly

## Deviations from Plan

### Auto-corrected Issues

**1. [Rule 2 - Correction] Test expectations aligned with sorted sfOrder**
- **Found during:** Task 1 TDD RED phase
- **Issue:** Plan's behavior block listed getInspectionPriorityFields expected values in non-sorted order (e.g., truck: `['odometer', 'hourmeter', 'registration_number', 'registration_expiry', 'service_history']` but sfOrders are 17, 22, 18, 19, 32 — not sorted). The implementation in the plan's action block uses `.sort((a, b) => a.sfOrder - b.sfOrder)`.
- **Fix:** Tests written to match the implementation's sort order (sorted by sfOrder ascending), which is correct behavior
- **Files modified:** src/__tests__/extraction-schema.test.ts

### Deferred Items

**1. Pre-existing PhotoUploadZone test failure**
- Test `"file input has accept="image/*", multiple, and capture="environment" attributes"` was failing before phase 03 began
- Logged to `.planning/phases/03-ai-extraction/deferred-items.md`
- No action taken in this plan

## Self-Check: PASSED

All created files found on disk. Both task commits verified in git log. Build and all new tests pass.
