---
phase: 22
slug: asset-lifecycle
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | `vitest.config.ts` |
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
| 22-01-01 | 01 | 1 | ASSET-02 | unit | `npx vitest run src/components/AssetStatusBadge.test.tsx` | ❌ W0 | ⬜ pending |
| 22-01-02 | 01 | 1 | ASSET-02 | unit | `npx vitest run src/components/AssetStatusBadge.test.tsx` | ❌ W0 | ⬜ pending |
| 22-02-01 | 02 | 1 | ASSET-01 | unit | `npx vitest run src/app/actions/asset.actions.test.ts` | ❌ W0 | ⬜ pending |
| 22-02-02 | 02 | 1 | ASSET-01 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for status badge component — `src/components/AssetStatusBadge.test.tsx`
- [ ] Test stubs for delete action — `src/app/actions/asset.actions.test.ts`

*Existing infrastructure covers test framework — vitest already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Delete confirmation dialog appears before deletion | ASSET-01 | UI interaction flow | Click delete button, verify confirm prompt shows, cancel does not delete, confirm deletes |
| Status badge visually displays correct color/text | ASSET-02 | Visual appearance | Navigate to asset list, verify draft/reviewed/confirmed badges render with correct styling |
| Status auto-advances on workflow progression | ASSET-02 | End-to-end workflow | Create asset (draft), complete review (reviewed), copy all (confirmed) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
