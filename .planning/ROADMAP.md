# Roadmap: Prestige Assets — Slattery Auctions Book-In App

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6.1 (shipped 2026-03-21)
- ✅ **v1.1 Pre-fill & Quality** — Phases 8–10 (shipped 2026-03-21)
- ✅ **v1.2 Pre-fill Restoration** — Phase 11 (shipped 2026-03-22)
- ✅ **v1.3 Asset Expansion** — Phases 12–15 (shipped 2026-03-23)
- 🚧 **v1.4 Salesforce Subtype Alignment** — Phases 16–17 (in progress)

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

<details>
<summary>✅ v1.3 Asset Expansion (Phases 12–15) — SHIPPED 2026-03-23</summary>

- [x] Phase 12: Marine Asset Type (2/2 plans) — completed 2026-03-22
- [x] Phase 13: Subtype Expansions (3/3 plans) — completed 2026-03-22
- [x] Phase 14: Description Quality (2/2 plans) — completed 2026-03-23
- [x] Phase 15: Pre-fill Bug Fixes (2/2 plans) — completed 2026-03-23

Full archive: `.planning/milestones/v1.3-ROADMAP.md`

</details>

### 🚧 v1.4 Salesforce Subtype Alignment (In Progress)

**Milestone Goal:** Replace all asset type subtype lists with exact Salesforce matches across all 8 asset types, add subtype selectors to Agriculture/Forklift/Caravan for the first time, and ensure description template coverage for all new and changed subtypes.

- [x] **Phase 16: Subtype Schema Alignment** - Update subtype arrays in all 8 asset schema files to match Salesforce exactly; add subtype selectors to Agriculture, Forklift, and Caravan for the first time (completed 2026-03-23)
- [ ] **Phase 17: Description Template Coverage** - Update AI system prompt with templates for all new and changed subtypes across all 8 asset types

## Phase Details

### Phase 16: Subtype Schema Alignment
**Goal**: All 8 asset types expose Salesforce-matching subtype lists; Agriculture, Forklift, and Caravan have a working subtype selector for the first time
**Depends on**: Phase 15 (v1.3 complete)
**Requirements**: SUBTYPE-01, SUBTYPE-02, SUBTYPE-03, SUBTYPE-04, SUBTYPE-05, SUBTYPE-06, SUBTYPE-07, SUBTYPE-08
**Success Criteria** (what must be TRUE):
  1. Truck subtype dropdown shows exactly 24 options (21 SF + EWP, Tilt Tray, Flat Deck)
  2. Trailer subtype dropdown shows exactly 24 options matching SF list
  3. Earthmoving subtype dropdown shows exactly 19 options with Bulldozer/Crawler Tractor merged into one entry
  4. Agriculture, Forklift, and Caravan each show a subtype selector (previously absent) with 12, 9, and 5 options respectively
  5. Marine subtype dropdown shows exactly 10 options; General Goods shows exactly 16 options
**Plans**: 3 plans

Plans:
- [x] 16-01-PLAN.md — Replace Truck, Trailer, Earthmoving, Marine subtype arrays (Wave 1)
- [x] 16-02-PLAN.md — Replace Agriculture, Forklift, Caravan, General Goods subtype arrays (Wave 1)
- [x] 16-03-PLAN.md — Update schema-registry.test.ts and run full suite green (Wave 2)

### Phase 17: Description Template Coverage
**Goal**: The AI description system prompt has appropriate templates for every subtype across all 8 asset types, including all new entries introduced in Phase 16
**Depends on**: Phase 16
**Requirements**: DESCR-01, DESCR-02, DESCR-03, DESCR-04, DESCR-05, DESCR-06, DESCR-07, DESCR-08
**Success Criteria** (what must be TRUE):
  1. Generating a description for any Truck or Trailer subtype produces a correctly structured output (no fallback to generic template)
  2. Generating a description for any Earthmoving subtype — including the merged Bulldozer/Crawler Tractor entry and all 9 new subtypes — produces subtype-appropriate output
  3. Agriculture, Forklift, and Caravan descriptions are subtype-aware for the first time (each subtype yields a distinct, appropriate template)
  4. Marine descriptions cover all 10 subtypes; General Goods descriptions cover all 16 subtypes
**Plans**: 4 plans

Plans:
- [ ] 17-01-PLAN.md — Write failing tests for all DESCR-01 through DESCR-08 requirements (Wave 0)
- [ ] 17-02-PLAN.md — Add missing truck sections + full trailer coverage + orphan cleanup (Wave 1)
- [ ] 17-03-PLAN.md — Merge bulldozer/crawler tractor + add 9 new earthmoving sections (Wave 2)
- [ ] 17-04-PLAN.md — Add agriculture, forklift, caravan, and marine subtype sections (Wave 3)

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
| 12. Marine Asset Type | v1.3 | 2/2 | Complete | 2026-03-22 |
| 13. Subtype Expansions | v1.3 | 3/3 | Complete | 2026-03-22 |
| 14. Description Quality | v1.3 | 2/2 | Complete | 2026-03-23 |
| 15. Pre-fill Bug Fixes | v1.3 | 2/2 | Complete | 2026-03-23 |
| 16. Subtype Schema Alignment | v1.4 | 3/3 | Complete | 2026-03-23 |
| 17. Description Template Coverage | 1/4 | In Progress|  | - |
