# Phase 14: Description Quality - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add description templates for all truck subtypes and earthmoving subtypes; enforce the "Sold As Is, Untested & Unregistered." footer across all types; remove "TBC" from all generated descriptions. No new fields, no new asset types, no schema changes.

</domain>

<decisions>
## Implementation Decisions

### Footer enforcement (DESC-01)
- **Programmatic strip-and-reappend** in the route handler (`src/app/api/describe/route.ts`) after `generateText` returns but before persisting to DB
- Always strip any existing footer-looking line (any variant), then append the correct footer for the asset type
- This handles both missing footers AND wrong-variant footers (e.g. AI writes "Untested." for a truck)
- Footer logic by asset type:
  - `asset_type === 'general_goods'` → `"Sold As Is, Untested."`
  - All other types (truck, trailer, earthmoving, agriculture, forklift, caravan, marine) → `"Sold As Is, Untested & Unregistered."`

### TBC → estimate using model knowledge (DESC-01, SC4)
- Remove the "replace with TBC" rule from `DESCRIPTION_SYSTEM_PROMPT`
- Replace with: AI should estimate/infer plausible values using its training knowledge of that make/model/year and write them as confirmed (no qualifier like "approx." or "typically")
- **Exception — identifiers**: VIN, serial number, chassis number, registration — these must only appear if confirmed from photos or inspection notes. Never infer. Omit if not visible.
- Rationale: AI already does this correctly for HP via the reference table in the system prompt — extend the same behaviour to all spec fields

### New truck body templates (TRUCK-02)
- **Claude's discretion** — write templates for all 9 remaining subtypes based on domain knowledge:
  - Flat Deck, Cab Chassis, Beavertail, Tilt Tray, Vacuum, Concrete Pump, Concrete Agitator, EWP, Refrigerated Pantech
- The existing "RIGID TRUCK / PANTECH / CURTAINSIDER / TAUTLINER / VAN" template can be retained as a fallback group; the above subtypes get their own named templates so GPT-4o selects the correct one
- EWP, Vacuum, Concrete Pump, and Concrete Agitator are distinctly specialised — their templates must capture the body-specific details that matter for buyers of that equipment

### New earthmoving templates (DESC-02)
- **Claude's discretion** — write templates for the 4 subtypes without templates:
  - Compactor, Dump Truck, Trencher, Crawler Tractor
- Existing templates (Excavator, Dozer, Grader, Skid Steer Loader, Wheel Loader, Telehandler, Backhoe Loader) are kept as-is
- Note: the DOZER template in the system prompt must be updated to match the renamed `bulldozer` subtype key (Phase 13 renamed `dozer` → `bulldozer`)

### Claude's Discretion
- Exact wording of each new truck and earthmoving description template
- Whether to rename the RIGID/PANTECH/CURTAINSIDER group template or keep it as a fallback
- Implementation of the `normalizeFooter()` helper (function name, placement in route handler)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — TRUCK-02, DESC-01, DESC-02 definitions and acceptance criteria

### Description system
- `src/app/api/describe/route.ts` — `DESCRIPTION_SYSTEM_PROMPT` (the full prompt), `buildDescriptionUserPrompt()`, and the `generateText` → persist pipeline. All three areas need changes for this phase.

### Truck and earthmoving subtypes (post Phase 13)
- `src/lib/schema-registry/schemas/truck.ts` — final 15-subtype list (including `other`) — use to verify template coverage
- `src/lib/schema-registry/schemas/earthmoving.ts` — final 12-subtype list (including `bulldozer`, `crawler_tractor`, `other`) — use to verify template coverage

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DESCRIPTION_SYSTEM_PROMPT` in `describe/route.ts` — single string constant; add new templates as named sections in the same pattern as existing ones
- `generateText` pipeline in `describe/route.ts` — footer normalisation runs after `generateText` returns `{ text }`, before the `supabase.update()` call

### Established Patterns
- Template sections are `ALL_CAPS` headings (e.g. `PRIME MOVER`, `EXCAVATOR`) — GPT-4o matches the asset subtype to the nearest heading
- Each template ends with the footer line as its last line — the programmatic guard is a safety net, not a replacement for the template instruction
- The HP reference table in the system prompt already demonstrates the "estimate from model knowledge, no TBC" pattern for one field — extend this philosophy to all fields via a prompt rule change

### Integration Points
- Footer normalisation: inject between `const { text } = await generateText(...)` and `await supabase.from('assets').update(...)` — approximately line 120 in the route handler
- New templates: append to `DESCRIPTION_SYSTEM_PROMPT` string in the same file — no separate files needed

</code_context>

<specifics>
## Specific Ideas

- Footer logic is purely by `asset_type` (not subtype) — one condition covers all general_goods subtypes (Tools & Equipment, Attachments, Workshop Equipment, etc.)
- The "estimate, no qualifier" rule mirrors the existing HP table behaviour — the system prompt should frame it the same way: "use your knowledge of that make/model/year"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-description-quality*
*Context gathered: 2026-03-22*
