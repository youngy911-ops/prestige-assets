---
phase: 16
slug: subtype-schema-alignment
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-23
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npm test -- --reporter=verbose src/__tests__/schema-registry.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=verbose src/__tests__/schema-registry.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | SUBTYPE-01 | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ | ✅ green |
| 16-01-02 | 01 | 1 | SUBTYPE-02 | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ | ✅ green |
| 16-01-03 | 01 | 1 | SUBTYPE-03 | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ | ✅ green |
| 16-01-04 | 01 | 1 | SUBTYPE-04 | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ | ✅ green |
| 16-01-05 | 01 | 1 | SUBTYPE-05 | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ | ✅ green |
| 16-01-06 | 01 | 1 | SUBTYPE-06 | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ | ✅ green |
| 16-01-07 | 01 | 1 | SUBTYPE-07 | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ | ✅ green |
| 16-01-08 | 01 | 1 | SUBTYPE-08 | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

`src/__tests__/schema-registry.test.ts` exists and covers all 8 schema types. No new test files need to be created — the file needs content updates (not creation) to reflect new counts and keys.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Agriculture subtype selector renders in wizard Step 3 | SUBTYPE-04 | UI rendering requires browser | Open new asset wizard, select Agriculture, advance to Step 3 — verify dropdown appears with 12 options |
| Forklift subtype selector renders in wizard Step 3 | SUBTYPE-05 | UI rendering requires browser | Open new asset wizard, select Forklift, advance to Step 3 — verify dropdown appears with 9 options |
| Caravan subtype selector renders in wizard Step 3 | SUBTYPE-06 | UI rendering requires browser | Open new asset wizard, select Caravan, advance to Step 3 — verify dropdown appears with 5 options |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
