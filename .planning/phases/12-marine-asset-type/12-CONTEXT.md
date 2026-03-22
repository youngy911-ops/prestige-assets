# Phase 12: Marine Asset Type - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Marine as a fully functional asset type — Salesforce schema, AI extraction with aiHints, and GPT-4o description generation per subtype (Boat, Yacht, Jet Ski). Subtype expansions for other types (Truck, Trailer, etc.) are Phase 13. Description quality fixes are Phase 14.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
User delegated all implementation decisions to Claude. Decisions below are Claude's choices based on codebase patterns and the field list from MARINE-01/MARINE-02/MARINE-03.

### Schema registration
- Add `'marine'` to `ASSET_TYPES` const array in `src/lib/schema-registry/types.ts`
- Create `src/lib/schema-registry/schemas/marine.ts` exporting `marineSchema: AssetSchema`
- Register in `SCHEMA_REGISTRY` in `src/lib/schema-registry/index.ts`
- No DB migration needed — `asset_type` column is plain `text` with no CHECK constraint

### Subtypes
- Three subtypes: `{ key: 'boat', label: 'Boat' }`, `{ key: 'yacht', label: 'Yacht' }`, `{ key: 'jet_ski', label: 'Jet Ski' }`

### Fields (sfOrder follows REQUIREMENTS.md list order; 1-indexed)
Full field list from MARINE-01 plus Hull Material (required by existing description template):

| # | key | label | inputType | aiExtractable | inspectionPriority |
|---|-----|-------|-----------|--------------|-------------------|
| 1 | hin | HIN | text | true | true |
| 2 | make | Make | text | true | — |
| 3 | model | Model | text | true | — |
| 4 | year | Year | number | true | — |
| 5 | builder | Builder | text | true | — |
| 6 | designer | Designer | text | false | — |
| 7 | hull_material | Hull Material | text | true | — |
| 8 | motor_type | Motor Type | select | true | — |
| 9 | number_of_engines | Number of Engines | number | true | — |
| 10 | main_engine_details | Main Engine Details | text | true | — |
| 11 | engine_hours | Engine Hours | number | true | true |
| 12 | fuel_tank_capacity | Fuel Tank Capacity | text | false | — |
| 13 | water_tank_capacity | Water Tank Capacity | text | false | — |
| 14 | steering_type | Steering Type | text | true | — |
| 15 | beam | Beam | text | false | — |
| 16 | draft | Draft | text | false | — |
| 17 | loa | LOA | text | false | true |
| 18 | trailer_length | Trailer Length | text | true | — |
| 19 | launch_date | Launch Date | text | false | — |
| 20 | sighted | Sighted | text | false | — |
| 21 | winch | Winch | text | true | — |
| 22 | thrusters | Thrusters | text | true | — |
| 23 | damage | Damage | text | true | — |
| 24 | damage_notes | Damage Notes | textarea | false | — |
| 25 | extras | Extras | textarea | false | — |

**Notes on specific fields:**
- `hull_material`: Not in REQUIREMENTS.md field list but required by existing MARINE description template — add it; AI can read from photos (fibreglass, aluminium, timber, steel)
- `motor_type` options: `['Inboard', 'Outboard', 'Stern Drive', 'Jet Drive', 'Electric']`
- `sighted` is freeform text (e.g. "In water", "On trailer", "In yard") — not a boolean
- `launch_date` is text (MM/YYYY or year-only) — consistent with `compliance_date` pattern
- `beam`, `draft`, `loa`, `fuel_tank_capacity`, `water_tank_capacity` are text (include units — "ft" or "m" as entered)
- `required: true` for `make`, `model`, `year` only — same as truck schema pattern

### Inspection priority fields (pre-extraction structured inputs)
Three fields shown on the photos page before AI extraction:
1. `hin` — marine equivalent of VIN/chassis number
2. `engine_hours` — high-value operational detail, always inspected
3. `loa` — most important dimensional measurement for marine pricing

### AI extraction aiHints
- `hin`: "Hull Identification Number — 12-character alphanumeric stamped on transom (rear of hull). Never infer — only extract if directly visible."
- `make`: "Brand name on hull or motor (e.g. Quintrex, Stacer, Haines Hunter, Riviera, Maritimo, Yamaha, Sea-Doo)."
- `model`: "Model name/number from hull badge or build plate. Read exactly as printed."
- `year`: "Build year from HIN (last 2 digits), compliance plate, or engine plate. 4-digit year only."
- `builder`: "Manufacturer of the hull — often same as Make but may differ for custom or OEM builds."
- `hull_material`: "Visual from photos — most common: Fibreglass, Aluminium, Timber, Steel. Infer from appearance if not labelled."
- `motor_type`: "Visual from photos. Outboard = motor mounted on transom. Inboard = motor inside hull. Stern Drive = inboard engine with external drive leg. Jet Drive = water jet propulsion (common on jet skis). Must be exactly one of: Inboard, Outboard, Stern Drive, Jet Drive, Electric."
- `number_of_engines`: "Count visible motors/engines from exterior photos."
- `main_engine_details`: "Engine badge, cowling label, or build plate. Include make, model, and HP if visible (e.g. Yamaha F150, Mercury 90hp, Volvo Penta D4)."
- `engine_hours`: "Engine hour meter display. Digits only. Only extract if clearly readable — do NOT guess."
- `steering_type`: "Infer from visible helm equipment — Hydraulic (most powered boats), Mechanical (tiller or cable), Electric (electric outboards)."
- `trailer_length`: "Visible on trailer compliance plate or infer from trailer photos if present."
- `winch`: "Visible on trailer bow roller — present if a winch strap and handle visible."
- `thrusters`: "Bow or stern thruster visible on hull — typically a tunnel thruster on larger vessels."
- `damage`: "Visible hull damage, gelcoat crazing, stress cracks, collision marks, or corrosion from exterior photos."

### AI extraction system prompt addition
Add Marine inference block to `buildSystemPrompt` Step 2 in `src/lib/ai/extraction-schema.ts`:
```
- MARINE: infer hull_material from visual (fibreglass/aluminium most common), motor_type from photo (outboard vs inboard), number_of_engines from visible motors, steering_type from helm setup
```

### Description formats by subtype
The existing MARINE template in `describe/route.ts` covers Boat and Yacht well. Add a JET SKI subtype-specific template alongside it:

**BOAT / YACHT (existing template — keep as-is):**
```
Year, Make, Model, Vessel Type
LOA: XXft | Beam: XXft | Draft: XXft
Hull Material
Engine/s: Make, cylinders, fuel type, HP (or Twin X HP Outboards)
Engine Hours
Nav/electronics
Berths/cabin layout
Galley, heads, water/fuel capacity
Extras: solar, generator, winch, thruster, trailer
Sold As Is, Untested & Unregistered.
```

**JET SKI (add to description system prompt):**
```
JET SKI
Year Make Model, Jet Ski
Engine: Make, HP, fuel type
Engine Hours
Extras (cover, trailer, etc.)
Sold As Is, Untested & Unregistered.
```

Add `JET SKI` as a named section in `DESCRIPTION_SYSTEM_PROMPT` so GPT-4o selects the correct template when `asset_subtype = 'jet_ski'`.

### UI icon
Use `Anchor` from lucide-react for Marine in `AssetTypeSelector.tsx`.

### hasGlassValuation
`false` — no Glass's valuation for marine.

### descriptionTemplate stub
Use the same stub pattern as other schemas — `descriptionTemplate: (_fields, _subtype) => ''`. Description is AI-generated via `/api/describe`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — MARINE-01, MARINE-02, MARINE-03 field lists and acceptance criteria

### Codebase patterns
- `src/lib/schema-registry/schemas/truck.ts` — reference schema implementation (field shape, aiHints, inspectionPriority pattern)
- `src/lib/schema-registry/types.ts` — AssetType, AssetSchema, FieldDefinition types; ASSET_TYPES const
- `src/lib/schema-registry/index.ts` — SCHEMA_REGISTRY registration and helper functions
- `src/lib/ai/extraction-schema.ts` — buildExtractionSchema and buildSystemPrompt (add marine inference to Step 2)
- `src/app/api/describe/route.ts` — DESCRIPTION_SYSTEM_PROMPT (add JET SKI template section)
- `src/components/asset/AssetTypeSelector.tsx` — icon mapping (add Anchor icon for marine)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildExtractionSchema()` — auto-builds Zod schema from `aiExtractable` fields; no manual changes needed when marine fields have correct `aiExtractable` + `aiHint` values
- `getAIExtractableFieldDefs()` — already exported and consumed by extract route; marine fields flow through automatically
- `getSubtypes()`, `getFieldsSortedBySfOrder()`, `getInspectionPriorityFields()` — all work generically; no marine-specific logic needed

### Established Patterns
- Schema file is self-contained: `AssetSchema` object with `assetType`, `displayName`, `subtypes`, `fields`, `hasGlassValuation`, `descriptionTemplate` stub
- `inspectionPriority: true` on up to 5 fields → appear as structured inputs on photos page before extraction
- `sfOrder` determines Salesforce fields block output order — must be unique integers per schema
- `asset_type` is plain `text` in DB — no migration needed
- Icons: lucide-react; `Anchor` is available for marine

### Integration Points
- `ASSET_TYPES` array in `types.ts` drives type safety across the app — add `'marine'` here
- `SCHEMA_REGISTRY` in `index.ts` — add `marine: marineSchema`
- `ASSET_TYPE_ICONS` in `AssetTypeSelector.tsx` — add `marine: Anchor`
- `buildSystemPrompt` in `extraction-schema.ts` — add marine inference to Step 2 block
- `DESCRIPTION_SYSTEM_PROMPT` in `describe/route.ts` — add JET SKI template; existing MARINE template covers Boat/Yacht

</code_context>

<specifics>
## Specific Ideas

- Jet Ski description is a compact one-block format (Year Make Model, Jet Ski / Engine / Hours / Extras / Trailer) — distinctly simpler than Boat/Yacht
- HIN is the marine equivalent of VIN — same "never infer, only extract if visible" rule applies
- `hull_material` is not in REQUIREMENTS.md field list but is referenced in the existing description template — adding it to the schema so AI can extract it from photos and it appears in the review form

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 12-marine-asset-type*
*Context gathered: 2026-03-22*
