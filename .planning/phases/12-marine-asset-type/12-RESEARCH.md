# Phase 12: Marine Asset Type - Research

**Researched:** 2026-03-22
**Domain:** Schema registry extension, AI extraction, description generation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
All implementation decisions were delegated to Claude. The following are locked choices from the CONTEXT.md:

- Add `'marine'` to `ASSET_TYPES` in `src/lib/schema-registry/types.ts`
- Create `src/lib/schema-registry/schemas/marine.ts` exporting `marineSchema: AssetSchema`
- Register in `SCHEMA_REGISTRY` in `src/lib/schema-registry/index.ts`
- No DB migration needed — `asset_type` column is plain `text` with no CHECK constraint
- Three subtypes: `boat`, `yacht`, `jet_ski`
- 25 fields as defined in CONTEXT.md field table (sfOrder 1–25)
- `required: true` for `make`, `model`, `year` only
- Three inspection priority fields: `hin` (sfOrder 1), `engine_hours` (sfOrder 11), `loa` (sfOrder 17)
- `motor_type` options: `['Inboard', 'Outboard', 'Stern Drive', 'Jet Drive', 'Electric']`
- `hasGlassValuation: false`
- `descriptionTemplate: (_fields, _subtype) => ''` stub
- Add Marine inference block to `buildSystemPrompt` Step 2 in `extraction-schema.ts`
- Add JET SKI template section to `DESCRIPTION_SYSTEM_PROMPT` in `describe/route.ts`; existing MARINE template covers Boat/Yacht as-is
- Use `Anchor` from lucide-react for Marine in `AssetTypeSelector.tsx`

### Claude's Discretion
None — user delegated all decisions.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Subtype expansions for Truck, Trailer, etc. are Phase 13. Description quality fixes are Phase 14.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MARINE-01 | User can create a Marine asset with subtypes (Boat, Yacht, Jet Ski) and full Salesforce marine field schema (25 fields) | Schema registry pattern from `truck.ts` directly applies; `ASSET_TYPES` const + `SCHEMA_REGISTRY` record are the only integration points; no DB migration needed |
| MARINE-02 | AI extracts marine fields from photos and inspection notes with appropriate aiHints per field | `buildExtractionSchema()` auto-builds from `aiExtractable` + `aiHint` fields — no changes to extraction engine needed; marine inference block must be added to `buildSystemPrompt` Step 2 |
| MARINE-03 | App generates correctly formatted marine description per subtype (Boat/Yacht uses existing MARINE template; Jet Ski needs new JET SKI template section) | `DESCRIPTION_SYSTEM_PROMPT` already contains a MARINE template; planner must add JET SKI section only; `generateText` flow is unchanged |
</phase_requirements>

---

## Summary

Phase 12 adds Marine as the eighth asset type following the identical schema-registry pattern established by the seven existing types (truck, trailer, earthmoving, agriculture, forklift, caravan, general_goods). The work is a pure schema-plus-prompt extension — no new UI components, no DB migrations, no new API routes, and no changes to the extraction or description engines themselves. All generic helper functions (`buildExtractionSchema`, `getSubtypes`, `getAIExtractableFieldDefs`, `getInspectionPriorityFields`, `getFieldsSortedBySfOrder`) already handle any new asset type automatically once the schema is registered.

The only non-trivial decision is the description generation split: Boat and Yacht share the existing MARINE template already present in `DESCRIPTION_SYSTEM_PROMPT`, while Jet Ski requires a new compact JET SKI section added to the same prompt. The planner must ensure the new JET SKI section is a distinct named block so GPT-4o selects it when `asset_subtype = 'jet_ski'`.

The test suite has a hardcoded count assertion (`expect(Object.keys(SCHEMA_REGISTRY)).toHaveLength(7)`) and a matching ASSET_TYPES length assertion that will both fail after adding marine. These tests must be updated to 8. The `aiHint convention enforcement` test will also run against the marine schema automatically via the `for (const type of ASSET_TYPES)` loop — so all 14 AI-extractable marine fields with non-textarea inputType must have `aiHint` defined, or that test will fail.

**Primary recommendation:** Implement as three sequential tasks — (1) create and register the marine schema, (2) add marine inference to `buildSystemPrompt` + JET SKI template to `DESCRIPTION_SYSTEM_PROMPT`, (3) add `Anchor` icon to `AssetTypeSelector` and update test count assertions.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | (project) | Type-safe schema definition | All schemas use `import type { AssetSchema }` |
| lucide-react | ^0.577.0 | Icon for asset type tile | Already in package.json; `Anchor` confirmed available at this version |
| vitest | (project) | Test runner | Existing suite at `src/__tests__/`; `npm test` runs `vitest run` |

### Supporting
No new libraries needed for this phase. All functionality is implemented via existing project infrastructure.

### Alternatives Considered
None. Implementation approach is fully determined by locked decisions.

**Installation:**
No new packages required.

---

## Architecture Patterns

### Schema File Pattern (from `truck.ts`)

Each asset type lives in its own file under `src/lib/schema-registry/schemas/`. The file exports a single named const typed as `AssetSchema`. Field ordering: `sfOrder` is 1-indexed and unique per schema. The `descriptionTemplate` is always the stub for AI-generated types.

```typescript
// Source: src/lib/schema-registry/schemas/truck.ts (verified)
import type { AssetSchema } from '../types'

export const marineSchema: AssetSchema = {
  assetType: 'marine',
  displayName: 'Marine',
  subtypes: [
    { key: 'boat',     label: 'Boat' },
    { key: 'yacht',    label: 'Yacht' },
    { key: 'jet_ski',  label: 'Jet Ski' },
  ],
  hasGlassValuation: false,
  fields: [ /* 25 fields from CONTEXT.md */ ],
  descriptionTemplate: (_fields, _subtype) => '',
}
```

### Registration Pattern (from `index.ts`)

Two changes required: import the schema, add it to `SCHEMA_REGISTRY`. The `Record<AssetType, AssetSchema>` type means TypeScript will error at build time if `ASSET_TYPES` contains `'marine'` but `SCHEMA_REGISTRY` does not have a `marine` key (and vice versa) — the type system enforces consistency.

```typescript
// Source: src/lib/schema-registry/index.ts (verified)
// 1. Add import:
import { marineSchema } from './schemas/marine'
// 2. Add to SCHEMA_REGISTRY:
marine: marineSchema,
```

### ASSET_TYPES Extension (from `types.ts`)

```typescript
// Source: src/lib/schema-registry/types.ts (verified)
export const ASSET_TYPES = [
  'truck', 'trailer', 'earthmoving', 'agriculture',
  'forklift', 'caravan', 'general_goods',
  'marine',   // <-- add here
] as const
```

### buildSystemPrompt Step 2 Extension (from `extraction-schema.ts`)

The Step 2 block in `buildSystemPrompt` lists asset type inference rules. Marine must be added as a new bullet:

```typescript
// Source: src/lib/ai/extraction-schema.ts (verified — line 48 is the Step 2 block)
// Add to the inference list:
`- MARINE: infer hull_material from visual (fibreglass/aluminium most common), motor_type from photo (outboard vs inboard), number_of_engines from visible motors, steering_type from helm setup`
```

### JET SKI Template Addition (from `describe/route.ts`)

The existing MARINE template on lines 204–214 of `route.ts` covers Boat and Yacht. A new JET SKI section must be added as a distinctly named block in `DESCRIPTION_SYSTEM_PROMPT` so GPT-4o's template selection logic (based on named headers) picks it when `asset_subtype = 'jet_ski'`:

```
JET SKI
Year Make Model, Jet Ski
Engine: Make, HP, fuel type
Engine Hours
Extras (cover, trailer, etc.)
Sold As Is, Untested & Unregistered.
```

### AssetTypeSelector Icon Addition (from `AssetTypeSelector.tsx`)

```typescript
// Source: src/components/asset/AssetTypeSelector.tsx (verified)
// 1. Add to imports:
import { Truck, Container, HardHat, Tractor, Package2, Home, ShoppingBag, Anchor } from 'lucide-react'
// 2. Add to ASSET_TYPE_ICONS record:
marine: Anchor,
```

### Anti-Patterns to Avoid
- **Duplicate sfOrder values:** Every marine field must have a unique sfOrder 1–25. The test `sfOrder values are unique within the schema` will catch violations.
- **aiExtractable: true without aiHint on non-textarea fields:** The `aiHint convention enforcement` test loops over all asset types and will fail for marine if any non-textarea aiExtractable field lacks an aiHint. Thirteen of the 14 marine aiExtractable fields are non-textarea — all need aiHint defined.
- **Adding marine to ASSET_TYPES but not SCHEMA_REGISTRY (or vice versa):** TypeScript's `Record<AssetType, AssetSchema>` type enforces both simultaneously at compile time.
- **Forgetting to update test count assertions:** `schema-registry.test.ts` has two hardcoded `7` counts that must become `8`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Zod extraction schema for marine fields | Custom Zod object | `buildExtractionSchema('marine')` | Auto-built from `aiExtractable` + `aiHint` fields in the schema |
| Rendering marine fields form | Marine-specific form component | `DynamicFieldForm` with marine schema | Already handles text, number, select, textarea inputTypes generically |
| Inspection priority inputs on photos page | Marine-specific photos component | `InspectionNotesSection` — reads from `getInspectionPriorityFields('marine')` | Generic — picks up hin, engine_hours, loa automatically once schema registered |
| Salesforce field block ordering | Custom sort | `getFieldsSortedBySfOrder('marine')` | Sorts by sfOrder; marine output order is determined entirely by sfOrder values |
| Subtype selector | New component | `AssetSubtypeSelector` — reads from `getSubtypes('marine')` | Fully generic |

**Key insight:** The schema registry is a data-driven architecture — all UI and AI pipeline components read from it generically. Adding a new asset type is a data change (new schema file + registration), not a logic change.

---

## Common Pitfalls

### Pitfall 1: Hardcoded count assertions in test suite
**What goes wrong:** `npm test` fails immediately after adding marine with `AssertionError: expected 8 to equal 7` from `schema-registry.test.ts`.
**Why it happens:** Two tests hardcode `toHaveLength(7)` for SCHEMA_REGISTRY keys and ASSET_TYPES length.
**How to avoid:** Update both assertions to `8` as part of the same task that adds the schema.
**Warning signs:** Red test output on `schema-registry.test.ts` line 6 or 10.

### Pitfall 2: Missing aiHint on aiExtractable non-textarea fields
**What goes wrong:** `npm test` fails on `aiHint convention enforcement` test for any marine field that is `aiExtractable: true` and `inputType !== 'textarea'` but lacks `aiHint`.
**Why it happens:** The test loops over ALL asset types, so marine is tested automatically once registered.
**How to avoid:** Every marine field with `aiExtractable: true` and non-textarea inputType must include `aiHint`. Per CONTEXT.md: 14 fields are `aiExtractable: true`; none of them are textarea. All 14 need `aiHint` strings.
**Warning signs:** Red test output on `extraction-schema.test.ts` mentioning `marine.{field_key} is aiExtractable but missing aiHint`.

### Pitfall 3: JET SKI template not triggering correctly
**What goes wrong:** Jet Ski assets receive the generic MARINE (Boat/Yacht) description format instead of the compact Jet Ski format.
**Why it happens:** GPT-4o selects templates by matching the named header. If the JET SKI section is not clearly named or is embedded inside the MARINE section without a distinct header, the model will fall back to the closest match.
**How to avoid:** Add `JET SKI` as a standalone named section in `DESCRIPTION_SYSTEM_PROMPT`, separated from the MARINE section, following the same format pattern as other named sections (TRUCK, TRAILER, EXCAVATOR, etc.).
**Warning signs:** Generated descriptions for `jet_ski` subtype show LOA/Beam/Draft lines (Boat/Yacht format).

### Pitfall 4: sfOrder gaps or collisions
**What goes wrong:** Salesforce field block outputs fields in wrong order or TypeScript/test errors on duplicate sfOrder.
**Why it happens:** Marine has 25 fields; manually assigning 1–25 is error-prone.
**How to avoid:** Follow the CONTEXT.md field table exactly. The test `sfOrder values are unique within the schema` will catch collisions immediately.
**Warning signs:** Test failure on `sfOrder values are unique` for marine schema.

### Pitfall 5: Inspection priority field count exceeding implicit limit
**What goes wrong:** Photos page becomes cluttered or existing `getInspectionPriorityFields` sorting is unexpected.
**Why it happens:** Per codebase comments, up to 5 inspection priority fields are typical (truck has 6). Marine has exactly 3 (`hin`, `engine_hours`, `loa`).
**How to avoid:** Only flag those three with `inspectionPriority: true`. This is already specified in CONTEXT.md.
**Warning signs:** More than 3 structured inputs appearing on photos page for Marine assets.

---

## Code Examples

### Complete marine field definition shape (verified from truck.ts pattern)

```typescript
// Source: src/lib/schema-registry/schemas/truck.ts (pattern)
{ key: 'hin', label: 'HIN', sfOrder: 1, inputType: 'text', aiExtractable: true,
  aiHint: 'Hull Identification Number — 12-character alphanumeric stamped on transom (rear of hull). Never infer — only extract if directly visible.',
  inspectionPriority: true, required: false },
{ key: 'make', label: 'Make', sfOrder: 2, inputType: 'text', aiExtractable: true,
  aiHint: 'Brand name on hull or motor (e.g. Quintrex, Stacer, Haines Hunter, Riviera, Maritimo, Yamaha, Sea-Doo).', required: true },
{ key: 'motor_type', label: 'Motor Type', sfOrder: 8, inputType: 'select',
  options: ['Inboard', 'Outboard', 'Stern Drive', 'Jet Drive', 'Electric'],
  aiExtractable: true,
  aiHint: 'Visual from photos. Outboard = motor mounted on transom. Inboard = motor inside hull. Stern Drive = inboard engine with external drive leg. Jet Drive = water jet propulsion (common on jet skis). Must be exactly one of: Inboard, Outboard, Stern Drive, Jet Drive, Electric.',
  required: false },
```

### How buildExtractionSchema processes the marine schema automatically

```typescript
// Source: src/lib/ai/extraction-schema.ts lines 14-31 (verified)
// When called as buildExtractionSchema('marine'), it:
// 1. Calls getAIExtractableFieldDefs('marine') — returns all 14 aiExtractable fields
// 2. For each field: builds a z.object({ value: z.string().nullable(), confidence: confidenceEnum })
// 3. The .describe() text is built from label + aiHint + options (if any)
// No manual changes to this function needed for marine.
```

### How to add Anchor icon to AssetTypeSelector

```typescript
// Source: src/components/asset/AssetTypeSelector.tsx (verified)
import { Truck, Container, HardHat, Tractor, Package2, Home, ShoppingBag, Anchor } from 'lucide-react'

const ASSET_TYPE_ICONS: Record<AssetType, LucideIcon> = {
  truck:         Truck,
  trailer:       Container,
  earthmoving:   HardHat,
  agriculture:   Tractor,
  forklift:      Package2,
  caravan:       Home,
  general_goods: ShoppingBag,
  marine:        Anchor,   // add this line
}
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Marine was absent from ASSET_TYPES | Add `'marine'` to ASSET_TYPES const | No DB migration required — plain text column |
| DESCRIPTION_SYSTEM_PROMPT has generic MARINE template (covers Boat/Yacht) | Add separate JET SKI named section | Existing MARINE section stays unchanged |

**Not deprecated — keep as-is:**
- The existing MARINE template in `describe/route.ts` (lines 204–214) covers Boat and Yacht correctly. The planner must NOT modify it.

---

## Open Questions

1. **`hull_material` field label precision**
   - What we know: CONTEXT.md specifies `label: 'Hull Material'` and confirms it is not in REQUIREMENTS.md but is referenced in the existing description template.
   - What's unclear: Nothing — decision is locked.
   - Recommendation: Use exactly `'Hull Material'` as the label.

2. **sfOrder numbering — CONTEXT.md says "sfOrder follows REQUIREMENTS.md list order; 1-indexed"**
   - What we know: CONTEXT.md field table assigns sfOrder 1–25 sequentially matching the field list order.
   - What's unclear: `hull_material` was added after the main list (it is not in REQUIREMENTS.md) and is shown at sfOrder 7 in the CONTEXT.md table.
   - Recommendation: Follow the CONTEXT.md table verbatim. sfOrder values 1–25 are fully specified.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (jsdom environment) |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MARINE-01 | `SCHEMA_REGISTRY` contains `marine` key | unit | `npm test -- src/__tests__/schema-registry.test.ts` | Wave 0 update needed |
| MARINE-01 | `ASSET_TYPES` has 8 entries (not 7) | unit | `npm test -- src/__tests__/schema-registry.test.ts` | Wave 0 update needed |
| MARINE-01 | marine schema has 3 subtypes (boat, yacht, jet_ski) | unit | `npm test -- src/__tests__/schema-registry.test.ts` | Wave 0 update needed |
| MARINE-01 | marine schema has 25 fields, all with required properties | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ (generic loop) |
| MARINE-01 | marine sfOrder values are unique 1–25 | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ (generic loop) |
| MARINE-01 | motor_type select field has options array | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ (generic loop) |
| MARINE-01 | marine `hasGlassValuation` is false | unit | `npm test -- src/__tests__/schema-registry.test.ts` | Wave 0 addition |
| MARINE-02 | All 14 aiExtractable non-textarea marine fields have aiHint | unit | `npm test -- src/__tests__/extraction-schema.test.ts` | ✅ (generic loop) |
| MARINE-02 | `buildExtractionSchema('marine')` returns valid Zod schema | unit | `npm test -- src/__tests__/extraction-schema.test.ts` | Wave 0 addition |
| MARINE-02 | `buildSystemPrompt` contains MARINE inference block | unit | `npm test -- src/__tests__/extraction-schema.test.ts` | Wave 0 addition |
| MARINE-02 | `getInspectionPriorityFields('marine')` returns [hin, engine_hours, loa] sorted by sfOrder | unit | `npm test -- src/__tests__/extraction-schema.test.ts` | Wave 0 addition |
| MARINE-03 | `DESCRIPTION_SYSTEM_PROMPT` contains JET SKI section | unit | `npm test -- src/__tests__/describe-route.test.ts` | Wave 0 addition |
| MARINE-03 | Existing MARINE template (Boat/Yacht) still present | unit | `npm test -- src/__tests__/describe-route.test.ts` | Wave 0 addition |

### Sampling Rate
- **Per task commit:** `npm test -- src/__tests__/schema-registry.test.ts src/__tests__/extraction-schema.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

The following test updates/additions are needed before or alongside implementation tasks:

- [ ] `src/__tests__/schema-registry.test.ts` — update two count assertions from `7` to `8`; add marine-specific assertions (subtypes count, hasGlassValuation=false)
- [ ] `src/__tests__/extraction-schema.test.ts` — add `getInspectionPriorityFields('marine')` test; add `buildExtractionSchema('marine')` smoke test; add `buildSystemPrompt` contains MARINE assertion
- [ ] `src/__tests__/describe-route.test.ts` — add assertion that `DESCRIPTION_SYSTEM_PROMPT` contains 'JET SKI' section; add assertion that existing MARINE section is preserved

---

## Sources

### Primary (HIGH confidence)
- `src/lib/schema-registry/types.ts` — AssetType, AssetSchema, FieldDefinition types; ASSET_TYPES const (verified directly)
- `src/lib/schema-registry/index.ts` — SCHEMA_REGISTRY structure and helper functions (verified directly)
- `src/lib/schema-registry/schemas/truck.ts` — canonical schema implementation pattern (verified directly)
- `src/lib/ai/extraction-schema.ts` — buildExtractionSchema and buildSystemPrompt (verified directly)
- `src/app/api/describe/route.ts` — DESCRIPTION_SYSTEM_PROMPT including existing MARINE template (verified directly)
- `src/components/asset/AssetTypeSelector.tsx` — ASSET_TYPE_ICONS record, Anchor import target (verified directly)
- `src/__tests__/schema-registry.test.ts` — hardcoded count assertions that require update (verified directly)
- `src/__tests__/extraction-schema.test.ts` — aiHint enforcement test, generic loops (verified directly)
- `.planning/phases/12-marine-asset-type/12-CONTEXT.md` — all locked decisions (verified directly)
- `.planning/phases/12-marine-asset-type/12-UI-SPEC.md` — UI contract (verified directly)

### Secondary (MEDIUM confidence)
None — all findings verified from source files directly.

### Tertiary (LOW confidence)
None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and existing schema files
- Architecture: HIGH — verified from reading all canonical reference files
- Pitfalls: HIGH — derived from reading actual test file assertions that will fail
- Test infrastructure: HIGH — vitest.config.ts and all test files verified directly

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable codebase; patterns established by prior milestones)
