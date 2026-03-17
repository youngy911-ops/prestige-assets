# Pitfalls Research

**Domain:** AI-powered asset book-in tool (web, mobile browser capture, Supabase, Next.js App Router)
**Researched:** 2026-03-17
**Confidence:** MEDIUM (training knowledge — Brave Search unavailable during session; well-established patterns, low staleness risk)

---

## Critical Pitfalls

### Pitfall 1: EXIF Orientation — Photos Arrive Rotated

**What goes wrong:**
Mobile cameras encode rotation in EXIF data rather than rotating pixels. The `<img>` tag on most browsers respects EXIF and displays correctly, but when you draw that image onto a `<canvas>` for client-side resize, canvas ignores EXIF and the result is sideways or upside-down. The resized/uploaded image then appears rotated to the AI model, and also to users in the review step. Build plates become unreadable.

**Why it happens:**
Developers test on desktop with pre-rotated images or with iOS Safari (which auto-corrects), then miss the Android case where EXIF is not auto-applied. The canvas resize step strips EXIF metadata entirely unless explicitly preserved.

**How to avoid:**
1. Before drawing to canvas, read the EXIF `Orientation` tag using a library (`exifr` is lightweight, ESM-friendly, browser-safe).
2. Apply a CSS transform or canvas pre-rotation to correct orientation before the resize draw.
3. Strip EXIF after rotation correction (or use `exifr` to re-embed only non-sensitive EXIF if needed).
4. Test explicitly on Android Chrome with a freshly captured photo, not a photo from a gallery that may already be corrected.

**Warning signs:**
- AI extraction returns obviously wrong data (upside-down text) on some photos but not others.
- Photos look correct in browser `<img>` preview but rotated in Supabase Storage viewer.
- Bug only reproducible on Android, not iOS Safari or desktop.

**Phase to address:** Phase 1 (photo capture and upload). Validate orientation correction before AI integration is connected.

---

### Pitfall 2: Client-Side Resize Degrades Image Quality for OCR

**What goes wrong:**
Aggressive downscaling (e.g., a max dimension of 800px) destroys fine characters on build plates. Industrial build plates have 8–10pt stamped or engraved text. At 800px wide, the characters may be 3–5px tall — unreadable by vision models. The developer sees "it compressed fine" but AI accuracy drops from ~90% to ~60%.

**Why it happens:**
"2MP" is stated as the target, but developers implement it as a max-short-side or max-long-side constraint without accounting for aspect ratio. A phone photo at 4032×3024 (12MP) at 2MP max means ~2000×1500 — fine. But if the constraint is accidentally set to max 1024px on the long side, the image becomes too small.

**How to avoid:**
- Target 2MP as a pixel count constraint (`width * height <= 2_000_000`), not a linear dimension constraint.
- For build plate photos specifically, do not downsample further than 2MP under any path.
- After resize, verify the output dimensions in the client before upload and log them — make this visible during development.
- Use `quality: 0.85` for JPEG encode, not lower; WebP at 0.80 is fine.

**Warning signs:**
- AI extraction accuracy is lower for photos taken on cheaper Android phones (lower base resolution) versus iPhone 15.
- Characters like `0`/`O`, `1`/`I`, `8`/`B` are frequently confused in extracted output.
- Uploaded images in Supabase appear noticeably blurry at 100% zoom.

**Phase to address:** Phase 1 (photo upload). Prove resize pipeline before AI is integrated.

---

### Pitfall 3: AI Vision Returns Structurally Valid but Semantically Wrong Output

**What goes wrong:**
OpenAI `gpt-4o` with `response_format: { type: "json_schema" }` (or Anthropic's tool use) guarantees the JSON structure is valid but does not guarantee the field values are correct. Common failure modes:
- Year extracted as `"2024"` when the build plate shows `"2014"` (digit transposition).
- VIN/serial numbers with ambiguous characters: `O` vs `0`, `I` vs `1`, `B` vs `8`, `Q` vs `O`.
- Model field populated with the engine series rather than the vehicle model.
- Fields hallucinated entirely when build plate is partially obscured (model returns a plausible value rather than `null`).

**Why it happens:**
Developers treat structured output as accuracy validation, not just schema validation. The AI will return a well-formed JSON object even when it is guessing. Without a confidence mechanism, there is no signal to the user that a field is uncertain.

**How to avoid:**
1. Include a `confidence` field in the extraction schema: `"low" | "medium" | "high"` per extracted field (or a single overall confidence score).
2. Surface low-confidence fields visually in the review step (highlight them differently, pre-focus the cursor there).
3. Mandate the review step — never allow auto-save. The user must touch every low-confidence field.
4. Prompt engineering: explicitly instruct the model to return `null` for any field it cannot read clearly, rather than inferring.
5. Test with intentionally bad photos: partial occlusion, glare, angle, dirty plates.

**Warning signs:**
- AI consistently returns all fields populated, even for blurry test photos.
- Users complain that "the app got the year wrong" without understanding they were supposed to verify it.
- No `null` values ever appear in extraction results.

**Phase to address:** Phase 2 (AI extraction). Build confidence signalling into the initial extraction schema design — retrofitting it is much harder.

---

### Pitfall 4: Structured Output Schema Drift — AI Output Mismatches Salesforce Schema

**What goes wrong:**
The AI extraction schema and the Salesforce field schema are maintained separately and diverge. Example: AI extracts `engine_number` but the Salesforce schema expects `Engine Number`. The copy-paste output then has wrong labels, wrong ordering, or missing fields. Users start manually correcting output, defeating the purpose.

**Why it happens:**
The extraction schema is designed for AI convenience (snake_case keys, minimal nesting), while Salesforce labels use title case with spaces and specific ordering per asset type. There is a translation layer needed but developers either skip it or maintain it in two places.

**How to avoid:**
- Define a single Schema Registry per asset type. Each entry has: `aiKey` (what the AI returns), `salesforceLabel` (exact copy-paste label), `salesforceOrder` (integer, for sorted output), `required` (boolean).
- The AI extraction prompt references the `aiKey` list only.
- The copy-paste generator iterates fields in `salesforceOrder` and uses `salesforceLabel` exactly.
- Never hardcode Salesforce labels in two places — Registry is the single source of truth.

**Warning signs:**
- Salesforce output has inconsistent label capitalisation across asset types.
- A field change in the Salesforce form requires hunting for it in multiple files.
- "Extras" or "Tyre Size" appears in wrong position in output.

**Phase to address:** Phase 1 (schema registry design) and Phase 3 (copy-paste output). The registry must exist before Phase 2 AI work begins.

---

### Pitfall 5: Copy-Paste Output Has Invisible Differences from Salesforce Expectation

**What goes wrong:**
The generated text looks correct visually but Salesforce users report "it doesn't paste right." Common causes:
- Trailing spaces on lines.
- Windows-style `\r\n` line endings vs Unix `\n`.
- Em dash (`—`) used where Salesforce expects a hyphen (`-`).
- Non-breaking spaces (`\u00A0`) introduced by string interpolation.
- Description block has a blank line where there should be none, or vice versa.
- Footer "Sold As Is, Untested & Unregistered." has the period missing on some paths.

**Why it happens:**
Developers test paste into a plain text editor (which tolerates differences) rather than directly into Salesforce's multi-line text fields, which are strict about whitespace. String template literals with interpolated values can introduce unexpected whitespace.

**How to avoid:**
- Write the description generator as pure string concatenation with explicit `\n`, never template literal multi-line indentation.
- Add a normalisation pass before rendering: trim each line, replace `\r\n` → `\n`, replace `&amp;` → `&`, assert footer ends with `.`.
- Write snapshot tests for every asset type's description output — test the exact string, not just structure.
- Paste into Salesforce's actual UI (or a screenshot of it) as the acceptance criteria, not a textarea on localhost.

**Warning signs:**
- Description preview in app looks correct but user reports wrong spacing after pasting.
- Footer footer appears inconsistently — present in some asset types, missing in others.
- "Sold As Is" is sometimes "Sold as is" (wrong case).

**Phase to address:** Phase 3 (copy-paste output generation). Treat this as a string correctness problem, not a formatting problem.

---

### Pitfall 6: Next.js App Router — AI API Keys Leaking to Client Bundle

**What goes wrong:**
In Next.js App Router, a Server Component that imports an API client (OpenAI SDK, Anthropic SDK) will keep those imports server-side correctly. However, if the developer accidentally marks the component or the calling module with `"use client"`, or imports the AI utility from a Client Component, the entire OpenAI/Anthropic SDK is bundled into the browser JavaScript. The API key (`OPENAI_API_KEY`) is then either undefined (if prefixed with `NEXT_PUBLIC_`) or exposed in the bundle.

**Why it happens:**
The boundary between Server and Client Components is implicit and can break silently. A developer adds interactivity to a component, adds `"use client"`, and doesn't realise the AI utility imported in that file now runs in the browser.

**How to avoid:**
1. Place all AI logic in `/app/api/` route handlers (not Server Components directly). This makes the server boundary explicit and hard to accidentally break.
2. Never use `NEXT_PUBLIC_` prefix for AI keys — name them `OPENAI_API_KEY` (no public prefix). Next.js will refuse to expose these to the client.
3. Add a `server-only` import at the top of any file containing AI logic: `import 'server-only'`. This throws a build error if the module is accidentally imported into a Client Component.
4. Run `NEXT_TELEMETRY_DISABLED=1 next build` and inspect the bundle for AI SDK strings as a pre-ship check.

**Warning signs:**
- Network tab in DevTools shows AI API calls coming from the browser (not from `/api/` routes).
- `process.env.OPENAI_API_KEY` returns `undefined` at runtime but you didn't expect that.
- Build output size is unexpectedly large (AI SDK bundled in).

**Phase to address:** Phase 1 (project setup). Establish the pattern before any AI code is written.

---

### Pitfall 7: Supabase Storage Presigned URLs — Uploading Before the Record Exists

**What goes wrong:**
The intended flow is: create asset record → get presigned upload URL → upload photo → confirm. If the developer uploads the photo first (to get a URL to store), then creates the record, any failure between upload and record creation leaves orphaned files in storage with no reference. Over time this creates unbounded storage growth and makes cleanup impossible.

**Why it happens:**
Presigned URL generation is simpler to implement before a record exists (no foreign key needed). Developers take this shortcut and never implement cleanup.

**How to avoid:**
- Create the asset record first (even as a draft with `status: 'draft'`), get its UUID, then generate the presigned URL using that UUID in the storage path (`assets/{record_id}/{filename}`).
- Use Supabase Storage path pattern `assets/{asset_id}/` so orphan detection is trivial: any file not referenced by an asset record is orphaned.
- Implement a lightweight cleanup: on app boot or on a schedule, delete files in storage that have no matching `asset_photos` row. In MVP this can be manual/deferred, but the path structure must enable it from day one.

**Warning signs:**
- Storage bucket grows even when test records are deleted.
- Files in storage have UUIDs that don't match any asset record.
- Upload cancellation (user closes browser mid-upload) leaves files that accumulate.

**Phase to address:** Phase 1 (Supabase setup and upload flow).

---

### Pitfall 8: Dynamic Form — Schema-Driven Field Rendering Creates Uncontrolled Re-Render Storms

**What goes wrong:**
When form fields are rendered from a schema array using `schema.map(field => <Input key={field.id} .../>)`, React reconciliation works correctly. But if the schema array is reconstructed on every render (e.g., defined inline in the component body, or derived from a selector without memoisation), every keystroke causes every field to unmount and remount. On a 35-field Truck form, this is a severe performance problem and causes focus to jump out of the active input.

**Why it happens:**
Developers define the schema inline: `const fields = getSchemaForType(assetType)` inside the render function. If `getSchemaForType` returns a new array reference each call, React sees all fields as changed.

**How to avoid:**
- Define schema registries as static constants outside component scope.
- If asset type selection drives the schema, derive it with `useMemo(() => getSchemaForType(assetType), [assetType])` — schema reference only changes when type changes.
- Use React Hook Form with a flat `defaultValues` object keyed by field ID; let RHF manage the field state rather than React state.
- Keep the rendered form stable: never use array index as key; use `field.id`.

**Warning signs:**
- Typing in a field causes all other fields to flash or re-render (visible with React DevTools "Highlight updates").
- Changing asset type is slow (hundreds of DOM operations instead of tens).
- Input loses focus after every character.

**Phase to address:** Phase 2 (dynamic form rendering). Validate form performance with the full 35-field Truck schema before building review UX on top of it.

---

### Pitfall 9: Description Block — AI Temptation / Template Drift

**What goes wrong:**
The description block must follow strict per-type rules (field ordering, no dot points, no marketing language, specific footer). Developers are tempted to let the AI generate the description because "it's just text." This produces descriptions that look good but violate the formatting rules — dot points creep in, the footer is missing, or the field order is wrong for that asset subtype (Excavator vs Dozer ordering differs).

**Why it happens:**
AI-generated text is faster to prototype. The strict formatting requirement only becomes apparent after the first real Salesforce paste, when Jack or the team rejects the output.

**How to avoid:**
- This is already a key decision in PROJECT.md: descriptions use deterministic templates only.
- Implement description generation as a pure function: `generateDescription(assetType: AssetType, fields: Record<string, string>): string`.
- The function must be deterministic — same input always produces identical output.
- Write exhaustive snapshot tests for every asset type (Truck, Trailer, Excavator, Dozer, Forklift, Caravan, Agriculture, General Goods).
- If a field is missing/null, the line for that field is omitted entirely (not rendered as "Unknown").

**Warning signs:**
- Description output varies between two identical input sets (non-deterministic).
- "Sold As Is, Untested & Unregistered." footer is missing on any asset type.
- Dot points appear in any description output.
- Earthmoving descriptions for Excavator and Dozer use the same field ordering.

**Phase to address:** Phase 3 (output generation). Do not use AI for description text at any phase.

---

### Pitfall 10: Review Step Treated as Optional by Users

**What goes wrong:**
The AI extraction review step is built but users skip through it quickly without verifying fields, then complain that "the app got it wrong" when incorrect data ends up in Salesforce. The UX inadvertently encourages skipping: a "Looks good, continue" button is prominent, and there is no visual emphasis on which fields the AI is uncertain about.

**Why it happens:**
The developer validates that the review step exists and considers the requirement met. But the UX design does not make the cost of skipping clear, and low-confidence fields look the same as high-confidence ones.

**How to avoid:**
- Low-confidence fields (returned as `confidence: "low"` from extraction schema) must be visually distinct: yellow border, warning icon, auto-focused on page load.
- The confirmation button should show a count: "Confirm (3 fields need review)" if any field is unverified.
- Fields the user has explicitly touched/edited are marked as verified; fields still at AI-extracted values are marked as unverified if confidence is low.
- Do not add a "skip review" path at any point in MVP.

**Warning signs:**
- In user testing, participants complete the review step in under 5 seconds on a 35-field form.
- No one ever edits a field during review.
- The AI confidence field is included in the schema but not surfaced in the UI.

**Phase to address:** Phase 2 (review UX, concurrent with AI extraction).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip `server-only` imports on AI utilities | Faster dev startup | API key exposure risk, silent client-side AI calls | Never |
| Inline schema arrays inside components | Less file structure | Re-render storms on 35-field forms | Never |
| AI generates description text | Faster to prototype | Non-deterministic output, formatting violations, user rejection | Never |
| Upload photo before creating record | Simpler upload flow | Orphaned storage files, cleanup impossible | Never |
| Skip EXIF orientation correction | Works on iOS Safari | Rotated images on Android, broken AI extraction | Never |
| Single confidence flag for whole extraction | Simpler schema | No field-level guidance in review UX, users miss bad fields | MVP only if field-level is too slow to build |
| Hardcode Salesforce labels in output generator | Faster to ship | Labels duplicated in two places, diverge silently | Never |
| No snapshot tests for description output | Faster Phase 3 | First Salesforce paste reveals format violations | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenAI vision + structured output | Send base64 at full resolution to reduce code complexity | Resize to 2MP client-side first; base64 at full res is ~5-15MB per image, hitting token limits and cost ceiling |
| OpenAI structured output | Trust JSON validity as accuracy signal | Add per-field confidence to schema; treat valid JSON as schema conformance only |
| Supabase Storage | Use public bucket for "internal tool" | Use private bucket + presigned URLs; asset data is commercially sensitive (ISO 27001 context) |
| Supabase Storage | Generate presigned URL before record exists | Create record first, use record UUID in storage path |
| Supabase Auth | Use `supabase.auth.getUser()` in Server Components directly | Use `createServerClient` from `@supabase/ssr`; the standard client is not SSR-safe |
| Next.js App Router + Supabase | Store Supabase session in localStorage | Use cookie-based session via `@supabase/ssr`; localStorage is not accessible in Server Components |
| Next.js App Router | Call AI APIs from Client Components with Server Actions | Use `/app/api/` route handlers for AI calls; Server Actions are fine for mutations but route handlers are clearer for request/response AI flows |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full-resolution base64 to AI API | Slow extraction, high API cost, occasional 413 errors | Client-side resize to 2MP before encoding | First large photo upload |
| Reconstruct schema array each render | Input focus lost on keystroke, sluggish 35-field form | `useMemo` for schema derivation, static constants for registries | Any form with >10 fields |
| Re-fetching all asset photos on each reorder | Reorder drag-and-drop feels laggy | Optimistic UI update first, persist to Supabase in background | >3 photos per asset |
| AI call on every photo upload (not just build plate) | Unnecessary API cost, slow UX for non-build-plate photos | Only trigger AI extraction explicitly (user action: "Extract from this photo") | First multi-photo upload test |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `NEXT_PUBLIC_OPENAI_API_KEY` or similar | API key exposed in browser bundle, billed usage by anyone | Name key `OPENAI_API_KEY` (no NEXT_PUBLIC prefix), add `import 'server-only'` to AI utility |
| Public Supabase Storage bucket for asset photos | Asset photos (commercially sensitive build plates) publicly accessible by URL | Use private bucket; generate presigned URLs server-side for display |
| Supabase Row Level Security disabled for rapid MVP | All authenticated users can read/write all records | Enable RLS from day one with simple policy: `auth.uid() IS NOT NULL`; costs nothing to add early |
| Storing AI API keys in `.env.local` committed to git | Credential exposure | `.env.local` in `.gitignore` (Next.js default), verify before first commit |
| No rate limiting on AI extraction endpoint | API cost abuse if shared link is discovered | Supabase auth middleware on the route; only authenticated users can trigger AI calls |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during AI extraction | User thinks app is broken, taps button multiple times, triggers duplicate API calls | Disable extraction button immediately on click, show skeleton/spinner in review fields |
| Copy button copies to clipboard silently | User not sure if copy worked, pastes twice in Salesforce | Flash a "Copied!" confirmation state on the button for 2 seconds |
| All review fields editable but none highlighted as uncertain | User skips verification of wrong AI values | Highlight low-confidence fields in yellow; auto-scroll to first low-confidence field |
| Photo picker opens camera directly on some Android devices | User can't select existing build plate photo from gallery | Use `accept="image/*"` without `capture` attribute; let the OS show the picker sheet |
| Drag-to-reorder broken on mobile (touch events) | User cannot reorder photos on-site (the primary use location) | Use a library with touch support (dnd-kit has touch support); test on actual phone, not browser emulator |
| Asset type selector is a long dropdown | User scrolling through 7 types on a small screen is slow | Use a visually distinct type picker (icon grid or large button list) — fast to tap on mobile |

---

## "Looks Done But Isn't" Checklist

- [ ] **EXIF orientation:** Photo looks correct in browser `<img>` preview — verify the resized canvas output is also correctly oriented by uploading and viewing in Supabase Storage viewer.
- [ ] **AI extraction:** Returns valid JSON for all test photos — verify confidence fields are populated and that blurry/partial photos return `null` values, not hallucinated guesses.
- [ ] **Description footer:** All asset type descriptions end with "Sold As Is, Untested & Unregistered." (exact capitalisation, period included) — run snapshot tests, not visual inspection.
- [ ] **Salesforce field ordering:** Copy-paste output looks correct visually — verify field order against the actual Salesforce form by side-by-side comparison with a screenshot of the real form, for every asset type.
- [ ] **Copy to clipboard:** Clipboard copy works on localhost — verify on mobile browser (iOS Safari clipboard requires a user gesture in the event handler, not deferred in a Promise chain).
- [ ] **Presigned URL auth:** Photos load in the review UI — verify they require authentication by opening the URL in an incognito tab; they should return 403.
- [ ] **Session persistence:** User stays logged in — verify on mobile browser after locking and unlocking the phone (session must survive background tab suspension).
- [ ] **Caravan Glass's Valuation block:** Third copyable block appears for Caravan/Motor Home type — verify it is absent for all other asset types.
- [ ] **Server-only AI calls:** AI extraction works — verify no AI SDK code appears in browser network requests by checking the DevTools Network tab for direct OpenAI/Anthropic calls.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| EXIF orientation shipped without fix | MEDIUM | Add `exifr` library, wrap canvas draw in orientation correction, redeploy; existing uploaded photos may need re-upload |
| API key exposed in client bundle | HIGH | Rotate key immediately, audit usage logs for abuse, refactor AI calls to server-only, redeploy |
| Schema registry diverged from Salesforce | MEDIUM | Audit all asset types against current Salesforce forms, update registry, run snapshot tests, release |
| Orphaned storage files (no cleanup implemented) | LOW | Query storage bucket, cross-reference against asset_photos table, delete orphans; implement cleanup path going forward |
| AI descriptions shipped with non-deterministic output | HIGH | Replace with deterministic template generator; all prior descriptions may need manual review |
| Dynamic form re-render storm shipped | LOW-MEDIUM | Wrap schema derivation in `useMemo`, extract static registries to module scope; performance fix, no data migration needed |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| EXIF orientation on canvas resize | Phase 1: Photo upload | Upload a portrait-mode Android photo; verify storage image is upright |
| Client-side resize degrades OCR quality | Phase 1: Photo upload | Upload a 12MP photo; verify stored image is ~2MP, not smaller |
| AI API key in client bundle | Phase 1: Project setup | Inspect network tab; confirm AI calls originate from `/api/` routes only |
| Supabase Storage — orphaned files | Phase 1: Supabase setup | Cancel an upload mid-way; verify no orphan file in storage |
| Supabase Storage — public bucket | Phase 1: Supabase setup | Open a photo URL in incognito; should return 403 |
| Schema Registry — Salesforce label drift | Phase 1: Schema registry design | Side-by-side comparison of generated output with Salesforce form screenshot |
| Dynamic form re-render storm | Phase 2: Form rendering | Open React DevTools, type in a field, verify only that field re-renders |
| AI returns hallucinated values without confidence | Phase 2: AI extraction | Submit blurry photo; verify some fields return `null` and confidence is "low" |
| Review step skipped by users | Phase 2: Review UX | User test: observe if participants read and touch low-confidence fields |
| Copy-paste whitespace/encoding differences | Phase 3: Output generation | Paste directly into Salesforce (or screenshot equivalent); verify exact match |
| Description footer missing or malformed | Phase 3: Output generation | Run snapshot test for every asset type; assert exact footer string |
| AI generating description text | Phase 3: Output generation | Description output must be identical for identical inputs across 10 runs |

---

## Sources

- Next.js App Router documentation on Server vs Client Components and API key handling (training knowledge, HIGH confidence)
- EXIF orientation / canvas rotation — well-documented browser behaviour, multiple MDN and Stack Overflow references (training knowledge, HIGH confidence)
- OpenAI structured output (`response_format`) — guarantees schema conformance, not semantic accuracy; documented in OpenAI API reference (training knowledge, HIGH confidence)
- Supabase SSR auth (`@supabase/ssr`) — official Supabase recommendation replacing deprecated `@supabase/auth-helpers-nextjs` (training knowledge, MEDIUM confidence — verify current package name)
- React Hook Form + dynamic fields — known re-render patterns, React docs on reconciliation (training knowledge, HIGH confidence)
- `server-only` package — Next.js official pattern for preventing accidental client imports (training knowledge, HIGH confidence)
- Mobile `<input type="file">` without `capture` attribute — iOS/Android picker behaviour (training knowledge, HIGH confidence)

---

*Pitfalls research for: AI-powered asset book-in tool (prestige_assets / Slattery Auctions)*
*Researched: 2026-03-17*
