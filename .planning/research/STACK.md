# Stack Research

**Domain:** v1.1 Pre-fill & Quality — pre-extraction structured inputs, notes-to-description fidelity, session auth bug
**Researched:** 2026-03-21
**Confidence:** HIGH — all three features analysed against actual codebase; conclusions drawn from code, not assumptions

---

## v1.1 Finding: No New Libraries Required

All three v1.1 features are implementable by modifying existing code within the validated stack.
Zero new dependencies. Zero version changes. Each feature is a targeted edit to 1-2 files.

---

## Feature 1: Pre-extraction Structured Input Fields

### What already exists

`FieldDefinition.inspectionPriority: boolean` drives structured input rendering in
`InspectionNotesSection`. `getInspectionPriorityFields(assetType)` reads the flag from the schema
registry and returns the fields to render. The component serialises their values into the
`inspection_notes` string as `key: value` lines, which `buildUserPrompt` (in `extraction-schema.ts`)
already passes through to GPT-4o.

The mechanism is complete and working. The only gap is which fields carry the flag.

### Current vs required `inspectionPriority` fields

| Asset Type | Required by v1.1 spec | Currently flagged |
|------------|----------------------|-------------------|
| Truck | VIN, Odometer, Hourmeter, Suspension | odometer, registration_number, hourmeter, service_history |
| Trailer | VIN, Suspension | registration, hubometer, atm, tare |
| Forklift | Unladen Weight (`truck_weight`) | serial, max_lift_capacity, hours |
| Caravan | Length (`trailer_length`) | vin, serial, registration, odometer |

**Truck:** add `inspectionPriority: true` to `vin` and `suspension` fields.
**Trailer:** add `inspectionPriority: true` to `vin` and `suspension` fields.
**Forklift:** add `inspectionPriority: true` to `truck_weight` field (currently no flag).
**Caravan:** add `inspectionPriority: true` to `trailer_length` field (currently no flag).

### Also needed: placeholder text

`InspectionNotesSection` has a `FIELD_PLACEHOLDERS` map keyed by `field.key`. New priority fields
need entries added:

| field.key | Suggested placeholder |
|-----------|-----------------------|
| `suspension` | `e.g. Air Ride` |
| `trailer_length` | `e.g. 45ft` |
| `truck_weight` | `e.g. 4,200 kg` |

VIN already has a placeholder entry (`vin: 'e.g. 1HGCM82633A123456'`).

### Implementation: schema files only + one UI string map

1. `src/lib/schema-registry/schemas/truck.ts` — set `inspectionPriority: true` on `vin` and `suspension`
2. `src/lib/schema-registry/schemas/trailer.ts` — set `inspectionPriority: true` on `vin` and `suspension`
3. `src/lib/schema-registry/schemas/forklift.ts` — set `inspectionPriority: true` on `truck_weight`
4. `src/lib/schema-registry/schemas/caravan.ts` — set `inspectionPriority: true` on `trailer_length`
5. `src/components/asset/InspectionNotesSection.tsx` — add placeholder entries for `suspension`, `trailer_length`, `truck_weight`

No DB migration. No API changes. No new components.

---

## Feature 2: Notes-to-Description Fidelity

### What already exists

`/api/describe/route.ts` passes `inspection_notes` to GPT-4o via `buildDescriptionUserPrompt`,
which formats it as:

```
Inspection notes: <value>
```

The system prompt (`DESCRIPTION_SYSTEM_PROMPT`) instructs GPT-4o to "research the asset" and "only
include a spec if confirmed" — but contains no instruction that staff-entered notes values are
authoritative or must be copied verbatim.

### Root cause of infidelity

GPT-4o treats a generic `Inspection notes:` section as supplementary context to corroborate against
its training data. When notes say `cab_type: 48" sleeper cab` it may paraphrase to `Sleeper Cab`
because the system prompt's "research and confirm" framing invites reinterpretation. There is no
explicit signal that staff values win over model knowledge.

### Fix: two targeted prompt edits

**Edit 1 — Add verbatim-preservation rule to `DESCRIPTION_SYSTEM_PROMPT`:**

After the `UNIVERSAL RULES` block, add:

```
INSPECTION NOTES — CRITICAL RULE:
When staff inspection notes contain specific values (dimensions, weights, readings, condition descriptors),
copy those values VERBATIM into the description. Do not paraphrase, round, or substitute with researched
equivalents. Staff-provided values take absolute precedence over your training knowledge for those specific
data points. If notes say '48" sleeper cab', write '48" sleeper cab', not 'Sleeper Cab'.
```

**Edit 2 — Update `buildDescriptionUserPrompt` label:**

Change the label from `Inspection notes:` to `Staff-entered inspection notes (verbatim — these
override research):` to reinforce the instruction at the point of data presentation.

### Implementation

One file: `src/app/api/describe/route.ts`
- `DESCRIPTION_SYSTEM_PROMPT` constant — add verbatim rule block
- `buildDescriptionUserPrompt` function — update notes section label

No new libraries. No DB changes. No API signature changes.

---

## Feature 3: Session Auth Bug (Tab Click Redirects to Login)

### Root cause — confirmed by code analysis

`src/app/page.tsx` unconditionally redirects to `/login`:

```typescript
// src/app/page.tsx — THE BUG
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/login");
}
```

`BottomNav` links the Assets tab to `href="/"`. When the user taps Assets, Next.js navigates to `/`,
which renders `src/app/page.tsx`, which calls `redirect('/login')` with no auth check.

The assets list page lives at `src/app/(app)/page.tsx`. In Next.js App Router, route groups — the
`(app)` directory prefix — are transparent to URLs. Both `src/app/page.tsx` and
`src/app/(app)/page.tsx` compete to serve `/`. The root-level `page.tsx` takes precedence and wins.
The assets list page at `(app)/page.tsx` is never reached via the Assets tab.

### Fix

Delete `src/app/page.tsx`. With it removed, `src/app/(app)/page.tsx` serves `/`, and
`src/app/(app)/layout.tsx` (which calls `auth.getUser()` + `redirect('/login')`) correctly protects
it. The middleware already refreshes the session on every request — no middleware changes needed.

**One file deleted. Nothing else changes.**

### Middleware correctness — no changes needed

The existing `middleware.ts` already follows the correct `@supabase/ssr` pattern:
- `createServerClient` instantiated per-request (not a singleton)
- `supabase.auth.getUser()` used, not `getSession()` — correct per Supabase SSR docs (getSession
  is not guaranteed to revalidate the token; getUser always sends a request to the auth server)
- Cookies propagated to both `request` and `supabaseResponse`
- Matcher excludes `_next/static`, `_next/image`, `favicon.ico`

No middleware changes required.

---

## Stack Summary: No New Dependencies

| v1.1 feature | File(s) to change | Change type |
|---|---|---|
| Truck pre-extraction: VIN + Suspension | `schemas/truck.ts` | Add `inspectionPriority: true` to 2 fields |
| Trailer pre-extraction: VIN + Suspension | `schemas/trailer.ts` | Add `inspectionPriority: true` to 2 fields |
| Forklift pre-extraction: Unladen Weight | `schemas/forklift.ts` | Add `inspectionPriority: true` to 1 field |
| Caravan pre-extraction: Length | `schemas/caravan.ts` | Add `inspectionPriority: true` to 1 field |
| Placeholder text for new fields | `InspectionNotesSection.tsx` | Add 3 entries to `FIELD_PLACEHOLDERS` |
| Notes verbatim-preservation rule | `api/describe/route.ts` | Add rule block to `DESCRIPTION_SYSTEM_PROMPT` |
| Notes user prompt label | `api/describe/route.ts` | Change label string in `buildDescriptionUserPrompt` |
| Session auth bug | `src/app/page.tsx` | Delete file |

---

## Installation

No new packages required for v1.1.

```bash
# Nothing to install
```

---

## Alternatives Considered

| Feature | Alternative | Why not |
|---------|-------------|---------|
| Pre-extraction fields | New dedicated DB column for pre-fill data separate from `inspection_notes` | Adds a migration with no benefit — the existing `inspection_notes` serialisation with `key: value` lines already feeds `buildUserPrompt` correctly. Pre-fill fields are pre-extraction only; after extraction they are part of confirmed fields. |
| Pre-extraction fields | New separate UI component for pre-fill (not `InspectionNotesSection`) | Duplication — the existing `inspectionPriority` mechanism already does exactly what is needed. Adding a second component for the same job is unnecessary. |
| Notes fidelity | Structured output schema for description (not freeform) | Overconstrained — the description is intentionally freeform prose matching specific per-subtype templates. Forcing structured output would break template flexibility and create mapping complexity. |
| Notes fidelity | Separate "staff assertions" JSON field in the describe API call | More complex than needed — passing them in the inspection_notes string with a strong label and explicit system prompt rule achieves the same outcome with less change. |
| Session bug fix | Redirect root `page.tsx` to `/(app)` instead of `/login` | Still redundant — the `(app)/layout.tsx` already guards the route. Better to remove the competing file entirely. |
| Session bug fix | Change BottomNav `href` from `"/"` to explicit path | The link to `/` is correct — that is where assets live. The bug is the conflicting root page, not the link. |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| New form library | react-hook-form + Zod already validated and in use | Existing react-hook-form |
| `supabase.auth.getSession()` in server code | Not guaranteed to revalidate auth token; explicit Supabase docs warning against it | `supabase.auth.getUser()` (already used correctly throughout codebase) |
| AI streaming for description | Adds client complexity; description is short, single-response is fine | `generateText` (already used in `/api/describe/route.ts`) |
| Any middleware-level redirect logic for the root route | Middleware already handles session correctly; adding route-level logic duplicates the layout guard | Delete conflicting `page.tsx` |

---

## Version Compatibility

All v1.1 changes are within existing package versions. No compatibility concerns.

| Package | Current Version | v1.1 status |
|---------|-----------------|-------------|
| `@supabase/ssr` | `^0.9.0` | No change needed |
| `next` | `16.1.7` | No change needed |
| `ai` | `^6.0.116` | No change needed |
| `zod` | `^4.3.6` | No change needed |
| `react-hook-form` | `^7.71.2` | No change needed |

---

## Sources

- Codebase: `src/app/page.tsx` — confirmed unconditional `redirect('/login')` at root route
- Codebase: `src/app/(app)/page.tsx` — confirmed assets list serves `/` via route group
- Codebase: `src/components/nav/BottomNav.tsx` — confirmed Assets tab links `href="/"`
- Codebase: `src/components/asset/InspectionNotesSection.tsx` — confirmed `inspectionPriority` rendering mechanism
- Codebase: `src/app/api/describe/route.ts` — confirmed notes are passed but lack verbatim-override instruction in system prompt
- Codebase: `middleware.ts` — confirmed correct `@supabase/ssr` pattern; no changes needed
- Codebase: `src/lib/schema-registry/schemas/{truck,trailer,forklift,caravan}.ts` — confirmed current `inspectionPriority` field assignments vs v1.1 requirements
- [Supabase SSR Next.js guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — MEDIUM confidence: `getUser()` over `getSession()` pattern confirmed as correct
- [Supabase SSR AuthSessionMissingError issue](https://github.com/supabase/ssr/issues/107) — context on related auth issues in Next.js 14.2+/15; root cause in this codebase is different (routing conflict, not cookie handling)
- [Supabase troubleshooting guide](https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV) — MEDIUM confidence: confirms getUser pattern

---

*Stack research for: prestige_assets v1.1 Pre-fill & Quality*
*Researched: 2026-03-21*
