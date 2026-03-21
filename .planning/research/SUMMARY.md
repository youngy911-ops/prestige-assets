# Project Research Summary

**Project:** Prestige Assets — Slattery Auctions internal asset book-in tool (v1.1 Pre-fill & Quality)
**Domain:** AI-powered internal data-capture web app (Next.js + Supabase + GPT-4o)
**Researched:** 2026-03-21
**Confidence:** HIGH

> Note: This file supersedes the v1.0 summary (2026-03-17). v1.0 is shipped and validated. This summary covers the three v1.1 issues only.

## Executive Summary

v1.1 (Pre-fill & Quality) is a targeted patch milestone on a fully-built, production app. All three reported issues — pre-extraction structured inputs not surfacing the right fields, AI descriptions paraphrasing staff notes instead of preserving them verbatim, and the Assets tab redirecting authenticated users to login — are solvable by modifying existing files. Zero new dependencies are required. The infrastructure for each fix already exists in the codebase: the `inspectionPriority` field rendering mechanism is live, the `structuredFields` path in `buildUserPrompt` is already written, and the `(app)/layout.tsx` auth guard already works correctly. The gaps are six missing schema flags, an absent verbatim instruction in a system prompt, and a conflicting root-level `page.tsx` that shadows the real assets list page.

The recommended approach is sequential delivery in three independent units, ordered to eliminate the session bug first (it causes false login redirects during development of the other changes), then the schema flag additions and extraction route wiring together (these are coupled and must ship as one unit), then the description prompt fix independently. Each unit is one to three file changes and can be verified in isolation. No shared state exists between units; a failure in one does not block the others.

The primary risk is the "silent no-op" trap: adding `inspectionPriority: true` to schema fields makes the inputs appear in the UI, but unless the extraction route is also updated to parse structured values out of `inspection_notes` and pass them to `buildUserPrompt`, staff-entered values arrive in the AI prompt as unstructured text rather than authoritative overrides. Schema changes and route parse step must ship together. A secondary risk is pre-fill inputs rendering blank after a page reload because `structuredValuesRef` is always initialised to `{}` on mount — the storage strategy (string-parse on mount vs. a new `pre_fill_fields` JSONB column) must be decided before implementation, not during.

## Key Findings

### Recommended Stack

All v1.1 changes are within the existing validated stack. No new packages, no version changes, no DB migrations required for MVP scope. The existing stack (`next@16.1.7`, `@supabase/ssr@^0.9.0`, `ai@^6.0.116`, `zod@^4.3.6`, `react-hook-form@^7.71.2`) requires no changes. GPT-4o verbatim preservation is achievable via prompt engineering alone — no structured output schema or streaming changes are needed.

**Core technologies (all unchanged):**
- `Next.js App Router`: routing, Server Components, middleware — no changes to framework usage
- `@supabase/ssr`: auth, DB — middleware cookie handling bug fixed by removing one line inside `setAll` callback
- `GPT-4o` via Vercel AI SDK: extraction and description — both improved by prompt edits only
- Schema Registry (static TypeScript): single source of truth for field definitions — `inspectionPriority` flag additions drive all UI changes without component rewrites

See `.planning/research/STACK.md` for the full per-feature file change table.

### Expected Features

v1.1 is not greenfield — it closes three specific gaps in a working app. Feature scope is tightly bounded by direct code analysis.

**Must have (table stakes for v1.1):**
- Pre-extraction structured input for Truck VIN and Suspension — fields not readable from photos; staff know them on-site
- Pre-extraction structured input for Trailer VIN and Suspension — same reasoning
- Pre-extraction structured input for Forklift Unladen Weight (`truck_weight`) — not extractable; staff read from data plate
- Pre-extraction structured input for Caravan Length in ft (`trailer_length`) — not extractable; Salesforce requires ft
- Staff-entered structured values passed as authoritative overrides to `buildUserPrompt` — the `structuredFields` wiring already exists but is hardcoded empty (`{}`)
- Description system prompt verbatim instruction — prevents GPT-4o paraphrasing specific staff-entered values; XML delimiters prevent accidental prompt injection
- Session bug fix: delete `src/app/page.tsx` which unconditionally redirects `/` to `/login`, blocking authenticated Assets tab navigation

**Should have (quality improvements, v1.1.x after validation):**
- Pre-fill field values persisted across page reload — `structuredValuesRef` always initialises to `{}` on mount; values are in the DB but not re-parsed into inputs on return
- Suspension field as select input (Air / Leaf Spring / Airbag) — text input with placeholder is acceptable for v1.1

**Defer (v2+):**
- `pre_fill_fields` JSONB column — clean separation of structured vs. freeform notes; required for reliable reload persistence at scale; avoids string-parsing fragility
- Pre-fill inputs for additional asset types (earthmoving, agriculture)

See `.planning/research/FEATURES.md` for full feature dependency graph and prioritisation matrix.

### Architecture Approach

All three v1.1 integration points are targeted modifications to existing components. The modified surface is minimal: four schema files, two API route handlers, and one file deletion. No new components, no new routes, no DB migrations. The one decision with architectural weight is how to separate structured key-value lines from freeform notes when building the extraction and description prompts — both routes need to strip `key: value` lines from the freeform notes block to avoid structured fields appearing in description prose (violates the "no serial numbers in description" rule) or being double-counted as both hints and authoritative overrides.

**Components modified in v1.1:**
1. `lib/schema-registry/schemas/{truck,trailer,forklift,caravan}.ts` — add `inspectionPriority: true` to 6 fields; `InspectionNotesSection` picks them up automatically via `getInspectionPriorityFields()`
2. `app/api/extract/route.ts` — parse structured `key: value` lines from `inspection_notes`; pass as `structuredFields` to `buildUserPrompt()`; strip structured lines from freeform notes block
3. `app/api/describe/route.ts` — update `buildDescriptionUserPrompt()`: mark freeform notes as authoritative, add verbatim instruction, wrap notes in XML delimiters, exclude structured key-value lines from the verbatim block; add rule block to `DESCRIPTION_SYSTEM_PROMPT`
4. `src/app/page.tsx` — deleted; resolves root route conflict with `src/app/(app)/page.tsx`

**Components unchanged:** `InspectionNotesSection`, `middleware.ts` (no changes needed beyond the session fix), all other components.

See `.planning/research/ARCHITECTURE.md` for data flow diagrams, build order, and the full system overview diagram.

### Critical Pitfalls

Full detail with prevention strategies and phase assignments in `.planning/research/PITFALLS.md`.

1. **Structured fields wired as no-op** — `structuredFields = {}` in extract route is hardcoded. Adding schema flags without also updating the route parse step means staff values arrive as unstructured notes, not authoritative overrides. The "staff-provided field values (use these directly)" path in `buildUserPrompt` is never exercised. Schema changes and route changes must ship together in the same phase.

2. **Pre-fill inputs blank on reload** — `structuredValuesRef` always initialises to `{}` regardless of saved `initialNotes`. Values are in the DB but not re-surfaced in the UI. Must be resolved before staff use the feature at scale — re-entering a different VIN after reload corrupts the saved data. Storage strategy must be decided upfront.

3. **Root route conflict (session bug)** — `src/app/page.tsx` unconditionally calls `redirect('/login')`, taking precedence over `src/app/(app)/page.tsx` for the `/` route. Deleting the file is the correct fix. The `(app)/layout.tsx` auth guard and middleware already handle all auth protection without it.

4. **Notes passed raw to description prompt** — without XML delimiters and an explicit verbatim instruction, GPT-4o paraphrases staff-entered measurements and names by default. Delimiters must accompany the verbatim instruction to also prevent accidental instruction injection from note content.

5. **Field key mismatch on Forklift** — v1.1 requirement says "Unladen Weight" but the existing Salesforce field key is `truck_weight`. Adding a new field under a different key creates a DB split and Salesforce output gap. Fix: set `inspectionPriority: true` on the existing `truck_weight` field, not a new one.

## Implications for Roadmap

Based on research, the three v1.1 features map cleanly to three independent phases ordered by development dependency and test-feedback value.

### Phase 1: Session Auth Bug Fix

**Rationale:** The Assets tab redirect-to-login bug affects every navigation during development and testing of the other changes. Fixing it first eliminates false failures and keeps test feedback clean for Phases 2 and 3. It is also the simplest change: one file deleted, zero dependencies, immediately verifiable.

**Delivers:** Authenticated users can click the Assets tab without being redirected to login. Unauthenticated users continue to be redirected correctly by middleware and `(app)/layout.tsx`.

**Addresses:** Session auth issue (table stakes)

**Avoids:** Pitfall 6 (root route conflict), Pitfall 7 (confirm middleware matcher remains inclusive of all routes after fix — no narrowing to exclude `/api/`)

**No deeper research needed:** Root cause confirmed by direct code inspection. Fix is one file deletion. Middleware correctness verified against official Supabase SSR docs — no changes to middleware needed.

### Phase 2: Pre-Extraction Structured Input Fields

**Rationale:** Schema flag additions are the lowest-risk changes and unlock the pre-fill UI automatically. The route parse step must ship in the same phase — shipping the schema changes alone produces the critical silent no-op. The two sub-tasks are coupled and must be delivered together as one unit.

**Delivers:** Staff can enter VIN, suspension type, unladen weight, and caravan length before extraction. These values arrive in the AI prompt as authoritative overrides under "Staff-provided field values (use these directly)", bypassing photo-based extraction uncertainty for fields that photos cannot reliably supply.

**Addresses:** Pre-extraction structured inputs for all four asset types (table stakes), structured fields wired to `buildUserPrompt` (differentiator)

**Uses:** Schema Registry `inspectionPriority` flag, `buildUserPrompt` `structuredFields` parameter (already exists), `inspection_notes` string parse in extract route

**Avoids:** Pitfall 1 (no-op wiring — ship schema and route changes together), Pitfall 3 (duplicate field UX confusion — requires clear "Enter known values before extraction" section label), Pitfall 8 (forklift field key — use existing `truck_weight`, not a new field), Pitfall 9 (caravan length — add explicit ft placeholder text)

**Decision required before implementation:** State re-hydration on reload (Pitfall 2). Option A: parse `initialNotes` back into `structuredValuesRef` on mount (string-parse, fragile but no migration). Option B: `pre_fill_fields` JSONB column (clean, requires migration). Research recommends Option A for v1.1 MVP with Option B tracked for v1.2. Must decide and document before Phase 2 begins — not mid-implementation.

### Phase 3: Description Verbatim Fidelity

**Rationale:** Fully independent of Phases 1 and 2; can be verified against any existing asset record. Placed third because it has the fewest dependencies and the simplest test path (enter specific dimension in notes, generate description, assert verbatim match). High confidence, single-file change.

**Delivers:** AI-generated descriptions preserve specific staff-entered measurements, custom fitments, and condition notes verbatim. XML delimiters around inspection notes prevent accidental instruction injection from note content.

**Addresses:** Staff-entered notes preserved verbatim (table stakes), notes-verbatim improvement for all asset types (differentiator)

**Implements:** `buildDescriptionUserPrompt()` verbatim instruction + XML delimiters; `DESCRIPTION_SYSTEM_PROMPT` verbatim rule block; exclusion of structured key-value lines from the description verbatim context

**Avoids:** Pitfall 4 (notes paraphrased — explicit verbatim instruction required), Pitfall 5 (prompt injection from notes content — XML delimiters required)

**No deeper research needed:** GPT-4o verbatim preservation via explicit system prompt instruction is a documented, high-confidence pattern. Single-file prompt edit with no schema, component, or DB side effects.

### Phase Ordering Rationale

- Session bug first eliminates false login redirects during development and testing of Phases 2 and 3
- Schema flag additions and extraction route wiring are coupled (must ship together); description fix is independent but logically follows the extraction workflow (describe comes after extract)
- Description fix last because it is the most independent and easiest to test in isolation against existing asset data
- No phase requires a DB migration; all phases are git-revertible without data loss

### Research Flags

Phases needing a decision before implementation begins:

- **Phase 2:** Pre-fill state re-hydration on reload — must choose between string-parse on mount (Option A, fragile, MVP-acceptable) and a separate `pre_fill_fields` JSONB column (Option B, clean, requires migration). Defer the migration to v1.2 but document the limitation explicitly in Phase 2 notes so it is not treated as "working correctly."

Phases with standard patterns (no additional research needed):

- **Phase 1:** Next.js App Router route group precedence is documented and confirmed by code inspection. One file deletion.
- **Phase 3:** GPT-4o verbatim instruction pattern is well-documented in the OpenAI prompting guide. One file prompt edit.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All conclusions from direct codebase inspection; zero new dependencies; no compatibility concerns within existing package versions |
| Features | HIGH | Three concrete, scoped features on a fully understood codebase; field keys verified against live schema files; field-by-field gap analysis completed |
| Architecture | HIGH | Component boundaries confirmed by code analysis; Supabase official docs pattern confirmed for middleware; data flow traced end-to-end in code |
| Pitfalls | HIGH | Critical pitfalls identified from direct code inspection (structuredFields no-op, root route conflict, structuredValuesRef initialisation, field key mismatch); GPT-4o verbatim behaviour from OpenAI prompting guide (MEDIUM — empirical confirmation needed) |

**Overall confidence:** HIGH

### Gaps to Address

- **Pre-fill state on reload (storage strategy):** Whether to parse `initialNotes` back into `structuredValuesRef` on mount (Option A) or introduce a `pre_fill_fields` JSONB column (Option B) is unresolved. Both options are documented in FEATURES.md and PITFALLS.md. Must be decided before Phase 2 implementation. Recommendation: ship Phase 2 with Option A (string-parse on mount, minimal scope), create a v1.2 tracking item for Option B.

- **Forklift "Unladen Weight" vs "Truck Weight" label:** PITFALLS.md notes that `truck_weight` is the existing Salesforce field key but v1.1 requirements use the term "Unladen Weight." Confirm with project owner whether the Salesforce field label should be updated or whether "Truck Weight" is acceptable in the pre-fill UI.

- **Caravan length unit convention:** `trailer_length` is a text field. v1.1 says "Length in ft." Confirm with project owner whether metric input should also be accepted or whether ft is the exclusive unit for Salesforce.

## Sources

### Primary (HIGH confidence)
- Codebase direct inspection: `src/app/page.tsx`, `src/app/(app)/page.tsx`, `src/components/nav/BottomNav.tsx`, `src/components/asset/InspectionNotesSection.tsx`, `src/app/api/extract/route.ts`, `src/app/api/describe/route.ts`, `middleware.ts`, `src/lib/schema-registry/schemas/{truck,trailer,forklift,caravan}.ts`
- Supabase SSR Next.js guide: https://supabase.com/docs/guides/auth/server-side/nextjs — `getUser()` over `getSession()`, middleware cookie handling, `createServerClient` patterns
- Next.js App Router routing documentation — route group precedence, `(group)` directories do not add path segments; non-grouped `page.tsx` wins for same URL

### Secondary (MEDIUM confidence)
- Supabase SSR GitHub issue #107 — AuthSessionMissingError in Next.js 14.2+/15; confirms middleware matcher must include API routes
- Supabase troubleshooting guide: https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV
- Supabase SSR issue #36 — middleware response recreation anti-pattern (`supabaseResponse = NextResponse.next()` inside `setAll`)
- OpenAI GPT-4.1 prompting guide — verbatim instruction behaviour; XML delimiter convention for separating data from instructions

### Tertiary (LOW confidence)
- None — all v1.1 research findings have at least medium-confidence sources backed by direct code inspection

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
