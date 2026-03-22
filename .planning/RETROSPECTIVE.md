# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-21
**Phases:** 7 (including 1 inserted decimal phase) | **Plans:** 21 | **Timeline:** 4 days

### What Was Built

- Schema Registry for 7 asset types driving all downstream AI extraction, form rendering, and output formatting
- Mobile-first photo upload with EXIF orientation correction, client-side 2MP resize, and dnd-kit drag-to-reorder with Supabase Storage persistence
- GPT-4o extraction pipeline via Route Handler — per-field confidence scores, optional inspection notes, fully photos-only workflow supported
- Dynamic react-hook-form review form with mandatory missing-info checklist and blocking field enforcement (VIN, rego)
- Copy-paste-ready Salesforce output: deterministic fields block + GPT-4o description generation with locked per-subtype system prompt
- Asset list with recency sorting, status badges, and resume-editing flow; BottomNav for mobile/desktop
- Phase 06.1 quality uplift: aiHint embedded in Zod schema for all 7 asset types, 25+ newly enabled extraction fields

### What Worked

- **Schema Registry as load-bearing foundation**: Building the full Schema Registry in Phase 1 before any UI or AI work paid off every phase — extraction schema, review form, output block, and aiHint all derived from a single source of truth. Zero schema inconsistencies across 21 plans.
- **TDD wave structure (Wave 0 stubs → Wave N implementation)**: Writing failing test scaffolds first caught interface mismatches before integration, and gave clear commit milestones. Particularly effective for Server Actions and Route Handlers.
- **Route Handler for AI calls (not Server Actions)**: Correct call on day 1 — Server Actions are queued and unsuitable for long-running AI. No rework needed.
- **Decimal phase insertion (06.1)**: Inserting an improvement phase after the milestone core was complete, numbered 06.1, kept the execution history clean and the planning intent clear. The convention worked well.
- **aiHint in schema (not prompt engineering)**: Embedding field-specific context in the Zod schema description rather than in a generic system prompt is more maintainable and more accurate. Phase 06.1 confirmed this approach.
- **4-day greenfield to working tool**: Clean separation of concerns (schema → photos → AI → form → output → list) meant each phase had a well-defined predecessor and no circular dependencies.

### What Was Inefficient

- **STATE.md fell behind**: The state file was not kept current after Phase 1 — current focus, progress bar, and phase position were stale by Phase 6. Should be updated atomically with each phase commit.
- **No milestone audit before completion**: Skipped `/gsd:audit-milestone` — means no cross-phase integration validation or E2E flow verification was done systematically. Acceptable for a 4-day sprint where the developer was directly testing, but this should be standard for longer milestones.
- **SUMMARY.md one_liner field not populated**: The gsd-tools CLI couldn't extract accomplishments automatically because SUMMARY.md files don't have a `one_liner` frontmatter field. Consider adding this field to phase plans so milestone completion is automated.
- **Description subtype field ordering**: Exact Earthmoving subtype description ordering (Excavator vs Dozer vs Grader vs Wheel Loader) left as a known open item requiring Jack's confirmation. Should have been resolved before Phase 5 completed.

### Patterns Established

- **Schema Registry convention**: `FieldDefinition` with `label`, `sfOrder`, `aiExtractable`, `aiHint`, `inputType`, `options` — all downstream tooling derives from this type. Do not add fields outside the registry.
- **getAIExtractableFieldDefs() alongside getAIExtractableFields()**: When adding richer return types to registry helpers, add a new function alongside the old one — never break existing callers.
- **All number input fields use `type=text` with `inputMode=numeric`**: Avoids react-hook-form type coercion issues. Validate as string regex, not z.number().
- **Server Component reads DB, Client Component owns state**: Pages are Server Components that fetch initial data; Client Components receive data as props and manage interaction state.
- **PhotoThumbnail receives dnd-kit passthrough props but doesn't own useSortable**: Grid component owns drag logic, thumbnail is purely presentational. Prevents prop drilling of drag context.
- **`description: null` in saveReview clears cached description**: Output page always regenerates description on re-review. Ensures stale descriptions never persist.

### Key Lessons

1. **Build the data model first, in full**: The Schema Registry covering all 7 asset types from day 1 eliminated the most common source of mid-project rework (schema drift). Even fields you don't use immediately should be defined.
2. **Wave 0 TDD is worth the overhead**: Writing failing test scaffolds before implementation catches interface mismatches at the cheapest possible point. The 2-3 minutes to write stubs saves 20+ minutes of debugging post-implementation.
3. **AI Route Handlers need their own API pattern**: Don't use Server Actions for long-running AI calls. Route Handler + client fetch with loading state is the correct Next.js pattern.
4. **Mandatory review gates are non-negotiable for legal records**: The missing-info checklist blocking save for VIN/rego was the right call. Any path that lets staff skip data entry on a legal auction record is a liability.
5. **Decimal phases for urgent insertions work well**: Phase 06.1 kept execution history unambiguous without renumbering. Use decimal phases for quality/hotfix work that must happen between planned phases.
6. **aiHint in schema > prompt engineering**: Field-specific context embedded in structured schema is more reliable than attempting to describe every field in a monolithic system prompt. Scales better as schemas grow.

### Cost Observations

- Model mix: ~100% sonnet-4 (all phases executed with balanced profile)
- Sessions: ~25 (4 days, multiple sessions per day)
- Notable: 21 plans completed in 4 days with full TDD — approximately 12 min average per plan for core implementation phases; longer for UI phases with human UAT checkpoints

---

## Milestone: v1.1 — Pre-fill & Quality

**Shipped:** 2026-03-21
**Phases:** 3 (8–10) | **Plans:** 5 | **Timeline:** single day, ~3.5 hours

### What Was Built

- Bidirectional middleware auth guards — deleted conflicting root page, fixed post-login redirect to asset list
- `inspectionPriority` schema flag promoted to 6 fields across Truck/Trailer/Forklift/Caravan, with Suspension Type as a constrained select input
- `parseStructuredFields` parser wires pre-entered values to AI extract prompt as authoritative overrides; uncontrolled Select in InspectionNotesSection renders these fields
- Belt-and-suspenders GPT-4o verbatim constraint: system prompt rule + restructured `buildDescriptionUserPrompt` splitting notes into labelled verbatim/freeform blocks
- Runtime verification confirmed DESCR-01 with real Slattery asset data

### What Worked

- **Schema-first for pre-fill (Plan 01 before Plan 02)**: Doing the schema changes (inspectionPriority flags, select options) in Phase 9 Plan 01 before the UI wiring in Plan 02 meant Plan 02 had a clean, tested data layer to consume. No schema work leaked into the UI plan.
- **TDD guard on schema changes**: Updating test assertions to RED before modifying schemas proved the guard was live and prevented silent regressions. Added confidence when touching multiple schemas in one plan.
- **parseStructuredFields reuse across routes via direct import**: Importing directly from `extract/route.ts` into `describe/route.ts` worked without TypeScript or edge-runtime issues — avoided creating a shared lib file for a single shared function.
- **Uncontrolled Select with explicit deferral note**: Deciding up-front to leave Select uncontrolled (no re-hydration) and documenting it in the SUMMARY was cleaner than a half-implemented re-hydration. PREFILL-06 is a clear v1.2 task.
- **Single-day milestone**: 3 phases, 5 plans, ~3.5 hours end-to-end. Tight scope with well-defined success criteria made this feel effortless compared to v1.0's 4-day sprint.

### What Was Inefficient

- **PREFILL-05 tracking gap**: Phase 9 Plan 02 SUMMARY.md listed PREFILL-05 as completed, but REQUIREMENTS.md traceability table was never updated (remained "Pending"). Caused a false alarm during milestone completion. Requirements should be updated atomically with the plan completion commit.
- **No milestone audit**: Skipped `/gsd:audit-milestone` again. For a 3-phase milestone this was acceptable, but the pattern of skipping is becoming a habit.
- **Phase 9 roadmap checkbox not updated**: ROADMAP.md showed Phase 9 as `[ ]` at milestone time despite both plans being complete. Progress table also had malformed columns. Roadmap accuracy should be maintained during execution, not just at archival.

### Patterns Established

- **Select uncontrolled pattern for pre-fill inputs**: No `value`/`defaultValue` prop on `Select.Root` in InspectionNotesSection — re-hydration is explicitly deferred to v1.2. Pattern is: uncontrolled + `onValueChange` callback + `handleStructuredChange` storing to state.
- **`onValueChange` typed as `(value: string | null)` with null guard**: Base UI Select Root `onValueChange` resolves to `unknown` without explicit type parameter. Pattern: type as `string | null` and apply `value ?? ''` null guard in the callback.
- **Cross-route function reuse via direct import**: Share utility functions between Next.js route files with direct import — no need to move to `src/lib/` for single-consumer functions.

### Key Lessons

1. **Requirements traceability must be updated atomically with plan completion**: The PREFILL-05 tracking gap showed that requirements status and plan summaries can diverge if not updated in the same commit. Add requirements update to the plan completion checklist.
2. **Scope discipline enabled single-day delivery**: v1.1 shipped in ~3.5 hours because the scope was minimal and well-defined. Deferring PREFILL-06 (re-hydration) was the correct call — it would have added complexity without proportional user value at this stage.
3. **Verbatim fidelity needs structural, not just instructional, constraints**: A system prompt rule alone was insufficient — GPT-4o still paraphrased. Restructuring the user prompt to label values as "Staff-provided values (use verbatim):" was the key fix. Both mechanisms together reliably enforce the constraint.

### Cost Observations

- Model mix: ~100% sonnet-4 (balanced profile)
- Sessions: ~3–4
- Notable: 5 plans in 3.5 hours — fastest milestone yet; tight scope and clean dependencies made execution near-frictionless

---

## Milestone: v1.2 — Pre-fill Restoration

**Shipped:** 2026-03-22
**Phases:** 1 (Phase 11) | **Plans:** 2 | **Timeline:** ~16 minutes

### What Was Built

- `parseStructuredFields` and `extractFreeformNotes` extracted from `extract/route.ts` to `src/lib/utils/parseStructuredFields.ts` — shared pure utility importable by client components
- Fixed broken cross-route import in `describe/route.ts` that would have occurred after removing the function from its prior location
- All 5 pre-fill restoration fixes wired into `InspectionNotesSection.tsx`: `structuredValuesRef` and `notesRef` seeded from parsed state at mount, Input/Select `defaultValue`, textarea freeform-only display, synchronous unmount flush
- 16 tests added (11 unit + 5 component) — 245/245 full suite green

### What Worked

- **Strict Next.js boundary enforcement**: Recognising that client components cannot import from route handlers immediately pointed to the shared utility extraction as mandatory before any component fix. The boundary error was never hit at runtime — the approach was correct from the design phase.
- **TDD with template literal discovery**: Writing tests first (RED) and then implementing (GREEN) caught the JSX string attribute/newline bug before it could mask implementation errors. The test-first discipline surfaced a genuine gotcha (`"vin: ABC\n"` vs `` `vin: ABC\n` `` in JSX) that would have been hard to debug after the fact.
- **`defaultValue` uncontrolled approach validated**: The v1.1 decision to defer to v1.2 with a fully-designed fallback (controlled `useState`) paid off — `defaultValue` worked in jsdom without the fallback, keeping the implementation simpler.
- **Milestone audit pre-flight**: Running `/gsd:audit-milestone` before completion surfaced tech debt items (browser verification gaps, inline function duplication) as non-blocking notes rather than surprises. Audit-first is now established practice.

### What Was Inefficient

- **`describe/route.ts` inline re-implementation**: During v1.1, `describe/route.ts` imported from `extract/route.ts` (cross-route). When the function moved to `src/lib/utils/` in v1.2, the import had to be updated. If `describe/route.ts` had also been updated to use the shared utility in Plan 11-02 rather than fixed as a side-effect of Plan 11-01, the duplication at lines 206–208 would have been caught. The fix was auto-applied but the underlying duplication remains.
- **Browser-unverifiable behaviours**: Base UI Select `defaultValue` hydration and fast-navigation unmount flush both hit jsdom limitations — the audit correctly flagged these as needing manual human verification in a real browser. This is an inherent constraint of the test environment, not a process failure.

### Patterns Established

- **Shared parsing utilities in `src/lib/utils/`**: Functions used by both server (route handlers) and client components must live in `src/lib/utils/` — never in route handlers. Next.js enforces this boundary at build time.
- **useRef initialiser seeding**: `useRef(parseStructuredFields(initialNotes))` — seed refs from parsed state at mount using the initialiser argument, never recalculate from props mid-lifecycle.
- **Unmount flush pattern**: `useEffect(() => () => { clearTimeout(timer); persistFn() }, [persistFn])` — synchronous on unmount, no Promise, cancels debounce before flushing.
- **Template literals required in JSX for multi-line strings**: `initialNotes={`vin: ABC\nodometer: 50000`}` not `initialNotes="vin: ABC\nodometer: 50000"` — JSX attribute strings don't interpret `\n` as newlines.

### Key Lessons

1. **Next.js server/client boundaries are enforced at build time, not runtime**: Shared utilities that cross the boundary must be in `src/lib/utils/` — discovering this at design time (via boundary analysis) is far cheaper than hitting a build error after implementation.
2. **Test-first catches environment quirks early**: The JSX `\n` bug would have been a confusing runtime failure if discovered after implementation. TDD RED→GREEN forced the environment behaviour to be visible before the fix was applied.
3. **jsdom limitations are a known constraint, not a test quality failure**: Base UI Select hydration and Server Action flush timing are legitimately untestable in jsdom. Document these as human-verification items rather than marking tests as incomplete.
4. **16-minute milestone is possible when scope is exact**: One requirement, two sequential plans with clean dependency (utility extraction → component wiring), no ambiguity. Tight scope + clear dependency chain = near-zero overhead.

### Cost Observations

- Model mix: ~100% sonnet-4 (balanced profile)
- Sessions: 1
- Notable: 2 plans, 4 tasks, ~5 minutes of AI execution time — fastest milestone by any measure; the prior work of designing the approach in v1.1 eliminated all upfront research cost

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Days | Phases | Plans | Key Change |
|-----------|------|--------|-------|------------|
| v1.0 MVP | 4 | 7 | 21 | Greenfield — established Schema Registry pattern and TDD wave structure |
| v1.1 Pre-fill & Quality | <1 | 3 | 5 | Tight polish milestone — schema-first layering, cross-route function reuse, uncontrolled Select deferral pattern |
| v1.2 Pre-fill Restoration | <1 | 1 | 2 | Focused fix — shared utility extraction, defaultValue uncontrolled validation, unmount flush pattern |

### Cumulative Quality

| Milestone | Tests | Key Pattern |
|-----------|-------|-------------|
| v1.0 | 200+ vitest | Wave 0 failing stubs → Wave N implementation; Server Action + Route Handler mocking |
| v1.1 | 229+ vitest | TDD guard on schema changes; exported helpers for direct unit testing without HTTP |
| v1.2 | 245 vitest | Shared utility unit tests (11) + component tests (5); template literal gotcha in JSX tests |

### Top Lessons (Verified Across Milestones)

1. Schema Registry as single source of truth eliminates drift across AI, form, and output layers
2. Route Handlers (not Server Actions) for long-running AI calls
3. Decimal phase numbering for urgent insertions keeps history clean
4. Requirements traceability must be updated atomically with plan completion — divergence causes false alarms at milestone time
5. Structural prompt constraints (labelled user prompt blocks) more reliable than instructional rules alone for GPT-4o fidelity
6. Next.js server/client boundary must be enforced at design time — shared utilities go in `src/lib/utils/`, never in route handlers
7. jsdom limitations are a known constraint — document untestable browser behaviours as human-verification items, not incomplete tests
