# Deferred Items - Phase 04

## PhotoUploadZone `capture` attribute removed

**Discovered:** Plan 04-03, Task 2 execution
**Test:** `src/__tests__/PhotoUploadZone.test.tsx` - "file input has accept="image/*", multiple, and capture="environment" attributes"
**Issue:** `capture="environment"` attribute was removed from `src/components/asset/PhotoUploadZone.tsx` in a pre-existing workspace change (not introduced by plan 04-03). The test now fails because it expects the attribute that no longer exists.
**Status:** Pre-existing workspace modification — outside scope of 04-03. The removal may be intentional (capture attribute can block photo library access on some devices).
**Action needed:** Determine if removal was intentional; if so, update the test to remove the `capture` assertion.
