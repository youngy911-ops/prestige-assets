---
phase: 24
slug: hourmeter-decimal-fix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-21
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --reporter=verbose build-form-schema extraction-schema` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- build-form-schema extraction-schema`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | EXTRACT-01 | — | N/A | unit | `npm test -- build-form-schema` | ❌ W0 | ⬜ pending |
| 24-01-02 | 01 | 1 | EXTRACT-01 | — | N/A | unit | `npm test -- build-form-schema` | ❌ W0 | ⬜ pending |
| 24-01-03 | 01 | 1 | EXTRACT-01 | — | N/A | unit | `npm test -- extraction-schema` | ❌ W0 | ⬜ pending |
| 24-01-04 | 01 | 1 | EXTRACT-01 | — | N/A | unit | `npm test -- extraction-schema` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/build-form-schema.test.ts` — add `'1234.5'` accepted case and `'1234.5.6'` rejected case
- [ ] `src/lib/__tests__/extraction-schema.test.ts` — add `buildSystemPrompt` decimal instruction assertion and agriculture aiHint `no decimals` absence assertion

*Wave 0 covers 4 missing test cases; existing infrastructure (Vitest, test files) is already present.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `inputMode="decimal"` shows decimal key on iOS/Android | EXTRACT-01 | Requires physical device | On mobile, open the review form for a truck asset, tap the hourmeter field, confirm the decimal key (`.`) is visible on the keyboard |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
