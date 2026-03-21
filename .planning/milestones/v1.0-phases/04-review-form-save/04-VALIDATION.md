---
phase: 4
slug: review-form-save
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npm test -- --reporter=dot` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=dot src/__tests__/build-form-schema.test.ts src/__tests__/build-checklist.test.ts src/__tests__/review.actions.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | FORM-01 | unit | `npm test -- src/__tests__/build-form-schema.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 0 | FORM-01 | component | `npm test -- src/__tests__/DynamicFieldForm.test.tsx` | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 0 | FORM-02 | component | `npm test -- src/__tests__/FieldRow.test.tsx` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 0 | AI-04 | unit | `npm test -- src/__tests__/build-checklist.test.ts` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 0 | AI-04 | unit | `npm test -- src/__tests__/review.actions.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/build-form-schema.test.ts` — stubs for FORM-01 (schema construction + default values pre-fill from extraction_result)
- [ ] `src/__tests__/DynamicFieldForm.test.tsx` — stubs for FORM-01 (correct input widget per inputType)
- [ ] `src/__tests__/FieldRow.test.tsx` — stubs for FORM-02 (confidence highlighting: low/not_found gets highlight, high/medium does not)
- [ ] `src/__tests__/build-checklist.test.ts` — stubs for AI-04 (gap detection, canSave guard for blocking fields)
- [ ] `src/__tests__/review.actions.test.ts` — stubs for AI-04 (saveReview upserts fields + checklist_state, auth guard)
- [ ] `supabase/migrations/20260319000004_review_checklist.sql` — adds `checklist_state jsonb not null default '{}'` to assets table

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Low-confidence field rows visually distinct from high-confidence rows | FORM-02 | Visual styling — not automatable | Load /assets/[id]/review on an asset with mixed confidence scores; verify low-confidence field rows have coloured left border or tint; medium/high rows look clean |
| Save button stays disabled until all blocking checklist items resolved | AI-04 | DOM state depends on runtime checklist evaluation | Load review page with an asset missing VIN; verify Save is disabled; enter VIN or mark as unknown; verify Save enables |
| Staff cannot navigate to /output without saving | AI-04 | Navigation guard logic | Attempt to navigate directly to /assets/[id]/output without completing review; should redirect back |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
