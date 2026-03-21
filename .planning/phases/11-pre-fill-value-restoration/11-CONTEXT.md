# Phase 11: Pre-fill Value Restoration - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Restore all staff-entered pre-extraction values in `InspectionNotesSection` when returning to an asset record. Covers: structured input fields (VIN, odometer, hourmeter, unladen weight, length), Suspension Type select, freeform "Other notes" textarea display, and unmount flush for fast-navigation data loss. No new input fields, no new pages, no schema changes.

</domain>

<decisions>
## Implementation Decisions

### Scope
- All 4 roadmap success criteria are in scope for this phase — PREFILL-07 (textarea display) and PREFILL-08 (unmount flush) are confirmed companions, not deferred
- Only PREFILL-06 carries a formal requirement ID, but the roadmap plans and success criteria include all four

### Unmount flush
- Use `useEffect` cleanup approach: return `persistNotes()` from a `useEffect` — React calls it synchronously on unmount
- This handles all navigation types (back button, link click, tab close) — `beforeunload` is NOT suitable (misses in-app Next.js navigation)
- The debounce timer should also be cancelled in the same cleanup (`clearTimeout(debounceRef.current)`)

### Textarea freeform notes
- `defaultValue` on the textarea must be seeded with only the freeform notes text extracted from the `Notes:` line in `inspection_notes` — not the full serialised blob
- `notesRef.current` must also be seeded with just the freeform notes text (without the `Notes: ` prefix) to prevent double-encoding on the next autosave
- Example: `inspection_notes = "vin: ABC123\nodometer: 50000\nNotes: runs well"` → textarea shows `runs well`, notesRef = `runs well`

### structuredValuesRef seeding
- `structuredValuesRef.current` must be seeded at mount from `parseStructuredFields(initialNotes)` so the first autosave after reload doesn't silently zero out previously saved values
- If `initialNotes` is null/empty, `structuredValuesRef.current` remains `{}`

### Claude's Discretion
- Where to place the extracted `parseStructuredFields` utility (e.g., `src/lib/utils/parseStructuredFields.ts` or inline in schema-registry — just not in route handler)
- Select restore approach: try `defaultValue` (uncontrolled) first; fall back to controlled `value` + `useState` if blank on hydration (STATE.md already has this fallback fully designed)
- Input `defaultValue` wiring pattern

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core component and data flow
- `src/components/asset/InspectionNotesSection.tsx` — The component being fixed; all 4 restoration changes land here
- `src/app/api/extract/route.ts` — Current home of `parseStructuredFields`; must be extracted from here
- `src/components/asset/ExtractionPageClient.tsx` — Passes `inspectionNotes` prop to `InspectionNotesSection`
- `src/app/(app)/assets/[id]/extract/page.tsx` — Server component that loads `inspection_notes` from DB and passes to `ExtractionPageClient`
- `src/lib/actions/inspection.actions.ts` — `saveInspectionNotes` server action; unchanged but must be understood

### Schema and field definitions
- `src/lib/schema-registry/index.ts` — `getInspectionPriorityFields()` returns the structured fields shown in the section
- `src/lib/schema-registry/types.ts` — `FieldDefinition` type including `inputType` and `options` fields

### Requirements
- `.planning/REQUIREMENTS.md` — PREFILL-06 (in scope), PREFILL-07 and PREFILL-08 (confirmed in scope per discussion despite "Future" label)
- `.planning/ROADMAP.md` — Phase 11 goal, success criteria, and pre-sketched plan outlines

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseStructuredFields(notes: string | null): Record<string, string>` in `extract/route.ts` — parse logic is correct and complete; extraction to shared util is mechanical
- `getInspectionPriorityFields(assetType)` — already used; returns field definitions with `key`, `label`, `inputType`, `options`
- `saveInspectionNotes` server action — handles DB write; no changes needed
- `FIELD_PLACEHOLDERS` record in `InspectionNotesSection` — unchanged

### Established Patterns
- Serialisation format: `key: value\n` lines + `Notes: freeform text` line — `parseStructuredFields` already handles this; key `Notes` is explicitly excluded from structured output
- Debounce pattern: `debounceRef` + `scheduleAutosave()` + `persistNotes()` — the unmount cleanup wraps the same `persistNotes()`
- Input fields are uncontrolled — `defaultValue` (not `value`) is the correct approach for restoring without converting to fully controlled

### Integration Points
- `InspectionNotesSection` receives `initialNotes: string | null` — this is the full `inspection_notes` string from the DB
- All restoration logic is localised to `InspectionNotesSection` — no changes needed in parent components or server components
- `parseStructuredFields` must move to a location importable by client components (not a route handler); `extract/route.ts` re-imports from the new location

</code_context>

<specifics>
## Specific Ideas

- STATE.md notes: "structuredValuesRef and notesRef must be seeded from parsed values at mount — display fix alone without ref seeding causes silent data loss on first autosave after reload" — this is confirmed in scope
- STATE.md notes: "Radix/Base UI Select: attempt defaultValue first; fall back to controlled value + useState if blank on hydration" — follow this order

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-pre-fill-value-restoration*
*Context gathered: 2026-03-21*
