# Feature Research

**Domain:** Pre-fill value restoration — in-progress form persistence for internal inspection tool
**Researched:** 2026-03-21
**Confidence:** HIGH (direct codebase analysis of all relevant files; established React patterns)

> Supersedes v1.1 feature research. All v1.1 features are shipped and validated.
> This file covers v1.2 PREFILL-06 only.

---

## Context: The Exact Problem

`InspectionNotesSection` renders type-specific structured fields (VIN, Odometer, Hourmeter,
Suspension Type select, Unladen Weight, Length, etc.) plus a freeform "Other notes" textarea.

On every user input, the component serialises all values into a single `inspection_notes` text
string in Supabase via a 500ms debounce autosave. The serialisation format is:

```
vin: 1HGCM82633A123456
odometer: 187,450
suspension: Air
Notes: full log books, 3 keys
```

On page load, this string is fetched server-side and passed to the component as `initialNotes`.

**What works:** The freeform `<textarea>` uses `defaultValue={initialNotes ?? ''}` — it displays
the entire raw string on reload (including structured lines — a secondary bug).

**What breaks:** The structured `<Input>` and `<Select>` fields have no `defaultValue` or `value`
prop. They start blank on every page load regardless of what `initialNotes` contains.
`structuredValuesRef` is initialised to `{}` — so the first autosave after reload overwrites the
persisted notes string with only whatever fields the user re-types, silently dropping the rest.

This is a deliberate deferral: PROJECT.md key decisions — "Select uncontrolled in
InspectionNotesSection (no value/defaultValue) (Phase 9): Re-hydration deferred to v1.2 (PREFILL-06)".

---

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Structured field inputs pre-populated on reload | Staff enter VIN and odometer during on-site inspection, navigate away, return — values must be there. Re-entry wastes time and risks transcription errors on a second attempt. The data is already in Supabase; the component just fails to read it back. | LOW | Parse `initialNotes` into `{ [fieldKey]: string }` at component mount. Pass parsed value as `defaultValue` to each `<Input>`. Known field keys come from `getInspectionPriorityFields(assetType)` — no guessing required. |
| Suspension select pre-selected on reload | The suspension `<Select>` shows its placeholder ("Select suspension type") even when a value has been saved. Same root cause as text inputs — no `defaultValue` prop. | LOW | Same parse step; pass `defaultValue={parsedValues['suspension']}` to `<Select>`. `undefined` when no stored value leaves the placeholder intact. Base UI Select accepts `defaultValue` for uncontrolled pre-selection. |
| `structuredValuesRef` seeded from parsed values on mount | This is the correctness requirement hidden behind the display requirement. If only `defaultValue` props are added without seeding the ref, the first autosave after reload will serialise only the newly modified field plus an empty object for all others — silently erasing the persisted VIN, odometer, etc. | LOW | Initialise `structuredValuesRef.current` to the parsed map at mount, before any user interaction. One line change to the ref initialisation. |
| Freeform textarea shows only the freeform portion | Currently `defaultValue={initialNotes ?? ''}` shows the entire raw string including structured lines like "vin: 1HGCM...". Staff see their free notes mixed with serialised key-value pairs. | LOW | Extract the "Notes: ..." suffix from `initialNotes` when present; use only that portion for textarea `defaultValue`. When no "Notes:" line exists, textarea is empty. `notesRef.current` must also be initialised from the extracted portion (not the full string) or the next autosave re-introduces the structured lines as freeform text. |

### Differentiators (Competitive Advantage)

This is an internal tool with one user group. Competitive differentiation is not applicable.
The value is reliability: staff should never re-enter data they have already entered.

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Migrate to a `pre_fill_fields` JSONB column | Dedicated column makes parse/restore trivial and eliminates fragility in the `key: value` format | New Supabase migration + update to `saveInspectionNotes` + update to all call sites that read inspection notes in `/api/extract` and `/api/describe`. High blast radius for a problem already solvable by parsing known field keys from the existing string. | Parse only known field keys from the existing format. The format is controlled entirely by the app, so the only keys that appear are the ones `InspectionNotesSection` serialises. |
| Switch structured fields from uncontrolled to controlled (`useState`) | Seems cleaner; enables programmatic clear/reset | Forces a re-render per keystroke × N fields. The ref-based approach is a deliberate v1.1 decision (PROJECT.md). Switching requires reconciling `notesRef` / `structuredValuesRef` architecture. | Keep ref-based approach; add `defaultValue` only. No controlled state needed for restore. |
| Auto-save success indicator ("Saved" toast) | Reassures users data is being persisted | Constant UI noise on a 500ms debounce. Internal tool. | Show an error state only on `saveInspectionNotes` returning `{ error }`. Do not add per-save success feedback. |
| Clear-fields button | "Start over" option | Uncontrolled inputs cannot be cleared without a React `key` remount trick. Adding it requires controlled state or an unmount/remount. Staff can overtype existing values. | Not needed. Staff overtype to correct. |
| Restore structured field values post-extraction | Staff might want to see what they entered while reviewing extraction results | `InspectionNotesSection` is intentionally hidden when `status === 'success'` in `ExtractionPageClient`. Structured values are already baked into the extracted Salesforce fields. Showing stale pre-extraction values alongside extraction results creates confusion ("did the AI use these?"). | Keep existing hide-on-success behaviour. |

---

## Feature Dependencies

```
[Parse initialNotes → { [fieldKey]: string } map]
    └──required by──> [defaultValue on each <Input>]
    └──required by──> [defaultValue on <Select>]
    └──required by──> [Seed structuredValuesRef.current at mount]

[Seed structuredValuesRef.current at mount]
    └──required for──> [Correct autosave on first keystroke after reload]
                           Without this: first save drops all unmodified persisted fields.
                           This is a silent data-loss bug, not just a display issue.

[Extract freeform "Notes: ..." suffix from initialNotes]
    └──required for──> [Textarea defaultValue shows only freeform text]
    └──required for──> [notesRef.current initialised correctly]
                           Without this: first autosave after reload re-introduces structured
                           lines into the freeform notes portion of the serialised string,
                           producing double-serialisation on next autosave.

[getInspectionPriorityFields(assetType)]
    └──provides──> [Known field keys for targeted parse]
                       Limits parse to keys the component actually renders.
                       Prevents ambiguous "key: value" lines in freeform notes
                       from being misread as structured fields.
```

### Dependency Notes

- **Parse must happen before render.** The parsed map must be available before `structuredValuesRef` is assigned and before JSX is returned. A `useMemo` or inline calculation at the top of the component body is correct. `useEffect` is wrong — it runs after render, so the first paint would still show empty inputs.

- **Known-key parse is safer than regex.** Only parse lines whose key matches a field key returned by `getInspectionPriorityFields(assetType)`. Do not attempt to parse all `key: value` lines generically — staff freeform notes may contain colons (e.g. "Condition: good").

- **Both surfaces are covered by one fix.** `InspectionNotesSection` is rendered on both the photos page (`/assets/[id]/photos`) and the extract page (`/assets/[id]/extract`) pre-extraction. Both pass `initialNotes` from the server. One fix to the component covers both surfaces.

- **Post-extraction surface is unchanged.** The extract page hides `InspectionNotesSection` when `status === 'success'`. No restoration behaviour is needed for the post-extraction state.

---

## MVP Definition

### v1.2 Launch With (this milestone)

- [ ] **Parse `initialNotes` into known-key value map at component mount** — the foundation for all other restore behaviour
- [ ] **Pass parsed value as `defaultValue` to each `<Input>`** — structured text fields display their persisted values on load
- [ ] **Pass parsed value as `defaultValue` to `<Select>`** — suspension type (and any future select fields) display their persisted selection on load
- [ ] **Seed `structuredValuesRef.current` from parsed map** — prevents silent data loss on first autosave after reload
- [ ] **Extract freeform suffix for textarea `defaultValue` and `notesRef` init** — fixes secondary display bug where textarea showed serialised key-value lines; prevents double-serialisation

### Add After Validation

- [ ] **Save failure inline error** — surface `saveInspectionNotes({ error })` to the user. Low priority; the connection is reliable, but an error state is better than silent failure.

### Future Consideration (v2+)

- [ ] **`pre_fill_fields` JSONB column** — only if the parse approach proves fragile in practice. The current format is app-controlled, so fragility is unlikely. Add only if evidence of real bugs emerges.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Text input defaultValue on reload | HIGH — primary reported gap; staff re-enter VIN, odometer every time | LOW — parse + prop | P1 |
| Select defaultValue on reload | HIGH — suspension is common; shows placeholder when value exists | LOW — same parse, pass to Select | P1 |
| Seed structuredValuesRef | HIGH — silent correctness bug; data loss without it | LOW — one-line initialisation change | P1 |
| Freeform textarea freeform-only defaultValue | MEDIUM — visible bug but textarea content is functional despite noise | LOW — extract Notes: suffix | P1 (same task, negligible added cost) |
| Save failure error state | LOW — infra is reliable | LOW | P3 |

**Priority key:**
- P1: Must have — directly addresses PREFILL-06
- P2: Should add when possible
- P3: Defer until evidence of need

---

## Existing Workflow Integration

Restoration sits entirely within the pre-extraction phase:

```
Photos page (/assets/[id]/photos)
  Server Component: loads asset.inspection_notes from Supabase
  InspectionNotesSection receives initialNotes
      RESTORATION NEEDED HERE — structured fields must pre-populate
      |
      v (user clicks "Go to Extraction")

Extract page (/assets/[id]/extract)
  Server Component: loads asset.inspection_notes
  ExtractionPageClient passes as inspectionNotes prop
  InspectionNotesSection receives initialNotes (pre-extraction state)
      ALSO BENEFITS FROM FIX — same component, same initialNotes prop
      |
      v (user clicks "Run Extraction")

  InspectionNotesSection HIDDEN (status === 'success')
      No restoration needed post-extraction.
      |
      v

Review page (/assets/[id]/review)
  Structured pre-fill values are already in Salesforce fields output.
  InspectionNotesSection does not render here.
```

The fix is entirely self-contained within `InspectionNotesSection.tsx`. No changes to server
pages, no changes to database schema, no changes to API routes.

---

## Sources

- Direct codebase read: `src/components/asset/InspectionNotesSection.tsx` — uncontrolled inputs, `structuredValuesRef` initialisation, `persistNotes` serialisation format, `notesRef` initialisation
- Direct codebase read: `src/lib/actions/inspection.actions.ts` — single `inspection_notes` text column confirmed, no structured storage
- Direct codebase read: `src/app/(app)/assets/[id]/photos/page.tsx` — server-side load of `asset.inspection_notes`, passed as `initialNotes`
- Direct codebase read: `src/components/asset/ExtractionPageClient.tsx` — `inspectionNotes` prop passed to `InspectionNotesSection`; hide-on-success behaviour confirmed
- PROJECT.md key decisions: "Select uncontrolled in InspectionNotesSection (no value/defaultValue) (Phase 9): Re-hydration deferred to v1.2 (PREFILL-06)" — confirms scope and intent
- React documentation pattern: uncontrolled inputs accept `defaultValue` for initial render without becoming controlled components; this is the standard pattern for restore-on-load without continuous re-render

---
*Feature research for: Prestige Assets v1.2 — Pre-fill Value Restoration (PREFILL-06)*
*Researched: 2026-03-21*
