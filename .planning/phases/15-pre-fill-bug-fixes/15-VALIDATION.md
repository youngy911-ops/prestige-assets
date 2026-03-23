---
phase: 15
slug: pre-fill-bug-fixes
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-23
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/parseStructuredFields.test.ts src/__tests__/InspectionNotesSection.test.tsx src/__tests__/inspection-notes-route.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 0 | PREFILL-07 | unit | `npx vitest run src/__tests__/parseStructuredFields.test.ts` | ✅ | ⬜ pending |
| 15-01-02 | 01 | 1 | PREFILL-07 | unit | `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` | ✅ | ⬜ pending |
| 15-02-01 | 02 | 0 | PREFILL-08 | unit | `npx vitest run src/__tests__/inspection-notes-route.test.ts` | ❌ W0 | ⬜ pending |
| 15-02-02 | 02 | 1 | PREFILL-08 | unit | `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/parseStructuredFields.test.ts` — existing file; new multi-line test cases appended by Plan 15-01 Task 1 (PREFILL-07)
- [ ] `src/__tests__/inspection-notes-route.test.ts` — tests for POST /api/inspection-notes; created by Plan 15-02 Task 1 (PREFILL-08)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Fast-nav edit not lost (< 500ms) | PREFILL-08 | sendBeacon timing is hard to simulate in jsdom | Navigate away < 500ms after typing; reload asset; confirm value persisted |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
