---
phase: 9
slug: pre-extraction-structured-inputs
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (jsdom environment) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/__tests__/extraction-schema.test.ts src/__tests__/schema-registry.test.ts src/__tests__/extract-route.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/extraction-schema.test.ts src/__tests__/schema-registry.test.ts src/__tests__/extract-route.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 9-01-01 | 01 | 0 | PREFILL-01,02,03,04 | unit | `npx vitest run src/__tests__/extraction-schema.test.ts` | ✅ needs update | ⬜ pending |
| 9-01-02 | 01 | 1 | PREFILL-01,02,03,04 | unit | `npx vitest run src/__tests__/extraction-schema.test.ts src/__tests__/schema-registry.test.ts` | ✅ needs update | ⬜ pending |
| 9-01-03 | 01 | 2 | PREFILL-05 | unit | `npx vitest run src/__tests__/extract-route.test.ts` | ✅ needs new case | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/extraction-schema.test.ts` — update 6 existing `getInspectionPriorityFields` test assertions for truck/trailer/forklift/caravan to include new fields; update count assertion
- [ ] `src/__tests__/extract-route.test.ts` — add test case for `parseStructuredFields`: `"vin: ABC\nNotes: freeform"` → `{ vin: "ABC" }` (Notes excluded)

*Existing test infrastructure covers all phase requirements — no new test files required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Suspension dropdown renders correctly in dark theme | PREFILL-01, PREFILL-02 | Visual UI rendering | Open a Truck or Trailer asset extract page, verify dropdown shows Spring/Airbag/6 Rod/Other and matches app styling |
| Staff-entered VIN appears in Salesforce fields output | PREFILL-05 | End-to-end flow requires DB+AI | Enter a VIN, run extraction, verify VIN appears in fields output unchanged |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
