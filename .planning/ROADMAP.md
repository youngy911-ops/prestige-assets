# Roadmap: Prestige Assets — Slattery Auctions Book-In App

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6.1 (shipped 2026-03-21)
- ✅ **v1.1 Pre-fill & Quality** — Phases 8–10 (shipped 2026-03-21)
- ✅ **v1.2 Pre-fill Restoration** — Phase 11 (shipped 2026-03-22)
- ✅ **v1.3 Asset Expansion** — Phases 12–15 (shipped 2026-03-23)
- ✅ **v1.4 Salesforce Subtype Alignment** — Phases 16–19 (shipped 2026-03-24)
- ✅ **v1.5 Demo Polish** — Phases 20–23 (shipped 2026-04-18)
- 🔄 **v1.6 AI Quality & Workflow** — Phases 24–26 (in progress)

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

<details>
<summary>✅ v1.4 Salesforce Subtype Alignment (Phases 16–19) — SHIPPED 2026-03-24</summary>

- [x] Phase 16: Subtype Schema Alignment (3/3 plans) — completed 2026-03-23
- [x] Phase 17: Description Template Coverage (4/4 plans) — completed 2026-03-24
- [x] Phase 18: Test Key Fidelity (1/1 plans) — completed 2026-03-24
- [x] Phase 19: Prompt-Schema Alignment (2/2 plans) — completed 2026-03-24

Full archive: `.planning/milestones/v1.4-ROADMAP.md`

</details>

<details>
<summary>✅ v1.5 Demo Polish (Phases 20–23) — SHIPPED 2026-04-18</summary>

- [x] Phase 20: Brand & Config Consolidation (2/2 plans) — completed 2026-04-16
- [x] Phase 21: Error UX & Broken Pages (1/1 plans) — completed 2026-04-16
- [x] Phase 22: Asset Lifecycle (2/2 plans) — completed 2026-04-16
- [x] Phase 23: Code Quality & Accessibility (1/1 plans) — completed 2026-04-18

Full archive: `.planning/milestones/v1.5-ROADMAP.md`

</details>

### v1.6 AI Quality & Workflow

- [ ] **Phase 24: Hourmeter Decimal Fix** — AI reads decimal hourmeter values correctly (e.g. 1,234.5 not 12345)
- [ ] **Phase 25: Suspension Type Inference** — AI infers suspension type from make/model/year for common truck/trailer configurations
- [ ] **Phase 26: Extraction Accuracy Audit** — All aiExtractable flags and confidence language audited and corrected across all 8 asset types

## Phase Details

### Phase 24: Hourmeter Decimal Fix
**Goal**: AI reliably extracts hourmeter values that include a decimal point without collapsing or rounding them
**Depends on**: Nothing (first v1.6 phase)
**Requirements**: EXTRACT-01
**Success Criteria** (what must be TRUE):
  1. A hourmeter reading of 1,234.5 hrs is extracted as `1234.5`, not `12345` or `1234`
  2. Whole-number hourmeter readings (e.g. 5000) are unaffected and still extract correctly
  3. Spot-check fixtures for Truck, Excavator, and Forklift all pass after the prompt change with no regression on other numeric fields
  4. The extraction confidence for hourmeter reflects actual legibility (high when decimal is clearly visible, low/null when display is ambiguous)
**Plans**: 1 plan

Plans:
- [ ] 24-01-PLAN.md — Fix form validation regex, agriculture aiHint, truck/earthmoving/forklift aiHints, and FieldRow inputMode

### Phase 25: Suspension Type Inference
**Goal**: AI populates suspension type from manufacturer knowledge when make/model/year unambiguously identify a known configuration, so staff no longer need to enter it manually for common trucks and trailers
**Depends on**: Phase 24
**Requirements**: EXTRACT-02
**Success Criteria** (what must be TRUE):
  1. For a Kenworth T610 or Volvo FH with known airbag fitment, the suspension field is populated as `Airbag` without any staff input
  2. For a truck make/model/year that is not in the lookup table, the suspension field is left null rather than guessing
  3. Staff-entered suspension values from InspectionNotesSection are not overridden by the inferred value
  4. Spot-check fixtures for Truck and Trailer pass before and after the change with no regression on extraction of other fields
**Plans**: 1 plan

Plans:
- [ ] 24-01-PLAN.md — Fix form validation regex, agriculture aiHint, truck/earthmoving/forklift aiHints, and FieldRow inputMode

### Phase 26: Extraction Accuracy Audit
**Goal**: Every AI-extractable field across all 8 asset types has correct aiExtractable flags, useful aiHint content, and calibrated confidence language — closing the gap between what the AI can reliably read and what it attempts
**Depends on**: Phase 25
**Requirements**: EXTRACT-03
**Success Criteria** (what must be TRUE):
  1. Every field with `aiExtractable: true` that was previously returning null or wrong values on well-photographed assets has an improved aiHint that addresses the known failure mode
  2. Fields where AI extraction is not reliable (e.g. fields only legible from compliance plates that are rarely photographed) have `aiExtractable: false` or a low-confidence default rather than attempting extraction
  3. Confidence language across all 8 asset types uses consistent terminology — no schema files using free-text confidence descriptions that differ from the established pattern
  4. Spot-check fixtures for all 8 asset types pass after audit changes with no regression on previously-correct fields
**Plans**: 1 plan

Plans:
- [ ] 24-01-PLAN.md — Fix form validation regex, agriculture aiHint, truck/earthmoving/forklift aiHints, and FieldRow inputMode

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
| 17. Description Template Coverage | v1.4 | 4/4 | Complete | 2026-03-24 |
| 18. Test Key Fidelity | v1.4 | 1/1 | Complete | 2026-03-24 |
| 19. Prompt-Schema Alignment | v1.4 | 2/2 | Complete | 2026-03-24 |
| 20. Brand & Config Consolidation | v1.5 | 2/2 | Complete | 2026-04-16 |
| 21. Error UX & Broken Pages | v1.5 | 1/1 | Complete | 2026-04-16 |
| 22. Asset Lifecycle | v1.5 | 2/2 | Complete | 2026-04-16 |
| 23. Code Quality & Accessibility | v1.5 | 1/1 | Complete | 2026-04-18 |
| 24. Hourmeter Decimal Fix | v1.6 | 0/TBD | Not started | - |
| 25. Suspension Type Inference | v1.6 | 0/TBD | Not started | - |
| 26. Extraction Accuracy Audit | v1.6 | 0/TBD | Not started | - |
