# Phase 16: Subtype Schema Alignment - Research

**Researched:** 2026-03-23
**Domain:** Schema data replacement — TypeScript array literals in 8 asset schema files
**Confidence:** HIGH

## Summary

Phase 16 is a pure data-replacement phase. All 8 asset type schema files contain a `subtypes: AssetSubtype[]` array. Every array in every file needs to be replaced with a new set of `{ key, label }` objects matching Salesforce exactly. No new files, no new components, no new utility functions, no API changes. The registry index (`index.ts`), the `AssetSubtype` type, the UI component (`AssetSubtypeSelector`), and the 3-step new-asset wizard are all untouched.

The only non-trivial element of this phase is the test suite: `schema-registry.test.ts` contains hard-coded count and key assertions that will all fail against the new arrays. Those tests must be rewritten to match the new state of the world before or alongside the schema changes. Agriculture, Forklift, and Caravan acquire subtype selectors "for free" — the wizard's Step 3 already gates on `subtypes.length > 0` and there are no conditional checks blocking these three types.

**Primary recommendation:** Replace all 8 subtype arrays in sequence, update `schema-registry.test.ts` in the same pass, run `vitest run` to confirm green, done.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Label fidelity**
- Labels must match Salesforce exactly — copy verbatim from SF
- "Concrete - Agitator", "Service Truck", "Tray Truck", "Bulldozer/Crawler Tractor" — no cleaning up punctuation

**Key naming convention**
- Snake_case, consistent with Phase 13
- Slashes and dashes stripped from keys: "Concrete - Agitator" → `concrete_agitator`, "Mower/Conditioner" → `mower_conditioner`
- Compound merge key: "Bulldozer/Crawler Tractor" → `bulldozer_crawler_tractor` (explicit)
- Ampersands stripped: "Gardening & Landscaping" → `gardening_landscaping`
- Parentheses stripped: "Conveyors / Stackers" → `conveyors_stackers`

**"Coupe" across asset types**
- SF includes "Coupe" in most asset type subtype lists
- Include it wherever SF requires it
- Types that include Coupe: Truck, Trailer, Earthmoving, Agriculture, Caravan, Marine, General Goods

**Backward compatibility**
- No migration, no graceful fallback — just replace arrays cleanly
- App is pre-production with near-zero records
- Old subtype keys on existing records will render without a matching label (acceptable)

**New subtype selectors (Agriculture, Forklift, Caravan)**
- Same pattern as Truck/Trailer — selector on asset creation/edit screen
- No change to InspectionNotesSection

**Truck subtypes (24 — SF 21 plus 3 user additions)**
- EWP, Tilt Tray, and Flat Deck kept in addition to the 21 SF subtypes
- Full key list: `beavertail, cab_chassis, concrete_agitator, concrete_pump, coupe, crane_truck, curtainsider, ewp, flat_deck, fuel_truck, garbage, hook_bin, other, pantech, prime_mover, refrigerated_pantech, service_truck, skip_bin, stock_truck, tanker, tilt_tray, tray_truck, vacuum, water_truck`
- Key changes from current: `service` → `service_truck`, label "Concrete Agitator" → "Concrete - Agitator", label "Concrete Pump" → "Concrete - Pump"
- Removed from current: `tipper` (not in SF truck list)

**Trailer subtypes (24)**
- Note: REQUIREMENTS.md says 25 but listed items count to 24 — implement the 24 listed
- Full key list: `box, car_carrier, coupe, curtainsider, deck_widener, dog, dolly, flat_deck, low_loader, other, pantech, pig, plant, refrigerated_curtainsider, refrigerated_pantech, side_loader, side_tipper, skel, stock, tag, tanker, timber_jinker, tipper, walking_floor`
- Removed from current: `extendable` (Extendable), `drop_deck` (Drop Deck)

**Earthmoving subtypes (19)**
- `bulldozer` + `crawler_tractor` → `bulldozer_crawler_tractor` / "Bulldozer/Crawler Tractor"
- `backhoe_loader` → `backhoe` / "Backhoe"
- Remove: `telehandler` (moves to Forklift), `trencher` (not in SF list)
- Full key list: `attachments, backhoe, bulldozer_crawler_tractor, compactor, conveyors_stackers, coupe, crusher, dump_truck, excavator, motor_grader, motor_scraper, other, scraper, screener, skid_steer_loader, tracked_loader, tracked_skid_steer_loader, washing, wheel_loader`

**Agriculture subtypes (12 — new selector)**
- Replace current 6 subtypes entirely
- Full key list: `air_seeder, baler, combine_harvester, coupe, disc_seeder, forestry, grain_auger, mower_conditioner, other, plough, spray_rig, tractor`

**Forklift subtypes (9 — new selector)**
- Replace current 4 subtypes entirely; telehandler moves here from earthmoving
- Full key list: `clearview_mast, container_mast, electric_pallet_jack, ewp, other, stock_picker, telehandler, walk_behind, walkie_stacker`

**Caravan subtypes (5 — new selector)**
- Expand from current 3; `motor_home` key → `motorhome` / "Motorhome" (no space)
- Full key list: `camper_trailer, caravan, coupe, motorhome, other`

**Marine subtypes (10)**
- Replace current 3 (Boat, Yacht, Jet Ski) entirely
- Full key list: `barge, commercial, coupe, fishing_vessel, other, personal_watercraft, private, recreational, trailer_boat, tug`

**General Goods subtypes (16)**
- Replace current 5 entirely
- Full key list: `agriculture, gardening_landscaping, goodwill, health_fitness, hospitality, it_computers, jewellery_watches_collectables, medical, miscellaneous, office, other, plant_equipment, retail_fit_out, retail_stock, signage, tools_toolboxes`

### Claude's Discretion
- Exact ordering of subtypes within each array (alphabetical by label is fine, or group by commonality)
- Whether `backhoe_loader` key should be renamed to `backhoe` or kept — either is fine; rename if clean to do so
- The 25th Trailer subtype if it exists — implement the 24 listed and move on

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SUBTYPE-01 | Truck subtype list: 21 SF subtypes (user additions bring total to 24) | Truck schema confirmed — current 15 subtypes replaced; key renames documented |
| SUBTYPE-02 | Trailer subtype list: 25 SF subtypes (CONTEXT lists 24 — implement 24 listed) | Trailer schema confirmed — current 11 subtypes replaced; removals documented |
| SUBTYPE-03 | Earthmoving subtype list: 19 subtypes with Bulldozer/Crawler Tractor merged | Earthmoving schema confirmed — current 12 subtypes replaced; merge and removals documented |
| SUBTYPE-04 | Agriculture subtype selector: 12 SF subtypes (first time) | Agriculture schema confirmed — current 6 subtypes replaced; wizard Step 3 auto-renders |
| SUBTYPE-05 | Forklift subtype selector: 9 SF subtypes (first time) | Forklift schema confirmed — current 4 subtypes replaced; wizard Step 3 auto-renders |
| SUBTYPE-06 | Caravan subtype selector: 5 SF subtypes (first time) | Caravan schema confirmed — current 3 subtypes replaced; wizard Step 3 auto-renders |
| SUBTYPE-07 | Marine subtype list: 10 subtypes replacing Boat/Yacht/Jet Ski | Marine schema confirmed — current 3 subtypes replaced |
| SUBTYPE-08 | General Goods subtype list: 16 subtypes replacing current 5 | General Goods schema confirmed — current 5 subtypes replaced |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript (existing) | project default | Schema files are `.ts` — array literal replacement, no runtime imports | Already in use |
| Vitest | ^4.1.0 | Test runner for `schema-registry.test.ts` | Already configured; `npm test` runs `vitest run` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | — | Phase is data-only | No new dependencies |

**Installation:** No new packages required.

---

## Architecture Patterns

### Subtype Array Shape (confirmed from `types.ts`)
```typescript
// Source: src/lib/schema-registry/types.ts
export type AssetSubtype = {
  key: string    // internal snake_case key stored in DB
  label: string  // display label shown in UI
}
```

Every subtype entry is `{ key: string, label: string }` — no other fields, no validation, no enum constraint on `key`. Plain array literal replacement is the entire implementation.

### Schema File Pattern (confirmed from all 8 files)
```typescript
// Source: src/lib/schema-registry/schemas/truck.ts (representative)
import type { AssetSchema } from '../types'

export const truckSchema: AssetSchema = {
  assetType: 'truck',
  displayName: 'Truck',
  subtypes: [
    { key: 'prime_mover', label: 'Prime Mover' },
    // ... more entries
  ],
  hasGlassValuation: false,
  fields: [ /* unchanged */ ],
  descriptionTemplate: (_fields, _subtype) => '',
}
```

Only the `subtypes: [...]` block changes per file. `fields`, `hasGlassValuation`, `descriptionTemplate`, `assetType`, `displayName` are all untouched.

### Registry Index (no changes needed)
The registry (`src/lib/schema-registry/index.ts`) imports schema objects by reference. No changes to the index file, no changes to `types.ts`. The `getSubtypes(assetType)` function reads directly from `SCHEMA_REGISTRY[assetType].subtypes` — updating the array in the schema file is the only required action.

### UI Wiring for New Selectors
The new-asset wizard (`src/app/(app)/assets/new/page.tsx`) renders Step 3 (`AssetSubtypeSelector`) for all asset types — there is no conditional guard blocking Agriculture, Forklift, or Caravan. Confirmed by the UI-SPEC: "Step 3 renders when `assetType` is set — already handles all 8 types including Agriculture, Forklift, Caravan once their `subtypes` arrays are populated." No component changes required.

### Anti-Patterns to Avoid
- **Modifying `types.ts` or `index.ts`:** The type definition and registry are correct as-is. No structural changes.
- **Changing `fields` arrays:** Phase 16 is subtypes only. Field definitions, sfOrder values, and aiHints are out of scope.
- **Renaming `displayName` on Caravan:** Current value is "Caravan / Motor Home" — the CONTEXT.md does not instruct changing this. Leave as-is. (The heading "Caravan — Subtype" is generated from `displayName` but per UI-SPEC that is auto-generated — no hardcoded copy change needed.)
- **Adding migration logic:** CONTEXT.md explicitly calls for no migration.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Subtype key → label lookup | Custom map/enum | Existing `getSubtypes()` | Already in registry |
| UI for new selectors | New component | Existing `AssetSubtypeSelector` | Already wired for all 8 types |
| Key validation | Zod enum or custom validator | None needed | `key: string` with no constraint; pre-production, no migration |

---

## Current State Audit

### What exists now vs. what Phase 16 requires

| Asset Type | Current Count | Target Count | Changes |
|------------|--------------|-------------|---------|
| Truck | 15 | 24 | Add 9 entries; rename `service`→`service_truck`; update labels for concrete types; add `coupe`, `crane_truck`, `fuel_truck`, `garbage`, `hook_bin`, `skip_bin`, `stock_truck`, `tanker`, `water_truck` |
| Trailer | 11 | 24 | Add 13 entries; remove `extendable`, `drop_deck`; add `car_carrier`, `coupe`, `curtainsider`, `deck_widener`, `dog`, `dolly`, `pantech`, `pig`, `refrigerated_curtainsider`, `refrigerated_pantech`, `side_tipper`, `tag`, `tanker`, `timber_jinker`, `tipper`, `walking_floor` |
| Earthmoving | 12 | 19 | Merge `bulldozer`+`crawler_tractor`→`bulldozer_crawler_tractor`; rename `backhoe_loader`→`backhoe`; remove `telehandler`, `trencher`; add `attachments`, `conveyors_stackers`, `coupe`, `crusher`, `motor_scraper`, `scraper`, `screener`, `tracked_loader`, `tracked_skid_steer_loader`, `washing` |
| Agriculture | 6 | 12 | Full replacement — remove all 6 current; add 12 SF subtypes |
| Forklift | 4 | 9 | Full replacement — remove all 4 current; add 9 SF subtypes (telehandler absorbed from earthmoving) |
| Caravan | 3 | 5 | Replace `motor_home`→`motorhome`; add `coupe`, `other`; keep `caravan`, `camper_trailer` |
| Marine | 3 | 10 | Full replacement — remove Boat, Yacht, Jet Ski; add 10 SF subtypes |
| General Goods | 5 | 16 | Full replacement — remove all 5 current; add 16 SF subtypes |

---

## Common Pitfalls

### Pitfall 1: Label punctuation drift
**What goes wrong:** Key is correct but label diverges from Salesforce — e.g. "Concrete Agitator" instead of "Concrete - Agitator", or "Motor Home" instead of "Motorhome".
**Why it happens:** Developer "cleans up" labels based on feel rather than copying verbatim.
**How to avoid:** Copy labels exactly from CONTEXT.md. Never normalize punctuation. Use the full label list from CONTEXT.md as the source of truth.
**Warning signs:** Any label containing " - " or "/" stripped during implementation.

### Pitfall 2: Test suite not updated in sync
**What goes wrong:** Schema replacement passes but `vitest run` fails because `schema-registry.test.ts` has hard-coded count assertions (`toHaveLength(15)`, `toHaveLength(11)`, etc.) and key presence assertions that no longer match.
**Why it happens:** Tests correctly describe the old state.
**How to avoid:** Update `schema-registry.test.ts` in the same task as schema changes. Run `vitest run` before marking the task done.
**Warning signs:** Tests referencing `service` (old key), `backhoe_loader`, `bulldozer`/`crawler_tractor` separately, `trencher`, `telehandler` in earthmoving, old general goods keys.

### Pitfall 3: Truck count confusion (21 vs 24)
**What goes wrong:** Implementing exactly 21 SF subtypes, omitting EWP, Tilt Tray, and Flat Deck.
**Why it happens:** REQUIREMENTS.md says "21 subtypes" — but CONTEXT.md explicitly adds 3 user extras to that 21, yielding 24.
**How to avoid:** CONTEXT.md governs — implement 24 Truck subtypes. The test should assert `toHaveLength(24)`.

### Pitfall 4: Trailer count confusion (25 vs 24)
**What goes wrong:** Hunting for a 25th trailer subtype that may not exist.
**Why it happens:** REQUIREMENTS.md says 25 but CONTEXT.md lists 24 items.
**How to avoid:** Implement the 24 listed in CONTEXT.md. Claude's discretion per CONTEXT.md: "implement the 24 listed and move on". Test should assert `toHaveLength(24)`.

### Pitfall 5: Agriculture/Forklift/Caravan selector not appearing
**What goes wrong:** Subtypes are updated in schema but selector still doesn't render for these types in the UI.
**Why it happens:** Developer may believe a code change is also needed — it is NOT. The UI-SPEC confirms the wizard already handles all 8 types.
**How to avoid:** No UI change needed. If the selector doesn't appear after schema update, check that the wizard's Step 3 reads from `getSubtypes(assetType)` which reads from the registry, which reads from the schema file.

### Pitfall 6: EWP appears in both Truck and Forklift
**What goes wrong:** Removing EWP from Forklift because "it's already in Truck" or vice versa.
**Why it happens:** Same label `ewp` / "EWP" in two separate schemas looks like duplication.
**How to avoid:** This is intentional — truck EWP = EWP body on truck chassis; forklift EWP = forklift-mounted EWP. Both schemas keep the entry.

### Pitfall 7: Key `service` not renamed
**What goes wrong:** Leaving `{ key: 'service', label: 'Service' }` in place rather than replacing with `{ key: 'service_truck', label: 'Service Truck' }`.
**Why it happens:** Missed in the diff.
**Warning signs:** Test assertion `toContain('service')` passes but `toContain('service_truck')` fails.

---

## Code Examples

### Subtype array replacement pattern
```typescript
// Source: src/lib/schema-registry/schemas/truck.ts (current)
subtypes: [
  { key: 'prime_mover', label: 'Prime Mover' },
  { key: 'service',     label: 'Service' },        // OLD — must become service_truck
  // ...
],

// After Phase 16:
subtypes: [
  { key: 'beavertail',           label: 'Beavertail' },
  { key: 'cab_chassis',          label: 'Cab Chassis' },
  { key: 'concrete_agitator',    label: 'Concrete - Agitator' },
  { key: 'concrete_pump',        label: 'Concrete - Pump' },
  { key: 'coupe',                label: 'Coupe' },
  { key: 'crane_truck',          label: 'Crane Truck' },
  { key: 'curtainsider',         label: 'Curtainsider' },
  { key: 'ewp',                  label: 'EWP' },
  { key: 'flat_deck',            label: 'Flat Deck' },
  { key: 'fuel_truck',           label: 'Fuel Truck' },
  { key: 'garbage',              label: 'Garbage' },
  { key: 'hook_bin',             label: 'Hook Bin' },
  { key: 'other',                label: 'Other' },
  { key: 'pantech',              label: 'Pantech' },
  { key: 'prime_mover',          label: 'Prime Mover' },
  { key: 'refrigerated_pantech', label: 'Refrigerated Pantech' },
  { key: 'service_truck',        label: 'Service Truck' },
  { key: 'skip_bin',             label: 'Skip Bin' },
  { key: 'stock_truck',          label: 'Stock Truck' },
  { key: 'tanker',               label: 'Tanker' },
  { key: 'tilt_tray',            label: 'Tilt Tray' },
  { key: 'tray_truck',           label: 'Tray Truck' },
  { key: 'vacuum',               label: 'Vacuum' },
  { key: 'water_truck',          label: 'Water Truck' },
],
```

### Test pattern that must be updated
```typescript
// Source: src/lib/schema-registry/schemas/truck.ts (CURRENT state — must change)
it('truck has exactly 15 subtypes including other', () => {
  const subtypes = getSubtypes('truck')
  expect(subtypes).toHaveLength(15)           // change to 24
  expect(subtypes.map(s => s.key)).toContain('service')   // change to 'service_truck'
  expect(subtypes.map(s => s.key)).not.toContain('service_truck')  // remove/invert
})

// After Phase 16 — example updated assertion block:
it('truck has exactly 24 subtypes matching SF plus user additions', () => {
  const subtypes = getSubtypes('truck')
  expect(subtypes).toHaveLength(24)
  expect(subtypes.map(s => s.key)).toContain('service_truck')
  expect(subtypes.map(s => s.key)).not.toContain('service')
  expect(subtypes.map(s => s.key)).toContain('crane_truck')
  expect(subtypes.map(s => s.key)).toContain('coupe')
  expect(subtypes.map(s => s.key)).toContain('ewp')
  expect(subtypes.map(s => s.key)).toContain('tilt_tray')
  expect(subtypes.map(s => s.key)).toContain('flat_deck')
})
```

---

## Integration Points — Phase Boundary Notes

The description route (`src/app/api/describe/route.ts`) uses subtype keys to select templates. Phase 16 changes keys. Phase 17 updates the templates. The only cross-phase risk is:

- Key renames that Phase 16 introduces (e.g. `service` → `service_truck`, `backhoe_loader` → `backhoe`, `bulldozer`/`crawler_tractor` → `bulldozer_crawler_tractor`, `motor_home` → `motorhome`) mean the description prompt will not find a matching template for those new keys until Phase 17.
- This is acceptable — the app is pre-production. Records with old keys will render without a template match, which is already the stated fallback for old records.
- **Phase 16 must not touch `src/app/api/describe/route.ts`.**

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm test -- --reporter=verbose src/__tests__/schema-registry.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUBTYPE-01 | Truck has 24 subtypes, `service_truck` key present, old `service` key absent | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ (needs update) |
| SUBTYPE-02 | Trailer has 24 subtypes, `extendable` and `drop_deck` absent | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ (needs update) |
| SUBTYPE-03 | Earthmoving has 19 subtypes, `bulldozer_crawler_tractor` present, `bulldozer`/`crawler_tractor` absent, `backhoe` present, `backhoe_loader` absent, `telehandler` absent, `trencher` absent | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ (needs update) |
| SUBTYPE-04 | Agriculture has 12 subtypes | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ (needs update) |
| SUBTYPE-05 | Forklift has 9 subtypes, `telehandler` present | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ (needs update) |
| SUBTYPE-06 | Caravan has 5 subtypes, `motorhome` present, `motor_home` absent, `coupe` present | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ (needs update) |
| SUBTYPE-07 | Marine has 10 subtypes, `boat`/`yacht`/`jet_ski` absent | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ (needs update) |
| SUBTYPE-08 | General Goods has 16 subtypes, old keys absent | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ (needs update) |

### Sampling Rate
- **Per task commit:** `npm test -- src/__tests__/schema-registry.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — `src/__tests__/schema-registry.test.ts` exists and covers all 8 schema types. The file needs content updates (not creation) to reflect the new counts and keys.

---

## Open Questions

1. **Trailer 25th subtype**
   - What we know: REQUIREMENTS.md says 25 subtypes; CONTEXT.md lists exactly 24
   - What's unclear: Whether there is a legitimate 25th Salesforce trailer subtype
   - Recommendation: Implement 24 as specified in CONTEXT.md. Note in the plan that REQUIREMENTS.md count is likely a documentation error. The planner should write the test asserting 24.

2. **Ordering within arrays**
   - What we know: CONTEXT.md leaves this to Claude's discretion; alphabetical by label is acceptable
   - Recommendation: Use alphabetical by label as the consistent rule across all 8 types. This makes future diffs and audits easy.

---

## Sources

### Primary (HIGH confidence)
- `src/lib/schema-registry/types.ts` — `AssetSubtype` type confirmed as `{ key: string, label: string }`
- `src/lib/schema-registry/index.ts` — `getSubtypes()` implementation confirmed; no changes needed
- `src/lib/schema-registry/schemas/*.ts` (all 8) — current state audited; exact diffs documented above
- `src/__tests__/schema-registry.test.ts` — existing test assertions that must be updated
- `.planning/phases/16-subtype-schema-alignment/16-CONTEXT.md` — locked decisions and full key/label lists
- `.planning/phases/16-subtype-schema-alignment/16-UI-SPEC.md` — confirmed no component changes needed; wizard wiring verified

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — requirement IDs and acceptance criteria (minor count discrepancy on SUBTYPE-02 noted)
- `.planning/STATE.md` — prior phase decisions (Phase 13 compound key convention, Phase 14 description key naming)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all files read directly; no external dependencies
- Architecture: HIGH — confirmed from source code, not inference
- Pitfalls: HIGH — derived from direct code audit of existing tests and schema files
- Test update requirements: HIGH — `schema-registry.test.ts` fully read; all breaking assertions identified

**Research date:** 2026-03-23
**Valid until:** Indefinite (stable TypeScript data files; no external dependencies)
