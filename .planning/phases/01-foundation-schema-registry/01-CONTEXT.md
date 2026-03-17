# Phase 1: Foundation + Schema Registry - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the Next.js web app, configure Supabase (auth, DB schema, Storage), establish the Schema Registry as the single source of truth for all 7 asset types, and build the basic app shell (login page, post-login landing, new asset entry point with branch + type selection). Everything downstream — AI extraction, review form, output templates — depends on this phase being correct.

</domain>

<decisions>
## Implementation Decisions

### App Shell
- Clean & functional visual style — white/light background, clear typography, no decoration; readable in bright outdoor/on-site light
- Login page: Slattery logo + email/password form + sign in button (minimal branded)
- Post-login landing: Asset list with a prominent "New Asset" button on the same screen — staff landing on the list is most useful for mid-day return sessions; the FAB/button gives instant access to new capture
- Mobile layout: portrait/vertical orientation optimised, iOS-style feel, bottom tab bar or equivalent — staff use phones in portrait on-site exclusively

### New Asset Entry Flow
The entry flow when tapping "New Asset":
1. **Branch selection** — Which branch is booking this asset (remembered from last used, can change)
2. **Asset type selection** — Grid of cards (icon + label), Salesforce-familiar layout
3. **Asset subtype selection** — Every type has a subtype (e.g. Earthmoving → Excavator / Dozer / Grader; Motor Vehicle → Sedan / SUV / Ute). Two-step pick: type → subtype
4. Then proceeds to photo capture (Phase 2)

### Branches
Fixed list, hardcoded in v1 (no admin UI needed). Branches:
- Brisbane (QLD)
- Roma (QLD)
- Mackay (QLD)
- Newcastle (NSW)
- Sydney (NSW)
- Canberra (ACT)
- Melbourne (VIC)
- Perth (WA)
- Adelaide (SA)
- Karratha (WA)

Branch is stored on the asset record for attribution/filtering — tracks which state team/branch is selling the asset. Last-used branch is remembered per session.

### Asset Types (v1 — 7 types, same as original scope)
- Truck
- Trailer
- Earthmoving
- Agriculture
- Forklift
- Caravan/Motor Home
- General Goods

Extended types (Mining, Motor Vehicles, Crane, Marine, etc.) deferred to v2.

### Asset Subtypes
Every asset type has subtypes — the type + subtype pair drives the Salesforce field schema and description template. Examples:
- Earthmoving: Excavator, Dozer, Grader, Wheel Loader, Skid Steer/CTL, Backhoe, Telehandler
- Caravan/Motor Home: Caravan, Motor Home, Camper Trailer
- Truck: Prime Mover, Rigid Truck, Tipper, Service Truck, Crane Truck
- Trailer: Flat Top, Drop Deck, Side Tipper, Dog Trailer, B-Double, Semi-Trailer
- Agriculture: Tractor, Header/Combine, Sprayer, Planter, Baler, Cultivation
- Forklift: Counterbalance, Reach Truck, Order Picker, Telehandler (Forklift type)
- General Goods: General (single subtype — description field only)

**Note:** Planner should draft the full subtype list from the reference project and Slattery context. Jack will confirm/correct during Phase 5 when output accuracy is validated.

### Schema Registry Fidelity
- Build from PROJECT.md field schemas as the starting point
- Field schemas are approximately correct but may have gaps or errors in some types — not confirmed against live Salesforce
- A field-correction pass is deferred to Phase 5 (Output Generation) when copy-paste accuracy against Salesforce can be tested directly
- Schema Registry should be built to be easily correctable — field label and ordering changes should require editing one file only

### Claude's Discretion
- Exact subtype lists per type (draft from reference project, Jack confirms in Phase 5)
- Bottom tab bar vs FAB pattern for mobile nav (iOS-style, portrait-optimised)
- Loading skeleton designs
- Error state handling (auth errors, network failures)
- Exact DB column types beyond what's specified in plans

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Full project context, Salesforce field schemas per asset type, constraints (server-only AI keys, ISO 27001, private Storage, deterministic descriptions)
- `.planning/REQUIREMENTS.md` — v1 requirements; AUTH-01, AUTH-02, ASSET-01, ASSET-02 are Phase 1 scope

### Research
- `.planning/research/STACK.md` — Recommended stack: Next.js 15, @supabase/ssr, shadcn/ui, Tailwind; critical version notes (don't use deprecated auth-helpers)
- `.planning/research/ARCHITECTURE.md` — App Router patterns, Schema Registry as static TypeScript, two Supabase client patterns (BrowserClient vs ServerClient), project folder structure
- `.planning/research/PITFALLS.md` — server-only import pattern, RLS from day one, private Storage bucket, @supabase/ssr vs deprecated package

No external specs — requirements fully captured in decisions above and PROJECT.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project

### Established Patterns
- None yet — Phase 1 establishes all patterns

### Integration Points
- This phase creates the foundation all future phases build on:
  - Auth middleware → every subsequent page is protected
  - Schema Registry (`lib/schema-registry/`) → Phase 3 AI extraction prompt, Phase 4 review form, Phase 5 output formatter
  - DB schema (assets, asset_photos tables) → every subsequent phase reads/writes to these
  - Supabase client wrappers (server + browser) → Phase 2 Storage upload, Phase 3 Route Handler

</code_context>

<specifics>
## Specific Ideas

- Type selector grid should feel familiar to Slattery staff who use Salesforce — not a radical departure from what they know
- App should work well in portrait/vertical orientation on phone — all on-site capture is done in portrait
- iOS-style feel for mobile — staff are likely iPhone users

</specifics>

<deferred>
## Deferred Ideas

- Extended asset types (Mining, Motor Vehicles, Crane, Marine, Portable Buildings, Bus, Rail, Aviation) — deferred to v2
- Admin UI for managing branches — hardcoded list sufficient for v1
- Full subtype list confirmation — Jack to confirm/correct during Phase 5 when Salesforce output is tested directly
- Field schema corrections — defer to Phase 5; catch errors when copy-paste accuracy is tested against live Salesforce

</deferred>

---

*Phase: 01-foundation-schema-registry*
*Context gathered: 2026-03-17*
