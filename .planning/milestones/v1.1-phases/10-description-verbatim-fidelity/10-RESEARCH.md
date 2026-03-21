# Phase 10: Description Verbatim Fidelity - Research

**Researched:** 2026-03-21
**Domain:** LLM prompt engineering — system prompt rules + user prompt restructuring (Next.js API route, TypeScript)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fix approach: Both system prompt rule AND user prompt restructuring (belt-and-suspenders)
- System prompt: add a bullet under the existing `UNIVERSAL RULES` block:
  - `Values and measurements from inspection notes must appear verbatim in the description — do not paraphrase, convert units, or interpret. If notes say '48" sleeper cab', write '48" sleeper cab'`
- User prompt: restructure `buildDescriptionUserPrompt` to split inspection_notes into two labelled blocks:
  1. `Staff-provided values (use verbatim):` — contains the parsed key:value structured lines (VIN, Suspension, Odometer etc.)
  2. `Inspection notes:` — contains the freeform `Notes: ...` content only
- Reuse `parseStructuredFields` from `src/app/api/extract/route.ts` (not a new inline parser)
- All key:value structured lines go into the verbatim block — including VIN, Suspension, Odometer, Hourmeter etc.
- Freeform notes (everything after `Notes:`) remain in the `Inspection notes:` block
- No UI changes. No schema changes.

### Claude's Discretion
- Exact wording of the new UNIVERSAL RULES bullet (must cover: don't paraphrase, don't convert units, use exact values from notes)
- Whether to skip the `Staff-provided values` block entirely if inspection_notes has no key:value lines (graceful fallback)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DESCR-01 | AI-generated description preserves specific values from inspection notes verbatim (e.g., `48" sleeper cab` is not paraphrased to `sleeper cab`) | Belt-and-suspenders: system prompt rule + user prompt split into verbatim/freeform blocks; `parseStructuredFields` already extracts key:value lines cleanly |
</phase_requirements>

## Summary

Phase 10 is a surgical, two-change fix to a single file (`src/app/api/describe/route.ts`). The root cause is that GPT-4o paraphrases staff-entered values (e.g., `48" sleeper cab` becomes `sleeper cab`) because the current user prompt presents all inspection notes as undifferentiated freeform text, giving the model no signal that specific values must be preserved literally.

The fix works at two layers. First, a new UNIVERSAL RULES bullet tells the model explicitly: do not paraphrase, do not convert units — use the exact value. Second, the user prompt is restructured so that structured key:value lines are presented in a clearly-labelled `Staff-provided values (use verbatim):` block, while freeform notes appear separately in an `Inspection notes:` block. The semantic labelling reinforces the system prompt instruction and removes the model's ambiguity about what it can reinterpret.

`parseStructuredFields` is already exported from `src/app/api/extract/route.ts` and tested. It correctly separates key:value lines from freeform notes content and excludes the `Notes` key itself. Import and call directly — no changes needed to that function.

**Primary recommendation:** Two edits to `src/app/api/describe/route.ts` — one line added to `DESCRIPTION_SYSTEM_PROMPT` under `UNIVERSAL RULES:`, and `buildDescriptionUserPrompt` rewritten to use `parseStructuredFields` for the split. No other files change.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | already installed | `generateText` call — no changes | Already in use; describe route uses `generateText` with plain text output |
| `@ai-sdk/openai` | already installed | GPT-4o model provider — no changes | Already in use |
| `parseStructuredFields` | local export | Parse `key: value` lines from inspection_notes | Already written, tested, exported from extract route |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript native string ops | — | Extract freeform notes content from inspection_notes | `notes.split('\n').filter(...)` for the `Notes: <freeform>` line |

### Alternatives Considered
None applicable — this is a prompt engineering fix within an established codebase. No new libraries are needed.

**Installation:**
```bash
# No new packages required
```

## Architecture Patterns

### Recommended Project Structure
No structural changes. Only `src/app/api/describe/route.ts` is modified.

### Pattern 1: Belt-and-Suspenders Prompt Constraint
**What:** Apply the same constraint at both system prompt level (rule) and user prompt level (structured block labelling). Either layer alone can fail; both together is reliable.
**When to use:** When a model must treat certain input text as non-negotiable literal values, not raw material to interpret.
**Example:**
```typescript
// System prompt addition under UNIVERSAL RULES:
`- Values and measurements from inspection notes must appear verbatim in the description — do not paraphrase, convert units, or interpret. If notes say '48" sleeper cab', write '48" sleeper cab'`

// User prompt restructuring:
`Staff-provided values (use verbatim):
Suspension Type: Airbag
Odometer: 187450

Inspection notes:
Cab needs a clean. Minor rust on chassis rails.`
```

### Pattern 2: Import parseStructuredFields from extract route
**What:** `parseStructuredFields` is already exported from `src/app/api/extract/route.ts`. Import it directly into `describe/route.ts`.
**When to use:** Whenever describe route needs to parse inspection_notes.
**Example:**
```typescript
// At top of src/app/api/describe/route.ts:
import { parseStructuredFields } from '@/app/api/extract/route'

// Inside buildDescriptionUserPrompt:
function buildDescriptionUserPrompt(asset: { ... }): string {
  const fieldLines = Object.entries(asset.fields ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const structuredFields = parseStructuredFields(asset.inspection_notes)
  const verbatimLines = Object.entries(structuredFields)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  // Extract freeform notes content (the value after 'Notes: ')
  const freeformNotes = asset.inspection_notes
    ? (asset.inspection_notes.split('\n').find(l => l.startsWith('Notes: '))?.slice('Notes: '.length) ?? '')
    : ''

  const parts: string[] = [
    `Asset type: ${asset.asset_type}`,
    `Subtype: ${asset.asset_subtype ?? 'unknown'}`,
    '',
    'Confirmed fields:',
    fieldLines,
  ]

  if (verbatimLines) {
    parts.push('', 'Staff-provided values (use verbatim):', verbatimLines)
  }

  if (freeformNotes) {
    parts.push('', 'Inspection notes:', freeformNotes)
  }

  return parts.join('\n')
}
```

### Pattern 3: Graceful Fallback When No Structured Fields
**What:** Skip the `Staff-provided values` block entirely when inspection_notes contains no key:value lines. This avoids injecting an empty block that could confuse the model.
**When to use:** Always — `verbatimLines` will be empty string when `parseStructuredFields` returns `{}`.
**Example:**
```typescript
if (verbatimLines) {
  parts.push('', 'Staff-provided values (use verbatim):', verbatimLines)
}
```

### Anti-Patterns to Avoid
- **Presenting all inspection_notes as a single undifferentiated block:** The current code does this — `Inspection notes: ${asset.inspection_notes}`. It gives the model no signal that the key:value lines contain literal values. This is the bug.
- **Writing a second parser inline in describe/route.ts:** `parseStructuredFields` already exists, is exported, and is tested. A second implementation risks divergence and is unnecessary.
- **Modifying `parseStructuredFields` itself:** The existing function is correct and has passing tests. Do not change it. Import and use as-is.
- **Adding the verbatim rule to the wrong prompt section:** The rule must go under `UNIVERSAL RULES:` in `DESCRIPTION_SYSTEM_PROMPT` (around line 24), not in a template section. Template sections are asset-type-specific; this rule applies universally.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parsing key:value lines from inspection_notes | New inline parser in describe/route.ts | `parseStructuredFields` from extract/route.ts | Already written, exported, and has 4 passing tests covering edge cases (null input, malformed lines, Notes exclusion) |

**Key insight:** `parseStructuredFields` returns `Record<string, string>` — every key:value line except `Notes`. Use `Object.entries()` to render the verbatim block. No additional parsing logic is needed.

## Common Pitfalls

### Pitfall 1: Importing from a Next.js API route
**What goes wrong:** `src/app/api/extract/route.ts` exports `parseStructuredFields` but is a Next.js route file (`export async function POST`). Some bundler configurations treat route files as server-only and may warn or error on cross-route imports.
**Why it happens:** Next.js treats `app/api/**/route.ts` files as route handlers. Importing between route files is technically valid TypeScript but is an unusual pattern.
**How to avoid:** This project already imports across route boundaries in other cases. If bundler issues arise, extract `parseStructuredFields` to a shared utility file (e.g., `src/lib/ai/parse-structured-fields.ts`) and update both routes to import from there. For this phase, attempt the direct import first — it is simpler and may work fine.
**Warning signs:** TypeScript errors about server-only or edge runtime incompatibilities at build time.

### Pitfall 2: Existing describe-route tests break on prompt structure change
**What goes wrong:** `src/__tests__/describe-route.test.ts` has a test asserting `messages[0].content` contains `'UNIVERSAL RULES'` and another asserting image entries are present. These will still pass. However, if any test inspects the user prompt text content specifically (e.g., checking for `'Inspection notes:'`), it will need updating to match the new block structure.
**Why it happens:** Tests were written against the current single-block user prompt format.
**How to avoid:** Read `describe-route.test.ts` before modifying the route. Identify any assertions on user message text content. Update those assertions to match the new two-block format.
**Current state:** Existing tests check `messages[0].content` (system prompt) and image entries. None currently assert on the specific text content of the user prompt text block. No test updates needed for existing tests — but new tests must be added for the verbatim split behaviour (see Validation Architecture).

### Pitfall 3: Freeform notes extraction edge cases
**What goes wrong:** The freeform notes line (`Notes: <text>`) may not be present at all (no freeform notes were entered), or may be multi-line if the textarea serialisation produces newlines within the value.
**Why it happens:** `InspectionNotesSection.tsx` serialises as `key: value\n...Notes: <freeform>`. The `Notes:` value is everything on the `Notes: ` line. It is a single line, not multiline — the textarea value is stored as-is on one logical line after the `Notes: ` prefix.
**How to avoid:** Use `.find(l => l.startsWith('Notes: '))?.slice('Notes: '.length) ?? ''` to extract the freeform value safely. Wrap in a conditional: only add the `Inspection notes:` block if `freeformNotes` is non-empty.

### Pitfall 4: Block appears even with no inspection_notes
**What goes wrong:** If `asset.inspection_notes` is null/empty, the verbatim and freeform blocks should both be absent. Calling `parseStructuredFields(null)` is safe (returns `{}`), but the outer conditional must also guard against null inspection_notes before attempting string operations.
**How to avoid:** Guard `freeformNotes` extraction behind `asset.inspection_notes` null check before calling `.split('\n')`.

## Code Examples

Verified patterns from the existing codebase:

### parseStructuredFields — existing implementation (do not change)
```typescript
// Source: src/app/api/extract/route.ts lines 8-21
export function parseStructuredFields(notes: string | null): Record<string, string> {
  if (!notes) return {}
  const result: Record<string, string> = {}
  for (const line of notes.split('\n')) {
    const colonIdx = line.indexOf(': ')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 2).trim()
    // 'Notes' is the freeform textarea key — not a structured field
    if (key === 'Notes' || !key || !value) continue
    result[key] = value
  }
  return result
}
```

### Current buildDescriptionUserPrompt — the function being replaced
```typescript
// Source: src/app/api/describe/route.ts lines 189-207 (current state)
function buildDescriptionUserPrompt(asset: { ... }): string {
  const fieldLines = Object.entries(asset.fields ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  return [
    `Asset type: ${asset.asset_type}`,
    `Subtype: ${asset.asset_subtype ?? 'unknown'}`,
    '',
    'Confirmed fields:',
    fieldLines,
    '',
    asset.inspection_notes ? `Inspection notes: ${asset.inspection_notes}` : '',
  ].filter(Boolean).join('\n')
}
```

### DESCRIPTION_SYSTEM_PROMPT UNIVERSAL RULES block — where the new bullet is inserted
```typescript
// Source: src/app/api/describe/route.ts lines 17-25 (current state)
UNIVERSAL RULES:
- No dot points
- No serial numbers in description
- No hours, odometer, or GVM in description body
- No marketing language
- Blank line between each significant item or group
- Short related items share a line separated by commas
- Always closes with "Sold As Is, Untested & Unregistered." or "Sold As Is, Untested." for attachments and general goods

// New bullet to add (position: after the last existing bullet, before the blank line):
- Values and measurements from inspection notes must appear verbatim in the description — do not paraphrase, convert units, or interpret. If notes say '48" sleeper cab', write '48" sleeper cab'
```

### Test pattern used in describe-route.test.ts
```typescript
// Source: src/__tests__/describe-route.test.ts
// The mock structure for asset data — update inspection_notes fixture for new tests:
data: {
  id: 'asset-1',
  asset_type: 'truck',
  asset_subtype: 'prime_mover',
  fields: { vin: 'ABC123' },
  inspection_notes: 'Suspension Type: Airbag\nOdometer: 187450\nNotes: 48" sleeper cab, needs clean'
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single undifferentiated inspection_notes block | Split into verbatim block + freeform notes block | Phase 10 | GPT-4o receives explicit labelling; verbatim rule reinforced at both prompt levels |

**Deprecated/outdated:**
- Single `Inspection notes: ${asset.inspection_notes}` block: replaced by the two-block split in Phase 10. The freeform notes portion of the block is preserved under a new heading.

## Open Questions

1. **Cross-route import compatibility**
   - What we know: TypeScript allows importing exported functions between route files; `parseStructuredFields` is a plain exported function with no server-only dependencies
   - What's unclear: Whether Next.js 14/15 build or edge runtime adds restrictions on cross-route imports
   - Recommendation: Attempt direct import first. If the build fails, extract `parseStructuredFields` to `src/lib/ai/parse-structured-fields.ts` and update both routes. Do not pre-emptively move it — that expands scope unnecessarily.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (configured in `vitest.config.ts`) |
| Config file | `/home/jack/projects/prestige_assets/vitest.config.ts` |
| Quick run command | `npx vitest run src/__tests__/describe-route.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DESCR-01 | `buildDescriptionUserPrompt` splits inspection_notes into verbatim block and freeform notes block | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ✅ (file exists; new tests added in Wave 0) |
| DESCR-01 | System prompt contains verbatim rule bullet | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ✅ (existing test checks `UNIVERSAL RULES` — extend to check new bullet text) |
| DESCR-01 | `parseStructuredFields` reuse — structured fields appear in verbatim block, not freeform block | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ✅ (new test fixture needed) |
| DESCR-01 | Graceful fallback: no verbatim block when inspection_notes has no key:value lines | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ✅ (new test case needed) |
| DESCR-01 | Graceful fallback: no freeform block when no `Notes:` line in inspection_notes | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ✅ (new test case needed) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/describe-route.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New test cases in `src/__tests__/describe-route.test.ts` covering the verbatim split behavior — the file exists but the new behaviour is not yet tested. Add before or alongside the implementation task.

## Sources

### Primary (HIGH confidence)
- Direct code read: `src/app/api/describe/route.ts` — full file, lines 1–276 — current `DESCRIPTION_SYSTEM_PROMPT` structure and `buildDescriptionUserPrompt` implementation confirmed
- Direct code read: `src/app/api/extract/route.ts` — lines 8–21 — `parseStructuredFields` signature, implementation, and export confirmed
- Direct code read: `src/__tests__/describe-route.test.ts` — full file — confirmed no existing assertions on user prompt text block content; existing mock structure identified
- Direct code read: `src/__tests__/extract-route.test.ts` — lines 177–201 — confirmed `parseStructuredFields` tests: null input, Notes exclusion, malformed lines, multi-field parsing

### Secondary (MEDIUM confidence)
- `.planning/phases/10-description-verbatim-fidelity/10-CONTEXT.md` — implementation decisions locked by discuss-phase

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — codebase read directly; no new libraries; existing exports confirmed
- Architecture: HIGH — both files read in full; `parseStructuredFields` signature and tests confirmed; no uncertainty in implementation approach
- Pitfalls: HIGH for cross-route import (known Next.js pattern); HIGH for test breakage (checked all existing assertions); MEDIUM for freeform notes edge cases (based on code analysis, not runtime observation)

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable codebase — valid until next route change)
