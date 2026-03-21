# Architecture Research

**Domain:** AI-powered internal data-capture web app (Next.js + Supabase)
**Researched:** 2026-03-21 (updated for v1.1 Pre-fill & Quality)
**Confidence:** HIGH — based on direct codebase analysis plus Supabase official docs

---

## v1.1 Integration Points

This section is the primary focus of the v1.1 research. The base architecture (App Router, Schema Registry, route handler split, Supabase client patterns) is stable and documented below. The new work touches three precise locations.

---

### 1. Pre-Extraction Structured Input Fields

#### What exists today

`InspectionNotesSection` already renders structured per-type input fields using `getInspectionPriorityFields(assetType)`, which filters schema fields where `inspectionPriority: true`. Values are serialised into a single `inspection_notes` string and saved to the DB via `saveInspectionNotes()`. The extract route handler reads `asset.inspection_notes` and passes it to `buildUserPrompt()`.

`buildUserPrompt()` already has a `structuredFields: Record<string, string>` parameter with full support for injecting key-value pairs as "Staff-provided field values (use these directly)" — **but this parameter is always called with an empty object** (`const structuredFields: Record<string, string> = {}` in `route.ts` line 57).

#### What v1.1 needs

Dedicated fields for four types: Truck (VIN, Odo, Hours, Suspension), Trailer (VIN, Suspension), Forklift (Unladen Weight / `truck_weight`), Caravan (Length ft / `trailer_length`). These are fields that staff type in before extraction — values should be injected as authoritative (not just hints) and bypass AI extraction confidence scoring.

#### Where the fields live in the schema today

Checking current `inspectionPriority` flags per schema:

| Type | Fields with `inspectionPriority: true` today |
|------|----------------------------------------------|
| Truck | `odometer`, `registration_number`, `hourmeter`, `service_history` |
| Trailer | `registration`, `hubometer`, `atm`, `tare` |
| Forklift | `serial`, `max_lift_capacity`, `hours` |
| Caravan | `vin`, `serial`, `registration`, `odometer` |

The v1.1 required fields (`vin` for truck/trailer, `suspension` for truck/trailer, `hourmeter` for truck, `odometer` for truck, `truck_weight` for forklift, `trailer_length` for caravan) are **either already present with `inspectionPriority: true` or are missing that flag**.

Specifically:
- Truck `vin` — not currently `inspectionPriority` (aiExtractable only)
- Truck `suspension` — not currently `inspectionPriority`
- Trailer `vin` — not currently `inspectionPriority`
- Trailer `suspension` — not currently `inspectionPriority`
- Forklift `truck_weight` — not `inspectionPriority`, not `aiExtractable`
- Caravan `trailer_length` — not `inspectionPriority`, not `aiExtractable`

#### Integration approach (NEW vs MODIFIED)

**Modified: schema files (4 files)**
Add `inspectionPriority: true` to the required fields for Truck, Trailer, Forklift, Caravan. This makes them appear in `InspectionNotesSection` automatically — no component changes needed for rendering.

**Modified: `route.ts` — extraction route handler**
Currently `structuredFields` is hardcoded as `{}`. Instead, parse `inspection_notes` to extract structured key-value lines (format: `key: value\n`) and pass them to `buildUserPrompt()` as the `structuredFields` argument. This causes the AI to receive them as authoritative overrides, not just advisory hints.

Alternatively — and more robustly — store structured fields separately in the DB rather than encoding them into `inspection_notes`. This requires:

**Option A (simpler):** Parse structured lines out of `inspection_notes` string at extract time. The `InspectionNotesSection` already formats them as `key: value\n` lines. Route handler splits on newlines, builds the `structuredFields` map, and calls `buildUserPrompt()` correctly. No DB schema change required.

**Option B (cleaner):** Add a `pre_extraction_fields: jsonb` column to the `assets` table. `InspectionNotesSection` saves structured values there separately. Route handler reads both `inspection_notes` and `pre_extraction_fields`. Requires a DB migration but eliminates the string-parsing hack.

**Recommendation: Option A first** — the parsing logic is simple (lines matching `^(\w+): (.+)$`), the format is already being written by `InspectionNotesSection`, and it avoids a migration. If it proves fragile after testing, migrate to Option B.

**No new components required.** The existing `InspectionNotesSection` already renders structured fields and already has placeholder text support. Adding `inspectionPriority: true` to the right schema fields is sufficient for the UI.

#### Data flow for pre-extraction fields (v1.1)

```
Schema field gets inspectionPriority: true
    ↓
getInspectionPriorityFields(assetType) returns it
    ↓
InspectionNotesSection renders structured input
    ↓
handleStructuredChange → structuredValuesRef → persistNotes()
    ↓
saveInspectionNotes(assetId, combined)
    — combined = "vin: 1HGCM82633A123456\nsuspension: Air\nNotes: <freetext>"
    ↓
inspection_notes saved to DB
    ↓
/api/extract POST → asset.inspection_notes loaded
    ↓
NEW: parse structured lines from inspection_notes
    → structuredFields = { vin: "1HGCM82633A...", suspension: "Air" }
    ↓
buildUserPrompt(freetext, structuredFields)
    — AI receives: "Staff-provided field values (use these directly): vin: 1HGCM..."
    ↓
AI treats these as high-confidence, no-override values
```

---

### 2. Notes-to-Description Fidelity

#### What exists today

`/api/describe/route.ts` builds a user prompt via `buildDescriptionUserPrompt()` which includes:

```
Asset type: truck
Subtype: prime_mover

Confirmed fields:
make: Kenworth
model: T908
...

Inspection notes: 48" sleeper cab, diff locks, full service history
```

The description system prompt already instructs GPT-4o to research the asset and "only include a spec if confirmed from photos, inspection notes, or research." However, the notes are appended at the bottom of the user message as a freeform string. GPT-4o may not weight them sufficiently when the confirmed fields contradict them (e.g., a generic confirmed field value vs. a specific note value).

#### Where the problem is

The `buildDescriptionUserPrompt` function treats `inspection_notes` as supplementary ("additional context") rather than authoritative. Specific values in notes (cab size, custom specs, confirmed damage) should be preserved verbatim in the description. The current prompt does not explicitly instruct GPT-4o to prefer note values over generic inferences.

#### Fix location

**Modified: `buildDescriptionUserPrompt()` in `/api/describe/route.ts`**

Change the framing from:

```
Inspection notes: <notes>
```

to:

```
Inspection notes (AUTHORITATIVE — use verbatim in description where applicable):
<notes>
```

And add an explicit instruction line in the user prompt:

```
IMPORTANT: Any specific values in the inspection notes (dimensions, cab specs, confirmed options)
must be preserved exactly as written in the description — do not substitute with generic specs.
```

This is a single targeted change to `buildDescriptionUserPrompt()`. No schema changes, no route changes, no new components.

**Optionally:** Pre-process `inspection_notes` at describe time to separate structured key-value lines (already known format from InspectionNotesSection) from freeform notes. Pass freeform notes section as the "verbatim" block. This prevents the structured `vin: X` lines from being included in the description body (which would be wrong per the "no serial numbers in description" rule).

#### Data flow for description fidelity (v1.1)

```
/api/describe POST → asset loaded (fields + inspection_notes)
    ↓
NEW: split inspection_notes into:
    - structured lines (key: value) → exclude from description verbatim block
    - freeform notes → include as authoritative description context
    ↓
buildDescriptionUserPrompt with:
    - confirmed fields block (unchanged)
    - freeform notes flagged as AUTHORITATIVE
    ↓
GPT-4o preserves specific values (cab sizes, noted options)
```

---

### 3. Session Auth Bug — Tab Click Redirects to Login

#### What the bug is

Clicking the "Assets" tab (which navigates to `/`) causes a redirect to `/login` during an active session. This happens inconsistently (not on every click).

#### Root cause analysis

The `(app)/page.tsx` (the Assets list page at `/`) is a `'use client'` component. The `(app)/layout.tsx` is a Server Component that calls `supabase.auth.getUser()` and redirects if no user found.

The bug is in the middleware `setAll` cookie handler. Current code:

```typescript
setAll(cookiesToSet) {
  cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
  supabaseResponse = NextResponse.next({ request })          // ← creates NEW response
  cookiesToSet.forEach(({ name, value, options }) =>
    supabaseResponse.cookies.set(name, value, options)
  )
},
```

When `setAll` is called, it discards the original `supabaseResponse` and creates a new `NextResponse.next({ request })`. Any response headers already set on the original `supabaseResponse` are lost. More critically: the new response object is created from `{ request }` — but at this point, `request.cookies` has already been mutated with the new cookie values on the first line. This means the response is created with the updated cookies in the request, but the cookie propagation back to the client depends on the `supabaseResponse.cookies.set()` calls afterward.

The Supabase docs have explicit guidance on this: **you must not create a new response object after `createServerClient` is called, and the original `supabaseResponse` must be returned**. Creating a new `NextResponse.next({ request })` inside `setAll` breaks the cookie-writing chain on some request types.

Additionally: middleware only runs on navigation requests (full page loads and prefetch), not on in-page client-side navigations via `useRouter().push()`. However, Next.js App Router soft navigation to a route that has a Server Component layout will trigger a server fetch for that layout. The `(app)/layout.tsx` is a Server Component, so navigating to any `(app)/` route triggers a server render of the layout — which calls `supabase.auth.getUser()` using the server client. If the session token has expired and the middleware did not refresh it (because the last navigation was a client-side navigation without a middleware run), then `getUser()` returns null and the layout redirects.

#### Fix

**Modified: `middleware.ts`**

The correct pattern per Supabase official docs is to NOT recreate `supabaseResponse` inside `setAll`. Instead, update the existing response's cookies:

```typescript
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Step 1: update request cookies (for downstream server reads)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Step 2: update the existing supabaseResponse cookies (for client)
          // DO NOT recreate supabaseResponse here
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: must call getUser() to trigger session refresh
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // IMPORTANT: must return the original supabaseResponse, not a new response
  return supabaseResponse
}
```

The single change: remove `supabaseResponse = NextResponse.next({ request })` from inside the `setAll` callback.

**Verification:** After this fix, navigating between tabs should not redirect to login. The session cookie will be refreshed correctly on each server render pass through the middleware.

**Note on client-only navigation:** If the tab nav uses `<Link href="/">` (which it does via `BottomNav`), Next.js performs a soft navigation. The layout Server Component re-renders on the server, going through middleware. The fixed middleware writes the refreshed cookie correctly. The redirect loop is broken.

---

## Build Order for v1.1

Dependencies are minimal — three independent changes with one ordering constraint:

```
1. Auth bug fix (middleware.ts)
   - Single file change, no deps
   - Fix first: prevents testing pain from false login redirects during development
   - MUST COMPLETE BEFORE: any integration testing

2a. Schema updates (4 schema files: truck, trailer, forklift, caravan)
    - Add inspectionPriority: true to required pre-extraction fields
    - No downstream component changes needed
    - Independent of description fix

2b. Description fidelity fix (/api/describe/route.ts)
    - Modify buildDescriptionUserPrompt() to weight notes as authoritative
    - Independent of schema updates
    - Can be done in parallel with 2a

3. Extract route handler fix (route.ts)
   - Parse structured fields from inspection_notes
   - Pass to buildUserPrompt() as structuredFields
   - DEPENDS ON 2a: schema updates must be in place so fields are being saved correctly before testing extraction quality
```

---

## System Overview (updated for v1.1)

```
┌────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER (Browser — phone or desktop)                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ InspectionNotesSection (MODIFIED for v1.1)                   │  │
│  │  - Renders structured fields via getInspectionPriorityFields │  │
│  │  - Saves as "key: value\n" lines in inspection_notes         │  │
│  │  - Schema adds new fields with inspectionPriority: true      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ PhotoCapture │  │ ReviewForm   │  │ OutputPanel              │  │
│  │ (unchanged)  │  │ (unchanged)  │  │ (unchanged)              │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────┼──────────────────────────────────────┐
│  NEXT.JS SERVER LAYER       │                                       │
│                             │                                       │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │  middleware.ts (FIXED for v1.1)                               │  │
│  │  — setAll no longer recreates supabaseResponse               │  │
│  │  — session cookie refresh now propagates correctly            │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │  /api/extract/route.ts (MODIFIED for v1.1)                    │  │
│  │  — parses structured fields from inspection_notes             │  │
│  │  — passes them to buildUserPrompt() as authoritative values   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  /api/describe/route.ts (MODIFIED for v1.1)                   │  │
│  │  — buildDescriptionUserPrompt() marks notes as AUTHORITATIVE  │  │
│  │  — separates structured key-value lines from freeform notes   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  lib/schema-registry/schemas/ (4 files MODIFIED for v1.1)     │  │
│  │  truck.ts, trailer.ts, forklift.ts, caravan.ts               │  │
│  │  — add inspectionPriority: true to target fields              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼──────────────────────────────────────┐
│  SUPABASE (unchanged)       │                                       │
│  PostgreSQL + Storage + Auth│                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities (v1.1 changes only)

| Component | v1.1 Change | What Changes |
|-----------|-------------|--------------|
| `middleware.ts` | FIXED | Remove `supabaseResponse = NextResponse.next({ request })` from inside `setAll` callback |
| `lib/schema-registry/schemas/truck.ts` | MODIFIED | Add `inspectionPriority: true` to `vin`, `suspension` (already on `odometer`, `hourmeter`) |
| `lib/schema-registry/schemas/trailer.ts` | MODIFIED | Add `inspectionPriority: true` to `vin`, `suspension` |
| `lib/schema-registry/schemas/forklift.ts` | MODIFIED | Add `inspectionPriority: true` to `truck_weight` |
| `lib/schema-registry/schemas/caravan.ts` | MODIFIED | Add `inspectionPriority: true` to `trailer_length` |
| `app/api/extract/route.ts` | MODIFIED | Parse structured key-value lines from `inspection_notes`; pass as `structuredFields` to `buildUserPrompt()` |
| `app/api/describe/route.ts` | MODIFIED | Update `buildDescriptionUserPrompt()` to flag freeform notes as authoritative; exclude structured key-value lines from the verbatim block |
| `InspectionNotesSection` | UNCHANGED | Schema changes cause new fields to appear automatically |
| All other components | UNCHANGED | No changes required |

---

## Existing Architecture (stable, for reference)

### Server Actions vs Route Handlers

**Server Actions (`'use server'`):** All DB mutations — create asset, save fields, save inspection notes, reorder photos. These are form-adjacent mutation operations.

**Route Handlers (POST):** `/api/extract` (GPT-4o vision call) and `/api/describe` (GPT-4o description generation). Both are long-running (~5-15 seconds) calls unsuitable for Server Actions (which are queued/sequential per Next.js docs).

### Supabase Client Patterns

Two distinct clients. Using the wrong one causes auth failures.

```typescript
// lib/supabase/client.ts — use in 'use client' components only
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts — use in Server Components, Actions, Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(..., { cookies: { getAll, setAll } })
}
```

### Schema Registry

Static TypeScript in `lib/schema-registry/`. Per-type field definitions with `key`, `label`, `sfOrder`, `inputType`, `aiExtractable`, `aiHint`, `inspectionPriority`, `required`. The registry is the single source of truth for:

- Which fields the AI should attempt to extract (`aiExtractable: true`)
- Which fields to show as structured inputs before extraction (`inspectionPriority: true`)
- How to order fields in the Salesforce output (`sfOrder`)
- What type of input to render in the review form (`inputType`, `options`)

### JSONB Fields Storage

`assets.fields` is a `jsonb` column. Field values are stored as `Record<string, string>` keyed by `FieldDefinition.key`. No per-field columns — schema differences across asset types make a normalised schema impractical.

### Route Structure

```
app/
├── (auth)/login/page.tsx         — public, no auth required
├── (app)/
│   ├── layout.tsx                — Server Component, auth check + BottomNav
│   ├── page.tsx                  — 'use client', Asset list (localStorage branch)
│   └── assets/
│       ├── new/page.tsx          — create flow: type select + branch
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

## Anti-Patterns to Avoid (v1.1 specific)

### Anti-Pattern: Notes as Supplementary Context

**What goes wrong:** Passing `inspection_notes` as "additional context" at the end of the describe prompt. GPT-4o will use it as reference but not necessarily preserve verbatim values.

**Do instead:** Explicitly label freeform notes as authoritative with "use verbatim in description where applicable" instruction. Ensure structured key-value lines are excluded from the verbatim block to avoid serial numbers appearing in description text.

### Anti-Pattern: Recreating Response in Middleware setAll

**What goes wrong:** `supabaseResponse = NextResponse.next({ request })` inside `setAll` discards the original response and creates a new one. Supabase requires returning the exact same response object that was created before `createServerClient`. A new response breaks cookie propagation.

**Do instead:** Update `supabaseResponse.cookies.set()` on the existing object — never reassign `supabaseResponse` inside `setAll`.

### Anti-Pattern: Passing Inspection Notes as Both Structured Overrides and Free Text

**What goes wrong:** If structured lines (`vin: 1HGCM...`) from `inspection_notes` are passed to both `structuredFields` (in extraction) and the freeform notes block, GPT may encounter them twice. In description generation, `vin: X` appearing in the notes block could cause serial numbers to appear in the description (violating the "no serial numbers in description" rule).

**Do instead:** In the extract route, strip structured lines from the freeform notes portion when calling `buildUserPrompt()`. In the describe route, strip structured lines from the notes before passing as the verbatim description context.

---

## Sources

- Supabase SSR Next.js docs: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase troubleshooting guide (Next.js + Supabase auth): https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV
- Supabase SSR cookies/setAll issue discussion: https://github.com/supabase/ssr/issues/36
- Multiple GoTrueClient instances warning: https://github.com/orgs/supabase/discussions/37755
- Direct codebase analysis: `middleware.ts`, `route.ts` (extract + describe), `InspectionNotesSection.tsx`, all 4 schema files, `(app)/layout.tsx`

---

*Architecture research for: prestige_assets v1.1 Pre-fill & Quality*
*Researched: 2026-03-21*
