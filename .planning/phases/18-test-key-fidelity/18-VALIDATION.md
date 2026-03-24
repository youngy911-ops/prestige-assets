---
phase: 18
slug: test-key-fidelity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/tests/describe-route.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/tests/describe-route.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | DESCR-04 | unit | `npx vitest run src/tests/describe-route.test.ts` | ✅ | ⬜ pending |
| 18-01-02 | 01 | 1 | DESCR-06 | unit | `npx vitest run src/tests/describe-route.test.ts` | ✅ | ⬜ pending |
| 18-01-03 | 01 | 1 | DESCR-08 | unit | `npx vitest run src/tests/describe-route.test.ts` | ✅ | ⬜ pending |
| 18-01-04 | 01 | 1 | DESCR-04,06,08 | unit | `npx vitest run` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Vitest is already installed and describe-route.test.ts exists with 105 passing tests.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
