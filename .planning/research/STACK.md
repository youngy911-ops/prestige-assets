# Stack Research

**Domain:** Pre-fill value restoration — persisting and restoring uncontrolled pre-extraction inputs in Next.js 15 / Supabase app (PREFILL-06)
**Researched:** 2026-03-21
**Confidence:** HIGH — conclusions drawn from direct codebase analysis; no assumptions

## Recommendation in One Line

Zero new dependencies. Restore values by: (1) extracting `parseStructuredFields` to a shared utility, (2) passing the parsed map as a new prop to `InspectionNotesSection`, (3) converting text inputs to `defaultValue`-based uncontrolled and the select to controlled.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase Postgres — existing `inspection_notes text` column | existing | Storage for pre-fill values | Already stores the data in `key: value` line format; already autosaved on change; no schema change needed |
| `parseStructuredFields` — existing function in `extract/route.ts` | existing | Parse stored notes back into `Record<string, string>` | Already written and tested; handles all edge cases; only needs to move to a shared location |
| React `defaultValue` for text inputs | React 19 (existing) | Restore text input values on mount | `defaultValue` sets the initial DOM value once; works with existing uncontrolled `onChange` pattern |
| React controlled `value` + `useState` for `<Select>` | React 19 (existing) | Restore select value on mount | Base UI `<Select>` requires controlled `value` prop for reliable restoration from server props |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | No new libraries required | — |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| vitest + testing-library (existing) | Test parse round-trip and component restoration | Add test: `parseStructuredFields(serialised)` recovers each field key correctly |

## Installation

```bash
# Nothing to install — zero new dependencies
```

## How the Data Round-Trip Works

```
WRITE PATH (already correct — no changes needed):
  InspectionNotesSection
    handleStructuredChange(key, value)
      → structuredValuesRef.current[key] = value
      → scheduleAutosave() → 500ms debounce
      → saveInspectionNotes(assetId, combined)
      → Supabase: inspection_notes = "vin: 1HGCM82...\nsuspension: Air Ride\nNotes: cab condition"

READ PATH (what needs fixing for PREFILL-06):
  ExtractPage (Server Component)
    → SELECT inspection_notes FROM assets (already done)
    → parseStructuredFields(inspection_notes)   ← move to shared util; already exists
    → extract freeform-only portion (lines with key "Notes")
    → pass initialStructuredValues: Record<string, string> to ExtractionPageClient
    → ExtractionPageClient passes through to InspectionNotesSection

  InspectionNotesSection
    → text inputs: add defaultValue={initialStructuredValues[field.key] ?? ''}
    → select: convert to controlled with useState(initialStructuredValues['suspension'] ?? '')
    → textarea: change defaultValue from full combined string to freeform-only string
```

## What Changes and What Does Not

| Component / File | Change | Type |
|-----------------|--------|------|
| `src/app/api/extract/route.ts` | Extract `parseStructuredFields` to shared utility | Refactor (move, not rewrite) |
| `src/lib/utils/parseStructuredFields.ts` (new) | Shared utility for parsing notes | New file |
| `src/app/(app)/assets/[id]/extract/page.tsx` | Call `parseStructuredFields`; pass `initialStructuredValues` + `initialFreeformNotes` props | Extend Server Component |
| `src/components/asset/ExtractionPageClient.tsx` | Accept + forward new props | Prop threading |
| `src/components/asset/InspectionNotesSection.tsx` | Add `initialStructuredValues` prop; `defaultValue` on text inputs; controlled `useState` on select; `defaultValue` fix on textarea | UI change |
| `src/app/api/extract/route.ts` | Import from shared utility (no logic change) | Import update |
| `src/app/api/describe/route.ts` | Import from shared utility (already imports this function) | Import update |
| DB schema | None | — |
| New packages | None | — |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Existing `inspection_notes` text column | New `pre_extraction_fields jsonb` column | Only if pre-fill values need to be queried/indexed independently of notes. Not the case here — they feed extraction prompts and are always loaded with the asset anyway. Would require a migration and a new Server Action for no practical gain. |
| Parse on server, pass as prop | Parse in client component on mount with `useMemo` | Both work. Server-side parse means no client JS needed for parsing; data is available synchronously on mount with no flash of empty inputs. Prefer server-side. |
| React `defaultValue` for text inputs | React controlled `value` + `useState` for text inputs | Controlled is heavier — requires state per field. For text inputs `defaultValue` is sufficient because the user's typing after mount does not need to be reflected back (the `onChange` → ref pattern already handles persistence). |
| React controlled `value` + `useState` for `<Select>` | `defaultValue` on `<Select>` | Base UI `<Select>` (`@base-ui/react ^1.3.0`) supports `defaultValue` for initial render, but when the prop value comes from a server-rendered parent and the component tree is hydrated, relying on `defaultValue` risks the select trigger displaying a blank value if hydration timing differs. Controlled `value` is explicit and safe. |
| URL search params | (not applicable) | URL params serve bookmarkable filter state. Pre-fill values are per-asset and already in Supabase; routing them through the URL duplicates storage and pollutes the address bar. |
| `localStorage` | (not applicable) | Per-device, clears without notice, silently diverges from DB. The data is already in Supabase and server-rendered — localStorage adds complexity with zero benefit. |
| `react-hook-form` `defaultValues` | (not applicable) | RHF owns the post-extraction review form. `InspectionNotesSection` is intentionally outside that form boundary. Wrapping it in `FormProvider` or merging it into the main form would couple two logically separate concerns that v1.1 deliberately kept apart. |

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| New `pre_extraction_fields jsonb` column | DB migration required; data already in `inspection_notes`; `parseStructuredFields` already handles it | Reuse existing `inspection_notes` text column |
| `localStorage` for pre-fill state | Per-device; diverges from DB silently; adds client complexity | Supabase `inspection_notes` (already the source of truth) |
| URL search params for pre-fill values | Wrong abstraction; values are asset-specific DB state, not navigation state | Supabase `inspection_notes` |
| `react-hook-form` integration for `InspectionNotesSection` | Couples pre-extraction inputs to post-extraction review form; adds form context overhead | Uncontrolled `defaultValue` + controlled select via `useState` |
| `zustand` or other state library | No shared state needed across components; props are sufficient | React props + `useState` |

## Stack Patterns by Variant

**For text `<Input>` fields (vin, hourmeter, odometer, truck_weight, trailer_length, etc.):**
- Add `defaultValue={initialStructuredValues[field.key] ?? ''}` to the existing `<Input>`
- Keep existing `onChange` → `handleStructuredChange` as-is
- Because: `defaultValue` sets the DOM value once on mount without making the component controlled; subsequent user edits still fire `onChange` correctly; zero state needed

**For the `<Select>` field (suspension):**
- Convert to controlled: add `useState` initialised from `initialStructuredValues['suspension'] ?? ''`
- Pass `value={suspensionValue}` and update via `onValueChange`
- Because: `<Select>` from Base UI / Radix requires a controlled `value` for reliable display when the initial value comes from a server-rendered prop; `defaultValue` alone risks a blank trigger on hydration

**For the "Other notes" `<textarea>`:**
- Change `defaultValue={initialNotes ?? ''}` to `defaultValue={initialFreeformNotes ?? ''}`
- Today `initialNotes` is the full combined string including structured field lines — this is a bug that PREFILL-06 also fixes as a side-effect
- `initialFreeformNotes` is the content of the `Notes: ...` line only

## The `parseStructuredFields` Extraction

The function already exists and handles the correct format:

```typescript
// Currently in: src/app/api/extract/route.ts
// Move to:      src/lib/utils/parseStructuredFields.ts
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

Also needed: a companion function to extract the freeform-only notes portion:

```typescript
export function extractFreeformNotes(notes: string | null): string {
  if (!notes) return ''
  for (const line of notes.split('\n')) {
    if (line.startsWith('Notes: ')) return line.slice(7).trim()
  }
  return ''
}
```

Both functions are pure, easily testable, and have no dependencies.

## Version Compatibility

| Package | Version in Use | Notes |
|---------|---------------|-------|
| `next` | 16.1.7 | App Router Server Components serialise `Record<string, string>` props to Client Components cleanly |
| `react` | 19.2.3 | `defaultValue` and controlled `value` + `useState` both standard; no React 19 caveats for this pattern |
| `@supabase/supabase-js` | ^2.99.2 | No change — existing `inspection_notes` text column used unchanged |
| `react-hook-form` | ^7.71.2 | Not involved — RHF owns post-extraction review form only; `InspectionNotesSection` remains independent |
| `@base-ui/react` | ^1.3.0 | `<Select>` with controlled `value` prop supported; verify `onValueChange` callback signature matches existing usage |

## Sources

- `src/components/asset/InspectionNotesSection.tsx` — confirmed uncontrolled inputs, `structuredValuesRef` pattern, `<Select>` with no `value`/`defaultValue` — HIGH confidence
- `src/app/api/extract/route.ts` — confirmed `parseStructuredFields` function exists and parses `key: value` lines correctly — HIGH confidence
- `src/lib/actions/inspection.actions.ts` — confirmed `inspection_notes` text column; confirmed write path serialises `key: value\nNotes: freeform` format — HIGH confidence
- `supabase/migrations/20260318000003_extraction.sql` — confirmed `inspection_notes text` column exists; no JSONB, no separate structured fields column — HIGH confidence
- `src/app/(app)/assets/[id]/extract/page.tsx` — confirmed `inspection_notes` already loaded by Server Component and passed as `inspectionNotes` prop — HIGH confidence
- `src/components/asset/ExtractionPageClient.tsx` — confirmed `inspectionNotes` prop flows through to `InspectionNotesSection` as `initialNotes` — HIGH confidence
- React documentation — `defaultValue` sets initial uncontrolled input value once on mount; subsequent `onChange` fires normally — HIGH confidence (stable React behaviour since React 16)

---

*Stack research for: prestige_assets v1.2 Pre-fill Restoration (PREFILL-06)*
*Researched: 2026-03-21*
