---
phase: 1
slug: foundation-schema-registry
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | AUTH-01 | unit | `npx vitest run src/__tests__/auth` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | AUTH-01 | e2e-manual | `npx vitest run` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | AUTH-02 | unit | `npx vitest run src/__tests__/middleware` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | ASSET-01 | unit | `npx vitest run src/__tests__/db` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | ASSET-01 | unit | `npx vitest run src/__tests__/supabase` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 3 | ASSET-02 | unit | `npx vitest run src/__tests__/schema-registry` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 3 | ASSET-02 | unit | `npx vitest run src/__tests__/schema-registry` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/auth.test.ts` — stubs for AUTH-01 (login, session persistence)
- [ ] `src/__tests__/middleware.test.ts` — stubs for AUTH-02 (route protection)
- [ ] `src/__tests__/db.test.ts` — stubs for ASSET-01 (assets table, RLS)
- [ ] `src/__tests__/supabase.test.ts` — stubs for ASSET-01 (client/server wrappers)
- [ ] `src/__tests__/schema-registry.test.ts` — stubs for ASSET-02 (all 7 asset types)
- [ ] `vitest.config.ts` — vitest config with jsdom environment for Next.js
- [ ] `vitest` + `@vitejs/plugin-react` install — test framework setup

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login UI renders correctly with dark green brand | AUTH-01 | Visual/browser test | Open /login in browser; verify #166534 background, white text, correct layout |
| Session persists across browser refresh | AUTH-01 | Browser state | Log in, refresh page, confirm user is still authenticated |
| Asset type picker shows all 7 types + subtypes | ASSET-01 | UI interaction | Create new asset, verify dropdown shows all 7 types with correct subtypes |
| Supabase Storage bucket is private | AUTH-02 | Infrastructure check | Attempt unauthenticated access to bucket; confirm 403 |
| RLS blocks cross-user data access | ASSET-01 | Security test | Create asset as user A; confirm user B cannot read via direct DB query |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
