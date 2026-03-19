# Requirements: Prestige Assets — Slattery Auctions Book-In App

**Defined:** 2026-03-17
**Core Value:** Photo a build plate → AI extracts identifiers → app generates copy-paste-ready Salesforce fields and a correctly formatted description — turning an hour of manual research into minutes.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can log in with email and password
- [x] **AUTH-02**: User session persists across browser refresh

### Asset Record

- [x] **ASSET-01**: User can create a new asset record
- [x] **ASSET-02**: User can select asset type (Truck, Trailer, Earthmoving, Agriculture, Forklift, Caravan/Motor Home, General Goods)
- [ ] **ASSET-03**: User can view a list of asset records sorted by recency
- [ ] **ASSET-04**: User can resume editing an asset record from the list

### Photo Capture

- [x] **PHOTO-01**: User can upload photos via web file picker (supports phone camera roll on mobile browser and file system on desktop)
- [x] **PHOTO-02**: Photos are resized client-side to max 2MP (with EXIF orientation correction) before upload and stored in private Supabase Storage
- [x] **PHOTO-03**: User can drag-to-reorder photos with cover photo designation; order persists after navigation and refresh

### AI Extraction

- [x] **AI-01**: App extracts only the Salesforce fields defined in the Schema Registry for the selected asset subtype (e.g. fields for a Tipper differ from a Prime Mover; Excavator differs from Wheel Loader) — never a generic field dump. Extraction uses AI vision across all uploaded photos — build plate, compliance plate, weight rating plate, cab card, instrument cluster (odometer km reading, hour meter reading), and any other visible plates or markings — with per-field confidence scores. Photos-only is a fully supported workflow. When make/model/year are identified, AI also uses its training knowledge of manufacturer specifications to infer weight ratings and other known-spec fields (prefilled with "inferred" confidence, not "detected").
- [x] **AI-02**: User must review and confirm all AI-extracted data on a dedicated screen before the record is saved (no skip path)
- [x] **AI-03**: Staff can optionally enter freeform "Inspection notes" (VIN, rego, km, hours, dimensions, body manufacturer, number of keys, service history etc.) before triggering extraction — when provided, notes are passed to AI alongside photos to improve accuracy and fill gaps photos cannot cover
- [x] **AI-04**: Before saving, a "Missing information" checklist shows every field AI could not confidently extract — items are blocking (VIN, rego) requiring manual entry or explicit "unknown/not available" override (e.g. no rego plate affixed, asset arrived locked/no keys), or dismissible (e.g. engine hours on a car) — checklist state (flagged / dismissed-na / confirmed / unknown) is persisted to Supabase

### Asset Form

- [x] **FORM-01**: App displays and captures data using the correct Salesforce field schema for the selected asset type (e.g. Truck shows ~35 truck-specific fields; Earthmoving shows 2-page schema)
- [x] **FORM-02**: Low-confidence AI-extracted fields are visually highlighted in the review form to prompt verification

### Salesforce Output

- [ ] **SF-01**: App generates a copy-paste-ready structured fields block for each asset with fields in the correct Salesforce order and correct field labels for that asset type
- [ ] **SF-02**: App generates a correctly formatted description block per asset subtype (Excavator, Dozer, Grader, Wheel Loader, Truck, Trailer, Caravan, etc.) using GPT-4o with a locked system prompt — correct line ordering, no dot points, no marketing language, "Sold As Is, Untested & Unregistered." footer; output is editable before copy-paste
- [ ] **SF-03**: Each output section has its own copy-to-clipboard button with visual confirmation

## v2 Requirements

### Photo Intelligence

- **PHOTO-04**: AI-suggested photo ordering — after extraction, AI recommends a logical photo sequence for Salesforce (exterior → build plate → compliance plate → instrument cluster → interior → damage) that staff can accept or override

### Data Enrichment

- **ENRICH-01**: QLD rego lookup — auto-populate VIN, tare, GVM, GCM, axle weights from registration number for registered assets (staff can manually enter rego for lookup; full auto-check from photo is a later step)
- **ENRICH-02**: Spec research pipeline — RitchieSpecs / manufacturer auto-fill of remaining Salesforce fields given make and model
- **ENRICH-03**: Auction comp pricing — surface market value context from IronPlanet, Pickles, Grays, Mascus

### Asset Management

- **MGMT-01**: Vendor / consignor records — create vendor with name, contact, commission rate; link to assets
- **MGMT-02**: Auction management — sale event creation, asset assignment, lot ordering, reserve/starting bid per lot

### Roles & Compliance

- **ROLE-01**: Multi-role auth — distinct permissions for valuers, admin, and management
- **ROLE-02**: PPSR result field with VIN lock — stored PPSR result locks VIN/PIN field from AI or manual override without explicit confirmation
- **ROLE-03**: Audit trail — record who created and edited each asset record

### Platform

- **PLAT-01**: Native iOS app (Expo) — on-site capture via native camera with better photo quality than web file picker

### Integration

- **INT-01**: Salesforce API push — push asset records directly into Salesforce (blocked on IT/Connected App approval)

## Out of Scope

| Feature | Reason |
|---------|--------|
| iOS / native app | Web browser covers on-site and desktop; Expo overhead not justified until web workflow is validated |
| Auto-save extracted data without review | Single wrong VIN destroys a legally significant auction record — mandatory review is non-negotiable |
| AI-generated description text | Non-deterministic output violates Slattery's strict formatting rules; breaks copy-paste workflow |
| PPSR lookup within the app | Jack runs PPSR through Salesforce separately; app stores result only (v2) |
| Public-facing bidding interface | Handled by existing platforms (i-bidder, Bidspotter) |
| Automated valuation engine | Manual input only; comp pricing provides context but not a calculated value |
| Email / notification system | Not part of the book-in workflow |
| Glass's Valuation block (Caravan) | Permanently out of scope — not needed in any version of this project |

## Traceability

*(Updated by roadmapper — 2026-03-17)*

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| ASSET-01 | Phase 1 | Complete |
| ASSET-02 | Phase 1 | Complete |
| PHOTO-01 | Phase 2 | Complete |
| PHOTO-02 | Phase 2 | Complete |
| PHOTO-03 | Phase 2 | Complete |
| AI-01 | Phase 3 | Complete |
| AI-02 | Phase 3 | Complete |
| AI-03 | Phase 3 | Complete |
| AI-04 | Phase 4 | Complete |
| FORM-01 | Phase 4 | Complete |
| FORM-02 | Phase 4 | Complete |
| SF-01 | Phase 5 | Pending |
| SF-02 | Phase 5 | Pending |
| SF-03 | Phase 5 | Pending |
| ASSET-03 | Phase 6 | Pending |
| ASSET-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-17*
*Traceability updated: 2026-03-17*
