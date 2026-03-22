# Phase 13: Subtype Expansions - Research

**Researched:** 2026-03-22
**Domain:** Schema registry — subtype array replacement, General Goods field schema (already partially applied as hotfix)
**Confidence:** HIGH

## Summary

Phase 13 is a data-only schema change. Four asset schemas need their `subtypes` arrays replaced: Truck (5 → 14), Trailer (6 → 11), Earthmoving (7 → 10), and General Goods (1 → 5). All subtype keys and labels are fully specified in CONTEXT.md — no design decisions remain.

The General Goods schema fields (`make`, `model`, `serial_number`, `dom`, `extras`) were already applied as a hotfix and are live in the codebase. The only remaining General Goods work is replacing the `subtypes` array (dropping `general`, adding 5 new keys). The `buildSystemPrompt` GENERAL GOODS inference block was also already added in Phase 12.

The critical planner risk is test drift: several existing test assertions check the old subtype counts and keys by name. All four affected schema tests will need updating. No UI changes are required — `getSubtypes(assetType)` drives selectors automatically.

**Primary recommendation:** Make all four schema file edits in a single plan wave, then update the test assertions in a second wave. No registry, types.ts, or UI changes are needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Backward Compatibility**
- No real production records exist yet — just replace subtype arrays cleanly
- No migration, no graceful fallback for old keys needed

**Key Naming Convention**
- Snake_case, clean and lowercase, no abbreviation bloat
- "EWP" stays `ewp` (industry acronym, universally understood)
- "Service Truck" becomes `service` (drops the `_truck` suffix — label is "Service")
- "Skid Steer Loader" → `skid_steer_loader` (was `skid_steer`)
- "Motor Grader" → `motor_grader` (was `grader`)
- "Backhoe Loader" → `backhoe_loader` (was `backhoe`)

**Truck Subtypes (14 — replacing existing 5)**
Remove: `rigid_truck`, `crane_truck`
Replace with:
```
{ key: 'prime_mover',          label: 'Prime Mover' }
{ key: 'flat_deck',            label: 'Flat Deck' }
{ key: 'cab_chassis',          label: 'Cab Chassis' }
{ key: 'tipper',               label: 'Tipper' }
{ key: 'pantech',              label: 'Pantech' }
{ key: 'refrigerated_pantech', label: 'Refrigerated Pantech' }
{ key: 'curtainsider',         label: 'Curtainsider' }
{ key: 'beavertail',           label: 'Beavertail' }
{ key: 'tilt_tray',            label: 'Tilt Tray' }
{ key: 'vacuum',               label: 'Vacuum' }
{ key: 'concrete_pump',        label: 'Concrete Pump' }
{ key: 'concrete_agitator',    label: 'Concrete Agitator' }
{ key: 'ewp',                  label: 'EWP' }
{ key: 'service',              label: 'Service' }
```

**Trailer Subtypes (11 — replacing existing 6)**
Remove: `flat_top`, `side_tipper`, `dog_trailer`, `b_double`, `semi_trailer`
Replace with:
```
{ key: 'flat_deck',   label: 'Flat Deck' }
{ key: 'side_loader', label: 'Side Loader' }
{ key: 'tipper',      label: 'Tipper' }
{ key: 'extendable',  label: 'Extendable' }
{ key: 'drop_deck',   label: 'Drop Deck' }
{ key: 'skel',        label: 'Skel' }
{ key: 'pig',         label: 'Pig' }
{ key: 'plant',       label: 'Plant' }
{ key: 'tag',         label: 'Tag' }
{ key: 'box',         label: 'Box' }
{ key: 'low_loader',  label: 'Low Loader' }
```

**Earthmoving Subtypes (10 — expanding from 7)**
Rename existing: `skid_steer` → `skid_steer_loader`, `grader` → `motor_grader`, `backhoe` → `backhoe_loader`
Add: `compactor`, `dump_truck`, `trencher`
Full list:
```
{ key: 'excavator',         label: 'Excavator' }
{ key: 'skid_steer_loader', label: 'Skid Steer Loader' }
{ key: 'compactor',         label: 'Compactor' }
{ key: 'dozer',             label: 'Dozer' }
{ key: 'motor_grader',      label: 'Motor Grader' }
{ key: 'wheel_loader',      label: 'Wheel Loader' }
{ key: 'backhoe_loader',    label: 'Backhoe Loader' }
{ key: 'telehandler',       label: 'Telehandler' }
{ key: 'dump_truck',        label: 'Dump Truck' }
{ key: 'trencher',          label: 'Trencher' }
```

**General Goods Subtypes (5 — replacing existing 1)**
Remove: `general`
Replace with:
```
{ key: 'tools_equipment',    label: 'Tools & Equipment' }
{ key: 'attachments',        label: 'Attachments' }
{ key: 'workshop_equipment', label: 'Workshop Equipment' }
{ key: 'office_it',          label: 'Office & IT' }
{ key: 'miscellaneous',      label: 'Miscellaneous' }
```

**General Goods Schema Fields** (already applied as hotfix — no change needed)
- `make`, `model`, `serial_number`, `dom`, `extras` — already live in `general-goods.ts`
- `serial_number` has `inspectionPriority: true`
- `dom` is text inputType (MM/YYYY or year-only)
- `required: true` for `make` and `model` only

**General Goods AI Extraction** (already applied in Phase 12)
- GENERAL GOODS inference block already present in `buildSystemPrompt` Step 2

### Claude's Discretion
- Exact sfOrder values for General Goods fields (1–5 sequential is fine)
- Whether `dom` uses `aiHint` referencing the compliance_date pattern

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRUCK-01 | Truck subtypes updated to 14 new values; Rigid Truck and Crane Truck removed | Replace `subtypes` array in `src/lib/schema-registry/schemas/truck.ts` |
| TRAIL-01 | Trailer subtypes updated to 11 new values | Replace `subtypes` array in `src/lib/schema-registry/schemas/trailer.ts` |
| EARTH-01 | Earthmoving subtypes updated to 10 values (3 renamed, 3 added) | Replace `subtypes` array in `src/lib/schema-registry/schemas/earthmoving.ts` |
| GOODS-01 | General Goods subtypes updated to 5 new values; `general` key removed | Replace `subtypes` array in `src/lib/schema-registry/schemas/general-goods.ts` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | existing | Schema files are `.ts` with typed `AssetSchema` | Already used throughout |
| Vitest | ^4.1.0 | Test runner for schema registry assertions | Established project test framework |

### Supporting
No additional libraries needed. All changes are pure data edits to existing TypeScript objects.

**Installation:** None required.

## Architecture Patterns

### Schema File Structure
Each schema is a self-contained TypeScript module exporting a single `const` of type `AssetSchema`:

```typescript
// Source: src/lib/schema-registry/schemas/truck.ts
import type { AssetSchema } from '../types'

export const truckSchema: AssetSchema = {
  assetType: 'truck',
  displayName: 'Truck',
  subtypes: [
    { key: 'prime_mover', label: 'Prime Mover' },
    // ... more subtypes
  ],
  hasGlassValuation: false,
  fields: [ /* unchanged */ ],
  descriptionTemplate: (_fields, _subtype) => '',
}
```

### Subtype Object Shape
```typescript
// Source: src/lib/schema-registry/types.ts
export type AssetSubtype = {
  key: string    // snake_case — stored in DB
  label: string  // display label shown in UI
}
```

### Registry Integration
The registry (`src/lib/schema-registry/index.ts`) imports schemas by name and exposes `getSubtypes(assetType)`. No changes needed there — UI selectors and all downstream consumers read from `getSubtypes()` automatically.

### Anti-Patterns to Avoid
- **Editing types.ts or index.ts:** Subtype-only changes require zero changes to these files.
- **Adding migration logic:** No production data exists; clean replacement is correct.
- **Touching `descriptionTemplate`:** Out of scope — Phase 14 responsibility.
- **Modifying General Goods fields array:** Already applied as hotfix; fields are complete.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UI selector updates | Custom UI component changes | None needed — `getSubtypes()` is the single source of truth | Selectors are data-driven |
| Old-key compatibility shims | Fallback mappings for old keys | Clean replacement — no data to migrate | User confirmed no production records |
| Zod schema rebuild for General Goods | Manual schema construction | `buildExtractionSchema()` auto-builds from `aiExtractable` fields | Already works correctly post-hotfix |

**Key insight:** Subtype arrays are inert data. The entire UI, AI pipeline, and output generation layer reads through registry functions — no direct subtype references to update outside the schema files.

## Common Pitfalls

### Pitfall 1: Stale Test Assertions
**What goes wrong:** The existing test in `schema-registry.test.ts` line 26–29 asserts `general_goods has exactly 1 subtype with key "general"`. This will fail immediately after the schema edit.
**Why it happens:** Tests were written against the old schema and encode specific subtype counts/values.
**How to avoid:** Update the test in the same plan (or same wave) as the schema edit. Never leave schema edit and test fix in separate plans where one could be committed without the other.
**Warning signs:** Any `getSubtypes` or subtype count assertion in `schema-registry.test.ts`.

**Affected test assertions to update:**
- `general_goods has exactly 1 subtype with key "general"` — update to 5 subtypes, check `tools_equipment`
- Any assertion checking truck subtype count (currently 5 subtypes: prime_mover, rigid_truck, tipper, service_truck, crane_truck)
- Any assertion checking trailer subtype count (currently 6 subtypes)
- Any assertion checking earthmoving subtype count (currently 7 subtypes) or specific old keys (`skid_steer`, `grader`, `backhoe`)

### Pitfall 2: General Goods Fields Already Applied
**What goes wrong:** Implementor re-applies the General Goods field schema (make/model/serial_number/dom/extras), causing duplicate work or accidental regression.
**Why it happens:** CONTEXT.md describes the full schema including fields, but fields were applied as a hotfix before this phase.
**How to avoid:** Verify current `general-goods.ts` before editing. The file already has the correct fields array — only the `subtypes` array needs changing.
**Verification:** Current `general-goods.ts` has: subtypes `[{ key: 'general', label: 'General' }]` (needs replacing), fields array with make/model/serial_number/dom/extras (already correct).

### Pitfall 3: Earthmoving Key Rename Creates Ghost Keys
**What goes wrong:** Old keys `skid_steer`, `grader`, `backhoe` appear in tests or snapshot files, causing failures for assertions that check by key value.
**Why it happens:** Tests may reference the old keys by string.
**How to avoid:** Search for any occurrence of `skid_steer`, `grader`, `backhoe` (without the `_loader`/`motor_` prefix) in test files before committing.

### Pitfall 4: GENERAL GOODS System Prompt Already Present
**What goes wrong:** Implementor adds a second GENERAL GOODS inference block to `buildSystemPrompt`, causing a duplicate entry.
**Why it happens:** CONTEXT.md describes the system prompt addition, but it was applied during Phase 12.
**How to avoid:** Check `src/lib/ai/extraction-schema.ts` Step 2 block before editing. Line 53 already contains the GENERAL GOODS inference rule.

## Code Examples

### Current Truck Subtypes (to be replaced)
```typescript
// Current state in src/lib/schema-registry/schemas/truck.ts
subtypes: [
  { key: 'prime_mover',   label: 'Prime Mover' },
  { key: 'rigid_truck',   label: 'Rigid Truck' },    // REMOVE
  { key: 'tipper',        label: 'Tipper' },
  { key: 'service_truck', label: 'Service Truck' },  // REMOVE (replace key+label)
  { key: 'crane_truck',   label: 'Crane Truck' },    // REMOVE
],
```

### Current Earthmoving Subtypes (partial rename)
```typescript
// Current state — keys that need renaming:
{ key: 'skid_steer',   label: 'Skid Steer / CTL' },  // → skid_steer_loader / 'Skid Steer Loader'
{ key: 'grader',       label: 'Grader' },              // → motor_grader / 'Motor Grader'
{ key: 'backhoe',      label: 'Backhoe' },             // → backhoe_loader / 'Backhoe Loader'
// New additions: compactor, dump_truck, trencher
```

### Test Assertion That Must Change
```typescript
// src/__tests__/schema-registry.test.ts line 26–29 (MUST UPDATE)
it('general_goods has exactly 1 subtype with key "general"', () => {
  const subtypes = getSubtypes('general_goods')
  expect(subtypes).toHaveLength(1)
  expect(subtypes[0].key).toBe('general')
})
// New assertion: 5 subtypes, first key is 'tools_equipment'
```

### Pattern: How UI Reads Subtypes (no change needed)
```typescript
// UI uses getSubtypes() — automatically picks up new values
const subtypes = getSubtypes(assetType)  // returns new array after schema edit
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single `general` subtype for General Goods | 5 structured subtypes | Phase 13 | Allows category-specific asset browsing |
| `rigid_truck`, `crane_truck` as truck subtypes | Replaced with body-type-specific subtypes | Phase 13 | Better reflects actual auction catalogue taxonomy |
| `skid_steer` key | `skid_steer_loader` key | Phase 13 | Consistent full-name convention |

**Already done (hotfix before Phase 13):**
- General Goods fields array: make, model, serial_number, dom, extras — live in codebase
- GENERAL GOODS system prompt inference block — present in `buildSystemPrompt`

## Open Questions

1. **No open questions.**
   - All subtype keys and labels are fully locked in CONTEXT.md
   - No UI changes are required
   - No field schema changes needed (General Goods fields already applied)
   - No migration needed (no production data)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 |
| Config file | `vitest.config.ts` (inferred from package.json) |
| Quick run command | `npx vitest run src/__tests__/schema-registry.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRUCK-01 | `getSubtypes('truck')` returns 14 subtypes; no `rigid_truck` or `crane_truck` | unit | `npx vitest run src/__tests__/schema-registry.test.ts` | ✅ (needs assertion update) |
| TRAIL-01 | `getSubtypes('trailer')` returns 11 subtypes with correct keys | unit | `npx vitest run src/__tests__/schema-registry.test.ts` | ✅ (needs new assertion) |
| EARTH-01 | `getSubtypes('earthmoving')` returns 10 subtypes; old keys `skid_steer`/`grader`/`backhoe` absent | unit | `npx vitest run src/__tests__/schema-registry.test.ts` | ✅ (needs assertion update) |
| GOODS-01 | `getSubtypes('general_goods')` returns 5 subtypes; no `general` key | unit | `npx vitest run src/__tests__/schema-registry.test.ts` | ✅ (needs assertion update — line 26–29) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/schema-registry.test.ts src/__tests__/extraction-schema.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. The failing tests (post schema edit) are expected and will be fixed in the same plan.

## Sources

### Primary (HIGH confidence)
- Direct file read: `src/lib/schema-registry/schemas/truck.ts` — current subtype array confirmed
- Direct file read: `src/lib/schema-registry/schemas/trailer.ts` — current subtype array confirmed
- Direct file read: `src/lib/schema-registry/schemas/earthmoving.ts` — current subtype array confirmed
- Direct file read: `src/lib/schema-registry/schemas/general-goods.ts` — fields hotfix confirmed applied; subtypes NOT yet updated
- Direct file read: `src/lib/schema-registry/types.ts` — AssetSubtype shape confirmed
- Direct file read: `src/lib/schema-registry/index.ts` — registry integration confirmed; no changes needed
- Direct file read: `src/lib/ai/extraction-schema.ts` — GENERAL GOODS inference block confirmed already present (line 53)
- Direct file read: `src/__tests__/schema-registry.test.ts` — stale assertions identified
- Direct file read: `src/__tests__/extraction-schema.test.ts` — General Goods field assertions confirmed passing

### Secondary (MEDIUM confidence)
None required — all findings from direct source read.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all from direct file read of existing codebase
- Architecture: HIGH — pattern established across 8 existing schemas, all identical structure
- Pitfalls: HIGH — stale test assertions identified by line number from direct file read
- Hotfix status: HIGH — confirmed from direct file read of general-goods.ts and extraction-schema.ts

**Research date:** 2026-03-22
**Valid until:** Stable until Phase 14 begins (description templates phase)
