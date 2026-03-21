---
phase: 3
slug: ai-extraction
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-18
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (via `npm run test`) |
| **Config file** | `vitest.config.ts` (if exists) or inline in `package.json` |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | AI-01 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | AI-01 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | AI-02 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-01-04 | 01 | 1 | AI-01 | integration | `npm run build` | ✅ | ⬜ pending |
| 3-02-01 | 02 | 2 | AI-02 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | AI-03 | manual | n/a | n/a | ⬜ pending |
| 3-02-03 | 02 | 2 | AI-02 | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/extraction-schema.test.ts` — unit tests for Zod schema construction from Schema Registry fields; verifies null/undefined for unextracted fields; verifies confidence enum values
- [ ] `__tests__/extract-route.test.ts` — stubs for `/api/extract` Route Handler; mock AI SDK; verify request validation, auth check, response shape
- [ ] `__tests__/inspection-actions.test.ts` — tests for notes auto-save Server Action and DB write

*If vitest not yet configured: add `vitest` to devDependencies and create `vitest.config.ts`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GPT-4o reads actual build plate in uploaded photo | AI-01 | Requires real vision API call + real image | Upload photo of build plate, trigger extraction, verify make/model/year populated with high confidence |
| Staff can navigate away during extraction and return to see results | AI-02 | Requires browser interaction + timing | Trigger extraction, navigate to asset list, return to extract page, verify results displayed |
| Partial extraction shows partial results (not error state) | AI-01 | Requires real AI response variability | n/a — covered by mocking partial response in unit test |
| Confidence colour system renders correctly at all three levels | AI-03 | Visual regression requires human eye | Verify green/amber/muted colours for high/medium/low fields in browser |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
