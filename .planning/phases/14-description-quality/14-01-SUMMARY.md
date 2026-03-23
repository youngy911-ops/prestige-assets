---
phase: 14-description-quality
plan: "01"
subsystem: describe-api
tags: [footer-enforcement, system-prompt, tdd, normalizeFooter]
dependency_graph:
  requires: []
  provides: [normalizeFooter, tbc-rule-removal, identifier-guard]
  affects: [src/app/api/describe/route.ts, src/__tests__/describe-route.test.ts]
tech_stack:
  added: []
  patterns: [programmatic-footer-normalisation, tdd-red-green]
key_files:
  created: []
  modified:
    - src/app/api/describe/route.ts
    - src/__tests__/describe-route.test.ts
decisions:
  - "normalizeFooter strips any 'Sold As Is' variant from the last meaningful line then reappends the correct footer — ensures idempotency and wrong-variant replacement in one pass"
  - "PROCESS step 4 replacement avoids the word 'TBC' entirely (uses 'placeholder text or unknown values') so the test regex /\\bTBC\\b/ passes cleanly"
  - "normalizeFooter placed between refusal guard (step 7) and supabase.update (step 9) so all persisted and returned descriptions are normalised"
metrics:
  duration: "181s (~3 minutes)"
  completed: "2026-03-23"
  tasks_completed: 2
  files_modified: 2
---

# Phase 14 Plan 01: Footer Enforcement and TBC Rule Removal Summary

Programmatic footer enforcement via `normalizeFooter` plus TBC instruction removal — every generated description now ends with the legally-required footer regardless of AI output, and the system prompt no longer instructs GPT-4o to write placeholder text for unknown specs.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add normalizeFooter tests + update stale persist test (RED) | 161c70d | src/__tests__/describe-route.test.ts |
| 2 | Implement normalizeFooter + fix TBC rule in route.ts (GREEN) | b0977a9 | src/app/api/describe/route.ts |

## What Was Built

### normalizeFooter function

Added to `src/app/api/describe/route.ts` immediately before `buildDescriptionUserPrompt`:

- Selects correct footer based on `assetType`: `'Sold As Is, Untested.'` for `general_goods`, `'Sold As Is, Untested & Unregistered.'` for all other types
- Trims trailing blank lines from AI output
- Strips any existing "Sold As Is" line (wrong or correct variant) from the last meaningful line
- Appends the correct footer — making the operation idempotent and ensuring wrong-variant replacement

Wired into POST handler between refusal guard (step 7) and persist call (step 9). `normalizedText` is persisted and returned, not raw `text`.

### System prompt changes

- **PROCESS step 4**: Replaced `"If a spec cannot be confirmed replace it with TBC so the user knows to verify it"` with `"If a spec cannot be confirmed from photos, inspection notes, or your knowledge of that specific make/model/year, omit it — never write placeholder text or unknown values"`
- **UNIVERSAL RULES**: Added bullet: `"VIN, serial number, chassis number, and registration must only appear if directly visible in photos or inspection notes — never infer or estimate these identifiers"`

### Test coverage (19 tests, all passing)

New tests added:
- 5 `normalizeFooter` tests (truck no-footer, general_goods, wrong-variant replacement, idempotency, trailing blank lines)
- 1 TBC/identifier system prompt test

Existing tests updated:
- Persist test: mock now returns text with correct footer; assertion uses `toContain` not exact equality
- Success test: same mock/assertion update

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PROCESS step 4 replacement text contained "TBC"**
- **Found during:** Task 2 verification (test still failing after initial implementation)
- **Issue:** Plan specified replacement text `omit it — never write "TBC"` but the test `expect(systemContent).not.toMatch(/\bTBC\b/)` would catch the quoted word "TBC" in the replacement text itself
- **Fix:** Changed replacement to `omit it — never write placeholder text or unknown values` — preserves the intent without using the letters TBC
- **Files modified:** src/app/api/describe/route.ts
- **Commit:** b0977a9

## Verification

All 262 tests pass: `npx vitest run` exits 0.

Acceptance criteria met:
- `grep -n "function normalizeFooter" src/app/api/describe/route.ts` → line 226
- `grep -n "normalizedText" src/app/api/describe/route.ts` → 3 matches (declaration, update call, return)
- `grep -n "replace it with TBC" src/app/api/describe/route.ts` → NOT FOUND (correct)
- `grep -n "VIN, serial number, chassis number" src/app/api/describe/route.ts` → line 35
- Full test suite: 26 test files, 262 tests, all passed

## Self-Check: PASSED

- src/app/api/describe/route.ts exists and contains `function normalizeFooter` at line 226
- src/__tests__/describe-route.test.ts exists and contains `normalizeFooter` describe block
- Commit 161c70d exists (TDD RED)
- Commit b0977a9 exists (implementation GREEN)
- All 262 tests passing
