# Pitfalls Research

**Domain:** Pre-fill value restoration — adding saved-value re-hydration to an existing form with uncontrolled inputs (Next.js 15 App Router / react-hook-form / Radix Select)
**Researched:** 2026-03-21
**Confidence:** HIGH (direct codebase inspection + verified against React, react-hook-form, and Radix UI official docs/issues)

---

## Critical Pitfalls

### Pitfall 1: Radix Select `defaultValue` Silently Ignored After First Mount

**What goes wrong:**
`InspectionNotesSection` currently uses `<Select onValueChange={...}>` with no `value` or `defaultValue` prop — fully uncontrolled. To restore a saved suspension type on reload, the natural fix is to add `defaultValue={parsedInitialValues['suspension']}`. This works on the first render when the component mounts with a value. But `defaultValue` is only read once at mount time — it is not reactive. If the component mounts before `parsedInitialValues` is available (e.g., because parsing runs in a `useEffect`), the Select will mount with no value and will not pick up `defaultValue` when it changes later. React and Radix both ignore `defaultValue` changes after the first render.

**Why it happens:**
Developers assume `defaultValue` behaves like a controlled `value` prop that re-triggers on state change. It does not. `defaultValue` is an initialiser, not a binding. Radix Select specifically checks for a `value` prop at mount to decide whether it is controlled or uncontrolled (MEDIUM confidence — confirmed via Radix UI issues #1223 and #3556). Passing `defaultValue={undefined}` at mount and then `defaultValue="Airbag"` after a re-render has no effect on the displayed value.

**How to avoid:**
Parse `initialNotes` synchronously — not in a `useEffect` — before the component's first render. Since `InspectionNotesSection` already receives `initialNotes` as a prop from the server-rendered `PhotosPage`, `parseStructuredFields(initialNotes)` can be called at the top of the component body (or in a `useMemo` with no async dependency). The parsed map is available synchronously before the first render, so `defaultValue={parsed['suspension']}` is correctly populated on mount. Do not use `useEffect` or async state to derive the initial values — the timing guarantees are not compatible with `defaultValue`.

**Warning signs:**
- Suspension select renders blank on reload even though `inspection_notes` in the database contains `suspension: Airbag`.
- Adding `console.log(defaultValue)` inside the Select component shows the correct string, but the rendered placeholder text still shows "Select suspension type".
- The bug disappears when you hard-refresh and reappears only when navigating back using client-side routing (a hint that the component re-mounts after the value is available in some paths but not all).

**Phase to address:** PREFILL-06 implementation phase. Decide the parsing strategy before writing any UI code — synchronous parse in component body is the only safe approach.

---

### Pitfall 2: Uncontrolled → Controlled Input Switching Warning

**What goes wrong:**
React throws "A component is changing an uncontrolled input to be controlled" when an `<Input>` or `<textarea>` starts without a `value` prop and later receives one, or vice versa. The current `<Input>` fields in `InspectionNotesSection` have no `value` or `defaultValue` — purely uncontrolled. Adding `defaultValue={parsedValues['odometer']}` keeps them uncontrolled (correct). But if the implementation accidentally passes `value={parsedValues['odometer']}` (a controlled pattern) or passes `value={undefined}` initially and later `value="187450"`, React will emit the warning and the input will behave inconsistently.

The controlled/uncontrolled boundary also applies to the existing `structuredValuesRef`. If the component is refactored to use `useState` for input values (to make them controlled), every field needs both `value` and `onChange` wired immediately — any field left with only `onChange` and no `value` will trigger the warning.

**Why it happens:**
Developers mix approaches: some fields get `value={state}` (controlled), others keep `onChange` only (uncontrolled). React's rule is binary per input lifetime — pick one and don't switch. The Radix Select component has a harder version of this: if `value` is passed as `undefined` on first render, Radix treats it as controlled with an undefined value. If `value` is later passed as a string, Radix switches modes — which is technically not an uncontrolled→controlled switch but causes visual and functional inconsistency (documented in Radix issue #3556).

**How to avoid:**
Use `defaultValue` (uncontrolled) for restoration, not `value`. The current architecture using refs (`structuredValuesRef`) for change tracking is compatible with `defaultValue` — no refactor to controlled state is needed. Do not introduce `useState` for input values unless the entire component is converted to a controlled pattern. If conversion to controlled is needed later (e.g., for programmatic reset), convert all fields at once and initialise every state value to an empty string `""` (not `undefined` or `null`) to avoid the uncontrolled-starts-undefined problem. `value={undefined}` → React treats it as uncontrolled. `value=""` → React treats it as controlled with an empty value.

**Warning signs:**
- React console warning: "A component is changing an uncontrolled input to be controlled."
- Input value flickers or resets to blank after initial population.
- Fields that restore correctly on first load lose their values after a state update elsewhere in the component.

**Phase to address:** PREFILL-06 implementation phase. Audit every input and select in `InspectionNotesSection` to confirm each uses either `value` (controlled) or `defaultValue` (uncontrolled), never both, and never switches.

---

### Pitfall 3: Stale Persisted Values Overriding Freshly Entered Data

**What goes wrong:**
`inspection_notes` in Supabase is the authoritative source for both pre-extraction values and the freeform notes textarea. The component's `persistNotes` function serialises `structuredValuesRef.current` and `notesRef.current` together and saves them on every keystroke (debounced to 500ms). If pre-fill restoration re-populates `structuredValuesRef.current` from parsed `initialNotes` on mount, and then the autosave fires before the user has a chance to change anything, the round-trip is harmless. But the failure mode is:

1. Staff opens asset, sees pre-filled values (odometer: 187450, suspension: Airbag).
2. Staff deletes the odometer value to correct it — the input is now empty.
3. Before the debounce fires, the staff navigates away (or the browser tab sleeps briefly and restores).
4. On return, `initialNotes` still contains `odometer: 187450` from the database — the deletion was not yet persisted.
5. The form re-populates with the stale value. The correction is silently lost.

This is a narrow race condition but the consequences in this domain are significant: a wrong odometer on an auction record is a business error.

**Why it happens:**
The 500ms debounce means there is always a window where in-progress changes have not been saved. If the component unmounts (navigation) within that window, the timeout is cleared and the save never fires. `clearTimeout` is not called on unmount in the current `InspectionNotesSection` — the debounce timer fires but if the component has unmounted, `saveInspectionNotes` is called against a React component that no longer exists. The Server Action itself will still execute (it is a server-side call), but the UI will not reflect its result.

**How to avoid:**
Two mitigations:
1. **Flush save on unmount:** Add a `useEffect` cleanup that calls `persistNotes()` synchronously (not debounced) when the component unmounts. This ensures in-progress changes are saved when navigating away. This is the most important mitigation.
2. **Confirm before navigation:** The CTA button ("Run AI Extraction") can be disabled with a brief "saving…" indicator while the debounce is pending, preventing navigation before the save completes. This is a UX enhancement, not strictly required.

The pre-fill restoration itself does not introduce this risk — it existed before. But restoration makes the bug more visible because the pre-filled values give the illusion that everything is saved.

**Warning signs:**
- Staff reports entering a value, navigating to extraction, and finding the extraction result does not include their value.
- The `inspection_notes` in the DB matches what was there before the edit, not what was typed.
- Values appear correct on-screen (because of `structuredValuesRef`) but are not in the server state.

**Phase to address:** PREFILL-06 implementation phase. Add unmount flush as part of the restoration implementation — this is the only phase where this code is being touched.

---

### Pitfall 4: Next.js App Router Hydration Mismatch from Parsed Restore Values

**What goes wrong:**
`PhotosPage` is a Server Component that passes `initialNotes` to `InspectionNotesSection` (a `'use client'` component). The server-rendered HTML will include the `defaultValue` of `<textarea>` (rendered as text content by React) but will not include the `defaultValue` of uncontrolled `<Input>` elements or Radix Select triggers — those are rendered as empty during SSR and populated client-side. This is the correct and expected behaviour for uncontrolled inputs with `defaultValue`. No hydration mismatch occurs here.

The hydration risk arises if the restoration logic is moved to client-side storage (localStorage/sessionStorage) instead of using the server-provided `initialNotes` prop. If a `useEffect` reads from localStorage and sets a state value that differs from the server-rendered HTML, React will report a hydration mismatch error ("Text content does not match server-rendered HTML").

**Why it happens:**
Developers sometimes add a "belt and suspenders" localStorage backup — "save to Supabase AND localStorage." If the localStorage value is read and rendered during the first client render pass, it will not match the empty string rendered by the server, causing a hydration error. `useEffect` access to localStorage avoids this (since `useEffect` runs only after hydration), but then the `defaultValue` timing problem (Pitfall 1) reappears.

**How to avoid:**
Do not add localStorage-based persistence for pre-fill restoration in this app. The server already provides `initialNotes` synchronously via the Supabase query in `PhotosPage`. The prop is available at mount time with no async gap, making localStorage redundant and its hydration interaction dangerous. Use the server prop as the single source of truth.

**Warning signs:**
- React console error: "Hydration failed because the initial UI does not match what was rendered on the server."
- Inputs flicker — they briefly show the wrong value before correcting.
- The error only appears on hard refresh, not on client-side navigation (a tell-tale sign of SSR/CSR mismatch, not a logic bug).

**Phase to address:** PREFILL-06 implementation phase. Explicitly decide: server prop only, no localStorage. Document this as a constraint in the plan.

---

### Pitfall 5: Supabase Realtime Conflicts Overwriting In-Progress Edits

**What goes wrong:**
This pitfall does not apply to the current codebase — there are no Supabase Realtime subscriptions in use anywhere in this app (confirmed by codebase search). The `inspection_notes` column is read once on page load (via server-side Supabase query) and written via the `saveInspectionNotes` Server Action. There is no live subscription that would push a remote change back into the UI and overwrite an in-progress edit.

**Why it happens (preventative note):**
If Supabase Realtime were added in a future phase (e.g., for multi-staff collaboration on an asset), a subscription to `assets` row changes would receive the write from `saveInspectionNotes` and potentially trigger a re-render with the newly saved value. If the component is controlled (`value={state}`) and the subscription updates state, the UI would reflect the saved value — which is correct. If the component is uncontrolled (`defaultValue`) and the subscription updates a prop, the UI would not change (since `defaultValue` is read-once). Neither case is dangerous today, but the architectural decision matters if Realtime is added.

**How to avoid:**
No action required for v1.2. If Realtime is added in a future phase, the session-level "don't overwrite dirty fields" pattern (check `isDirty` or a dirty timestamp before applying remote updates) must be implemented. Do not add Realtime to the `assets` table without a merge strategy for the `inspection_notes` column.

**Warning signs (future):**
- Two staff members open the same asset simultaneously; one's changes overwrite the other's with no merge.
- An autosave fires, the Realtime subscription receives the saved value, and the component state is reset to the just-saved value, discarding any further typing that happened in the 500ms debounce window.

**Phase to address:** Not applicable for v1.2. Flag as a constraint if Realtime is ever scoped.

---

### Pitfall 6: `parseStructuredFields` Key Format Mismatch — Serialised Key Differs From Schema Key

**What goes wrong:**
`InspectionNotesSection` serialises structured values as `key: value\n` where `key` is `field.key` from the schema (e.g., `suspension`, `odometer`, `registration_number`). The existing `parseStructuredFields` function in `extract/route.ts` parses these back by splitting on `': '`. This round-trip is currently used only for the extraction API prompt.

For pre-fill restoration, the same parse must be used to derive `defaultValue` for each input on mount. The critical constraint is that the serialisation key must exactly match the schema `field.key`. If any field's key contains a space, a colon, or if the serialisation format ever uses a different separator, the parse will silently fail — the value will not be extracted and the input will appear blank even though the database has the correct string.

Concretely: if a future schema field has `key: "registration number"` (with a space), the serialised line would be `registration number: 123ABC`. The parser's `line.indexOf(': ')` logic returns the correct split index, but `const key = line.slice(0, colonIdx).trim()` yields `"registration number"` — which will only match if the lookup uses `"registration number"` as the key. If the lookup uses `"registration_number"`, the value is silently dropped.

**Why it happens:**
The serialisation format (`key: value`) is an implicit contract between `InspectionNotesSection` (writer) and `parseStructuredFields` (reader). There is no type or schema validation on this serialised format. A schema key change, a copy-paste error, or a label accidentally used as the key would silently break restoration without any error.

**How to avoid:**
For v1.2 restoration, the lookup must use the exact same `field.key` values that were used to write the `inspection_notes` string. Since both sides use `field.key` from `getInspectionPriorityFields(assetType)`, this is already consistent — provided the schema keys are not changed. Add a comment in `InspectionNotesSection` explicitly naming `parseStructuredFields` as the companion function and noting that the serialisation format is a shared contract. A longer-term fix is to store pre-extraction values in a `pre_extraction_fields JSONB` column, removing the string serialisation entirely.

**Warning signs:**
- One field restores correctly; a neighbouring field does not — suggests a key mismatch for that specific field.
- `inspection_notes` in the DB shows `odometer: 187,450` (with a comma in the value containing a colon — e.g. a ratio like `axle: 4:2`) and the parser incorrectly splits on the first colon-space in the value rather than the key-value separator.
- Adding a new schema field with a key that already exists in `FIELD_PLACEHOLDERS` but was not in `getInspectionPriorityFields` previously causes unexpected parse output.

**Phase to address:** PREFILL-06 implementation phase. Validate the round-trip (write → parse → restore) with a unit test covering all priority fields across all asset types before shipping.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Parse `inspection_notes` string to restore values (no DB migration) | No schema change, no migration, no downtime | Brittle — format is an undocumented contract; colons in values can break the parser | MVP only if migration is blocked; JIRA/issue filed immediately |
| Keep `structuredValuesRef` (uncontrolled) instead of converting to useState (controlled) | Avoids full refactor; `defaultValue` restoration is simpler | Cannot programmatically reset or observe field values; harder to test | Acceptable until a reset-after-extraction feature is required |
| Restore only the freeform textarea `defaultValue` and leave structured fields blank | Zero risk, ships quickly | Staff re-enter structured values every time; defeats PREFILL-06 purpose | Never — partial restoration is worse than none (creates false confidence that state is saved) |
| Flush save on unmount only (no dirty-state indicator) | Simpler implementation | Staff see no visual confirmation that a save is pending; they may navigate away before flush and lose the last partial edit on extremely slow connections | Acceptable for v1.2 given internal, LAN-adjacent use |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Radix Select + defaultValue | Pass `defaultValue` derived from async state (useEffect) — Select has already mounted with undefined and ignores later changes | Parse `initialNotes` synchronously in component body; pass `defaultValue` before first render |
| react-hook-form + Radix Select | Use `reset()` to restore Select value — Radix Select does not respond to react-hook-form reset unless `Controller` wrapper is used | If using react-hook-form, wrap Select with `<Controller>` and use `value` prop; otherwise avoid react-hook-form for uncontrolled Selects |
| `saveInspectionNotes` Server Action | Component unmounts (navigation) within 500ms debounce window — in-progress changes not saved | Add `useEffect` cleanup that calls `persistNotes()` synchronously on unmount |
| `parseStructuredFields` (extract/route.ts) | Duplicate the parse logic in `InspectionNotesSection` rather than importing it | Import `parseStructuredFields` directly from `@/app/api/extract/route` (already exported) — same pattern used in `describe/route.ts` |
| Next.js SSR + uncontrolled inputs | Add localStorage read in render path — hydration mismatch | Use only the server-provided `initialNotes` prop; never localStorage for this feature |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-parsing `initialNotes` on every render | Imperceptible at current scale but wasteful | Wrap `parseStructuredFields(initialNotes)` in `useMemo([initialNotes])` | Not a concern at this scale — add `useMemo` as good practice, not optimisation |
| Autosave fires on every keystroke before debounce | Multiple simultaneous Supabase writes per second | Current 500ms debounce is correct — do not reduce it | If debounce is accidentally removed during refactor |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Pre-fill restoration reads `initialNotes` from props (server-rendered) without auth re-check | None — `PhotosPage` already enforces `user_id` RLS on the Supabase query before passing `initialNotes` | No additional auth check needed in `InspectionNotesSection`; the prop was already validated server-side |
| Storing pre-extraction values in localStorage | Client-side data leaks between users sharing a browser; ISO 27001 compliance concern | Do not use localStorage; Supabase is the only persistence layer |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Structured fields blank on reload while freeform textarea is populated | Staff assume structured values were not saved; re-enter them — potentially with different values that overwrite the correct saved data | Restore both structured inputs and textarea in the same implementation; never ship partial restoration |
| Select shows placeholder text on reload despite saved value | Staff believe the suspension type was not captured; re-select — triggering an autosave that overwrites any stale-but-correct value | Fix `defaultValue` timing (synchronous parse) before shipping |
| No visual indicator that values are being saved | Staff navigate away mid-save; lose changes with no warning | Flush save on unmount (Pitfall 3 mitigation); optionally show brief "saved" confirmation after debounce fires |
| Input `defaultValue` restores but `structuredValuesRef` is still empty at mount | First keystroke after reload triggers autosave with correct new value; but if staff click "Run Extraction" immediately without editing anything, `structuredValuesRef` is empty and autosave never fires — the values exist in `initialNotes` in the DB but are not in the ref, so the next autosave would clear them | Initialise `structuredValuesRef.current` from parsed values at mount, not just the input `defaultValue` — both must be seeded |

---

## "Looks Done But Isn't" Checklist

- [ ] **Select restore:** Navigate away from an asset with suspension type "Airbag" saved, return — Select trigger shows "Airbag", not the placeholder "Select suspension type".
- [ ] **Text input restore:** Navigate away from an asset with odometer 187450 saved, return — Input shows "187,450", not blank.
- [ ] **structuredValuesRef seeded:** After restore, immediately click "Run AI Extraction" without touching any field — verify `inspection_notes` saved to DB still contains `odometer: 187,450`, not an empty structured section.
- [ ] **Unmount flush:** Enter a new value, immediately click the browser Back button before 500ms elapses — reload the asset and verify the new value is present in the DB.
- [ ] **No hydration error:** Hard-refresh the photos page for an asset with saved structured values — verify no React hydration error in console.
- [ ] **Other notes textarea:** Verify the freeform "Other notes" textarea also restores correctly (it already has `defaultValue={initialNotes}` but `initialNotes` is the full serialised string including `key: value` lines — confirm the textarea does not show structured key lines; parse them out before setting textarea `defaultValue`).
- [ ] **No controlled/uncontrolled warning:** Open an asset with saved values and check the browser console — no "A component is changing an uncontrolled input to be controlled" warning.
- [ ] **Round-trip key correctness:** For every priority field across all asset types, verify the key used in serialisation matches the key used in the restore lookup.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Select defaultValue not restoring (async timing) | LOW | Move parse from useEffect to synchronous useMemo; no data migration needed |
| structuredValuesRef not seeded — next autosave clears DB values | MEDIUM | Add seed on mount; existing DB values not lost (still in `inspection_notes`) but user may have already triggered extraction with empty structured section; re-entry required |
| Unmount flush not implemented — race condition loses a correction | LOW | Add useEffect cleanup that calls persistNotes(); no data migration; affects only the race window |
| localStorage hydration mismatch shipped | LOW | Remove localStorage read; no data migration; fix is a deploy |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Radix Select defaultValue timing | PREFILL-06 | Navigate away, return — Select shows correct value, not placeholder |
| Uncontrolled → controlled switching | PREFILL-06 | No React controlled/uncontrolled warning in console |
| Stale values overriding corrections (unmount race) | PREFILL-06 | Edit → navigate away before 500ms → reload → DB has new value |
| Hydration mismatch from localStorage | PREFILL-06 | Hard refresh with saved values — no hydration error in console |
| Supabase Realtime conflicts | Not applicable v1.2 | N/A — no Realtime in use; flag if Realtime is scoped |
| parseStructuredFields key mismatch | PREFILL-06 | Unit test: round-trip write → parse → restore for all priority fields |
| structuredValuesRef not seeded | PREFILL-06 | Restore → immediately extract without edits → verify DB has correct structured values |
| Partial restoration (textarea only) | PREFILL-06 | Both structured inputs AND textarea pre-filled on reload |

---

## Sources

- Direct codebase inspection: `src/components/asset/InspectionNotesSection.tsx` (structuredValuesRef initialisation to `{}`, uncontrolled inputs, debounce without unmount flush), `src/app/api/extract/route.ts` (parseStructuredFields — exported, round-trip contract), `src/app/(app)/assets/[id]/photos/page.tsx` (server-side initialNotes prop delivery) — HIGH confidence
- React documentation on controlled vs uncontrolled inputs: `value` prop → controlled; `defaultValue` → uncontrolled read-once initialiser; switching between them is forbidden and triggers warning — HIGH confidence (React official docs)
- Radix UI Select issues: #1223 (wrong defaultValue in native select), #1569 (unable to clear to placeholder), #1808 (reset with react-hook-form fails), #3556 (controlled/uncontrolled switch on Tabs) — MEDIUM confidence (GitHub issues, not in official release notes)
- react-hook-form documentation: `defaultValues` are cached and not reactive; use `reset()` with new values for async-loaded data; `setValue` after `reset` can cause inconsistency — HIGH confidence (official react-hook-form docs and FAQ)
- Next.js hydration error documentation: browser-only APIs (localStorage, sessionStorage) must not be accessed during render; use `useEffect` for client-only state; `useEffect` timing is incompatible with `defaultValue` — HIGH confidence (Next.js official docs: `/docs/messages/react-hydration-error`)
- Codebase search confirming no Supabase Realtime subscriptions in this project — HIGH confidence (direct grep, zero results)

---

*Pitfalls research for: v1.2 pre-fill value restoration — prestige_assets / Slattery Auctions*
*Researched: 2026-03-21*
