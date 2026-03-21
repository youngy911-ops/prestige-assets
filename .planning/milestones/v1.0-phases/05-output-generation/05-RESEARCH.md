# Phase 5: Output Generation - Research

**Researched:** 2026-03-19
**Domain:** Salesforce copy-paste output — deterministic fields formatter, GPT-4o description generation, clipboard UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Description generation:** GPT-4o (same model as Phase 3 extraction) — NOT deterministic templates, NOT Claude API
- **Route Handler pattern:** Server-side `/api/describe` Route Handler (same pattern as `/api/extract`) — API key never client-side
- **GPT-4o input:** confirmed field values from `assets.fields` JSONB + all uploaded photos (base64, same as Phase 3) + inspection notes
- **GPT-4o output:** plain text — no markdown, no commentary, exactly matching the subtype template format
- **System prompt:** fully defined in `.planning/phases/05-output-generation/05-description-prompt.md` — use verbatim
- **Footer:** "Sold As Is, Untested & Unregistered." for most types; "Sold As Is, Untested." for attachments and general goods
- **TBC:** for any spec that cannot be confirmed from photos, inspection notes, or training knowledge
- **`descriptionTemplate` stubs in Schema Registry:** now obsolete — prompt replaces them
- **Auto-generation on page load:** description call fires when staff arrive at `/assets/[id]/output`
- **Loading state:** shown while GPT-4o call is in progress
- **Regenerate button:** fires a fresh GPT-4o call; warns staff if they have edited the text before overwriting
- **Error handling:** auto-retry once on failure/timeout; if retry also fails: show clear error message + empty editable textarea (fields block still visible)
- **Description editability:** rendered in an editable textarea — staff can tweak before copy-pasting to Salesforce; not saved back to DB automatically
- **Fields block:** every field for the asset type in `sfOrder` order with exact `label` values from Schema Registry; uses confirmed field values from `assets.fields` JSONB
- **Copy-to-clipboard:** each block (fields and description) has its own copy button with visible confirmation
- **Back link:** routes to `/assets/[id]/review`
- **New Asset button:** routes to `/assets/new` (wizard entry)
- **Glass's Valuation:** permanently out of scope — not in Phase 5, not in v2, not in this project

### Claude's Discretion

- Empty/null field handling in the fields block (show blank vs omit line vs show "—")
- Exact copy confirmation treatment (toast vs inline label change)
- Whether generated description is persisted to DB to avoid unnecessary regeneration on revisit
- New Asset button destination (wizard step 1 is recommended)
- Output page overall visual layout (stacked blocks, card treatment, spacing)

### Deferred Ideas (OUT OF SCOPE)

- Glass's Valuation (Caravan) — permanently removed from scope
- Forklift / Agriculture description templates — researcher should note this gap (see Open Questions)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SF-01 | App generates a copy-paste-ready structured fields block for each asset with fields in the correct Salesforce order and correct field labels for that asset type | `getFieldsSortedBySfOrder()` in Schema Registry is the direct driver; `FieldDefinition.label` and `sfOrder` are the source of truth; all 7 asset type schemas verified |
| SF-02 | App generates a correctly formatted description block per asset subtype using GPT-4o with a locked system prompt — correct line ordering, no dot points, no marketing language, footer; output is editable before copy-paste | System prompt fully specified in `05-description-prompt.md`; Route Handler pattern established by `/api/extract`; AI SDK v6 `generateText` (not deprecated `generateObject`) is the correct call pattern |
| SF-03 | Each output section has its own copy-to-clipboard button with visual confirmation | `navigator.clipboard.writeText()` is the correct browser API; inline label-change confirmation pattern decided in UI-SPEC |
</phase_requirements>

---

## Summary

Phase 5 has three concrete deliverables: a `generateFieldsBlock()` utility, a `/api/describe` Route Handler, and an `OutputPanel` component. All three are well-specified by existing project documents — the Schema Registry drives the fields block, the system prompt drives the description, and the `/api/extract` Route Handler is the direct pattern to replicate for the description call.

The fields block is purely deterministic. `getFieldsSortedBySfOrder(assetType)` already exists in `src/lib/schema-registry/index.ts` and returns the fields in the exact output order. The formatter loops those fields, maps `field.label: value` (blank when null/empty), and joins with newlines. This is a simple pure function with no dependencies beyond the Schema Registry.

The description Route Handler mirrors `/api/extract` exactly — auth check, load asset + photos, generate signed URLs, call `generateText` with the system prompt from `05-description-prompt.md`, return plain text. The key difference: instead of `Output.object({ schema })` (structured output), this call returns plain text via the `text` property on the `generateText` result. Persistence to `assets.description` (new DB column) avoids re-generation on revisit.

The `OutputPanel` is a Client Component that fires the description POST on mount, holds loading/error/text states, and renders two cards — `FieldsBlock` (synchronous, always visible) and `DescriptionBlock` (async, editable textarea). Copy confirmation uses the inline label-change pattern established in the UI-SPEC. All UI patterns and copywriting are fully specified in `05-UI-SPEC.md`.

**Primary recommendation:** Build in plan order — 05-01 (fields utility + tests), 05-02 (Route Handler + DB migration), 05-03 (OutputPanel component). Each is independently testable.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | ^6.0.116 | GPT-4o call via `generateText` | Already installed; established in Phase 3 |
| `@ai-sdk/openai` | ^3.0.41 | OpenAI provider for AI SDK | Already installed; used by `/api/extract` |
| `lucide-react` | ^0.577.0 | Icons: Copy, Check, RefreshCw, Loader2, ChevronLeft | Already installed; used throughout |
| `next` (Route Handlers) | 16.1.7 | `/api/describe` server-side handler | Established pattern in this project |
| `@supabase/ssr` | ^0.9.0 | Auth + DB read/write | Established pattern in this project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Button | existing | Copy + Regenerate + New Asset buttons | All interactive controls |
| shadcn Card | existing | Output block containers | Both blocks |
| shadcn Textarea | existing | Editable description | Description block |
| `navigator.clipboard` | browser native | Clipboard write | Copy-to-clipboard action |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `navigator.clipboard.writeText()` | `document.execCommand('copy')` | execCommand is deprecated; clipboard API is correct modern approach; requires HTTPS (already true in production) |
| Inline label-change confirmation | Toast notification | Toast risks z-index conflicts; inline change is simpler and sufficient for single-action confirmation |
| DB persistence of description | Always regenerate on revisit | Always regenerating wastes GPT-4o credits and adds latency; DB persistence is correct |

**Installation:** No new packages required. All dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── describe/
│   │       └── route.ts          # POST /api/describe — GPT-4o description call
│   └── (app)/assets/[id]/
│       └── output/
│           └── page.tsx          # Server Component — loads asset, passes to OutputPanel
├── components/asset/
│   ├── OutputPanel.tsx           # Client Component — orchestrates both blocks, description state
│   ├── FieldsBlock.tsx           # Client Component — fields list + copy button
│   └── DescriptionBlock.tsx      # Client Component — textarea + copy + regenerate
└── lib/
    └── output/
        └── generateFieldsBlock.ts  # Pure utility — sfOrder formatter
```

### Pattern 1: Fields Block Formatter (Pure Function)

**What:** `generateFieldsBlock(assetType, fields)` — loops `getFieldsSortedBySfOrder(assetType)`, maps each field to `"{label}: {value}"` (blank value when null/undefined/empty), joins with `\n`.

**When to use:** Called once on the server page render; result passed as prop to `FieldsBlock`. Can also be called client-side on-demand.

**Key decisions from UI-SPEC:**
- Show blank value — never omit a field. `Salesforce Label: ` (no value) signals "not provided" without ambiguity.
- Format: `{Salesforce Label}: {value}` — colon-space separator.
- No blank lines between fields — this is a structured data block, not prose.

```typescript
// src/lib/output/generateFieldsBlock.ts
import { getFieldsSortedBySfOrder } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'

export function generateFieldsBlock(
  assetType: AssetType,
  fields: Record<string, string>
): string {
  const sortedFields = getFieldsSortedBySfOrder(assetType)
  return sortedFields
    .map(f => `${f.label}: ${fields[f.key] ?? ''}`)
    .join('\n')
}
```

### Pattern 2: Description Route Handler (mirrors /api/extract)

**What:** `POST /api/describe` — auth check, load asset + photos, generate signed URLs, call `generateText` with system prompt, persist to `assets.description`, return plain text.

**Critical difference from /api/extract:** Use `generateText` for plain text output — do NOT use `Output.object()`. The `text` property of the result is the description string.

```typescript
// src/app/api/describe/route.ts — key section
const { text } = await generateText({
  model: openai('gpt-4o'),
  messages: [
    { role: 'system', content: DESCRIPTION_SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        { type: 'text', text: buildDescriptionUserPrompt(asset) },
        ...signedUrls.map(url => ({ type: 'image' as const, image: url })),
      ],
    },
  ],
})
// Persist to DB
await supabase.from('assets').update({ description: text }).eq('id', assetId).eq('user_id', user.id)
return Response.json({ success: true, description: text })
```

**System prompt source:** Import verbatim from `05-description-prompt.md` as a constant. Do not paraphrase or shorten it.

**User prompt content:** Pass confirmed fields as formatted text + inspection notes. Example:

```typescript
function buildDescriptionUserPrompt(asset: AssetRecord): string {
  const fieldLines = Object.entries(asset.fields as Record<string, string>)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  return [
    `Asset type: ${asset.asset_type}`,
    `Subtype: ${asset.asset_subtype}`,
    '',
    'Confirmed fields:',
    fieldLines,
    '',
    asset.inspection_notes ? `Inspection notes: ${asset.inspection_notes}` : '',
  ].filter(Boolean).join('\n')
}
```

### Pattern 3: OutputPanel Client Component

**What:** Client Component that fires POST `/api/describe` on mount (`useEffect`), holds `descriptionState: 'loading' | 'ready' | 'error'`, `descriptionText: string`, `hasEdited: boolean`.

**On-mount logic:**
1. Check if `initialDescription` prop is non-null (passed from server page when `assets.description` exists) — if so, skip the POST and set state to `'ready'`.
2. If null, fire POST `/api/describe`. On success, set state to `'ready'` with returned text. On failure, auto-retry once. On second failure, set state to `'error'`.

**Regenerate flow:**
1. If `hasEdited`, call `window.confirm('Your edits will be lost. Regenerate description?')`. If user cancels, do nothing.
2. Fire POST `/api/describe`. During call: textarea `readOnly`, button shows "Regenerating…" with spinner.
3. On success: update `descriptionText`, reset `hasEdited` to false.

### Pattern 4: Copy-to-Clipboard Confirmation

**What:** Inline label change — `'Copy Fields'` / `'Copy Description'` → `'Copied!'` for 2000ms, then reverts.

```typescript
// Inside FieldsBlock / DescriptionBlock
const [copied, setCopied] = useState(false)

async function handleCopy(text: string) {
  await navigator.clipboard.writeText(text)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}
// Button label: copied ? 'Copied!' : 'Copy Fields'
// Button icon:  copied ? <Check /> : <Copy />
```

### Anti-Patterns to Avoid

- **Using `Output.object()` for plain text:** `/api/describe` returns prose, not structured JSON. Use `generateText` and read `.text`. `Output.object()` is for structured extraction only.
- **Calling description API from Server Component:** The description call is long-running (5-15s). It must fire client-side from `useEffect`, not during SSR — otherwise the page hangs.
- **Omitting fields with blank values from the fields block:** Salesforce operators paste the entire block as a template. Missing field labels break their workflow. Always include every field.
- **Re-generating on every revisit:** The description is persisted to `assets.description`. Check this on page load and skip the API call if it's non-null.
- **Importing system prompt as a string literal in route.ts:** Keep the system prompt in a constant (e.g. `DESCRIPTION_SYSTEM_PROMPT` imported from a separate file) so it can be updated without touching the route handler logic.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Field sort order | Custom sort logic | `getFieldsSortedBySfOrder()` from schema-registry | Already exists; sorts by `sfOrder` ascending; tested |
| Salesforce field labels | Custom label mapping | `FieldDefinition.label` from schema-registry | These are the exact labels Jack uses in Salesforce; any deviation breaks copy-paste |
| GPT-4o call | Custom fetch to OpenAI API | `generateText` from `ai` (Vercel AI SDK) | Already installed and established in Phase 3; handles retries, timeouts, and streaming |
| Auth check in Route Handler | Custom session logic | `createClient()` from `@/lib/supabase/server` + `auth.getUser()` | Established pattern; mirrors `/api/extract` exactly |
| Photo signed URLs | Custom storage logic | Supabase `createSignedUrl()` | Already used in `/api/extract`; handles private bucket access |

**Key insight:** The entire fields block problem is solved by two existing functions (`getFieldsSortedBySfOrder` + `FieldDefinition.label`). The implementation is a single loop, not a complex formatter.

---

## Common Pitfalls

### Pitfall 1: Description API fires during SSR

**What goes wrong:** If the `/api/describe` call is triggered in a Server Component (e.g. in an `async` page), the page takes 5-15 seconds to render. Mobile users see a blank screen.

**Why it happens:** Server Components await all data before streaming HTML. Long-running AI calls block rendering.

**How to avoid:** The description call fires client-side in `useEffect` inside `OutputPanel`. The server page renders immediately with the fields block visible. The description block shows a loading state.

**Warning signs:** Page hangs for several seconds before anything appears.

### Pitfall 2: `navigator.clipboard` fails on HTTP or in tests

**What goes wrong:** `navigator.clipboard.writeText()` throws in non-secure contexts (HTTP) and in JSDOM test environments.

**Why it happens:** Clipboard API requires HTTPS and user gesture.

**How to avoid:** In production this is not an issue (Next.js app runs HTTPS). In tests, mock `navigator.clipboard`:

```typescript
// In test setup
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
})
```

**Warning signs:** Copy button silently fails; no error surfaced to user.

### Pitfall 3: Description persisted but stale after revisit

**What goes wrong:** If user reviews asset again (Phase 4), the `assets.fields` JSONB changes, but `assets.description` still holds the old description from before the re-review.

**Why it happens:** Description is generated once and cached, but the source fields can change if user goes back.

**How to avoid:** When `saveReview` (Phase 4 Server Action) saves new field values, it should also clear `assets.description` (set to null). This ensures the output page re-generates for a fresh review. Note: this is a Phase 4 integration point that needs a one-line addition to the existing `saveReview` action.

**Warning signs:** Description mentions specs that don't match the confirmed fields.

### Pitfall 4: `window.confirm()` is synchronous and blocks

**What goes wrong:** Using `confirm()` in the Regenerate flow is fine for MVP but will block the main thread on mobile browsers (some mobile browsers don't support it).

**Why it happens:** `window.confirm` is a synchronous dialog API.

**How to avoid:** The UI-SPEC specifies `window.confirm` — use it as specified. This is an acceptable MVP trade-off. If it becomes a problem, replace with an inline warning state rather than a modal library.

**Warning signs:** On some Android browsers, `confirm()` returns `true` without showing a dialog.

### Pitfall 5: Forklift and Agriculture schemas have no description subtypes in the system prompt

**What goes wrong:** The system prompt in `05-description-prompt.md` does not have explicit templates for Forklift or Agriculture asset types. GPT-4o will fall back to its general knowledge for these types.

**Why it happens:** The CONTEXT.md explicitly deferred "Forklift / Agriculture description templates."

**How to avoid:** The system prompt's "ATTACHMENTS / GENERAL GOODS" template will likely be used as a fallback by GPT-4o for unrecognized types. Staff should be made aware that forklift/agriculture descriptions may need more manual editing. This is an accepted gap for v1.

**Warning signs:** Description for a forklift reads like "general goods" rather than using forklift-specific line ordering.

---

## Code Examples

Verified patterns from existing codebase:

### generateFieldsBlock() — complete implementation

```typescript
// src/lib/output/generateFieldsBlock.ts
import { getFieldsSortedBySfOrder } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'

export function generateFieldsBlock(
  assetType: AssetType,
  fields: Record<string, string>
): string {
  const sortedFields = getFieldsSortedBySfOrder(assetType)
  return sortedFields
    .map(f => `${f.label}: ${fields[f.key] ?? ''}`)
    .join('\n')
}
```

### /api/describe Route Handler — structural skeleton (mirrors /api/extract)

```typescript
// src/app/api/describe/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const SYSTEM_PROMPT = `...` // Verbatim from 05-description-prompt.md

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { assetId } = await req.json()

  const { data: asset } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, fields, inspection_notes')
    .eq('id', assetId)
    .single()
  if (!asset) return Response.json({ error: 'Asset not found' }, { status: 404 })

  const { data: photos } = await supabase
    .from('asset_photos')
    .select('storage_path')
    .eq('asset_id', assetId)
    .order('sort_order', { ascending: true })

  const signedUrls = (
    await Promise.all(
      (photos ?? []).map(async (p) => {
        const { data } = await supabase.storage
          .from('photos')
          .createSignedUrl(p.storage_path, 3600)
        return data?.signedUrl ?? null
      })
    )
  ).filter((url): url is string => url !== null)

  const { text } = await generateText({
    model: openai('gpt-4o'),
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: buildUserPrompt(asset) },
          ...signedUrls.map(url => ({ type: 'image' as const, image: url })),
        ],
      },
    ],
  })

  await supabase
    .from('assets')
    .update({ description: text })
    .eq('id', assetId)
    .eq('user_id', user.id)

  return Response.json({ success: true, description: text })
}
```

### Output page — Server Component structure (mirrors review/page.tsx)

```typescript
// src/app/(app)/assets/[id]/output/page.tsx
export default async function OutputPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assetId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: asset } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, fields, description')
    .eq('id', assetId)
    .single()
  if (!asset) redirect('/assets/new')

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header — same pattern as review/page.tsx */}
      <OutputPanel
        assetId={assetId}
        assetType={asset.asset_type}
        fields={asset.fields}
        initialDescription={asset.description}
      />
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Deterministic description templates (`descriptionTemplate` stubs) | GPT-4o with locked system prompt | 2026-03-19 (CONTEXT.md decision) | Templates are obsolete; do not implement them; use the system prompt from `05-description-prompt.md` |
| `generateObject` (deprecated AI SDK) | `generateText` + `Output.object()` for structured; `generateText` alone for plain text | Phase 3 established | For descriptions, use `generateText` and read `.text`; never use `generateObject` |

**Deprecated/outdated:**
- `AssetSchema.descriptionTemplate`: Stub that returns empty string on all schemas. Still present in code but obsolete for Phase 5. Do not invoke it.
- `AssetSchema.hasGlassValuation`: Present on caravan schema (`true`) but permanently out of scope. Do not reference in Phase 5 output.

---

## Open Questions

1. **Forklift and Agriculture description templates**
   - What we know: `05-description-prompt.md` has no explicit templates for these types. The system prompt lists templates for Truck, Tipper, Service Truck, Trailer, Excavator, Dozer, Grader, Skid Steer, Wheel Loader, Telehandler, Backhoe, Caravan, Motor Vehicle, Attachments/General Goods, Marine.
   - What's unclear: Will GPT-4o produce acceptable descriptions for Forklift and Agriculture by inference, or will output be poor/inconsistent?
   - Recommendation: For v1, accept the gap — GPT-4o will likely produce reasonable output using its training knowledge of these asset types. The description is editable, so staff can correct. Track as a known limitation. If output quality is unacceptable during UAT, Jack can add templates to `05-description-prompt.md` without changing any code.

2. **saveReview stale description clearing**
   - What we know: If staff re-reviews an asset (goes back to Phase 4), `assets.fields` changes but `assets.description` retains the old cached value.
   - What's unclear: Is the Phase 4 `saveReview` Server Action the right place to clear `assets.description`?
   - Recommendation: Yes — add `description: null` to the `saveReview` update payload in Phase 4. This is a one-line change. Plan 05-02 should include this as an integration task.

3. **DB column `assets.description` — does it exist?**
   - What we know: The current schema (migrations through `20260319000004_review_checklist.sql`) does not include a `description` column.
   - What's unclear: Nothing — it clearly needs to be added.
   - Recommendation: Plan 05-02 creates migration `20260319000005_description_column.sql` adding `description text` column (nullable) to `assets`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 |
| Config file | `vitest.config.ts` (inferred from package.json scripts) |
| Quick run command | `npx vitest run src/__tests__/generate-fields-block.test.ts src/__tests__/describe-route.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SF-01 | `generateFieldsBlock()` returns all fields in sfOrder with correct labels | unit | `npx vitest run src/__tests__/generate-fields-block.test.ts` | Wave 0 |
| SF-01 | `generateFieldsBlock()` shows blank (not omitted) for null/empty fields | unit | `npx vitest run src/__tests__/generate-fields-block.test.ts` | Wave 0 |
| SF-01 | `generateFieldsBlock()` snapshot — truck, trailer, earthmoving, forklift, caravan, agriculture, general_goods | snapshot | `npx vitest run src/__tests__/generate-fields-block.test.ts` | Wave 0 |
| SF-02 | `POST /api/describe` returns 401 for unauthenticated request | unit | `npx vitest run src/__tests__/describe-route.test.ts` | Wave 0 |
| SF-02 | `POST /api/describe` returns 400 when assetId missing | unit | `npx vitest run src/__tests__/describe-route.test.ts` | Wave 0 |
| SF-02 | `POST /api/describe` calls `generateText` with system prompt and photos | unit | `npx vitest run src/__tests__/describe-route.test.ts` | Wave 0 |
| SF-02 | `POST /api/describe` persists description to DB | unit | `npx vitest run src/__tests__/describe-route.test.ts` | Wave 0 |
| SF-02 | `POST /api/describe` returns cached description if `assets.description` already set | manual | — | manual-only: requires live Supabase |
| SF-03 | Copy button triggers `navigator.clipboard.writeText` with correct text | unit | `npx vitest run src/__tests__/output-panel.test.tsx` | Wave 0 |
| SF-03 | Copy button shows "Copied!" state for 2000ms then reverts | unit | `npx vitest run src/__tests__/output-panel.test.tsx` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/__tests__/generate-fields-block.test.ts` (05-01), `npx vitest run src/__tests__/describe-route.test.ts` (05-02), `npx vitest run src/__tests__/output-panel.test.tsx` (05-03)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/generate-fields-block.test.ts` — covers SF-01 (all 7 asset types, blank value handling, snapshot tests)
- [ ] `src/__tests__/describe-route.test.ts` — covers SF-02 (auth, bad input, generateText called correctly, DB persist)
- [ ] `src/__tests__/output-panel.test.tsx` — covers SF-03 (clipboard mock, copy confirmation state)

---

## Sources

### Primary (HIGH confidence)

- Existing codebase: `src/app/api/extract/route.ts` — Route Handler pattern, `generateText` + signed URLs, auth pattern
- Existing codebase: `src/lib/schema-registry/index.ts` — `getFieldsSortedBySfOrder()` confirmed present and correct
- Existing codebase: `src/lib/schema-registry/types.ts` — `FieldDefinition` shape (`key`, `label`, `sfOrder`) confirmed
- Existing codebase: `src/__tests__/extract-route.test.ts` — test pattern for Route Handler (mock structure, vi.mock patterns)
- Project doc: `.planning/phases/05-output-generation/05-description-prompt.md` — exact system prompt, confirmed complete for most asset types
- Project doc: `.planning/phases/05-output-generation/05-UI-SPEC.md` — interaction contracts, confirmed decisions on blank fields, copy confirmation, navigation
- Project doc: `.planning/phases/05-output-generation/05-CONTEXT.md` — locked implementation decisions
- Supabase migrations: current schema confirmed (no `description` column yet; migration needed)

### Secondary (MEDIUM confidence)

- `package.json` — confirmed all required packages are installed (no new installs needed for Phase 5)
- Vitest test pattern: `src/__tests__/extract-route.test.ts` — `vi.mock('server-only')`, mocking `createClient`, mocking AI SDK — direct reuse pattern for `/api/describe` tests

### Tertiary (LOW confidence)

- GPT-4o output quality for Forklift/Agriculture subtypes — no explicit templates in system prompt; output quality is untested; see Open Questions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in `package.json`; all patterns verified in existing source files
- Architecture: HIGH — fields formatter is trivially derived from existing schema functions; Route Handler mirrors `/api/extract` exactly
- Pitfalls: HIGH — clipboard pitfall and SSR pitfall are well-known patterns; stale description pitfall derived from reading the existing `saveReview` code
- Forklift/Agriculture gap: LOW — untested inference; noted as open question

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable — no fast-moving dependencies)
