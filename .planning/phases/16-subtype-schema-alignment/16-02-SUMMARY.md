---
phase: 16-subtype-schema-alignment
plan: 02
subsystem: schema-registry
tags: [subtypes, salesforce-alignment, agriculture, forklift, caravan, general-goods]
dependency_graph:
  requires: []
  provides: [agriculture-subtypes-12, forklift-subtypes-9, caravan-subtypes-5, general-goods-subtypes-16]
  affects: [wizard-step3-asset-subtype-selector]
tech_stack:
  added: []
  patterns: [subtype-array-replacement]
key_files:
  created: []
  modified:
    - src/lib/schema-registry/schemas/agriculture.ts
    - src/lib/schema-registry/schemas/forklift.ts
    - src/lib/schema-registry/schemas/caravan.ts
    - src/lib/schema-registry/schemas/general-goods.ts
decisions:
  - "All four subtype arrays replaced exactly per Salesforce-aligned spec from CONTEXT.md"
  - "motor_home (old key, two words) removed and replaced by motorhome (one word) in caravan.ts"
  - "coupe added to both agriculture and caravan as Salesforce-required entry"
  - "displayName 'Caravan / Motor Home' preserved unchanged in caravan.ts"
requirements_completed: [SUBTYPE-04, SUBTYPE-05, SUBTYPE-06, SUBTYPE-08]
metrics:
  duration: "~4 minutes"
  completed: "2026-03-23T12:56:41Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
  files_created: 0
---

# Phase 16 Plan 02: Subtype Schema Alignment (Agriculture, Forklift, Caravan, General Goods) Summary

**One-liner:** Replaced four schema subtype arrays with exact Salesforce-aligned lists — 12 agriculture, 9 forklift, 5 caravan, 16 general-goods entries — enabling Step 3 subtype selectors in the wizard for these asset types.

## What Was Done

Replaced `subtypes` arrays in four schema files. No other properties (fields, hasGlassValuation, displayName, assetType, descriptionTemplate) were modified in any file.

### Agriculture (agriculture.ts)

Old: 6 entries (tractor, header, sprayer, planter, baler, cultivation)
New: 12 Salesforce-aligned entries

| Key | Label |
|-----|-------|
| air_seeder | Air Seeder |
| baler | Baler |
| combine_harvester | Combine Harvester |
| coupe | Coupe |
| disc_seeder | Disc Seeder |
| forestry | Forestry |
| grain_auger | Grain Auger |
| mower_conditioner | Mower/Conditioner |
| other | Other |
| plough | Plough |
| spray_rig | Spray Rig |
| tractor | Tractor |

### Forklift (forklift.ts)

Old: 4 entries (counterbalance, reach_truck, order_picker, telehandler)
New: 9 Salesforce-aligned entries

| Key | Label |
|-----|-------|
| clearview_mast | Clearview Mast |
| container_mast | Container Mast |
| electric_pallet_jack | Electric Pallet Jack |
| ewp | EWP |
| other | Other |
| stock_picker | Stock Picker |
| telehandler | Telehandler |
| walk_behind | Walk Behind |
| walkie_stacker | Walkie Stacker |

### Caravan (caravan.ts)

Old: 3 entries (caravan, motor_home, camper_trailer)
New: 5 Salesforce-aligned entries

| Key | Label |
|-----|-------|
| camper_trailer | Camper Trailer |
| caravan | Caravan |
| coupe | Coupe |
| motorhome | Motorhome |
| other | Other |

### General Goods (general-goods.ts)

Old: 5 entries (tools_equipment, attachments, workshop_equipment, office_it, miscellaneous)
New: 16 Salesforce-aligned entries

| Key | Label |
|-----|-------|
| agriculture | Agriculture |
| gardening_landscaping | Gardening & Landscaping |
| goodwill | Goodwill |
| health_fitness | Health & Fitness |
| hospitality | Hospitality |
| it_computers | IT & Computers |
| jewellery_watches_collectables | Jewellery/Watches/Collectables |
| medical | Medical |
| miscellaneous | Miscellaneous |
| office | Office |
| other | Other |
| plant_equipment | Plant & Equipment |
| retail_fit_out | Retail Fit Out |
| retail_stock | Retail Stock |
| signage | Signage |
| tools_toolboxes | Tools & Toolboxes |

## Commits

- `7dba70c` feat(16-02): replace agriculture and forklift subtype arrays
- `8927f88` feat(16-02): replace caravan and general-goods subtype arrays

## Decisions Made

- motor_home (old key, two words) removed and replaced by motorhome (one word) in caravan.ts — matches Salesforce exactly
- coupe added to both agriculture and caravan as Salesforce-required entries
- displayName 'Caravan / Motor Home' preserved unchanged in caravan.ts — the display name uses space+slash+space, the subtype key uses no space

## Deviations from Plan

None - plan executed exactly as written.

## Notes

- `npm test` will fail after this plan because schema-registry.test.ts still has old assertions (toHaveLength(5) for general_goods etc.). This is expected — Plan 03 updates the tests.
- Agriculture and Forklift wizard Step 3 subtype selectors will now appear (subtypes.length > 0 gate now passes).

## Self-Check: PASSED

All 4 modified files exist. Both task commits (7dba70c, 8927f88) confirmed in git log.
