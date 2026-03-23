# Phase 15: Pre-fill Bug Fixes - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix two known bugs in `InspectionNotesSection`:
1. **PREFILL-07** — Multi-line "Other notes" content gets truncated to its first line when returning to a record
2. **PREFILL-08** — Edits typed within 500ms of navigating away may be silently lost on iOS back-button navigation

No new fields, no new asset types, no schema changes.

</domain>

<decisions>
## Implementation Decisions

### PREFILL-07: Notes extraction fix
- **Minimal fix to `extractFreeformNotes` only** — change it to collect all lines from the first "Notes: " line to end-of-string and join with `\n`
- No change to `persistNotes` serialization format — storage format stays the same
- No DB migration — accept that any existing records with truncated notes (from multi-line input before this fix) are already lossy; no detection/warning needed
- `parseStructuredFields` does not need changes — it correctly excludes the `Notes` key; any floating orphan lines from old corrupted records are benign (no matching priority field keys)

### PREFILL-08: Unmount flush guarantee
- **Switch unmount flush to `navigator.sendBeacon` + new POST API route**
- New route: `POST /api/inspection-notes` — accepts `{ assetId, notes }` as JSON body
- Auth: Supabase cookie-based auth in the route handler (same pattern as other route handlers; sendBeacon sends cookies automatically for same-origin requests)
- The existing `saveInspectionNotes` Server Action is **retained** for the debounced autosave path (every 500ms keystroke) — only the unmount flush switches to sendBeacon
- `useEffect` cleanup: cancel debounce timer → call `navigator.sendBeacon('/api/inspection-notes', JSON.stringify({ assetId, notes }))` → no await needed (browser guarantees delivery)

### Existing corrupted records
- Accept data loss — app is pre-production with very few records; any truncated notes are already gone from the DB. No migration, no warning UI.

### Claude's Discretion
- Exact JSON encoding for sendBeacon payload
- Whether to add a `Content-Type` blob wrapper for sendBeacon (some browsers require it)
- Error handling in the new API route
- Test coverage approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bug requirements
- `.planning/REQUIREMENTS.md` — PREFILL-07 and PREFILL-08 acceptance criteria (the two success criteria for Phase 15)

### Files being modified
- `src/lib/utils/parseStructuredFields.ts` — `extractFreeformNotes` fix (PREFILL-07)
- `src/components/asset/InspectionNotesSection.tsx` — unmount flush rewrite (PREFILL-08); `useEffect` cleanup
- `src/lib/actions/inspection.actions.ts` — `saveInspectionNotes` Server Action (retained for autosave; reference for new route auth pattern)

### New file
- `src/app/api/inspection-notes/route.ts` — new POST endpoint for sendBeacon (PREFILL-08); auth pattern matches `src/app/api/extract/route.ts`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `extractFreeformNotes(notes)` in `parseStructuredFields.ts` — pure function, easy to fix in isolation; tests in `src/__tests__/parseStructuredFields.test.ts`
- `parseStructuredFields(notes)` — no change needed; correctly excludes `Notes` key
- `createClient()` from `@/lib/supabase/server` — use in new API route for cookie-based auth (same as `saveInspectionNotes` action)
- `src/app/api/extract/route.ts` — reference for API route auth pattern (Supabase session check, user_id guard)

### Established Patterns
- Server Actions used for all autosave/mutation paths — the new `sendBeacon` route is the only exception, justified by iOS back-button reliability requirement
- `useEffect` cleanup is synchronous — Server Action awaiting was never possible; sendBeacon is the correct pattern here
- Debounce at 500ms is the existing autosave interval — unchanged

### Integration Points
- `InspectionNotesSection` receives `initialNotes: string | null` from page server component (fetched from Supabase)
- `persistNotes` serialization format: `"${key}: ${value}\n...\nNotes: ${freeformText}"` — structure lines first, Notes line last
- `sendBeacon` endpoint does the same DB update as `saveInspectionNotes`: `UPDATE assets SET inspection_notes = $1 WHERE id = $2 AND user_id = $3`

</code_context>

<specifics>
## Specific Ideas

No specific references — open to standard approaches within the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-pre-fill-bug-fixes*
*Context gathered: 2026-03-23*
