# Slattery Auctions — AI Asset Booking System Reference

## Units & Measurements

- Dozer blades, moldboards, boom lengths → ft
- Tipper body dimensions → mm
- Box/van trailer bodies → ft
- Track width → mm
- Tyre sizes → standard tyre format (e.g. 265/75R16)
- Max digging depth → TBD (decision pending first excavator)

---

## Description Rules (Universal)

- No dot points
- No serial numbers in description body
- No hours, odometer or GVM in description body
- No marketing language ("ideal for", "perfect for" etc.)
- Blank line between each significant item or group
- Short related items share a line separated by commas
- No mattress type in caravan descriptions
- Damage goes in Damage field only — never in description
- Date of Manufacture always captured from plate if visible
- Closes with "Sold As Is, Untested & Unregistered." for all registered assets
- Closes with "Sold As Is, Untested." for attachments and general goods only

---

## Description Templates

### Truck (Prime Mover)
```
[Year] [Make] [Model] [Drive Type]
[Engine Make] [Cylinders]-Cylinder [Fuel], [HP]HP
[Transmission], [Key extras: diff locks, exhaust brake, cruise control, UHF etc.]
GCM: [X]kg [B-Double / Road Train] — only for high-rated prime movers
Sold As Is, Untested & Unregistered.
```

### Tipper
```
[Year] [Make] [Model] [Drive Type] Tipper
[Engine Make] [Cylinders]-Cylinder [Fuel], [HP]HP
[Transmission], Diff Locks, Exhaust Brake
[Key extras]
[Body Builder] [L]mm x [W]mm x [H]mm [Material] Tipper Body, [Rock Lined if applicable], [Tarp], [Tailgate], Ringfeder (if confirmed)
Payload: [X]kg
Sold As Is, Untested & Unregistered.
```

### Service Truck
```
[Year] [Make] [Model] [Drive Type] Service Truck
[Engine Make] [Cylinders]-Cylinder [Fuel], [HP]HP
[Transmission], [Key chassis extras]

[Body Builder] Tray Body, [L]mm x [W]mm
[Crane Make] [Model] Knuckleboom Crane, [X]kg Capacity [— Not In Certification if applicable]
[Toolboxes, compressor, inverter, solar, awnings, rack, lights etc.]
Tow Hitch and Airlines at Rear
Sold As Is, Untested & Unregistered.
```

### Trailer
```
[Year] [Make] [Model] [Type]. [Axle config]. [Suspension]. [Brakes].
[Deck length]. [Payload if applicable].
[Extras].
Sold As Is, Untested & Unregistered.
```

### Excavator
```
[Year] [Make] [Model] [Type]
[X]kg Operating Weight
[X] Hours
[Engine Make] [Cylinders]-Cylinder Diesel, [X]HP
Max Digging Depth: [X]
[X]mm [Rubber/Steel] Tracks
[Enclosed Cab / ROPS Canopy], [FOPS, AC if applicable]
[Quick Hitch type if fitted]
Dozer Blade: [X]ft | Boom Length: [X]ft
[X]mm [Make] GP Bucket
Attachments Included: [others]
Sold As Is, Untested & Unregistered.
```

### Dozer
```
[Year] [Make] [Model] [Type]
[X]kg Operating Weight
[X] Hours
[Engine Make] [Cylinders]-Cylinder Diesel, [X]HP
[Enclosed Cab / ROPS Canopy]
[Transmission type]
[X]ft [Blade type]
[X]mm [Track type]
[Ripper type and shanks if fitted]
[GPS Grade Control if fitted]
[Extras]
Sold As Is, Untested & Unregistered.
```

### Grader
```
[Year] [Make] [Model] Motor Grader
[X]kg Operating Weight
[X] Hours
[Engine Make] [Cylinders]-Cylinder Diesel, [X]HP
Enclosed Cab, ROPS, FOPS, Air Conditioned
[Transmission type], [X]-Speed Forward/Reverse
[X]ft Moldboard
[Scarifier / Ripper if fitted]
[GPS Grade Control if fitted]
[Extras: Auto Articulation, Auto Gain etc.]
Sold As Is, Untested & Unregistered.
```

### Wheel Loader
```
[Year] [Make] [Model] Wheel Loader
[X]kg Operating Weight
[X] Hours
[Engine Make] [Cylinders]-Cylinder Diesel, [X]HP
[Enclosed Cab / ROPS]
[Transmission]
[X]m³ Bucket, [X]mm Wide
[Tyre size]
[Extras]
Sold As Is, Untested & Unregistered.
```

### Skid Steer / Compact Track Loader
```
[Year] [Make] [Model] [Type]
[X]kg Operating Weight, [X]kg Rated Operating Capacity
[X] Hours
[Engine Make] [Cylinders]-Cylinder Diesel, [X]HP
[Enclosed Cab / ROPS or Open Operator Station]
[Auxiliary hydraulics]
[X]mm Tracks or Tyre size
[Bucket]
Attachments Included: [if any]
Sold As Is, Untested & Unregistered.
```

### Telehandler
```
[Year] [Make] [Model] Telehandler
[X]kg Max Lift Capacity
[X]m Max Lift Height
[X] Hours
[Engine Make] [Cylinders]-Cylinder Diesel, [X]HP
[Enclosed Cab / ROPS]
[Transmission]
[Tyre size]
Attachments Included: [if any]
Sold As Is, Untested & Unregistered.
```

### Backhoe Loader
```
[Year] [Make] [Model] Backhoe Loader
[X]kg Operating Weight
[X] Hours
[Engine Make] [Cylinders]-Cylinder Diesel, [X]HP
[Enclosed Cab / ROPS]
[4WD / 2WD]
[Loader bucket]
[Backhoe bucket]
[Stabilisers]
[Extras]
Sold As Is, Untested & Unregistered.
```

### Caravan
```
[Year] [Make] [Model] [Type]
[Bed layout]
[Bathroom: shower, toilet, vanity]
[A/C, heating]
[Kitchen: cooking, fridge, sink]
[Laundry if fitted]
[Power: solar, batteries]
[Water: tanks, hot water]
[Exterior: awning, storage, satellite, spare wheels, tow setup]
[Suspension], [Brakes]
ATM: [X]kg (Upgraded — if applicable)
Sold As Is, Untested & Unregistered.
```

### Motor Vehicle (Car)
```
[Year] [Make] [Model] [Trim] [Series] [Transmission] [Drive] [Fuel] [Body] [CC]cc [kW]kW [Speeds]sp [Cyl]cyl [Doors]dr [Seats]seat
[Extras if any]
Sold As Is, Untested & Unregistered.
```

### Marine
```
[Year] [Make] [Model] [Vessel Type]
LOA: [X]ft | Beam: [X]ft | Draft: [X]ft
Hull: [Material]
[Engine Make] [Cylinders]-Cylinder [Fuel], [X]HP (or Twin [X]HP Outboards)
Engine Hours: [X]
[Nav/electronics]
[Berths/cabin layout]
[Galley, heads, water/fuel capacity]
[Extras: solar, generator, winch, thruster, trailer]
Sold As Is, Untested & Unregistered.
```

### Attachments / General Goods
```
[Make] [Model] [Key specs]
[Power/input specs if applicable]
[Included accessories]
Sold As Is, Untested.
```

---

## Salesforce Field Schemas

### Truck
Chassis Number, VIN, Make, Model, Year of Manufacture, Cab Type, Gearbox Make, Drive Type, Make of Sleeper A/C, Engine Manufacturer, Series, Fuel Type, Variant, Compliance Date, Engine Type, Engine Number, Odometer, Engine Size, Registration Number, Colour, Body Type, Hourmeter, Tyre Size, Transmission, Rims, Suspension, Axle Configuration, Brakes, Owner's Manual, Master Key, Spare Key, GCM (kgs), GVM (kgs), Service History, Fuel Card, Extras

### Trailer
Make, Model, VIN, Type, Chassis Number, Colour, Body Type, Compliance Date, Year of Manufacture, Registration Number, Trailer Length Approx, Hubometer, Trailer Height Approx, Rims, Suspension, ATM, Axle Configuration, Tare, Power, Brakes, Tyre Size, Extras

### Earthmoving
**Page 1:** Product Identification Number, Serial Number, VIN, Type, Make, Colour, Hourmeter, Model, Year of Manufacture, Odometer, Engine Number, Engine Make, Number of Cylinders, Engine Model, Horsepower, Engine Type, Gross Horsepower, Fuel Type, Emissions Tier, Drive Type, Top Speed Forward (mph), Transmission Type, Top Speed Reverse (mph), Transmission Speeds, Torque RPM, Boom Length, Steering Type, Compliance Date, Final Drive Type, Cabin, Operator Station

**Page 2:** Belt Size, Attachments, Non Standard Extras, 3 Point Linkage, Sold Quantity, Configuration, Screen Size, Tare, Capacity, Rims, PTO, Remotes, Extras, Suspension, PIN Sizes

### Caravan / Motor Home
Make, Model, Year of Manufacture, Type, VIN, Serial Number, Transmission, Colour, Engine Number, Condition, Engine Type, Tyres, Registration Number, Registration Expiry, Odometer, Trailer Length Approx, Tare, Height, GVM (kgs), Width, ATM, Suspension, Brakes, Compliance Date, Rims, Extras, Pay Load, Owner's Manual, Damage, Damage Notes

### Motor Vehicle
Make, Model, Series, Variant, VIN, Chassis Number, Engine Number, Engine Manufacturer, Engine Size, Engine Type, Fuel Type, Transmission, Drive Type, Body Type, Colour, Year of Manufacture, Compliance Date, Registration Number, Odometer, GVM (kgs), Owner's Manual, Master Key, Spare Key, Service History, Last Service Kms, E Tag, Fuel Card, Accessories, Extras

### Marine
**Page 1:** Make, Model, Sighted, Launch Date, Trailer Length Approx, Beam, Draft

**Page 2:** Year of Manufacture, Depth, Builder, Designer, HIN, Motor Type, Damage, Damage Notes

**Page 3:** Extras, Number of Engines, Port Engine Details, Starboard Engine Details, Port Engine Hours, Starboard Engine Hours, Exhaust System Type, Number of Gensets

**Page 4:** Main Engine Details, Port Genset Details, Engine Hours, Port Genset Hours, Genset Details (Make/Model/S/N), Fuel Tank Capacity, Genset Hours

**Page 5:** Water Tank Capacity, Starboard Genset Details, Steering Type (Primary), Starboard Genset Hours, Steering Type (Secondary), Sullage/Holding Tank Capacity, Winch, Thrusters

**Pages 6 & 7:** Not entered in Salesforce — mine for description selling points only

### General Goods
Make, Model, Serial Number, Date of Manufacture (if on plate), Description field only

---

## Research Hierarchy

1. PPSR (run by Jack via Salesforce) — always overrides VIN plate reading
2. RitchieSpecs — primary specs source for machinery
3. QLD Rego Check — registration lookups
4. Manufacturer sites, PowerTorque, Trade Trucks — for trucks
5. Boatsales, manufacturer sites — for marine
6. CaravanCampingSales, manufacturer sites — for caravans

---

## Key Field Rules

- Registration Expiry — never needed, do not enter
- Engine Number — Jack enters himself, never chase
- Axle Configuration = drive config e.g. 6x4
- Ringfeder — only if confirmed on site
- Suspension and brakes not mentioned in truck descriptions
- Cab type not mentioned in description
- GPS/grade control called out in description when fitted
- Tyre size in Salesforce field only (exception: wheel loaders, telehandlers)
- Hours in Salesforce field only
- Payload and GCM ratings only weight figures allowed in description
