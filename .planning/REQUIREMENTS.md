# Requirements: Prestige Assets

**Defined:** 2026-03-21
**Core Value:** Photo a build plate → AI extracts identifiers → app generates copy-paste-ready Salesforce fields and a correctly formatted description — turning an hour of manual research into minutes.

## v1.1 Requirements

### Authentication

- [ ] **AUTH-01**: Authenticated user can navigate to the asset list via the Assets tab without being redirected to login

### Pre-Extraction Fields

- [ ] **PREFILL-01**: Truck asset shows dedicated input fields for VIN, Odometer, Hourmeter, and Suspension Type before AI extraction runs
- [ ] **PREFILL-02**: Trailer asset shows dedicated input fields for VIN and Suspension Type before AI extraction runs
- [ ] **PREFILL-03**: Forklift asset shows a dedicated "Unladen Weight" input field before AI extraction runs
- [ ] **PREFILL-04**: Caravan asset shows a dedicated "Length (ft)" input field before AI extraction runs
- [ ] **PREFILL-05**: Staff-entered pre-extraction values appear in the Salesforce fields output and are not overridden by AI extraction

### Description Quality

- [ ] **DESCR-01**: AI-generated description preserves specific values from inspection notes verbatim (e.g., `48" sleeper cab` is not paraphrased to `sleeper cab`)

## Future Requirements

### Pre-Extraction Fields

- **PREFILL-06**: Staff-entered pre-extraction values are restored when returning to an asset record (re-hydration from saved inspection_notes)

### Data Capture

- **DATA-01**: PPSR check result can be recorded against an asset record (v2)

## Out of Scope

| Feature | Reason |
|---------|--------|
| PPSR lookup within app | Jack runs PPSR through Salesforce separately; copy-paste result only (v2+) |
| Pre-fill value restore on reload | Keep v1.1 simple; staff can re-enter if navigating away |
| Salesforce API push | Blocked on IT/Connected App approval |
| iOS / native app | Web-first; Expo overhead not justified |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 8 | Pending |
| PREFILL-01 | Phase 9 | Pending |
| PREFILL-02 | Phase 9 | Pending |
| PREFILL-03 | Phase 9 | Pending |
| PREFILL-04 | Phase 9 | Pending |
| PREFILL-05 | Phase 9 | Pending |
| DESCR-01 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after v1.1 roadmap creation*
