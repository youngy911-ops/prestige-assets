# Phase 15: Pre-fill Bug Fixes - Research

**Researched:** 2026-03-23
**Domain:** React client-side state, Next.js API routes, navigator.sendBeacon, string parsing utilities
**Confidence:** HIGH

## Summary

Phase 15 fixes two bugs in `InspectionNotesSection`. Both fixes are surgical — no schema changes, no new UI components, no new dependencies.

PREFILL-07 is a pure function bug: `extractFreeformNotes` returns `line.slice(...)` for the first line that starts with `"Notes: "`, but multi-line freeform notes are serialized as `Notes: first-line\nsecond-line\nthird-line`. The function returns only `first-line`. The fix is to collect everything from the `"Notes: "` line to end-of-string and join with `\n`. All lines after the first `"Notes: "` match are treated as continuation of the freeform text (valid because structured fields always appear before the `Notes` line in the serialization format).

PREFILL-08 is a browser lifecycle bug: the `useEffect` cleanup in `InspectionNotesSection` calls `persistNotes()` synchronously on unmount, but `persistNotes` calls `saveInspectionNotes` which is a Next.js Server Action. Server Actions are async network calls — they return a Promise that the browser aborts when the page tears down (iOS back-button, iOS Safari unmount-before-fetch-completes). The fix is to replace the unmount-path call with `navigator.sendBeacon`, which the browser guarantees to deliver even after the page is torn down. The autosave debounce path (500ms) stays on the Server Action — only the unmount flush moves to sendBeacon.

**Primary recommendation:** Fix `extractFreeformNotes` by slicing from the `Notes: ` line to end-of-string; fix the unmount flush by replacing the Server Action call with `navigator.sendBeacon` posting to a new `POST /api/inspection-notes` route.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**PREFILL-07: Notes extraction fix**
- Minimal fix to `extractFreeformNotes` only — change it to collect all lines from the first "Notes: " line to end-of-string and join with `\n`
- No change to `persistNotes` serialization format — storage format stays the same
- No DB migration — accept that any existing records with truncated notes (from multi-line input before this fix) are already lossy; no detection/warning needed
- `parseStructuredFields` does not need changes — it correctly excludes the `Notes` key; any floating orphan lines from old corrupted records are benign (no matching priority field keys)

**PREFILL-08: Unmount flush guarantee**
- Switch unmount flush to `navigator.sendBeacon` + new POST API route
- New route: `POST /api/inspection-notes` — accepts `{ assetId, notes }` as JSON body
- Auth: Supabase cookie-based auth in the route handler (same pattern as other route handlers; sendBeacon sends cookies automatically for same-origin requests)
- The existing `saveInspectionNotes` Server Action is retained for the debounced autosave path (every 500ms keystroke) — only the unmount flush switches to sendBeacon
- `useEffect` cleanup: cancel debounce timer → call `navigator.sendBeacon('/api/inspection-notes', JSON.stringify({ assetId, notes }))` → no await needed (browser guarantees delivery)

**Existing corrupted records**
- Accept data loss — app is pre-production with very few records; any truncated notes are already gone from the DB. No migration, no warning UI.

### Claude's Discretion
- Exact JSON encoding for sendBeacon payload
- Whether to add a `Content-Type` blob wrapper for sendBeacon (some browsers require it)
- Error handling in the new API route
- Test coverage approach

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PREFILL-07 | "Other notes" textarea shows only freeform notes (not serialised key:value lines) when returning to a record | `extractFreeformNotes` fix: collect all lines from the `Notes: ` marker to end-of-string |
| PREFILL-08 | Pre-extraction edits made within 500ms of navigating away are not silently lost — unmount flush for debounced autosave | `navigator.sendBeacon` replaces Server Action in `useEffect` cleanup; new `POST /api/inspection-notes` route handles the payload |
</phase_requirements>

---

## Standard Stack

### Core (no new dependencies required)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | Existing | `POST /api/inspection-notes` route file | Matches all other API routes in the project |
| @supabase/ssr | Existing | `createClient()` in new route handler | Same pattern as `extract/route.ts` and `saveInspectionNotes` |
| navigator.sendBeacon | Browser native | Unmount-safe HTTP POST | Guaranteed delivery after page teardown; no library needed |
| vitest + jsdom | ^4.1.0 | Test suite | Already configured; all existing tests use this stack |

### No New Dependencies
This phase requires zero new `npm install` commands. All needed APIs are either:
- Already in the project (`@supabase/ssr`, Next.js)
- Browser-native (`navigator.sendBeacon`)
- Part of the existing test infrastructure (`vitest`, `@testing-library/react`)

## Architecture Patterns

### Recommended File Structure (changes only)
```
src/
├── lib/utils/
│   └── parseStructuredFields.ts     # MODIFY: extractFreeformNotes fix
├── components/asset/
│   └── InspectionNotesSection.tsx   # MODIFY: useEffect cleanup rewrite
├── app/api/
│   └── inspection-notes/
│       └── route.ts                 # NEW: POST handler for sendBeacon
└── __tests__/
    ├── parseStructuredFields.test.ts        # MODIFY: add multi-line test cases
    ├── InspectionNotesSection.test.tsx      # MODIFY: update unmount test
    └── inspection-notes-route.test.ts       # NEW: route handler tests
```

### Pattern 1: extractFreeformNotes multi-line fix

**What:** Find the index of the first `"Notes: "` line, then join everything from that line onward, stripping the `"Notes: "` prefix from the first match.

**When to use:** Any time freeform notes may contain newlines (which the textarea allows).

**Current broken behavior:** The `for...of` loop returns on the first matching line, discarding all subsequent lines.

**Fixed behavior:** Find the Notes line position, then join from that index to the end of the split array, removing the prefix from the first segment.

```typescript
// Source: analysis of src/lib/utils/parseStructuredFields.ts + CONTEXT.md decision
export function extractFreeformNotes(notes: string | null): string {
  if (!notes) return ''
  const lines = notes.split('\n')
  const notesIdx = lines.findIndex((l) => l.startsWith('Notes: '))
  if (notesIdx === -1) return ''
  const firstLine = lines[notesIdx].slice('Notes: '.length)
  const rest = lines.slice(notesIdx + 1)
  return [firstLine, ...rest].join('\n').trimEnd()
}
```

Note: `trimEnd()` avoids a trailing newline when rest is empty but is harmless when rest has content.

### Pattern 2: sendBeacon payload encoding

**What:** Send JSON via `navigator.sendBeacon` to a same-origin Next.js route.

**The Content-Type decision (Claude's Discretion):**

When `sendBeacon` receives a plain string, the browser sets `Content-Type: text/plain`. The Next.js route handler can still parse it with `req.text()` then `JSON.parse()`. However, the Fetch Spec and browser implementations are consistent that a `Blob` with `type: 'application/json'` sets the correct Content-Type header — this is the recommended approach for same-origin requests where CORS is not a concern.

**Recommendation:** Use a `Blob` wrapper. This is the correct, explicit encoding. CORS is not triggered because the request is same-origin. The route receives a proper `Content-Type: application/json` header and can use `req.json()` — the same pattern as every other route in the project.

```typescript
// Source: MDN sendBeacon docs + WebSearch verification
// In InspectionNotesSection.tsx useEffect cleanup:
return () => {
  if (debounceRef.current) clearTimeout(debounceRef.current)
  const payload = JSON.stringify({ assetId, notes: buildCombinedNotes() })
  navigator.sendBeacon(
    '/api/inspection-notes',
    new Blob([payload], { type: 'application/json' })
  )
}
```

Where `buildCombinedNotes()` is an inline helper (or inline expression) that replicates the `persistNotes` serialization logic using the current ref values.

**Alternative (simpler, still correct):** Pass the JSON string directly and have the route parse with `req.text()` then `JSON.parse()`. This avoids the Blob and is functionally equivalent for same-origin.

### Pattern 3: New API route — POST /api/inspection-notes

**What:** A Next.js App Router route handler that receives `{ assetId, notes }` and performs the same DB update as `saveInspectionNotes`.

**Auth pattern:** Identical to `src/app/api/extract/route.ts` — `createClient()`, `supabase.auth.getUser()`, 401 if no user.

**DB update pattern:** Identical to `saveInspectionNotes` Server Action — `UPDATE assets SET inspection_notes WHERE id AND user_id`.

**No `revalidatePath`:** The unmount-path write happens on navigation away. There is no UI to revalidate — the user has already left the page. `revalidatePath` is only needed on the autosave path (Server Action) where the user may still be on the page.

```typescript
// Source: src/app/api/extract/route.ts (auth pattern) + src/lib/actions/inspection.actions.ts (DB pattern)
// src/app/api/inspection-notes/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let assetId: string, notes: string
  try {
    const body = await req.json()
    assetId = body.assetId
    notes = body.notes ?? ''
    if (!assetId) return Response.json({ error: 'assetId required' }, { status: 400 })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { error } = await supabase
    .from('assets')
    .update({ inspection_notes: notes })
    .eq('id', assetId)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
```

### Anti-Patterns to Avoid

- **Calling `await persistNotes()` in cleanup:** `useEffect` cleanup is synchronous; awaiting a Promise in it does nothing useful — the async call fires but the browser may cancel it before completion on teardown.
- **Using `fetch` in unmount cleanup:** `fetch` is cancellable and the browser will abort in-flight fetches when the page tears down. `sendBeacon` bypasses this.
- **Using `application/json` Blob for cross-origin sendBeacon:** Triggers CORS preflight, which does not work in Chrome. Not applicable here (same-origin), but noting for reference.
- **Changing the `persistNotes` serialization format:** Locked decision — storage format is unchanged.
- **Using `revalidatePath` in the new API route:** The unmount beacon fires on navigation away; revalidation is unnecessary and would require SSR-compatible imports not needed in a minimal route handler.
- **Modifying `parseStructuredFields`:** The function correctly excludes the `Notes` key. No change needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unmount-safe HTTP write | Custom fetch + abort controller logic | `navigator.sendBeacon` | Browser-native, guaranteed delivery after page teardown |
| Supabase auth in route handler | Custom session parsing | `createClient()` from `@/lib/supabase/server` | Handles cookie rotation, RLS, all edge cases |
| JSON body parsing | Manual string splitting | `req.json()` in route handler | Standard Next.js App Router pattern |

**Key insight:** `navigator.sendBeacon` exists precisely for "write on unload" use cases. Using it removes all the complexity of trying to keep an async write alive past page teardown.

## Common Pitfalls

### Pitfall 1: extractFreeformNotes trimEnd and empty-string edge case
**What goes wrong:** After joining continuation lines, a trailing `\n` may appear when the Notes section is at the end of the string and `notes.split('\n')` produces an empty final element.
**Why it happens:** `"Notes: hello\n".split('\n')` yields `['Notes: hello', '']` — the empty string joins as a trailing newline.
**How to avoid:** Apply `.trimEnd()` (not `.trim()`) to the result — preserves intentional leading whitespace in notes while stripping trailing empty lines.
**Warning signs:** Test case `extractFreeformNotes('vin: A\nNotes: runs well\n')` returns `'runs well\n'` instead of `'runs well'`.

### Pitfall 2: sendBeacon not available in test environment (jsdom)
**What goes wrong:** `navigator.sendBeacon` does not exist in jsdom; calling it in `useEffect` cleanup during tests throws `TypeError: navigator.sendBeacon is not a function`.
**Why it happens:** jsdom does not implement the Beacon API.
**How to avoid:** In `InspectionNotesSection.test.tsx`, add `vi.stubGlobal('navigator', { sendBeacon: vi.fn() })` in `beforeEach` (or globally in `vitest.setup.ts`). The existing test for unmount flush (`'persistNotes is called synchronously on unmount'`) will need updating — it currently asserts `mockSaveInspectionNotes` is called on unmount; after the fix it must assert `navigator.sendBeacon` is called instead.
**Warning signs:** Test suite throws during unmount in PREFILL-08 tests.

### Pitfall 3: buildCombinedNotes logic duplication
**What goes wrong:** The `persistNotes` callback in `InspectionNotesSection` already builds the combined notes string. The sendBeacon call needs the same string. If the planner creates a separate inline expression that diverges from `persistNotes`, the two paths can produce different output.
**Why it happens:** `persistNotes` is a `useCallback` — it is callable. But it calls `saveInspectionNotes` (Server Action) as a side effect. We cannot call it for its return value.
**How to avoid:** Extract the serialization logic into a separate `buildCombinedNotes` helper ref or inline function that both `persistNotes` (for Server Action) and the unmount beacon (for sendBeacon) call. This eliminates duplication.
**Warning signs:** Structured fields appear in the beacon payload but not the autosave payload, or vice versa.

### Pitfall 4: Incorrect test assertion after sendBeacon migration
**What goes wrong:** The existing test `'persistNotes is called synchronously on unmount even if debounce has not fired'` asserts `mockSaveInspectionNotes` is called on unmount. After the fix, the unmount path uses sendBeacon — `saveInspectionNotes` is NOT called on unmount anymore.
**Why it happens:** Test was written before the fix.
**How to avoid:** Update the test to assert `navigator.sendBeacon` is called (with correct URL and payload) on unmount, and assert `saveInspectionNotes` is NOT called on unmount.
**Warning signs:** The existing test passes but covers the wrong behavior (or fails with wrong assertion message).

### Pitfall 5: Route handler returns non-2xx on auth failure but sendBeacon ignores responses
**What goes wrong:** `navigator.sendBeacon` does not expose the response to JavaScript — return codes are ignored. Auth failures in the route handler silently lose data.
**Why it happens:** sendBeacon is fire-and-forget by design.
**How to avoid:** Ensure the route handler's auth check (cookie-based, same-origin) matches exactly the pattern that works for same-origin requests. Same-origin sendBeacon sends session cookies automatically — this is the same as any other authenticated fetch to the same origin.
**Warning signs:** Testing with a logged-in user works; testing with a logged-out user silently drops data (expected behavior for this use case — the user leaving a page while unauthenticated is an edge case, not a failure mode).

## Code Examples

### Current extractFreeformNotes (broken)
```typescript
// Source: src/lib/utils/parseStructuredFields.ts
export function extractFreeformNotes(notes: string | null): string {
  if (!notes) return ''
  for (const line of notes.split('\n')) {
    if (line.startsWith('Notes: ')) return line.slice('Notes: '.length)
  }
  return ''
}
// Bug: returns only the first line of multi-line notes.
// Input: "vin: A\nNotes: line one\nline two\nline three"
// Output: "line one"  (WRONG — loses "line two\nline three")
```

### Fixed extractFreeformNotes
```typescript
// Derived from analysis of serialization format in persistNotes
export function extractFreeformNotes(notes: string | null): string {
  if (!notes) return ''
  const lines = notes.split('\n')
  const notesIdx = lines.findIndex((l) => l.startsWith('Notes: '))
  if (notesIdx === -1) return ''
  const firstLine = lines[notesIdx].slice('Notes: '.length)
  const rest = lines.slice(notesIdx + 1)
  return [firstLine, ...rest].join('\n').trimEnd()
}
// Input: "vin: A\nNotes: line one\nline two\nline three"
// Output: "line one\nline two\nline three"  (correct)
```

### InspectionNotesSection useEffect cleanup rewrite
```typescript
// Current (broken — Server Action on unmount):
useEffect(() => {
  return () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    persistNotes()  // calls saveInspectionNotes — browser may cancel this
  }
}, [persistNotes])

// Fixed (sendBeacon for unmount, Server Action path unchanged):
useEffect(() => {
  return () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const combined = buildCombinedNotes()  // pure serialization helper
    navigator.sendBeacon(
      '/api/inspection-notes',
      new Blob([JSON.stringify({ assetId, notes: combined })], { type: 'application/json' })
    )
  }
}, [assetId])  // assetId is stable; buildCombinedNotes reads refs so no dep needed
```

### Test setup for sendBeacon in jsdom
```typescript
// Source: vitest docs + jsdom limitation
// In InspectionNotesSection.test.tsx beforeEach (or vitest.setup.ts):
vi.stubGlobal('navigator', { ...navigator, sendBeacon: vi.fn() })

// Assert in unmount test:
expect(vi.mocked(navigator.sendBeacon)).toHaveBeenCalledWith(
  '/api/inspection-notes',
  expect.any(Blob)
)
expect(mockSaveInspectionNotes).not.toHaveBeenCalled()
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `fetch` / XHR in `beforeunload` | `navigator.sendBeacon` | ~2014 (Beacon API), widely supported by 2020 | Guaranteed delivery; no sync XHR hack needed |
| Server Action in cleanup | sendBeacon → API route | Phase 15 | Fixes iOS back-button data loss |

**Deprecated/outdated:**
- Synchronous XHR in `beforeunload`: Chrome 80+ deprecated; causes jank; replaced by sendBeacon.
- Calling async functions in `useEffect` cleanup without cancellation: never worked reliably on page teardown.

## Open Questions

1. **`buildCombinedNotes` as inline vs extracted helper**
   - What we know: `persistNotes` does the serialization but also calls `saveInspectionNotes` as a side effect — it cannot be used as a pure value-returning function without refactoring.
   - What's unclear: The planner must decide whether to (a) extract a `buildCombinedNotes` pure function that both `persistNotes` and the beacon cleanup call, or (b) inline the serialization directly in the cleanup. Either approach is correct.
   - Recommendation: Extract a `buildCombinedNotes` helper (Option a) — eliminates logic duplication and makes the two save paths easier to test independently.

2. **`useEffect` dependency array after refactor**
   - What we know: The current cleanup `[persistNotes]` depends on `persistNotes` (a `useCallback`). After removing the `persistNotes()` call from the cleanup, the dependency can be `[assetId]` since `buildCombinedNotes` reads from refs (which do not need to be in the dep array).
   - What's unclear: Whether the existing ESLint exhaustive-deps rule will warn about this.
   - Recommendation: Use `[assetId]` — it is semantically correct. If ESLint warns, the inline comment `// refs are stable by design` is sufficient.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.1.0 + @testing-library/react |
| Config file | `/home/jack/projects/prestige_assets/vitest.config.ts` |
| Quick run command | `npx vitest run src/__tests__/parseStructuredFields.test.ts src/__tests__/InspectionNotesSection.test.tsx` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PREFILL-07 | `extractFreeformNotes` returns all lines after `Notes: ` joined with `\n` | unit | `npx vitest run src/__tests__/parseStructuredFields.test.ts` | ✅ (needs new test cases) |
| PREFILL-07 | `InspectionNotesSection` textarea `defaultValue` shows multi-line freeform notes correctly | unit | `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` | ✅ (existing test for single-line; needs multi-line variant) |
| PREFILL-08 | `navigator.sendBeacon` is called on unmount with correct URL and payload | unit | `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` | ✅ (existing unmount test needs updating) |
| PREFILL-08 | New `POST /api/inspection-notes` route returns 401 for unauthenticated requests | unit | `npx vitest run src/__tests__/inspection-notes-route.test.ts` | ❌ Wave 0 |
| PREFILL-08 | New `POST /api/inspection-notes` route updates DB and returns 200 for authenticated requests | unit | `npx vitest run src/__tests__/inspection-notes-route.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/parseStructuredFields.test.ts src/__tests__/InspectionNotesSection.test.tsx`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/inspection-notes-route.test.ts` — covers PREFILL-08 route handler (auth, DB update, 400 on bad body)

## Sources

### Primary (HIGH confidence)
- Direct code reading: `src/lib/utils/parseStructuredFields.ts` — confirmed bug in `extractFreeformNotes`
- Direct code reading: `src/components/asset/InspectionNotesSection.tsx` — confirmed `useEffect` cleanup calls Server Action synchronously
- Direct code reading: `src/app/api/extract/route.ts` — confirmed auth pattern for new route
- Direct code reading: `src/lib/actions/inspection.actions.ts` — confirmed DB update pattern
- Direct code reading: `src/__tests__/InspectionNotesSection.test.tsx` — confirmed existing test coverage and what needs updating
- `.planning/phases/15-pre-fill-bug-fixes/15-CONTEXT.md` — all implementation decisions

### Secondary (MEDIUM confidence)
- [MDN Navigator.sendBeacon()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) — sendBeacon API signature, return value, data types
- WebSearch: sendBeacon + Blob Content-Type behavior — confirmed Blob approach sets Content-Type; same-origin avoids CORS issues

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; no new dependencies
- Architecture: HIGH — fix patterns confirmed by reading actual source files
- Pitfalls: HIGH — bugs confirmed by code inspection; sendBeacon/jsdom pitfall is a known ecosystem issue
- Test map: HIGH — existing test file read directly; gaps identified by file listing

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable domain — no moving dependencies)
