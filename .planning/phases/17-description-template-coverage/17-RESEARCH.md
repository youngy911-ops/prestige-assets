# Phase 17: Description Template Coverage - Research

**Researched:** 2026-03-24
**Domain:** AI system prompt engineering — GPT-4o template selection for asset descriptions
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase boundary:** Update `DESCRIPTION_SYSTEM_PROMPT` in `src/app/api/describe/route.ts` only. No schema changes, no new asset types, no field changes. Output is a revised string constant in one file.

**Description philosophy:** Descriptions supplement Salesforce fields — they do NOT repeat them.
- Always include: powertrain (engine make, cylinders, fuel type, HP; transmission), body/equipment-specific specs NOT in SF fields, selling-point context, specific attachment/accessory brands and specs (verbatim from inspection notes), body equipment serial numbers and hours (e.g. crane S/N, vacuum unit vac hours)
- Always omit from description body: suspension type, ATM/GVM/tare (except GCM when it communicates road train capability), odometer, vehicle hourmeter, vehicle VIN/serial/chassis number, rego/compliance date
- Line 1 exception: Year, Make, Model, Config, Type is always line 1

**Template structure pattern:**
```
Year, Make, Model, Config, Type
Engine: Make, cylinders, fuel type, HP
Transmission
[Body/equipment-specific specs — per subtype]
[Attachments/accessories if applicable]
Sold As Is, Untested & Unregistered.
```
Blank line between each significant item or group.

**Trailer coverage:** All 24 trailer subtypes need distinct sections. Group genuinely indistinguishable types (e.g. Dog/Pig/Tag share a heading as B-train configs). Each section names key buyer-relevant specs not in SF fields.

**Orphaned templates:**
- TIPPER (truck): Keep as-is
- FLAT DECK (truck): Keep
- TILT TRAY (truck): Keep
- EWP (truck): Keep
- TELEHANDLER: Keep — now under Forklift; template still correct
- TRENCHER: Remove — not in any current SF subtype list
- CRAWLER TRACTOR: Rename/update to BULLDOZER/CRAWLER TRACTOR (key: `bulldozer_crawler_tractor`); cover both blade/ripper (dozer) and PTO/drawbar (crawler tractor)
- JET SKI: Replace with PERSONAL WATERCRAFT (key: `personal_watercraft`); verified example is canonical

**Coupe handling:** Each asset type that has a `coupe` subtype (Truck, Trailer, Earthmoving, Agriculture, Caravan, Marine, General Goods) needs a brief COUPE section instructing GPT-4o to describe from photos/notes using the most relevant structure for that asset type — no forced field layout.

**General Goods:** One generic section covering all 16 subtypes. No per-category sections. `normalizeFooter` enforces "Sold As Is, Untested." for all general_goods.

**Marine footer:** "Sold As Is, Untested & Unregistered." for all marine subtypes — `normalizeFooter` enforces this.

**Agriculture and Forklift:** First-time subtype-aware descriptions. Key buyer-relevant specs per subtype must be determined.

**Existing templates to keep unchanged** (subject to "supplement not repeat" philosophy review):
PRIME MOVER, SERVICE TRUCK, RIGID TRUCK / PANTECH / CURTAINSIDER, REFRIGERATED PANTECH, BEAVERTAIL, TILT TRAY, VACUUM TRUCK, CONCRETE PUMP, CONCRETE AGITATOR, EWP (truck), EXCAVATOR, BULLDOZER, GRADER, SKID STEER / COMPACT TRACK LOADER, WHEEL LOADER, BACKHOE LOADER, COMPACTOR, DUMP TRUCK, CARAVAN, MOTOR VEHICLE (CAR), ATTACHMENTS / GENERAL GOODS, MARINE (generic)

### Claude's Discretion

None specified — all key decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DESCR-01 | AI description system prompt covers all 21 new Truck subtypes with appropriate templates | Truck schema has 24 subtypes (21 SF + EWP/Tilt Tray/Flat Deck). Existing prompt covers ~14. Need: crane_truck, fuel_truck, garbage, hook_bin, skip_bin, stock_truck, tanker, tray_truck, water_truck, coupe (new). |
| DESCR-02 | AI description system prompt covers all 25 new Trailer subtypes with appropriate templates | Trailer schema has 24 subtypes. Existing prompt has 1 generic TRAILER section. Need distinct sections for all 24. |
| DESCR-03 | AI description system prompt covers merged Bulldozer/Crawler Tractor earthmoving subtype | Currently separate BULLDOZER and CRAWLER TRACTOR headings; key is now `bulldozer_crawler_tractor`. Merge into one combined section. |
| DESCR-04 | AI description system prompt covers all new Earthmoving subtypes | 9 new subtypes: attachments, conveyors_stackers, crusher, motor_scraper, scraper, screener, tracked_loader, tracked_skid_steer_loader, washing. All missing from current prompt. |
| DESCR-05 | AI description system prompt covers all Agriculture subtypes | 12 subtypes, none currently covered. First-time subtype-aware. |
| DESCR-06 | AI description system prompt covers all Forklift subtypes | 9 subtypes, only TELEHANDLER currently covered. First-time subtype-aware. |
| DESCR-07 | AI description system prompt covers all Caravan subtypes | 5 subtypes, only CARAVAN currently covered. First-time subtype-aware for camper_trailer, motorhome, coupe, other. |
| DESCR-08 | AI description system prompt covers all 10 new Marine subtypes | Current prompt has MARINE (generic) + JET SKI. Need: personal_watercraft, trailer_boat, tug, barge, commercial, fishing_vessel, private, recreational, coupe. |
</phase_requirements>

---

## Summary

Phase 17 is a pure content-authoring task on a single string constant (`DESCRIPTION_SYSTEM_PROMPT`) in `src/app/api/describe/route.ts`. The mechanism — GPT-4o matching the subtype to the nearest ALL_CAPS heading by name — is already proven and working. The test suite in `describe-route.test.ts` verifies template section presence by checking `systemContent.toContain('HEADING_NAME')`. No new mechanism needs to be built; only coverage gaps need to be filled.

The current prompt covers approximately 23 template sections. After Phase 17, it must cover all subtypes across 8 asset types (119 total subtype keys), grouped under headings that GPT-4o can match reliably. Some subtypes are genuinely indistinguishable and share headings (Dog/Pig/Tag trailer; Other/Coupe fallbacks); most need distinct sections with subtype-specific buyer-relevant fields.

The "supplement not repeat" philosophy is the most important content constraint: descriptions must add information not visible in Salesforce fields. This means omitting suspension type, ATM/GVM, odometer, hours, and identifiers from description body lines, while always including powertrain, body equipment specs, and attachment/accessory details.

**Primary recommendation:** Implement in logical groupings by asset type. One plan per major asset type cluster (Truck gaps + Trailer, Earthmoving, Agriculture + Forklift + Caravan + Marine) keeps changes reviewable. Each plan rewrites only the relevant sections of the prompt string.

---

## Standard Stack

### Core (already in place — no new dependencies)

| Component | Location | Purpose |
|-----------|----------|---------|
| `DESCRIPTION_SYSTEM_PROMPT` | `src/app/api/describe/route.ts` lines 9–352 | String constant GPT-4o uses as system message |
| `buildDescriptionUserPrompt()` | same file, lines 368–404 | Passes `asset_type` and `asset_subtype` to GPT-4o |
| `normalizeFooter()` | same file, lines 354–366 | Safety net — strips any footer variant, appends correct one. DO NOT TOUCH. |
| Vitest | `vitest.config.ts` | `npm run test` — test suite |
| `src/__tests__/describe-route.test.ts` | test file | Tests system prompt content by checking `systemContent.toContain(...)` |

### Template Selection Mechanism

GPT-4o matches `asset_subtype` (e.g. `timber_jinker`) to the nearest ALL_CAPS heading by name similarity. The heading does NOT need to be an exact string match — GPT-4o performs fuzzy matching. This means:

- `TIMBER JINKER` heading matches `timber_jinker` subtype key
- `BULLDOZER/CRAWLER TRACTOR` heading matches `bulldozer_crawler_tractor` key
- `DOG / PIG / TAG` heading matches `dog`, `pig`, or `tag` keys

**Implication for implementation:** Heading names should use the human-readable label from the schema (e.g. `Conveyors / Stackers` → heading `CONVEYORS / STACKERS`), not the snake_case key.

---

## Architecture Patterns

### Current Prompt Structure

```
[Preamble: role description, PROCESS instructions]
[ENGINE HP REFERENCE table]
[UNIVERSAL RULES]

TEMPLATES BY ASSET TYPE — select the correct template based on asset identified:

TRUCK (PRIME MOVER)
...

SERVICE TRUCK
...

[~23 template sections]

JET SKI
...

Return the completed description as plain text only...
```

### Template Section Format

```
HEADING NAME (optional clarifier in parentheses)
Line 1: Year, Make, Model, Config, Type
Field 2
Field 3
[Field group if related items share a line]
Sold As Is, Untested & Unregistered.
```

Rules derived from existing sections and Jack's verified examples:
- ALL_CAPS heading, optionally with clarifier in parentheses
- Blank line between each significant item or group WITHIN a template
- Short related items share a line separated by commas (no blank line between them)
- Footer always on its own line at the end
- No dot points anywhere
- Template lines describe WHAT to include, not the literal output (e.g. "Engine: Make, cylinders, fuel type, HP")

### Supplement Not Repeat — Field Inclusion Decision Tree

For any field, ask: "Is this already visible to buyers in Salesforce fields?"

| Field | In SF? | Include in description? |
|-------|--------|------------------------|
| Suspension type | Yes | No (except caravan/camper — selling point) |
| ATM / GVM / tare | Yes | No (except GCM for high-rated prime movers) |
| Odometer / hours | Yes | No |
| VIN / serial / chassis / rego | Yes | No |
| Engine make, cylinders, HP | Partially | YES — powertrain always included |
| Transmission | Partially | YES — always included |
| Body builder name | No | YES |
| Body/drum/tank dimensions | No | YES |
| Equipment brand/model/serial | No | YES (equipment serial numbers, not vehicle) |
| Equipment hours (crane, vacuum) | No | YES |
| Attachment brands and specs | No | YES verbatim from inspection notes |
| Crane capacity, max reach | No | YES |
| Max digging depth, boom length | No | YES |
| Refrigeration unit make/model | No | YES |
| Deck width (for deck widener) | No | YES |
| Container slots (skel) | No | YES |

### Anti-Patterns to Avoid

- **Generic fallback abuse:** Putting `Other` subtypes in a generic section when a specific one can be written — only use generic for truly indeterminate content
- **Field repetition:** Including suspension type, GVM, odometer, rego in description body lines
- **Literal "TBC" or placeholder text:** System prompt explicitly forbids this (UNIVERSAL RULES)
- **Trencher template retention:** TRENCHER is not in any current subtype list — must be removed
- **Old JET SKI template retention:** Must be replaced by PERSONAL WATERCRAFT
- **CRAWLER TRACTOR as standalone:** Must be merged into BULLDOZER/CRAWLER TRACTOR

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template selection routing | Custom matching code in route.ts | GPT-4o's ALL_CAPS heading matching | Already proven, zero code change needed |
| Footer enforcement | Inline logic | `normalizeFooter()` (existing) | Already handles all variants safely |
| Subtype key validation | New validation | Schema registry already validates | Schemas are source of truth |

---

## Coverage Gap Analysis

### Truck (DESCR-01) — 24 subtypes

Current prompt covers: prime_mover, tipper, service_truck, pantech/curtainsider, flat_deck, cab_chassis, refrigerated_pantech, beavertail, tilt_tray, vacuum, concrete_pump, concrete_agitator, ewp

**Missing (need new sections):**
- `crane_truck` — truck-mounted crane; buyer-relevant: crane make/model/capacity/cert status, boom type, body builder, tray dimensions
- `fuel_truck` — fuel tanker on rigid chassis; buyer-relevant: tank capacity (L), compartments, pump make/model/flowrate, metered/unmetered, hose length, bottom-loading vs top-loading
- `garbage` — rear/side loader; buyer-relevant: body make, compaction type (rear loader/side loader/front loader), body capacity (m³), hopper capacity
- `hook_bin` — hook lift/skip loader; buyer-relevant: lift capacity (t), reach, compatible bin size range, hoist make
- `skip_bin` — skip bin truck (cable hoist); buyer-relevant: similar to hook_bin — hoist make/model, capacity, bin compatibility
- `stock_truck` — livestock carrier; buyer-relevant: body builder, deck dimensions, number of decks, loading ramp type, ventilation
- `tanker` — liquid tanker truck; buyer-relevant: tank capacity, compartments, product type (food grade/chemical/fuel/water), pump if fitted
- `tray_truck` — flat tray body (different from flat_deck cab); buyer-relevant: body builder, tray dimensions (L x W), headboard, toolboxes, crane if fitted
- `water_truck` — water cart; buyer-relevant: tank capacity (kL), pump make/model, spray bar, front/rear sprays, dust suppression or construction
- `coupe` — SF artifact; brief COUPE section instructing GPT-4o to use most relevant truck structure

**Keep unchanged:** tipper, flat_deck, cab_chassis, refrigerated_pantech, beavertail, tilt_tray, vacuum (truck), concrete_pump, concrete_agitator, ewp

**Review for "supplement not repeat":** All existing truck templates should be checked — the RIGID TRUCK / PANTECH / CURTAINSIDER template currently includes "Suspension" which violates the philosophy and must be removed.

### Trailer (DESCR-02) — 24 subtypes

Current prompt: 1 generic TRAILER section covering all trailers.

**Need distinct sections for all:**

| Group / Heading | Subtypes Covered | Key Buyer-Relevant Specs |
|-----------------|------------------|--------------------------|
| FLAT DECK TRAILER | flat_deck | Deck L x W mm, payload t, headboard, tie rails, tare |
| CURTAINSIDER TRAILER | curtainsider | Deck L x W, number of curtain side posts, roof type, load restraint |
| PANTECH TRAILER | pantech | Internal L x W x H mm, door type (roller/swing), floor type |
| REFRIGERATED CURTAINSIDER | refrigerated_curtainsider | Deck L x W, refrigeration unit make/model/fuel, temp range |
| REFRIGERATED PANTECH | refrigerated_pantech | Internal dimensions, refrigeration unit make/model/fuel, temp range |
| LOW LOADER | low_loader | Deck L x W, deck height mm, payload t, ramp type, outriggers, extendable if applicable |
| SIDE TIPPER | side_tipper | Body capacity m³, body material, tipping side (L/R/both), payload t |
| TIPPER TRAILER | tipper | Body capacity m³, body material, tailgate type, payload t |
| TANKER TRAILER | tanker | Tank capacity (kL), compartments, product type, discharge type (pump/gravity), ADR if applicable |
| TIMBER JINKER | timber_jinker | Bolster spacing, bolster type, stanchion height, reach configuration, payload |
| SKEL TRAILER | skel | Twist lock positions, container configurations (20ft/40ft/45ft), neck height |
| STOCK TRAILER | stock | Body builder, internal dimensions, number of decks, loading ramp |
| SIDE LOADER | side_loader | Container handling — lift arm type, reach, container configurations |
| CAR CARRIER | car_carrier | Number of vehicles, configuration (single level/multi), ramp type, tie-down type |
| DOG / PIG / TAG | dog, pig, tag | B-train/A-train configuration note, deck type, axle config, payload |
| DOLLY | dolly | Fifth wheel or turntable, axle config, connection type |
| PLANT TRAILER | plant | Deck L x W mm, ramp type, payload t, winch if fitted, tie-down points |
| WALKING FLOOR TRAILER | walking_floor | Floor capacity m³, floor slat count/material, floor manufacturer |
| BOX TRAILER | box | Internal L x W x H, door type, floor material |
| DECK WIDENER | deck_widener | Extended deck width mm, extendable length, payload t |
| COUPE TRAILER | coupe | SF artifact — use most relevant trailer structure |

### Earthmoving (DESCR-03, DESCR-04) — 19 subtypes

**DESCR-03 — Merge:**
- Replace BULLDOZER + CRAWLER TRACTOR with combined BULLDOZER/CRAWLER TRACTOR section covering both blade/ripper (dozer) and PTO/drawbar (crawler tractor)

**DESCR-04 — New sections needed:**

| Subtype Key | Heading | Key Buyer-Relevant Specs |
|-------------|---------|--------------------------|
| `attachments` | EARTHMOVING ATTACHMENTS | Item type (bucket/ripper/hammer/etc.), dimensions (width mm, capacity m³), coupling (OQ/Pin), weight, brand |
| `conveyors_stackers` | CONVEYORS / STACKERS | Type (conveyor/stacker/radial), make/model, belt length/width, feed height, discharge height, motor HP, crawler/wheeled/tracked |
| `crusher` | CRUSHER | Crusher type (jaw/cone/impact/VSI), feed opening dimensions, capacity t/hr, motor HP, tracked/wheeled/stationary |
| `motor_scraper` | MOTOR SCRAPER | Bowl capacity m³, push-pull or self-loading, cutting edge type, operating weight, HP |
| `scraper` | SCRAPER (PULL-TYPE) | Bowl capacity m³, cutting width, tractor requirements, push-block if fitted |
| `screener` | SCREENER | Screen type (vibrating/trommel/star), screen area m², deck count, aperture sizes, capacity t/hr, tracked/wheeled |
| `tracked_loader` | TRACKED LOADER | Operating weight, rated operating capacity, bucket capacity m³, track width, enclosed cab/ROPS, HP |
| `tracked_skid_steer_loader` | TRACKED SKID STEER LOADER | Operating weight, rated operating capacity, track width, aux hydraulics, HP |
| `washing` | WASHING PLANT | Type (sand/aggregate/logwasher), capacity t/hr, water requirement L/min, motor HP, tracked/wheeled/stationary |

**Coupe:** Add brief COUPE (EARTHMOVING) section.

**Review for removal:** TRENCHER section — must be deleted (key not in earthmoving schema).

### Agriculture (DESCR-05) — 12 subtypes (first-time subtype-aware)

Current prompt: No agriculture-specific sections.

| Subtype Key | Heading | Key Buyer-Relevant Specs |
|-------------|---------|--------------------------|
| `tractor` | TRACTOR | Engine make/model/HP, transmission (IVT/CVT/powershift/manual), 4WD/2WD, front/rear 3PL lift capacity (kg), PTO speed/power, remotes count, front loader if fitted, front/rear tyre size |
| `combine_harvester` | COMBINE HARVESTER | Header width (ft), grain tank capacity (bu or L), engine HP, unloading auger reach, threshing system (rotary/conventional), rotor type, yield mapping if fitted, GPS steering if fitted |
| `air_seeder` | AIR SEEDER | Working width (m or ft), row spacing (mm), tank capacity (L or kg), seeding rate range, fan type, air cart capacity if separate, coulter type |
| `disc_seeder` | DISC SEEDER | Working width, row spacing (mm), seed/fert tank capacity (L), disc type (single/double), press wheel type |
| `spray_rig` | SPRAY RIG / SPRAYER | Boom width (m), tank capacity (L), pump type/flowrate, GPS section control if fitted, nozzle type, self-propelled vs trailed |
| `baler` | BALER | Type (round/square/large square), bale dimensions (m), tie type (twine/net/film), pickup width (m), output bales/hr if known |
| `mower_conditioner` | MOWER / CONDITIONER | Cutting width (m), conditioner type (roller/impeller/flail), mower type (disc/drum/cutter bar), 3PL or self-propelled |
| `plough` | PLOUGH | Type (moldboard/disc/chisel/subsoiler), working width or number of tines/furrows, working depth (mm), 3PL or trailed |
| `grain_auger` | GRAIN AUGER | Length (ft), tube diameter (inches), engine/motor HP, portable/swing hopper type, rated capacity (bu/hr) |
| `forestry` | FORESTRY EQUIPMENT | Item-specific: harvester head (bar length/chain), forwarder (load capacity, bunks), mulcher (rotor width, HP) |
| `other` | OTHER AGRICULTURE | Use most relevant structure for the implement visible |
| `coupe` | COUPE (AGRICULTURE) | SF artifact — describe from photos/notes using most relevant structure |

### Forklift (DESCR-06) — 9 subtypes (first-time subtype-aware)

Current prompt: TELEHANDLER only.

| Subtype Key | Heading | Key Buyer-Relevant Specs |
|-------------|---------|--------------------------|
| `clearview_mast` / `container_mast` | FORKLIFT (CLEARVIEW MAST / CONTAINER MAST) | Max lift capacity (kg or t), max lift height (mm), mast type (2/3/4 stage), fuel type (LPG/diesel/electric), HP or kW, tyre type (cushion/pneumatic), side shift if fitted, fork dimensions |
| `walkie_stacker` | WALKIE STACKER | Max lift capacity (kg), max lift height (mm), power (electric — battery voltage/Ah), platform type |
| `electric_pallet_jack` | ELECTRIC PALLET JACK | Max lift capacity (kg), platform/straddle type, battery voltage, charging method |
| `walk_behind` | WALK BEHIND (PALLET JACK) | Manual or powered, max capacity (kg), fork length (mm) |
| `stock_picker` | STOCK PICKER / ORDER PICKER | Max working height (m), platform capacity (kg), power (electric), mast type |
| `ewp` (forklift) | EWP (FORKLIFT-MOUNTED) | Platform max height (m), capacity (kg), whether scissor/boom type, power source |
| `telehandler` | TELEHANDLER | Keep existing template (correct for this subtype) |
| `other` | OTHER FORKLIFT | Use most relevant forklift structure |

### Caravan (DESCR-07) — 5 subtypes (first-time subtype-aware for 4 of 5)

Current prompt: CARAVAN only.

| Subtype Key | Heading | Key Buyer-Relevant Specs |
|-------------|---------|--------------------------|
| `caravan` | CARAVAN | Keep existing template — beds, bathroom, A/C, kitchen, laundry, power, water, exterior, suspension, brakes |
| `camper_trailer` | CAMPER TRAILER | Beds (main tent + annex), ensuite or toilet/shower tent, kitchen (internal/external), fridge/freezer, power (solar, batteries), water tanks, awning, suspension, brakes, hitch type — suspension IS included per Jack's note |
| `motorhome` | MOTORHOME | Chassis/engine make, transmission, drive type, slideouts if any, beds/bunks layout, bathroom, kitchen, A/C, power (solar, generator, shore), water tanks, tyres — suspension NOT included (it's a SF field) |
| `other` | OTHER CARAVAN / CAMPER | Use most relevant caravan/camper structure |
| `coupe` | COUPE (CARAVAN) | SF artifact — describe from photos/notes |

**Note on caravan suspension:** Caravan and Camper Trailer subtypes should include suspension in the template (it's a selling point for towable units — buyers choose based on independent vs leaf spring). Motorhome should omit suspension (SF field only, not a key decision factor for motorhome buyers).

### Marine (DESCR-08) — 10 subtypes

Current prompt: MARINE (generic LOA/beam/draft/hull/engine/nav/berths) + JET SKI.

**Changes required:**
- Remove JET SKI section
- Add PERSONAL WATERCRAFT section (verified example is canonical)
- Keep MARINE as the base/generic section covering private/recreational/other
- Add distinct sections for distinct vessel types

| Subtype Key | Heading | Key Buyer-Relevant Specs |
|-------------|---------|--------------------------|
| `private` / `recreational` | MARINE (RECREATIONAL BOAT) | Keep existing MARINE structure — LOA, beam, draft, hull material, engine(s), hours, nav/electronics, berths, galley, heads, water/fuel, extras |
| `trailer_boat` | TRAILER BOAT | LOA (ft/m), hull material, engine make/model/HP (outboard most common), engine hours, trailer make/ATM if fitted, electronics, extras |
| `personal_watercraft` | PERSONAL WATERCRAFT | Use Jack's verified example as canonical: make/model, engine (Rotax model, cylinders, stroke, forced induction, HP), hours, key tech features (iBR, VTS, etc.), capacity, accessories, trailer details if supplied |
| `barge` | BARGE | LOA (m), beam (m), payload/deck load (t), hull material (steel), propulsion (self-propelled or towed), deck area, accommodation if any |
| `commercial` | COMMERCIAL VESSEL | Vessel purpose (passenger/charter/work), LOA, beam, engine(s), certification/survey status, passenger capacity, nav equipment |
| `fishing_vessel` | FISHING VESSEL | LOA, beam, hull material, engine(s), hours, fishing-specific: pot hauler/net hauler/rod holders/live bait tanks/fishfinders, accommodation |
| `tug` | TUG / WORKBOAT | LOA, beam, engine(s) HP (bollard pull for tugs), propulsion type (azimuth/conventional), accommodation |
| `other` | OTHER MARINE VESSEL | Use most relevant marine structure |
| `coupe` | COUPE (MARINE) | SF artifact — describe from photos/notes using most relevant marine structure |

---

## Code Examples

### Existing Template Section Pattern (from route.ts)

```typescript
// Source: src/app/api/describe/route.ts lines 39-53
TRUCK (PRIME MOVER)
Line 1: Year, Make, Model, Drive Type
Engine: Make, cylinders, fuel type, HP
Transmission, key extras (diff locks, exhaust brake, cruise control, UHF etc.)
GCM for high-rated prime movers
Sold As Is, Untested & Unregistered.

TIPPER
Line 1: Year, Make, Model, Drive Type, Tipper
Engine: Make, cylinders, fuel type, HP
Transmission, Diff Locks, Exhaust Brake
Key extras
Body builder, dimensions in mm, material, rock lining, tarp type, tailgate, Ringfeder if confirmed
Payload: Xkg
Sold As Is, Untested & Unregistered.
```

### Verified Jack Examples (canonical for tone calibration)

**Personal Watercraft (canonical for PERSONAL WATERCRAFT template):**
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
Note: PWC trailer details (VIN, compliance, ATM) ARE included here because the trailer is part of the lot — this is an exception to the no-identifiers rule for the vehicle itself.

**Camper Trailer (canonical for CAMPER TRAILER template):**
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

**Caravan (canonical for CARAVAN template — shows suspension IS included):**
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

### Test Pattern — How Phase 17 Templates Are Verified

```typescript
// Source: src/__tests__/describe-route.test.ts
it('contains FLAT DECK section heading', async () => {
  const s = await getSystemContent('truck', 'flat_deck')
  expect(s).toContain('FLAT DECK')
})
```

New tests follow this exact pattern: verify the heading exists, optionally verify a key spec field name is present in the prompt.

---

## Common Pitfalls

### Pitfall 1: Existing Prompt Violations of "Supplement Not Repeat" Philosophy

**What goes wrong:** Some existing templates include suspension type in description lines (RIGID TRUCK / PANTECH template currently has "Transmission, Brakes, Suspension"). This violates the locked philosophy.
**Why it happens:** Templates predate the "supplement not repeat" philosophy being codified.
**How to avoid:** Review all existing templates against the philosophy during implementation. Remove suspension from RIGID TRUCK / PANTECH template body.
**Warning signs:** Any existing template line that says "Suspension" in the field spec.

### Pitfall 2: GPT-4o Heading Ambiguity for Shared-Type Subtypes

**What goes wrong:** If two separate headings are too similar, GPT-4o may pick the wrong one. E.g., having both `FORKLIFT` and `FORKLIFT (CLEARVIEW MAST)` could cause confusion.
**How to avoid:** Use distinctive heading names. Use parenthetical clarifiers only when needed. For grouped subtypes (e.g. DOG / PIG / TAG), use the slash notation that GPT-4o handles well (proven in existing SKID STEER / COMPACT TRACK LOADER).
**Warning signs:** Subtypes from different groups resolving to the same template output.

### Pitfall 3: COUPE Sections Generating Errors

**What goes wrong:** If a COUPE section is too prescriptive, GPT-4o may fail or produce nonsensical output for what is fundamentally an unknown asset type.
**How to avoid:** COUPE sections should instruct GPT-4o to use the most relevant structure for that asset type family, without forcing specific fields. Keep COUPE instructions short and permissive.

### Pitfall 4: Removing TRENCHER Without Updating Tests

**What goes wrong:** The existing test `it('contains TRENCHER section heading')` at line 767 of `describe-route.test.ts` will FAIL after TRENCHER is removed from the prompt.
**How to avoid:** Update the test file when removing TRENCHER — change the test to verify TRENCHER is NOT present, or delete the test and replace with a test for a currently-valid earthmoving subtype.

### Pitfall 5: Old JET SKI Test Still Passing After Replacement

**What goes wrong:** The test at lines 538–590 of `describe-route.test.ts` asserts `systemContent.toContain('JET SKI')`. This test must be updated to check for PERSONAL WATERCRAFT instead.
**How to avoid:** When replacing JET SKI with PERSONAL WATERCRAFT, update the test to check for `PERSONAL WATERCRAFT` heading.

### Pitfall 6: Normalizing Footers — Marine Subtypes

**What goes wrong:** If a new marine template accidentally uses "Sold As Is, Untested." (the general_goods variant), `normalizeFooter` will correct it at runtime, but it's confusing in the prompt.
**How to avoid:** All marine templates must use "Sold As Is, Untested & Unregistered." in the prompt text.

---

## State of the Art

| Old Approach | Current Approach | Status |
|--------------|------------------|--------|
| Generic TRAILER section for all trailer subtypes | Per-subtype sections (Phase 17 target) | Being implemented |
| JET SKI heading | PERSONAL WATERCRAFT heading | Phase 17 change |
| BULLDOZER + CRAWLER TRACTOR as separate | BULLDOZER/CRAWLER TRACTOR merged | Phase 17 change |
| TRENCHER section (no longer in any schema) | Remove TRENCHER | Phase 17 change |
| No agriculture/forklift/caravan subtype sections | Full subtype-aware coverage | Phase 17 change |

**Deprecated/outdated in current prompt:**
- `JET SKI` section: replace with `PERSONAL WATERCRAFT`
- `TRENCHER` section: remove entirely
- `CRAWLER TRACTOR` standalone: merge into `BULLDOZER/CRAWLER TRACTOR`
- `RIGID TRUCK / PANTECH / CURTAINSIDER` `Suspension` field line: remove

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test -- --reporter=verbose src/__tests__/describe-route.test.ts` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DESCR-01 | Prompt contains all 24 truck subtype headings (crane_truck, fuel_truck, garbage, hook_bin, skip_bin, stock_truck, tanker, tray_truck, water_truck, coupe + 14 existing) | unit | `npm run test -- src/__tests__/describe-route.test.ts` | Partial — existing tests cover 14/24; new tests needed for 10 gaps |
| DESCR-02 | Prompt contains distinct sections for all 24 trailer subtypes | unit | `npm run test -- src/__tests__/describe-route.test.ts` | No — Wave 0 gap |
| DESCR-03 | Prompt contains BULLDOZER/CRAWLER TRACTOR heading; does not contain standalone BULLDOZER or CRAWLER TRACTOR as separate sections | unit | `npm run test -- src/__tests__/describe-route.test.ts` | Partial — existing tests check BULLDOZER and CRAWLER TRACTOR separately (must be updated) |
| DESCR-04 | Prompt contains headings for all 9 new earthmoving subtypes | unit | `npm run test -- src/__tests__/describe-route.test.ts` | No — Wave 0 gap |
| DESCR-05 | Prompt contains headings for all 12 agriculture subtypes | unit | `npm run test -- src/__tests__/describe-route.test.ts` | No — Wave 0 gap |
| DESCR-06 | Prompt contains headings for all 9 forklift subtypes | unit | `npm run test -- src/__tests__/describe-route.test.ts` | No — Wave 0 gap |
| DESCR-07 | Prompt contains headings for all 5 caravan subtypes | unit | `npm run test -- src/__tests__/describe-route.test.ts` | No — Wave 0 gap |
| DESCR-08 | Prompt contains headings for all 10 marine subtypes; JET SKI section is absent; PERSONAL WATERCRAFT is present | unit | `npm run test -- src/__tests__/describe-route.test.ts` | Partial — existing tests check MARINE and JET SKI (JET SKI test must be updated) |

### Sampling Rate

- **Per task commit:** `npm run test -- src/__tests__/describe-route.test.ts`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/describe-route.test.ts` — add `DESCR-01` coverage: tests for crane_truck, fuel_truck, garbage, hook_bin, skip_bin, stock_truck, tanker, tray_truck, water_truck, coupe (truck) headings
- [ ] `src/__tests__/describe-route.test.ts` — add `DESCR-02` coverage: tests for all 24 trailer subtype headings
- [ ] `src/__tests__/describe-route.test.ts` — update `DESCR-03` coverage: update existing `BULLDOZER` and `CRAWLER TRACTOR` tests to check for merged `BULLDOZER/CRAWLER TRACTOR` heading
- [ ] `src/__tests__/describe-route.test.ts` — add `DESCR-04` coverage: tests for conveyors_stackers, crusher, motor_scraper, scraper, screener, tracked_loader, tracked_skid_steer_loader, washing, attachments headings
- [ ] `src/__tests__/describe-route.test.ts` — add `DESCR-05` coverage: tests for all 12 agriculture subtype headings
- [ ] `src/__tests__/describe-route.test.ts` — add `DESCR-06` coverage: tests for all 9 forklift subtype headings (including TELEHANDLER which already exists)
- [ ] `src/__tests__/describe-route.test.ts` — add `DESCR-07` coverage: tests for all 5 caravan subtype headings
- [ ] `src/__tests__/describe-route.test.ts` — update `DESCR-08` coverage: update JET SKI test → PERSONAL WATERCRAFT; add tests for trailer_boat, tug, barge, commercial, fishing_vessel, private, recreational, coupe (marine)
- [ ] `src/__tests__/describe-route.test.ts` — update TRENCHER test: change from `toContain('TRENCHER')` to `not.toContain('TRENCHER')` (or delete and replace)

---

## Open Questions

1. **Truck COUPE heading collision**
   - What we know: `coupe` appears across multiple asset types (truck, trailer, earthmoving, agriculture, caravan, marine, general_goods)
   - What's unclear: Will GPT-4o correctly pick "COUPE (TRUCK)" vs "COUPE (TRAILER)" vs "COUPE (AGRICULTURE)" when a coupe asset_type is passed?
   - Recommendation: Use distinct parenthetical clarifiers per asset type (COUPE (TRUCK), COUPE (TRAILER), etc.) and ensure `buildDescriptionUserPrompt` always passes the asset_type so GPT-4o can use it for disambiguation.

2. **Tray Truck vs Flat Deck (truck) overlap**
   - What we know: Both `tray_truck` and `flat_deck` are in the truck schema. A flat deck is typically a tray-style body.
   - What's unclear: Whether these need genuinely distinct templates or one heading can cover both.
   - Recommendation: Give each a distinct heading. TRAY TRUCK focuses on rear-tipper style flat beds with toolboxes/crane; FLAT DECK focuses on load-carrying with tie rails. Jack explicitly retained both in the schema.

3. **Forklift EWP vs Truck EWP heading collision**
   - What we know: Both forklift and truck schemas have `ewp` as a subtype. The truck EWP template is already in the prompt as "EWP (ELEVATED WORK PLATFORM)".
   - What's unclear: Whether GPT-4o will correctly pick the forklift EWP template vs the truck EWP template.
   - Recommendation: Add "EWP (FORKLIFT-MOUNTED)" as a distinct heading for the forklift variant, and ensure the truck EWP heading retains its existing form.

---

## Sources

### Primary (HIGH confidence)

- Direct code inspection of `src/app/api/describe/route.ts` — full current prompt text, template section format, `normalizeFooter`, `buildDescriptionUserPrompt`
- Direct code inspection of all 8 schema files in `src/lib/schema-registry/schemas/` — authoritative subtype keys and counts
- Direct code inspection of `src/__tests__/describe-route.test.ts` — existing test coverage and test patterns
- `17-CONTEXT.md` — Jack's verified description examples and locked implementation decisions

### Secondary (MEDIUM confidence)

- Industry knowledge of Australian auction heavy equipment categories — buyer-relevant specs per subtype (cross-verifiable with Slattery auction listings)

### Tertiary (LOW confidence)

- GPT-4o fuzzy heading matching behaviour — inferred from existing working patterns; not officially documented

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified by direct code inspection
- Architecture: HIGH — single-file string constant change, pattern well-established
- Coverage gaps: HIGH — direct enumeration from schema files vs current prompt
- Buyer-relevant specs per subtype: MEDIUM — based on industry knowledge of Australian auction categories; implementer should validate against Jack's examples and known Slattery listings
- Test updates required: HIGH — existing failing tests (JET SKI, TRENCHER, BULLDOZER/CRAWLER TRACTOR) clearly identified

**Research date:** 2026-03-24
**Valid until:** 2026-06-24 (stable — no fast-moving dependencies)
