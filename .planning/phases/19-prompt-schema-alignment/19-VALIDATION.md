---
phase: 19
slug: prompt-schema-alignment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npm run test -- --reporter=verbose src/__tests__/describe-route.test.ts` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --reporter=verbose src/__tests__/describe-route.test.ts`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | DESCR-04 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ (update existing at line 1033) | ⬜ pending |
| 19-01-02 | 01 | 1 | DESCR-08 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ (update at 1178; add recreational) | ⬜ pending |
| 19-01-03 | 01 | 1 | DESCR-06 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ (extend existing at line 1138) | ⬜ pending |
| 19-02-01 | 02 | 2 | — | docs | n/a (doc-only) | ✅ | ⬜ pending |
| 19-02-02 | 02 | 2 | — | docs | n/a (doc-only) | ✅ | ⬜ pending |
| 19-02-03 | 02 | 2 | — | docs | n/a (doc-only) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files or framework installation needed — all changes are updates to existing tests or additions within existing describe blocks in `src/__tests__/describe-route.test.ts`.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
