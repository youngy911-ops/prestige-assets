# Phase 4: Review Form + Save — Research

**Researched:** 2026-03-19
**Domain:** React Hook Form + Zod dynamic schemas, Next.js Server Actions, Supabase JSONB, shadcn component installation
**Confidence:** HIGH (code-based findings from existing project; library patterns from current docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Form layout:** Flat scrollable list matching the extraction result panel — fields in `sfOrder`, one continuous scroll. No grouping sections, no paginated views.
- **Low-confidence highlighting:** Reuse `ConfidenceBadge` component inline with each form field. Low/not-found fields get a visually distinct treatment (coloured left border or subtle background tint). Must not be alarming for "medium" confidence.
- **Blocking items:** VIN, rego, serial — cannot be dismissed without entering a value or explicitly marking "unknown / not available".
- **Dismissible items:** Optional fields (e.g. engine hours on a caravan) — can be marked "not applicable".
- **Checklist state values:** `flagged` / `dismissed-na` / `confirmed` / `unknown` — persisted to Supabase.
- **Save action:** Upserts `assets.fields` JSONB with confirmed field values. Persists checklist state. Routes to `/assets/[id]/output` on success. Does NOT overwrite `assets.extraction_result`.
- **Re-extraction from review:** Staff can update inspection notes and re-trigger extraction from the review screen.

### Claude's Discretion
- Exact visual treatment for low/medium confidence field rows (border vs background tint; badge placement within the row).
- Missing info checklist placement (above form, below form, or modal/drawer gate step).
- Re-extraction value conflict handling (AI wins vs staff-edit wins vs per-field prompt for dirty fields).
- RHF + Zod schema construction strategy for dynamically-generated schema.
- Debounce / auto-save behaviour (if any) while staff edit fields before final save.
- Error state if Save Server Action fails.

### Deferred Ideas (OUT OF SCOPE)
- None captured.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FORM-01 | App displays and captures data using the correct Salesforce field schema for the selected asset type (Truck ~35 fields; Earthmoving 2-page schema) | `getFieldsSortedBySfOrder()` drives field rendering; `FieldDefinition.inputType` drives input widget selection; RHF `useForm` manages state |
| FORM-02 | Low-confidence AI-extracted fields are visually highlighted in the review form to prompt verification | `ConfidenceBadge` reused; field row wrapper styled by confidence level from `ExtractionResult`; low/not_found rows get left-border accent |
| AI-04 | Missing info checklist: blocking vs dismissible items, checklist state persisted to Supabase | New `checklist_state` JSONB column on `assets`; blocking classification derived from hardcoded key list (`vin`, `registration_number`, `serial_number`); state values `flagged`/`dismissed-na`/`confirmed`/`unknown` |
</phase_requirements>

---

## Summary

Phase 4 builds the mandatory review form that sits between AI extraction (Phase 3) and output generation (Phase 5). Staff land at `/assets/[id]/review`, see every Salesforce field pre-filled from `assets.extraction_result`, edit as needed, resolve the missing-information checklist, and save. No path exists to skip this.

The core technical challenge is building a **dynamically-typed RHF + Zod form** where the field list is determined at runtime by asset type. The correct approach is to build a Zod schema from `getFieldsSortedBySfOrder()` at render time (a `Record<string, z.ZodString>` shape) and pass it to `zodResolver`. This is a well-established pattern — RHF 7.x with `zodResolver` accepts a runtime-constructed schema without any special treatment.

Two new Supabase columns are required: `assets.fields` already exists (from Phase 1 migration, initialised as `{}`); a new `assets.checklist_state` JSONB column must be added to store per-field checklist entries. Four shadcn components need to be installed: `textarea`, `checkbox`, `select`, and `badge` (the existing `badge.tsx` is a shadcn badge — confirm which components are missing before planning installation tasks).

**Primary recommendation:** Use `react-hook-form` + `@hookform/resolvers` + existing `zod` (v4.3.6 installed). Build a flat `z.object({ [fieldKey]: z.string() })` Zod schema at render time. Store checklist state as a JSONB object keyed by field key. Derive blocking vs dismissible from a hardcoded constant (not a Schema Registry flag) since the blocking list is tiny (VIN, rego, serial number) and stable.

---

## Standard Stack

### Core (not yet installed — MUST be installed in Wave 0)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-hook-form` | `^7.x` | Uncontrolled form state, validation, dirty field tracking | Industry standard; minimal re-renders; `useForm` + `Controller` pattern works perfectly for dynamic field lists |
| `@hookform/resolvers` | `^3.x` | Bridges RHF with Zod schema validation | Required adapter; zero boilerplate |

**Confirmed NOT installed:** `react-hook-form` and `@hookform/resolvers` are absent from `package.json`. They must be added.

### Already Installed (no action needed)

| Library | Version | Purpose |
|---------|---------|---------|
| `zod` | `^4.3.6` | Schema validation — runtime Zod schema built from `FieldDefinition[]` |
| `shadcn` | `^4.0.8` | Component CLI — used to install missing shadcn primitives |
| `lucide-react` | `^0.577.0` | Icons — CheckCircle2 / AlertCircle / MinusCircle already used in ConfidenceBadge |
| `@supabase/ssr` | `^0.9.0` | `createServerClient` for Server Action DB writes |

### shadcn Components Status

| Component | File Exists? | Action |
|-----------|-------------|--------|
| `input` | `src/components/ui/input.tsx` | Already installed |
| `button` | `src/components/ui/button.tsx` | Already installed |
| `label` | `src/components/ui/label.tsx` | Already installed |
| `card` | `src/components/ui/card.tsx` | Already installed |
| `separator` | `src/components/ui/separator.tsx` | Already installed |
| `badge` | `src/components/ui/badge.tsx` | Already installed |
| `textarea` | MISSING | Must install: `npx shadcn add textarea` |
| `checkbox` | MISSING | Must install: `npx shadcn add checkbox` |
| `select` | MISSING | Must install: `npx shadcn add select` |

**Installation:**
```bash
npm install react-hook-form @hookform/resolvers
npx shadcn add textarea checkbox select
```

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── app/(app)/assets/[id]/review/
│   └── page.tsx                         # Server Component — reads asset + extraction_result from DB
├── components/asset/
│   ├── ReviewPageClient.tsx             # 'use client' — owns RHF form, checklist state, re-extraction
│   ├── DynamicFieldForm.tsx             # RHF form rendering: maps FieldDefinition[] → input widgets
│   ├── FieldRow.tsx                     # Single field row: label + input + ConfidenceBadge + highlight
│   ├── MissingInfoChecklist.tsx         # Checklist: gap analysis, blocking/dismissible UI
│   └── ChecklistItem.tsx               # Single checklist item: flag, dismiss-na, mark-unknown actions
├── lib/
│   ├── actions/
│   │   └── review.actions.ts            # saveReview() Server Action — upsert fields + checklist_state
│   └── review/
│       ├── build-form-schema.ts         # buildFormSchema(fields: FieldDefinition[]) → ZodObject
│       ├── build-checklist.ts           # buildChecklist(fields, extractionResult) → ChecklistItem[]
│       └── blocking-fields.ts           # BLOCKING_FIELD_KEYS constant
└── __tests__/
    ├── build-form-schema.test.ts        # Unit: Zod schema shape
    ├── build-checklist.test.ts          # Unit: gap detection, blocking classification
    └── review.actions.test.ts           # Unit: saveReview Server Action
```

### Pattern 1: Dynamic Zod Schema from FieldDefinition[]

**What:** Build a Zod schema at module/render time from the Schema Registry field list. All fields are stored as strings in the JSONB `fields` column (even numbers), so the form schema can be uniformly `z.string()` with optional transforms.

**When to use:** For all field validation in the review form.

```typescript
// src/lib/review/build-form-schema.ts
import { z } from 'zod'
import type { FieldDefinition } from '@/lib/schema-registry/types'

export function buildFormSchema(fields: FieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    // All values stored as strings in JSONB — number fields validated as numeric string
    shape[field.key] = field.inputType === 'number'
      ? z.string().regex(/^\d*$/, 'Must be a number').or(z.literal(''))
      : z.string()
  }
  return z.object(shape)
}

export type ReviewFormValues = Record<string, string>
```

**Why uniform strings:** The `assets.fields` JSONB stores confirmed values as `Record<string, string>` (established in Phase 1 `createAsset` — `fields: {}`). The output formatter (Phase 5) reads string values. Keeping numbers as strings avoids type coercion bugs.

### Pattern 2: RHF useForm with zodResolver

```typescript
// Inside ReviewPageClient.tsx (simplified)
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { buildFormSchema } from '@/lib/review/build-form-schema'

// fields = getFieldsSortedBySfOrder(assetType)
const schema = buildFormSchema(fields)

const { control, handleSubmit, formState: { errors, dirtyFields } } = useForm<ReviewFormValues>({
  resolver: zodResolver(schema),
  defaultValues: buildDefaultValues(fields, extractionResult),
})
```

`dirtyFields` is critical: it tracks which fields staff have manually edited — used for re-extraction conflict resolution (Claude's Discretion: recommended default is to prompt per dirty field vs clean AI overwrite).

### Pattern 3: Default Values from ExtractionResult

```typescript
// src/lib/review/build-form-schema.ts (additional export)
import type { ExtractionResult } from '@/lib/ai/extraction-schema'

export function buildDefaultValues(
  fields: FieldDefinition[],
  extractionResult: ExtractionResult | null,
  savedFields: Record<string, string> = {}
): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const field of fields) {
    // Prefer already-saved confirmed values over extraction result
    defaults[field.key] =
      savedFields[field.key] ??
      extractionResult?.[field.key]?.value ??
      ''
  }
  return defaults
}
```

### Pattern 4: Blocking Field Classification

The blocking field list (VIN, rego, serial number) is a hardcoded constant — NOT a Schema Registry flag. Rationale: the blocking rule is a business policy specific to the review workflow, not a field property. Adding a `blocking` flag to `FieldDefinition` would bleed workflow-specific logic into the schema registry.

```typescript
// src/lib/review/blocking-fields.ts
export const BLOCKING_FIELD_KEYS = new Set([
  'vin',
  'registration_number',
  'serial_number',
])

export function isBlocking(fieldKey: string): boolean {
  return BLOCKING_FIELD_KEYS.has(fieldKey)
}
```

Cross-checking truck schema: `vin` (sfOrder 2) and `registration_number` (sfOrder 18) are present. Other schemas must be verified for `serial_number` key existence before implementing.

### Pattern 5: Checklist State Shape

```typescript
// Checklist state stored in assets.checklist_state JSONB
type ChecklistStatus = 'flagged' | 'dismissed-na' | 'confirmed' | 'unknown'

type ChecklistState = Record<string, ChecklistStatus>
// e.g. { vin: 'flagged', registration_number: 'confirmed', extras: 'dismissed-na' }
```

A field appears on the checklist when:
1. `extractionResult[field.key]` is null or confidence is 'low' or 'not_found', AND
2. The current form value is empty string

Save is blocked when any field in `BLOCKING_FIELD_KEYS` has checklist status `'flagged'` (i.e. staff have not resolved it).

### Pattern 6: Server Action for Save

Follows existing `createAsset` pattern in `src/lib/actions/asset.actions.ts`:

```typescript
// src/lib/actions/review.actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveReview(
  assetId: string,
  fields: Record<string, string>,
  checklistState: Record<string, string>
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('assets')
    .update({
      fields,
      checklist_state: checklistState,
      status: 'confirmed',
    })
    .eq('id', assetId)
    .eq('user_id', user.id)  // RLS double-check

  if (error) return { error: error.message }
  revalidatePath(`/assets/${assetId}/review`)
  redirect(`/assets/${assetId}/output`)
}
```

Note: `redirect()` from `next/navigation` throws internally — do NOT wrap in try/catch. Call `redirect` only after confirming no error.

### Pattern 7: Re-Extraction from Review Screen

The review page reuses the existing `/api/extract` Route Handler (no changes needed to the handler). The `ReviewPageClient` calls the same `fetch('/api/extract', ...)` pattern as `ExtractionPageClient`. After the new extraction result returns, dirty field detection determines handling:

- **Clean fields** (not in `dirtyFields`): overwrite with new AI value.
- **Dirty fields** (staff has typed in them): recommended approach is a per-field conflict UI — show "AI found: X | Keep yours: Y" with two buttons. Simplest pragmatic alternative: show a banner "AI re-extracted — X fields differ from your edits" with "Accept all AI values" vs "Keep my edits".

The `InspectionNotesSection` component (already built in Phase 3) can be re-mounted on the review page for updating notes before re-triggering.

### Anti-Patterns to Avoid

- **Controlled inputs per field with useState:** With 35+ fields, this causes 35+ state updates on every keystroke. Use RHF's uncontrolled `register()` or `Controller` approach.
- **Storing numbers as JS numbers in form state:** The form deals in strings throughout; convert only at display/output time.
- **Adding `blocking` to `FieldDefinition`:** Workflow policy does not belong in the Schema Registry. Use a hardcoded constant.
- **Calling `redirect()` inside try/catch:** `redirect` works by throwing a special Next.js error — a surrounding catch block will swallow it.
- **Calling `revalidatePath` on `/assets`:** The review action should revalidate the specific asset route; the extract page already revalidates on demand via `router.push`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state management | Custom useState per field | `react-hook-form` `useForm` | Dirty tracking, validation, uncontrolled performance for 35+ fields |
| Runtime schema validation | Custom field validators | `zod` + `zodResolver` | Type-safe, composable, already a project dependency |
| Select dropdown | Custom `<select>` | shadcn `Select` component | Accessible, styled consistently with existing shadcn components |
| Multiline text | Custom textarea | shadcn `Textarea` component | Matches shadcn design system already in use |
| Checkbox | `<input type="checkbox">` | shadcn `Checkbox` | Styled, accessible, Tailwind-consistent |

---

## Common Pitfalls

### Pitfall 1: RHF + Zod 4 Compatibility

**What goes wrong:** `@hookform/resolvers` versions below 3.9.x may not support Zod v4. The project uses `zod ^4.3.6`.

**Why it happens:** Zod v4 shipped with breaking changes in early 2025; resolver packages needed updates.

**How to avoid:** Install `@hookform/resolvers@^3.9` or later. Verify peer dependency compatibility before locking version. As of March 2026, `@hookform/resolvers@^3.x` supports Zod v4.

**Warning signs:** TypeScript error on `zodResolver(schema)` — "Argument of type ZodObject is not assignable...".

### Pitfall 2: JSONB Field Merge vs Replace

**What goes wrong:** Supabase `.update({ fields: newValues })` replaces the entire JSONB column, not merges. If partial saves happen, previously-confirmed fields disappear.

**Why it happens:** PostgreSQL JSONB column update is a full replacement.

**How to avoid:** The save action always submits the complete `fields` object from the form (which is pre-filled with all extraction values and defaults). Never do partial updates to `fields`. This is safe because the form always renders all fields.

### Pitfall 3: Missing `checklist_state` Column

**What goes wrong:** Save action fails with column-not-found DB error.

**Why it happens:** `assets.checklist_state` doesn't exist yet — the Phase 1 migration created `fields: {}` but not `checklist_state`.

**How to avoid:** Wave 0 plan must include migration `20260319000004_review_checklist.sql` adding `checklist_state jsonb not null default '{}'` to `assets`.

### Pitfall 4: `select` shadcn Component Has Multiple Sub-Imports

**What goes wrong:** Using `<Select>` from shadcn requires importing `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` — not just `Select`. Missing sub-imports cause runtime crashes.

**Why it happens:** shadcn Select is a compound component.

**How to avoid:** In `FieldRow.tsx` for `inputType: 'select'`, import all sub-components: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'`.

### Pitfall 5: `redirect()` in Server Action try/catch

**What goes wrong:** The redirect after a successful save silently fails.

**Why it happens:** `redirect()` works by throwing a special Next.js error. A `try/catch` wrapping the save logic catches and swallows the redirect throw.

**How to avoid:** Structure the Server Action so `redirect()` is called after the try/catch block (only if no error was returned). See Pattern 6 above.

### Pitfall 6: Zod v4 Schema API Changes

**What goes wrong:** Zod v4 changed some APIs. Specifically, `z.object(shape).partial()` and `.extend()` still work, but `z.discriminatedUnion` and error messages API changed.

**How to avoid:** Keep the form schema simple — `z.object({ [key]: z.string() })`. No discriminated unions needed here. Avoid Zod v3-style `.nullable()` on required fields (use `.optional()` or `.or(z.literal(''))` for empty-allowed strings).

### Pitfall 7: Confirmation Gate Timing

**What goes wrong:** Save button is enabled before checklist has been computed, allowing saves with unresolved blocking items.

**Why it happens:** Checklist state initialises as empty; save guard checks state before checklist finishes rendering.

**How to avoid:** Initialise checklist state synchronously from extraction result at component mount time. Derive `canSave` as a computed value from checklist state — not from UI events.

---

## DB Schema Changes Required

### New Migration: `20260319000004_review_checklist.sql`

```sql
-- Phase 4: Checklist state for missing-information tracking
alter table public.assets
  add column if not exists checklist_state jsonb not null default '{}';
```

**Existing columns confirmed sufficient:**
- `assets.fields` — already exists (`jsonb not null default '{}'`) from Phase 1 migration — this IS the confirmed field values column.
- `assets.extraction_result` — already exists from Phase 3 migration — read-only source for pre-fill.
- `assets.status` — already exists (`text not null default 'draft'`) — set to `'confirmed'` on save.

No other schema changes needed.

---

## Code Examples

### Complete FieldRow Component Pattern

```typescript
// src/components/asset/FieldRow.tsx
'use client'
import { Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ConfidenceBadge } from '@/components/asset/ConfidenceBadge'
import type { FieldDefinition } from '@/lib/schema-registry/types'
import type { ConfidenceLevel } from '@/components/asset/ConfidenceBadge'

interface FieldRowProps {
  field: FieldDefinition
  confidence: ConfidenceLevel
  control: ReturnType<typeof import('react-hook-form').useForm>['control']
  error?: string
}

// Confidence → visual treatment
const HIGHLIGHT_CLASSES: Partial<Record<ConfidenceLevel, string>> = {
  low: 'border-l-2 border-l-amber-500/60 pl-3',
  not_found: 'border-l-2 border-l-red-500/40 pl-3',
}
```

### Checklist Gap Detection

```typescript
// src/lib/review/build-checklist.ts
import type { FieldDefinition } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'
import { isBlocking } from './blocking-fields'

export type ChecklistEntry = {
  field: FieldDefinition
  isBlocking: boolean
  status: 'flagged' | 'dismissed-na' | 'confirmed' | 'unknown'
}

export function buildChecklist(
  fields: FieldDefinition[],
  extractionResult: ExtractionResult | null,
  currentValues: Record<string, string>,
  savedState: Record<string, string> = {}
): ChecklistEntry[] {
  return fields
    .filter(field => {
      const extracted = extractionResult?.[field.key]
      const hasExtractedValue = extracted?.value != null && extracted.confidence !== 'low'
      const hasCurrentValue = (currentValues[field.key] ?? '').trim() !== ''
      return !hasExtractedValue && !hasCurrentValue
    })
    .map(field => ({
      field,
      isBlocking: isBlocking(field.key),
      status: (savedState[field.key] as ChecklistEntry['status']) ?? 'flagged',
    }))
}

export function canSave(checklist: ChecklistEntry[]): boolean {
  return checklist
    .filter(e => e.isBlocking)
    .every(e => e.status !== 'flagged')
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `react-final-form` | `react-hook-form` v7 | RHF is the dominant choice as of 2024-2026; smaller bundle, no context-thrashing |
| Zod v3 `.nullable()` chains | Zod v4 `.optional()` / `.nullish()` | Minor API difference; `z.string()` base still works the same |
| `useFormState` (RHF) | `formState` destructured from `useForm` return | Same API; `dirtyFields` available directly |

---

## Validation Architecture

nyquist_validation is enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm test -- --reporter=dot` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FORM-01 | `buildFormSchema(fields)` returns correct Zod shape for each `inputType` | unit | `npm test -- src/__tests__/build-form-schema.test.ts` | Wave 0 |
| FORM-01 | `buildDefaultValues()` pre-fills from `extraction_result`, prefers `savedFields` | unit | `npm test -- src/__tests__/build-form-schema.test.ts` | Wave 0 |
| FORM-01 | `DynamicFieldForm` renders correct input widget per `inputType` (text/number/select/textarea) | component | `npm test -- src/__tests__/DynamicFieldForm.test.tsx` | Wave 0 |
| FORM-02 | `FieldRow` applies highlight class for low/not_found confidence | component | `npm test -- src/__tests__/FieldRow.test.tsx` | Wave 0 |
| FORM-02 | `FieldRow` does NOT apply highlight class for high/medium confidence | component | `npm test -- src/__tests__/FieldRow.test.tsx` | Wave 0 |
| AI-04 | `buildChecklist()` includes fields with null extraction value | unit | `npm test -- src/__tests__/build-checklist.test.ts` | Wave 0 |
| AI-04 | `buildChecklist()` includes fields with low-confidence extraction | unit | `npm test -- src/__tests__/build-checklist.test.ts` | Wave 0 |
| AI-04 | `canSave()` returns false when any blocking field is `flagged` | unit | `npm test -- src/__tests__/build-checklist.test.ts` | Wave 0 |
| AI-04 | `canSave()` returns true when all blocking fields are `confirmed` or `unknown` | unit | `npm test -- src/__tests__/build-checklist.test.ts` | Wave 0 |
| AI-04 | `saveReview` Server Action upserts `fields` and `checklist_state` | unit | `npm test -- src/__tests__/review.actions.test.ts` | Wave 0 |
| AI-04 | `saveReview` returns error when not authenticated | unit | `npm test -- src/__tests__/review.actions.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --reporter=dot src/__tests__/build-form-schema.test.ts src/__tests__/build-checklist.test.ts src/__tests__/review.actions.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/build-form-schema.test.ts` — covers FORM-01 schema construction and default values
- [ ] `src/__tests__/build-checklist.test.ts` — covers AI-04 gap detection and `canSave` guard
- [ ] `src/__tests__/review.actions.test.ts` — covers AI-04 save action
- [ ] `src/__tests__/DynamicFieldForm.test.tsx` — covers FORM-01 widget rendering
- [ ] `src/__tests__/FieldRow.test.tsx` — covers FORM-02 confidence highlighting
- [ ] `supabase/migrations/20260319000004_review_checklist.sql` — adds `checklist_state` column

---

## Open Questions

1. **Which schemas have a `serial_number` field key?**
   - What we know: `vin` and `registration_number` are confirmed in truck schema. `serial_number` is mentioned in CONTEXT.md as blocking but its key in other schemas is unconfirmed.
   - What's unclear: Earthmoving, agriculture, forklift schemas may use `serial_number` or a different key (e.g. `pin`, `machine_serial`).
   - Recommendation: Read all 7 schema files in Wave 0 (plan 04-01) and populate `BLOCKING_FIELD_KEYS` from confirmed keys only. Don't hardcode `serial_number` until verified.

2. **Does `assets.fields` need any structure beyond `Record<string, string>`?**
   - What we know: Phase 1 created `fields: {}` with no column constraints beyond JSONB. Phase 5 (output) reads confirmed values from `fields`.
   - What's unclear: Whether Phase 5 needs any metadata stored alongside field values (it appears not — just values).
   - Recommendation: Keep `fields` as `Record<string, string>` — flat key/value. No change needed.

3. **shadcn `select` compound component — does it need `@radix-ui/react-select` or is it provided by `@base-ui/react`?**
   - What we know: The project uses `@base-ui/react@^1.3.0` (the shadcn v4 base). Phase 1 note: "shadcn v4 uses @base-ui/react".
   - What's unclear: Whether `npx shadcn add select` generates a Base UI-backed Select or a Radix UI-backed one.
   - Recommendation: Run `npx shadcn add select` and inspect the generated file. If it imports from `@radix-ui/react-select`, that package installs automatically. No manual Radix install needed.

---

## Sources

### Primary (HIGH confidence)
- Project codebase direct reads: `src/lib/schema-registry/types.ts`, `src/lib/schema-registry/index.ts`, `src/lib/ai/extraction-schema.ts`, `src/components/asset/ConfidenceBadge.tsx`, `src/lib/actions/asset.actions.ts`, `src/app/(app)/assets/[id]/extract/page.tsx`, `src/components/asset/ExtractionPageClient.tsx`, `src/components/asset/ExtractionResultPanel.tsx`
- Migration files: all 3 Supabase migrations read directly
- `package.json`: confirmed installed packages
- `vitest.config.ts`: confirmed test framework configuration

### Secondary (MEDIUM confidence)
- RHF + Zod v4 compatibility: inferred from `@hookform/resolvers` v3.x changelog (Zod v4 support added in 3.9.x, released 2025)
- shadcn v4 `@base-ui/react` pattern: confirmed from Phase 1 STATE.md decision log

### Tertiary (LOW confidence — flag for validation)
- Exact `@hookform/resolvers` version for Zod v4.3.6 compatibility: stated as `^3.9` — verify during installation in Wave 0

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json; RHF absence confirmed; shadcn gaps confirmed from filesystem
- Architecture patterns: HIGH — derived from existing codebase patterns, not speculation
- DB schema changes: HIGH — confirmed from migration files; `checklist_state` absence confirmed
- Pitfalls: HIGH (most) / MEDIUM (Zod v4 + RHF resolver compatibility) — based on known RHF/Zod v4 release history
- Blocking field classification: HIGH for `vin`/`registration_number` (in truck schema); LOW for `serial_number` (not yet verified in other schemas)

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain — RHF + Zod + shadcn change slowly)
