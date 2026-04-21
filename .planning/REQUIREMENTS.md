# Requirements: Prestige Assets — v1.6 AI Quality & Workflow

**Defined:** 2026-04-18
**Core Value:** Photo a build plate → AI extracts identifiers → app generates copy-paste-ready Salesforce fields and a correctly formatted description — turning an hour of manual research into minutes.

## v1.6 Requirements

### Extraction Accuracy

- [ ] **EXTRACT-01**: AI correctly reads hourmeter values with decimals (e.g. 1,234.5 hrs is not rounded or truncated to 12345)
- [ ] **EXTRACT-02**: AI infers suspension type from make/model/year for common truck/trailer subtypes — staff no longer need to enter it manually when make/model/year identify it unambiguously
- [ ] **EXTRACT-03**: All AI-extractable fields across asset types are audited — aiHint content improved for commonly-missed fields, aiExtractable flags corrected where wrong, confidence language tightened

## Future Requirements

### Description Quality

- **DESCR-02**: AI-generated descriptions include key selling points and match Jack's writing style across all asset types and subtypes (Jack to supply example descriptions at build time)

### Inline Editing

- **INLINE-01**: Staff can re-extract a single field without triggering a full extraction re-run (per-field re-extract button with targeted /api/extract fieldKeys param)
- **INLINE-02**: Review form shows a visual dirty/locked indicator per field so staff can distinguish manually edited values from AI-extracted values

## Out of Scope

| Feature | Reason |
|---------|--------|
| Salesforce API push | Blocked on IT/Connected App credentials; copy-paste only |
| PPSR lookup | Handled separately via Salesforce |
| iOS native app | Web browser covers on-site + desktop |
| Auto-save without review | Legally significant records require mandatory review |
| Role-based access | Deferred until team adoption confirmed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EXTRACT-01 | Phase 24 | Pending |
| EXTRACT-02 | Phase 25 | Pending |
| EXTRACT-03 | Phase 26 | Pending |

**Coverage:**
- v1.6 requirements: 3 total
- Mapped to phases: 3 (100%) ✓
- Unmapped: 0

---
*Requirements defined: 2026-04-18*
*Last updated: 2026-04-18 — traceability updated after roadmap creation*
