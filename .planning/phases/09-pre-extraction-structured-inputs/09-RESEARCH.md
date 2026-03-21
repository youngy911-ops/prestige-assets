# Phase 9: Pre-Extraction Structured Inputs - Research

**Researched:** 2026-03-21
**Domain:** Schema-registry flags, InspectionNotesSection component, extract route parsing
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- New fields appear **inside the existing "Inspection Notes" card** — not a separate section
- The existing `inspectionPriority` flag approach is extended; Phase 9 fields are added to each schema as `inspectionPriority: true`
- All `inspectionPriority` fields across the schema show (existing + new)
- Suspension Type is a **Select dropdown** for both Truck and Trailer with options: `Spring`, `Airbag`, `6 Rod`, `Other`
- Schema `inputType` for `suspension` on Truck and Trailer changes to `'select'` with these options
- Forklift `truck_weight` label changes from "Truck Weight" to **"Unladen Weight"**
- Add `max_lift_height` as `inspectionPriority: true` in forklift schema
- Caravan `trailer_length` uses **feet only** — single text field, no metric conversion
- `buildUserPrompt` already accepts `structuredFields: Record<string, string>` — Phase 9 must populate it
- `inspection_notes` serialisation format: `key: value\nkey: value\nNotes: <freeform>` — parser must extract structured lines and pass as `structuredFields` map
- The extract route currently hardcodes `structuredFields: {}` at line 57 — this is the exact location to change

### Claude's Discretion
- Exact field ordering within InspectionNotesSection (sfOrder is a reasonable default)
- How to visually distinguish pre-extraction fields from the freeform notes textarea within the card
- Whether to add `preExtractionInput: true` as a new schema flag distinct from `inspectionPriority`, or reuse `inspectionPriority` for the new fields

### Deferred Ideas (OUT OF SCOPE)
- Pre-fill value restore on reload (PREFILL-06) — explicitly deferred to v1.2; staff can re-enter if navigating away
- Field priority review per asset type (which fields matter most for booking-in workflow)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PREFILL-01 | Truck asset shows dedicated inputs for VIN, Odometer, Hourmeter, Suspension Type before extraction | Schema flag additions to truck.ts; InspectionNotesSection select rendering support |
| PREFILL-02 | Trailer asset shows dedicated inputs for VIN and Suspension Type before extraction | Schema flag additions to trailer.ts; InspectionNotesSection select rendering support |
| PREFILL-03 | Forklift asset shows "Unladen Weight" input before extraction | Label change + inspectionPriority flag on truck_weight in forklift.ts |
| PREFILL-04 | Caravan asset shows "Length (ft)" input before extraction | inspectionPriority flag on trailer_length in caravan.ts |
| PREFILL-05 | Staff-entered pre-extraction values appear in Salesforce output and are not overridden by AI | Parser in extract route.ts populates structuredFields from inspection_notes before buildUserPrompt call |
</phase_requirements>

## Summary

Phase 9 is a tightly-scoped, three-touch change: (1) schema flag additions and minor property changes across four asset schemas, (2) a new conditional render path in `InspectionNotesSection` for `select` inputType fields, and (3) a parser in the extract API route that converts the existing `key: value` serialisation format into the `structuredFields` map that `buildUserPrompt` already accepts and formats correctly.

All three integration points exist and are understood. The extract route already fetches `inspection_notes` from the DB and `buildUserPrompt` already has the "Staff-provided field values (use these directly):" output block — only the glue between them is missing. Schema infrastructure (`inputType: 'select'`, `options[]`, `inspectionPriority`) is already typed and supported.

The primary non-trivial work is the `InspectionNotesSection` rendering of Base UI Select for `select`-type priority fields, and ensuring the `key: value` parser in the extract route is robust (handles the `Notes:` line correctly and ignores freeform text).

**Primary recommendation:** Implement in three discrete tasks — schema changes first (pure data), then InspectionNotesSection select support (UI), then extract route parser (backend wiring). Each task is independently testable.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @base-ui/react | (installed) | Select dropdown primitive | Already in codebase — `src/components/ui/select.tsx` wraps it |
| Vitest | (configured) | Test runner | Project standard — `vitest.config.ts` exists, `vitest run` is the test script |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui wrappers | (local) | `Select`, `Input`, `Label` | All structured input UI — already imported in InspectionNotesSection |

No new libraries required for this phase.

**Installation:** None needed.

## Architecture Patterns

### Recommended Project Structure
No new files required. All changes are within existing files:
```
src/
├── lib/schema-registry/schemas/
│   ├── truck.ts          # schema flag additions
│   ├── trailer.ts        # schema flag additions
│   ├── forklift.ts       # label change + flag additions
│   └── caravan.ts        # flag addition
├── components/asset/
│   └── InspectionNotesSection.tsx   # select render support + FIELD_PLACEHOLDERS
└── app/api/extract/
    └── route.ts          # structuredFields parser
```

### Pattern 1: inspectionPriority Flag + sfOrder Sorting
**What:** `getInspectionPriorityFields(assetType)` in schema-registry/index.ts returns all fields with `inspectionPriority: true`, sorted ascending by `sfOrder`. InspectionNotesSection maps over these to render inputs.
**When to use:** Any field that should appear as a structured input in the Inspection Notes card.
**Example:**
```typescript
// src/lib/schema-registry/index.ts (existing, unmodified)
export function getInspectionPriorityFields(assetType: AssetType): FieldDefinition[] {
  return SCHEMA_REGISTRY[assetType].fields
    .filter(f => f.inspectionPriority === true)
    .sort((a, b) => a.sfOrder - b.sfOrder)
}
```
Adding `inspectionPriority: true` to a field definition automatically includes it in the card.

### Pattern 2: Select Rendering in InspectionNotesSection
**What:** InspectionNotesSection currently renders only `<Input>` for all priority fields. It must branch on `field.inputType === 'select'` to render the Base UI Select instead.
**When to use:** Any priority field with `inputType: 'select'` (currently only `suspension` on truck and trailer).
**Example shape — how the select must call handleStructuredChange:**
```typescript
// Pattern — mirrors how handleStructuredChange is called for Input onChange
<Select onValueChange={(value) => handleStructuredChange(field.key, value)}>
  <SelectTrigger>
    <SelectValue placeholder={FIELD_PLACEHOLDERS[field.key] ?? `Select ${field.label}`} />
  </SelectTrigger>
  <SelectContent>
    {field.options?.map((opt) => (
      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
    ))}
  </SelectContent>
</Select>
```
Note: Base UI's `Select` uses `onValueChange` (not `onChange`) to report the selected string value.

### Pattern 3: inspection_notes Parser
**What:** The extract route must parse the `key: value\n` lines from `inspection_notes` into a `Record<string, string>` before calling `buildUserPrompt`.
**When to use:** Before the `buildUserPrompt` call in `route.ts`.
**Serialisation format** (from InspectionNotesSection.persistNotes):
- Structured lines: `${key}: ${value}` — one per non-empty structured field
- Freeform: `Notes: ${freeformText}` — only appended if freeform textarea has content
- Lines joined with `\n`

**Parser logic:**
```typescript
// Parse inspection_notes into structuredFields (exclude the 'Notes:' freeform line)
function parseStructuredFields(notes: string | null): Record<string, string> {
  if (!notes) return {}
  const result: Record<string, string> = {}
  for (const line of notes.split('\n')) {
    const colonIdx = line.indexOf(': ')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 2).trim()
    // 'Notes' is the freeform textarea key — not a structured field
    if (key === 'Notes' || !key || !value) continue
    result[key] = value
  }
  return result
}
```
This parser is the exact replacement for the hardcoded `const structuredFields: Record<string, string> = {}` at route.ts line 57.

### Pattern 4: FIELD_PLACEHOLDERS Extension
**What:** `InspectionNotesSection.tsx` has a `FIELD_PLACEHOLDERS` record providing per-key placeholder text. New keys need entries.
**Existing entries relevant to Phase 9:**
- `vin: 'e.g. 1HGCM82633A123456'` — already present, works for both truck and trailer VIN
- `odometer`, `hourmeter`, `hours` — already present

**Entries to add:**
- `suspension`: placeholder for the select (shown as `SelectValue` placeholder when nothing selected)
- `trailer_length`: 'e.g. 20 ft'
- `truck_weight`: 'e.g. 4,500 kg'
- `max_lift_height`: 'e.g. 4,500 mm'

### Anti-Patterns to Avoid
- **Using `inputType: 'select'` without `options`:** The schema-registry test at `schema-registry.test.ts:65` asserts "select fields have options array with at least 1 option". Any select field without `options` will fail the test suite.
- **Parsing freeform notes as a structured field:** The `Notes` key must be excluded from `structuredFields`. If included, the AI prompt would receive `Notes: <freeform text>` as a staff-provided override — incorrect.
- **Using `defaultValue` on Select for uncontrolled pattern:** InspectionNotesSection uses uncontrolled refs (`structuredValuesRef`) for all inputs. The Select must also be uncontrolled (no controlled `value` prop), using `defaultValue` if pre-population is needed. For Phase 9 (no re-hydration), no default is needed — Select starts empty.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dropdown select | Custom `<select>` or styled native element | `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` from `@/components/ui/select` | Already in codebase, matches app dark theme styling |
| inspection_notes serialisation | New serialisation format | Existing `key: value\n` format | Format is already written by InspectionNotesSection; changing it would break existing saved notes |

## Common Pitfalls

### Pitfall 1: Existing tests assert exact inspectionPriority field lists
**What goes wrong:** `extraction-schema.test.ts` has tests like `'truck returns exactly 4 priority fields'` and `'truck returns [odometer, registration_number, hourmeter, service_history] sorted by sfOrder'`. Adding `vin` and `suspension` to truck's inspectionPriority set will break these immediately.
**Why it happens:** Tests were written to spec the existing schema state.
**How to avoid:** Update these tests in the same task as the schema changes. The new expected lists are:
- `truck`: `['vin', 'odometer', 'registration_number', 'hourmeter', 'suspension', 'service_history']` (sorted by sfOrder: 2, 17, 18, 22, 26, 32)
- `trailer`: `['vin', 'registration', 'hubometer', 'suspension', 'atm', 'tare']` (sfOrders: 3, 10, 12, 15, 16, 18)
- `forklift`: `['serial', 'max_lift_capacity', 'truck_weight', 'max_lift_height', 'hours']` (sfOrders: 5, 6, 7, 9 — note: truck_weight=16, max_lift_height=7; order: serial=5, max_lift_capacity=6, max_lift_height=7, hours=9, truck_weight=16)
- `caravan`: `['vin', 'serial', 'registration', 'odometer', 'trailer_length']` (sfOrders: 5, 6, 13, 14, 15)
**Warning signs:** `vitest run` exits non-zero immediately after schema changes.

### Pitfall 2: Select component uses Base UI, not Radix UI
**What goes wrong:** Copying patterns from Radix UI docs or shadcn/ui Radix examples — `onValueChange` prop name is the same, but internal composition, Portal, and Positioner components differ.
**Why it happens:** `src/components/ui/select.tsx` is built on `@base-ui/react/select` (line 4), not `@radix-ui/react-select`.
**How to avoid:** Use only the exported wrappers from `@/components/ui/select` — `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`. Never import directly from `@base-ui/react`.

### Pitfall 3: Caravan `trailer_length` field label
**What goes wrong:** Using the existing `label: 'Trailer Length'` as-is in the UI — the PREFILL-04 success criterion says "Length (ft)".
**Why it happens:** The schema label says "Trailer Length" but the requirement says the input label shown to staff should read "Length (ft)".
**How to avoid:** Two options — (a) change the schema label to "Length (ft)" in caravan.ts (this affects Salesforce output label too), or (b) use a display override in InspectionNotesSection. Decision: the schema label IS the Salesforce label, so update it in caravan.ts to "Length (ft)" to satisfy both the requirement and Salesforce output accuracy. Confirm with the requirement: PREFILL-04 says "dedicated Length (ft) input field".

### Pitfall 4: Forklift inspectionPriority ordering with truck_weight sfOrder=16
**What goes wrong:** After adding `truck_weight` and `max_lift_height` as inspectionPriority, the sorted order is: `serial` (5), `max_lift_capacity` (6), `max_lift_height` (7), `hours` (9), `truck_weight` (16). This is 5 fields. Depending on the UI, 5 fields is manageable but verify no cap exists.
**Why it happens:** `getInspectionPriorityFields` applies no count limit — returns ALL fields with `inspectionPriority: true`. The comment in `types.ts` says "up to 5 per type" in parentheses, but this is a comment, not enforced code.
**How to avoid:** No code cap to worry about. Five fields renders fine. The comment is aspirational, not enforced.

### Pitfall 5: inspection_notes may be null or empty
**What goes wrong:** Calling `notes.split('\n')` on null throws.
**Why it happens:** `inspection_notes` is `string | null` in the DB — the extract route already passes it as `asset.inspection_notes` to `buildUserPrompt` which handles null. The new parser must also handle null.
**How to avoid:** Parser starts with `if (!notes) return {}` guard (shown in Pattern 3 above).

### Pitfall 6: structuredFields key is the schema key, not the label
**What goes wrong:** The AI prompt receives `vin: 1HGCM82633A123456` (schema key), but the AI system prompt and extraction schema describe fields by their label "VIN". This is fine because `buildUserPrompt` formats them as `  vin: value` and the system prompt instructs use-directly for staff-provided values.
**Why it happens:** Serialisation uses the schema key (e.g. `vin`, `suspension`, `odometer`), not the label.
**How to avoid:** No change needed — this is the existing contract. The `buildUserPrompt` "Staff-provided field values (use these directly):" block uses the raw key, and GPT maps it correctly because the extraction schema describes each key with its Salesforce label via `describe()`.

## Code Examples

### Current State: structuredFields is always empty (route.ts:57-59)
```typescript
// src/app/api/extract/route.ts — current state
const structuredFields: Record<string, string> = {}
const userPrompt = buildUserPrompt(asset.inspection_notes, structuredFields)
```

### Target State: parse from inspection_notes
```typescript
// src/app/api/extract/route.ts — Phase 9 target
const structuredFields = parseStructuredFields(asset.inspection_notes)
const userPrompt = buildUserPrompt(asset.inspection_notes, structuredFields)
```

### buildUserPrompt output with structuredFields populated (from extraction-schema.ts:68-74)
```typescript
// When structuredFields = { vin: '1HGCM82633A123456', odometer: '187450' }
// buildUserPrompt produces:
// "Please extract the requested fields from the photos.
//
// Staff-provided field values (use these directly):
//   vin: 1HGCM82633A123456
//   odometer: 187450
//
// Additional inspection notes:
// vin: 1HGCM82633A123456
// odometer: 187450"
```
Note: the inspection_notes string is ALSO passed as `inspectionNotes` to `buildUserPrompt`, so it appears twice — once in "Staff-provided" block, once in "Additional inspection notes". This is intentional: the structured block is authoritative, the notes block provides context. No change to buildUserPrompt needed.

### Schema change example — truck suspension field (truck.ts:39)
```typescript
// BEFORE:
{ key: 'suspension', label: 'Suspension', sfOrder: 26, inputType: 'text',
  aiExtractable: true, aiHint: '...', required: false }

// AFTER:
{ key: 'suspension', label: 'Suspension', sfOrder: 26, inputType: 'select',
  options: ['Spring', 'Airbag', '6 Rod', 'Other'],
  aiExtractable: true, aiHint: '...', inspectionPriority: true, required: false }
```

### InspectionNotesSection — conditional select render
```typescript
// Branching logic within the {priorityFields.map()} block
{field.inputType === 'select' ? (
  <Select onValueChange={(value) => handleStructuredChange(field.key, value)}>
    <SelectTrigger className="h-9 text-sm bg-white/5 border-white/15 text-white ...">
      <SelectValue placeholder={FIELD_PLACEHOLDERS[field.key] ?? `Select ${field.label}`} />
    </SelectTrigger>
    <SelectContent>
      {field.options?.map((opt) => (
        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
      ))}
    </SelectContent>
  </Select>
) : (
  <Input ... /> // existing render
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| structuredFields hardcoded `{}` | Parse from inspection_notes | Phase 9 | AI no longer ignores pre-entered values |
| Suspension as free-text input | Select dropdown with 4 options | Phase 9 | Consistent vocabulary in extraction output |
| "Truck Weight" label on forklift | "Unladen Weight" label | Phase 9 | Matches forklift data plate terminology |

## Open Questions

1. **Caravan `trailer_length` label — "Trailer Length" vs "Length (ft)"**
   - What we know: PREFILL-04 says "Length (ft)" input; caravan.ts has `label: 'Trailer Length'`; schema label = Salesforce output label
   - What's unclear: Does Salesforce expect the label "Trailer Length" or "Length (ft)"?
   - Recommendation: Change caravan.ts label to "Length (ft)" — the requirement is explicit and the label also appears in Salesforce output, where "(ft)" signals the unit to the listing team. LOW risk change.

2. **Whether `suspension` should remain `aiExtractable: true` on truck/trailer after becoming a select**
   - What we know: Both truck and trailer suspension fields have `aiExtractable: true`; changing inputType to select doesn't change AI extractability; `buildExtractionSchema` already handles options via `descParts.push('Must be exactly one of: ...')`
   - What's unclear: Whether the new options list (Spring/Airbag/6 Rod/Other) should replace the existing aiHint options
   - Recommendation: Keep `aiExtractable: true`; update `aiHint` to reference the new options list so AI and dropdown use consistent vocabulary. The `options` array is already used by `buildExtractionSchema` to constrain AI output.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (jsdom environment) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/__tests__/extraction-schema.test.ts src/__tests__/schema-registry.test.ts src/__tests__/extract-route.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PREFILL-01 | truck returns VIN + suspension + odometer + hourmeter + registration_number + service_history as priority fields | unit | `npx vitest run src/__tests__/extraction-schema.test.ts` | ✅ (needs update) |
| PREFILL-02 | trailer returns VIN + suspension as new priority fields | unit | `npx vitest run src/__tests__/extraction-schema.test.ts` | ✅ (needs update) |
| PREFILL-03 | forklift returns truck_weight (label "Unladen Weight") + max_lift_height as priority fields | unit | `npx vitest run src/__tests__/extraction-schema.test.ts` | ✅ (needs update) |
| PREFILL-04 | caravan returns trailer_length as priority field | unit | `npx vitest run src/__tests__/extraction-schema.test.ts` | ✅ (needs update) |
| PREFILL-05 | parseStructuredFields converts "key: value\nNotes: text" to {key: value} (excludes Notes) | unit | `npx vitest run src/__tests__/extract-route.test.ts` | ✅ (needs new test case) |
| PREFILL-05 | schema-registry: select fields have options | unit | `npx vitest run src/__tests__/schema-registry.test.ts` | ✅ (existing, auto-validates new select fields) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/extraction-schema.test.ts src/__tests__/schema-registry.test.ts src/__tests__/extract-route.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/extraction-schema.test.ts` — update existing `getInspectionPriorityFields` assertions for truck/trailer/forklift/caravan to include new fields (file exists, 6 test cases need updating, 1 count assertion needs updating)
- [ ] `src/__tests__/extract-route.test.ts` — add test case for parseStructuredFields parsing: `"vin: ABC\nNotes: freeform"` → `{ vin: "ABC" }` (file exists, new test case needed)

## Sources

### Primary (HIGH confidence)
- Direct source read: `src/components/asset/InspectionNotesSection.tsx` — serialisation format, FIELD_PLACEHOLDERS, rendering pattern
- Direct source read: `src/app/api/extract/route.ts` — exact location of structuredFields hardcode (line 57)
- Direct source read: `src/lib/ai/extraction-schema.ts` — buildUserPrompt signature, structuredFields formatting
- Direct source read: `src/lib/schema-registry/schemas/truck.ts`, `trailer.ts`, `forklift.ts`, `caravan.ts` — current field definitions
- Direct source read: `src/lib/schema-registry/types.ts` — FieldDefinition type, supported inputTypes
- Direct source read: `src/lib/schema-registry/index.ts` — getInspectionPriorityFields implementation
- Direct source read: `src/__tests__/extraction-schema.test.ts` — existing test assertions that will need updating
- Direct source read: `src/__tests__/schema-registry.test.ts` — auto-validating tests for select/options
- Direct source read: `src/components/ui/select.tsx` — Base UI Select wrapper API (onValueChange, components to use)

### Secondary (MEDIUM confidence)
- None required — all findings sourced directly from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — direct codebase reads, no external dependencies required
- Architecture: HIGH — all integration points confirmed in source code
- Pitfalls: HIGH — existing test file content read directly; breaking tests identified precisely
- Parse logic: HIGH — serialisation format read directly from InspectionNotesSection.persistNotes

**Research date:** 2026-03-21
**Valid until:** 60 days (stable codebase, no external APIs involved)
