# Phase 9: Pre-Extraction Structured Inputs - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Add dedicated pre-extraction input fields for specific known values by asset type, shown inside the Inspection Notes section before AI extraction runs. Values are passed as authoritative overrides to the AI prompt so AI cannot contradict them. Phase covers: Truck (VIN, Odometer, Hourmeter, Suspension), Trailer (VIN, Suspension), Forklift (Unladen Weight, Max Lift Height), Caravan (Trailer Length in ft).

Value restore on reload (PREFILL-06) is explicitly deferred to v1.2.

</domain>

<decisions>
## Implementation Decisions

### UI placement
- New fields appear **inside the existing "Inspection Notes" card** — not a separate section
- The existing `inspectionPriority` flag approach is extended; Phase 9 fields are added to each schema as `inspectionPriority: true`
- All `inspectionPriority` fields across the schema show (existing + new) — researcher should confirm which fields are most important per asset type booking workflow (may inform which fields to promote vs demote in a future phase)

### Suspension Type input
- **Select dropdown** for both Truck and Trailer
- Options: `Spring`, `Airbag`, `6 Rod`, `Other`
- (Trailers and trucks in Australian commercial context use these terms; "6 Rod" covers Hendrickson-style rod suspension)
- Schema `inputType` for `suspension` field on Truck and Trailer should be changed to `'select'` with these options

### Forklift fields
- `truck_weight` schema label changed from **"Truck Weight" → "Unladen Weight"** — this matches the forklift data plate and what staff call it
- Add **Max Lift Height** (`max_lift_height`) as `inspectionPriority: true` in forklift schema — currently not marked priority
- Max Lift Capacity (`max_lift_capacity`) already `inspectionPriority: true` — keep as-is
- Hours (`hours`) already `inspectionPriority: true` — keep as-is

### Caravan length
- **Feet only** — single text field for `trailer_length`
- No metric conversion — trailers and caravans in AU commercial context are measured and listed in feet
- Store value as entered (e.g. "20 ft" or "20")

### Authoritative override wiring
- `buildUserPrompt` in `src/lib/ai/extraction-schema.ts` already accepts `structuredFields: Record<string, string>` and formats them as "Staff-provided field values (use these directly):" — the hook exists but the extract route passes `{}`
- Phase 9 must parse pre-extraction values from `inspection_notes` (current serialisation format is `key: value` lines) and pass them as `structuredFields` to `buildUserPrompt` so AI treats them as authoritative
- `inspection_notes` serialisation format (from `InspectionNotesSection`): `key: value\nkey: value\nNotes: <freeform>` — parser must extract structured lines and pass them as the `structuredFields` map

### Claude's Discretion
- Exact field ordering within InspectionNotesSection (sfOrder is a reasonable default)
- How to visually distinguish pre-extraction fields from the freeform notes textarea within the card
- Whether to add `preExtractionInput: true` as a new schema flag distinct from `inspectionPriority`, or reuse `inspectionPriority` for the new fields

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### Requirements traceability
- `.planning/REQUIREMENTS.md` — PREFILL-01, PREFILL-02, PREFILL-03, PREFILL-04, PREFILL-05

### Schema files to modify
- `src/lib/schema-registry/schemas/truck.ts` — add VIN + Suspension as `inspectionPriority: true`; change suspension `inputType` to `'select'` with Spring/Airbag/6 Rod/Other options
- `src/lib/schema-registry/schemas/trailer.ts` — add VIN + Suspension as `inspectionPriority: true`; change suspension `inputType` to `'select'` with Spring/Airbag/6 Rod/Other options
- `src/lib/schema-registry/schemas/forklift.ts` — change `truck_weight` label to "Unladen Weight"; add `max_lift_height` as `inspectionPriority: true`; add `truck_weight` as `inspectionPriority: true`
- `src/lib/schema-registry/schemas/caravan.ts` — add `trailer_length` as `inspectionPriority: true`

### Key files to read
- `src/components/asset/InspectionNotesSection.tsx` — existing structured input component; serialises `key: value` lines into `inspection_notes`
- `src/app/api/extract/route.ts` — passes empty `structuredFields: {}` to `buildUserPrompt`; Phase 9 must populate this from parsed `inspection_notes`
- `src/lib/ai/extraction-schema.ts` — `buildUserPrompt` signature and "Staff-provided field values" formatting

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `InspectionNotesSection.tsx` — existing component to extend; renders `getInspectionPriorityFields(assetType)` as labelled inputs, serialises to `inspection_notes` string
- `buildUserPrompt()` in `extraction-schema.ts` — already has `structuredFields` param and formatting logic; just needs to be called with populated data
- `shadcn/ui Select` component (`src/components/ui/select.tsx`) — already in codebase for the suspension dropdown

### Established Patterns
- `inspectionPriority: true` on `FieldDefinition` — controls which fields appear as structured inputs in InspectionNotesSection
- `FIELD_PLACEHOLDERS` record in `InspectionNotesSection.tsx` — field key → placeholder text; needs entries for VIN, suspension (new keys)
- Inspection notes serialisation: `key: value` lines + `Notes: <freeform>` — extract route must parse this to populate `structuredFields`
- `saveInspectionNotes` server action — persists combined string to `assets.inspection_notes`

### Integration Points
- `src/app/api/extract/route.ts:57-59` — `structuredFields: {}` is currently hardcoded empty; must parse `asset.inspection_notes` here to extract pre-fill values
- `src/lib/schema-registry/types.ts` — `FieldDefinition` type; `inputType` already supports `'select'`; `options` array already supported
- `InspectionNotesSection.tsx:17-32` — `FIELD_PLACEHOLDERS` record needs entries for new fields

</code_context>

<specifics>
## Specific Ideas

- Suspension options match what staff actually encounter: "Spring / Airbag / 6 Rod / Other" — not the generic "Air / Leaf Spring / Airbag / Hendrickson" from AI hints
- "Trailers and caravans are measured in feet" — ft-only input, no metric conversion needed
- "Unladen Weight is usually what's on the forklift data plate" — confirms label change from "Truck Weight" is correct

</specifics>

<deferred>
## Deferred Ideas

- Pre-fill value restore on reload (PREFILL-06) — explicitly deferred to v1.2; staff can re-enter if navigating away
- Field priority review per asset type (which fields matter most for booking-in workflow) — researcher should note current field counts and flag if any type is overloaded; may inform a future phase

</deferred>

---

*Phase: 09-pre-extraction-structured-inputs*
*Context gathered: 2026-03-21*
