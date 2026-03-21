# Roadmap: Prestige Assets — Slattery Auctions Book-In App

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6.1 (shipped 2026-03-21)
- ✅ **v1.1 Pre-fill & Quality** — Phases 8–10 (shipped 2026-03-21)
- 🚧 **v1.2 Pre-fill Restoration** — Phase 11 (in progress)

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

### 🚧 v1.2 Pre-fill Restoration (In Progress)

**Milestone Goal:** Staff-entered pre-extraction values are restored when returning to an in-progress asset record — completing the stateful inspection form experience.

- [ ] **Phase 11: Pre-fill Value Restoration** — Parse and restore all pre-extraction inputs, fix freeform textarea display, seed internal refs, and add unmount flush to prevent silent data loss on navigation

## Phase Details

### Phase 11: Pre-fill Value Restoration
**Goal**: Staff can return to an asset record and find all pre-extraction fields exactly as they left them
**Depends on**: Nothing (first phase of v1.2; builds on shipped v1.1 code)
**Requirements**: PREFILL-06
**Success Criteria** (what must be TRUE):
  1. Staff returning to an in-progress asset record see VIN, odometer, hourmeter, unladen weight, and length fields populated with their previously entered values
  2. The Suspension Type select displays the previously chosen option (Spring, Airbag, 6 Rod, or Other) rather than a blank placeholder
  3. The "Other notes" textarea shows only the freeform notes staff typed, not the serialised key:value lines from structured fields
  4. Changes made immediately before navigating away are not silently lost — fast navigation does not discard unsaved edits
**Plans**: TBD

Plans:
- [ ] 11-01: Extract parseStructuredFields to shared utility and update import paths
- [ ] 11-02: Restore all structured inputs, Select, textarea, and seed refs in InspectionNotesSection; add unmount flush

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
| 11. Pre-fill Value Restoration | v1.2 | 0/2 | Not started | - |
