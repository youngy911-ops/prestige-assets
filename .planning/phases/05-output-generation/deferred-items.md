# Deferred Items — Phase 05 Output Generation

## Out-of-scope issues discovered during 05-01 execution

### PhotoUploadZone.test.tsx failure (pre-existing)

- **Discovered during:** Task 1 full test suite run
- **File:** `src/components/asset/PhotoUploadZone.tsx`
- **Issue:** Working tree has `capture="environment"` removed from the file input element (line 137). The test at `src/__tests__/PhotoUploadZone.test.tsx:50` asserts `expect(input).toHaveAttribute('capture', 'environment')` which now fails.
- **Root cause:** Pre-existing working-tree change (shown in git diff at session start), not caused by 05-01 changes.
- **Action required:** Either restore `capture="environment"` attribute or update the test to match intended behavior.
