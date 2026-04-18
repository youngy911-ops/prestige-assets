# Prestige Assets — Slattery Auctions Book-In App (Web MVP)

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
- ✓ Authenticated user can navigate to the asset list via the Assets tab without being redirected to login — v1.1
- ✓ Truck/Trailer/Forklift/Caravan asset forms show dedicated input fields for type-specific values (VIN, Odometer, Hourmeter, Suspension Type, Unladen Weight, Length ft) before AI extraction — v1.1
- ✓ Staff-entered pre-extraction values flow to AI extraction prompt as authoritative overrides; values appear in Salesforce fields output and are not overridden by AI — v1.1
- ✓ AI-generated descriptions preserve specific values from inspection notes verbatim (e.g. `48" sleeper cab`, `Airbag` suspension) — runtime-verified in production — v1.1
- ✓ Staff can return to an in-progress asset record and find all pre-extraction fields (VIN, odometer, hourmeter, suspension type, unladen weight, length) pre-populated with previously entered values — v1.2
- ✓ All 8 asset types expose Salesforce-matching subtype lists (Truck 24, Trailer 24, Earthmoving 19, Marine 10, Agriculture 12, Forklift 9, Caravan 5, General Goods 16); Agriculture/Forklift/Caravan have subtype selectors for the first time — v1.4
- ✓ AI description prompt has named template sections for every subtype across all 8 asset types; exact-match heading routing replaces inference fallback — v1.4

## Current State: v1.5 Shipped (2026-04-18)

Demo-ready. 8 asset types with full Salesforce alignment, Quick Book with auto type detection, asset deletion and status workflow, contextual error pages, ARIA accessibility, and humanized confidence labels. Salesforce OAuth infrastructure scaffolded and ready when credentials are provided.

**Tech stack (current):** Next.js 15 (App Router), React 19, Supabase, GPT-4o (Vercel AI SDK v6), Zod 4, Tailwind v4, vitest. ~13,487 LOC TypeScript.

### Validated Requirements (v1.5)

- ✓ QR code domain configurable from single brand config — v1.5
- ✓ Company name, logo monogram, and page metadata from single brand config — v1.5
- ✓ Semantic Tailwind color tokens replace all hardcoded hex values — v1.5
- ✓ Contextual error pages with recovery actions — v1.5
- ✓ Edit Type route cleanly removed (no dead links) — v1.5
- ✓ Asset deletion with confirmation from list and detail views — v1.5
- ✓ Asset status badge (draft / reviewed / confirmed) with automatic progression — v1.5
- ✓ LAST_BRANCH_KEY in shared constant, imported by all consumers — v1.5
- ✓ Extraction loading uses Lucide icons — v1.5
- ✓ BottomNav aria-current="page" on active route — v1.5
- ✓ Extraction panel aria-expanded on collapsible section — v1.5
- ✓ Decorative thumbnails marked role="presentation" — v1.5

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
- **Shipped v1.1**: 2026-03-21. ~7,348 LOC TypeScript. Single-day polish — 3 phases, 5 plans, ~3.5 hours.
- **Shipped v1.2**: 2026-03-22. ~7,532 LOC TypeScript. Focused fix — 1 phase, 2 plans, ~16 minutes.
- **Shipped v1.3**: 2026-03-23. ~8,500+ LOC TypeScript. Asset expansion — 4 phases, 9 plans, 2 days. 99 files changed, +8,378 / -4,404 lines.
- **Tech stack**: Next.js 15 (App Router), Supabase (Postgres + Storage + Auth), GPT-4o (Vercel AI SDK v6), react-hook-form + Zod, dnd-kit, Base UI, Tailwind v4, vitest + testing-library.
- **Prior project**: `asset_sales_force` — same concept but built as a Next.js + Expo monorepo. Got bogged down in iOS scaffolding before the core workflow was proven.
- **Current workflow**: App replaces Jack's manual Claude chat workflow with a persistent, team-usable tool.
- **Platform**: Web app — phone browser for on-site capture (file picker from camera roll), desktop browser for review and copy-paste.
- **Description formatting**: Strict per-type rules — no dot points, no marketing language, specific field ordering per asset subtype (Excavator vs Dozer vs Truck vs Trailer etc.), "Sold As Is, Untested & Unregistered." footer always (enforced by `normalizeFooter` post-generation).

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
- **Description format**: Strict per-type formatting rules — no dot points, no marketing language, specific ALL_CAPS template per asset subtype. AI-generated via GPT-4o second call; omits unknown fields rather than using TBC. `normalizeFooter` enforces correct footer post-generation.
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
| Delete src/app/page.tsx entirely (Phase 8) | Conflicting root redirect was causing auth loop; (app) route group page.tsx becomes sole / handler — deletion simpler than replacing | ✓ Good — surgical 1-file fix |
| Suspension Type as `inputType: 'select'` with fixed options (Phase 9) | Constrains AI extraction and UI to a predictable value set; avoids free-text variation like "air bag" vs "airbag" | ✓ Good — cleaner output |
| parseStructuredFields exported from extract/route.ts; imported directly in describe/route.ts (Phase 9–10) | No duplicate parser, no shared lib overhead — direct cross-route import worked without TypeScript errors | ✓ Good — DRY without over-engineering |
| Belt-and-suspenders verbatim constraint: system prompt rule + structured user prompt block (Phase 10) | System prompt rule alone insufficient for GPT-4o fidelity; labelled "Staff-provided values (use verbatim):" block reinforces intent | ✓ Good — runtime-verified |
| Select uncontrolled in InspectionNotesSection (no value/defaultValue) (Phase 9) | Re-hydration deferred to v1.2 (PREFILL-06); uncontrolled avoids state complexity for MVP | ✓ Good — `defaultValue` worked without controlled fallback in v1.2 |
| Shared parsing utility in `src/lib/utils/` (Phase 11) | Client components cannot import from route handlers; shared utility is the correct boundary | ✓ Good — clean Next.js boundary, importable by both server and client |
| `defaultValue` (uncontrolled) for Select restoration (Phase 11) | jsdom tests pass; no controlled `useState` fallback needed — simpler implementation | ✓ Good — no regressions, 245/245 tests passing |
| Unmount flush as `useEffect` cleanup dependent on `[persistNotes]` (Phase 11) | Synchronous on unmount, no Promise — cancels debounce and persists immediately | ✓ Good — correct pattern for uncontrolled fast-navigation safety |
| Subtype arrays as source of truth for both wizard selector and description template routing (Phases 16–17) | Schema key uppercased = prompt heading — exact-match routing eliminates GPT-4o inference fallback per subtype | ✓ Good — confirmed via Phases 18/19 audits |
| Gap closure phases (18, 19) inserted after Phase 17 to fix phantom keys and heading mismatches found by audit | Milestone audit (`/gsd:audit-milestone`) ran before completion and surfaced actionable issues; gap phases closed them before archiving | ✓ Good — audit-first pattern validated again |
| `normalizeFooter` appended to all description outputs post-generation (Phase 14) | Enforces correct footer regardless of GPT-4o output; `general_goods` gets distinct footer | ✓ Good — zero footer regressions since Phase 14 |

---
*Last updated: 2026-04-16 after v1.5 milestone start*
