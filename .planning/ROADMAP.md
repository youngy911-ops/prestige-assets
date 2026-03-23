# Roadmap: Prestige Assets — Slattery Auctions Book-In App

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6.1 (shipped 2026-03-21)
- ✅ **v1.1 Pre-fill & Quality** — Phases 8–10 (shipped 2026-03-21)
- ✅ **v1.2 Pre-fill Restoration** — Phase 11 (shipped 2026-03-22)
- 🚧 **v1.3 Asset Expansion** — Phases 12–15 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–6.1) — SHIPPED 2026-03-21</summary>

- [x] Phase 1: Foundation + Schema Registry (3/3 plans) — completed 2026-03-17
- [x] Phase 2: Photo Capture + Storage (3/3 plans) — completed 2026-03-17
- [x] Phase 3: AI Extraction (3/3 plans) — completed 2026-03-18
- [x] Phase 4: Review Form + Save (3/3 plans) — completed 2026-03-19
- [x] Phase 5: Output Generation (3/3 plans) — completed 2026-03-21
- [x] Phase 6: Asset List + Navigation (2/2 plans) — completed 2026-03-21
- [x] Phase 06.1: AI Extraction Quality — INSERTED (4/4 plans) — completed 2026-03-21

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Pre-fill & Quality (Phases 8–10) — SHIPPED 2026-03-21</summary>

- [x] Phase 8: Session Auth Fix (1/1 plans) — completed 2026-03-21
- [x] Phase 9: Pre-Extraction Structured Inputs (2/2 plans) — completed 2026-03-21
- [x] Phase 10: Description Verbatim Fidelity (2/2 plans) — completed 2026-03-21

Full archive: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 Pre-fill Restoration (Phase 11) — SHIPPED 2026-03-22</summary>

- [x] Phase 11: Pre-fill Value Restoration (2/2 plans) — completed 2026-03-22

Full archive: `.planning/milestones/v1.2-ROADMAP.md`

</details>

### 🚧 v1.3 Asset Expansion (In Progress)

**Milestone Goal:** Add Marine asset type, expand truck/trailer/earthmoving/general goods subtypes, fix description quality across all types, and resolve two deferred pre-fill bugs.

- [x] **Phase 12: Marine Asset Type** - Full Marine schema, AI extraction, and description generation for Boat, Yacht, Jet Ski (completed 2026-03-22)
- [x] **Phase 13: Subtype Expansions** - Update truck, trailer, earthmoving, and general goods subtype lists to final v1.3 values (completed 2026-03-22)
- [x] **Phase 14: Description Quality** - Add description templates for all truck subtypes and earthmoving subtypes; enforce footer across all types (completed 2026-03-23)
- [x] **Phase 15: Pre-fill Bug Fixes** - Fix "Other notes" textarea display and unmount-flush data loss (completed 2026-03-23)

## Phase Details

### Phase 12: Marine Asset Type
**Goal**: Users can book in Marine assets with full Salesforce field capture and correctly formatted descriptions
**Depends on**: Phase 11 (existing schema registry pattern)
**Requirements**: MARINE-01, MARINE-02, MARINE-03
**Success Criteria** (what must be TRUE):
  1. User can create a Marine asset and select subtype (Boat, Yacht, Jet Ski)
  2. AI extraction populates marine-specific fields (HIN, LOA, Beam, Draft, Motor Type, Engine Hours, etc.) from photos and inspection notes
  3. Generated description matches the marine subtype format (e.g. Jet Ski: Year Make Model Type / Engine details / Hours / Extras / Trailer if supplied)
  4. Marine Salesforce fields block renders with correct field labels in the correct order
**Plans**: 2 plans

Plans:
- [ ] 12-01-PLAN.md — Create marine schema (25 fields, 3 subtypes), register in ASSET_TYPES + SCHEMA_REGISTRY, update test count assertions
- [ ] 12-02-PLAN.md — Add MARINE inference to buildSystemPrompt, JET SKI template to DESCRIPTION_SYSTEM_PROMPT, Anchor icon to AssetTypeSelector, extend test suite

### Phase 13: Subtype Expansions
**Goal**: All four expanded asset types show correct, complete subtype lists throughout the app
**Depends on**: Phase 12
**Requirements**: TRUCK-01, TRAIL-01, EARTH-01, GOODS-01
**Success Criteria** (what must be TRUE):
  1. Truck type selector shows all 15 subtypes including Other; Rigid Truck and Crane Truck are gone
  2. Trailer type selector shows all 11 updated subtypes
  3. Earthmoving type selector shows all 12 updated subtypes including Bulldozer, Crawler Tractor, and Other
  4. General Goods type selector shows 5 subtypes (Tools & Equipment, Attachments, Workshop Equipment, Office & IT, Miscellaneous)
**Plans**: 3 plans

Plans:
- [ ] 13-01-PLAN.md — Replace subtypes arrays in truck.ts, trailer.ts, earthmoving.ts, general-goods.ts with final v1.3 values
- [ ] 13-02-PLAN.md — Update stale test assertions in schema-registry.test.ts to match new subtype counts and keys
- [ ] 13-03-PLAN.md — Gap closure: append other to truck subtypes, add bulldozer/crawler_tractor/other to earthmoving subtypes, update test assertions

### Phase 14: Description Quality
**Goal**: GPT-4o generates correctly formatted descriptions for all truck and earthmoving subtypes, and every description ends with the required footer
**Depends on**: Phase 13
**Requirements**: TRUCK-02, DESC-01, DESC-02
**Success Criteria** (what must be TRUE):
  1. Generated description for any truck subtype (e.g. Prime Mover, Tipper, EWP) uses a format appropriate to that body type
  2. Generated description for any earthmoving subtype (e.g. Bulldozer, Telehandler, Trencher) uses a format appropriate to that machine type
  3. Every generated description across all asset types closes with "Sold As Is, Untested & Unregistered." — no exceptions
  4. When photos are provided but specific details are unknown (dimensions, body size, etc.), AI estimates or infers plausible values rather than inserting "TBC" — unknown fields are either omitted or given a best-estimate with appropriate qualifier
**Plans**: 2 plans

Plans:
- [ ] 14-01-PLAN.md — Add normalizeFooter function + TBC rule removal + full test coverage (DESC-01)
- [ ] 14-02-PLAN.md — Add 9 truck templates + 4 earthmoving templates + DOZER→BULLDOZER rename (TRUCK-02, DESC-02)

### Phase 15: Pre-fill Bug Fixes
**Goal**: The "Other notes" textarea always shows clean freeform text, and no pre-extraction edits are silently lost on fast navigation
**Depends on**: Phase 14
**Requirements**: PREFILL-07, PREFILL-08
**Success Criteria** (what must be TRUE):
  1. When returning to an in-progress asset, the "Other notes" textarea shows only the freeform notes the user typed — no serialised key:value lines visible
  2. Typing in a pre-extraction field and navigating away within 500ms does not silently discard the edit; the value is persisted
**Plans**: 2 plans

Plans:
- [ ] 15-01-PLAN.md — Fix extractFreeformNotes for multi-line notes + update tests (PREFILL-07)
- [ ] 15-02-PLAN.md — Replace unmount Server Action with navigator.sendBeacon + new POST /api/inspection-notes route (PREFILL-08)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation + Schema Registry | v1.0 | 3/3 | Complete | 2026-03-17 |
| 2. Photo Capture + Storage | v1.0 | 3/3 | Complete | 2026-03-17 |
| 3. AI Extraction | v1.0 | 3/3 | Complete | 2026-03-18 |
| 4. Review Form + Save | v1.0 | 3/3 | Complete | 2026-03-19 |
| 5. Output Generation | v1.0 | 3/3 | Complete | 2026-03-21 |
| 6. Asset List + Navigation | v1.0 | 2/2 | Complete | 2026-03-21 |
| 06.1. AI Extraction Quality (INSERTED) | v1.0 | 4/4 | Complete | 2026-03-21 |
| 8. Session Auth Fix | v1.1 | 1/1 | Complete | 2026-03-21 |
| 9. Pre-Extraction Structured Inputs | v1.1 | 2/2 | Complete | 2026-03-21 |
| 10. Description Verbatim Fidelity | v1.1 | 2/2 | Complete | 2026-03-21 |
| 11. Pre-fill Value Restoration | v1.2 | 2/2 | Complete | 2026-03-22 |
| 12. Marine Asset Type | 2/2 | Complete    | 2026-03-22 | - |
| 13. Subtype Expansions | 3/3 | Complete    | 2026-03-22 | - |
| 14. Description Quality | 2/2 | Complete    | 2026-03-23 | - |
| 15. Pre-fill Bug Fixes | 2/2 | Complete   | 2026-03-23 | - |
