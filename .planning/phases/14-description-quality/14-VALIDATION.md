---
phase: 14
slug: description-quality
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npx vitest run src/__tests__/describe-route.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/describe-route.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 0 | DESC-01 | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 0 | TRUCK-02 | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ W0 | ⬜ pending |
| 14-01-03 | 01 | 0 | DESC-02 | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | DESC-01 | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ W0 | ⬜ pending |
| 14-02-02 | 02 | 1 | TRUCK-02 | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ W0 | ⬜ pending |
| 14-02-03 | 02 | 1 | DESC-02 | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/describe-route.test.ts` — add test blocks for `normalizeFooter` behaviour (DESC-01)
- [ ] `src/__tests__/describe-route.test.ts` — add test blocks for all 13 new template section headings (TRUCK-02, DESC-02)
- [ ] `src/__tests__/describe-route.test.ts` — update existing `persists description text` test to expect normalised footer

*All new tests join the existing file — no new test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GPT-4o selects correct template for each subtype | TRUCK-02, DESC-02 | Requires live GPT-4o call | Generate a description for a Tipper, EWP, Compactor, and Trencher — verify format matches expected template structure |
| TBC never appears in generated output | DESC-01 SC4 | Requires live GPT-4o call with incomplete data | Generate description for asset with minimal fields — verify no "TBC" appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
