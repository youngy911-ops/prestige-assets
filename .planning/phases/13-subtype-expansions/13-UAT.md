---
status: diagnosed
phase: 13-subtype-expansions
source: [13-01-SUMMARY.md, 13-02-SUMMARY.md]
started: 2026-03-22T00:00:00Z
updated: 2026-03-22T00:30:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Truck Subtype Selector
expected: When creating or editing a Truck asset, the subtype dropdown shows 14 options. Old options (rigid_truck, crane_truck, service_truck) are gone. New options include: Prime Mover, Flat Deck, Cab Chassis, Pantech, Refrigerated Pantech, Curtainsider, Beavertail, Tilt Tray, Vacuum, Concrete Pump, Concrete Agitator, EWP, and Service.
result: issue
reported: "add in 'other' also"
severity: major

### 2. Trailer Subtype Selector
expected: When creating or editing a Trailer asset, the subtype dropdown shows 11 options. Old options (flat_top, side_tipper, dog_trailer, b_double, semi_trailer) are gone. New options include: Side Loader, Tipper, Extendable, Skel, Pig, Plant, Tag, Box, and Low Loader.
result: pass

### 3. Earthmoving Subtype Selector
expected: When creating or editing an Earthmoving asset, the subtype dropdown shows 10 options. Bare "Skid Steer", "Grader", and "Backhoe" are replaced with "Skid Steer Loader", "Motor Grader", and "Backhoe Loader". New additions include Compactor, Dump Truck, and Trencher.
result: issue
reported: "pass, add bulldozer/crawler tractor, other"
severity: major

### 4. General Goods Subtype Selector
expected: When creating or editing a General Goods asset, the subtype dropdown shows 5 options: Tools & Equipment, Attachments, Workshop Equipment, Office/IT, and Miscellaneous. The old catch-all "General" option is gone.
result: pass

## Summary

total: 4
passed: 2
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "Truck subtype dropdown includes all v1.3 options plus an 'other' catch-all"
  status: failed
  reason: "User reported: add in 'other' also"
  severity: major
  test: 1
  root_cause: "{ key: 'other', label: 'Other' } was never appended to the subtypes array in truck.ts during v1.3 replacement"
  artifacts:
    - path: "src/lib/schema-registry/schemas/truck.ts"
      issue: "subtypes array missing other entry"
  missing:
    - "Append { key: 'other', label: 'Other' } as final entry in subtypes array"
  debug_session: ""
- truth: "Earthmoving subtype dropdown includes bulldozer, crawler_tractor, and other"
  status: failed
  reason: "User reported: pass, add bulldozer/crawler tractor, other"
  severity: major
  test: 3
  root_cause: "bulldozer (rename from dozer), crawler_tractor, and other were never added to earthmoving.ts subtypes array; existing dozer key to be renamed bulldozer per user decision"
  artifacts:
    - path: "src/lib/schema-registry/schemas/earthmoving.ts"
      issue: "subtypes array missing bulldozer (rename dozer), crawler_tractor, other"
  missing:
    - "Rename { key: 'dozer', label: 'Dozer' } to { key: 'bulldozer', label: 'Bulldozer' }"
    - "Add { key: 'crawler_tractor', label: 'Crawler Tractor' }"
    - "Add { key: 'other', label: 'Other' } as final entry"
  debug_session: ""
