---
phase: 13
slug: subtype-expansions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/__tests__/schema-registry.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~12 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/schema-registry.test.ts src/__tests__/extraction-schema.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~12 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | TRUCK-01 | unit | `npx vitest run src/__tests__/schema-registry.test.ts` | ✅ | ⬜ pending |
| 13-01-02 | 01 | 1 | TRAIL-01 | unit | `npx vitest run src/__tests__/schema-registry.test.ts` | ✅ | ⬜ pending |
| 13-01-03 | 01 | 1 | EARTH-01 | unit | `npx vitest run src/__tests__/schema-registry.test.ts` | ✅ | ⬜ pending |
| 13-01-04 | 01 | 1 | GOODS-01 | unit | `npx vitest run src/__tests__/schema-registry.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No Wave 0 needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Truck subtype selector shows 14 options in UI | TRUCK-01 | UI rendering | Create Truck asset, verify dropdown shows all 14 subtypes |
| General Goods selector shows 5 subtypes in UI | GOODS-01 | UI rendering | Create General Goods asset, verify dropdown shows 5 subtypes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
