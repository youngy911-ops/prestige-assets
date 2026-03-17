# Prestige Assets — Slattery Auctions Book-In App (Web MVP)

## What This Is

An internal web tool for Slattery Auctions Brisbane that automates the asset book-in process. Staff upload photos of build plates and asset identifiers; AI extracts key data (VIN/PIN/Serial, make, model, year) and pre-fills the correct Salesforce field schema for that asset type. The app then generates copy-paste-ready Salesforce output (structured fields block + formatted description) — eliminating the manual research and data entry process currently done by hand.

This is a clean-slate, web-only rebuild of the `asset_sales_force` project — no iOS/Expo scaffold, no monorepo overhead. The scope is deliberately narrow: get the core workflow (photo → AI extract → Salesforce output) working cleanly before adding enrichment or management features.

## Core Value

Photo a build plate → AI extracts identifiers → app generates copy-paste-ready Salesforce fields and a correctly formatted description — turning an hour of manual research into minutes.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can create a new asset record and upload photos via web file picker (phone camera roll on mobile browser, file system on desktop)
- [ ] Photos are resized client-side to max 2MP before upload and stored in Supabase Storage
- [ ] User can drag-to-reorder photos with cover photo designation; order persists after refresh
- [ ] User can select asset type (Truck, Trailer, Earthmoving, Agriculture, Forklift, Caravan, General Goods)
- [ ] App extracts VIN/PIN/Serial, make, model, and year from build plate photos using AI vision with structured output
- [ ] User must review and confirm all AI-extracted data before the record is saved (no auto-save path)
- [ ] App displays and captures data using the correct Salesforce field schema for the selected asset type
- [ ] App generates a copy-paste-ready structured fields block with fields in correct Salesforce order and labels
- [ ] App generates a correctly formatted description block per asset type (correct line ordering, no dot points, no marketing language, "Sold As Is, Untested & Unregistered." footer)
- [ ] For Caravan/Motor Home assets, app generates a Glass's Valuation block (Max Offer, Est. Trade, RRP, Est. Retail) as a third copyable section
- [ ] User can log in and stay logged in across sessions (Supabase auth)

### Out of Scope

- iOS / native app — web browser covers on-site and desktop needs; native deferred to v2
- Multi-role auth (valuer / admin / management) — single authenticated user for MVP; add roles post-validation
- PPSR lock — VIN/PIN editable without restriction in MVP; add hard lock once workflow is validated
- QLD rego lookup — auto-populate from rego number deferred to v2
- Spec research pipeline — RitchieSpecs / manufacturer auto-fill deferred to v2
- Auction comp pricing — IronPlanet, Pickles, Grays, Mascus price surfacing deferred to v2
- Vendor / consignor records — consignor management deferred to v2
- Auction management — sale event creation, lot ordering deferred to v2
- Salesforce API integration — copy-paste only for v1; API push blocked on IT approval
- PPSR lookup within the app — Jack runs PPSR separately; app stores result only (v2)

## Context

- **Business**: Slattery Auctions Brisbane — ISO 27001 certified. Family run. 131-153 Main Beach Rd, Pinkenba QLD 4008.
- **Asset categories (v1)**: Trucks, Trailers, Earthmoving, Forklifts, Agriculture, Caravans/Motor Homes, General Goods.
- **Prior project**: `asset_sales_force` — same concept but built as a Next.js + Expo monorepo. Got bogged down in iOS scaffolding before the core workflow was proven. This project starts fresh with a single Next.js web app and no mobile-specific overhead.
- **Current workflow**: Jack photographs assets on-site, pastes a briefing doc into a Claude chat, gets structured output, copy-pastes to Salesforce. This app replaces that workflow with a persistent, team-usable tool.
- **Platform**: Web app — phone browser for on-site capture (file picker from camera roll), desktop browser for review and copy-paste.
- **MVP goal**: Prove the core workflow (photo → AI → Salesforce output) before adding enrichment features or presenting to management.
- **Description formatting**: Strict per-type rules — no dot points, no marketing language, specific field ordering per asset subtype (Excavator vs Dozer vs Truck vs Trailer etc.), "Sold As Is, Untested & Unregistered." footer always.
- **Salesforce field schemas**: Asset-type specific (Truck ~35 fields, Earthmoving 2 pages, Caravan includes Glass's Valuation section). Exact field names matter for copy-paste.

## Salesforce Field Schemas (per asset type)

- **Truck**: Chassis Number, VIN, Make, Model, Year, Cab Type, Gearbox Make, Drive Type, Engine Manufacturer/Series/Type/Number/Size, Fuel Type, Variant, Compliance Date, Odometer, Registration Number/Expiry, Colour, Body Type, Hourmeter, Tyre Size, Transmission, Rims, Suspension, Axle Configuration, Brakes, GCM, GVM, NW, Service History, Extras
- **Trailer**: Make, Model, VIN, Type, Chassis Number, Colour, Body Type, Compliance Date, Year, Registration, Trailer Length, Hubometer, Height, Rims, Suspension, ATM, Axle Config, Tare, Power, Brakes, Tyre Size, PIN Sizes, Extras
- **Earthmoving (2 pages)**: PIN, Serial, VIN, Type, Make, Hourmeter, Model, Year, Odometer, Engine details, Horsepower, Gross HP, Fuel Type, Emissions Tier, Drive Type, Transmission, Speeds, Torque RPM, Boom Length, Steering, Final Drive, Cabin, Operator Station, Attachments, Config, Screen Size, Tare, Capacity, Rims, PTO, Remotes, Extras
- **Agriculture (2 pages)**: Similar to Earthmoving plus 3 Point Linkage (Front/Rear), Tyres Front/Rear, Ops Manager, PTO, Remotes, Number of Remotes
- **Forklift**: Engine details, VIN, Max Lift Capacity/Height, Make, Hours, Model, Cabin, Year, Attachments, Tilt degrees, Colour, Truck Weight, Transmission, Tyres, Fuel Type, Stages, Type, Mast Type, Serial, Extras
- **Caravan/Motor Home**: Make, Model, Year, Type, VIN, Serial, Transmission, Colour, Engine details, Tyres, Registration, Odometer, Trailer Length, Tare, Height, GVM, Width, ATM, Suspension, Brakes, Compliance Date, Rims, Extras, Owner's Manual, Damage + Glass's Valuation (Max Offer, Est. Trade, RRP, Est. Retail)
- **General Goods**: Description field only

## Constraints

- **Salesforce API**: Not available for MVP — output must be copy-paste ready
- **Platform**: Web app only — phone browser (on-site capture) + desktop browser (review + copy-paste). No native app.
- **ISO 27001**: Slattery is ISO 27001 certified — data handling must be appropriate (client asset data is sensitive)
- **Description format**: Strict per-type formatting rules — no dot points, no marketing language, deterministic templates only (no AI text generation for descriptions)
- **AI keys**: OpenAI/Anthropic API keys must never be in client-side code — all AI calls from server

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web-only, no iOS/Expo | Prior project wasted time on iOS scaffolding before core workflow was validated; web covers both on-site (phone browser) and desktop use cases | — Decided 2026-03-17 |
| Single Next.js app, no monorepo | Monorepo overhead not justified for a single web app; removes complexity that slowed prior project | — Decided 2026-03-17 |
| Drop all enrichment features for v1 | QLD rego, spec research, auction comps, vendor management, auction mgmt all deferred — MVP is the core AI→output flow only | — Decided 2026-03-17 |
| Simple auth only (no roles) | Multi-role auth deferred until workflow is validated and team adoption confirmed | — Decided 2026-03-17 |
| No PPSR lock for v1 | Hard lock adds UI complexity; deferred until after core workflow is proven | — Decided 2026-03-17 |
| Deterministic description templates | No AI text generation for descriptions — templates from Schema Registry control structure; AI only supplies field values | — Decided 2026-03-17 |

---
*Last updated: 2026-03-17 after initialization — clean-slate web-only rebuild, MVP scope*
