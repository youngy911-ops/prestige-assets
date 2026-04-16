---
phase: 20
slug: brand-config-consolidation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/__tests__/brand.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/brand.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 0 | BRAND-01, BRAND-02, BRAND-03 | unit + smoke | `npx vitest run src/__tests__/brand.test.ts` | ❌ W0 | ⬜ pending |
| 20-02-01 | 02 | 1 | BRAND-01 | unit | `npx vitest run src/__tests__/brand.test.ts` | ❌ W0 | ⬜ pending |
| 20-02-02 | 02 | 1 | BRAND-02 | unit | `npx vitest run src/__tests__/brand.test.ts` | ❌ W0 | ⬜ pending |
| 20-03-01 | 03 | 1 | BRAND-03 | smoke | `npx vitest run src/__tests__/brand.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/brand.test.ts` — stubs for BRAND-01 (domain export), BRAND-02 (name/monogram/title exports), BRAND-03 (no hardcoded hex grep)

*Existing infrastructure: `vitest.config.ts`, `vitest.setup.ts`, and `src/__tests__/` directory all exist. Only the phase-specific test file is missing.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `bg-[#166534]` removal doesn't visually change app layout | BRAND-03 | Visual regression — cannot assert pixel color in unit test | Remove `bg-[#166534]` from `(app)/layout.tsx`, run dev server, verify page background is unchanged |
| `global-error.tsx` inline styles match brand palette | BRAND-03 | Error boundary renders before CSS loads | Trigger global error, verify styling matches brand colors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
