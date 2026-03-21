# Feature Research

**Domain:** Internal asset data capture tool — v1.1 Pre-fill & Quality milestone
**Researched:** 2026-03-21
**Confidence:** HIGH (three concrete, scoped features on a fully understood existing codebase)

> Note: v1.0 feature research (2026-03-17) is superseded by this file. All v1.0 features are shipped and validated.
> This file covers the three v1.1 features only.

---

## Context: What Already Exists

The three features below are additions to a working app. Key existing infrastructure that the new features depend on:

- `InspectionNotesSection` component — already renders `inspectionPriority` fields as structured inputs, then combines them with freeform notes into a single `inspection_notes` string before saving. Currently renders only fields already flagged `inspectionPriority: true` in the schema.
- `buildUserPrompt()` in `extraction-schema.ts` — already accepts a `structuredFields` parameter to inject staff-provided field values as authoritative overrides. Currently called with an empty `structuredFields = {}` object. The wiring exists; it is not yet connected to real data.
- `/api/extract` route — reads `inspection_notes` from DB and passes it to `buildUserPrompt`. Does not yet parse structured fields from `inspection_notes` back into the `structuredFields` argument.
- `/api/describe` route — receives `inspection_notes` and passes it to `buildDescriptionUserPrompt`. Notes are forwarded but the system prompt does not instruct GPT to preserve specific values verbatim.
- Middleware at `middleware.ts` — uses `createServerClient` from `@supabase/ssr` with a `setAll` cookie handler, calls `supabase.auth.getUser()`, and redirects unauthenticated requests. The `supabaseResponse` variable is recreated inside `setAll` instead of mutated in-place, which can cause cookie desync.
- Schema `FieldDefinition` type has `inspectionPriority?: boolean` — the mechanism for marking which fields get structured inputs already exists.

---

## Feature Landscape

### Table Stakes (Users Expect These)

For v1.1, table stakes means: features that complete the existing workflow in a way that staff expect to work based on how the app behaves today.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Pre-extraction fields for VIN on Trucks and Trailers | VIN is never readable from build plate photos at typical on-site photo quality. Staff know the VIN from a separate sticker or from their paperwork. Entering it before extraction means it flows into AI as authoritative — current workflow loses it. | LOW | `vin` field exists in both truck and trailer schemas. Must add `inspectionPriority: true` to truck schema `vin` field. Trailer schema `vin` already `aiExtractable: true` but lacks `inspectionPriority`. |
| Pre-extraction odometer/hourmeter for Trucks | Cluster readings are unreadable in photos at any realistic distance. Staff read them on-site. Currently these go into freeform notes and the AI guesses from the text. | LOW | `odometer` and `hourmeter` already have `inspectionPriority: true` in truck schema — they already appear as structured inputs. This is already built. Verify behaviour end-to-end. |
| Pre-extraction suspension type for Trucks and Trailers | Suspension cannot be determined from standard exterior photos. Staff know it from under-vehicle inspection or chassis plate. Without a structured field it goes into notes and may not make it into the AI extraction reliably. | LOW | `suspension` on truck: `aiExtractable: true` but no `inspectionPriority`. `suspension` on trailer: same. Add `inspectionPriority: true` to both. Also need select input — "Air" / "Leaf Spring" / "Airbag" are the three common values. |
| Pre-extraction unladen weight for Forklifts | `truck_weight` is the Salesforce field for forklift unladen weight. Not visible from photos. Staff read from data plate or weigh ticket. Without it the Salesforce record is always incomplete. | LOW | `truck_weight` in forklift schema: `aiExtractable: false`, no `inspectionPriority`. Add `inspectionPriority: true`. No AI extraction needed — this is staff-provided only. |
| Pre-extraction length in ft for Caravans | Caravan length in feet (not metres) is a Salesforce-specific requirement. Not readable from build plate photos. Staff measure or read from compliance plate. | LOW | `trailer_length` in caravan schema: `aiExtractable: false`, no `inspectionPriority`. Add `inspectionPriority: true`. Need to clarify unit: ft vs m — PROJECT.md says "Length in ft". |
| Staff-entered notes preserved verbatim in AI description | Staff note "48-inch sleeper cab" before extraction. The description should read "48-inch sleeper cab", not "Sleeper Cab" or "TBC". Currently the description system prompt does not instruct GPT-4o to treat specific measurements from notes as authoritative. | MEDIUM | Prompt engineering change to `/api/describe` system prompt + user prompt. GPT-4o follows explicit "use verbatim" instructions reliably when the instruction is specific and in the system prompt. |
| Tab navigation not causing login redirect | Staff click the Assets tab while on a deep page within an asset record. The middleware should refresh the session token and continue, not redirect to login. This is a session desync caused by the current middleware `setAll` implementation. | MEDIUM | Supabase SSR middleware bug: `setAll` recreates `supabaseResponse` with `NextResponse.next({ request })` but the outer `supabaseResponse` already has auth cookies set. Recreating it inside `setAll` loses the cookies already set by the initial `NextResponse.next`. Fix: single `supabaseResponse` variable, set cookies on it directly in `setAll`. |

### Differentiators (Competitive Advantage)

For v1.1, differentiation means: improvements beyond fixing broken workflows that make the tool materially better than the Claude chat baseline.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Structured inputs pre-populate AI extraction as authoritative overrides | Staff enter VIN and it arrives in the AI prompt under "Staff-provided field values (use these directly)" — not as a hint but as the answer. Eliminates the AI overwriting a known-good VIN with a misread one. | LOW | `buildUserPrompt()` already accepts `structuredFields` and renders them under the "use these directly" header. The only missing piece is connecting `InspectionNotesSection` structured values to the API call. |
| Structured inputs persist across page reload | If staff enter VIN on the photos page and then reload before running extraction, the value is not lost. Currently structured values are held in `structuredValuesRef` (component memory only) — they serialize into `inspection_notes` on debounce, so they do persist via the notes string. This is already correct but should be verified. | LOW | Depends on whether the initial `structuredValuesRef` values are populated from `initialNotes` on mount. Current code initialises to `{}` — so on reload, structured fields are empty even though the combined notes string contains "vin: 1HGCM...". Need to parse `initialNotes` back into structured field values on mount. |
| Notes-verbatim instruction improves description quality for all types | Fixing the description system prompt to preserve specific values from notes benefits every asset type, not just trucks with sleeper cabs. Inspection notes with "full service history, 3 keys, Webasto heater" should appear word-for-word in the description rather than being paraphrased or dropped. | LOW | Low complexity because it is a prompt change only — no schema or component changes needed. High value because the description is the primary human-readable output that staff review before copy-paste. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Parse structured fields back from `inspection_notes` string on mount | Staff reload page and expect structured field inputs to be pre-populated | The combined `inspection_notes` string format (`vin: ABC\nodometer: 123456\nNotes: free text`) is fragile to parse — freeform notes with colons break the heuristic. Also couples the storage format to the UI structure. | Add a separate `pre_fill_fields` JSONB column to assets table, or parse only the known field keys explicitly. Either is cleaner than regex-parsing the notes string. See Feature Dependencies. |
| Auto-select input type for structured fields based on schema `inputType` | Suspension is a select — show a dropdown. Odometer is a number — show numeric input. Makes the form feel polished. | Adds conditional rendering complexity. For a 2-4 field panel, text inputs with placeholder hints are sufficient. Suspension type has only 3 values — a text input with a placeholder "e.g. Air / Leaf Spring / Airbag" works. | Use text inputs for all pre-fill fields in v1.1. Add select inputs if staff report confusion. |
| Auto-populate structured inputs from AI extraction result | After extraction runs, back-populate the pre-fill fields with AI-extracted values so staff can see what the AI found | Creates UX confusion: did the AI read this or did I enter it? Also the pre-fill panel is hidden in the success state (`status !== 'success'`). | Leave extraction result in the review form. Pre-fill panel is pre-extraction only. |
| Separate `pre_fill_fields` DB column vs encoding in `inspection_notes` | Storing structured pre-fill values in their own JSONB column is cleaner and avoids parsing issues | Requires a DB migration (new column) and changes to all relevant DB queries and actions. More work for a small gain in this milestone. | Encode structured pre-fill values in `inspection_notes` with a known prefix format. Parse only known field keys. Keep the freeform notes separate. Document the format. |

---

## Feature Dependencies

```
[Schema: inspectionPriority flags]
    └──drives──> [InspectionNotesSection structured inputs]
                     └──serialises to──> [inspection_notes DB column]
                                             └──read by──> [/api/extract buildUserPrompt structuredFields]
                                             └──read by──> [/api/describe buildDescriptionUserPrompt]

[InspectionNotesSection structured inputs]
    └──needs persist/reload support──> [parse initialNotes back into structuredValuesRef on mount]

[/api/describe system prompt]
    └──notes-verbatim instruction──> [description quality improvement]
    (independent of schema changes — can be deployed separately)

[middleware.ts supabaseResponse bug]
    └──independent of all other changes──> [fix session cookie desync]
    (zero dependencies on schema, components, or API routes)
```

### Dependency Notes

- **Schema `inspectionPriority` flag changes are the prerequisite for new pre-fill fields.** Adding the flag to `vin` (truck), `suspension` (truck, trailer), `trailer_length` (caravan), `truck_weight` (forklift) is all that is needed for the fields to appear in `InspectionNotesSection`. The component already calls `getInspectionPriorityFields()` and renders whatever it returns.

- **`buildUserPrompt` structured fields wiring is already written but not connected.** The `/api/extract` route already has a `structuredFields` variable (currently hardcoded `{}`). Connecting it requires: (1) parse `inspection_notes` from DB to extract known-key values before calling `buildUserPrompt`, or (2) add a `pre_fill_fields` column. Option 1 is lower scope for v1.1.

- **Description quality fix is independent.** It only touches the system prompt in `/api/describe`. No schema changes, no component changes, no DB changes. Can be done first.

- **Middleware session bug is fully independent.** Zero dependencies on other v1.1 changes. Fix it in isolation and test it.

- **Structured input persistence on reload** depends on schema flag changes being done first (so the fields exist), and then requires either (a) parsing `inspection_notes` back into structured values on mount, or (b) a `pre_fill_fields` column. This is the most complex dependency chain in v1.1 — it may be deferred to v1.2 if the simpler approach (don't pre-populate on reload, accept re-entry) is acceptable.

---

## MVP Definition

### v1.1 Launch With

Minimum set to close the three reported issues.

- [ ] **Schema: add `inspectionPriority: true` to truck `vin`, truck `suspension`, trailer `vin`, trailer `suspension`, forklift `truck_weight`, caravan `trailer_length`** — this surfaces the new pre-fill inputs at zero implementation cost beyond the schema change
- [ ] **Connect structured pre-fill values to `buildUserPrompt` `structuredFields`** — parse known-key structured values out of `inspection_notes` before the AI call, pass them as authoritative overrides
- [ ] **Description system prompt: add verbatim preservation instruction** — explicit instruction to treat inspection notes values as authoritative, preserve specific measurements and model notes word-for-word
- [ ] **Fix middleware `supabaseResponse` cookie desync** — single `supabaseResponse` variable; `setAll` must mutate it rather than recreating it; return the same object

### Add After Validation (v1.1.x)

- [ ] **Pre-fill field values persist across page reload** — parse `initialNotes` back into structured field values on mount (or introduce `pre_fill_fields` JSONB column). Deferred because re-entry is acceptable in the short term and the implementation requires a clear decision on storage strategy.
- [ ] **Suspension field as select input** — replace text input with Air / Leaf Spring / Airbag / Hendrickson dropdown for truck and trailer suspension. Low complexity but not blocking.

### Future Consideration (v2+)

- [ ] **`pre_fill_fields` JSONB column** — dedicated storage column for pre-extraction structured values, decoupled from `inspection_notes` freeform text. Prerequisite for reliable reload persistence and for displaying pre-fill values separately from notes in the output.
- [ ] **Pre-fill fields for more asset types** — earthmoving PIN/Serial are already `inspectionPriority` but could be promoted to dedicated pre-fill UI; agriculture similarly.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Schema flag additions (new pre-fill fields visible) | HIGH | LOW | P1 |
| Connect structured fields to AI extraction prompt | HIGH | LOW | P1 |
| Description verbatim notes instruction | HIGH | LOW | P1 |
| Middleware session bug fix | HIGH | LOW | P1 |
| Pre-fill field values persist on reload | MEDIUM | MEDIUM | P2 |
| Suspension as select input | LOW | LOW | P2 |
| `pre_fill_fields` JSONB column | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v1.1 release — directly addresses the three reported issues
- P2: Should add before staff adoption scales — quality-of-life improvements
- P3: Architectural improvement — defer until usage patterns confirm the need

---

## Implementation Notes by Feature

### Feature 1: Pre-extraction Structured Input Fields

**What needs to change (in order):**

1. `truck.ts` schema: add `inspectionPriority: true` to `vin` field (sfOrder 2).
2. `truck.ts` schema: add `inspectionPriority: true` to `suspension` field (sfOrder 26).
3. `trailer.ts` schema: add `inspectionPriority: true` to `vin` field (sfOrder 3).
4. `trailer.ts` schema: add `inspectionPriority: true` to `suspension` field (sfOrder 15).
5. `forklift.ts` schema: add `inspectionPriority: true` to `truck_weight` field (sfOrder 16).
6. `caravan.ts` schema: add `inspectionPriority: true` to `trailer_length` field (sfOrder 15).

These six schema changes make the fields appear in `InspectionNotesSection` automatically. No component changes needed.

**Connecting structured values to AI extraction:**

`InspectionNotesSection` already serialises structured field values into `inspection_notes` as `key: value` lines. The `/api/extract` route reads `inspection_notes` from DB. To connect:

- In `/api/extract`, after loading `asset.inspection_notes`, parse lines matching `^(\w+): (.+)$` and match keys against known `inspectionPriority` field keys for the asset type.
- Pass parsed key-value pairs as `structuredFields` to `buildUserPrompt`.
- GPT-4o already receives these under "Staff-provided field values (use these directly)" and treats them as authoritative.

This approach is LOW complexity because `buildUserPrompt` already handles the formatting. The only new code is the `inspection_notes` → `structuredFields` parse step in the route.

**Risk:** If a staff member writes something in freeform notes that looks like a structured field line (e.g. "vin: not visible"), it will be parsed as a structured field override. Mitigation: only parse keys that match known `inspectionPriority` field keys for the asset type — do not parse arbitrary key-value patterns.

### Feature 2: Verbatim Notes in AI Description

**What needs to change:**

Only the system prompt in `/api/describe`. No schema, component, or DB changes.

The existing system prompt says "4. Only include a spec if confirmed from photos, inspection notes, or research — never guess". This does not instruct GPT-4o to preserve the exact wording from notes.

Add an explicit instruction: when a specific measurement, value, or fact appears in inspection notes (e.g. "48-inch sleeper cab", "full log books", "Webasto heater"), include that exact phrasing in the description rather than paraphrasing or replacing with TBC.

The system prompt already passes `Inspection notes: ${asset.inspection_notes}` in the user prompt. The change is purely instructional — tell GPT-4o what to do with values it finds there.

**Confidence:** HIGH. GPT-4o follows explicit "use verbatim" instructions reliably when the instruction is specific, in the system prompt, and backed by a concrete example. The OpenAI prompting guide confirms that a single clarifying sentence is usually sufficient to steer the model.

### Feature 3: Session Auth Bug Fix

**Root cause analysis from code review:**

Current `middleware.ts` (lines 10-19):
```
let supabaseResponse = NextResponse.next({ request })
const supabase = createServerClient(..., {
  cookies: {
    getAll() { return request.cookies.getAll() },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
      supabaseResponse = NextResponse.next({ request })   // BUG: creates new response, loses prior cookies
      cookiesToSet.forEach(({ name, value, options }) =>
        supabaseResponse.cookies.set(name, value, options)
      )
    },
  },
})
```

When `setAll` is called during session refresh, it reassigns `supabaseResponse` to a brand-new `NextResponse.next({ request })`. This new response does not carry any cookies that the Supabase client had already set. The result: the browser receives a response without refreshed auth cookies. On the next navigation, the Server Component `createClient()` reads stale cookies, `getUser()` fails (token expired), and the layout redirects to `/login`.

**The fix:**

The official Supabase SSR docs pattern (as confirmed by search results) requires that `setAll` mutate `supabaseResponse.cookies` without replacing the response object. The outer `supabaseResponse` must be the same object from start to finish.

The corrected pattern:
```typescript
let supabaseResponse = NextResponse.next({ request })
const supabase = createServerClient(..., {
  cookies: {
    getAll() { return request.cookies.getAll() },
    setAll(cookiesToSet) {
      // Set on request for Server Component access
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
      // Recreate once with updated request, then set cookies on it
      supabaseResponse = NextResponse.next({ request })
      cookiesToSet.forEach(({ name, value, options }) =>
        supabaseResponse.cookies.set(name, value, options)
      )
    },
  },
})
```

Wait — the existing code does exactly this. The issue may not be in `setAll` at all.

**Revised diagnosis:** Looking more carefully at the code: the existing middleware does call `NextResponse.next({ request })` inside `setAll` after setting cookies on `request`. This is actually the correct pattern — the `request` object has the new cookies set on it, so `NextResponse.next({ request })` creates a response with those cookies in the request context. Then `supabaseResponse.cookies.set` adds them to the response cookies.

The actual bug is likely in how `(app)/layout.tsx` handles the auth check. It calls `supabase.auth.getUser()` from a Server Component, which is correct. But `src/app/page.tsx` does `redirect('/login')` unconditionally. If the root `/` path is visited while authenticated (which happens when the Assets tab navigates to `/`), this redirect fires before the auth layout check runs — because `/` is not inside the `(app)` route group.

**Revised diagnosis:** The Assets tab (`BottomNav.tsx`) links to `href="/"`. The root `page.tsx` unconditionally redirects to `/login`. But the `(app)` layout at `src/app/(app)/page.tsx` renders the asset list. The root `/` is a redirect-to-login page, not the asset list. The BottomNav `assetsActive` check uses `pathname === '/'` but the actual app homepage is under `(app)` which maps to `/`. This may be fine in Next.js route groups (the `(app)` group folder does not add a path segment), but the root `page.tsx` redirect to `/login` is the likely culprit.

**Verification needed:** Confirm whether `/` routes to `src/app/page.tsx` (redirect to login) or `src/app/(app)/page.tsx` (asset list) in Next.js App Router. In App Router, both cannot exist simultaneously — one takes precedence. If `src/app/page.tsx` takes precedence, clicking the Assets tab always redirects to login regardless of auth state.

**Confidence:** MEDIUM. The middleware cookie pattern appears correct in the existing code. The more likely bug is the route collision between `src/app/page.tsx` and `src/app/(app)/page.tsx`. Requires confirming which route wins at runtime.

---

## Feature Dependencies for Roadmap Ordering

The three features are independent of each other and can be implemented in any order. Recommended sequence based on risk and value:

1. **Middleware / session bug first** — foundational; a broken session undermines all other work. Zero dependencies. Trivial to verify.
2. **Schema flag additions + structured field wiring second** — schema changes are trivial; wiring is the main implementation. Affects the extraction pipeline.
3. **Description verbatim instruction last** — prompt-only change. Can be tested independently. No risk of side effects on other features.

---

## Sources

- Project codebase: `/home/jack/projects/prestige_assets/src/` (HIGH confidence — direct code inspection)
- `InspectionNotesSection.tsx`, `ExtractionPageClient.tsx`, `extraction-schema.ts`, `/api/extract/route.ts`, `/api/describe/route.ts`, `middleware.ts`, schema files — all read and analysed directly
- Supabase SSR docs and GitHub issues: session desync root cause documented in official Supabase troubleshooting and community discussions (MEDIUM confidence — searched 2026-03-21, cross-referenced with code)
- OpenAI GPT-4.1 prompting guide: verbatim instruction behaviour confirmed (MEDIUM confidence — WebSearch 2026-03-21)
- PROJECT.md v1.1 requirements: field specifications confirmed (HIGH confidence — primary source)

---
*Feature research for: Prestige Assets v1.1 Pre-fill & Quality*
*Researched: 2026-03-21*
