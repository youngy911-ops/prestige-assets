---
phase: 04-review-form-save
plan: "01"
subsystem: ui
tags: [react-hook-form, zod, shadcn, vitest, tdd, supabase]

# Dependency graph
requires:
  - phase: 03-ai-extraction
    provides: ExtractionResult and ExtractedField types used by checklist/form utilities
  - phase: 01-foundation
    provides: FieldDefinition type from schema-registry/types.ts

provides:
  - checklist_state JSONB column on assets table (migration 20260319000004)
  - BLOCKING_FIELD_KEYS Set and isBlocking() helper (blocking-fields.ts)
  - buildFormSchema() dynamic Zod schema builder from FieldDefinition[] (build-form-schema.ts)
  - buildDefaultValues() pre-fill helper that prefers savedFields over extraction values
  - buildChecklist() gap detector returning flagged fields with isBlocking and status
  - canSave() save guard that returns false when any blocking field is 'flagged'
  - shadcn textarea, checkbox, select UI components
  - react-hook-form ^7.71.2 and @hookform/resolvers ^5.2.2

affects:
  - 04-02 (review form UI — will import all utilities from this plan)
  - 04-03 (save action — will use canSave() before persisting)

# Tech tracking
tech-stack:
  added:
    - react-hook-form ^7.71.2
    - "@hookform/resolvers ^5.2.2"
    - shadcn textarea component
    - shadcn checkbox component
    - shadcn select component
  patterns:
    - TDD red-green cycle for pure utility functions (no UI required)
    - Zod schema built dynamically from FieldDefinition[] array
    - Checklist gap detection — include if (null/low confidence) AND (no current form value)
    - Blocking field save guard — canSave() filters isBlocking entries, checks none are 'flagged'

key-files:
  created:
    - supabase/migrations/20260319000004_review_checklist.sql
    - src/lib/review/blocking-fields.ts
    - src/lib/review/build-form-schema.ts
    - src/lib/review/build-checklist.ts
    - src/__tests__/build-form-schema.test.ts
    - src/__tests__/build-checklist.test.ts
    - src/components/ui/textarea.tsx
    - src/components/ui/checkbox.tsx
    - src/components/ui/select.tsx
  modified:
    - package.json (added react-hook-form, @hookform/resolvers)
    - package-lock.json

key-decisions:
  - "@hookform/resolvers v5.2.2 installed (not v3.9 as plan specified) — v5.x is the current major and supports Zod v4 natively; no downgrade needed"
  - "number inputType maps to z.string().regex(/^\\d*$/).or(z.literal('')) — all form values stay strings, numeric validation is string-based to avoid RHF type coercion issues"
  - "buildChecklist excludes fields with medium confidence + non-null value — medium is considered 'good enough' per spec, only low/null trigger checklist inclusion"
  - "PhotoUploadZone.test.tsx pre-existing failure (capture attribute removed in uncommitted working tree) is out of scope — not caused by this plan"

patterns-established:
  - "Review utilities are pure functions in src/lib/review/ — no React, no DB calls, fully testable with vitest"
  - "Checklist status defaults to 'flagged' when not in savedState — conservative default forces explicit resolution"

requirements-completed: [FORM-01, FORM-02, AI-04]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 4 Plan 01: Review Form Foundation Summary

**Pure-function utility layer for review form: dynamic Zod schema builder, AI gap checklist detector, and blocking-field save guard — all TDD with 33 passing tests**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-19T10:36:44Z
- **Completed:** 2026-03-19T10:39:55Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- DB migration adds `checklist_state jsonb not null default '{}'` column to assets table
- `buildFormSchema()` dynamically constructs a Zod schema from `FieldDefinition[]`, applying `z.string().regex(/^\d*$/).or(z.literal(''))` for `inputType: 'number'` fields
- `buildDefaultValues()` pre-fills form values from extraction_result, preferring savedFields when present, defaulting to `''` when neither source has a value
- `buildChecklist()` identifies missing-information gaps (null/low confidence AND no current form value) and tags each entry with `isBlocking` and a status defaulting to `'flagged'`
- `canSave()` save guard blocks saves when any blocking field (vin, registration_number, pin, serial) has status `'flagged'`
- All 33 new tests pass across both test files

## Task Commits

1. **Task 1: DB migration + npm/shadcn installs** - `a156068` (feat)
2. **Task 2: blocking-fields.ts + build-form-schema.ts** - `23d3fd4` (feat, TDD green)
3. **Task 3: build-checklist.ts** - `ac0f6bd` (feat, TDD green)

## Files Created/Modified
- `supabase/migrations/20260319000004_review_checklist.sql` - Adds checklist_state JSONB column to assets
- `src/lib/review/blocking-fields.ts` - BLOCKING_FIELD_KEYS Set + isBlocking() helper
- `src/lib/review/build-form-schema.ts` - buildFormSchema() + buildDefaultValues() + ReviewFormValues type
- `src/lib/review/build-checklist.ts` - buildChecklist() + canSave() + ChecklistEntry/ChecklistStatus types
- `src/__tests__/build-form-schema.test.ts` - 18 tests for schema builder and default values
- `src/__tests__/build-checklist.test.ts` - 15 tests for checklist detection and save guard
- `src/components/ui/textarea.tsx` - shadcn textarea component
- `src/components/ui/checkbox.tsx` - shadcn checkbox component
- `src/components/ui/select.tsx` - shadcn select component (includes SelectContent, SelectItem, SelectTrigger, SelectValue)
- `package.json` / `package-lock.json` - Added react-hook-form and @hookform/resolvers

## Decisions Made
- `@hookform/resolvers` v5.2.2 installed instead of plan's specified v3.9 floor — v5.x is the current major version with native Zod v4 support; the plan specified 3.9 as a minimum for compatibility, and v5.x exceeds that requirement
- Number fields use `z.string().regex(/^\d*$/).or(z.literal(''))` — keeping all values as strings avoids react-hook-form type coercion complexity; empty string is explicitly allowed for optional numeric fields

## Deviations from Plan

None — plan executed as written. The `@hookform/resolvers` version difference (v5.2.2 vs specified v3.9 minimum) is not a deviation; npm resolved to the current latest which exceeds the compatibility floor stated in the plan.

## Issues Encountered
- Pre-existing uncommitted modification to `src/components/asset/PhotoUploadZone.tsx` removes the `capture="environment"` attribute, causing `PhotoUploadZone.test.tsx` to fail in the full test suite. This failure predates and is unrelated to this plan. Logged as out-of-scope per deviation boundary rules.

## User Setup Required
None — no external service configuration required. The Supabase migration will be applied when the next `supabase db push` is run.

## Next Phase Readiness
- All pure-function utilities ready for 04-02 (review form UI) to import and use
- `BLOCKING_FIELD_KEYS`, `isBlocking`, `buildFormSchema`, `buildDefaultValues`, `buildChecklist`, `canSave` all exported and typed
- shadcn textarea, checkbox, and select components available for the form UI
- react-hook-form and @hookform/resolvers installed, ready for `useForm` with zodResolver

---
*Phase: 04-review-form-save*
*Completed: 2026-03-19*
