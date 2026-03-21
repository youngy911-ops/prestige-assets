---
phase: 6
slug: asset-list-navigation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 0 | ASSET-03 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | ASSET-03 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | ASSET-03 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 0 | ASSET-04 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | ASSET-04 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 2 | ASSET-04 | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/asset-list.test.tsx` — stubs for ASSET-03 (list query, recency sort, card render)
- [ ] `src/__tests__/asset-edit-flow.test.tsx` — stubs for ASSET-04 (resume routing, status transitions)

*Existing vitest infrastructure is already configured — Wave 0 adds test stubs only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Branch picker renders on first visit | ASSET-03 | localStorage state not testable in vitest unit env | Open app in private/incognito, verify branch picker modal appears before list |
| Bottom nav visible and sticky on scroll | ASSET-03 | Visual layout behaviour | Open list page, scroll down through 10+ cards, verify nav stays fixed |
| Resume routing sends draft to review form | ASSET-04 | Full page navigation | Tap a draft record, verify it opens at /review/[id] |
| Resume routing sends confirmed to output | ASSET-04 | Full page navigation | Tap a confirmed record, verify it opens at /assets/[id]/output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
