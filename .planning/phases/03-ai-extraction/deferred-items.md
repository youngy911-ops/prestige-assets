# Deferred Items - Phase 03 AI Extraction

## Pre-existing Test Failure (Out of Scope)

**File:** src/__tests__/PhotoUploadZone.test.tsx
**Test:** "file input has accept="image/*", multiple, and capture="environment" attributes"
**Failure:** The test expects `capture="environment"` attribute but `PhotoUploadZone.tsx` (modified in git working tree before phase 03) does not include this attribute on the file input.
**Status:** Pre-existing — existed before any phase 03 changes. Not caused by phase 03 work.
**Action needed:** Fix the `capture` attribute in `PhotoUploadZone.tsx` or update the test expectation.
