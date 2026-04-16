---
phase: 21
slug: error-ux-broken-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/__tests__/brand.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/brand.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 0 | ERR-01 | unit | `npx vitest run src/__tests__/error-boundaries.test.tsx` | ❌ W0 | ⬜ pending |
| 21-01-02 | 01 | 1 | ERR-01 | smoke | `npx vitest run src/__tests__/brand.test.ts` | ✅ existing | ⬜ pending |
| 21-02-01 | 02 | 1 | ERR-02 | smoke | `npx vitest run src/__tests__/error-boundaries.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/error-boundaries.test.tsx` — stubs for ERR-01 (render test for contextual copy and recovery buttons) and ERR-02 (fs assertion that edit-type/page.tsx is absent)

*Existing infrastructure covers brand hex scanning via `src/__tests__/brand.test.ts`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual appearance of error pages | ERR-01 | Layout/styling needs human eye | Navigate to `/assets/nonexistent-id`, verify error page shows contextual message, recovery buttons, and matches brand styling |
| global-error.tsx renders correctly without Tailwind | ERR-01 | Inline styles not testable via unit test | Trigger a root-level error, verify page renders with correct brand colours and recovery link |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
