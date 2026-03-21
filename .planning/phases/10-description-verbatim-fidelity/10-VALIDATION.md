---
phase: 10
slug: description-verbatim-fidelity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/__tests__/describe-route.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/describe-route.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 0 | DESCR-01 | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ✅ (add tests) | ⬜ pending |
| 10-01-02 | 01 | 1 | DESCR-01 | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/describe-route.test.ts` — add test cases for verbatim split behavior (DESCR-01): structured fields in verbatim block, freeform notes in separate block, graceful fallback when no key:value lines, graceful fallback when no `Notes:` line, system prompt contains new verbatim rule bullet

*Existing infrastructure covers phase — no new framework or config files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GPT-4o description output contains `48" sleeper cab` verbatim when notes contain `Notes: 48" sleeper cab` | DESCR-01 | Requires live OpenAI call | Generate description for a truck asset with `inspection_notes` containing `Suspension Type: Airbag\nNotes: 48" sleeper cab` — verify generated description text contains `48" sleeper cab` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
