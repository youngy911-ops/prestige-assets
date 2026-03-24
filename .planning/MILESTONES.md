# Milestones

## v1.4 Salesforce Subtype Alignment (Shipped: 2026-03-24)

**Phases completed:** 4 phases, 10 plans, 0 tasks

**Key accomplishments:**
- (none recorded)

---

## v1.2 Pre-fill Restoration (Shipped: 2026-03-22)

**Phases completed:** 1 phase (11), 2 plans, 4 tasks
**Timeline:** 2026-03-22 (~16 minutes)
**Stats:** 11 files changed, 345 insertions / 44 deletions, ~7,532 lines of TypeScript total

**Key accomplishments:**
1. Extracted `parseStructuredFields` and `extractFreeformNotes` to `src/lib/utils/parseStructuredFields.ts` — shared pure utility importable by both client components and route handlers
2. Fixed broken import in `describe/route.ts` that would have been caused by removing the function from `extract/route.ts`
3. Wired all 5 pre-fill restoration fixes into `InspectionNotesSection.tsx`: ref seeding at mount, Input/Select `defaultValue`, textarea freeform-only display, and synchronous unmount flush
4. Added 16 tests (11 unit + 5 component) covering all restoration behaviours — 245/245 tests passing with no regressions
5. PREFILL-06 fulfilled: staff can return to an in-progress asset record and find all pre-extraction fields restored

---

## v1.1 Pre-fill & Quality (Shipped: 2026-03-21)

**Phases completed:** 3 phases (8–10), 5 plans, 8 tasks
**Timeline:** 2026-03-21 (single day, ~3.5 hours)
**Stats:** 12 source files changed, ~7,348 lines of TypeScript total

**Key accomplishments:**
1. Fixed authenticated-user redirect loop — deleted conflicting root page, added bidirectional middleware auth guards; all 6 auth routing tests green
2. Added `inspectionPriority` schema fields for VIN, suspension (select), unladen weight, and length across all 4 asset types using TDD guard
3. Suspension Type rendered as Select dropdown in truck/trailer inspection cards with fixed options (Spring/Airbag/6 Rod/Other)
4. `parseStructuredFields` parser in extract route wires pre-entered values to AI prompt as authoritative overrides
5. GPT-4o verbatim constraint: system prompt rule + `buildDescriptionUserPrompt` restructured to split notes into labelled verbatim/freeform blocks
6. Runtime-verified DESCR-01 in production — Airbag suspension and TBC HP preserved verbatim in generated description

---

## v1.0 MVP (Shipped: 2026-03-21)

**Phases completed:** 7 phases, 21 plans
**Timeline:** 2026-03-17 → 2026-03-21 (4 days)
**Stats:** 215 files changed, ~6,975 lines of TypeScript, 140 commits

**Key accomplishments:**
1. Next.js app scaffolded with Supabase auth and Schema Registry for 7 asset types (Truck, Trailer, Earthmoving, Agriculture, Forklift, Caravan, General Goods)
2. Mobile-first photo upload with EXIF orientation correction, client-side 2MP resize, drag-to-reorder cover photo order persisted to Supabase Storage
3. GPT-4o extraction pipeline via Route Handler — per-field confidence scores, optional inspection notes, photos-only workflow fully supported
4. Dynamic react-hook-form review form with mandatory missing-info checklist, blocking field enforcement (VIN, rego), and re-extraction path
5. Copy-paste-ready Salesforce output — GPT-4o description generation + deterministic fields block with per-block clipboard buttons
6. Asset list with recency sorting, status badges, resume-editing routing, BottomNav for mobile and desktop
7. AI extraction quality uplift — aiHint field annotations across all schemas, 25+ new fields enabled for earthmoving/agriculture/forklift/trailer, explicit plate-type routing in system prompt

---

