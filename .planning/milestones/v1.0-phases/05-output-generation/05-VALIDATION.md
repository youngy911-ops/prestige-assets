---
phase: 5
slug: output-generation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SF-01 | unit | `npx vitest run src/lib/__tests__/generateFieldsBlock.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | SF-01 | snapshot | `npx vitest run src/lib/__tests__/generateFieldsBlock.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | SF-02 | unit | `npx vitest run src/lib/__tests__/generateDescription.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | SF-02 | snapshot | `npx vitest run src/lib/__tests__/generateDescription.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 1 | SF-02 | integration | `npx vitest run src/app/api/describe/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | SF-03 | manual | — | — | ⬜ pending |
| 05-03-02 | 03 | 2 | SF-03 | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/generateFieldsBlock.test.ts` — stubs for SF-01 (fields block snapshot tests, 7 asset types)
- [ ] `src/lib/__tests__/generateDescription.test.ts` — stubs for SF-02 (description template tests per subtype, "Sold As Is" footer)
- [ ] `src/app/api/describe/__tests__/route.test.ts` — stubs for SF-02 (route handler integration test)

*Existing vitest infrastructure is installed; no new framework needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Copy-to-clipboard button copies correct text | SF-03 | Clipboard API requires real browser interaction | Click each copy button, paste into text editor, verify content matches displayed block |
| Visual confirmation appears on copy | SF-03 | UI state change requires visual inspection | Click copy button, verify toast/tick indicator appears and disappears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
