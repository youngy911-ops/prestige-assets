# Requirements: Prestige Assets — Slattery Auctions Book-In App

**Defined:** 2026-03-17
**Core Value:** Photo a build plate → AI extracts identifiers → app generates copy-paste-ready Salesforce fields and a correctly formatted description — turning an hour of manual research into minutes.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can log in with email and password
- [ ] **AUTH-02**: User session persists across browser refresh

### Asset Record

- [ ] **ASSET-01**: User can create a new asset record
- [ ] **ASSET-02**: User can select asset type (Truck, Trailer, Earthmoving, Agriculture, Forklift, Caravan/Motor Home, General Goods)
- [ ] **ASSET-03**: User can view a list of asset records sorted by recency
- [ ] **ASSET-04**: User can resume editing an asset record from the list

### Photo Capture

- [ ] **PHOTO-01**: User can upload photos via web file picker (supports phone camera roll on mobile browser and file system on desktop)
- [ ] **PHOTO-02**: Photos are resized client-side to max 2MP (with EXIF orientation correction) before upload and stored in private Supabase Storage
- [ ] **PHOTO-03**: User can drag-to-reorder photos with cover photo designation; order persists after navigation and refresh

### AI Extraction

- [ ] **AI-01**: App extracts VIN/PIN/Serial, make, model, and year from build plate photos using AI vision with per-field confidence scores
- [ ] **AI-02**: User must review and confirm all AI-extracted data on a dedicated screen before the record is saved (no skip path)

### Asset Form

- [ ] **FORM-01**: App displays and captures data using the correct Salesforce field schema for the selected asset type (e.g. Truck shows ~35 truck-specific fields; Earthmoving shows 2-page schema)
- [ ] **FORM-02**: Low-confidence AI-extracted fields are visually highlighted in the review form to prompt verification

### Salesforce Output

- [ ] **SF-01**: App generates a copy-paste-ready structured fields block for each asset with fields in the correct Salesforce order and correct field labels for that asset type
- [ ] **SF-02**: App generates a correctly formatted description block per asset subtype (Excavator, Dozer, Grader, Wheel Loader, Truck, Trailer, Caravan, etc.) using deterministic templates — correct line ordering, no dot points, no marketing language, "Sold As Is, Untested & Unregistered." footer
- [ ] **SF-03**: Each output section (fields block, description block) has its own copy-to-clipboard button with visual confirmation

## v2 Requirements

### Data Enrichment

- **ENRICH-01**: QLD rego lookup — auto-populate VIN, tare, GVM, GCM, axle weights from registration number for registered assets
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

## Traceability

*(Populated by roadmapper)*

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| ASSET-01 | TBD | Pending |
| ASSET-02 | TBD | Pending |
| ASSET-03 | TBD | Pending |
| ASSET-04 | TBD | Pending |
| PHOTO-01 | TBD | Pending |
| PHOTO-02 | TBD | Pending |
| PHOTO-03 | TBD | Pending |
| AI-01 | TBD | Pending |
| AI-02 | TBD | Pending |
| FORM-01 | TBD | Pending |
| FORM-02 | TBD | Pending |
| SF-01 | TBD | Pending |
| SF-02 | TBD | Pending |
| SF-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: TBD
- Unmapped: TBD

---
*Requirements defined: 2026-03-17*
