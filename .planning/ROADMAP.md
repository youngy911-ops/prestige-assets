# Roadmap: Prestige Assets — Slattery Auctions Book-In App

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6.1 (shipped 2026-03-21)
- ✅ **v1.1 Pre-fill & Quality** — Phases 8–10 (shipped 2026-03-21)
- ✅ **v1.2 Pre-fill Restoration** — Phase 11 (shipped 2026-03-22)
- ✅ **v1.3 Asset Expansion** — Phases 12–15 (shipped 2026-03-23)
- ✅ **v1.4 Salesforce Subtype Alignment** — Phases 16–19 (shipped 2026-03-24)
- 🚧 **v1.5 Demo Polish** — Phases 20–23 (in progress)

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

### v1.5 Demo Polish (In Progress)

**Milestone Goal:** Tighten the app for demo readiness — fix broken/stub pages, consolidate hardcoded values, improve error UX, add asset deletion and status workflow.

- [x] **Phase 20: Brand & Config Consolidation** - Centralize brand identity, QR domain, and color tokens into single sources of truth (completed 2026-04-16)
- [ ] **Phase 21: Error UX & Broken Pages** - Contextual error pages and fix/remove the Edit Type stub
- [ ] **Phase 22: Asset Lifecycle** - Asset deletion and status workflow (draft / reviewed / confirmed)
- [ ] **Phase 23: Code Quality & Accessibility** - Deduplicate constants, replace emoji with icons, add ARIA attributes

## Phase Details

### Phase 20: Brand & Config Consolidation
**Goal**: Every brand-visible value (domain, company name, logo, colors) is sourced from a single config — not scattered across files
**Depends on**: Nothing (no v1.5 dependencies)
**Requirements**: BRAND-01, BRAND-02, BRAND-03
**Success Criteria** (what must be TRUE):
  1. QR codes on output/report pages render using a configurable domain that can be changed in one place
  2. Company name and logo monogram appear consistently across all pages from a single brand config file
  3. No hardcoded hex color values remain in component files — all colors use semantic Tailwind variants (destructive, warning, success, etc.)
**Plans:** 2/2 plans complete

Plans:
- [ ] 20-01-PLAN.md — Create brand config module and wire into all consumer files (BRAND-01, BRAND-02)
- [ ] 20-02-PLAN.md — Replace hardcoded hex colors with semantic Tailwind tokens (BRAND-03)

### Phase 21: Error UX & Broken Pages
**Goal**: Users see helpful, contextual error messages and never hit dead-end stub pages
**Depends on**: Nothing (independent of Phase 20)
**Requirements**: ERR-01, ERR-02
**Success Criteria** (what must be TRUE):
  1. App error pages display a specific message explaining what went wrong and offer at least one recovery action (go back, retry, go home)
  2. Edit Type page either allows the user to change asset type/subtype and re-triggers extraction, or the route is fully removed with no dead links pointing to it
**Plans**: TBD

### Phase 22: Asset Lifecycle
**Goal**: Users can manage asset records through a clear lifecycle — including deletion and status progression
**Depends on**: Nothing (independent of Phases 20–21)
**Requirements**: ASSET-01, ASSET-02
**Success Criteria** (what must be TRUE):
  1. User can delete an asset from the asset list or detail view with a confirmation prompt — deleted asset no longer appears in the list
  2. Asset records display a visible status badge (draft / reviewed / confirmed) on the list and detail views
  3. Status advances automatically as the user progresses through the workflow (creation = draft, review complete = reviewed, output copied = confirmed)
**Plans**: TBD

### Phase 23: Code Quality & Accessibility
**Goal**: Codebase constants are deduplicated, loading states use proper icons, and key UI elements have correct ARIA attributes
**Depends on**: Nothing (independent of Phases 20–22)
**Requirements**: CODE-01, CODE-02, A11Y-01, A11Y-02, A11Y-03
**Success Criteria** (what must be TRUE):
  1. LAST_BRANCH_KEY is defined in one shared location and imported by all consumers — no duplicate string literals
  2. Extraction loading state uses Lucide icons instead of emoji characters
  3. BottomNav active link has aria-current="page" set on the current route
  4. Expandable/collapsible sections (e.g., extraction "not found" fields) have aria-expanded toggling between true/false
  5. Photo thumbnails and asset card images have meaningful alt text describing the asset, or are marked role="presentation" if decorative
**Plans**: TBD

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
| 20. Brand & Config Consolidation | 2/2 | Complete   | 2026-04-16 | - |
| 21. Error UX & Broken Pages | v1.5 | 0/? | Not started | - |
| 22. Asset Lifecycle | v1.5 | 0/? | Not started | - |
| 23. Code Quality & Accessibility | v1.5 | 0/? | Not started | - |
