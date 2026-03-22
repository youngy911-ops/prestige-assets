---
phase: 12
slug: marine-asset-type
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (jsdom environment) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- src/__tests__/schema-registry.test.ts src/__tests__/extraction-schema.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/__tests__/schema-registry.test.ts src/__tests__/extraction-schema.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 0 | MARINE-01 | unit | `npm test -- src/__tests__/schema-registry.test.ts` | Wave 0 update | ⬜ pending |
| 12-01-02 | 01 | 0 | MARINE-01 | unit | `npm test -- src/__tests__/schema-registry.test.ts` | Wave 0 addition | ⬜ pending |
| 12-01-03 | 01 | 0 | MARINE-02 | unit | `npm test -- src/__tests__/extraction-schema.test.ts` | Wave 0 addition | ⬜ pending |
| 12-01-04 | 01 | 0 | MARINE-03 | unit | `npm test -- src/__tests__/describe-route.test.ts` | Wave 0 addition | ⬜ pending |
| 12-02-01 | 02 | 1 | MARINE-01 | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ (generic loop) | ⬜ pending |
| 12-02-02 | 02 | 1 | MARINE-02 | unit | `npm test -- src/__tests__/extraction-schema.test.ts` | ✅ (generic loop) | ⬜ pending |
| 12-02-03 | 02 | 1 | MARINE-03 | unit | `npm test -- src/__tests__/describe-route.test.ts` | Wave 0 addition | ⬜ pending |
| 12-03-01 | 03 | 2 | MARINE-01 | unit | `npm test -- src/__tests__/schema-registry.test.ts` | ✅ (generic loop) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/schema-registry.test.ts` — update two count assertions from `7` to `8`; add marine-specific assertions (subtypes count=3, `hasGlassValuation=false`)
- [ ] `src/__tests__/extraction-schema.test.ts` — add `getInspectionPriorityFields('marine')` test; add `buildExtractionSchema('marine')` smoke test; add `buildSystemPrompt` contains MARINE assertion
- [ ] `src/__tests__/describe-route.test.ts` — add assertion that `DESCRIPTION_SYSTEM_PROMPT` contains 'JET SKI' section; add assertion that existing MARINE section is preserved

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Marine subtype selector renders Boat/Yacht/Jet Ski options in UI | MARINE-01 | Visual rendering requires browser | Create marine asset, verify subtype dropdown shows 3 options |
| AI extraction populates marine fields from photo | MARINE-02 | Requires live AI API call | Upload boat photo, verify HIN/LOA/Beam fields populate |
| Salesforce fields block renders marine fields in correct order | MARINE-01 | Visual ordering requires browser | Create marine asset, check field order matches sfOrder |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
