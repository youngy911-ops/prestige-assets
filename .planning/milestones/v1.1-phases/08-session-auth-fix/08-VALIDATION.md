---
phase: 8
slug: session-auth-fix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/__tests__/middleware.test.ts src/__tests__/auth.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/middleware.test.ts src/__tests__/auth.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | AUTH-01 | unit | `npx vitest run src/__tests__/middleware.test.ts` | ✅ | ⬜ pending |
| 08-01-02 | 01 | 1 | AUTH-01 | unit | `npx vitest run src/__tests__/middleware.test.ts` | ✅ | ⬜ pending |
| 08-01-03 | 01 | 1 | AUTH-01 | unit | `npx vitest run src/__tests__/auth.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

- No new test files needed — existing `src/__tests__/middleware.test.ts` and `src/__tests__/auth.test.ts` receive new test cases
- No new framework installs needed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Page reload while on asset list does not trigger redirect | AUTH-01 | Browser session persistence requires real browser | Log in → navigate to `/` → reload → confirm no redirect |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
