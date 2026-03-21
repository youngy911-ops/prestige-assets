# Prestige Assets — Slattery Auctions Book-In App (Web MVP)

## Current Milestone: v1.1 Pre-fill & Quality

**Goal:** Add structured pre-extraction input fields for critical per-type data and fix description quality so staff-entered notes are faithfully reflected in AI output.

**Target features:**
- Dedicated pre-extraction fields: Trucks (VIN, Odo, Hours, Suspension), Trailers (VIN, Suspension), Forklifts (Unladen Weight), Caravans (Length ft)
- Description generation uses inspection notes verbatim for specific values
- Asset tab session bug fixed

## What This Is

An internal web tool for Slattery Auctions Brisbane that automates the asset book-in process. Staff upload photos of build plates and asset identifiers; AI extracts key data (VIN/PIN/Serial, make, model, year, weight ratings, hours, and many more schema-specific fields) and pre-fills the correct Salesforce field schema for that asset type. The app then generates copy-paste-ready Salesforce output (structured fields block + GPT-4o formatted description) — eliminating the manual research and data entry process currently done by hand.

This is a clean-slate, web-only rebuild of the `asset_sales_force` project — no iOS/Expo scaffold, no monorepo overhead. The core workflow (photo → AI extract → review → Salesforce output) is now proven and in use. Phase 06.1 significantly improved AI extraction quality with field-specific hints and 25+ newly enabled schema fields.

## Core Value

Photo a build plate → AI extracts identifiers → app generates copy-paste-ready Salesforce fields and a correctly formatted description — turning an hour of manual research into minutes.

## Requirements

### Validated

- ✓ User can log in with email and password and session persists across browser refresh — v1.0
- ✓ User can create a new asset record and select asset type (Truck, Trailer, Earthmoving, Agriculture, Forklift, Caravan/Motor Home, General Goods) — v1.0
- ✓ User can upload photos via web file picker (phone camera roll on mobile browser, file system on desktop) — v1.0
- ✓ Photos are resized client-side to max 2MP with EXIF orientation correction before upload; stored in private Supabase Storage — v1.0
- ✓ User can drag-to-reorder photos with cover photo designation; order persists after refresh — v1.0
- ✓ App extracts Salesforce fields using GPT-4o vision across all uploaded photos with per-field confidence scores; photos-only is a fully supported workflow; optional inspection notes improve accuracy — v1.0
- ✓ AI uses manufacturer knowledge to infer weight ratings and spec fields when make/model/year are identified — v1.0
- ✓ User must review and confirm all AI-extracted data on a dedicated screen before record is saved (no skip path) — v1.0
- ✓ Staff can enter freeform inspection notes (VIN, rego, km, hours, etc.) before triggering extraction — v1.0
- ✓ Missing-information checklist shows blocking fields (VIN, rego) requiring manual entry or explicit override, and dismissible fields; checklist state persisted to Supabase — v1.0
- ✓ App displays and captures data using the correct Salesforce field schema for the selected asset type — v1.0
- ✓ Low-confidence AI-extracted fields are visually highlighted in the review form — v1.0
- ✓ App generates a copy-paste-ready structured fields block in correct Salesforce order with exact field labels — v1.0
- ✓ App generates a correctly formatted description block per asset subtype using GPT-4o with a locked system prompt (no dot points, no marketing language, "Sold As Is, Untested & Unregistered." footer); editable before copy-paste — v1.0
- ✓ Each output section has its own copy-to-clipboard button with visual confirmation — v1.0
- ✓ User can view all asset records sorted by recency — v1.0
- ✓ User can resume editing an asset record from the list — v1.0
- ✓ AI extraction quality: field-specific aiHint annotations embedded in Zod schema, 25+ new fields enabled across earthmoving/agriculture/forklift/trailer, explicit plate-type routing in system prompt — v1.0

### Active

<!-- v1.1: Pre-fill & Quality -->

- [ ] User can enter VIN, Odometer, Hourmeter, and Suspension Type via dedicated input fields for Trucks before running AI extraction
- [ ] User can enter VIN and Suspension Type via dedicated input fields for Trailers before running AI extraction
- [ ] User can enter Unladen Weight via dedicated input field for Forklifts before running AI extraction
- [ ] User can enter Length (in ft) via dedicated input field for Caravans before running AI extraction
- [ ] Inspection notes content is faithfully reflected in the AI-generated description (specific values like "48\" sleeper cab" are preserved verbatim)
- [ ] Clicking the asset list tab no longer redirects to login (session auth bug fixed)

### Out of Scope

- iOS / native app — web browser covers on-site and desktop; Expo overhead not justified until web workflow is validated; PWA path viable
- Auto-save extracted data without review — single wrong VIN destroys a legally significant auction record; mandatory review is non-negotiable
- PPSR lookup within the app — Jack runs PPSR through Salesforce separately; app stores result only (v2)
- Public-facing bidding interface — handled by existing platforms (i-bidder, Bidspotter)
- Automated valuation engine — manual input only; comp pricing provides context but not a calculated value
- Email / notification system — not part of the book-in workflow
- Glass's Valuation block (Caravan) — permanently out of scope; not needed in any version
- Salesforce API push — blocked on IT/Connected App approval; copy-paste only for now

## Context

- **Business**: Slattery Auctions Brisbane — ISO 27001 certified. Family run. 131-153 Main Beach Rd, Pinkenba QLD 4008.
- **Asset categories (v1)**: Trucks, Trailers, Earthmoving, Forklifts, Agriculture, Caravans/Motor Homes, General Goods.
- **Shipped v1.0**: 2026-03-21. ~6,975 LOC TypeScript. 4-day build from blank repo to working tool.
- **Tech stack**: Next.js 15 (App Router), Supabase (Postgres + Storage + Auth), GPT-4o (Vercel AI SDK v6), react-hook-form + Zod, dnd-kit, shadcn/ui, Tailwind v4, vitest + testing-library.
- **Prior project**: `asset_sales_force` — same concept but built as a Next.js + Expo monorepo. Got bogged down in iOS scaffolding before the core workflow was proven.
- **Current workflow**: App replaces Jack's manual Claude chat workflow with a persistent, team-usable tool.
- **Platform**: Web app — phone browser for on-site capture (file picker from camera roll), desktop browser for review and copy-paste.
- **Description formatting**: Strict per-type rules — no dot points, no marketing language, specific field ordering per asset subtype (Excavator vs Dozer vs Truck vs Trailer etc.), "Sold As Is, Untested & Unregistered." footer always.
- **Known open items**: GPT-4o extraction quality with real Slattery photos is empirical (not yet tested in production); exact Earthmoving description subtype field ordering requires Jack's confirmation.

## Salesforce Field Schemas (per asset type)

- **Truck**: Chassis Number, VIN, Make, Model, Year, Cab Type, Gearbox Make, Drive Type, Engine Manufacturer/Series/Type/Number/Size, Fuel Type, Variant, Compliance Date, Odometer, Registration Number/Expiry, Colour, Body Type, Hourmeter, Tyre Size, Transmission, Rims, Suspension, Axle Configuration, Brakes, GCM, GVM, NW, Service History, Extras
- **Trailer**: Make, Model, VIN, Type, Chassis Number, Colour, Body Type, Compliance Date, Year, Registration, Trailer Length, Hubometer, Height, Rims, Suspension, ATM, Axle Config, Tare, Power, Brakes, Tyre Size, PIN Sizes, Extras
- **Earthmoving (2 pages)**: PIN, Serial, VIN, Type, Make, Hourmeter, Model, Year, Odometer, Engine details, Horsepower, Gross HP, Fuel Type, Emissions Tier, Drive Type, Transmission, Speeds, Torque RPM, Boom Length, Steering, Final Drive, Cabin, Operator Station, Attachments, Config, Screen Size, Tare, Capacity, Rims, PTO, Remotes, Extras
- **Agriculture (2 pages)**: Similar to Earthmoving plus 3 Point Linkage (Front/Rear), Tyres Front/Rear, Ops Manager, PTO, Remotes, Number of Remotes
- **Forklift**: Engine details, VIN, Max Lift Capacity/Height, Make, Hours, Model, Cabin, Year, Attachments, Tilt degrees, Colour, Truck Weight, Transmission, Tyres, Fuel Type, Stages, Type, Mast Type, Serial, Extras
- **Caravan/Motor Home**: Make, Model, Year, Type, VIN, Serial, Transmission, Colour, Engine details, Tyres, Registration, Odometer, Trailer Length, Tare, Height, GVM, Width, ATM, Suspension, Brakes, Compliance Date, Rims, Extras, Owner's Manual, Damage + Glass's Valuation (Max Offer, Est. Trade, RRP, Est. Retail)
- **General Goods**: Description field only

## Constraints

- **Salesforce API**: Not available — output must be copy-paste ready
- **Platform**: Web app only — phone browser (on-site capture) + desktop browser (review + copy-paste). No native app.
- **ISO 27001**: Slattery is ISO 27001 certified — data handling must be appropriate (client asset data is sensitive)
- **Description format**: Strict per-type formatting rules — no dot points, no marketing language, specific template per asset subtype. AI-generated via GPT-4o second call; uses TBC for anything unconfirmed.
- **AI keys**: OpenAI API keys must never be in client-side code — all AI calls from server

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web-only, no iOS/Expo | Prior project wasted time on iOS scaffolding before core workflow was validated; web covers both on-site (phone browser) and desktop use cases | ✓ Good — shipped v1.0 in 4 days |
| Single Next.js app, no monorepo | Monorepo overhead not justified for a single web app; removes complexity that slowed prior project | ✓ Good |
| Drop all enrichment features for v1 | QLD rego, spec research, auction comps, vendor management all deferred — MVP is the core AI→output flow only | ✓ Good — core workflow proven |
| Simple auth only (no roles) | Multi-role auth deferred until workflow is validated and team adoption confirmed | — Pending v1.1 evaluation |
| No PPSR lock for v1 | Hard lock adds UI complexity; deferred until after core workflow is proven | — Pending v1.1 evaluation |
| ~~Deterministic description templates~~ → AI-generated descriptions | Original plan was hard-coded string templates; changed 2026-03-19. GPT-4o generates descriptions from photos + confirmed fields using locked system prompt per subtype. | ✓ Good — better output quality |
| generateText + Output.object() for AI SDK v6 | generateObject is deprecated in v6; Output.object() is the correct pattern | ✓ Good |
| /api/extract Route Handler (not Server Action) | Server Actions are queued/sequential, unsuitable for long-running AI calls | ✓ Good |
| aiHint embedded in Zod schema (not prompt engineering) | Field-specific context in schema description is more maintainable and more accurate than generic prompt engineering | ✓ Good — phase 06.1 confirmed improvement |
| getAIExtractableFieldDefs() added alongside getAIExtractableFields() | Avoids breaking existing callers while enabling richer schema access | ✓ Good — backward compatible |

---
*Last updated: 2026-03-21 after v1.1 milestone start*
