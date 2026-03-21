# Project Research Summary

**Project:** Prestige Assets v1.2 — Pre-fill Value Restoration (PREFILL-06)
**Domain:** Pre-extraction form persistence and restoration — internal AI-powered asset data-capture tool (Next.js + Supabase)
**Researched:** 2026-03-21
**Confidence:** HIGH — all four research areas based on direct codebase analysis; no speculative assumptions

> Note: This file supersedes the v1.1 summary (2026-03-21). v1.1 is shipped and validated (phases 08, 09, 10 complete). This summary covers v1.2 PREFILL-06 only.

## Executive Summary

PREFILL-06 is a tightly scoped bug fix and restoration feature for `InspectionNotesSection`, an internal form component used by auction staff to capture structured asset data (VIN, odometer, suspension type, etc.) before AI extraction. The data is already being saved correctly to a single `inspection_notes text` column in Supabase using a `key: value\n` serialisation format. The bug is purely on the read side: the component does not parse `initialNotes` back into its structured inputs on mount, so fields appear blank on every reload. A companion bug causes the freeform "Other notes" textarea to display the entire serialised string (including structured key-value lines) instead of just the staff's freeform notes.

The recommended approach requires zero new dependencies and no database migrations. The fix involves three coordinated changes: (1) extracting the already-written `parseStructuredFields` function to a shared utility accessible by client components, (2) calling it synchronously in the `InspectionNotesSection` component body on mount to derive `parsedInitial` and `freeformInitial` maps, and (3) passing these values as `defaultValue` to text inputs, as `defaultValue` or controlled `value` to the Radix/Base UI Select, and as `defaultValue` to the textarea. The `structuredValuesRef` and `notesRef` refs must also be seeded from the parsed maps at mount — failing to do this causes a silent data-loss bug where the first autosave after reload overwrites all saved structured values with an empty object.

The main implementation risk is timing. Radix Select's `defaultValue` is read-once at mount — if parsing is deferred to a `useEffect`, the Select will mount with no value and will not recover. All parsing must happen synchronously in the component function body. A secondary risk is the existing 500ms debounce without an unmount flush: if staff navigate away mid-edit, in-progress changes are silently lost. Adding a `useEffect` cleanup that flushes `persistNotes()` on unmount is a required part of this implementation and should not be deferred — PREFILL-06 is the only planned code window to touch this component.

---

## Key Findings

### Recommended Stack

No new technology is introduced for v1.2. The entire fix operates within the existing stack. `parseStructuredFields` (already written and tested in `extract/route.ts`) is moved to `src/lib/utils/parseStructuredFields.ts`; a companion `extractFreeformNotes` function (5 lines) is added alongside it. React `defaultValue` handles text input restoration; a minimal `useState` handles the Radix/Base UI Select if `defaultValue` alone proves unreliable on hydration.

**Core technologies (all existing):**
- `inspection_notes text` (Supabase): Storage for all pre-extraction values — no schema change needed; data is already present and correctly saved
- `parseStructuredFields` (existing function, moved to shared lib): Pure parser from `"key: value\n"` string to `Record<string, string>` — already handles all edge cases including the `Notes:` freeform exclusion guard
- `extractFreeformNotes` (new companion function, ~5 lines): Extracts the value after `Notes: ` prefix for the freeform textarea `defaultValue`
- React `defaultValue` (React 19, existing): Sets initial DOM value for uncontrolled text inputs once on mount — compatible with the existing `onChange` → ref pattern; requires synchronous parse before first render
- React controlled `value` + `useState` (React 19, existing): Required for Radix/Base UI Select when initial value comes from a server-rendered prop if `defaultValue` risks a blank trigger on hydration timing differences

See `.planning/research/STACK.md` for the full per-file change table and version compatibility notes.

### Expected Features

**Must have (table stakes — all P1 for PREFILL-06):**
- Structured text inputs (`<Input>`) pre-populated on reload — staff should never re-enter VIN, odometer, etc. after saving them once
- Suspension `<Select>` pre-selected on reload — currently displays placeholder despite saved value being present in DB; primary visible symptom reported
- `structuredValuesRef` seeded from parsed values at mount — hidden correctness requirement; without this, the first autosave after reload silently erases all saved structured values even if inputs display correctly
- Freeform textarea shows only freeform notes portion — secondary display bug fixed as part of the same change; `notesRef` must also be initialised from freeform-only portion to prevent double-serialisation on next autosave

**Should have (add after validation):**
- Save failure inline error state — surface `saveInspectionNotes` errors to the user; currently fails silently

**Defer (v2+):**
- `pre_extraction_fields JSONB` column — eliminates the string serialisation contract entirely; only warranted if the parse approach proves fragile in practice (unlikely given app-controlled format)

See `.planning/research/FEATURES.md` for the full feature dependency graph, MVP checklist, and prioritisation matrix.

### Architecture Approach

The change is self-contained within five files: one new shared utility, three import-path updates (no logic change), and one component modification. No Server Components, no API routes, no database schema, and no new React component boundaries change. The architecture decision to keep data in the existing text column (rather than adding per-field columns) is explicitly supported: any new `inspectionPriority` fields added to the schema registry automatically participate in the round-trip without a migration.

**Files changed:**
1. `src/lib/utils/parseStructuredFields.ts` (new) — shared utility: `parseStructuredFields()` + `extractFreeformNotes()`
2. `src/components/asset/InspectionNotesSection.tsx` (modified) — synchronous parse on mount; `defaultValue` on inputs; Select fix; textarea fix; unmount flush
3. `src/app/api/extract/route.ts` (modified) — remove inline definition; import from shared lib
4. `src/app/api/describe/route.ts` (modified) — update import path
5. `src/__tests__/extract-route.test.ts` (modified) — update import path if test imports the function directly

**Unchanged:** Server Components, all Server Actions, all route handler logic, `ExtractionPageClient.tsx`, `inspection.actions.ts`, entire Supabase schema

See `.planning/research/ARCHITECTURE.md` for the current vs. target data flow diagrams, step-by-step build order, and the annotated system overview diagram.

### Critical Pitfalls

Full detail with warning signs, recovery steps, and verification checklists in `.planning/research/PITFALLS.md`.

1. **Radix Select `defaultValue` timing** — `defaultValue` is read-once at mount; if parsing runs in a `useEffect`, the Select mounts with no value and ignores all later changes. Parse `initialNotes` synchronously in the component body (or `useMemo`) before the first render — never in an effect.

2. **`structuredValuesRef` not seeded — silent data loss** — Adding `defaultValue` to inputs without also seeding `structuredValuesRef.current` means the first autosave after reload serialises an empty object, overwriting VIN, odometer, etc. already in the DB. Both the display props and the ref initialisation must be fixed together in the same commit.

3. **Unmount flush missing — race condition on navigation** — The existing 500ms debounce has no `useEffect` cleanup. Staff who navigate away within 500ms of an edit lose the change. Add a synchronous `persistNotes()` call in `useEffect` cleanup. This is a pre-existing bug that must be fixed in PREFILL-06 — it has no other planned implementation window.

4. **Uncontrolled → controlled switching warning** — Use `defaultValue` (uncontrolled) for text inputs. Do not pass `value={parsedValues[key]}` to inputs that currently have no `value` prop. For Radix Select: if using controlled `value`, initialise to `''` (never `undefined`) to remain unambiguously controlled throughout the component lifetime.

5. **`parseStructuredFields` key format contract** — Serialisation uses `field.key` verbatim as the line prefix; restoration must look up by the exact same key. A schema key change silently breaks restoration without any error or warning. Unit-test the round-trip across all priority fields before shipping.

---

## Implications for Roadmap

PREFILL-06 is a single focused milestone with a clear dependency order. The research points to one implementation phase with four sequential steps that should proceed in order to prevent broken intermediate states.

### Phase 1: Shared Utility Extraction

**Rationale:** `InspectionNotesSection` is a `'use client'` component that cannot import from a route handler. The shared utility must exist before the component can be updated. This step is a pure refactor with no behaviour change — safe to implement and verify in isolation before touching the UI.
**Delivers:** `src/lib/utils/parseStructuredFields.ts` with both `parseStructuredFields` and `extractFreeformNotes`; updated import paths in `extract/route.ts`, `describe/route.ts`, and the test file. All existing tests pass unchanged.
**Addresses:** Pitfall 5 (key format contract) — the shared utility becomes the single authoritative implementation, eliminating the risk of divergent copies
**Avoids:** Duplicating parse logic in the component (identified as a common mistake in integration gotchas)

### Phase 2: Component Restoration

**Rationale:** Depends on Phase 1. All four restoration requirements — text inputs, Select, textarea, ref seeding — must be implemented together. Partial restoration (e.g., textarea only) is explicitly worse than none: it creates false confidence that values are saved while silently allowing data loss on autosave.
**Delivers:** `InspectionNotesSection` fully restores all structured inputs and the freeform textarea on reload; `structuredValuesRef` and `notesRef` seeded correctly from parsed values; no console warnings
**Implements:** Synchronous `parseStructuredFields` + `extractFreeformNotes` calls at top of component body; `defaultValue` on all text `<Input>` fields; controlled `useState` on `<Select>` (or `defaultValue` if library honours it); `freeformInitial` on textarea; `parsedInitial` seeded into both refs
**Avoids:** Pitfalls 1 (Select timing), 2 (ref not seeded), 4 (controlled/uncontrolled switch)

**Decision required before implementation:** Test whether Base UI `<Select>` honours `defaultValue` correctly for server-rendered initial values in dev. If the trigger renders correctly → use `defaultValue` (simpler). If blank → switch to controlled `value` + `useState`. The fallback path is fully designed in STACK.md and ARCHITECTURE.md; it is a two-line change.

### Phase 3: Unmount Flush

**Rationale:** Can be in the same PR as Phase 2, but called out separately because it addresses a distinct pre-existing race condition rather than the restoration display bug. It must not be deferred — PREFILL-06 is the only planned code window for `InspectionNotesSection`.
**Delivers:** `useEffect` cleanup that calls `persistNotes()` synchronously on unmount; in-progress edits no longer silently lost on fast navigation
**Avoids:** Pitfall 3 (stale value race / data loss on unmount)

### Phase 4: Test Coverage

**Rationale:** The `parseStructuredFields` key format is an implicit contract. Unit tests validate the round-trip across all asset types and field keys, providing a regression barrier if schema keys change in future phases.
**Delivers:** Unit tests: `parseStructuredFields(serialised)` recovers each field key correctly for all priority fields across all asset types; `extractFreeformNotes` edge cases covered (no Notes line, empty Notes value)
**Addresses:** Pitfall 5 (key mismatch); provides ongoing confidence in the text-column approach as the schema registry grows

### Phase Ordering Rationale

- Phase 1 must precede Phase 2 because the client component cannot import from a route handler — this is a hard dependency
- Phases 2 and 3 can be implemented in a single PR; separating them conceptually ensures the unmount flush is treated as mandatory, not optional
- Phase 4 should be in the same PR as Phases 2–3 — tests should be written before the PR is merged, not as a follow-up
- The entire milestone is one logical PR: 1 new file, 4 modified files, 0 migrations, 0 new dependencies

### Research Flags

Phases with standard patterns (no deeper research needed):
- **All phases:** Patterns are fully established from direct codebase analysis. React `defaultValue`, Next.js Server Component prop threading, and Server Action autosave patterns are all well-documented and verified in existing code.

Phases that need one validation point during implementation:
- **Phase 2 (Select restoration):** Verify Base UI `<Select>` `defaultValue` behaviour with a server-rendered initial value in dev before finalising the approach. STACK.md provides the controlled fallback (Option B). This is a one-decision point, not a research gap.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct codebase analysis; all files verified; zero new dependencies means zero version compatibility uncertainty |
| Features | HIGH | Problem is precisely specified in PROJECT.md as a deliberate v1.2 deferral; scope is unambiguous; all field keys verified against live schema files |
| Architecture | HIGH | All integration points verified from source; import constraint (route handler not importable by client component) is a hard fact; build order is provably correct |
| Pitfalls | HIGH (4 of 5 critical) / MEDIUM (Radix Select defaultValue sub-case) | React controlled/uncontrolled and unmount behaviour are stable guarantees; Radix Select `defaultValue` edge case documented via GitHub issues, not official release notes — hence MEDIUM for that specific sub-case only |

**Overall confidence:** HIGH

### Gaps to Address

- **Radix/Base UI Select `defaultValue` vs controlled:** STACK.md recommends controlled `value` + `useState` as the safe default. ARCHITECTURE.md suggests attempting `defaultValue` first. Test in dev during Phase 2 implementation. If the trigger renders the saved value correctly → use `defaultValue` (simpler). If blank → switch to controlled. The fallback path is already fully designed; no additional research needed.

- **`extractFreeformNotes` edge cases:** Function is straightforward (~5 lines) but should be verified against: (a) assets where `inspection_notes` has no `Notes:` line — must return `''`; (b) `Notes: ` with empty value — must return `''`; (c) assets where freeform notes themselves contain `Notes:` mid-text — confirm split behaviour. Write these as explicit unit test cases in Phase 4.

---

## Sources

### Primary (HIGH confidence)
- `src/components/asset/InspectionNotesSection.tsx` — uncontrolled inputs, `structuredValuesRef` initialisation to `{}`, `persistNotes` serialisation format, `notesRef` initialisation, debounce without unmount flush
- `src/app/api/extract/route.ts` — `parseStructuredFields` function confirmed exported and round-trip correct
- `src/lib/actions/inspection.actions.ts` — `inspection_notes text` column confirmed; write path serialisation confirmed
- `src/app/(app)/assets/[id]/extract/page.tsx` — Server Component already selects and passes `inspection_notes`
- `src/components/asset/ExtractionPageClient.tsx` — prop threading to `InspectionNotesSection` as `initialNotes` confirmed; hide-on-success confirmed
- `src/app/(app)/assets/[id]/photos/page.tsx` — Server Component passes `initialNotes` confirmed
- `supabase/migrations/20260318000003_extraction.sql` — `inspection_notes text` column; no JSONB structured fields column
- `.planning/PROJECT.md` — PREFILL-06 explicitly deferred from v1.1; scope confirmed
- React official documentation — `defaultValue` sets initial uncontrolled value once at mount; switching controlled/uncontrolled is forbidden and triggers warning
- Next.js official documentation — hydration error docs; `useEffect` for client-only state; server component prop serialisation

### Secondary (MEDIUM confidence)
- Radix UI GitHub issues #1223, #1569, #1808, #3556 — Select `defaultValue` edge cases on hydration; controlled/uncontrolled switch behaviour
- `@base-ui/react ^1.3.0` release notes — controlled `value` prop for Select supported; `onValueChange` callback signature

### Tertiary (LOW confidence — no action required)
- Supabase Realtime conflict patterns — not applicable to v1.2; no Realtime subscriptions in codebase (confirmed by grep, zero results); noted only as a constraint if Realtime is ever scoped in a future phase

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
