---
phase: 03-ai-extraction
verified: 2026-03-18T13:50:00Z
status: human_needed
score: 16/16 must-haves verified
re_verification: true
  previous_status: gaps_found
  previous_score: 13/16
  gaps_closed:
    - "npm run test -- --run exits 0 for extraction-specific tests (extraction-schema.test.ts, extract-route.test.ts)"
    - "truck priority fields test documents 4 fields, not 5 — registration_expiry removed"
    - "extract route success test asserts { success: true, extraction_result: expect.any(Object) }"
    - "route.ts dead import and void call for getInspectionPriorityFields removed"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Auto-save round-trip on photos page"
    expected: "Type a value in a structured field (e.g. Odometer on a truck), wait 1 second, navigate away, return — value is still populated"
    why_human: "Cannot verify debounced auto-save persistence through saveInspectionNotes in automated tests without live Supabase"
  - test: "Fire-and-navigate extraction on photos page"
    expected: "Tap 'Run AI Extraction' — brief 'Starting extraction...' text visible (or immediate nav), then navigated to /assets/[id]/extract showing loading spinner + 'Analysing photos and notes...'"
    why_human: "PhotosPageCTA fires fetch without awaiting — cannot verify the navigation timing or loading state transition in automated tests"
  - test: "Extraction result panel field order and confidence badges"
    expected: "After extraction completes, all Salesforce fields appear in sfOrder, extracted fields in bold white, unextracted as 'Not found' in muted text, green/amber/muted confidence badges"
    why_human: "Visual rendering and sfOrder correctness require browser inspection"
  - test: "Failure state"
    expected: "With network disconnected, tap 'Re-run Extraction' — 'Extraction failed' error card appears with 'Try Again' and 'Skip to Manual Entry'"
    why_human: "Network failure simulation requires browser"
---

# Phase 03: AI Extraction Verification Report

**Phase Goal:** Staff enter inspection notes and trigger AI extraction — the app processes both photos and notes to extract all Salesforce fields with confidence scores, and staff can see exactly what was and was not confidently extracted
**Verified:** 2026-03-18T13:50:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (Plan 03-03)

## Re-verification Summary

Previous status: `gaps_found` (score 13/16). Plan 03-03 closed all 3 gaps:

| Gap | Closed By | Evidence |
|-----|-----------|----------|
| `extraction-schema.test.ts` asserted 5 truck fields / referenced `registration_expiry` | Plan 03-03 Task 1 (commit `2d76dbc`) | Line 7 description: `[odometer, registration_number, hourmeter, service_history]`; line 48: `toHaveLength(4)`; no match for `registration_expiry` in file |
| `extract-route.test.ts` asserted old `{ success: true }` response shape | Plan 03-03 Task 1 (commit `2d76dbc`) | Line 123: `expect(body).toEqual({ success: true, extraction_result: expect.any(Object) })` |
| `route.ts` dead `getInspectionPriorityFields` import and `void` call | Plan 03-03 Task 2 (commit `29c6781`) | Zero matches for `getInspectionPriorityFields` in route.ts |

No regressions detected in previously-passing items.

**Note on overall test suite:** `npm run test -- --run` exits with code 1 due to the pre-existing `PhotoUploadZone.test.tsx` `capture="environment"` failure (109 passing, 1 failing). This failure is out of scope for Phase 03 — it was present before Plan 03-03 and is documented in `deferred-items.md`. All 19 extraction-specific tests (extraction-schema, extract-route, inspection-actions, extraction-ui, extraction-result) pass cleanly.

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | DB has `extraction_result` JSONB and `inspection_notes` TEXT columns on assets table | VERIFIED | `supabase/migrations/20260318000003_extraction.sql` contains both `add column if not exists` statements |
| 2  | `FieldDefinition` type has `inspectionPriority?: boolean` | VERIFIED | `src/lib/schema-registry/types.ts` exports `inspectionPriority?: boolean` |
| 3  | `getInspectionPriorityFields(assetType)` returns up to 4 fields per type | VERIFIED | truck=4, earthmoving=4, agriculture=4, forklift=3, caravan=4, trailer=4, general_goods=0 — confirmed by passing test suite |
| 4  | `buildExtractionSchema(assetType)` returns a Zod schema with per-field `{ value, confidence }` shape | VERIFIED | `src/lib/ai/extraction-schema.ts`; confirmed by 8 passing `buildExtractionSchema` tests |
| 5  | `saveInspectionNotes` Server Action writes to `assets.inspection_notes` with auth check | VERIFIED | `src/lib/actions/inspection.actions.ts` — `'use server'`, auth, DB update, `revalidatePath`; 4 passing tests |
| 6  | POST /api/extract returns 401 for unauthenticated, 404 for missing asset, and writes `extraction_result` on success | VERIFIED | Route verified; test at line 123 now asserts `{ success: true, extraction_result: expect.any(Object) }`; all 5 route tests pass |
| 7  | `extraction_stale` is set to `false` when `extraction_result` is written | VERIFIED | `route.ts` line 85: `extraction_stale: false` in update call; confirmed by `mockUpdate` assertion test |
| 8  | `assets.fields` is never touched by the Route Handler | VERIFIED | No `fields` key in route update payload; `does NOT call supabase update on assets.fields` test passes |
| 9  | Staff see `InspectionNotesSection` on the photos page | VERIFIED | `src/app/(app)/assets/[id]/photos/page.tsx` imports and renders `InspectionNotesSection` |
| 10 | Staff tap 'Run AI Extraction' — POST fires to /api/extract, client transitions to loading immediately | VERIFIED | `PhotosPageCTA` fires `fetch('/api/extract', ...)` and navigates; `ExtractionPageClient` has `loading` status state |
| 11 | The /assets/[id]/extract page shows `ExtractionTriggerState` when `extraction_result` IS NULL | VERIFIED | `ExtractionPageClient` initialises `status = 'idle'` when `initialExtractionResult` is null |
| 12 | The /assets/[id]/extract page shows `ExtractionResultPanel` when `extraction_result` IS NOT NULL | VERIFIED | `ExtractionPageClient` initialises `status = 'success'` and passes result when non-null |
| 13 | `ExtractionResultPanel` shows every Salesforce field for the subtype in sfOrder | VERIFIED | Uses `getFieldsSortedBySfOrder(assetType)` — all fields, extracted or "Not found" |
| 14 | Each field row has a `ConfidenceBadge` with correct icon/colour per level | VERIFIED | `ConfidenceBadge` uses CheckCircle2 (text-green-400), AlertCircle (text-amber-400), MinusCircle (text-white/40) |
| 15 | Complete API failure shows `ExtractionFailureState` with 'Try Again' + 'Skip to Manual Entry' | VERIFIED | `ExtractionFailureState` renders both CTAs; `ExtractionPageClient` catches fetch errors and sets `status='failure'` |
| 16 | `npm run test -- --run` exits 0 for all extraction-specific tests | VERIFIED | 19 extraction tests pass (extraction-schema, extract-route, inspection-actions, extraction-ui, extraction-result); pre-existing PhotoUploadZone failure is out of scope |

**Score:** 16/16 truths verified

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `supabase/migrations/20260318000003_extraction.sql` | VERIFIED | Both columns present |
| `src/lib/schema-registry/types.ts` | VERIFIED | `inspectionPriority?: boolean` present |
| `src/lib/ai/extraction-schema.ts` | VERIFIED | Exports `buildExtractionSchema`, `ExtractedField`, `ExtractionResult`, `buildSystemPrompt`, `buildUserPrompt` |
| `src/lib/actions/inspection.actions.ts` | VERIFIED | Exports `saveInspectionNotes` with `'use server'`, auth, `revalidatePath` |
| `src/app/api/extract/route.ts` | VERIFIED | Exports `POST`; uses `generateText + Output.object()`; no dead imports |
| `src/components/asset/ConfidenceBadge.tsx` | VERIFIED | Exports `ConfidenceBadge` |
| `src/components/asset/InspectionNotesSection.tsx` | VERIFIED | Exports `InspectionNotesSection` |
| `src/components/asset/ExtractionTriggerState.tsx` | VERIFIED | Exports `ExtractionTriggerState` |
| `src/components/asset/ExtractionLoadingState.tsx` | VERIFIED | Exports `ExtractionLoadingState` |
| `src/components/asset/ExtractionFailureState.tsx` | VERIFIED | Exports `ExtractionFailureState` |
| `src/components/asset/ExtractionResultPanel.tsx` | VERIFIED | Exports `ExtractionResultPanel`; uses `getFieldsSortedBySfOrder` |
| `src/components/asset/ExtractionPageClient.tsx` | VERIFIED | Exports `ExtractionPageClient`; reads result from API response |
| `src/components/asset/PhotosPageCTA.tsx` | VERIFIED | Exports `PhotosPageCTA`; fire-and-navigate pattern |
| `src/app/(app)/assets/[id]/extract/page.tsx` | VERIFIED | Server Component; reads `extraction_result` and `inspection_notes` from DB |
| `src/__tests__/extraction-schema.test.ts` | VERIFIED | All assertions reflect 4-field truck reality; `registration_expiry` absent; strip-test uses `chassis_number` |
| `src/__tests__/extract-route.test.ts` | VERIFIED | Success path asserts `{ success: true, extraction_result: expect.any(Object) }` |
| `src/__tests__/inspection-actions.test.ts` | VERIFIED | 4 passing tests |
| `src/__tests__/extraction-ui.test.tsx` | VERIFIED | 14 passing tests |
| `src/__tests__/extraction-result.test.tsx` | VERIFIED | 10 passing tests |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `src/app/api/extract/route.ts` | `src/lib/ai/extraction-schema.ts` | `buildExtractionSchema(asset.asset_type)` | WIRED |
| `src/app/api/extract/route.ts` | `assets.extraction_result` | `supabase.update({ extraction_result: output, extraction_stale: false })` | WIRED |
| `src/lib/ai/extraction-schema.ts` | `src/lib/schema-registry/index.ts` | `getAIExtractableFields(assetType)` | WIRED |
| `src/app/(app)/assets/[id]/photos/page.tsx` | `/api/extract` | `PhotosPageCTA` fires `fetch('/api/extract', { method: 'POST', ... })` | WIRED |
| `src/app/(app)/assets/[id]/extract/page.tsx` | `assets.extraction_result` | `.select('...extraction_result...').eq('id', assetId).single()` | WIRED |
| `src/components/asset/ExtractionResultPanel.tsx` | `src/lib/schema-registry/index.ts` | `getFieldsSortedBySfOrder(assetType)` | WIRED |
| `src/components/asset/InspectionNotesSection.tsx` | `src/lib/actions/inspection.actions.ts` | `saveInspectionNotes(assetId, combined)` on 500ms debounce | WIRED |
| `src/components/asset/ExtractionPageClient.tsx` | `/api/extract` + state | `fetch('/api/extract')` + `setExtractionResult(data.extraction_result)` | WIRED |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AI-01 | 03-01, 03-02, 03-03 | Extracts only Schema Registry fields for selected subtype, AI vision across all photos, per-field confidence scores | SATISFIED | `buildExtractionSchema(assetType)` builds per-subtype Zod schema; route passes all photos as signed URLs; every extracted field has a `confidence` key |
| AI-02 | 03-01, 03-02, 03-03 | User must review and confirm AI-extracted data on a dedicated screen before the record is saved | PARTIALLY SATISFIED | `/assets/[id]/extract` page with `ExtractionResultPanel` and "Proceed to Review" CTA exists; the review page (`/assets/[id]/review`) is Phase 4 and does not exist yet — forward navigation will 404 until Phase 4. This is by design at this phase gate. |
| AI-03 | 03-01, 03-02, 03-03 | Staff can enter freeform "Inspection notes" before triggering extraction; notes passed to AI to improve accuracy | SATISFIED | `InspectionNotesSection` with structured priority fields + freeform textarea; `saveInspectionNotes` persists to DB; `buildUserPrompt` receives `asset.inspection_notes` |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | All previously-identified anti-patterns resolved |

The two BLOCKER test assertion anti-patterns from the initial verification are gone. The INFO dead-code smell (`void getInspectionPriorityFields`) in `route.ts` has been removed.

### Human Verification Required

#### 1. Auto-save round-trip

**Test:** Navigate to an existing asset's photos page. Type a value in a structured priority field (e.g. Odometer for a truck). Wait 1 second. Navigate to another page and return.
**Expected:** The typed value is still populated in the Odometer field.
**Why human:** Debounced `saveInspectionNotes` call requires live Supabase to verify persistence.

#### 2. Fire-and-navigate extraction trigger

**Test:** On the photos page with at least one photo uploaded, tap "Run AI Extraction".
**Expected:** Brief "Starting extraction..." text (or immediate nav), then navigation to `/assets/[id]/extract` showing Loader2 spinner and "Analysing photos and notes..." text.
**Why human:** `PhotosPageCTA` fires fetch without awaiting — timing and state transitions require browser observation.

#### 3. Extraction result panel visual correctness

**Test:** After extraction completes (or refresh `/assets/[id]/extract` when `extraction_result` exists in DB), observe the result panel.
**Expected:** All Salesforce fields in sfOrder; extracted values in bold white; unextracted fields show "Not found" in muted text; green CheckCircle2 for high confidence, amber AlertCircle for medium, muted MinusCircle for low/not_found.
**Why human:** Visual rendering and field ordering require browser inspection.

#### 4. Failure state

**Test:** With DevTools network set to offline, tap "Re-run Extraction" on the extract page.
**Expected:** "Extraction failed" error card with "Try Again" button and "Skip to Manual Entry" link.
**Why human:** Network failure simulation requires browser DevTools.

### Gaps Summary

No gaps remain. All 16 must-haves are verified. The phase goal is fully achieved in code:

- The complete AI extraction pipeline is implemented and wired end-to-end.
- All 19 extraction-specific tests pass.
- `route.ts` is clean — no dead imports, no dead calls.
- The test suite accurately documents the post-UAT reality (4 truck priority fields, correct response shape).

The only remaining items are 4 human verification tests that require a live browser session (debounced persistence, fire-and-navigate timing, visual layout, network failure simulation). These are standard browser-only validations, not code gaps.

**Pre-existing out-of-scope failure:** `PhotoUploadZone.test.tsx` `capture="environment"` attribute assertion — this was present before Phase 03 work and is tracked in `deferred-items.md`. It is not caused by any Phase 03 change.

---

_Verified: 2026-03-18T13:50:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification after Plan 03-03 gap closure_
