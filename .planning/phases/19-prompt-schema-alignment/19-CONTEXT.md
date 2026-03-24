# Phase 19: Prompt-Schema Alignment - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix semantic inference gaps between schema keys and DESCRIPTION_SYSTEM_PROMPT headings. Three prompt gaps to close: add explicit `PRIVATE` and `RECREATIONAL` marine sections, fix `WASHING PLANT` heading to match `washing` schema key. One confirming test to add: EWP forklift key routes to forklift-mounted section. Two VALIDATION.md files to sign off. One SUMMARY.md frontmatter fix.

No new asset types, no schema key renames, no new features.

</domain>

<decisions>
## Implementation Decisions

### `washing` key/heading alignment
- **Change the prompt heading, not the schema key**: rename `WASHING PLANT` → `WASHING` in `DESCRIPTION_SYSTEM_PROMPT`
- Rationale: schema rename risks existing saved records; heading rename is the minimal safe fix and aligns exactly with the schema key (`washing`) and label (`'Washing'`)
- No schema migration required

### Marine `private` and `recreational` sections
- **Same template content, two explicit headings**: add both `PRIVATE` and `RECREATIONAL` as dedicated sections using the MARINE (RECREATIONAL BOAT) structure
- Rationale: in Australian auction context both are non-commercial recreational vessels — same buyer-relevant specs (Year, Make, Model, hull type, engine/s, hours, length, key features)
- The existing `MARINE (RECREATIONAL BOAT)` section can remain as the general fallback; `PRIVATE` and `RECREATIONAL` each get their own heading so GPT-4o does not need to infer
- Template structure mirrors existing MARINE (RECREATIONAL BOAT) template — no new fields invented

### EWP routing test
- Add/update a test that passes `('forklift', 'ewp')` and asserts the response contains `EWP (FORKLIFT-MOUNTED)` (not the truck EWP heading)
- Phase 18 corrected the key — this test is the confirming coverage

### Nyquist VALIDATION.md sign-off
- **Retroactive verification then mark compliant**: executor checks the full test suite is green, then:
  - Updates all task rows in 16-VALIDATION.md to `✅ green`
  - Updates all task rows in 17-VALIDATION.md to `✅ green`
  - Sets `nyquist_compliant: true` and `wave_0_complete: true` in both frontmatter blocks
  - Sets `status: approved` in both frontmatter blocks
- Rationale: phases 16 and 17 are functionally complete; VALIDATION.md files were never updated during execution

### `16-02-SUMMARY.md` frontmatter fix
- Add `requirements_completed: [SUBTYPE-04, SUBTYPE-05, SUBTYPE-06, SUBTYPE-08]` to the frontmatter of `16-02-SUMMARY.md`
- This field is missing; the decisions list already correctly documents the work done

### Claude's Discretion
- Exact wording of the `PRIVATE` and `RECREATIONAL` template body (match existing MARINE (RECREATIONAL BOAT) structure)
- Whether to keep or consolidate `MARINE (RECREATIONAL BOAT)` as fallback vs point to `RECREATIONAL`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Description system
- `src/app/api/describe/route.ts` — `DESCRIPTION_SYSTEM_PROMPT` (contains `WASHING PLANT` heading at ~line 584, `EWP (ELEVATED WORK PLATFORM)` truck section at ~line 158, `EWP (FORKLIFT-MOUNTED)` at ~line 734, `MARINE (RECREATIONAL BOAT)` at ~line 800; no `PRIVATE` or `RECREATIONAL` sections exist)

### Schema keys to align against
- `src/lib/schema-registry/schemas/earthmoving.ts` — `washing` key, label `'Washing'` (line 24)
- `src/lib/schema-registry/schemas/marine.ts` — verify `private` and `recreational` keys exist

### Test file
- `src/__tests__/describe-route.test.ts` — line ~1033: `WASHING PLANT` assertion (update to `WASHING`); line ~1179: `private` key test; add EWP forklift routing test

### Nyquist docs to update
- `.planning/phases/16-subtype-schema-alignment/16-VALIDATION.md` — set `nyquist_compliant: true`, update task rows
- `.planning/phases/17-description-template-coverage/17-VALIDATION.md` — set `nyquist_compliant: true`, update task rows
- `.planning/phases/16-subtype-schema-alignment/16-02-SUMMARY.md` — add `requirements_completed` field to frontmatter

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getSystemContentP17` helper in describe-route.test.ts — used by all Phase 17/18 tests; Phase 19 tests should reuse it
- `normalizeFooter()` in describe/route.ts — leave untouched

### Established Patterns
- Prompt headings are ALL_CAPS; GPT-4o matches subtype key to nearest heading by name — exact match is required (Phase 18-01 decision)
- Template section format: `HEADING\nLine 1\n...\nSold As Is, Untested & Unregistered.`
- Test pattern: `const s = await getSystemContentP17('asset_type', 'schema_key'); expect(s).toContain('HEADING')`

### Integration Points
- All changes are to `DESCRIPTION_SYSTEM_PROMPT` (string constant) and `describe-route.test.ts` (test assertions)
- VALIDATION.md files are standalone docs — no code imports them

</code_context>

<specifics>
## Specific Ideas

No specific requirements — decisions are clear from success criteria and prior phase decisions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 19-prompt-schema-alignment*
*Context gathered: 2026-03-24*
