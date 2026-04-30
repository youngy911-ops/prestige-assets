---
phase: 26-extraction-accuracy-audit
plan: 01
subsystem: schema-registry
tags: [marine, caravan, ai-extraction, schema, accuracy]
dependency_graph:
  requires: []
  provides: [marine-fuel-type, marine-engine-format-hint, caravan-length-feet-hint]
  affects: [extraction-schema.test.ts, marine.ts, caravan.ts]
tech_stack:
  added: []
  patterns: [aiHint-format-guidance, select-field-with-options]
key_files:
  created: []
  modified:
    - src/lib/schema-registry/schemas/marine.ts
    - src/lib/schema-registry/schemas/caravan.ts
    - src/__tests__/extraction-schema.test.ts
decisions:
  - fuel_type inserted at sfOrder 12 (between engine_hours:11 and fuel_tank_capacity:13) — all downstream sfOrders incremented by 1 to maintain sequence
  - main_engine_details format appended rather than rewritten to preserve all existing engine brand/colour guidance
  - caravan trailer_length hint fully replaced as the old hint was insufficiently direct about unit requirement
metrics:
  duration: ~3 minutes
  completed: 2026-04-30T10:12:25Z
  tasks_completed: 2
  files_modified: 3
---

# Phase 26 Plan 01: Marine Fuel Type + Extraction Hint Accuracy Summary

**One-liner:** Added `fuel_type` field to marine schema (Petrol/Diesel/Electric with inference rules), appended "[Make] [Model] [HP]hp" format guidance to `main_engine_details`, and replaced caravan `trailer_length` hint to mandate FEET output — fixing three targeted AI extraction accuracy gaps.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add marine fuel_type + sharpen main_engine_details hint | 1198cfd | src/lib/schema-registry/schemas/marine.ts |
| 2 | Update marine test count + strengthen caravan trailer_length hint | 1198cfd | src/__tests__/extraction-schema.test.ts, src/lib/schema-registry/schemas/caravan.ts |

## Changes Made

### marine.ts — fuel_type field added

New field at sfOrder 12 (between engine_hours and fuel_tank_capacity):

- `key: 'fuel_type'`, `inputType: 'select'`, `options: ['Petrol', 'Diesel', 'Electric']`, `aiExtractable: true`
- aiHint provides inference rules: outboards → Petrol, named diesel inboards (Yanmar/Volvo Penta/Cummins) → Diesel, electric outboards (Torqeedo/ePropulsion) → Electric, with sensible defaults when in doubt
- All downstream sfOrders incremented: fuel_tank_capacity 12→13, water_tank_capacity 13→14, steering_type 14→15, beam 15→16, draft 16→17, loa 17→18, trailer_length 18→19, launch_date 19→20, sighted 20→21, winch 21→22, thrusters 22→23, damage 23→24, damage_notes 24→25, extras 25→26

### marine.ts — main_engine_details aiHint sharpened

Appended format guidance to end of existing hint:
> Output format: "[Make] [Model] [HP]hp" — e.g. "Yamaha F150 150hp", "Mercury 90hp FourStroke 90hp", "Volvo Penta D4-300 300hp". If HP is not determinable from the cowling badge, omit it.

### caravan.ts — trailer_length aiHint replaced

Old hint: generic "feet (Australian standard)" with common sizes list.

New hint: explicit "ALWAYS output in FEET — never in metres" mandate, explains that build plates may show mm/metres and instructs conversion, provides mm-to-ft equivalents for 16–23ft range, and gives concrete output format examples ("18ft", "21ft") with an explicit negative example ("never '6.4m'").

### extraction-schema.test.ts — marine field count updated

Changed `// marine has 18 aiExtractable fields` / `expect(aiFields.length).toBe(18)` to count 19 with added comment `(fuel_type added in Phase 26)`.

## Verification

- sfOrder sequence: 1–26, no duplicates confirmed by visual grep
- `grep -n "fuel_type" marine.ts` — field present with `aiExtractable: true`
- `grep "toBe(19)" extraction-schema.test.ts` — count updated
- `npx vitest run` — **404/404 tests pass**

## Deviations from Plan

None — plan executed exactly as written. The `src/app/api/describe/route.ts` file had pre-existing unstaged changes unrelated to this plan; those were deliberately excluded from the commit per scope boundary rules and remain unstaged.

## Known Stubs

None — all fields are wired to real schema data.

## Threat Flags

No new trust boundary surface introduced. T-26-01 (sfOrder duplicate risk) verified clean.

## Self-Check: PASSED

- [x] `src/lib/schema-registry/schemas/marine.ts` — fuel_type at sfOrder 12, all sfOrders 1–26 sequential
- [x] `src/lib/schema-registry/schemas/caravan.ts` — trailer_length hint contains "ALWAYS output in FEET"
- [x] `src/__tests__/extraction-schema.test.ts` — `toBe(19)` present at line 237
- [x] Commit 1198cfd exists
- [x] 404/404 tests pass
