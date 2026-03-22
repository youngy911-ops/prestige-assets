# Requirements: Prestige Assets

**Defined:** 2026-03-21
**Core Value:** Photo a build plate → AI extracts identifiers → app generates copy-paste-ready Salesforce fields and a correctly formatted description — turning an hour of manual research into minutes.

## v1.2 Requirements

Requirements for v1.2 milestone.

### Pre-fill

- [x] **PREFILL-06**: User can return to an in-progress asset record and find all pre-extraction fields (VIN, odometer, hourmeter, suspension type, unladen weight, length) pre-populated with previously entered values

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Pre-fill

- **PREFILL-07**: "Other notes" textarea shows only freeform notes (not serialised key:value lines) when returning to a record — companion display bug, same component
- **PREFILL-08**: Pre-extraction edits made within 500ms of navigating away are not silently lost — unmount flush for debounced autosave

## Out of Scope

| Feature | Reason |
|---------|--------|
| `pre_extraction_fields JSONB` column | String serialisation round-trips correctly; DB migration not warranted unless parse approach proves fragile in practice |
| URL search params for pre-fill | Data already persists to Supabase; client-side duplication adds complexity for no benefit |
| Auto-save confirmation UI | Silent autosave is correct UX for this workflow; error state surface deferred |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PREFILL-06 | Phase 11 | Complete |

**Coverage:**
- v1.2 requirements: 1 total
- Mapped to phases: 1
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after v1.2 roadmap creation*
