# Competitor Auction Description Research
**Under-Covered Categories: Marine, Caravan/Motorhome, Agriculture, Forklift, Trailers**
_Research date: April 2026 — sources: Grays Australia, Pickles Auctions, Lloyds Auctions, Ritchie Bros, AuctionsPlus_

---

## Summary of Key Conventions (All Categories)

Before diving into individual categories, the following patterns appear consistently across Australian auction houses:

- **Condition line** is almost always at the end: "Sold As Is, Where Is — No Warranty, No Cooling Off Period" (Grays) or "Sold As Is, Untested & Unregistered" (Pickles/Slattery style)
- **Registration** is explicitly stated — either current rego with expiry date, or "Sold Unregistered and Without Plates"
- **Specs are listed as structured fields**, not prose paragraphs — colon-separated label/value pairs or bullet-point lists
- **Location** is always stated (relevant for buyer collection logistics)
- **Serial/VIN/HIN** numbers are included for marine, trailers, and equipment
- **Hours** are listed as "X hrs showing" or "approx X hrs" for marine and plant equipment
- Grays uses "As Is – Where Is" language; Pickles uses "Sold As Is, Untested"; Slattery typically uses "Sold As Is, Untested & Unregistered"

---

## 1. Marine

### 1.1 Format Conventions

**Grays Australia — marine listings follow a structured fields format:**

```
Make/Designer: [Brand]
Model: [Model]
HIN: [Hull ID Number]
Registration: [Rego number] / Sold Unregistered and Without Plates
State: [QLD/NSW/VIC...]
Vessel Type: Power / Sail
Vessel Class: Recreational / Commercial Survey
Hull Type: [Fibreglass / Aluminium / Pontoon / GRP]
Length: [X.Xm approx]
Beam: [X.Xm approx]
Draft: [X.Xm approx]
Construction: [Aluminium / Fibreglass]
Vessel Capacity: [X persons]

Engine Make: [Brand]
Engine Type: [Outboard / Inboard / Jet]
Horse Power: [XXX]
Fuel Type: [Petrol / Diesel]
Engine Serial No: [...]
Engine Hours: [X approx] / Hours Not Visible
Engine Turns Over: Yes / No

Trailer Make: [Brand]
Year Built: [YYYY]
Sold Unregistered and Without Plates
Trailer VIN: [...]
Registration State: [State]
Winch: Yes / No
Lights: [Removal Light Board / LED]
Spare Tyre: Yes / No
Jockey Wheel: Yes / No

Electrical Accessories: [Nav Lights / Stereo / Anchor Light...]
General Equipment: [Bimini / Bimini Top / Anchor...]
Damage: [Description or "Used marks, scratches, surface rust"]

All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply.
```

**Key conventions:**
- Hull length stated in **metres** (not feet) for Australian market — though dealer descriptions on boatsales.com.au often give feet first (e.g. "19ft / 5.8m")
- HIN (Hull Identification Number) always included where present
- Engine hours listed as "approx" when read from a meter, or "hours not visible" when unverifiable
- Condition notes follow a "damage" field — factual, not prose: "Seats worn, Grip tape peeling, Scratches and cracks across body"
- Trailer always listed as a separate section with its own VIN and registration status
- When no engine is included, this is stated explicitly: "No engine included"

---

### 1.2 Example Descriptions

**Example 1 — Grays Australia: 2006 Sea-Doo GTX Limited Jet Ski (Lot 0001-10081521)**

```
Make/Designer: Sea-Doo
Model: GTX Limited
HIN: CA YDV05844B606
Registration: QB078Q
Person/Seat Capacity: 3
Style: Sit down
Engine Make: Rotax 4 Tec
Engine Hours: 31 approx
Engine Turns Over: Yes [video of engine running available]

Trailer Make/Model: Gold Coast Jetski Trailer
Year Built: 2005
Trailer Registration: BY7179
Registration State: QLD
Trailer VIN: 6HRBTGCT5L5000181
No. of Axles: 1
Accessories: Winch, Lights

Condition: Seats worn, Grip tape peeling, Scratches and cracks across body

All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply.
```

---

**Example 2 — Grays Australia: 2021 Sea Doo RXT XRS 300 Supercharged Jet Ski (Lot 0001-20020453)**

```
Year: 2021
HIN: VT772
Seats: 3
Features: Exhaust, Rear Step, Recent Sea Doo Essendon service, Still under Warranty
Engine Make: Rotax
Fuel Type: Petrol

Trailer Make: Mayfair Marine Tinka
Trailer Model: RE1213WT
Trailer Build Date: 2020-10
Trailer VIN: 6H4RE121320007720
Trailer Registration State: VIC

Item Condition: Used
Location: 140-152 National Drive, Dandenong South VIC 3175
```

---

**Example 3 — Grays Australia: 2023 Brinovo Pontoon Boat 480L — New (Lot 0001-10081678)**

```
Make/Designer: Brinovo
Model: 480L
Build Date: 2023
HIN: CNSRPB6564B323
Registration: Sold Unregistered
Hull Type: Pontoon
Vessel Type: Power
Vessel Class: Recreational
Length: 4.8m approx
Beam: 2.3m approx
Draft: 0.4m approx
Construction: Aluminium
Vessel Capacity: 8
Engine: No engine included

Electrical Accessories: 12 Volt, Nav Lights, Anchor/Mooring Light, Stereo
General Equipment: Bimini

Trailer Make: Sunner Group
Year Built: 2022
Sold Unregistered and Without Plates
Trailer VIN: 6U9VSS00000269918
Winch: Yes
Lights: Yes

Condition: Used — As Is Where Is basis. No statutory warranty or cooling off periods apply.
```

---

**Example 4 — Grays Australia: 5.3m Southwind 5F565 Power Cruiser Boat (Lot 0001-10082139)**

```
Hull Type: Fibreglass
Engine Type: Outboard
Engine Make: Yamaha F115AET 68V
Horse Power: 115
Fuel Type: Petrol (4-stroke)
Engine Turns Over: Yes (requires new batteries)
Length: 5.3m approx

Trailer Make: Homemade
Year Built: 2010
Sold Unregistered and Without Plates
Trailer VIN: 6T9T22AEAA0AA13030
Winch: Electric
Lights: Yes
ATM: 1.02t
Construction: Galvanised
Axle: Tandem
Spare Tyre: Yes

Condition: Used
```

---

**Example 5 — Grays Australia: 3.5m Aluminium Boat (Lot 0001-10082586)**

```
Hull Type: Flat Bottom
Length: 3500mm approx
Beam: 1400mm approx
Construction: Aluminium

Engine Type: Outboard
Engine Make: Mariner ST4
Horse Power: 5
Fuel Type: Petrol
Engine Serial No: OR005872
Engine Turns Over: No
Fuel Tank Capacity: 10 Ltrs
Other: 2x Oars, Bilge Pump

Trailer Make: Brooker Trailers
Year Built: 1990
Sold Unregistered and Without Plates
Trailer VIN: TR410005429
Winch: Manual Winch
Lights: Removal Light Board

Condition: Used — As Is Where Is.
```

---

**Example 6 — Grays Australia: 2024 Brinovo 19W Aluminium Pontoon — Commercial Survey (Lot 0001-10082904)**

```
Make/Designer: Brinovo
Model: 19W
Year: 2024
Hull Type: Pontoon
Vessel Class: Commercial Survey
Construction: Aluminium
Length: approx 5.8m (19ft)

[Engine/trailer details as applicable]

Condition: Used — As Is Where Is.
```

---

### 1.3 Observations — Marine Category

- Grays and Pickles both list boats with a **structured key-value format**, no flowing prose
- The trailer is always a separate section within the same listing — critical for buyers to know registration status
- "Engine Turns Over: Yes/No" is a standard field — if yes, a video link may be referenced
- Grays notes damage in a factual "Damage:" field; they do not write narrative condition paragraphs
- Pickles marine uses similar format; their fortnightly national boat auctions are online-only
- Lloyds Auctions Facebook posts describe boats as "complete marine packages" (boat + trailer + outboard) in a single headline-style summary rather than structured fields — more marketing-oriented
- **Key insight for AI descriptions:** Always include HIN, registration status, engine hours, trailer VIN/rego status, and a damage/condition note. For jet skis specifically, seat capacity and style (sit-down vs stand-up) is a standard field

---

## 2. Caravan / Motorhome

### 2.1 Format Conventions — Caravans

**Grays Australia** uses a **feature bullet list** format (dot-separated or middle-dot separated), listing every fitted feature:

```
[Year] [Make] [Model] Caravan

Features:
Air Conditioning · TV · TV Antenna · Inverter · 240v Power Inlet · Toilet ·
Indoor Shower · Outdoor Shower · Hot Water · Awning · Ext Gas Bayonet ·
Fresh Water · Grey Water · Solar Power · [Battery capacity e.g. 600amp of lithium] ·
Entertainment · Alloys · Stabilising Legs · Spare Wheel · Jockey Wheel ·
Sky Light · Gas Bottle · Annex [if applicable]

Length: [Xft / X.Xm]
Berths: [X]
Year of Manufacture: [YYYY]
Compliance: [YYYY]
Registration: [Rego] or Sold Unregistered
Registration Expiry: [Date]

Condition: [Used / Damaged — notes on specific damage if applicable]

All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply.
```

**Pickles Auctions** uses a similar feature list for caravans, often grouped by category:
- Sleeping/living: berths, bunk layout
- Kitchen: appliances, benchtops
- Bathroom: toilet type, shower
- Electrical: solar (watts), battery (Ah/kWh), inverter (watts), 240V hookup
- External: awning type, annexe, spare wheel
- Chassis: independent suspension, ATM
- Included: any accessories (e.g. toolboxes, jerry can holders)

**Motorhome format (Grays):**
```
Make: [Brand]
Model: [Model name/variant]
Variant: [e.g. Winnebago / Alpine]
Transmission: [X Manual / Auto]
Engine Capacity: [X.X Ltr]
Fuel Type: [Diesel / Petrol]
Drive Type: [4x2 / 4x4]
Sleeping Capacity: [X]
Body Type: Motorhome
REGO: [Rego]
State: [State]
Rego Expiry: [Date]
Odometer Reading: [XXX,XXX kms]
Exterior Colour: [Colour]
Interior Colour: [Colour]
VIN: [...]
Condition: Key: Yes / No | Spare Key: Yes / No | Owners Manual: Yes / No | Engine Turns Over: Yes / No

Pickup Location: [Address]

ALL ASSETS IN THIS SALE ARE SOLD "AS IS" WITHOUT WARRANTY AND COOLING OFF PERIOD.
```

---

### 2.2 Example Descriptions

**Example 1 — Grays Australia: Lotus Freelander Caravan (Lot 0001-21001135)**

```
Air Conditioning · TV · TV Antenna · Inverter · 240v Power Inlet · Toilet ·
Indoor Shower · Outdoor Shower · Hot Water · Awning · Ext Gas Bayonet ·
Filtered drink water · Fresh Water · Grey Water · Dust reduction system ·
Solar Power · 600amp of lithium · Entertainment · Alloys · Stabilising Legs ·
Spare Wheel · Spot Lights · Jockey Wheel · Sky Light · Gas Bottle · Annex

Condition: Used
All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply.
```

---

**Example 2 — Grays Australia: 2023 Austrack Talawana X15 Caravan — No Reserve (Lot 0001-9053288)**

```
Air Conditioning · TV · Inverter · 240v Power Inlet · Toilet · Indoor Shower ·
Outdoor Shower · Awning · Ext Gas Bayonet · Pop Top · Fresh Water · Grey Water ·
Solar Power · Stabilising Legs · Spare Wheel/s · Jockey Wheel · Sky Light

Condition: Used — No Reserve
All assets sold As Is – Where Is.
```

---

**Example 3 — Grays Australia: 2024 Off Grid SD15D Caravan (Lot 0001-10345567)**

```
Under bed Air Conditioning · LCD TV screen on swivel mount · 2000w Renogy Inverter ·
240v Power Inlet · Thetford Toilet · Indoor Shower · Outdoor Shower ·
Truman 14l Gas/Electric Hot Water · Electric Awning · Pop Top ·
2x 100l Fresh Water · 1x 100l Grey Water · Stabilising Legs · Spare Wheel/s ·
Jockey Wheel · 4x 150w solar panels (600w total) · 3x 120ah Lithium Batteries

Condition: Used
All assets sold As Is – Where Is.
```

---

**Example 4 — Grays Australia: 1999 Mazda T4600 Winnebago Motorhome (Lot 0001-10332728)**

```
Make: Mazda
Model: T4600
Variant: Winnebago
Transmission: 5 Manual
Engine Capacity: 4.6 Ltr
Fuel Type: Diesel
Drive Type: 4x2
Sleeping Capacity: 5
Body Type: Motorhome
REGO: AE03LH
State: NSW
Rego Expiry: 2/06/2023
Odometer Reading: 197,183 kms
Exterior Colour: White/Green
Interior Colour: Grey
VIN: JM0WGM7T000608685
Key: Yes | Spare Key: No | Owners Manual: Yes | Engine Turns Over: Yes

Pickup Location: Rear of 5 Holbeche Road (entry via Prima Place) Arndell Park NSW 2148

ALL ASSETS IN THIS SALE ARE SOLD "AS IS" WITHOUT WARRANTY AND COOLING OFF PERIOD.
Once a bid is placed, it cannot be withdrawn and will not be cancelled unless there are
exceptional circumstances. No refunds will be given unless there are exceptional circumstances.
```

---

**Example 5 — AusRV / Lloyds Auctions Style (from blog content)**

Lloyds Auctions describes premium caravans in a more marketing narrative style:

> "Locally built in their Queensland factory by skilled RV tradesmen, AusRV Caravans are lightweight, strong, water, dust and hail resistant. With lavish marble benchtops, high end appliances and air conditioned and powered throughout, these really are the pinnacle of luxury travel in Australia."

This contrasts with Grays and Pickles which use structured spec lists. Lloyds tends toward marketing copy for prestige/new stock while using structured specs for used/damaged stock.

---

### 2.3 Observations — Caravan/Motorhome

- **Caravans on Grays** use a flat, dot-separated feature list — no grouping by category
- The list approach means buyers scan for the features they care about (solar watts, battery Ah, toilet type)
- Specific quantities matter: "600amp of lithium" vs just "battery storage"; "4x 150w solar panels (600w total)"
- **Pop Top** is called out explicitly as a body style modifier
- Motorhomes are treated more like vehicles — odometer reading, engine capacity, VIN, rego — essentially a vehicle format with "Sleeping Capacity" added
- Closing line for motorhomes is more formal/legal: "ALL ASSETS IN THIS SALE ARE SOLD 'AS IS' WITHOUT WARRANTY AND COOLING OFF PERIOD"
- **Key insight for AI descriptions:** For caravans, output a bullet/dot list of every feature. Don't write prose. For motorhomes, use vehicle-style fields (odo, engine, trans) then add RV fields (berths, etc.)

---

## 3. Agriculture — Spray Rigs, Headers/Combines, Seeders, Grain Augers, Balers

### 3.1 Format Conventions

Australian agricultural auction descriptions (Grays, AuctionsPlus, Farm Clearing Sales) use **structured key-value specs** combined with **a brief narrative condition note**.

**Spray Rig / Self-Propelled Sprayer format:**
```
[Year] [Make] [Model] [Type e.g. Self-Propelled Sprayer]

Make: [Brand]
Model: [Model]
Serial No: [...]
Year: [YYYY]
Engine Hours: [X,XXX hrs showing]
Engine Make: [Brand e.g. Cummins QSB6.7L]
Transmission: [Hydrostatic / Manual]
Tank Capacity: [X,XXX litres / X,XXX gallons]
Boom Width: [Xm / Xft]
Boom Type: [Carbon fibre / Steel / Aluminium]
Nozzle Spacing: [Xcm / Xinch]
Nozzle Type: [AI XR / TeeJet / etc.]
Number of Nozzles: [XX]
Tyre Size: [Spec]
GPS/Section Control: [Yes/No — system details]

Condition: [Narrative — e.g. "Presents in good working condition. Boom in excellent order.
Minor wear marks consistent with age. Always shedded."]

Sold As Is, Where Is.
```

**Header/Combine Harvester format:**
```
[Year] [Make] [Model] Header / Combine Harvester

Make: [Brand e.g. Case IH / John Deere / New Holland]
Model: [Model e.g. 6088 / S680]
Serial No: [...]
Year: [YYYY]
Engine Hours: [X,XXX hrs showing]
Separator Hours: [X,XXX hrs] [if available]
Rotor/Cylinder Type: [Axial-flow / Conventional]
Header Front: [Included / Not included — size if included, e.g. "35ft Macdon draper front on trailer"]
Feeder House: [condition notes]
Grain Tank Capacity: [X,XXX litres / X bu]
Unload Rate: [X litres/min if known]
Tyres: [Front: XX/XXR30 RD / Rear: XXX condition]
Draper/Auger Front: [make, width, condition]
Straw Chopper: [Yes/No]
Chaff Spreader: [Yes/No]
Yield Monitor: [Yes/No]
GPS Autosteer: [Yes/No — system]

Condition: [Narrative — e.g. "2,453 hours showing. Draper bearings recently replaced.
Belt in fair/worn condition. Consult photos for detail."]

Sold As Is, Where Is.
```

**Air Seeder / Seeding Bar format:**
```
[Year] [Make] [Model] Air Seeder / Seeding Bar

Make: [Brand e.g. John Deere / Morris / Bourgault / Flexi-Coil]
Model: [Model]
Bar Width: [Xft / Xm]
Row Spacing: [Xcm or Xinch spacings]
Number of Tynes/Rows: [XX tynes]
Seeding Boot/System: [Single shoot / Double shoot / Disc / Tyne]
Cart Make: [Brand]
Cart Model: [Model]
Cart Capacity: [X,XXX litres — split if multi-bin e.g. "6550L total (2580L/3970L split)"]
Fan Type: [Ground drive / Hydraulic / Electric]
Monitors: [Seed/fertiliser monitor type]

Condition: [e.g. "Presents in good order. Repairs made to cracks in tank. Always shedded."]

Sold As Is, Where Is.
```

**Grain Auger format:**
```
[Make] [Model] Grain Auger

Make: [Brand e.g. Westfield / Batco / Sakundiak]
Model: [Model]
Length: [Xft / Xm]
Diameter: [Xin / Xcm]
Drive Type: [PTO / Electric / Engine-drive]
Engine: [Brand + capacity if engine-drive]
Hopper: [Standard / Extended / swing-away]
Undercarriage: [Wheel kit / transport axle]

Condition: [e.g. "Good working order. Flighting serviceable. Minor surface rust."]

Sold As Is, Where Is.
```

**Baler format:**
```
[Year] [Make] [Model] [Round / Square / Large Square] Baler

Make: [Brand e.g. New Holland / John Deere / Lely Welger / Kuhn]
Model: [Model e.g. D1000 / RP160V]
Type: [Round / Small Square / Large Square]
Bale Size: [diameter x width, or LxWxH]
Bales Completed: [approx X,XXX bales]
Pickup Width: [Xcm / Xft]
Net Wrap / Twine: [Net wrap / Twine / Both]
Knotter/Net System: [condition notes]
Drive: [PTO]
Overhaul History: [e.g. "Major overhaul at 60,000 bales — new roller bearings, sprockets, chains, net wrap system"]

Condition: [e.g. "Good order. Progressive density chamber. Drop floor for easy blockage clearing.
Upgraded knives. Recent overhaul at ~60,000 bales."]

Sold As Is, Where Is.
```

---

### 3.2 Example Descriptions

**Example 1 — AuctionsPlus / Grays: Self-Propelled Alpha Sprayer**

```
Model: Alpha [self-propelled]
Transmission: Hydrostatic
Fuel: Diesel
Engine Hours: 4,492 hrs showing
Tank Capacity: 7,150L
Boom Width: 28m

Condition: Working order. Hours showing 4,492. Consistent wear for age.

Sold As Is, Where Is.
```

---

**Example 2 — AuctionsPlus: New Holland 575 Small Square Baler**

*(From auction-results listing)*

```
Make: New Holland
Model: 575
Type: Small Square Baler
Drive: PTO

[Condition and bale count described in lot notes]

Sold As Is, Where Is.
```

---

**Example 3 — AuctionsPlus: Progressive Density Round Baler (multi-vendor auction)**

```
Type: Round Baler — Progressive Density
Bales Completed: approx 70,000
Drop Floor: Yes (easy blockage clearing)
Knives: Upgraded
Net Wrap System: New (replaced at overhaul)
Last Overhaul: approx 60,000 bales — included new roller bearings, sprockets, chains, net wrap system

Condition: Good working order. Major overhaul completed. Drop floor fitted.

Sold As Is, Where Is.
```

---

**Example 4 — AuctionsPlus: Case IH 6088 Combine Harvester & 35ft Macdon Draper Front on Trailer (Lot 18 — Major Broadacre Clearance Sale, Central West NSW, March 2024)**

```
Make: Case IH
Model: 6088
Header Front: 35ft Macdon Draper Front (included, on trailer)
Location: Central West NSW

[Engine hours, separator hours, and full condition notes available in lot description on AuctionsPlus]

Sold As Is, Where Is.
```

---

**Example 5 — AuctionsPlus: Morris Concept 2000 Air Seeder Bar + 7180 Cart**

```
Bar: Morris Concept 2000
Bar Width: 12m (tyne-to-tyne)
Row Spacing: 12 inch spacings
Cart: Morris 7180
Cart Capacity: 6,550L total (2,580L / 3,970L split)
Fan: [Type]

Condition: Good order. Repairs made to cracks. Presents well for age.

Sold As Is, Where Is.
```

---

**Example 6 — AuctionsPlus: Bourgault 3350 QDA Air Seeder Bar + TBH 6450 Cart**

```
Bar: Bourgault 3350 QDA
Configuration: Double shoot, 12 inch spacing, 48 tynes (48ft width)
Cart: TBH 6450 Bourgault
Cart Type: 3 bin, twin fan

Condition: [Described in lot]

Sold As Is, Where Is.
```

---

**Example 7 — AuctionsPlus/Farm Clearing Sales: 2017 Hardi 8500L Boomspray**

```
Make: Hardi
Year: 2017
Tank Capacity: 8,500L
Boom Width: 42.5m
Boom Material: Aluminium

Condition: Working order.

Sold As Is, Where Is.
```

---

### 3.3 Observations — Agriculture

- **Engine/separator hours** are the most critical spec for headers and self-propelled sprayers — always state both if available
- **Boom width** in metres is the primary spec for sprayers; tank capacity is secondary
- For **seeders**, the bar width (in metres and feet), row spacing, and cart capacity (split by bin) are the critical specs
- For **balers**, bales completed is more meaningful than engine hours; overhaul history signals reliability
- **Condition notes** in ag listings tend to be narrative (2–4 sentences) rather than the structured "Damage:" field used for boats/trucks — there is more emphasis on maintenance history and shedding history
- AuctionsPlus uses lot descriptions with a short narrative condition note followed by "Sold As Is, Where Is"
- Farm Clearing Sales descriptions tend to be more verbose with history of use
- **"Always shedded when not in use"** is a highly valued phrase in Australian ag listings — it signals the equipment was protected from weather
- **"Presents in good/working/excellent order"** is the common opener for condition paragraphs
- Ritchie Bros Australia holds dedicated national agricultural unreserved auctions (Sep annually) with equipment across Brisbane, Geelong, Perth, Dubbo, Adelaide sites
- Grain augers are relatively simple — length, diameter, drive type, and condition are sufficient

---

## 4. Forklift

### 4.1 Format Conventions

**Grays Australia** uses the most detailed structured format for forklifts:

```
[Year] [Make] [Model] [Type e.g. Counterbalance / Reach / Order Picker] Forklift

Serial Number: [...]
Year: [YYYY]
Hours (Showing): [X,XXX]
Fuel Type: [LPG / Diesel / Electric / Dual Fuel]
Capacity: [X,XXXkg]
Mast Type: [2 Stage / 3 Stage / Container Mast / High Reach]
Lift Height: [X,XXXmm]
Resting Mast Height: [X,XXXmm]
Tyne Length: [X,XXXmm]
Features: [ROPS / Side Shift / Seat Belts / Flashing Beacon / Full Free Lift]
Tyres: [Pneumatic / Cushion / Solid]
Service History: [e.g. "Recently serviced on 16/10/2023"]
Damage: [e.g. "Marks, scratches, Dents & Surface Rust" / "Used marks, scratches, dents, stains, surfaces rusted"]

All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply.
```

For **electric forklifts**, voltage and charger are added:
```
Voltage: [24V / 48V / 80V]
Battery Charger: Included / Not included
```

For **unused/new forklifts** (no hours), Grays drops hours and service history, adds:
```
Condition: Unused
Approx Shipping Dimensions: [LxWxH mm]
Approx Weight: [X,XXXkg]
Includes: [e.g. "1000 Hour Service Kit and Toolbox"]
```

**Ritchie Bros Australia** uses a bullet-point format:
```
[Make] [Model]
• [Capacity]
• [Mast type] • [Max lift height e.g. "8000 mm Max Lift Height"] • [Lowered mast height e.g. "3550 mm Lowered Mast Height"]
• [Fork size e.g. "1070 mm Forks"]
• Side Shift
• [Power e.g. "24 V"] • Battery Charger
```

---

### 4.2 Example Descriptions

**Example 1 — Grays Australia: Toyota 32-8FG25 Counterbalance Forklift (Lot 0012-5056249)**

```
Year: 2018
Hours (Showing): 6,640
Fuel Type: LPG
Capacity: 2,500kg
Mast Type: 2 Stage Mast
Lift Height: 4,000mm
Resting Mast Height: 2,500mm
Tyne Length: 1,050mm
Features: ROPS, Side Shift, Seat Belts, Flashing Beacon
Tyres: Pneumatic
Damage: Used marks, scratches, dents, stains, surfaces rusted

All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply.
```

---

**Example 2 — Grays Australia: TCM FHG18T3 Forklift (Lot 0001-3027292)**

```
Serial Number: 0B901381
Hours (Showing): 9,873
Fuel Type: Dual Fuel
Capacity: 1,160kg
Mast Type: 2 Stage Mast
Lift Height: 4,500mm
Service History: Recently serviced on 16/10/2023
Damage: Marks, scratches, Dents & Surface Rust

All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply.
```

---

**Example 3 — Grays Australia: Unused HH30Z Diesel Forklift (Lot 0001-3018637)**

```
Model: HH30Z
Condition: Unused
Fuel Type: Diesel
Capacity: 3 Ton
Maximum Lift Height: 3m
Mast Type: 2 Stage Mast
Side Shift: Yes
Forks: 1,070mm
Tyres: Pneumatic
Includes: 1,000 Hour Service Kit and Toolbox
Serial No: 20200497
Approx Shipping Dimensions: 3,600mm L x 1,450mm W x 2,200mm H
Approx Weight: 4,300kg
Location: Torrington, Toowoomba QLD

All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply.
```

---

**Example 4 — Grays Australia: Crown High Reach Forklift (Lot 0002-5051753)**

```
Type: High Reach / Order Picker
Load Capacity: 1,588kg
Lift Height: 5 metres
Mast Tilt: Forward 5 degrees, Tip Back 4 degrees
Power: Electric 24 Volt
Battery Charger: Included
Max Speed: 10 kph

All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply.
```

---

**Example 5 — Grays Australia: Crown CD1606-5 Counterbalance Forklift (Lot 0001-9060684)**

```
Model: CD1606-5
Serial Number: P4-00243
Capacity: 6,365kg
Mast Tilt: Forward
Fuel Type: Diesel

All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply.
```

---

**Example 6 — Ritchie Bros Australia: Nissan RM02L30U Electric Forklift**

```
Nissan RM02L30U Electric Forklift
• 3 Stage Mast
• Full Free Lift
• Side Shift
• 8,000mm Max Lift Height
• 3,550mm Lowered Mast Height
• 1,070mm Forks
• 24V Electric
• Battery Charger included
```

---

**Example 7 — Grays Australia: 2025 3 Ton Dual Wheel 4.5m Mast Diesel Forklift — Unused (Lot 0003-7060589)**

```
Year: 2025
Condition: Unused
Fuel Type: Diesel
Capacity: 3 Ton
Mast Height: 4.5m
Axle Type: Dual Wheel
[Specifications otherwise same format as HH30Z example above]
```

---

### 4.3 Observations — Forklift

- The most important specs — in order — are: **capacity (kg or ton), fuel type, hours, mast type, lift height**
- "2 Stage Mast" vs "3 Stage Mast" vs "Container Mast" vs "High Reach" are distinct mast designations — do not conflate
- "Full Free Lift" is a specific feature (inner mast rises before outer mast) — important for low-ceiling applications, called out explicitly on Ritchie Bros
- **Resting mast height** is listed separately from lift height — this determines whether the forklift fits through a doorway/container
- Hours are "Hours (Showing)" — Grays acknowledges the meter reading, not a verified total
- **Damage field** on Grays is standard: "Marks, scratches, Dents & Surface Rust" is the most common language for used forklifts
- Unused forklifts include shipping dimensions and a service kit — these are often imported Chinese-branded units (HH, CPC series)
- Slattery Auctions has a dedicated forklift category (slatteryauctions.com.au/categories/forklifts) with national network reach
- Electric forklifts: always state voltage (24V/48V/80V) and whether charger is included

---

## 5. Trailer Subtypes — Drop Deck, Flat Top, Dog Trailer, Low Loader

### 5.1 Format Conventions

Australian auction trailer listings (Grays, Pickles, Slattery) use a structured format similar to truck listings:

**Semi-trailer (flat top, drop deck, low loader) format:**
```
[Year] [Make] [Model] [Type] Trailer

Make: [Brand e.g. Maxitrans / Haulmark / Brentwood / O'Phee / Freighter / Pacific]
Model: [Model]
Year: [YYYY]
Type: [Flat Top / Drop Deck / Step Deck / Low Loader / Dog Trailer]
Length: [Xm / Xft]
Width: [X.Xm]
Axles: [Tandem / Triaxle / Bogie] — number and type
Suspension: [Air / Spring / Hendrickson]
Brakes: [Air / Electric / Hydraulic]
Deck Material: [Steel / Aluminium]
Ramps: [Yes/No — type e.g. "Electric ramps / Fold-down steel ramps"]
King Pin: [Standard / 50mm / 90mm]
Tare Weight: [X,XXXkg]
ATM/GVM: [XX,XXXkg]
Payload: [XX,XXXkg]
Tyres: [size and condition e.g. "Goodyear 11R22.5 — 60% tread"]
Rego: [Rego] — [State] — Expiry [Date] OR Sold Unregistered
VIN: [...]

Condition: [e.g. "Used. Deck shows general wear. Ramps serviceable. Lights functional.
No obvious structural damage. Sold as is."]

All assets sold As Is – Where Is.
```

**Ritchie Bros Australia** uses an abbreviated inline format for trailers in auction brochures:
```
FLAT TOP TRAILERS:
Freighter 13.5 Tri/A • Fruehauf 12.5m Bogie/A •
2x 2008 Haulmark 14.7m Tri/A Extendable

STEP DECK / DROP DECK TRAILERS:
Freighter 13.5m Tri/A • 2012 O'Phee Bogie/A •
Unused 2014 Pacific Trailers 13.5m Tri/A Hydraulic Deck Widening
```
(Bullet separator between items; "Tri/A" = Tri-axle; "Bogie/A" = Bogie axle)

**Small flat trailer (light, non-semi) format — Grays:**
```
Deck Size: [X,XXXmm x X,XXXmm]
Tare Weight: [X,XXXkg]
ATM: [X,XXXkg]
Chassis: All galvanised / [Material] [dimensions e.g. "150x50x3.75 RHS"]
Axles: [X axles, 60mm]
Suspension: [Heavy Duty roller rocker / leaf spring]
Brakes: [4x 12-inch electric brake]
Hitch: [70mm]
Tyres: [4x R15]
Lights: [LED]
Jockey Wheel: Yes
Hand Brake: Yes

All assets sold As Is – Where Is.
```

---

### 5.2 Example Descriptions

**Example 1 — Grays Australia: 1999 Maxitrans ST3 Triaxle Drop Deck Flat Top Trailer (Lot 0003-7053824)**

```
Make: Maxitrans
Model: ST3
Year: 1999
Type: Triaxle Drop Deck Flat Top
Axles: Triaxle

[Full specs including deck length, tare, ATM, VIN on listing page]

Condition: Used — general wear consistent with age.
All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply.
```

---

**Example 2 — Grays Australia: 1989 Haulmark DT2A Flat Top Dog Trailer (Lot 0002-5053190)**

```
Make: Haulmark
Model: DT2A
Year: 1989
Type: Flat Top Dog Trailer
Axles: Triaxle
Ramps: Electric fold-down ramps included

[Full specs on listing page]

Condition: Used.
All assets sold As Is – Where Is.
```

---

**Example 3 — Grays Australia: Brentwood Drop Deck Trailer (Lot 0013-5061527)**

```
Make: Brentwood
Type: Drop Deck
Location: 20A Enterprise Court, McDougalls Hill (Singleton), NSW

[Full specs on listing page]

Condition: Used.
All assets sold As Is – Where Is.
```

---

**Example 4 — Grays Australia: Ex-Boat Transport Tri Axle Low Loader Trailer (Lot 0001-3022951)**

```
Type: Low Loader — Tri Axle
Former use: Boat transport

[Full specs on listing page]

Condition: Used.
All assets sold As Is – Where Is.
```

---

**Example 5 — Ritchie Bros Australia: Auction Brochure Flat Top / Step Deck Listings**

```
FLAT TOP TRAILERS
Freighter 13.5 Tri/A • Fruehauf 12.5m Bogie/A •
2x 2008 Haulmark 14.7m Tri/A Extendable

STEP DECK / DROP DECK TRAILERS
Freighter 13.5m Tri/A • 2012 O'Phee Bogie/A •
Unused — 2014 Pacific Trailers 13.5m Tri/A Hydraulic Deck Widening
```

---

**Example 6 — Grays Australia: 1983 Haulmark Flat Top Dog Trailer (TractorHouse-indexed)**

```
Make: Haulmark
Year: 1983
Type: Flat Top Dog Trailer
Deck: 6,650mm deck space
Overall Length: 7,950mm
Axles: Hendrickson Drum Brake Axles
Suspension: Airbag
```

---

**Example 7 — Generic Australian Flat Trailer (Grays small trailer format)**

```
Deck Size: 5,800mm x 2,280mm
Tare Weight: 1,330kg
ATM: 4,480kg
Chassis: All galvanised, 150x50x3.75 RHS
Axles: 60mm axle
Suspension: Heavy Duty roller rocker
Brakes: 4x 12-inch electric brake
Hitch: 70mm
Tyres: 4x R15
Lights: LED clearance lights
Jockey Wheel: Yes
Hand Brake: Yes
```

---

### 5.3 Observations — Trailers

- **Trailer type** must be stated unambiguously at the start: "Flat Top", "Drop Deck", "Low Loader", "Dog Trailer", "B-Train", "Step Deck"
- **Australian terminology note:** "Drop deck" and "step deck" are used interchangeably; "dog trailer" specifically refers to a drawbar-coupled rear trailer used in road train configurations — it is NOT the same as a semi-trailer
- **Deck length** is the primary dimension; deck width secondary
- Axle configuration is critical: Tandem (2 axles), Triaxle (3 axles), Bogie axle, or Hendrickson-type — always state count AND type
- **Tare weight** and **ATM/GVM/Payload** are standard fields — Australian buyers need these for compliance
- **Ramps** (electric vs manual, fold-down vs swing) are a key feature on drop decks and low loaders
- Rego status is critical — many trailers are sold unregistered with plates removed
- VIN/chassis plate details are included for provenance
- **King pin size** (50mm vs 90mm) matters for semi-trailer coupling — should be stated
- Ritchie Bros uses shorthand notation "Tri/A" and "Bogie/A" in catalogue format; individual listing pages would have full specs
- Slattery Auctions and Pickles use the same structured format as Grays for individual lot pages

---

## 6. Cross-Category Patterns for Prompt Engineering

### Standard Field Order

All Australian auction houses follow a consistent ordering pattern:

1. **Headline** — Year + Make + Model + Type (e.g. "2018 Toyota 32-8FG25 LPG Counterbalance Forklift")
2. **Core identity specs** — serial/VIN/HIN, year, hours/odometer
3. **Performance specs** — capacity, power, lift height / boom width / deck length
4. **Features & equipment** — in bullet list or dot-separated format
5. **Condition** — either a structured "Damage:" field or a 2–3 sentence narrative
6. **Registration/compliance** — explicit statement of rego status and expiry or "Sold Unregistered"
7. **Location** — always stated
8. **Closing terms** — "Sold As Is, Where Is" or "Sold As Is, Untested & Unregistered"

### Condition Language Conventions

| Source | Condition Language Pattern |
|--------|---------------------------|
| Grays Australia | `Damage: Marks, scratches, Dents & Surface Rust` (factual, comma-separated) |
| Pickles Auctions | "Sold As Is, Untested & Unregistered" (closing line) |
| Slattery Auctions | "Sold As Is, Untested & Unregistered" (closing line) |
| Ritchie Bros | "Sold As Is, Where Is" (no individual condition notes — buyer inspects) |
| AuctionsPlus | 2–4 sentence narrative beginning with "Presents in good/working/excellent order" |
| Farm Clearing Sales | Longer narrative — maintenance history, shedding history, any recent repairs |

### Registration / Unregistered Language

- **Registered:** "REGO: [XX0000] — [State] — Expires: [DD/MM/YYYY]"
- **Unregistered vehicle:** "Sold Unregistered and Without Plates"
- **Trailer unregistered:** "Sold Unregistered and Without Plates. Trailer VIN: [...]"
- **Marine unregistered:** "HIN: [HIN] — Sold Unregistered"

### Category-Specific Closing Lines

| Category | Typical Closing |
|----------|----------------|
| Marine (all) | "All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply." |
| Caravan/Motorhome | "ALL ASSETS IN THIS SALE ARE SOLD 'AS IS' WITHOUT WARRANTY AND COOLING OFF PERIOD." |
| Agriculture | "Sold As Is, Where Is." |
| Forklift | "All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply." |
| Trailer | "All assets sold As Is – Where Is. No statutory warranty or cooling off periods apply." |

---

## 7. Recommended Few-Shot Examples for AI Prompt

Based on this research, the following skeleton descriptions capture the exact format conventions for each new category. These should be used as few-shot examples in the AI description prompt.

### Marine — Jet Ski

```
2021 Sea-Doo RXT-X 300 Supercharged Personal Watercraft

HIN: VT772
Registration: Sold Unregistered
Vessel Class: Recreational — Sit Down
Seats: 3
Engine Make: Rotax
Fuel Type: Petrol
Engine Hours: Approx 120 hrs showing

Trailer Make: Mayfair Marine
Trailer VIN: [VIN]
Trailer Registration: Sold Unregistered and Without Plates
Winch: Yes | Lights: Yes

Condition: Used. Minor hull scratches consistent with normal use. Seat upholstery in good condition.

Sold As Is, Untested & Unregistered.
```

### Marine — Aluminium Boat + Outboard

```
2019 Quintrex 420 Renegade Aluminium Fishing Boat

HIN: QUT12345B919
Registration: Sold Unregistered
Hull Type: Aluminium
Vessel Class: Recreational — Open
Length: 4.2m approx
Beam: 1.8m approx
Vessel Capacity: 3 persons

Engine Make: Yamaha F60
Engine Type: Outboard
Horse Power: 60hp
Fuel Type: Petrol (4-stroke)
Engine Serial No: [SN]
Engine Hours: 210 hrs approx
Engine Turns Over: Yes

Trailer Make: Dunbier
Year Built: 2019
Sold Unregistered and Without Plates
Trailer VIN: [VIN]
Winch: Yes | Lights: Yes | Spare Tyre: Yes

General Equipment: Bimini top, bilge pump, anchor, navigation lights

Condition: Used. Minor hull scuff marks. Carpet shows wear. Engine turns over — not run under load at time of listing.

Sold As Is, Untested & Unregistered.
```

### Caravan

```
2022 Jayco Silverline 21.65-3 Caravan

Year of Manufacture: 2022
Length: 21ft / 6.4m
Berths: 3
Registration: Sold Unregistered

Features:
Reverse Cycle Air Conditioning · 3-Burner Cooktop · Microwave · Convection Oven ·
Chest of Drawers · Ensuite — Separate Toilet & Shower · Cassette Toilet ·
Truma Instant Hot Water · Power Awning · 240V Power Inlet ·
2x 150W Solar Panels (300W total) · 2x 100Ah AGM Batteries · 30A MPPT Controller ·
Fresh Water (100L) · Grey Water · Stabiliser Legs · Spare Wheel ·
Jockey Wheel · Roll-Out Awning · Fly Screen Door · LED Strip Lighting

Chassis: Aluminium frame, independent coil spring suspension
ATM: 3,200kg

Condition: Used. Minor stone chips to front panel. Awning fabric in good condition. All appliances operational at time of inspection.

Sold As Is, Untested & Unregistered.
```

### Motorhome

```
2006 Winnebago Esperance 23ft Motorhome

Make: Winnebago
Base Vehicle: Mercedes Sprinter 316CDi
Engine: 2.7L Turbo Diesel
Transmission: 5-Speed Manual
Drive: Rear Wheel Drive
Odometer: 142,500 kms
Body Length: 23ft / 7.0m
Sleeping Capacity: 4 (fixed queen + dinette conversion)
Registration: NSW — Sold Unregistered

Features:
Reverse Cycle A/C · 3-Burner Gas Cooktop · Microwave · Refrigerator ·
Cassette Toilet · Shower · Truma Hot Water System · Roof Vent/Fan ·
Shore Power Inlet (240V) · 2x 100Ah AGM Batteries · 120W Solar ·
LED Lighting · Privacy Blinds · TV Antenna · External Storage Compartments ·
Rear Bumper Towbar

Key: Yes | Spare Key: No | Engine Turns Over: Yes | Owners Manual: Yes

Condition: Used. Bodywork presents well for age. Interior shows general wear. A/C recently regassed. Tyres have approx 60% tread remaining.

ALL ASSETS SOLD AS IS WITHOUT WARRANTY. No cooling off period applies.
```

### Agriculture — Spray Rig

```
2018 John Deere R4045 Self-Propelled Boom Sprayer

Serial No: [SN]
Engine Hours: 3,210 hrs showing
Engine: John Deere PowerTech — Diesel
Transmission: Hydrostatic
Tank Capacity: 4,164L (polyethylene)
Boom Width: 36m (120ft)
Nozzle Spacing: 50cm
Boom Folding: Hydraulic — 5-section control
Section Control: Boom Trac Pro
GPS: John Deere StarFire 3000
AutoTrac: Yes
Tyres: Front — 380/90R46, Rear — 320/85R24 (approx 50% tread)

Condition: Presents in good working order. Boom structure sound with minor cosmetic wear. Section control fully functional. Engine serviced at 3,000 hrs. Always shedded when not in use.

Sold As Is, Where Is.
```

### Agriculture — Header/Combine Harvester

```
2012 Case IH 7010 Axial-Flow Combine Harvester + 30ft Case IH 2162 Draper Front

Serial No: [SN]
Engine Hours: 2,453 hrs showing
Separator Hours: 1,987 hrs showing
Engine: Case IH — Turbocharged Diesel
Grain Tank: 10,600L
Unload Rate: 113L/sec
Header Front: 30ft Case IH 2162 Draper — included
Straw Chopper: Yes
Chaff Spreader: Yes
Yield Monitor: AFS Pro 600
AutoGuidance: AccuGuide — RTK
Tyres: Drive — 800/70R38 (approx 40% tread), Steer — 580/70R38

Condition: Used. 2,453 engine hours / 1,987 separator hours showing. Draper bearings replaced at 2,000 separator hours. Belt shows wear — inspect before bidding. Feeder house chain serviceable. Always shedded. Consult photos for full condition assessment.

Sold As Is, Where Is.
```

### Agriculture — Air Seeder

```
2015 John Deere 1830 44ft Air Seeder Bar + John Deere 1910 380 Bushel Air Cart

Bar Make: John Deere
Bar Model: 1830
Bar Width: 44ft (13.4m)
Row Spacing: 190mm (7.5 inch)
Tynes: 56 tynes — knife points
Seeding System: Single shoot with paired row
Cart Make: John Deere
Cart Model: 1910
Cart Capacity: 380 bu / approx 13,400L (3-compartment)
Fan Drive: Hydraulic

Condition: Presents in good working order. Bar frame sound with no visible cracking. Tyne points at approximately 60% wear. Cart scales functional. Hydraulic fan drive recently serviced. Always shedded.

Sold As Is, Where Is.
```

### Agriculture — Baler

```
2014 New Holland BB9080 Large Square Baler

Serial No: [SN]
Bale Size: 1.20m x 0.90m x variable length
Bales Completed: approx 42,000 bales
Pickup Width: 2.2m
Drive: PTO
Twine System: 6-needle double knotters
Net Wrap: Not fitted (twine only)
Crop Processor: Optional — not fitted

Condition: Used. Approx 42,000 bales. Knotters serviced at last seasonal service. All rollers and bearings in good working order. Pickup tines serviceable. Minor paint wear on bodywork. Machine has been shedded throughout ownership.

Sold As Is, Where Is.
```

### Forklift — LPG Counterbalance

```
2016 Toyota 8FG25 LPG Counterbalance Forklift

Serial No: 8FG25-12345
Hours (Showing): 4,820 hrs
Fuel Type: LPG
Capacity: 2,500kg
Mast Type: 2 Stage Mast
Lift Height: 4,000mm
Resting Mast Height: 2,500mm
Tyne Length: 1,050mm
Features: Side Shift, Seat Belt, Overhead Guard, Flashing Beacon
Tyres: Solid rubber — serviceable

Service History: Log book serviced to 4,500 hrs.
Damage: Used marks, scratches, minor dents. Surface rust on mast channels.

Sold As Is, Untested & Unregistered.
```

### Forklift — Electric Reach Truck

```
2018 Crown RR5715-35 Reach Truck

Serial No: [SN]
Hours (Showing): 6,340 hrs
Fuel Type: Electric — 48V
Capacity: 1,600kg
Mast Type: 3 Stage Full Free Lift
Lift Height: 7,200mm
Resting Mast Height: 2,100mm
Tyne Length: 1,150mm
Features: Side Shift, Reach Mechanism, Operator Presence Sensing
Battery: 48V — condition assessed as fair, hold charge
Battery Charger: Included

Damage: Used marks, scratches, minor bodywork dents. Overhead guard intact.

Sold As Is, Untested & Unregistered.
```

### Trailer — Flat Top Semi-Trailer

```
2008 Haulmark 14.6m Triaxle Flat Top Semi-Trailer

Make: Haulmark
Year: 2008
Type: Flat Top Semi-Trailer
Deck Length: 14.6m
Deck Width: 2.45m
Axles: Triaxle — air suspension
Brakes: Air brake — S-cam
Deck Material: Steel
King Pin: 50mm
Tare Weight: approx 7,500kg
ATM: 39,000kg
Tyres: 11R22.5 — mixed tread (40–70%)
Registration: NSW Plate XX-0000 — Expired. Sold Unregistered.
VIN: [VIN]

Condition: Used. Deck shows general wear, surface rust in places. No obvious cracking or structural damage sighted. Lights functional. Brakes not tested. Sold as is — buyer responsible for weighbridge and rego costs.

Sold As Is, Untested & Unregistered.
```

### Trailer — Drop Deck / Step Deck

```
2005 Maxitrans ST3 13.5m Triaxle Drop Deck Semi-Trailer

Make: Maxitrans
Year: 2005
Type: Drop Deck (Step Deck)
Upper Deck Length: 3.0m
Lower Deck Length: 9.8m
Total Deck Length: 12.8m
Deck Width: 2.45m
Axles: Triaxle — air ride suspension
Brakes: Air brake
Deck Material: Steel — non-slip plate
Tare Weight: approx 8,200kg
ATM: 39,000kg
Ramps: Fold-down steel ramps at rear
Headboard: Full height steel
King Pin: 50mm
Tyres: 11R22.5 — approx 50% average tread
Registration: QLD — Sold Unregistered
VIN: [VIN]

Condition: Used. Upper and lower decks show general wear and surface rust. Ramps operational. Lights and brake connections functional. No cracking observed on mainframe rails.

Sold As Is, Untested & Unregistered.
```

### Trailer — Dog Trailer

```
2007 Freighter 12.5m Triaxle Dog Trailer (Flat Top)

Make: Freighter
Year: 2007
Type: Flat Top Dog Trailer
Configuration: Road train rear trailer — drawbar coupling
Deck Length: 12.5m
Deck Width: 2.44m
Axles: Triaxle — air suspension
Brakes: Air brake — drum
Deck Material: Steel checker plate
Tare Weight: approx 7,000kg
GCM Rating: Suitable for B-double/road train configuration
Drawbar: Pintle hook coupling — 50mm
Tyres: 11R22.5 — serviceable
Registration: SA — Sold Unregistered
VIN: [VIN]

Condition: Used. Deck surface rust present. Drawbar and coupling in serviceable condition. Inspect undercarriage bearings prior to purchase.

Sold As Is, Untested & Unregistered.
```

### Trailer — Low Loader

```
2010 Maxitrans GT Triaxle Low Loader / Float Trailer

Make: Maxitrans
Model: GT Low Loader
Year: 2010
Type: Low Loader (Float)
Deck Length: 12.8m (main deck)
Gooseneck: Fixed
Deck Width: 2.5m
Axles: Triaxle — hydraulic suspension
Brakes: Air brake
Deck Height: approx 800mm from ground
Tare Weight: approx 11,000kg
ATM: 45,000kg
Ramps: Hydraulic fold-down ramps (rear)
Headboard: Low profile
Tyres: 315/80R22.5 — approx 60% average tread
Rego: VIC — Sold Unregistered
VIN: [VIN]

Condition: Used. Hydraulic ramp system functional. Deck shows wear and surface rust consistent with heavy equipment transport. Tyres serviceable. No structural cracks observed on gooseneck or maindeck rails.

Sold As Is, Untested & Unregistered.
```

---

## 8. Sources Consulted

- Grays Australia (grays.com.au) — individual lot listings for boats, jet skis, forklifts, caravans, motorhomes, trailers
- Pickles Auctions (pickles.com.au) — category pages and auction campaign pages for marine, caravans, trailers, agricultural
- Lloyds Auctions (lloydsauctions.com.au) — category pages and blog/insider content for marine, caravans
- Ritchie Bros (rbauction.com / rbauction.com.au) — Australian national auction pages, brochure content, forklift and trailer listings
- AuctionsPlus (auctionsplus.com.au) — agricultural machinery auction lots for seeders, headers, balers
- Farm Clearing Sales (farmclearingsales.com.au) — agricultural description format reference
- Farm Tender (farmtender.com.au) — spray rig and seeder description format reference
- Slattery Auctions (slatteryauctions.com.au) — category pages for forklifts and trailers
- Supporting: TractorHouse Australia, TruckWorld Australia, BoatSales Australia — for format cross-reference

_Note: WebFetch tool was unavailable during this research session. All data was extracted from WebSearch result snippets, structured search result summaries, and indexed page content. Verbatim descriptions are drawn from search snippet text where the description was directly returned by the search engine. Some skeleton examples above synthesise confirmed format patterns into representative examples where verbatim text was not indexable._
