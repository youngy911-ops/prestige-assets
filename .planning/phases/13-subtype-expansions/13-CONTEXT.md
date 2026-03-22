# Phase 13: Subtype Expansions - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Update subtype lists for Truck (5→14 types), Trailer (6→11 types), Earthmoving (7→10 types), and General Goods (1→5 types) to final v1.3 values. No new fields for Truck/Trailer/Earthmoving. General Goods gets structured fields added (make, model, serial number, DOM, extras) replacing the single free-text description. Description templates per subtype are Phase 14.

</domain>

<decisions>
## Implementation Decisions

### Backward Compatibility
- No real production records exist yet — just replace subtype arrays cleanly
- No migration, no graceful fallback for old keys needed

### Key Naming Convention
- Snake_case, clean and lowercase, no abbreviation bloat
- "EWP" stays `ewp` (industry acronym, universally understood)
- "Service Truck" becomes `service` (drops the `_truck` suffix — label is "Service")
- "Skid Steer Loader" → `skid_steer_loader` (was `skid_steer`)
- "Motor Grader" → `motor_grader` (was `grader`)
- "Backhoe Loader" → `backhoe_loader` (was `backhoe`)

### Truck Subtypes (14 — replacing existing 5)
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

### Trailer Subtypes (11 — replacing existing 6)
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

### Earthmoving Subtypes (10 — expanding from 7)
Rename existing: `skid_steer` → `skid_steer_loader`, `grader` → `motor_grader`, `backhoe` → `backhoe_loader`
Add: `compactor`, `dump_truck`, `trencher`
Full list:
```
{ key: 'excavator',        label: 'Excavator' }
{ key: 'skid_steer_loader',label: 'Skid Steer Loader' }
{ key: 'compactor',        label: 'Compactor' }
{ key: 'dozer',            label: 'Dozer' }
{ key: 'motor_grader',     label: 'Motor Grader' }
{ key: 'wheel_loader',     label: 'Wheel Loader' }
{ key: 'backhoe_loader',   label: 'Backhoe Loader' }
{ key: 'telehandler',      label: 'Telehandler' }
{ key: 'dump_truck',       label: 'Dump Truck' }
{ key: 'trencher',         label: 'Trencher' }
```

### General Goods Subtypes (5 — replacing existing 1)
Remove: `general`
Replace with:
```
{ key: 'tools_equipment',    label: 'Tools & Equipment' }
{ key: 'attachments',        label: 'Attachments' }
{ key: 'workshop_equipment', label: 'Workshop Equipment' }
{ key: 'office_it',          label: 'Office & IT' }
{ key: 'miscellaneous',      label: 'Miscellaneous' }
```

### General Goods Schema Fields (replacing single `description` field)
User wants same pattern as other asset types — key structured fields + a notes/extras field:

| # | key | label | inputType | aiExtractable | inspectionPriority |
|---|-----|-------|-----------|--------------|-------------------|
| 1 | make | Make | text | true | — |
| 2 | model | Model | text | true | — |
| 3 | serial_number | Serial Number | text | true | true |
| 4 | dom | Date of Manufacture | text | true | — |
| 5 | extras | Extras | textarea | false | — |

- `serial_number` is `inspectionPriority: true` — staff read it off the plate on-site
- `dom` is text (MM/YYYY or year-only), consistent with `compliance_date` pattern
- `required: true` for `make` and `model` only — consistent with other schemas
- No `hasGlassValuation` change — remains `false`

### General Goods AI Extraction aiHints
General Goods covers a wide mix — generators, compressors, pumps, hand tools, workshop equipment, office/IT, excavator attachments, and miscellaneous items. Many have build plates; attachments often don't.

- `make`: "Manufacturer or brand name from build plate, badge, or label (e.g. Kubota, Honda, Atlas Copco, Ingersoll Rand, DeWalt, Kaeser, Grundfos, Caterpillar). Read exactly as shown."
- `model`: "Model designation from build plate or body label. Read exactly as printed. Null if not visible."
- `serial_number`: "Serial number from build plate or data plate. Format varies by manufacturer. Never infer — only extract if directly visible."
- `dom`: "Date of manufacture from build plate or compliance plate. Format MM/YYYY or 4-digit year. Null if not present."

### General Goods System Prompt Addition
Add GENERAL GOODS inference block to `buildSystemPrompt` Step 2 in `src/lib/ai/extraction-schema.ts`:
```
- GENERAL GOODS: read make/model/serial from build plate or data label. DOM from compliance plate if present. Many items (attachments, hand tools) have no build plate — return null for missing fields rather than inferring.
```

### Claude's Discretion
- Exact sfOrder values for General Goods fields (1–5 sequential is fine)
- Whether `dom` uses `aiHint` referencing the compliance_date pattern

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — TRUCK-01, TRAIL-01, EARTH-01, GOODS-01 definitions

### Codebase patterns
- `src/lib/schema-registry/schemas/truck.ts` — subtype array shape, field definitions, aiHint examples
- `src/lib/schema-registry/schemas/trailer.ts` — current trailer subtypes to replace
- `src/lib/schema-registry/schemas/earthmoving.ts` — current earthmoving subtypes to update
- `src/lib/schema-registry/schemas/general-goods.ts` — current single-field schema to expand
- `src/lib/schema-registry/types.ts` — AssetSchema, FieldDefinition, Subtype types
- `src/lib/ai/extraction-schema.ts` — buildSystemPrompt Step 2 (add GENERAL GOODS inference block)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Subtype arrays are plain objects `{ key: string, label: string }` — direct replacement, no helper needed
- `buildExtractionSchema()` auto-builds Zod schema from `aiExtractable` fields — new General Goods fields flow through automatically once added with `aiExtractable: true` and `aiHint`
- `getInspectionPriorityFields()` — `serial_number` appears automatically with `inspectionPriority: true`

### Established Patterns
- Schema files are self-contained; no changes to registry index or types.ts needed for subtype-only updates
- General Goods schema change does require updating `src/lib/schema-registry/schemas/general-goods.ts` fields array
- `required: true` on `make` and `model` only — consistent with all other schemas
- `inspectionPriority` drives the structured input fields shown on the photos page before AI extraction

### Integration Points
- Subtype selectors in UI are driven entirely by `getSubtypes(assetType)` — no UI changes needed
- Tests likely assert specific subtype counts/values — will need updating for all 4 types
- General Goods field change may affect existing test assertions for `getAIExtractableFields('general_goods')`

</code_context>

<specifics>
## Specific Ideas

- User wants "clean keys with capital letters when needed" — labels use title case (e.g. "Tools & Equipment", "Office & IT", "EWP") while keys are snake_case
- General Goods is intended to capture structured data from build plates just like other types — "hoping with general most info can be extracted off build plates"
- The mix of General Goods items is wide: generators, compressors, pumps, tools, workshop equipment (lathes, lifts), office/IT, and excavator attachments (buckets, forks, tynes)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-subtype-expansions*
*Context gathered: 2026-03-22*
