# Phase 17: Description Template Coverage - Context

**Gathered:** 2026-03-24
**Status:** Ready for research and planning

<domain>
## Phase Boundary

Update `DESCRIPTION_SYSTEM_PROMPT` in `src/app/api/describe/route.ts` to cover all subtypes across all 8 asset types, including all new entries introduced in Phase 16. No schema changes, no new asset types, no field changes. Output is a revised string constant in one file.

</domain>

<decisions>
## Implementation Decisions

### Description philosophy (core direction change)

Descriptions are a **supplement to Salesforce fields** — not a copy of them.

Every Salesforce field (make, model, year, suspension type, ATM, GVM, tare, odometer, hourmeter, VIN, serial, chassis number) is already visible to buyers on the Slattery buyers website. The description must add value by including:

- **Body/equipment-specific specs** that are NOT in SF fields (vacuum unit brand/model/vac hours, drum capacity, max digging depth, boom reach, max height, crane model/capacity, attachment brand + dimensions)
- **Powertrain** (engine make, cylinders, fuel type, HP; transmission type) — always included even though make/model visible, because buyers care about powertrain details
- **Selling-point context** — specs that indicate capability level (e.g. GCM when it determines road train vs B-double rating) or distinguish this asset from similar listings
- **Specific attachment/accessory brands and specs** from inspection notes verbatim
- **Body equipment serial numbers and hours** (e.g. crane S/N, vacuum unit vac hours) — these are NOT the vehicle VIN/serial

**Always omit from description body:**
- Suspension type (in SF fields)
- ATM / GVM / GCM / tare (except when GCM communicates road train capability as a selling point)
- Odometer / vehicle hourmeter
- Vehicle VIN, serial number, chassis number
- Rego / compliance date

**Line 1 exception:** Year, Make, Model, Config, Type is always line 1 — this sets context even though those fields are visible elsewhere.

### Template structure pattern (from verified examples)

```
Year, Make, Model, Config, Type
Engine: Make, cylinders, fuel type, HP
Transmission
[Body/equipment-specific specs — research task per subtype]
[Attachments/accessories if applicable]
Sold As Is, Untested & Unregistered.
```

Blank line between each significant item or group (existing rule).

### Verified description examples (canonical reference for tone and depth)

These are Jack's manually written descriptions — use these to calibrate template structure:

**Prime Mover:**
```
2013 Freightliner Coronado 122 6x4 Prime Mover
Detroit DD15 6-Cylinder Diesel, 560HP
Eaton Manual, 48" Single Sleeper, Diff Locks
GCM: 106,000kg Road Train / 80,000kg B-Double
Sold As Is, Untested & Unregistered.
```

**Mini Excavator:**
```
2021 Kobelco SK55SRX-7 Mini Excavator
5,510kg Operating Weight
2,311 Hours
Yanmar 4-Cylinder Diesel, 37HP
Max Digging Depth: 3890mm
400mm Rubber Tracks
Doherty Hydraulic Quick Hitch
Dozer Blade: 1,950mm | Boom Length: 2,990mm
1,200mm Kenbuilt GP Bucket
Attachments Included: 450mm Kenbuilt GP Bucket, 600mm Kenbuilt Ripper
Sold As Is, Untested & Unregistered.
```

**Service Truck:**
```
2017 Isuzu FRR 110-240 4x2 Service/Lube Truck
Isuzu 4-Cylinder Diesel, 240HP
Manual Transmission
5,600x2,300mm Alloy Service Body
Maxilift 380.4H Knuckle Crane, 2,400kg Capacity
MEA HPU (S/N: 0883, 7,777hrs)
Maxistab Stabiliser Legs
Graco Hose Reels — Hydraulic Oil, Waste Oil, Engine Oil, Waste Coolant, Coolant, HP Water, Air
Sold As Is, Untested & Unregistered.
```

**Vacuum Truck:**
```
2016 Isuzu FSR F 140-240 4x2 Vacuum Truck
Isuzu 4-Cylinder Diesel, 240HP
Manual Transmission
Spoutvac SV3700 Vacuum Unit, 1,798 Vac Hours
6,800L Stainless Debris Tank, 2,900L Water Tank
Hibon Blower 3,700m³/h
Triplex Hydro Pump 20L/min @ 4,000psi
Sold As Is, Untested & Unregistered.
```

**Concrete Agitator:**
```
2017 Kenworth T359 8x4 Concrete Agitator
Cummins ISLe5 6-Cylinder Diesel, 350HP
Allison Automatic
Cesco 7.0m³ / 11.3m³ Barrel Mixer
Rexroth Hydraulic Drive
200L Water Tank, Slump Meter
Sold As Is, Untested & Unregistered.
```

**EWP:**
```
2006 Isuzu F3 FVZ 6x4 Elevated Work Platform
Isuzu 6-Cylinder Diesel
Automatic Transmission
Redmond Gary TF17M/RB EWP (S/N: 1251)
17m Max Height, 13m Max Reach
160kg Jib Crane
8t Stabiliser Pad, 72km/h Max Wind Rating
Sold As Is, Untested & Unregistered.
```

**Personal Watercraft:**
```
2024 Sea-Doo GTR 230 Personal Watercraft
Rotax 1630 ACE, 3-cylinder, 4-stroke, supercharged and intercooled petrol, 230hp
35 Hours
iBR Intelligent Brake and Reverse, Variable Trim System (VTS), Ergolock two-piece touring seat,
3-rider capacity, footwell speakers, wide-angle mirrors, tow hook, DESS lanyard key,
LinQ attachment system, watertight phone compartment
Supplied on 2023 Telwater PWC trailer, VIN: 6HWB0ATRLPC916109, Compliance: 01/23, ATM 650kg
Sold As Is, Untested & Unregistered.
```

**Caravan:**
```
2024 Viscount V2 Family Caravan
Queen east/west bed, double bunk, L-shape dinette
Full ensuite with shower, toilet and vanity
Gree rooftop air conditioning, gas/electric hot water system
Thetford gas oven, cooktop and grill, Thetford 175L fridge/freezer, microwave, 2.5kg washing machine
2 x water tanks
Aussie Traveller rollout awning, external speakers, gas bottle holders at front
Leaf spring suspension, electric brakes, breakaway system
Sold As Is, Untested & Unregistered.
```
*(Note: Caravan suspension IS included here — for caravan/camper buyers, suspension type is a selling point, unlike trucks where it's just a lookup field. Include suspension for caravan/camper types.)*

**Camper Trailer:**
```
2024 Stoney Creek Campers Scout 14+2 Gen 2 Hybrid Camper Trailer
King bed, rear fold-out king single
Full ensuite with shower and toilet
Truma rooftop air conditioning
Slide-out external kitchen with stainless sink and gas cooktop, MyCoolman slide-out fridge/freezer
Front and rear water tanks, grey water tank
Solar panels, side awning, LPG gas bottle holder, electric entry step, pop-top lift roof
Independent trailing arm suspension with coil springs, electric brakes, off-road hitch
Sold As Is, Untested & Unregistered.
```

### Trailer template coverage

Full coverage required — distinct prompt sections per major subtype. Trailers are common across all types at Slattery and subtypes are meaningfully different (Tanker, Timber Jinker, Refrigerated Curtainsider, and Skel are fundamentally different assets with different buyer-relevant fields).

All 24 trailer subtypes need coverage:
`box, car_carrier, coupe, curtainsider, deck_widener, dog, dolly, flat_deck, low_loader, other, pantech, pig, plant, refrigerated_curtainsider, refrigerated_pantech, side_loader, side_tipper, skel, stock, tag, tanker, timber_jinker, tipper, walking_floor`

Group similar subtypes under shared headings where they are genuinely indistinguishable (e.g. Dog/Pig/Tag are B-train configurations and can share a heading). Each section should name the key buyer-relevant specs for that trailer type (deck dimensions, payload, door type, refrigeration unit, tank capacity, compartments, etc.) that won't be in SF fields.

### Orphaned templates (from pre-Phase-16 subtypes)

- **TIPPER** (truck): Keep as-is — Tipper is a valid truck body type even though it left the truck subtype list; may appear via fallback
- **FLAT DECK** (truck): Keep — still in truck subtype list (user explicitly retained Flat Deck alongside Tray Truck)
- **TILT TRAY** (truck): Keep — still in truck subtype list (user explicitly retained)
- **EWP** (truck): Keep — still in truck subtype list (user explicitly retained EWP as a truck)
- **TELEHANDLER**: Keep — now under Forklift; template is still correct
- **TRENCHER**: Remove — not in any current SF subtype list
- **CRAWLER TRACTOR**: Rename/update to `BULLDOZER/CRAWLER TRACTOR` — the merged key is `bulldozer_crawler_tractor`; the template should cover both (blade + ripper for dozer side; PTO + drawbar for crawler tractor side)
- **JET SKI**: Replace with `PERSONAL WATERCRAFT` — the new key is `personal_watercraft`. The verified example above is the canonical template.

### Coupe handling

"Coupe" appears in Truck, Trailer, Earthmoving, Agriculture, Caravan, Marine, and General Goods as a Salesforce artifact (meaning unknown — SF-required placeholder). Each asset type should have a brief COUPE section instructing GPT-4o to: describe whatever is visible from photos and inspection notes using the most relevant structure for that asset type, without forcing a specific field layout.

### General Goods templates

One generic section. All 16 GG subtypes (Agriculture, Gardening & Landscaping, Hospitality, IT & Computers, Medical, etc.) follow the same short format: Make, Model, key specs, condition notes. The `normalizeFooter` function ensures "Sold As Is, Untested." for all general_goods asset types. No per-category sections needed — the content varies too widely for templates to add value beyond the generic.

### Marine footer

"Sold As Is, Untested & Unregistered." for all marine subtypes — keep current behaviour. `normalizeFooter` enforces this.

### Agriculture and Forklift (first-time subtype-aware)

Both are first-time subtype-aware types. Research should determine the key buyer-relevant specs per subtype:
- Agriculture: Tractor and Combine Harvester are complex; Air Seeder, Disc Seeder, Spray Rig, Baler, Mower/Conditioner, Plough, Grain Auger are implement-type assets with different key specs
- Forklift: Telehandler, EWP, and Walkie Stacker/Electric Pallet Jack have very different selling points from a standard Clearview/Container Mast forklift

### Existing templates to keep unchanged

PRIME MOVER, SERVICE TRUCK, RIGID TRUCK / PANTECH / CURTAINSIDER, REFRIGERATED PANTECH, BEAVERTAIL, TILT TRAY, VACUUM TRUCK, CONCRETE PUMP, CONCRETE AGITATOR, EWP (truck), EXCAVATOR, BULLDOZER, GRADER, SKID STEER / COMPACT TRACK LOADER, WHEEL LOADER, BACKHOE LOADER, COMPACTOR, DUMP TRUCK, CARAVAN, MOTOR VEHICLE (CAR), ATTACHMENTS / GENERAL GOODS, MARINE (generic)

All existing templates should be reviewed against the "supplement not repeat" philosophy — update only where they contradict it (e.g. if an existing template explicitly includes suspension type in the template body fields, remove it).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Description system
- `src/app/api/describe/route.ts` — `DESCRIPTION_SYSTEM_PROMPT` (the full prompt to update), `buildDescriptionUserPrompt()` (passes `asset_type` and `asset_subtype` to GPT-4o), `normalizeFooter()` (safety net — keep unchanged)

### Subtype keys (post-Phase-16 — verify coverage against these)
- `src/lib/schema-registry/schemas/truck.ts` — 24 subtypes
- `src/lib/schema-registry/schemas/trailer.ts` — 24 subtypes
- `src/lib/schema-registry/schemas/earthmoving.ts` — 19 subtypes
- `src/lib/schema-registry/schemas/agriculture.ts` — 12 subtypes
- `src/lib/schema-registry/schemas/forklift.ts` — 9 subtypes
- `src/lib/schema-registry/schemas/caravan.ts` — 5 subtypes
- `src/lib/schema-registry/schemas/marine.ts` — 10 subtypes
- `src/lib/schema-registry/schemas/general-goods.ts` — 16 subtypes

### Requirements
- `.planning/REQUIREMENTS.md` — DESCR-01 through DESCR-08 acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### File structure
- All changes are to `DESCRIPTION_SYSTEM_PROMPT` — a single string constant at the top of `src/app/api/describe/route.ts`
- `buildDescriptionUserPrompt()` passes `asset_type` and `asset_subtype` in the user message; GPT-4o uses these to select the correct template section
- `normalizeFooter()` at lines 354–366 — do not touch this function
- Template sections use ALL_CAPS headings — GPT-4o matches the subtype to the nearest heading by name

### Established patterns
- Template sections: `HEADING\nLine 1\nLine 2\n...\nSold As Is, Untested & Unregistered.`
- Blank line between each significant item or group within a template
- The system prompt already has the ENGINE HP REFERENCE table and UNIVERSAL RULES — these must be preserved

### Research agent instructions
The researcher should investigate the following for each new/updated template:
1. What are the key buyer-relevant specs for this subtype that are NOT standard Salesforce fields?
2. What specs can GPT-4o reliably infer from make/model/year for this asset type?
3. What is the correct field ordering that matches auction industry convention?

Use the verified Jack examples in the decisions section as the calibration baseline for tone, depth, and structure.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-description-template-coverage*
*Context gathered: 2026-03-24*
