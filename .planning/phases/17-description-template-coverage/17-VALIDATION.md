---
phase: 17
slug: description-template-coverage
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-24
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test -- --reporter=verbose src/__tests__/describe-route.test.ts` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --reporter=verbose src/__tests__/describe-route.test.ts`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-W0-01 | W0 | 0 | DESCR-01 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ❌ W0 | ✅ green |
| 17-W0-02 | W0 | 0 | DESCR-02 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ❌ W0 | ✅ green |
| 17-W0-03 | W0 | 0 | DESCR-03 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ❌ W0 | ✅ green |
| 17-W0-04 | W0 | 0 | DESCR-04 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ❌ W0 | ✅ green |
| 17-W0-05 | W0 | 0 | DESCR-05 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ❌ W0 | ✅ green |
| 17-W0-06 | W0 | 0 | DESCR-06 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ❌ W0 | ✅ green |
| 17-W0-07 | W0 | 0 | DESCR-07 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ❌ W0 | ✅ green |
| 17-W0-08 | W0 | 0 | DESCR-08 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ❌ W0 | ✅ green |
| 17-01-01 | 01 | 1 | DESCR-01 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ after W0 | ✅ green |
| 17-01-02 | 01 | 1 | DESCR-02 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ after W0 | ✅ green |
| 17-01-03 | 01 | 1 | DESCR-03 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ after W0 | ✅ green |
| 17-01-04 | 01 | 1 | DESCR-04 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ after W0 | ✅ green |
| 17-02-01 | 02 | 1 | DESCR-05 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ after W0 | ✅ green |
| 17-02-02 | 02 | 1 | DESCR-06 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ after W0 | ✅ green |
| 17-02-03 | 02 | 1 | DESCR-07 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ after W0 | ✅ green |
| 17-02-04 | 02 | 1 | DESCR-08 | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ after W0 | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/__tests__/describe-route.test.ts` — add DESCR-01 coverage: tests for crane_truck, fuel_truck, garbage, hook_bin, skip_bin, stock_truck, tanker, tray_truck, water_truck, coupe (truck) headings
- [x] `src/__tests__/describe-route.test.ts` — add DESCR-02 coverage: tests for all 24 trailer subtype headings
- [x] `src/__tests__/describe-route.test.ts` — update DESCR-03 coverage: update existing BULLDOZER and CRAWLER TRACTOR tests to check for merged BULLDOZER/CRAWLER TRACTOR heading
- [x] `src/__tests__/describe-route.test.ts` — add DESCR-04 coverage: tests for conveyors_stackers, crusher, motor_scraper, scraper, screener, tracked_loader, tracked_skid_steer_loader, washing, attachments headings
- [x] `src/__tests__/describe-route.test.ts` — add DESCR-05 coverage: tests for all 12 agriculture subtype headings
- [x] `src/__tests__/describe-route.test.ts` — add DESCR-06 coverage: tests for all 9 forklift subtype headings
- [x] `src/__tests__/describe-route.test.ts` — add DESCR-07 coverage: tests for all 5 caravan subtype headings
- [x] `src/__tests__/describe-route.test.ts` — update DESCR-08 coverage: update JET SKI test → PERSONAL WATERCRAFT; add tests for trailer_boat, tug, barge, commercial, fishing_vessel, private, recreational, coupe (marine)
- [x] `src/__tests__/describe-route.test.ts` — update TRENCHER test: change from toContain to not.toContain (or delete and replace with new test)

*Existing infrastructure (Vitest + describe-route.test.ts) is in place — Wave 0 adds/updates test cases only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GPT-4o correctly selects correct COUPE section for each asset type | DESCR-01 through DESCR-08 | GPT-4o template matching behavior cannot be unit-tested without a live API call | Submit a test asset with asset_type=truck, subtype=coupe and verify output matches truck-specific guidance; repeat for trailer and agriculture |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
