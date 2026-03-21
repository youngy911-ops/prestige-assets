# Architecture Research

**Domain:** AI-powered internal data-capture web app (Next.js + Supabase)
**Researched:** 2026-03-21 (updated for v1.2 Pre-fill Restoration)
**Confidence:** HIGH — based on direct codebase analysis; all integration points verified from source

---

## v1.2 Integration Points — Pre-fill Value Restoration (PREFILL-06)

This section is the primary focus of the v1.2 research. The base architecture and v1.1 changes are stable and documented below. The new work touches a small, well-defined set of files.

---

### Problem Statement

`InspectionNotesSection` already saves structured field values to `assets.inspection_notes` correctly. When the extract page reloads, `initialNotes` (the full structured string) is passed to the component as a prop. However:

1. All `<Input>` fields render with no `defaultValue` — they are blank on reload.
2. The `<Select>` (Suspension Type) has no `value` or `defaultValue` — it is blank on reload.
3. The `<textarea>` (Other notes) receives `defaultValue={initialNotes}` — the **entire** structured string, including `vin: ...`, `odometer: ...` lines, not just the freeform notes portion.
4. `structuredValuesRef.current` initialises as `{}` — if staff reload without making changes, a subsequent autosave would erase all previously stored structured values.

The data is in Supabase and already reaching the component. The bug is purely in the component's failure to parse and distribute it to the correct inputs on mount.

---

### Persistence Decision: Keep `inspection_notes text` Column

**No migration required.** Use the existing column as-is.

Rationale:

- `parseStructuredFields()` already exists in `extract/route.ts`. It splits `"key: value\n"` lines into `Record<string, string>`. Moving it to a shared location and calling it from `InspectionNotesSection` is all that is needed.
- Adding separate columns (`inspection_vin`, `inspection_odometer`, etc.) would require: a migration, changes to `saveInspectionNotes`, changes to all `parseStructuredFields` callers, and new SELECT columns in `ExtractPage`. That is eight touch points for zero user-visible benefit.
- The serialisation format is already correct. The round-trip `save → reload → parse → re-save` produces an identical string, so the extraction prompt is unaffected.
- The `Notes:` line (freeform textarea) is already excluded from structured field parsing via the `key === 'Notes'` guard. This boundary is stable.

---

### Current (broken) Data Flow

```
Supabase: inspection_notes = "vin: 1HGCM82633A123456\nodometer: 187450\nsuspension: Airbag\nNotes: 48\" sleeper"
    ↓
ExtractPage (Server): SELECT inspection_notes → prop: inspectionNotes = raw string
    ↓
ExtractionPageClient: passes as initialNotes to InspectionNotesSection
    ↓
InspectionNotesSection:
  - notesRef.current       = raw string (FULL structured string — wrong)
  - structuredValuesRef    = {}          (empty — values lost)
  - <Input vin>            → no defaultValue → blank
  - <Input odometer>       → no defaultValue → blank
  - <Select suspension>    → no value/defaultValue → blank
  - <textarea Other notes> → defaultValue={raw string} → shows serialisation format
```

### Target (correct) Data Flow

```
Supabase: inspection_notes = "vin: 1HGCM82633A123456\nodometer: 187450\nsuspension: Airbag\nNotes: 48\" sleeper"
    ↓
ExtractPage (Server): SELECT inspection_notes → prop: inspectionNotes = raw string
    ↓
ExtractionPageClient: passes as initialNotes to InspectionNotesSection
    ↓
InspectionNotesSection (synchronous, in component function body):
  - parsedMap = parseStructuredFields(initialNotes)
    → { vin: "1HGCM82633A123456", odometer: "187450", suspension: "Airbag" }
  - freeformNotes = extractFreeformNotes(initialNotes)
    → "48\" sleeper"
  - notesRef.current       = freeformNotes (correct — only freeform)
  - structuredValuesRef    = parsedMap     (correct — pre-populated)
  - <Input vin>            → defaultValue="1HGCM82633A123456"
  - <Input odometer>       → defaultValue="187450"
  - <Select suspension>    → defaultValue="Airbag" (or controlled)
  - <textarea Other notes> → defaultValue="48\" sleeper"
    ↓
Staff triggers extraction without changes → structuredValuesRef already populated
persistNotes() → same "key: value\n..." string → correct AI prompt (unchanged)
```

---

### What Needs to Change

#### 1. Extract `parseStructuredFields` to a shared utility

**Current location:** `src/app/api/extract/route.ts` (exported, already imported by `describe/route.ts`).

**Problem:** `InspectionNotesSection` is a `'use client'` component. It cannot import from a route handler. The parser must move to a client-accessible location.

**Action:** Create `src/lib/utils/parseStructuredFields.ts`. Move the existing 12-line function there. Add a companion `extractFreeformNotes(notes: string | null): string` helper that extracts the value after the `Notes: ` prefix.

Update import paths:
- `src/app/api/extract/route.ts` — remove inline definition, add import
- `src/app/api/describe/route.ts` — update import path
- `src/__tests__/extract-route.test.ts` — update import path if the test imports `parseStructuredFields` directly

No behaviour change. Pure refactor.

#### 2. Parse `initialNotes` in `InspectionNotesSection` on mount

At the top of the component function body (synchronous, before render):

```typescript
const parsedInitial = parseStructuredFields(initialNotes)
const freeformInitial = extractFreeformNotes(initialNotes)
```

Initialise refs with parsed values:
```typescript
const structuredValuesRef = useRef<Record<string, string>>(parsedInitial)
const notesRef = useRef<string>(freeformInitial)
```

These are `useRef` initialisations — they run once on mount. No `useEffect` needed.

#### 3. Add `defaultValue` to `<Input>` fields

```tsx
<Input
  defaultValue={parsedInitial[field.key] ?? ''}
  onChange={(e) => handleStructuredChange(field.key, e.target.value)}
/>
```

Uncontrolled with `defaultValue` — correct pattern for the debounced-autosave flow. `defaultValue` sets the initial DOM value once; `onChange` keeps the ref in sync.

#### 4. Restore `<Select>` (Suspension Type)

The `<Select>` component has no `value` or `defaultValue`. Two approaches:

**Option A — `defaultValue` prop (attempt first):** Pass `defaultValue={parsedInitial[field.key] ?? undefined}` to `<Select>`. The Base UI / Radix Select component supports `defaultValue` for uncontrolled initialisation. If the library honours it, no state is required.

**Option B — controlled with local state (fallback):** If the library does not honour `defaultValue` visually, add `useState` for select fields only:

```typescript
const [selectValues, setSelectValues] = useState<Record<string, string>>(() =>
  Object.fromEntries(
    priorityFields
      .filter(f => f.inputType === 'select')
      .map(f => [f.key, parsedInitial[f.key] ?? ''])
  )
)
```

Then pass `value={selectValues[field.key]}` to `<Select>` and update both `selectValues` and `structuredValuesRef` on change. This is the minimal controlled-state surface: only select fields, lazily initialised.

Only one select field exists across all asset types (Suspension Type on Truck/Trailer), so the state cost is minimal either way.

#### 5. Fix `<textarea>` `defaultValue`

Change from:
```tsx
defaultValue={initialNotes ?? ''}
```
to:
```tsx
defaultValue={freeformInitial}
```

---

### Integration Points

#### Modified: New File

| File | Change | Purpose |
|------|--------|---------|
| `src/lib/utils/parseStructuredFields.ts` | **New** | Shared parser: `parseStructuredFields()` + `extractFreeformNotes()` |

#### Modified: Existing Files

| File | Change | What Changes |
|------|--------|--------------|
| `src/components/asset/InspectionNotesSection.tsx` | **Modified** | Parse initialNotes on mount; add defaultValue to inputs; fix Select; fix textarea |
| `src/app/api/extract/route.ts` | **Modified** | Remove inline `parseStructuredFields`; import from shared lib |
| `src/app/api/describe/route.ts` | **Modified** | Update import path for `parseStructuredFields` |
| `src/__tests__/extract-route.test.ts` | **Modified** | Update import path if test imports `parseStructuredFields` directly |

#### Unchanged

| File | Reason |
|------|--------|
| `src/lib/actions/inspection.actions.ts` | Save path is correct; no changes |
| `src/app/(app)/assets/[id]/extract/page.tsx` | Already selects and passes `inspection_notes` |
| `src/components/asset/ExtractionPageClient.tsx` | Already passes `inspectionNotes` prop |
| Supabase schema / all migrations | No new columns; existing column is sufficient |
| `/api/extract` prompt building | Reads from DB at extraction time; unaffected |

---

### Build Order

```
Step 1: Create src/lib/utils/parseStructuredFields.ts
        — move parseStructuredFields()
        — add extractFreeformNotes()
        — no callers updated yet (both exports exist in original location still)

Step 2: Update route imports (independent, parallel)
        2a. extract/route.ts — remove inline fn, import from shared lib
        2b. describe/route.ts — update import path
        2c. extract-route.test.ts — update import path

Step 3: Update InspectionNotesSection.tsx
        3a. Import parseStructuredFields + extractFreeformNotes
        3b. Compute parsedInitial + freeformInitial at top of component
        3c. Initialise structuredValuesRef and notesRef with parsed values
        3d. Add defaultValue to all <Input> fields
        3e. Add defaultValue (or value) to <Select>
        3f. Fix <textarea> defaultValue to freeformInitial

Step 4: Verify in dev — load existing asset with inspection_notes, confirm restore
```

Steps 2a–2c are independent of each other. Step 3 depends on Step 1 being complete. The total change is 1 new file + 4 modified files. No migration, no new dependencies, no new components.

---

### System Overview (v1.2)

```
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER (Client)                                                    │
│                                                                      │
│  InspectionNotesSection (MODIFIED for v1.2)                         │
│    ├── parseStructuredFields(initialNotes) ← NEW: shared lib call   │
│    ├── extractFreeformNotes(initialNotes)  ← NEW: shared lib call   │
│    ├── structuredValuesRef = parsedInitial ← FIXED: was always {}   │
│    ├── notesRef = freeformInitial          ← FIXED: was full string  │
│    ├── <Input defaultValue={parsedInitial[key]} /> ← FIXED: restored│
│    ├── <Select defaultValue={parsedInitial[key]} /> ← FIXED: restored│
│    └── <textarea defaultValue={freeformInitial} /> ← FIXED: freeform│
│                                                                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Server Action (debounced 500ms, unchanged)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NEXT.JS SERVER                                                      │
│                                                                      │
│  src/lib/utils/parseStructuredFields.ts ← NEW shared utility        │
│    — parseStructuredFields(notes) → Record<string, string>          │
│    — extractFreeformNotes(notes) → string                           │
│                                                                      │
│  extract/route.ts — imports from shared lib (MODIFIED import only)  │
│  describe/route.ts — imports from shared lib (MODIFIED import only) │
│                                                                      │
│  ExtractPage (Server Component) — UNCHANGED                         │
│    SELECT inspection_notes → prop to ExtractionPageClient           │
│                                                                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SUPABASE — UNCHANGED                                                │
│  assets.inspection_notes text — existing column, no migration        │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Anti-Patterns to Avoid (v1.2 specific)

#### Anti-Pattern: Adding per-field database columns

**What goes wrong:** Adding `inspection_vin text`, `inspection_odometer integer`, `inspection_suspension text` columns to `assets`.

**Why wrong:** Requires migration + changes to 5+ callers. The structured text format already handles this generically and will accommodate any future `inspectionPriority` fields without schema changes.

**Do instead:** Parse `inspection_notes` on read via the shared utility.

#### Anti-Pattern: Passing raw `initialNotes` to textarea `defaultValue`

**What goes wrong:** `<textarea defaultValue={initialNotes} />` — the current bug. Staff see the serialisation format (`vin: ...\nodometer: ...`) in the freeform textarea, not their own notes.

**Do instead:** Extract only the freeform notes portion (value after `Notes: ` prefix) and pass that as `defaultValue`.

#### Anti-Pattern: Controlled state for all inputs to support restore

**What goes wrong:** Converting every `<Input>` to controlled (`value={state[key]}`) to support initial value display. Causes re-renders on every keystroke.

**Do instead:** Use `defaultValue` for text/number inputs (uncontrolled). Use controlled state only for `<Select>` fields if the library requires it (and only for the select fields).

#### Anti-Pattern: `useEffect` to fetch inspection_notes client-side

**What goes wrong:** Adding a `useEffect` that calls Supabase from the browser to reload `inspection_notes`.

**Why wrong:** `initialNotes` is already passed as a prop from the Server Component. A client fetch duplicates the data load, adds latency, and is unnecessary.

**Do instead:** Parse the `initialNotes` prop synchronously in the component function body. No effect needed.

---

## v1.1 Integration Points (reference)

*(Preserved for context — implemented and shipped 2026-03-21)*

### 1. Pre-Extraction Structured Input Fields

Schema files for Truck, Trailer, Forklift, Caravan had `inspectionPriority: true` added to target fields. `extract/route.ts` was updated to parse structured fields from `inspection_notes` and pass them to `buildUserPrompt()` as authoritative overrides (Option A from the research recommendation).

### 2. Notes-to-Description Fidelity

`buildDescriptionUserPrompt()` in `describe/route.ts` was updated to label freeform notes as authoritative. A "Staff-provided values (use verbatim)" block was added. Belt-and-suspenders approach: system prompt rule + structured user prompt block. Runtime-verified in production.

### 3. Session Auth Bug

`middleware.ts` fixed: removed `supabaseResponse = NextResponse.next({ request })` from inside the `setAll` callback. Session cookie refresh now propagates correctly.

---

## Existing Architecture (stable, for reference)

### Server Actions vs Route Handlers

**Server Actions (`'use server'`):** All DB mutations — create asset, save fields, save inspection notes, reorder photos. Form-adjacent mutation operations.

**Route Handlers (POST):** `/api/extract` and `/api/describe`. Both are long-running (~5-15 seconds) AI calls unsuitable for Server Actions (which are queued/sequential).

### Supabase Client Patterns

Two distinct clients. Using the wrong one causes auth failures.

```typescript
// lib/supabase/client.ts — use in 'use client' components only
import { createBrowserClient } from '@supabase/ssr'

// lib/supabase/server.ts — use in Server Components, Actions, Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
```

### Schema Registry

Static TypeScript in `lib/schema-registry/`. Per-type field definitions with `key`, `label`, `sfOrder`, `inputType`, `aiExtractable`, `aiHint`, `inspectionPriority`, `required`. The registry is the single source of truth for field rendering, AI extraction, Salesforce output ordering, and structured input display.

### JSONB Fields Storage

`assets.fields` is a `jsonb` column storing `Record<string, string>` keyed by `FieldDefinition.key`. No per-field columns. `assets.inspection_notes` is `text` storing the `"key: value\n"` structured format. `assets.extraction_result` is `jsonb` storing the full AI output object.

### Route Structure

```
app/
├── (auth)/login/page.tsx         — public
├── (app)/
│   ├── layout.tsx                — Server Component, auth check + BottomNav
│   ├── page.tsx                  — Asset list
│   └── assets/
│       ├── new/page.tsx          — create flow
│       └── [id]/
│           ├── photos/page.tsx   — photo upload + InspectionNotesSection
│           ├── extract/page.tsx  — AI extraction trigger
│           ├── review/page.tsx   — DynamicFieldForm + checklist
│           └── output/page.tsx   — FieldsBlock + DescriptionBlock
├── api/
│   ├── extract/route.ts          — POST, GPT-4o vision extraction
│   └── describe/route.ts         — POST, GPT-4o description generation
middleware.ts                     — auth guard + session refresh
```

---

## Sources

- Direct codebase analysis: `InspectionNotesSection.tsx`, `extract/route.ts`, `describe/route.ts`, `extract/page.tsx`, `inspection.actions.ts`, all schema files, all migrations (verified 2026-03-21)
- Project context: `.planning/PROJECT.md` — v1.2 milestone, PREFILL-06 requirement
- Supabase SSR Next.js docs: https://supabase.com/docs/guides/auth/server-side/nextjs

---

*Architecture research for: prestige_assets v1.2 Pre-fill Value Restoration*
*Researched: 2026-03-21*
