---
phase: 11
slug: pre-fill-value-restoration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/__tests__/parseStructuredFields.test.ts src/__tests__/InspectionNotesSection.test.tsx src/__tests__/extract-route.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/parseStructuredFields.test.ts src/__tests__/InspectionNotesSection.test.tsx src/__tests__/extract-route.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | PREFILL-06 | unit | `npx vitest run src/__tests__/parseStructuredFields.test.ts` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | PREFILL-06 | unit (regression) | `npx vitest run src/__tests__/extract-route.test.ts` | ✅ (import update) | ⬜ pending |
| 11-02-01 | 02 | 2 | PREFILL-06 | unit (component) | `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 2 | PREFILL-06 | unit (component) | `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` | ❌ W0 | ⬜ pending |
| 11-02-03 | 02 | 2 | PREFILL-06 | unit (component) | `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` | ❌ W0 | ⬜ pending |
| 11-02-04 | 02 | 2 | PREFILL-07 | unit (component) | `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` | ❌ W0 | ⬜ pending |
| 11-02-05 | 02 | 2 | PREFILL-08 | unit (component) | `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/parseStructuredFields.test.ts` — unit tests for pure utility: parse, freeform extraction, null input, Notes exclusion
- [ ] `src/__tests__/InspectionNotesSection.test.tsx` — component tests: defaultValue seeding, ref integrity on first autosave, textarea freeform display, unmount flush
- [ ] Update import path in `src/__tests__/extract-route.test.ts` — change `@/app/api/extract/route` to `@/lib/utils/parseStructuredFields` after Plan 11-01

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Select `defaultValue` hydration in browser | PREFILL-06 | Base UI Select hydration behaviour in `.map()` contexts has LOW confidence in jsdom — may need controlled fallback | Navigate to an asset with saved suspension type; confirm Select shows saved value (not placeholder) without interaction |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
