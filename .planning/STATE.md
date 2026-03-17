---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed 02-photo-capture-storage-02-PLAN.md
last_updated: "2026-03-17T14:39:50.932Z"
last_activity: 2026-03-17 — Schema Registry (7 asset types), New Asset wizard complete
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 6
  completed_plans: 5
  percent: 17
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-17)

**Core value:** Photo a build plate → AI extracts identifiers → app generates copy-paste-ready Salesforce fields and a correctly formatted description — turning an hour of manual research into minutes.
**Current focus:** Phase 1 — Foundation + Schema Registry

## Current Position

Phase: 1 of 6 (Foundation + Schema Registry) — COMPLETE
Plan: 3 of 3 in current phase
Status: Phase 1 complete — ready for Phase 2
Last activity: 2026-03-17 — Schema Registry (7 asset types), New Asset wizard complete

Progress: [█░░░░░░░░░] 17%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P01 | 7 | 2 tasks | 14 files |
| Phase 01 P02 | 6 | 2 tasks | 5 files |
| Phase 01 P03 | 4 | 2 tasks | 14 files |
| Phase 02-photo-capture-storage P01 | 3 | 2 tasks | 8 files |
| Phase 02-photo-capture-storage P02 | 3 | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Init: Web-only, no iOS/Expo — web covers on-site (phone browser) and desktop; prior project wasted time on iOS scaffolding before core workflow was validated
- Init: Schema Registry is load-bearing — drives AI extraction prompt, review form, and output formatter; must be complete before any downstream component is built
- Init: Deterministic description templates only — no AI text generation for descriptions; templates from Schema Registry control structure
- Init: /api/extract Route Handler (not Server Action) for GPT-4o call — Server Actions are queued/sequential, unsuitable for long-running AI calls
- [Phase 01]: shadcn v4 uses @base-ui/react — Button asChild pattern not available; used styled Link for navigation buttons
- [Phase 01]: Tailwind v4 uses oklch color space — brand hex values adapted to oklch equivalents in globals.css
- [Phase 01]: Used @supabase/ssr createBrowserClient and createServerClient (not deprecated auth-helpers-nextjs)
- [Phase 01-02]: Files placed under src/lib/ (not root lib/) — @/* alias resolves to ./src, existing pattern from 01-01
- [Phase 01-03]: descriptionTemplate stub returns empty string on all 7 schemas — Phase 5 implements deterministic templates
- [Phase 01-03]: caravan hasGlassValuation: true; Glass's Valuation sub-fields (Max Offer, Est. Trade, RRP) come from external service, not user-entered schema fields
- [Phase 02-photo-capture-storage]: updatePhotoOrder does NOT call revalidatePath — client does optimistic update on drag to avoid visible flicker
- [Phase 02-photo-capture-storage]: processImageForUpload uses canvas redraw to bake EXIF orientation before compression (no preserveExif) — ensures correct GPT-4o pixel input in Phase 3
- [Phase 02-photo-capture-storage]: Storage RLS uses storage.foldername(name)[1] for userId prefix ownership — path pattern {userId}/{assetId}/{filename}
- [Phase 02-photo-capture-storage]: extraction_stale only set when assets.fields != '{}' — avoids unnecessary re-extraction on fresh draft assets
- [Phase 02-photo-capture-storage]: PhotoThumbnail accepts dnd-kit passthrough props (dragHandleProps, style, isDragging) but does not call useSortable itself — PhotoThumbnailGrid owns drag logic

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 3: GPT-4o structured output prompt for industrial build plates needs empirical testing with real Slattery photos before extraction schema is finalised
- Phase 5: Exact description subtype field ordering (Excavator vs Dozer vs Grader within Earthmoving) requires Jack's direct confirmation — domain knowledge, not technical research

## Session Continuity

Last session: 2026-03-17T14:39:50.929Z
Stopped at: Completed 02-photo-capture-storage-02-PLAN.md
Resume file: None
