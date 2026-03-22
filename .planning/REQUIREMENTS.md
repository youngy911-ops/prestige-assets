# Requirements: Prestige Assets — Slattery Auctions Book-In App

**Defined:** 2026-03-22
**Core Value:** Photo a build plate → AI extracts identifiers → app generates copy-paste-ready Salesforce fields and a correctly formatted description — turning an hour of manual research into minutes.

## v1.3 Requirements

### Marine

- [x] **MARINE-01**: User can create a Marine asset with subtypes: Boat, Yacht, Jet Ski, and the full Salesforce marine field schema (HIN, Make, Model, Year, Builder, Designer, Motor Type, Number of Engines, Main Engine Details, Engine Hours, Fuel Tank Capacity, Water Tank Capacity, Steering Type, Beam, Draft, LOA, Trailer Length, Launch Date, Sighted, Winch, Thrusters, Damage, Damage Notes, Extras)
- [x] **MARINE-02**: AI extracts marine fields from photos and inspection notes with appropriate aiHints per field
- [x] **MARINE-03**: App generates a correctly formatted marine description per subtype using the established template (Jet Ski example: Year Make Model Type / Engine details / Hours / Extras / Trailer if supplied)

### Truck Subtypes

- [x] **TRUCK-01**: Truck subtypes updated to: Prime Mover, Flat Deck, Cab Chassis, Tipper, Pantech, Refrigerated Pantech, Curtainsider, Beavertail, Tilt Tray, Vacuum, Concrete Pump, Concrete Agitator, EWP, Service (Rigid Truck and Crane Truck removed)
- [ ] **TRUCK-02**: Description template exists for each truck subtype so GPT-4o generates correctly formatted output

### Trailer Subtypes

- [x] **TRAIL-01**: Trailer subtypes updated to: Flat Deck, Side Loader, Tipper, Extendable, Drop Deck, Skel, Pig, Plant, Tag, Box, Low Loader

### Earthmoving Subtypes

- [x] **EARTH-01**: Earthmoving subtypes updated to include: Excavator, Skid Steer Loader, Compactor, Dozer, Motor Grader, Wheel Loader, Backhoe Loader, Telehandler, Dump Truck, Trencher

### General Goods Subtypes

- [x] **GOODS-01**: General Goods subtypes added: Tools & Equipment, Attachments, Workshop Equipment, Office & IT, Miscellaneous

### Description Quality

- [ ] **DESC-01**: All generated descriptions always close with "Sold As Is, Untested & Unregistered." — no exceptions across all asset types and subtypes
- [ ] **DESC-02**: Description templates exist for all earthmoving subtypes (Dozer, Motor Grader, Wheel Loader, Backhoe Loader, Telehandler, Dump Truck, Trencher) so GPT-4o has concrete format guidance

### Pre-fill Bugs (Deferred from v1.2)

- [ ] **PREFILL-07**: "Other notes" textarea shows only freeform notes (not serialised key:value lines) when returning to a record
- [ ] **PREFILL-08**: Pre-extraction edits made within 500ms of navigating away are not silently lost — unmount flush for debounced autosave

## v2 Requirements

- Additional asset types (Agriculture subtypes, Forklift subtypes, Caravan subtypes)
- PPSR lookup result storage
- Multi-user roles

## Out of Scope

| Feature | Reason |
|---------|--------|
| iOS / native app | Web browser covers all use cases |
| Auto-save without review | Single wrong VIN destroys legally significant record |
| Salesforce API push | Blocked on IT approval |
| Public bidding interface | Handled by existing platforms |
| Glass's Valuation block | Permanently out of scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MARINE-01 | Phase 12 | Complete |
| MARINE-02 | Phase 12 | Complete |
| MARINE-03 | Phase 12 | Complete |
| TRUCK-01 | Phase 13 | Complete |
| TRAIL-01 | Phase 13 | Complete |
| EARTH-01 | Phase 13 | Complete |
| GOODS-01 | Phase 13 | Complete |
| TRUCK-02 | Phase 14 | Pending |
| DESC-01 | Phase 14 | Pending |
| DESC-02 | Phase 14 | Pending |
| PREFILL-07 | Phase 15 | Pending |
| PREFILL-08 | Phase 15 | Pending |

**Coverage:**
- v1.3 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 — traceability mapped after roadmap creation*
