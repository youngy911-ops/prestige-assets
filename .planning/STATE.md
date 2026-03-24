---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Salesforce Subtype Alignment
status: executing
stopped_at: Completed 19-prompt-schema-alignment-01-PLAN.md
last_updated: "2026-03-24T12:10:21.840Z"
last_activity: 2026-03-24 — Phase 17 plan 01 complete (73 RED tests, TDD scaffold)
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 10
  completed_plans: 9
  percent: 75
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** Photo a build plate → AI extracts identifiers → app generates copy-paste-ready Salesforce fields and a correctly formatted description — turning an hour of manual research into minutes.
**Current focus:** v1.4 — Phase 16: Subtype Schema Alignment

## Current Position

Phase: 17 of 17 (Description Template Coverage)
Plan: 1 of 4 (TDD Scaffold — DESCR-01..DESCR-08 failing tests)
Status: In progress — plan 01 complete
Last activity: 2026-03-24 — Phase 17 plan 01 complete (73 RED tests, TDD scaffold)

Progress: [████████░░] 75% (v1.4)

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
| Phase 17 P02 | 5m | 2 tasks | 1 files |
| Phase 17 P03 | 2 | 1 tasks | 1 files |
| Phase 17 P04 | 5m | 2 tasks | 1 files |
| Phase 18-test-key-fidelity P01 | 3m | 1 tasks | 1 files |
| Phase 19-prompt-schema-alignment P01 | 10m | 3 tasks | 2 files |

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
- [Phase 17 P01]: getSystemContentP17 helper at module level so all Phase 17 describe blocks share it; REFRIGERATED PANTECH trailer test passes immediately (prompt has truck version — plan 02 adds trailer-specific heading)
- [Phase 17]: COUPE subtypes (truck/trailer) get artifact-pattern sections instructing GPT-4o to use most relevant structure
- [Phase 17]: DOG / PIG / TAG share one heading as B-train/A-train configs indistinguishable at template level
- [Phase 17]: Supplement-not-repeat: removed Suspension from RIGID TRUCK and ATM from CARAVAN (SF field violations)
- [Phase 17]: BULLDOZER/CRAWLER TRACTOR merged into single section with conditional For Bulldozer/For Crawler Tractor field blocks
- [Phase 17]: COUPE (EARTHMOVING) follows system artifact pattern: GPT-4o instructed to use most relevant earthmoving structure
- [Phase 17]: MOTORHOME template intentionally omits suspension (SF field); CAMPER TRAILER keeps suspension as selling point for towable units
- [Phase 17]: JET SKI section replaced by PERSONAL WATERCRAFT using verified canonical example structure
- [Phase 17]: MARINE renamed to MARINE (RECREATIONAL BOAT); existing toContain('MARINE') test still passes
- [Phase 18-01]: Phase 18 scope is corrections only — no new describe blocks or it() tests; Phase 19 adds recreational and personal_watercraft
- [Phase 18-01]: Subtype key string in getSystemContentP17 must match the schema key exactly — never a display-label variant or alias
- [Phase 19-prompt-schema-alignment]: WASHING heading renamed from WASHING PLANT to match earthmoving.ts key 'washing'
- [Phase 19-prompt-schema-alignment]: PRIVATE and RECREATIONAL marine sections added mirroring MARINE (RECREATIONAL BOAT) body for exact schema key routing
- [Phase 19-prompt-schema-alignment]: Negative EWP not.toContain assertion omitted — full prompt always contains both EWP sections; positive assertion sufficient (user Option A)

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-24T12:10:21.837Z
Stopped at: Completed 19-prompt-schema-alignment-01-PLAN.md
Resume file: None
