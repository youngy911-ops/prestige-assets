# Phase 10: Description Verbatim Fidelity - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix AI-generated descriptions so that specific values staff enter in inspection notes appear verbatim in the output — not paraphrased, not interpreted, not converted. Example: `48" sleeper cab` in notes must appear as `48" sleeper cab` in the description, not `sleeper cab`.

Phase covers two things: (1) system prompt instruction change, (2) user prompt restructuring in the describe route. No UI changes. No schema changes.

</domain>

<decisions>
## Implementation Decisions

### Fix approach
- **Both system prompt rule AND user prompt restructuring** — belt-and-suspenders, most reliable
- System prompt: add a bullet under the existing `UNIVERSAL RULES` block:
  - `Values and measurements from inspection notes must appear verbatim in the description — do not paraphrase, convert units, or interpret. If notes say '48" sleeper cab', write '48" sleeper cab'`
- User prompt: restructure `buildDescriptionUserPrompt` in `describe/route.ts` to split inspection_notes into two clearly-labelled blocks:
  1. `Staff-provided values (use verbatim):` — contains the parsed key:value structured lines (VIN, Suspension, Odometer etc.)
  2. `Inspection notes:` — contains the freeform `Notes: ...` content only

### Parser reuse
- Reuse `parseStructuredFields` from the extract route (not a new inline parser)
- `parseStructuredFields` already splits `key: value` lines from the `Notes: <freeform>` block — import and apply in describe route
- Keeps parsing consistent across extract and describe flows

### Verbatim block coverage
- All key:value structured lines from inspection_notes go into the `Staff-provided values (use verbatim):` block — including VIN, Suspension, Odometer, Hourmeter etc.
- Belt-and-suspenders: these values are already in `asset.fields` (post-extraction confirmed fields) but repeating them in the verbatim block reinforces to GPT that they must not be altered
- Freeform notes (everything after `Notes:`) remain in the `Inspection notes:` block

### Claude's Discretion
- Exact wording of the new UNIVERSAL RULES bullet (as long as it covers: don't paraphrase, don't convert units, use exact values from notes)
- Whether to skip the `Staff-provided values` block entirely if inspection_notes has no key:value lines (graceful fallback)

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### Requirements traceability
- `.planning/REQUIREMENTS.md` — DESCR-01

### Key files to modify
- `src/app/api/describe/route.ts` — add verbatim UNIVERSAL RULE to `DESCRIPTION_SYSTEM_PROMPT`; restructure `buildDescriptionUserPrompt` to split inspection_notes into two labelled blocks using `parseStructuredFields`

### Key files to read
- `src/app/api/extract/route.ts` — contains `parseStructuredFields` implementation to import/reuse

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseStructuredFields` in `src/app/api/extract/route.ts` — already parses `key: value\n` lines out of inspection_notes and returns `{ structured: Record<string, string>, notes: string }` (or similar); must confirm exact export/signature before importing

### Established Patterns
- `DESCRIPTION_SYSTEM_PROMPT` in `describe/route.ts` — has a `UNIVERSAL RULES:` block with bullet points; new verbatim rule goes here
- `buildDescriptionUserPrompt` in `describe/route.ts` — constructs the user message; currently appends raw `Inspection notes: ${asset.inspection_notes}`; Phase 10 splits this into two blocks
- Inspection notes serialisation: `key: value\nkey: value\nNotes: <freeform>` (established in Phase 9; InspectionNotesSection.tsx)

### Integration Points
- `describe/route.ts:189-207` — `buildDescriptionUserPrompt` function is the only place that needs restructuring
- `describe/route.ts:8-187` — `DESCRIPTION_SYSTEM_PROMPT` constant; add bullet under `UNIVERSAL RULES:` block around line 24

</code_context>

<specifics>
## Specific Ideas

- "If notes say '48\" sleeper cab', write '48\" sleeper cab'" — this exact example should probably appear in the system prompt rule as illustration
- The problem is specifically paraphrasing (e.g., dropping the measurement), not just wrong values — the instruction should call out paraphrasing explicitly

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-description-verbatim-fidelity*
*Context gathered: 2026-03-21*
