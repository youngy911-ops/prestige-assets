# Project Research Summary

**Project:** Prestige Assets — Slattery Auctions Book-In Tool
**Domain:** Internal AI-powered asset data-capture web app (mobile capture + desktop review + Salesforce output)
**Researched:** 2026-03-17
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is an internal workflow-replacement tool for Slattery Auctions. The current process — photograph asset on-site, write a briefing document, paste into Claude chat, copy structured output, manually paste into Salesforce — is being replaced by a purpose-built web app. The core value proposition is: photo capture → AI extraction of VIN/make/model/year from build plate → editable review form → one-click copy-paste blocks formatted for Salesforce. Research confirms this is a well-understood problem space with clear technology choices: Next.js 15 App Router + Supabase + Vercel AI SDK (`generateObject` with GPT-4o) is the canonical stack for this type of server-side AI + file upload + auth workflow in 2025-2026.

The central architectural insight is the Schema Registry: a static TypeScript data structure per asset type that drives the AI extraction prompt, the review form, and the Salesforce output formatter simultaneously. This single source of truth is the most critical design decision in the project — everything downstream depends on it. Research recommends building it first, before any AI or form code is written, and treating its field labels and ordering as correctness constraints (not cosmetic concerns), since incorrect labels break the copy-paste workflow.

The top risks are non-obvious but well-documented: EXIF orientation corruption during client-side image resize (breaks AI extraction on Android), AI returning structurally valid but semantically wrong values without confidence signals (staff skip verification and wrong VINs enter Salesforce), and the temptation to use AI-generated description text (non-deterministic, violates Slattery's strict formatting rules). All three are preventable with upfront engineering discipline. Security is also flagged: API keys must never reach the client bundle, and Supabase Storage must use private buckets with presigned URLs (ISO 27001 context).

---

## Key Findings

### Recommended Stack

The recommended stack is Next.js 15 (App Router) + React 19 + TypeScript + Supabase + Vercel AI SDK v4. This is the standard configuration for new server-side AI web apps in 2026. Next.js Server Components keep AI keys server-side by default; Server Actions handle all database mutations; a Route Handler at `/api/extract` is used specifically for the GPT-4o call (not a Server Action — Next.js docs confirm Server Actions are queued/sequential and unsuitable for long-running AI calls). Supabase covers PostgreSQL, file storage, and auth with a single SDK (`@supabase/ssr` for App Router session management). See `.planning/research/STACK.md` for full library list and installation commands.

**Core technologies:**
- **Next.js 15 (App Router):** Full-stack framework — Server Components + Server Actions + Route Handlers eliminate separate API layer; keys stay server-side
- **Supabase (`@supabase/supabase-js` v2 + `@supabase/ssr`):** PostgreSQL + Storage + Auth in one SDK — covers all backend needs; cookie-based session management for App Router
- **Vercel AI SDK v4 (`ai` + `@ai-sdk/openai`):** `generateObject()` with Zod schema produces type-safe structured extraction output — the right primitive for build plate field extraction
- **Zod v3:** Single schema definition covers AI extraction output validation AND form validation — defined once in Schema Registry, used everywhere
- **React Hook Form v7:** Uncontrolled inputs avoid re-render storms on 35-field Salesforce schemas; pairs with Zod via `@hookform/resolvers`
- **`@dnd-kit/core` + `@dnd-kit/sortable`:** Touch-safe drag-to-reorder for photo grid — the only current option that works on iOS Safari and Android (HTML5 drag API is broken on mobile)
- **`browser-image-compression` v2:** Client-side resize to 2MP before upload — prevents mobile-data upload failures and reduces OpenAI token cost
- **shadcn/ui (CLI-based):** Accessible Radix + Tailwind component primitives; copied into codebase rather than installed as a dependency
- **Tailwind CSS v3.4+:** Required pairing with shadcn/ui; avoids per-field CSS for large form schemas

**Critical version notes:** `@supabase/auth-helpers-nextjs` is deprecated — use `@supabase/ssr` only. `react-beautiful-dnd` is deprecated — use `@dnd-kit`. Do not use `@next/font` (removed in Next.js 15). Do not prefix AI keys with `NEXT_PUBLIC_`.

### Expected Features

The full feature analysis is in `.planning/research/FEATURES.md`. The most important framing: the baseline is the Claude chat workflow, not a generic web app. Every feature is evaluated against "does this materially beat the current process?"

**Must have (table stakes — without these, the tool does not replace Claude chat):**
- Auth with persistent session — on-site work spans a day; re-login between assets is a blocker
- Asset type selector (7 types: Truck, Trailer, Earthmoving, Agriculture, Forklift, Caravan/Motor Home, General Goods) — required before AI extraction can run
- Photo upload with client-side resize — capture step; resize is required for mobile-data viability
- AI extraction (VIN/PIN/Serial, make, model, year) with per-field confidence scores — the core value; confidence scores add minimal complexity but significantly improve review accuracy
- Editable review form driven by Schema Registry — mandatory confirmation; no auto-save path exists
- Copy-paste structured fields block (Salesforce field order, correct labels) — primary output
- Copy-paste description block (deterministic template per subtype, not AI-generated) — strict format rules make AI text unviable
- Glass's Valuation block (Caravan/Motor Home only) — third copyable section; low complexity, completes output
- Cover photo + drag-to-reorder with persistence — Claude chat has no photo management; this is a meaningful differentiator
- Asset record list view — staff need to resume incomplete records

**Should have (add in v1.x after core workflow is validated):**
- Duplicate VIN detection — data quality guard once base workflow is stable
- Asset status tracking (draft / complete / in Salesforce) — operational once volume justifies it
- PPSR result storage field — trivial addition, deferred to confirm exact Salesforce position
- Bulk photo management (delete, re-upload) — add when staff report friction

**Defer to v2+:**
- Salesforce API push — blocked on IT approval; copy-paste is the correct MVP output
- QLD rego lookup — API integration, cost per query, auth overhead
- Multi-user role management — premature until team adoption confirmed
- Auction comp pricing, spec research pipelines — separate feature domain entirely

**Hard anti-features (never build, even if requested):**
- Auto-save extracted data without review — single wrong VIN destroys a legally significant auction record
- AI-generated description text — non-deterministic, violates Slattery's formatting rules
- Free-text field entry outside defined schema — breaks copy-paste correctness

### Architecture Approach

The architecture is a standard Next.js App Router + Supabase pattern with one critical split: AI calls go through a Route Handler (`/api/extract/route.ts`), not a Server Action. This is explicitly required by Next.js docs (Server Actions are queued/sequential; a 10-second GPT-4o call would block the entire action queue). All database mutations use Server Actions. The Schema Registry lives as static TypeScript in `lib/schema-registry/` — not a database table, not a JSON file — imported by both server and client code without any runtime fetch overhead. Photos upload directly from the browser to Supabase Storage (client BrowserClient with RLS) rather than routing through the Next.js server, which would double bandwidth for multi-MB files. See `.planning/research/ARCHITECTURE.md` for full component diagram, data flow, and project structure.

**Major components:**
1. **`middleware.ts`** — Auth guard on every request; session JWT refresh via Supabase ServerClient + cookies
2. **`lib/schema-registry/`** — Static TypeScript per-type definitions: field keys, Salesforce labels, ordering, AI-extractable flags, description template functions; single source of truth for all downstream consumers
3. **`PhotoCapture`** — Client component: file picker, `browser-image-compression` resize, direct upload to Supabase Storage via BrowserClient
4. **`/api/extract/route.ts`** — POST Route Handler: auth check, generate signed URLs, call GPT-4o via `generateObject()`, return Zod-validated structured JSON
5. **`DynamicFieldForm`** — Client component: renders inputs from Schema Registry definition; pre-filled by extraction result; RHF-managed
6. **`OutputPanel`** — Client component: `generateFieldsBlock()` + `generateDescription()` + conditional Glass's Valuation; clipboard copy with confirmation

**Key data model decision:** Asset field values stored as `fields: jsonb` column rather than one column per field. Each asset type has a different field count (Truck ~35, General Goods ~1); JSONB avoids schema migrations for field additions. Schema Registry validates which keys are stored.

### Critical Pitfalls

Full detail with prevention strategies and phase assignments in `.planning/research/PITFALLS.md`.

1. **EXIF orientation on canvas resize** — Mobile cameras encode rotation in EXIF; canvas ignores EXIF and produces sideways images. AI extraction fails silently. Fix: use `exifr` library to read orientation tag before canvas draw; apply correction. Must be in Phase 1 before AI integration. Android-only bug — iOS Safari auto-corrects, masking it during development.

2. **AI returns structurally valid but semantically wrong output** — `generateObject()` guarantees JSON schema conformance, not accuracy. VINs with `O`/`0` confusion, hallucinated values for occluded plates. Fix: include per-field `confidence: "low" | "medium" | "high"` in extraction schema; visually surface low-confidence fields in review form; mandate review step with no skip path.

3. **Schema Registry drift from Salesforce** — If AI extraction keys and Salesforce copy-paste labels are maintained in separate places, they diverge. Fix: Schema Registry is the single source of truth with both `key` (AI) and `salesforceLabel` (exact copy-paste text) and `sfOrder` (integer). Never hardcode Salesforce labels anywhere else.

4. **API key in client bundle** — Marking a module `"use client"` that imports AI utilities silently bundles the OpenAI SDK in the browser. Fix: all AI logic in `/api/extract/route.ts`; use `OPENAI_API_KEY` (no `NEXT_PUBLIC_` prefix); add `import 'server-only'` to AI utility files. Establish this pattern before any AI code is written.

5. **Copy-paste whitespace and encoding errors** — Trailing spaces, `\r\n` vs `\n`, non-breaking spaces, and em dashes break Salesforce paste silently. Fix: description generator uses explicit `\n` concatenation, never template-literal multi-line indentation; add normalisation pass; write snapshot tests for every asset type's output and test paste directly in Salesforce, not a local textarea.

---

## Implications for Roadmap

Architecture research defines a clear dependency chain. The recommended phase structure follows it directly.

### Phase 1: Foundation + Schema Registry
**Rationale:** Everything downstream — AI extraction, form rendering, output generation — requires the Schema Registry to exist. Auth and Supabase setup must precede all data operations. This phase has no dependencies; it is the root. Security patterns (server-only AI key handling, RLS, private Storage bucket) must be established here, not retrofitted later.
**Delivers:** Scaffolded Next.js project; Supabase DB schema (assets, asset_photos tables with RLS); auth middleware + login page; Supabase client/server wrappers; complete `lib/schema-registry/` with all 7 asset type definitions, field labels, Salesforce ordering, AI-extractable flags, and description template function stubs.
**Addresses:** Auth with persistent session, asset type selector (schema-driven), copy-paste field ordering correctness
**Avoids:** Schema Registry drift pitfall (establish single source of truth before any labels are hardcoded elsewhere); API key exposure pitfall (establish `server-only` pattern before AI code is written); RLS pitfall (enable Row Level Security from day one)
**Research flag:** Standard patterns — well-documented Next.js + Supabase setup; no additional research needed

### Phase 2: Photo Capture + Storage
**Rationale:** AI extraction requires photos already in Supabase Storage (Route Handler generates signed URLs to pass to GPT-4o). The upload pipeline must precede AI work. EXIF orientation correction must be proven here — this is the only phase where it can be validated with real device testing before AI integration masks symptoms.
**Delivers:** `PhotoCapture` component (file picker, client-side resize to 2MP with EXIF correction, direct upload to Supabase Storage); photo thumbnail grid; cover photo + drag-to-reorder with `@dnd-kit`; photo order persistence via Server Action; private storage bucket + presigned URL display
**Addresses:** Photo upload with client-side resize; cover photo + reorder with persistence; mobile-usable layout
**Avoids:** EXIF orientation pitfall (validate on Android before AI connected); orphaned storage files pitfall (create asset record draft first, use record UUID in storage path); public bucket pitfall (private bucket + presigned URLs from day one); drag-to-reorder broken on mobile (dnd-kit uses pointer events, not HTML5 drag API)
**Research flag:** Standard patterns — well-documented; EXIF correction with `exifr` is a known pattern; verify `browser-image-compression` iOS Safari PWA compatibility at integration time

### Phase 3: AI Extraction
**Rationale:** Photo upload must be complete before AI work begins (Route Handler needs storage paths). Schema Registry must exist to build the extraction prompt. This phase is the core value proposition but depends on both prior phases.
**Delivers:** `/api/extract/route.ts` Route Handler (auth check, signed URL generation, GPT-4o `generateObject()` call, Zod validation); `ExtractionPanel` component (trigger button, loading state, result display); per-field confidence scores surfaced in UI; extraction failure and partial-extraction states
**Addresses:** AI extraction with confidence scores; extraction status indicators; photo visible during review
**Avoids:** AI call via Server Action pitfall (Route Handler only — Server Actions are queued); confidence scores pitfall (build field-level confidence into schema from the start, not retrofitted); hallucinated values pitfall (prompt instructs model to return `null` for unclear fields)
**Research flag:** May benefit from research-phase — GPT-4o structured output prompt engineering for build plates is specialised; test with realistic sample photos (partial occlusion, glare, angle) before UX is built on top

### Phase 4: Review Form + Save
**Rationale:** Extraction must exist before the review form can be pre-filled. The review form is the mandatory confirmation gate — no data reaches Salesforce output without it.
**Delivers:** `DynamicFieldForm` component (RHF-managed, schema-driven, pre-filled from extraction result, low-confidence fields highlighted); explicit Save Server Action (upsert asset record); revalidation after save; clear distinction between AI-populated and user-edited fields
**Addresses:** Editable review form (mandatory, never skippable); review step UX that prevents users from skipping verification
**Avoids:** Dynamic form re-render storm pitfall (schema derived with `useMemo`, static registry constants at module scope, `field.id` as React key — not array index); review step treated as optional pitfall (low-confidence fields visually distinct, confirmation button shows unverified count)
**Research flag:** Standard patterns — RHF + Zod + shadcn/ui form patterns are well-documented

### Phase 5: Output Generation + Copy-Paste
**Rationale:** Output is generated from confirmed field values — requires the save step to complete. Description templates are implemented here (stubs were defined in Phase 1 Schema Registry; full implementations are finalised here against real asset data).
**Delivers:** `OutputPanel` component with three distinct copy sections (Structured Fields block, Description block, Glass's Valuation block for Caravan/Motor Home); clipboard copy with visual confirmation; deterministic description templates finalised for all asset types/subtypes; snapshot tests for every asset type output
**Addresses:** Copy-paste fields block; copy-paste description block; Glass's Valuation block; one-click copy with confirmation
**Avoids:** AI description text pitfall (description is pure string interpolation, deterministic, snapshot-tested); copy-paste whitespace pitfall (explicit `\n` concatenation, normalisation pass, Salesforce paste tested directly); single "Copy All" anti-pattern (three separate copy sections for three Salesforce paste targets)
**Research flag:** Description template content needs Jack's input on exact subtype field ordering (Excavator vs Dozer within Earthmoving, etc.) — this is domain knowledge, not technical research

### Phase 6: Asset List + Navigation + Edit Flow
**Rationale:** Can be built in parallel with Phases 2-5 once Phase 1 is complete (no dependency on AI or output features), but placed last to keep focus on the core workflow first. Without this phase, the tool works for a single asset per session but doesn't support the multi-asset workday use case.
**Delivers:** Asset list page (Server Component, sorted by recency); routing between list → new asset wizard → record detail; edit existing record flow (return to review form for completed records); basic asset status (draft / confirmed)
**Addresses:** Asset record persistence; asset record list view; multi-session work (on-site capture, desktop completion)
**Avoids:** No pitfalls specific to this phase — standard Server Component + Supabase query pattern
**Research flag:** Standard patterns — no additional research needed

### Phase Ordering Rationale

- **Schema Registry before everything:** It drives AI prompt construction, form field rendering, and output generation. Building AI or forms before the Registry means rebuilding them when the Registry is finalised.
- **Photo upload before AI:** The `/api/extract` Route Handler requires photos in Supabase Storage to generate signed URLs for GPT-4o. EXIF correction must also be validated with real device photos before AI extraction masks the symptoms.
- **AI extraction before review form:** The review form is pre-filled from extraction output. Building the form first means building it twice — once with placeholder data, once integrated with real extraction results.
- **Review form before output generation:** Output is generated from confirmed (saved) field values. The save step must exist before output can be displayed.
- **Asset list last:** Core workflow (new asset → extract → review → output) is the primary loop. List and navigation are supporting infrastructure that can follow.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (AI Extraction):** GPT-4o structured output prompt engineering for industrial build plates is specialised. Sample photos of real Slattery build plates (truck, earthmoving, caravan, forklift) should be tested against prompt variants before committing to the extraction schema. Confidence calibration (when does the model return `null` vs a low-confidence guess?) needs empirical testing.
- **Phase 5 (Description Templates):** The exact subtype field ordering (Excavator vs Dozer within Earthmoving; Caravan vs Motor Home) is domain knowledge that requires Jack's direct input. This is not technical research — it's requirements clarification.

Phases with standard patterns (can skip research-phase):
- **Phase 1 (Foundation):** Next.js + Supabase setup is fully documented; `@supabase/ssr` middleware pattern is standard.
- **Phase 2 (Photo Capture):** File upload + client-side resize + `@dnd-kit` are well-documented patterns; `exifr` orientation correction is a known solution.
- **Phase 4 (Review Form):** RHF + Zod + shadcn/ui form patterns are well-documented.
- **Phase 6 (Asset List):** Standard Server Component + Supabase query pattern.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Next.js 15 and App Router patterns verified from official docs. Supabase, Vercel AI SDK, dnd-kit versions from training knowledge (Aug 2025 cutoff) — verify package versions at install time with `npm install [package]@latest` |
| Features | HIGH | Domain is well-defined; requirements come from PROJECT.md (source of truth); workflow being replaced is explicitly described; feature decisions are derived from known constraints |
| Architecture | HIGH | Core patterns (Route Handler for AI, Server Actions for mutations, Schema Registry as static TypeScript) verified from official Next.js docs v16.1.7. Two-client Supabase pattern (`@supabase/ssr` BrowserClient vs ServerClient) is the current official recommendation |
| Pitfalls | MEDIUM-HIGH | EXIF orientation, canvas resize, and re-render storm patterns are well-established browser/React behaviours. AI hallucination without confidence signals is documented OpenAI behaviour. Copy-paste whitespace issues are domain-specific but follow from string handling fundamentals. Minor uncertainty: exact `exifr` API and `browser-image-compression` iOS PWA behaviour — verify at integration time |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Exact Salesforce field schemas per asset type:** PROJECT.md contains the field lists, but the description template field ordering (especially subtypes within Earthmoving: Excavator, Dozer, Grader, etc.) needs Jack's direct confirmation before Phase 5 templates are written. Incorrect ordering means every description paste requires manual correction.
- **GPT-4o prompt for build plates:** No real build plate photos were tested during research. The extraction schema (which fields to request, confidence calibration, null-vs-guess behaviour) needs empirical validation with actual photos from Slattery sites before the review form UX is designed around it.
- **`browser-image-compression` in iOS Safari PWA context:** Marked MEDIUM confidence. Verify at Phase 2 integration with an actual iPhone that the compression runs without hanging (it uses Web Workers; PWA context may behave differently).
- **Vercel AI SDK v4 `generateObject()` exact API:** Verify `ai` package version at install time (`npm install ai@latest`) — training knowledge is Aug 2025, library may have minor API changes.

---

## Sources

### Primary (HIGH confidence)
- `https://nextjs.org/blog/next-15` — Next.js 15 feature list, App Router, React 19 support
- `https://nextjs.org/docs/app/getting-started/updating-data` — Server Actions pattern (v16.1.7 docs, updated 2026-03-16)
- `https://nextjs.org/docs/app/api-reference/file-conventions/route` — Route Handlers (v16.1.7 docs, updated 2026-03-16)
- `https://nextjs.org/docs/app/guides/backend-for-frontend` — Backend for frontend guide (v16.1.7)
- `/home/jack/projects/prestige_assets/.planning/PROJECT.md` — Requirements source of truth; Salesforce field schemas; workflow description

### Secondary (MEDIUM confidence)
- Training knowledge (Aug 2025 cutoff) — Supabase `@supabase/ssr` v0.5, `browser-image-compression` v2, `@dnd-kit/core` v6, Vercel AI SDK v4
- OpenAI API reference — structured output (`response_format: { type: "json_schema" }`) guarantees schema conformance, not semantic accuracy
- Supabase docs direction — `@supabase/ssr` replacing deprecated `@supabase/auth-helpers-nextjs`

### Tertiary (patterns / domain knowledge)
- EXIF orientation / canvas rotation — MDN and Stack Overflow (well-established browser behaviour, training knowledge)
- React Hook Form re-render patterns — React reconciliation docs, training knowledge
- `server-only` package — Next.js official pattern for preventing accidental client imports

---
*Research completed: 2026-03-17*
*Ready for roadmap: yes*
