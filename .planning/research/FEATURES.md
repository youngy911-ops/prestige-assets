# Feature Research

**Domain:** Internal asset data capture tool — photo capture, AI extraction, structured output
**Researched:** 2026-03-17
**Confidence:** HIGH (domain is well-defined; this is an internal tool replacing a known workflow with explicit requirements)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features the tool cannot function without. Missing any of these means the workflow breaks — staff fall back to the manual Claude chat.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Photo upload via file input (camera roll or file system) | Core capture step — no photo upload, no workflow | LOW | `<input type="file" accept="image/*" capture="environment">` on mobile gives direct camera. Multiple file select for batch upload. |
| Client-side image resize before upload | Photos from modern phones are 10-20MB. Without resize, upload is slow on-site (mobile data) and storage costs blow out fast. | LOW | Canvas API resize to max 2MP (≈1600x1200) before Supabase Storage upload. |
| Asset type selector before AI extraction | AI prompt and field schema are both type-dependent. Wrong type = wrong fields extracted. | LOW | 7 types: Truck, Trailer, Earthmoving, Agriculture, Forklift, Caravan/Motor Home, General Goods. Must be set before extraction runs. |
| AI extraction of VIN/PIN/Serial, make, model, year | This is the core value — the reason the tool exists. Without it, staff are back to manual research. | MEDIUM | Vision model with structured JSON output. Needs clear photo of build plate. Confidence scores on extracted fields are important for review. |
| Editable review form for AI-extracted values | AI is imperfect. Staff must be able to correct every field before copy-paste. A single wrong VIN destroys the Salesforce record. | MEDIUM | All extracted fields editable. Changes should not re-trigger AI extraction automatically. |
| Per-asset-type field schema form | Salesforce fields differ by asset type (Truck ~35 fields, Earthmoving 2 pages). Wrong field names break copy-paste into Salesforce. | MEDIUM | Schema Registry per type. Field labels must exactly match Salesforce column names. |
| Copy-paste-ready structured fields block | The final output — the whole reason the tool exists. Must generate fields in Salesforce-correct order with correct labels. | LOW | Formatted text block. One-click copy. |
| Copy-paste-ready description block | Per-type formatted description with strict rules: no dot points, no marketing language, specific field ordering per subtype, "Sold As Is, Untested & Unregistered." footer. | MEDIUM | Deterministic templates per subtype (Excavator vs Dozer vs Truck vs Trailer etc.) — not AI-generated text. |
| Session-persistent login | On-site work spans multiple assets across a day. Re-logging in between assets is a blocker. | LOW | Supabase auth with persistent session token. JWT refresh. |
| Asset record persistence | Staff photograph on-site, complete the record on desktop later. Records must persist across sessions and devices. | LOW | Supabase row per asset. Postgres. |
| Mobile-usable layout | On-site capture happens on a phone browser. If the UI is desktop-only, the capture step is broken. | MEDIUM | Responsive layout. Touch-friendly tap targets. Large upload button visible above fold. |

### Differentiators (What Makes This Better Than Claude Chat)

The current workflow is: photograph → write briefing doc → paste into Claude → copy structured output → paste into Salesforce. These are features that make the app materially better than that baseline — not just equivalent.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Persistent asset records | Claude chat produces no record — once the tab closes, the extraction is gone. Persistent records allow partial completion, multi-session work, and retrospective lookup. | LOW | Already the default with Supabase storage. The persistence itself is the differentiator. |
| Cover photo + drag-to-reorder with persist | Claude chat has no photo management. App gives staff control over asset presentation order (cover photo = hero in Salesforce listing). | MEDIUM | Drag handles in photo grid. Cover photo designation (star/badge). Order stored as integer index on photo rows. Must survive page refresh. |
| Pre-filled field schema by asset type | In the Claude chat workflow, Jack has to remember which fields apply to which asset type. The app enforces the correct schema automatically — no missed fields, no wrong labels. | MEDIUM | Schema Registry drives both the AI extraction prompt and the review form. Single source of truth. |
| AI extraction confidence indicators | Claude chat gives no signal about which extracted values it's unsure about. App can flag low-confidence fields (e.g., partially obscured VIN) so staff know what to double-check. | MEDIUM | Structured AI output includes a `confidence` property per field (high/medium/low). Low-confidence fields highlighted in review form. |
| One-click copy per output section | Claude chat requires selecting text manually, which is error-prone (missed fields, formatting broken). One-click copy per section (Fields block, Description block, Glass's Valuation block) eliminates that friction. | LOW | Clipboard API. Visual feedback on copy (button state change, toast). Separate copy button per output section. |
| Glass's Valuation block for Caravan/Motor Home | In the Claude chat workflow, this section must be manually formatted. App generates it as a third copyable section automatically when asset type is Caravan/Motor Home. | LOW | Conditional section — only rendered for Caravan/Motor Home type. Four fields: Max Offer, Est. Trade, RRP, Est. Retail. |
| Strict description template enforcement | AI-generated descriptions in Claude chat vary — sometimes they include dot points, marketing language, or wrong field ordering. Deterministic templates guarantee format compliance every time. | MEDIUM | Template engine per subtype (not LLM text generation). Templates compiled from Schema Registry rules. Output is always structurally identical. |
| No briefing doc overhead | Current workflow requires staff to write a structured briefing prompt for Claude. App eliminates this step entirely — upload photo, select type, done. | LOW | This is the workflow itself — captured as a differentiator because it represents significant time saving vs the baseline. |

### Anti-Features (Deliberately NOT Building in MVP)

Features that seem like good ideas but would bloat the MVP scope, introduce complexity before the core workflow is validated, or contradict the design decisions already made.

| Feature | Why Requested | Why Anti-Feature for MVP | Alternative |
|---------|---------------|--------------------------|-------------|
| Auto-save extracted data without review | Saves a step — why make staff confirm? | A single wrong VIN in Salesforce is a serious data quality problem. Auction records are legally significant. Review is mandatory, not optional. | Always require explicit confirmation before saving. The review step is a feature, not friction. |
| Real-time AI extraction while uploading | Feels faster — start extraction before user completes upload | Creates complex state (what if more photos added after extraction starts?), race conditions, and confusing UX (fields appearing and changing). Adds no real time saving for a 2-second wait. | Extract on explicit "Run Extraction" action. Clear button state shows progress. |
| Multi-asset batch processing | Staff might want to book in several assets at once | Batch processing multiplies error surface — wrong type assignment, mixed photos, review becomes confusing. Each asset is a distinct Salesforce record requiring individual confirmation. | Asset-by-asset workflow. Fast enough for the volume. |
| Salesforce API push | Eliminate copy-paste entirely | Blocked by IT approval process. Coupling the app to Salesforce API before core workflow is validated creates a dependency that could stall the entire project. | Copy-paste is a feature for MVP, not a limitation. Salesforce API integration is v2+ once IT approval is obtained. |
| Free-text AI description generation | Let AI write the description | Slattery's descriptions have strict formatting rules. AI-generated text is non-deterministic and will produce variants that don't comply. Quality control overhead exceeds the time saved. | Deterministic templates per subtype. AI only extracts field values; templates control structure. |
| QLD rego lookup integration | Auto-populate fields from rego number | API dependencies, auth overhead, rate limits, cost. Adds complexity before the core photo→AI→output workflow is proven. | Manual entry in MVP. Add as enrichment in v2. |
| Multi-user role management (valuer/admin) | Team scale requires different access levels | Single authenticated user in MVP. Role complexity is premature until the workflow is validated and team adoption is confirmed. | Simple auth (any logged-in user can do everything). Roles in v2. |
| In-app PPSR check | Verify VIN against PPSR before saving | Jack runs PPSR separately via the PPSR portal. In-app PPSR adds API integration, cost per query, and legal/data considerations. | Staff manually run PPSR; app stores the result as a text field. PPSR lock/integration is v2. |
| Pagination or infinite scroll for asset list | Expected for any data list | The asset list is an internal tool used by 1-3 people. Volume does not justify pagination complexity in MVP. | Simple list view with basic sort. Pagination only when list grows to the point of genuine performance issues. |
| Offline/PWA mode | On-site work might have poor connectivity | Supabase Storage uploads require connectivity. An offline queue adds substantial complexity (conflict resolution, failed upload handling) for an edge case that can be mitigated by download-before-site. | On-site, capture photos to camera roll offline. Upload when connected. This is the current workflow anyway. |
| Duplicate detection | Prevent booking the same asset twice | In MVP, staff manage this operationally. Duplicate detection requires VIN uniqueness constraints and UI handling that adds complexity before the base workflow is stable. | Add as a data quality feature in v1.x once base workflow is running. |

---

## Feature Dependencies

```
[Asset Type Selector]
    └──required by──> [AI Extraction]
                          └──required by──> [Extraction Review Form]
                                                └──required by──> [Salesforce Output Generation]
                                                                      └──required by──> [Copy-Paste Blocks]

[Photo Upload]
    └──required by──> [AI Extraction]

[Client-Side Resize]
    └──enhances──> [Photo Upload] (makes upload viable on mobile data)

[Schema Registry per type]
    └──drives──> [AI Extraction prompt]
    └──drives──> [Extraction Review Form fields]
    └──drives──> [Description Template]
    └──drives──> [Salesforce Output field order and labels]

[Cover Photo + Reorder]
    └──enhances──> [Photo Upload] (adds presentation control)

[AI Confidence Scores]
    └──enhances──> [Extraction Review Form] (highlights fields needing attention)

[Glass's Valuation Block]
    └──conditional on──> [Asset Type Selector = Caravan/Motor Home]

[Auth / Session]
    └──gates──> [All features] (no auth = no access)
```

### Dependency Notes

- **Asset Type Selector must come before AI Extraction:** The type determines the AI prompt (what fields to look for) and the field schema. If type is wrong, extraction produces wrong fields. No way to recover without re-running extraction.
- **Schema Registry is the central dependency:** It must exist before the review form, before the AI prompt builder, before the description template engine, and before the output formatter. This is the first non-trivial implementation to design.
- **Photo Upload is a prerequisite for everything:** Without at least one photo, there is nothing to extract from. The UI should prevent triggering extraction with no photos uploaded.
- **Client-Side Resize enhances Photo Upload:** Not strictly required (extraction would work on large files) but practically required for mobile usability. Without it, a 15MB phone photo will fail or time out on mobile data.
- **Confidence Indicators enhance Review Form:** Optional for launch but significantly improve accuracy — staff know which fields the AI was uncertain about. Medium complexity; worth building in v1 rather than retrofitting.

---

## MVP Definition

### Launch With (v1)

Minimum viable for the tool to replace the Claude chat workflow.

- [ ] **Auth with persistent session** — without this, staff cannot use the tool across the workday
- [ ] **Asset type selector (7 types)** — required before any other step
- [ ] **Photo upload with client-side resize** — the capture step; resize is required for mobile viability
- [ ] **Cover photo + reorder with persist** — low complexity, high value; gives staff control over asset presentation
- [ ] **AI extraction (VIN/PIN/Serial, make, model, year) with confidence scores** — the core value proposition; confidence scores add minimal complexity but significantly improve review accuracy
- [ ] **Editable review form driven by Schema Registry** — mandatory confirmation step; no auto-save path
- [ ] **Copy-paste fields block (Salesforce field order, correct labels)** — primary output; whole reason tool exists
- [ ] **Copy-paste description block (deterministic template per subtype)** — secondary output; strict format rules mean AI text is not viable
- [ ] **Glass's Valuation block (Caravan/Motor Home only)** — low complexity conditional section; completes the output for that asset type
- [ ] **Asset record list view** — staff need to see and return to records in progress

### Add After Validation (v1.x)

Once core workflow is running and staff are using it daily.

- [ ] **Duplicate VIN detection** — add as data quality guard once base workflow is stable; requires VIN uniqueness index + UI warning
- [ ] **PPSR result storage field** — trivial field addition; deferred only because it requires confirming the exact field position in the Salesforce schema
- [ ] **Bulk photo management (delete, re-upload)** — add when staff report friction with photo corrections
- [ ] **Asset status tracking (draft / complete / in Salesforce)** — operational tracking once volume justifies it

### Future Consideration (v2+)

Deferred until core workflow is validated and management approval received.

- [ ] **QLD rego lookup** — API integration, cost per query, auth overhead; not warranted until base workflow is proven
- [ ] **RitchieSpecs / manufacturer spec research** — enrichment pipeline; significant integration complexity
- [ ] **Auction comp pricing (IronPlanet, Pickles, Grays, Mascus)** — market research feature; requires multiple third-party integrations
- [ ] **Salesforce API push** — eliminates copy-paste entirely; blocked on IT approval
- [ ] **Multi-user role management (valuer/admin/management)** — premature until team adoption confirmed
- [ ] **Vendor / consignor records** — consignor management is a separate data domain
- [ ] **Auction management** — sale event creation, lot ordering; entirely separate feature set

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Auth / session persistence | HIGH | LOW | P1 |
| Asset type selector | HIGH | LOW | P1 |
| Photo upload + client-side resize | HIGH | LOW | P1 |
| AI extraction with confidence scores | HIGH | MEDIUM | P1 |
| Editable review form (Schema Registry) | HIGH | MEDIUM | P1 |
| Copy-paste fields block | HIGH | LOW | P1 |
| Copy-paste description block (templates) | HIGH | MEDIUM | P1 |
| Glass's Valuation block | HIGH | LOW | P1 |
| Cover photo + reorder with persist | MEDIUM | MEDIUM | P1 |
| Asset record list view | MEDIUM | LOW | P1 |
| Duplicate VIN detection | MEDIUM | LOW | P2 |
| PPSR result storage field | LOW | LOW | P2 |
| Asset status tracking | MEDIUM | LOW | P2 |
| Bulk photo management | LOW | MEDIUM | P2 |
| QLD rego lookup | HIGH | HIGH | P3 |
| Salesforce API push | HIGH | HIGH | P3 |
| Spec research pipeline | MEDIUM | HIGH | P3 |
| Auction comp pricing | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch — without this, the tool does not replace the Claude chat workflow
- P2: Should have, add in v1.x after core workflow is validated
- P3: Future consideration, v2+

---

## Workflow-Based Analysis

### Photo Management UX

**Table stakes:**
- Multiple file select in a single action (not one-at-a-time)
- Visible thumbnail grid after upload (staff need to confirm the right photos are attached)
- Client-side resize — non-negotiable for mobile-data uploads of phone camera photos
- Delete photo from record

**Differentiating:**
- Drag-to-reorder with cover photo badge — gives staff control over Salesforce listing photo order
- Order persistence across refresh — critical for a tool used across two sessions (on-site capture, desktop review)

**Anti-patterns:**
- Camera-only capture (no file picker): some photos may come from a camera roll taken earlier; `capture="environment"` on mobile still allows file picker fallback
- Mandatory photo before other steps: staff should be able to set asset type first; photo upload should not gate that step

### AI Extraction Review Flow

**Table stakes:**
- Every extracted field is editable — no read-only fields in review
- Review is a mandatory step, never skippable
- Form submits only after staff confirm (explicit "Save" or "Confirm" action)
- Clear visual distinction between AI-populated fields and user-edited fields

**Differentiating:**
- Confidence scores per field — staff attention goes to fields the AI was unsure about, not to rechecking every field
- Extraction status indicators — "Extraction complete", "Partial extraction (2 fields missing)", "Extraction failed" each need distinct UI states
- Photo visible during review — staff should be able to see the build plate photo while reviewing the extracted values without switching views

**Anti-patterns:**
- Auto-triggering re-extraction when user edits a field: creates a loop where user edits are overwritten
- Single-field extraction (one field at a time): structured JSON output in one API call is more reliable and cheaper than iterative extraction
- Showing raw AI JSON output to the user: parse into a form; raw JSON is not a usable review interface

### Form Generation from Schema

**Table stakes:**
- Field order exactly matches Salesforce column order (copy-paste depends on this)
- Field labels exactly match Salesforce column names (copy-paste depends on this)
- Schema is per-asset-type (7 different schemas)
- Optional fields gracefully handled (empty field = excluded from output block, not "null" or "N/A")

**Differentiating:**
- Schema Registry as single source of truth driving AI prompt, review form, and output — changes to field names propagate everywhere from one edit
- Per-subtype description templates (Excavator vs Dozer vs Grader within Earthmoving type) — the current Claude chat workflow requires Jack to remember these distinctions

**Anti-patterns:**
- Hardcoding field lists in multiple places (prompt, form, output formatter) — any schema change requires updates in 3+ places, guaranteed to drift
- Free-form field entry — fields must be constrained to the defined schema; extra fields not in the schema should not appear in the Salesforce output block

### Output / Copy-Paste Patterns

**Table stakes:**
- One-click copy per output section (not select-all-text manual selection)
- Visual copy confirmation (button state change or toast — something to confirm the clipboard write succeeded)
- Output sections clearly labelled (Fields block, Description block, Glass's Valuation block)
- Output formatted as plain text, not HTML (Salesforce accepts plain text paste)

**Differentiating:**
- Three distinct copy sections (Fields, Description, Glass's) — lets staff paste each section into the correct Salesforce area separately rather than one monolithic block
- Copy button remains active after copy (allows re-copy if staff need to paste again)
- Output preview inline with the form (no separate "output" screen; staff can see what they're copying)

**Anti-patterns:**
- Single "Copy All" button: Salesforce has separate fields for the fields block and description. Staff need to paste them in different places.
- Formatted/rich text output: Salesforce text fields accept plain text; rich text (bold, bullets) will break the paste or produce visible formatting characters
- Requiring a separate "generate output" step after confirm: output should be generated at confirm time and visible immediately

---

## Competitor Feature Analysis

This is an internal tool — no direct competitors. The baseline is the current Claude chat workflow. The relevant comparison is: does this feature make the tool better than opening Claude.ai and pasting a briefing doc?

| Feature | Current Claude Chat Workflow | This App |
|---------|------------------------------|----------|
| Photo management | Upload to Claude chat, no persistence, no reorder | Persistent photo storage, reorder, cover photo |
| Asset type schema | Jack must know which fields apply to which type | Schema Registry enforces correct fields automatically |
| AI extraction | Implicit in briefing prompt, no confidence signal | Structured JSON output, confidence per field, editable review |
| Description formatting | Varies — Claude sometimes adds dot points or marketing language | Deterministic templates guarantee format compliance |
| Output copy | Select text in Claude chat manually | One-click copy per output section with confirmation |
| Record persistence | None — gone when tab closes | Persistent Supabase record, accessible on any device |
| Session continuity | Start over each asset | Asset list, resume from where left off |

---

## Sources

- Project context: `/home/jack/projects/prestige_assets/.planning/PROJECT.md` (HIGH confidence — source of truth for requirements)
- Domain analysis: Internal tool workflow analysis (HIGH confidence — replacing a known, described workflow)
- Salesforce field schemas: Documented in PROJECT.md (HIGH confidence — specific field names provided)
- UX patterns: Assessment based on established web app patterns for mobile file upload, AI review flows, and clipboard API (MEDIUM confidence — no external source verification; well-established patterns)

---
*Feature research for: Prestige Assets — Slattery Auctions Book-In App*
*Researched: 2026-03-17*
