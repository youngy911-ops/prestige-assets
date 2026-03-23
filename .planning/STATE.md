---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Salesforce Subtype Alignment
status: planning
stopped_at: Completed 16-03-PLAN.md
last_updated: "2026-03-23T13:12:01.318Z"
last_activity: 2026-03-23 — Roadmap created, Phase 16 ready for planning
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 67
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** Photo a build plate → AI extracts identifiers → app generates copy-paste-ready Salesforce fields and a correctly formatted description — turning an hour of manual research into minutes.
**Current focus:** v1.4 — Phase 16: Subtype Schema Alignment

## Current Position

Phase: 16 of 17 (Subtype Schema Alignment)
Plan: — of — (not yet planned)
Status: Ready to plan
Last activity: 2026-03-23 — Roadmap created, Phase 16 ready for planning

Progress: [███████░░░] 67% (v1.4)

## Performance Metrics

**Velocity (prior milestones):**
- v1.0: 21 plans, 4 days
- v1.1: 5 plans, ~3.5 hours
- v1.2: 2 plans, ~16 minutes
- v1.3: 9 plans, 2 days

**v1.4 By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 16. Subtype Schema Alignment | - | - | - |
| 17. Description Template Coverage | - | - | - |

*Updated after each plan completion*

| Phase 16 P01 | 1m | 2 tasks | 4 files |
| Phase 16 P02 | 4m | 2 tasks | 4 files |
| Phase 16 P03 | 3m | 2 tasks | 1 files |

## Accumulated Context

### Decisions

Recent decisions affecting current work (full log in PROJECT.md):

- [Phase 13]: skid_steer_loader/motor_grader/backhoe_loader used as compound keys — more precise than bare names
- [Phase 13]: general_goods 'general' catch-all removed; replaced with categorical subtypes
- [Phase 13]: dozer key renamed to bulldozer — matches industry terminology
- [Phase 14]: DOZER heading renamed to BULLDOZER in DESCRIPTION_SYSTEM_PROMPT — matches Phase 13 key change
- [Phase 14]: CRAWLER TRACTOR template emphasises drawbar/PTO/implements (NOT blade width/ripper — those are bulldozer-specific)
- [Phase 15]: sendBeacon + Blob(JSON, application/json) for unmount flush — guaranteed delivery after iOS page teardown
- [Phase 16 P01]: coupe included in truck/trailer/earthmoving/marine subtypes per Salesforce requirement; bulldozer+crawler_tractor merged into bulldozer_crawler_tractor; Concrete labels use space-dash-space format
- [Phase 16 P02]: motor_home replaced by motorhome in caravan.ts; coupe added to agriculture and caravan; displayName 'Caravan / Motor Home' preserved
- [Phase 16]: Test-only change: no production schema files touched, only test assertions updated to match post-Phase-16 schema reality

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-23T13:12:01.316Z
Stopped at: Completed 16-03-PLAN.md
Resume file: None
