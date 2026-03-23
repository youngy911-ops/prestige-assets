# Phase 16: Subtype Schema Alignment - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Update subtype arrays in all 8 asset schema files to match Salesforce exactly. Add subtype selectors to Agriculture, Forklift, and Caravan for the first time. No new fields, no new asset types, no description template changes (that's Phase 17).

</domain>

<decisions>
## Implementation Decisions

### Label fidelity
- Labels must match Salesforce exactly — copy verbatim from SF
- This means "Concrete - Agitator", "Service Truck", "Tray Truck", "Bulldozer/Crawler Tractor", etc. — no cleaning up punctuation
- Zero ambiguity when staff cross-reference against Salesforce

### Key naming convention
- Snake_case, consistent with Phase 13
- Slashes and dashes stripped from keys: "Concrete - Agitator" → `concrete_agitator`, "Mower/Conditioner" → `mower_conditioner`
- Compound merge key: "Bulldozer/Crawler Tractor" → `bulldozer_crawler_tractor` (explicit)
- Ampersands stripped: "Gardening & Landscaping" → `gardening_landscaping`
- Parentheses stripped: "Conveyors / Stackers" → `conveyors_stackers`

### "Coupe" across asset types
- SF includes "Coupe" in most asset type subtype lists for reasons unknown
- Include it wherever SF requires it (Claude's discretion on meaning — treat as SF-required placeholder)
- Types that include Coupe: Truck, Trailer, Earthmoving, Agriculture, Caravan, Marine, General Goods

### Backward compatibility
- No migration, no graceful fallback — just replace arrays cleanly
- App is pre-production with near-zero records (consistent with Phase 13)
- Old subtype keys on any existing records will render without a matching label (acceptable)

### New subtype selectors (Agriculture, Forklift, Caravan)
- Same pattern as Truck/Trailer — selector on the asset creation/edit screen
- No special pre-extraction form implications — purely schema + UI selector
- No change to InspectionNotesSection for these types

### Truck subtypes (24 — SF 21 plus 3 user additions)
User explicitly kept EWP, Tilt Tray, and Flat Deck in addition to the 21 SF subtypes:
- EWP: valid as a truck (EWP bodies fitted to truck chassis)
- Tilt Tray: distinct from Tray Truck (tilt tray carries cars/equipment via tilting deck)
- Flat Deck: distinct from Tray Truck (Tray Truck = lighter/smaller; Flat Deck = heavier, 5-10t payload)

Full list (keys):
```
beavertail, cab_chassis, concrete_agitator, concrete_pump, coupe, crane_truck,
curtainsider, ewp, flat_deck, fuel_truck, garbage, hook_bin, other, pantech,
prime_mover, refrigerated_pantech, service_truck, skip_bin, stock_truck, tanker,
tilt_tray, tray_truck, vacuum, water_truck
```

Label changes from current:
- `service` → `service_truck` / "Service Truck"
- `concrete_agitator` label stays but changes to "Concrete - Agitator"
- `concrete_pump` label stays but changes to "Concrete - Pump"

Removed from current: `flat_deck` stays (not removed), `tilt_tray` stays (not removed), `ewp` stays

### Trailer subtypes (24 from SF list)
Note: REQUIREMENTS.md says 25, but the listed items count to 24. Implement the 24 listed; verify against Salesforce if discrepancy matters.

Full list (keys):
```
box, car_carrier, coupe, curtainsider, deck_widener, dog, dolly, flat_deck,
low_loader, other, pantech, pig, plant, refrigerated_curtainsider,
refrigerated_pantech, side_loader, side_tipper, skel, stock, tag, tanker,
timber_jinker, tipper, walking_floor
```

Removed from current: `extendable` (Extendable), `drop_deck` (Drop Deck)

### Earthmoving subtypes (19)
Key changes:
- `bulldozer` + `crawler_tractor` → merged into `bulldozer_crawler_tractor` / "Bulldozer/Crawler Tractor"
- `backhoe_loader` → `backhoe` / "Backhoe" (SF label is "Backhoe" not "Backhoe Loader")
- Remove: `telehandler` (moves to Forklift), `trencher` (not in SF list)

Full list (keys):
```
attachments, backhoe, bulldozer_crawler_tractor, compactor, conveyors_stackers,
coupe, crusher, dump_truck, excavator, motor_grader, motor_scraper, other,
scraper, screener, skid_steer_loader, tracked_loader, tracked_skid_steer_loader,
washing, wheel_loader
```

### Agriculture subtypes (12 — new selector)
Replace current 6 subtypes entirely. First time this asset type has a subtype selector.

Full list (keys):
```
air_seeder, baler, combine_harvester, coupe, disc_seeder, forestry,
grain_auger, mower_conditioner, other, plough, spray_rig, tractor
```

Label notes: `mower_conditioner` / "Mower/Conditioner", `combine_harvester` / "Combine Harvester"

### Forklift subtypes (9 — new selector)
Replace current 4 subtypes entirely. First time this asset type has a subtype selector.
Telehandler moves from Earthmoving to here. EWP also appears here (Forklift-mounted EWPs).

Full list (keys):
```
clearview_mast, container_mast, electric_pallet_jack, ewp, other,
stock_picker, telehandler, walk_behind, walkie_stacker
```

### Caravan subtypes (5 — new selector)
Expand from current 3 subtypes. First time this asset type has a subtype selector.

Full list (keys):
```
camper_trailer, caravan, coupe, motorhome, other
```

Label change: `motor_home` "Motor Home" → `motorhome` "Motorhome" (no space — matches SF)

### Marine subtypes (10)
Replace current 3 (Boat, Yacht, Jet Ski) with 10 SF subtypes.

Full list (keys):
```
barge, commercial, coupe, fishing_vessel, other, personal_watercraft,
private, recreational, trailer_boat, tug
```

### General Goods subtypes (16)
Complete rework — current 5 subtypes replaced entirely.

Full list (keys):
```
agriculture, gardening_landscaping, goodwill, health_fitness, hospitality,
it_computers, jewellery_watches_collectables, medical, miscellaneous, office,
other, plant_equipment, retail_fit_out, retail_stock, signage, tools_toolboxes
```

Label notes: `jewellery_watches_collectables` / "Jewellery/Watches/Collectables", `plant_equipment` / "Plant & Equipment", `tools_toolboxes` / "Tools & Toolboxes"

### Claude's Discretion
- Exact ordering of subtypes within each array (alphabetical by label is fine, or group by commonality)
- Whether `backhoe_loader` key should be renamed to `backhoe` or kept — either is fine; rename if clean to do so
- The 25th Trailer subtype if it exists — implement the 24 listed and move on

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — SUBTYPE-01 through SUBTYPE-08 acceptance criteria (exact subtype counts and lists per asset type)

### Schema files (one per asset type — all 8 need updating)
- `src/lib/schema-registry/schemas/truck.ts` — current 15-subtype array to replace with 24
- `src/lib/schema-registry/schemas/trailer.ts` — current 11-subtype array to replace with 24
- `src/lib/schema-registry/schemas/earthmoving.ts` — current 12-subtype array to replace with 19
- `src/lib/schema-registry/schemas/agriculture.ts` — current 6-subtype array to replace with 12
- `src/lib/schema-registry/schemas/forklift.ts` — current 4-subtype array to replace with 9
- `src/lib/schema-registry/schemas/caravan.ts` — current 3-subtype array to replace with 5
- `src/lib/schema-registry/schemas/marine.ts` — current 3-subtype array to replace with 10
- `src/lib/schema-registry/schemas/general-goods.ts` — current 5-subtype array to replace with 16

### Schema registry types
- `src/lib/schema-registry/types.ts` — Subtype type definition; confirm shape is `{ key: string, label: string }`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Subtype arrays are plain `{ key: string, label: string }` objects — direct array replacement, no helper changes needed
- `getSubtypes(assetType)` drives all subtype selectors in the UI — no UI changes needed for Truck/Trailer/Earthmoving/Marine/General Goods
- For Agriculture/Forklift/Caravan (new selectors): check where subtype selector is rendered in the asset creation/edit flow and ensure those asset types are wired up

### Established Patterns
- Schema files are self-contained — no changes to registry index or types.ts needed for subtype-only updates
- Subtype selector is already present in the UI for all types that have subtypes; Agriculture/Forklift/Caravan just need the `subtypes` array populated and the UI to render the selector for those types
- `required: false` on all subtypes — no validation changes needed

### Integration Points
- Tests assert specific subtype counts and key values — all 8 asset type test files will need updating to match new arrays
- Description system prompt in `src/app/api/describe/route.ts` uses subtype keys to match templates — Phase 17 handles template coverage; Phase 16 changes keys only
- Key renames (e.g. `backhoe_loader` → `backhoe`, `bulldozer`+`crawler_tractor` → `bulldozer_crawler_tractor`, `service` → `service_truck`, `motor_home` → `motorhome`) must be tracked — the description prompt currently references old keys and will need Phase 17 updates

</code_context>

<specifics>
## Specific Ideas

- "Tray Truck" and "Flat Deck" are distinct: Tray Truck = lighter small trays (few-tonne payload); Flat Deck = heavier platform deck (5-10t payload). Both stay in Truck.
- EWP appears in both Truck (EWP bodies on truck chassis) and Forklift (forklift-mounted EWPs) — two separate schema entries with the same label.
- "Coupe" in non-automotive asset types is a Salesforce artifact; include where SF requires it.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 16-subtype-schema-alignment*
*Context gathered: 2026-03-23*
