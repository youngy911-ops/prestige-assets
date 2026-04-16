# Requirements: Prestige Assets — v1.5 Demo Polish

**Defined:** 2026-04-16
**Core Value:** Photo a build plate → AI extracts identifiers → app generates copy-paste-ready Salesforce fields and a correctly formatted description — turning an hour of manual research into minutes.

## v1.5 Requirements

Requirements for demo-ready polish. Each maps to roadmap phases.

### Brand & Config

- [x] **BRAND-01**: QR code on output/report pages uses configurable domain (not hardcoded assetbookintool.com)
- [x] **BRAND-02**: Company name, logo monogram, and page metadata are sourced from a single brand config — not scattered hardcoded strings
- [x] **BRAND-03**: Hardcoded color values (#F87171, bg-red-900/40, etc.) replaced with semantic Tailwind variants (destructive, etc.)

### Error & Edge Cases

- [ ] **ERR-01**: App error pages show contextual messages with recovery guidance (not just "Something went wrong" + retry)
- [ ] **ERR-02**: Edit Type page is functional — user can change asset type/subtype after creation — or route is removed cleanly (no silent stub redirect)

### Asset Management

- [ ] **ASSET-01**: User can delete an asset record from the asset list or detail view
- [ ] **ASSET-02**: Asset records have a visible status (draft / reviewed / confirmed) that updates as the user progresses through the workflow

### Code Quality

- [ ] **CODE-01**: LAST_BRANCH_KEY constant defined in one shared location, imported everywhere
- [ ] **CODE-02**: Extraction loading uses Lucide icons instead of emoji characters (accessible, consistent rendering)

### Accessibility

- [ ] **A11Y-01**: BottomNav active link has aria-current="page"
- [ ] **A11Y-02**: Expandable/collapsible sections (extraction "not found" fields) have aria-expanded attribute
- [ ] **A11Y-03**: Photo thumbnails and asset card images have meaningful alt text or are correctly marked as decorative

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Features (v1.6+)

- **FEAT-01**: Offline/PWA support — service worker for core pages + queued uploads
- **FEAT-02**: PDF report export (native, not browser print)
- **FEAT-03**: Dashboard stats — weekly/monthly booking counts, breakdown by type and branch
- **FEAT-04**: Bulk operations — select multiple assets, bulk export, bulk print
- **FEAT-05**: Asset history/audit trail — who changed what, when
- **FEAT-06**: Team activity feed — who booked what today across branches
- **FEAT-07**: Search by asset type/subtype name (not just field values)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Salesforce API push | Blocked on IT/Connected App approval |
| PPSR lookup | Done separately via Salesforce |
| iOS native app | Web browser covers on-site + desktop |
| Auto-save without review | Legally significant records require mandatory review |
| Notifications | Not part of book-in workflow for v1.5 |
| Role-based access | Deferred until team adoption confirmed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-01 | Phase 20 | Complete |
| BRAND-02 | Phase 20 | Complete |
| BRAND-03 | Phase 20 | Complete |
| ERR-01 | Phase 21 | Pending |
| ERR-02 | Phase 21 | Pending |
| ASSET-01 | Phase 22 | Pending |
| ASSET-02 | Phase 22 | Pending |
| CODE-01 | Phase 23 | Pending |
| CODE-02 | Phase 23 | Pending |
| A11Y-01 | Phase 23 | Pending |
| A11Y-02 | Phase 23 | Pending |
| A11Y-03 | Phase 23 | Pending |

**Coverage:**
- v1.5 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-04-16*
*Last updated: 2026-04-16 — traceability updated after roadmap creation*
