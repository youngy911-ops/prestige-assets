---
phase: 15
slug: pre-fill-bug-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="inspection-notes" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="inspection-notes" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 0 | PREFILL-07 | unit | `npx jest --testPathPattern="extractFreeformNotes" --no-coverage` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | PREFILL-07 | unit | `npx jest --testPathPattern="extractFreeformNotes" --no-coverage` | ✅ | ⬜ pending |
| 15-02-01 | 02 | 0 | PREFILL-08 | unit | `npx jest --testPathPattern="inspection-notes" --no-coverage` | ❌ W0 | ⬜ pending |
| 15-02-02 | 02 | 1 | PREFILL-08 | unit | `npx jest --testPathPattern="inspection-notes" --no-coverage` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/lib/extractFreeformNotes.test.ts` — unit tests for multi-line notes extraction (PREFILL-07)
- [ ] `src/__tests__/inspection-notes-route.test.ts` — tests for POST /api/inspection-notes (PREFILL-08)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Fast-nav edit not lost (< 500ms) | PREFILL-08 | sendBeacon timing is hard to simulate in jsdom | Navigate away < 500ms after typing; reload asset; confirm value persisted |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
