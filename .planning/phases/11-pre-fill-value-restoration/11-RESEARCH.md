# Phase 11: Pre-fill Value Restoration - Research

**Researched:** 2026-03-21
**Domain:** React uncontrolled inputs, Radix/Base UI Select hydration, useEffect cleanup, serialisation parsing
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- All 4 roadmap success criteria are in scope for this phase — PREFILL-07 (textarea display) and PREFILL-08 (unmount flush) are confirmed companions, not deferred
- Only PREFILL-06 carries a formal requirement ID, but the roadmap plans and success criteria include all four
- Unmount flush: use `useEffect` cleanup — return `persistNotes()` from a `useEffect`; React calls it synchronously on unmount
- `beforeunload` is NOT suitable (misses in-app Next.js navigation)
- The debounce timer must also be cancelled in the same cleanup (`clearTimeout(debounceRef.current)`)
- `defaultValue` on the textarea must be seeded with only the freeform notes text extracted from the `Notes:` line — not the full serialised blob
- `notesRef.current` must also be seeded with just the freeform notes text (without the `Notes: ` prefix) to prevent double-encoding on the next autosave
- `structuredValuesRef.current` must be seeded at mount from `parseStructuredFields(initialNotes)` so the first autosave after reload doesn't silently zero out previously saved values
- If `initialNotes` is null/empty, `structuredValuesRef.current` remains `{}`

### Claude's Discretion
- Where to place the extracted `parseStructuredFields` utility (e.g., `src/lib/utils/parseStructuredFields.ts` or inline in schema-registry — just not in route handler)
- Select restore approach: try `defaultValue` (uncontrolled) first; fall back to controlled `value` + `useState` if blank on hydration
- Input `defaultValue` wiring pattern

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PREFILL-06 | User can return to an in-progress asset record and find all pre-extraction fields (VIN, odometer, hourmeter, suspension type, unladen weight, length) pre-populated with previously entered values | Seeding `structuredValuesRef.current` and `defaultValue` on Input elements from `parseStructuredFields(initialNotes)` at mount covers all text/number fields; Select restore covered by `defaultValue` prop (with `useState` fallback if needed) |
</phase_requirements>

---

## Summary

Phase 11 is a focused surgical fix to `InspectionNotesSection.tsx`. The component already has the full autosave plumbing (debounce, refs, server action) but three things are missing at mount: the structured input fields have no `defaultValue` wiring, `structuredValuesRef.current` starts as `{}` (causing silent overwrite on the first autosave after a reload), and the textarea `defaultValue` is the full raw `inspection_notes` blob instead of just the freeform `Notes:` line.

The plan divides into two work units: (1) extract `parseStructuredFields` out of `src/app/api/extract/route.ts` into `src/lib/utils/parseStructuredFields.ts` — this is purely mechanical, as the function is already correct and the route handler re-imports it — and (2) seed all three ref/defaultValue sites in `InspectionNotesSection` plus add the `useEffect` unmount flush. Both units are self-contained; the extractor route test suite already exercises `parseStructuredFields` and will need its import path updated.

The most interesting technical decision is the Select restoration. The component uses Radix/Base UI via the project's shadcn `Select` components. Radix `Select` supports an uncontrolled `defaultValue` prop — if that renders the saved value correctly on hydration it is the simplest path. If the value appears blank (a known Radix hydration quirk when `defaultValue` is provided to a dynamically rendered Select inside a `.map()`), the fallback is a `useState` seeded from the parsed value passed to `value` as a controlled prop.

**Primary recommendation:** Seed `structuredValuesRef`, `notesRef`, and all `defaultValue` props from `parseStructuredFields(initialNotes)` at mount; wire the `useEffect` cleanup for unmount flush; extract the parser utility first so it is importable by the client component.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React `useEffect` + `useRef` | 19.2.3 (project) | Mount seeding, unmount cleanup, debounce refs | Built-in; already used in the component |
| `@base-ui/react` Select | ^1.3.0 (project) | Suspension type select | Already installed; component already uses it via shadcn wrappers |
| Vitest + jsdom | ^4.1.0 (project) | Unit tests for utility and component | Already configured; `src/__tests__/` pattern established |
| `@testing-library/react` | project | Component render assertions | Already used in component tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useState` (React) | 19.2.3 | Controlled fallback for Select if `defaultValue` doesn't hydrate | Only if Base UI Select ignores `defaultValue` on first render |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useEffect` cleanup (unmount flush) | `beforeunload` event | `beforeunload` misses in-app Next.js router navigation — locked out by user decision |
| Uncontrolled `defaultValue` on Select | Controlled `value` + `useState` | Controlled adds re-render complexity; try uncontrolled first per user decision |
| Shared util at `src/lib/utils/parseStructuredFields.ts` | Inline in schema-registry | Schema-registry is a pure data/schema module; parser is a string utility — separate file is cleaner; both are valid per user discretion |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── utils/
│       ├── image.ts              # existing
│       ├── relativeTime.ts       # existing
│       └── parseStructuredFields.ts   # NEW — extracted from route.ts
├── components/
│   └── asset/
│       └── InspectionNotesSection.tsx  # MODIFIED — all 4 restoration changes
└── app/
    └── api/
        └── extract/
            └── route.ts          # MODIFIED — re-import parseStructuredFields from shared util
```

### Pattern 1: Utility Extraction (Plan 11-01)
**What:** Move `parseStructuredFields` from `route.ts` to `src/lib/utils/parseStructuredFields.ts`. Route handler re-imports from new location. All existing import paths updated.
**When to use:** When a utility function needed by client components is trapped in a server route handler (client components cannot import from `app/api/` route files).
**Example:**
```typescript
// src/lib/utils/parseStructuredFields.ts
export function parseStructuredFields(notes: string | null): Record<string, string> {
  if (!notes) return {}
  const result: Record<string, string> = {}
  for (const line of notes.split('\n')) {
    const colonIdx = line.indexOf(': ')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 2).trim()
    if (key === 'Notes' || !key || !value) continue
    result[key] = value
  }
  return result
}

// src/app/api/extract/route.ts (after change — re-export for consumers of the old import path, or simply re-import)
import { parseStructuredFields } from '@/lib/utils/parseStructuredFields'
export { parseStructuredFields }  // re-export keeps existing test imports working without editing
```

### Pattern 2: Ref Seeding at Mount (Plan 11-02)
**What:** Pass `initialNotes` through `parseStructuredFields` during `useRef` initialisation to seed structured values. Extract freeform notes for `notesRef` and textarea `defaultValue`.
**When to use:** Whenever uncontrolled refs need to reflect persisted state from the server at mount — not in a `useEffect` (runs after render, causes a flash) but directly in the `useRef()` initialiser.
**Example:**
```typescript
// In InspectionNotesSection — ref seeding
import { parseStructuredFields } from '@/lib/utils/parseStructuredFields'

// Extract freeform notes from the Notes: line
function extractFreeformNotes(notes: string | null): string {
  if (!notes) return ''
  for (const line of notes.split('\n')) {
    if (line.startsWith('Notes: ')) return line.slice('Notes: '.length)
  }
  return ''
}

const structuredValuesRef = useRef<Record<string, string>>(
  parseStructuredFields(initialNotes)
)
const notesRef = useRef<string>(extractFreeformNotes(initialNotes))
```

### Pattern 3: Input defaultValue Wiring (Plan 11-02)
**What:** Pass parsed structured field values as `defaultValue` to each uncontrolled `<Input>`.
**When to use:** All text/number inspection priority fields — uncontrolled inputs accept `defaultValue` for initial display without converting the component to controlled.
**Example:**
```typescript
<Input
  id={`field-${field.key}`}
  defaultValue={structuredValuesRef.current[field.key] ?? ''}
  onChange={(e) => handleStructuredChange(field.key, e.target.value)}
  // ...classNames
/>
```

### Pattern 4: Select defaultValue (Plan 11-02)
**What:** Pass saved suspension value as `defaultValue` to the uncontrolled Radix/Base UI `<Select>`.
**When to use:** First attempt — uncontrolled. If the saved value does not appear on hydration, fall back to controlled with `useState`.
**Example (uncontrolled — try first):**
```typescript
<Select
  defaultValue={structuredValuesRef.current[field.key] ?? undefined}
  onValueChange={(value: string | null) => handleStructuredChange(field.key, value ?? '')}
>
```
**Fallback (controlled — only if uncontrolled renders blank):**
```typescript
// Add per-select field useState initialised from structuredValuesRef
const [selectValues, setSelectValues] = useState<Record<string, string>>(
  () => {
    const parsed = parseStructuredFields(initialNotes)
    return priorityFields
      .filter(f => f.inputType === 'select')
      .reduce((acc, f) => ({ ...acc, [f.key]: parsed[f.key] ?? '' }), {})
  }
)
// Use value={selectValues[field.key] || undefined} and update state in onValueChange
```

### Pattern 5: Unmount Flush via useEffect Cleanup (Plan 11-02)
**What:** Cancel the debounce timer and immediately call `persistNotes()` when the component unmounts, so fast navigation doesn't drop in-flight edits.
**When to use:** Any component with a debounced autosave that must survive in-app Next.js navigation (router.push, Link clicks).
**Example:**
```typescript
useEffect(() => {
  return () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    persistNotes()
  }
}, [persistNotes])
// persistNotes is already useCallback([assetId]) — stable reference; empty dep array is correct
```

### Pattern 6: Textarea defaultValue (Plan 11-02)
**What:** Seed textarea `defaultValue` with only the freeform notes (the text after `Notes: `), not the raw `inspection_notes` blob.
**When to use:** Any textarea backed by `notesRef` in this component.
**Example:**
```typescript
<textarea
  defaultValue={notesRef.current}  // seeded to freeform-only text at construction
  onChange={(e) => handleNotesChange(e.target.value)}
/>
```

### Anti-Patterns to Avoid
- **Seeding refs in `useEffect` instead of at construction:** A `useEffect` runs after the first render paint — the inputs will flash blank then update. Seed directly in the `useRef()` call.
- **Using `value` (controlled) on all inputs without necessity:** The component deliberately uses uncontrolled inputs; converting everything to controlled adds re-render complexity for no benefit. Only use controlled for the Select if `defaultValue` demonstrably fails.
- **Calling `persistNotes()` from `useEffect` with `[initialNotes]` dep:** This would trigger a redundant save on every mount, not just unmount. The cleanup function (the returned teardown) is the correct hook point.
- **Keeping `parseStructuredFields` in `route.ts` and importing it into a client component:** Next.js will error — route files are server-only by convention; the import would pull server dependencies into the client bundle.
- **Re-encoding notes on first autosave after reload:** If `notesRef.current` is seeded with the full blob (`"vin: ABC123\nNotes: runs well"`) rather than just the freeform part (`"runs well"`), the next `persistNotes()` call will double-encode: `"vin: ABC123\northmeter: ...\nNotes: vin: ABC123\nNotes: runs well"`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parsing `key: value` serialisation | Custom regex | `parseStructuredFields` (already written, correct, tested) | Function already handles edge cases: missing separator, empty values, Notes exclusion |
| Notes freeform extraction | Ad-hoc substring | Small helper using `startsWith('Notes: ')` — trivial and inline | Two lines; nothing to over-engineer |
| Debounce on input change | Custom throttle logic | Existing `debounceRef` + `scheduleAutosave()` pattern already in component | Pattern is established; don't duplicate |

**Key insight:** Almost everything needed already exists. This phase wires existing pieces together — the parser, the refs, the server action — rather than building new machinery.

---

## Common Pitfalls

### Pitfall 1: structuredValuesRef Overwrite on First Autosave
**What goes wrong:** `structuredValuesRef.current` starts as `{}`. Staff reload the page, sees restored values in inputs (via `defaultValue`), touches any input — triggering `handleStructuredChange` which merges one key into `{}`. The next `persistNotes()` call writes `"suspension: Airbag"` to the DB, erasing VIN, odometer, etc.
**Why it happens:** `defaultValue` in React only sets the DOM display; it does not update the ref. The ref must be explicitly seeded.
**How to avoid:** Seed `structuredValuesRef` directly in `useRef(parseStructuredFields(initialNotes))`.
**Warning signs:** After a reload and single field edit, all other fields disappear from saved data.

### Pitfall 2: notesRef Double-Encoding
**What goes wrong:** `notesRef.current` is seeded with the full raw blob. On next autosave, `persistNotes()` appends `Notes: {full blob}` → the stored string grows a duplicate prefix.
**Why it happens:** `notesRef.current` is the value that gets written as `Notes: ${notesRef.current}`. If the blob already contains `Notes: `, it gets nested.
**How to avoid:** Seed `notesRef` with only the extracted freeform text (after `Notes: ` prefix stripped).
**Warning signs:** `inspection_notes` in DB contains `Notes: vin: ABC123\nNotes: runs well`.

### Pitfall 3: Select Renders Blank Despite defaultValue
**What goes wrong:** Radix/Base UI `Select` ignores `defaultValue` on hydration when rendered inside a `.map()` loop with dynamic keys — the value prop is provided but the trigger displays the placeholder.
**Why it happens:** Radix `Select` is uncontrolled by default but can have hydration ordering issues when rendered inside dynamic lists.
**How to avoid:** Test uncontrolled `defaultValue` first. If it fails in jsdom or manual testing, switch to controlled `value` + `useState`.
**Warning signs:** SelectValue still shows placeholder after navigation back to page.

### Pitfall 4: persistNotes called on Mount (not just unmount)
**What goes wrong:** A `useEffect` that returns the cleanup but also has logic running on mount triggers `persistNotes()` on every page load, generating unnecessary DB writes.
**Why it happens:** Misunderstanding that `useEffect(() => { ...; return cleanup }, [])` — only the cleanup runs on unmount; the body runs on mount.
**How to avoid:** Only the cleanup (the returned function) should call `persistNotes()`. No body code needed in the unmount-flush effect.
**Warning signs:** DB write fired immediately on page load even when no field has been touched.

### Pitfall 5: extract-route.test.ts import path breaks after extraction
**What goes wrong:** The existing `parseStructuredFields` tests in `src/__tests__/extract-route.test.ts` import directly from `@/app/api/extract/route`. If the function is moved without re-exporting it from the route, 4 tests will fail.
**Why it happens:** The test file uses `await import('@/app/api/extract/route')` to get `parseStructuredFields`.
**How to avoid:** Either (a) re-export `parseStructuredFields` from `route.ts` after importing it from the new util path, or (b) update the test to import from the new util path. Option (b) is cleaner — the test is testing the utility, not the route.
**Warning signs:** `vitest run` reports 4 failures in `extract-route.test.ts` after Plan 11-01.

---

## Code Examples

Verified patterns from the actual codebase:

### Current parseStructuredFields (source: `src/app/api/extract/route.ts`)
```typescript
export function parseStructuredFields(notes: string | null): Record<string, string> {
  if (!notes) return {}
  const result: Record<string, string> = {}
  for (const line of notes.split('\n')) {
    const colonIdx = line.indexOf(': ')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 2).trim()
    if (key === 'Notes' || !key || !value) continue
    result[key] = value
  }
  return result
}
```
This function is correct and complete. Plan 11-01 moves it verbatim to `src/lib/utils/parseStructuredFields.ts`.

### persistNotes (current, source: `InspectionNotesSection.tsx`)
```typescript
const persistNotes = useCallback(() => {
  const structuredLines = Object.entries(structuredValuesRef.current)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v}`)
  const combined = [
    ...structuredLines,
    notesRef.current.trim() ? `Notes: ${notesRef.current}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  saveInspectionNotes(assetId, combined)
}, [assetId])
```
This is already correct serialisation. No changes needed here.

### scheduleAutosave + debounce (current, source: `InspectionNotesSection.tsx`)
```typescript
const scheduleAutosave = useCallback(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(persistNotes, 500)
}, [persistNotes])
```
Unmount flush must cancel this timer before calling `persistNotes()` directly.

### Existing test pattern for utilities (source: `src/__tests__/extract-route.test.ts`)
```typescript
describe('parseStructuredFields', () => {
  it('parses "key: value\\nkey2: value2" into { key: value, key2: value2 }', async () => {
    const { parseStructuredFields } = await import('@/app/api/extract/route')
    // ...
  })
})
```
After Plan 11-01 this import should change to `@/lib/utils/parseStructuredFields`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `beforeunload` for save-on-navigate | `useEffect` cleanup | Next.js App Router era | `beforeunload` does not fire for client-side SPA navigation; cleanup is synchronous and reliable |
| Controlled inputs everywhere | Uncontrolled with `defaultValue` for display | React 16+ | Avoids full re-render on every keystroke; ref-based state sufficient for fire-and-forget autosave |

**Deprecated/outdated:**
- Storing structured fields in a separate JSONB column: explicitly out of scope per REQUIREMENTS.md — string serialisation round-trips correctly for this use case.

---

## Open Questions

1. **Does Base UI `Select` honour `defaultValue` inside a `.map()` loop?**
   - What we know: Radix UI (the upstream) documents `defaultValue` on `Select.Root`; Base UI v1.3.0 (`@base-ui/react`) has its own Select implementation
   - What's unclear: Whether `defaultValue` works reliably in jsdom/vitest or whether a controlled fallback will always be needed
   - Recommendation: Plan 11-02 should implement uncontrolled `defaultValue` first and include a test assertion; if the test fails, switch to controlled `value` + `useState`. The fallback design is already specified in STATE.md.

2. **Should the new test file for `parseStructuredFields` live at `src/__tests__/parseStructuredFields.test.ts` or update `extract-route.test.ts`?**
   - What we know: Current tests import from route; moving them avoids touching the route test scope
   - What's unclear: Project preference
   - Recommendation: Create a dedicated `src/__tests__/parseStructuredFields.test.ts` and update the import in `extract-route.test.ts` to point at the new util path. Cleaner separation of concerns.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/__tests__/parseStructuredFields.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PREFILL-06 | `parseStructuredFields` extracts all field keys correctly | unit | `npx vitest run src/__tests__/parseStructuredFields.test.ts` | ❌ Wave 0 |
| PREFILL-06 | Freeform notes extraction strips `Notes: ` prefix | unit | `npx vitest run src/__tests__/parseStructuredFields.test.ts` | ❌ Wave 0 |
| PREFILL-06 | `InspectionNotesSection` renders inputs with saved values as `defaultValue` | unit (component) | `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` | ❌ Wave 0 |
| PREFILL-06 | `structuredValuesRef` is seeded so first autosave does not zero other fields | unit (component) | `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` | ❌ Wave 0 |
| PREFILL-07 | Textarea `defaultValue` shows only freeform notes, not serialised blob | unit (component) | `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` | ❌ Wave 0 |
| PREFILL-08 | `persistNotes` is called on unmount without awaiting debounce timer | unit (component) | `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` | ❌ Wave 0 |
| (regression) | `extract-route.test.ts` parseStructuredFields tests still pass after extraction | unit | `npx vitest run src/__tests__/extract-route.test.ts` | ✅ (import path update needed) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/parseStructuredFields.test.ts src/__tests__/InspectionNotesSection.test.tsx src/__tests__/extract-route.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/parseStructuredFields.test.ts` — covers pure utility: parse, freeform extraction, null input, Notes exclusion
- [ ] `src/__tests__/InspectionNotesSection.test.tsx` — covers: defaultValue seeding, ref integrity, textarea freeform display, unmount flush
- [ ] Update import path in `src/__tests__/extract-route.test.ts` lines 179/184/190/196 — change `@/app/api/extract/route` to `@/lib/utils/parseStructuredFields`

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/components/asset/InspectionNotesSection.tsx` — full component, confirmed bugs and wiring points
- Direct code inspection: `src/app/api/extract/route.ts` — `parseStructuredFields` implementation, confirmed correct
- Direct code inspection: `src/lib/schema-registry/schemas/truck.ts`, `trailer.ts` — confirmed `suspension` is `inputType: 'select'` with `options: ['Spring', 'Airbag', '6 Rod', 'Other']`
- Direct code inspection: `vitest.config.ts`, `vitest.setup.ts` — confirmed test stack (jsdom, testing-library, globals)
- Direct code inspection: `src/__tests__/extract-route.test.ts` — confirmed existing `parseStructuredFields` tests and their import path
- Direct code inspection: `package.json` — confirmed `@base-ui/react: ^1.3.0`, `react: 19.2.3`, `vitest: ^4.1.0`

### Secondary (MEDIUM confidence)
- React docs: `useRef` initialiser runs once at mount — seeding `useRef(parseStructuredFields(initialNotes))` is the correct single-evaluation pattern
- React docs: `useEffect` cleanup function is called synchronously on unmount before the next render

### Tertiary (LOW confidence)
- Base UI Select `defaultValue` hydration behaviour in `.map()` contexts — not verified with Base UI v1.3.0 docs directly; plan should test and fall back to controlled if needed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed from `package.json` and direct source inspection
- Architecture: HIGH — all patterns derived from reading the actual component; no speculation
- Pitfalls: HIGH — all pitfalls identified from reading the exact code paths that would fail
- Test infrastructure: HIGH — `vitest.config.ts` confirmed, existing test files inspected for patterns
- Select hydration: LOW — Base UI v1.3.0 `defaultValue` behaviour not verified against current docs

**Research date:** 2026-03-21
**Valid until:** 2026-04-20 (stable libraries; Base UI and React 19 are unlikely to change `defaultValue` semantics in 30 days)
