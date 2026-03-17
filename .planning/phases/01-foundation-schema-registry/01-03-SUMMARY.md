---
phase: 01-foundation-schema-registry
plan: 03
subsystem: schema-registry
tags: [schema-registry, next-js, typescript, vitest, wizard, asset-types]

# Dependency graph
requires:
  - 01-01 (project scaffold, Supabase auth)
  - 01-02 (createAsset Server Action, DB schema)
provides:
  - SCHEMA_REGISTRY with all 7 asset types — complete TypeScript types, subtypes, fields with sfOrder/aiExtractable/required
  - Helper functions: getSchema, getSubtypes, getAIExtractableFields, getFieldsSortedBySfOrder
  - 3-step New Asset wizard at /assets/new (branch → type → subtype → createAsset)
  - 32 passing unit tests covering ASSET-02 schema registry structure and field completeness
affects: [02-photo-capture, 03-ai-extraction, 04-review-form, 05-output-generation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Schema Registry as const Record<AssetType, AssetSchema> — single source of truth for all downstream components
    - descriptionTemplate stub on each schema — Phase 5 implements deterministic templates
    - localStorage pre-selection pattern for lastUsedBranch in client wizard
    - 3-step wizard with step state and back-navigation without losing prior selections

key-files:
  created:
    - src/lib/schema-registry/types.ts
    - src/lib/schema-registry/index.ts
    - src/lib/schema-registry/schemas/truck.ts
    - src/lib/schema-registry/schemas/trailer.ts
    - src/lib/schema-registry/schemas/earthmoving.ts
    - src/lib/schema-registry/schemas/agriculture.ts
    - src/lib/schema-registry/schemas/forklift.ts
    - src/lib/schema-registry/schemas/caravan.ts
    - src/lib/schema-registry/schemas/general-goods.ts
    - src/components/asset/BranchSelector.tsx
    - src/components/asset/AssetTypeSelector.tsx
    - src/components/asset/AssetSubtypeSelector.tsx
    - src/app/(app)/assets/new/page.tsx
    - src/__tests__/schema-registry.test.ts
  modified: []

key-decisions:
  - "Schema files placed under src/lib/schema-registry/ (not lib/) — tsconfig paths map @/* to ./src/*; confirmed from Plan 01-01 summary"
  - "createAsset already existed from Plan 01-02 — no stub needed; wizard imported directly"
  - "descriptionTemplate is a stub returning empty string on all 7 schemas — Phase 5 implements deterministic templates per CONTEXT.md"
  - "caravan hasGlassValuation: true with 27 fields including owners_manual and damage; all other types false"

requirements-completed: [ASSET-02]

# Metrics
duration: 4min
completed: 2026-03-17
---

# Phase 1 Plan 03: Schema Registry + New Asset Wizard Summary

**Schema Registry with 7 asset types (456 fields total), 3-step New Asset wizard, and 32 passing unit tests — all downstream AI extraction, review form, and output templates can now read from SCHEMA_REGISTRY**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T12:20:00Z
- **Completed:** 2026-03-17T12:24:22Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Complete Schema Registry at `src/lib/schema-registry/` — types, index with 4 helper functions, 7 asset schema files
- All 7 asset types: truck (33 fields), trailer (23 fields), earthmoving (34 fields), agriculture (27 fields), forklift (23 fields), caravan (27 fields), general_goods (1 field)
- Every field has: key, label, sfOrder (unique per type), inputType, aiExtractable, required; select fields have options arrays
- caravan is the only schema with hasGlassValuation: true
- general_goods has exactly 1 subtype ('general') and 1 field ('description')
- AI-extractable fields correctly flagged: VIN, make, model, year, serial, PIN across all relevant types
- 3-step New Asset wizard at /assets/new: BranchSelector (10 branches, localStorage pre-selection), AssetTypeSelector (2-column icon grid), AssetSubtypeSelector (list from registry)
- Wizard calls createAsset(branch, assetType, assetSubtype) on step 3 Continue and redirects to /assets/{assetId}
- 32 schema-registry tests GREEN, 47 total tests GREEN (5 test files), TypeScript clean

## Task Commits

1. **Task 1: Schema Registry types, index, and all 7 asset schema files** — `5b6419a` (feat)
2. **Task 2: New Asset wizard components and /assets/new page** — `0fcea5e` (feat)

## Files Created

- `src/lib/schema-registry/types.ts` — AssetType, ASSET_TYPES, AssetSubtype, FieldDefinition, AssetSchema TypeScript types
- `src/lib/schema-registry/index.ts` — SCHEMA_REGISTRY Record, getSchema, getSubtypes, getAIExtractableFields, getFieldsSortedBySfOrder
- `src/lib/schema-registry/schemas/truck.ts` — 33 fields, 5 subtypes
- `src/lib/schema-registry/schemas/trailer.ts` — 23 fields, 6 subtypes
- `src/lib/schema-registry/schemas/earthmoving.ts` — 34 fields, 7 subtypes
- `src/lib/schema-registry/schemas/agriculture.ts` — 27 fields, 6 subtypes
- `src/lib/schema-registry/schemas/forklift.ts` — 23 fields, 4 subtypes
- `src/lib/schema-registry/schemas/caravan.ts` — 27 fields, 3 subtypes, hasGlassValuation: true
- `src/lib/schema-registry/schemas/general-goods.ts` — 1 field, 1 subtype
- `src/components/asset/BranchSelector.tsx` — client component, all 10 branches, selected state
- `src/components/asset/AssetTypeSelector.tsx` — client component, 2-column icon grid, reads SCHEMA_REGISTRY
- `src/components/asset/AssetSubtypeSelector.tsx` — client component, reads getSubtypes() from registry
- `src/app/(app)/assets/new/page.tsx` — 3-step wizard, localStorage branch pre-selection, createAsset() call
- `src/__tests__/schema-registry.test.ts` — 32 tests covering ASSET-02 structure, field completeness, AI-extractable flags

## Decisions Made

- Schema files placed under `src/lib/schema-registry/` (not bare `lib/`) because tsconfig paths map `@/*` to `./src/*` — confirmed from Plan 01-01 summary
- `createAsset` already existed from Plan 01-02 execution — wizard imported directly without any stub needed
- `descriptionTemplate` is a stub `() => ''` on all 7 schemas — Phase 5 implements deterministic templates per CONTEXT.md decision
- `caravan` schema ends at sfOrder 27 (damage field) with no Glass's Valuation sub-fields in the registry — Glass fields come from external Glass's Valuation service, not user-entered schema fields

## Deviations from Plan

None - plan executed exactly as written. Schema files were placed under `src/lib/` (matching the project's tsconfig @/* alias to ./src/*) rather than the bare `lib/` paths in the plan text, which is the correct interpretation consistent with Plan 01-01 and 01-02.

## Next Phase Readiness

- SCHEMA_REGISTRY is complete and the single source of truth for all downstream components
- Phase 2 (photo capture) can import ASSET_TYPES from registry for type-safe asset references
- Phase 3 (AI extraction) can call getAIExtractableFields(assetType) to build the extraction prompt field list
- Phase 4 (review form) can call getSchema(assetType).fields to render the field review form
- Phase 5 (output generation) can implement descriptionTemplate on each schema file independently

---
*Phase: 01-foundation-schema-registry*
*Completed: 2026-03-17*
