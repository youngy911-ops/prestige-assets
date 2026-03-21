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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Days | Phases | Plans | Key Change |
|-----------|------|--------|-------|------------|
| v1.0 MVP | 4 | 7 | 21 | Greenfield — established Schema Registry pattern and TDD wave structure |

### Cumulative Quality

| Milestone | Tests | Key Pattern |
|-----------|-------|-------------|
| v1.0 | 200+ vitest | Wave 0 failing stubs → Wave N implementation; Server Action + Route Handler mocking |

### Top Lessons (Verified Across Milestones)

1. Schema Registry as single source of truth eliminates drift across AI, form, and output layers
2. Route Handlers (not Server Actions) for long-running AI calls
3. Decimal phase numbering for urgent insertions keeps history clean
