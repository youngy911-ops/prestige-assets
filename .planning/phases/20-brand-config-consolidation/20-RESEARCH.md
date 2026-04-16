# Phase 20: Brand & Config Consolidation - Research

**Researched:** 2026-04-16
**Domain:** TypeScript config module, Tailwind v4 CSS custom properties, Next.js metadata
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Keep "Slattery Auctions" as the visible brand name — the app should feel like a company tool, not a personal project
- Consolidate all occurrences of "Slattery Auctions" into a single brand config file so the string is defined once and imported everywhere
- Brand config feeds UI strings only: login page, layout title/metadata, report headers, report footers
- Do NOT touch the AI description system prompt (`/api/describe/route.ts`) — that prompt is carefully tuned and the company name there is contextual, not branding. Leave it locked.
- Make the QR domain configurable from one place in the brand config; QR codes appear in output page and report page — both should read from config

### Claude's Discretion
- Brand config file location and shape (e.g., `src/lib/brand.ts` or `src/config/brand.ts`)
- Whether to add warning/success semantic tokens or just use existing ones
- How to handle the one-off dark color variants (`#0a1a0a`, `#111f11`)
- QR code generation approach (keep external `api.qrserver.com` or switch to local — weigh simplicity vs reliability)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRAND-01 | QR code on output/report pages uses configurable domain (not hardcoded `assetbookintool.com`) | Single `BRAND.domain` export consumed in two files: `output/page.tsx` and `ReportClient.tsx` |
| BRAND-02 | Company name, logo monogram, and page metadata are sourced from a single brand config — not scattered hardcoded strings | Four files contain hardcoded "Slattery Auctions" strings; brand config module replaces all of them |
| BRAND-03 | Hardcoded color values (`#F87171`, `bg-[#166534]`, etc.) replaced with semantic Tailwind variants | `--destructive` CSS var already maps to `#F87171` equivalent (oklch); `--background` maps to deep green; pattern is established |
</phase_requirements>

---

## Summary

Phase 20 is a pure consolidation task — no new features, no architecture changes. The codebase is a Next.js 15 / Tailwind v4 / shadcn app. There is no existing brand config or constants file for UI strings; this is greenfield. The work divides cleanly into three independent streams: (1) create a brand config module and wire it into the four string-containing files, (2) make the QR domain configurable from that same module, (3) replace hardcoded hex colors with the semantic Tailwind tokens already defined in `globals.css`.

The Tailwind v4 setup uses a well-established pattern: CSS custom properties in `:root` bridged into Tailwind via `@theme inline`. The `--destructive` token already corresponds to `#F87171` (defined as `oklch(0.74 0.15 20)`). The `--background` token is the deep dark green (`oklch(0.16 0.04 148)`), which matches `#0a1a0a`/`#111f11` — these are the same color expressed differently. The `bg-[#166534]` in the app layout is the same green as `--primary` (approximately), though the exact oklch equivalent needs verification before claiming they're identical.

**Primary recommendation:** Create `src/lib/brand.ts` as the single source of truth. Use `text-destructive` for all `#F87171` replacements. For `bg-[#166534]` in the app layout, replace with `bg-background` (which is the CSS var `oklch(0.16 0.04 148)` — same deep dark green). For `#111f11` (dropdown panel in AssetList) and `#0a1a0a` (ring offset in OutputPanel), replace with `bg-card` / `ring-offset-card` where the card token is `oklch(0.20 0.05 148)` — close enough for these decorative uses.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript (project) | TS 5.x | Brand config module — typed exports | Already the project language; no new deps needed |
| Tailwind v4 | 4.x | CSS custom property tokens via `@theme inline` | Already set up; `--destructive`, `--background`, `--card`, `--primary` tokens exist |
| Next.js Metadata API | 15.x | `export const metadata: Metadata` in `layout.tsx` | Already used; title/description fed from brand config |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `api.qrserver.com` | external | QR code image generation via URL params | Keep — zero deps, no install, works offline in browser |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| External QR API | `qrcode` npm package / local generation | Local generation: no external network dependency, works fully offline. External: simpler, already working, no bundle cost. Given crash-proof demo requirement and the external URL pattern is already battle-tested, keep external. |
| `src/lib/brand.ts` | `src/config/brand.ts` | `lib/` already houses `constants/branches.ts` — consistent to put brand config alongside constants. Either works; `src/lib/constants/brand.ts` follows the existing `branches.ts` pattern exactly. |

**Installation:**
No new packages required.

---

## Architecture Patterns

### Recommended Project Structure
```
src/lib/constants/
├── branches.ts          # existing
└── brand.ts             # NEW — single brand config export
```

The `src/lib/constants/` directory already exists and contains `branches.ts`. Brand config belongs here, not in `src/config/` (which doesn't exist). This keeps all app-wide constants co-located.

### Pattern 1: Brand Config Module
**What:** A plain TypeScript object export containing all brand-visible strings and the configurable domain.
**When to use:** Any file that renders brand text or constructs QR URLs imports from here.

```typescript
// src/lib/constants/brand.ts
export const BRAND = {
  name: 'Slattery Auctions',
  shortName: 'Slattery',
  appTitle: 'Slattery Auctions Book-in',
  appDescription: 'Asset book-in tool',
  logoMonogram: 'S',
  reportHeader: 'Slattery Auctions — Condition Report',
  reportFooter: 'Generated by Slattery Auctions Asset Book-In',
  domain: 'assetbookintool.com',
} as const
```

The `as const` assertion means all values are narrowed to their literal types — TypeScript will flag typos at import sites.

### Pattern 2: QR URL Construction
**What:** Both QR code render sites use identical URL construction logic. Extract to a helper or just read from `BRAND.domain`.
**When to use:** `output/page.tsx` and `ReportClient.tsx`.

```typescript
// Before (hardcoded in two places):
`https://api.qrserver.com/v1/create-qr-code/?size=80x80&...&data=${encodeURIComponent(`https://assetbookintool.com/assets/${assetId}/output`)}`

// After (both files import BRAND):
import { BRAND } from '@/lib/constants/brand'
// ...
`https://api.qrserver.com/v1/create-qr-code/?size=80x80&...&data=${encodeURIComponent(`https://${BRAND.domain}/assets/${assetId}/output`)}`
```

### Pattern 3: Tailwind Semantic Token Substitution
**What:** Replace hardcoded hex with existing Tailwind utility classes backed by CSS custom properties.
**When to use:** Any component using `text-[#F87171]`, `bg-[#F87171]`, `bg-[#166534]`, `bg-[#111f11]`, `ring-offset-[#0a1a0a]`.

**Substitution map (confirmed against `globals.css`):**

| Hardcoded value | Files | Tailwind replacement | CSS var backing |
|----------------|-------|---------------------|-----------------|
| `text-[#F87171]` | `LoginForm.tsx`, `new/page.tsx`, `PhotoThumbnailGrid.tsx` | `text-destructive` | `--destructive: oklch(0.74 0.15 20)` |
| `bg-[#F87171]/60` | `UploadProgressIndicator.tsx` | `bg-destructive/60` | same |
| `hover:text-[#F87171]` | `PhotoThumbnail.tsx` | `hover:text-destructive` | same |
| `bg-[#166534]` | `(app)/layout.tsx` | `bg-background` | `--background: oklch(0.16 0.04 148)` |
| `bg-[#111f11]` | `AssetList.tsx` (dropdown panel) | `bg-card` | `--card: oklch(0.20 0.05 148)` |
| `ring-offset-[#0a1a0a]` | `OutputPanel.tsx` | `ring-offset-background` | `--background: oklch(0.16 0.04 148)` |

**Note on `#166534` vs `--background`:** `#166534` is the CSS hex for approximately `oklch(0.39 0.11 148)` (mid-green), which is NOT the same as `--background` (`oklch(0.16 0.04 148)`, which is near-black dark green). This needs careful verification. The app layout's `bg-[#166534]` sets the page background — visually it should match whatever the body background is. Looking at `globals.css`, `body { background-color: oklch(0.16 0.04 148); }` — so the body IS the dark near-black green, not `#166534`. The `bg-[#166534]` in the app layout wrapper div is lighter than the body. This is NOT a direct replacement for `bg-background`. See Pitfall section below.

**`global-error.tsx` inline styles:** This file uses `style={{ background: '#166534', ... }}` and `style={{ background: '#059669', ... }}`. It cannot use Tailwind classes because it renders before the CSS is guaranteed to load (it's the outermost error boundary). Convert to CSS variables inline or accept that this file uses inline styles. Best approach: convert to known CSS values that match the design system without depending on the stylesheet.

### Pattern 4: New Semantic Tokens (if needed)
**What:** Add `--warning` and `--success` tokens to `globals.css` `:root` following the existing pattern.
**When to use:** Only if a component currently uses hardcoded amber/green that needs semantic naming.
**Current assessment:** No components use hardcoded warning/success hex values beyond the existing emerald-* Tailwind classes (which are Tailwind's design scale, not custom tokens). The `--destructive` token is the only one that has hardcoded hex equivalents in component files. Adding `--warning`/`--success` is optional polish; it is not required by BRAND-03.

### Anti-Patterns to Avoid
- **Duplicating brand strings in components:** Once `BRAND` is imported, never inline `'Slattery Auctions'` again in JSX/metadata.
- **Using `style={{}}` for brand colors in regular components:** Reserve inline styles only for `global-error.tsx` where Tailwind can't reliably reach.
- **Renaming the file to `brand.config.ts`:** The existing constants pattern is plain `.ts` — stay consistent with `branches.ts`.
- **Adding an environment variable for the domain:** Overkill for a single-environment app. The `BRAND` object is the right level of abstraction.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR code generation | Custom QR encoder | `api.qrserver.com` URL (keep existing) | Already works, zero deps, reliable for demo |
| Color token registry | Custom CSS-in-JS theme | Tailwind v4 `@theme inline` (already set up) | Changing tokens in `globals.css` propagates everywhere automatically |
| Brand context / React context | `BrandContext` provider | Plain ES module export (`BRAND` object) | Config is static — React context adds indirection with zero benefit |

---

## Common Pitfalls

### Pitfall 1: Assuming `#166534` == `--background`
**What goes wrong:** Replacing `bg-[#166534]` with `bg-background` changes the app layout's background from a visible mid-green to the near-black dark green — a visible color change.
**Why it happens:** `#166534` is approximately `oklch(0.39 0.11 148)` (lighter green); `--background` is `oklch(0.16 0.04 148)` (near-black). They are both "dark green" but different lightness.
**How to avoid:** Keep `bg-[#166534]` in `(app)/layout.tsx` OR convert it to a new semantic token `--surface` / verify visually. Alternatively, the app layout wrapper background may be irrelevant (body already sets the dark background) — if removing `bg-[#166534]` from the div doesn't change visual output because the body color covers it, then `bg-background` works fine. This must be verified at implementation time.
**Warning signs:** After replacement, the main app screen looks noticeably darker or lighter.

### Pitfall 2: `#111f11` in AssetList dropdown is darker than `--card`
**What goes wrong:** The `bg-[#111f11]` dropdown uses a very dark near-black green for contrast. `--card` is `oklch(0.20 0.05 148)` (slightly elevated). They are close but not identical.
**Why it happens:** The dropdown was styled with a custom one-off dark to make it read as a floating surface against the background.
**How to avoid:** `bg-card` is the closest semantic token and is an acceptable replacement (slightly lighter). Alternatively, `bg-[#111f11]` can be left as a deliberate design choice if the planner/implementer decides the color is load-bearing.

### Pitfall 3: `global-error.tsx` inline styles can't use Tailwind
**What goes wrong:** `global-error.tsx` renders before any stylesheet is guaranteed. Replacing `style={{ background: '#166534' }}` with `className="bg-background"` may not render correctly in catastrophic error scenarios.
**Why it happens:** Global error boundaries are special — they render with minimal runtime context.
**How to avoid:** Keep inline styles in `global-error.tsx` but update the hex values to match the actual brand palette (oklch values won't work in inline styles; use hex equivalents). The hex for `--background` is approximately `#19291a`; for `--primary` approximately `#3a7a3a`.

### Pitfall 4: `LAST_BRANCH_KEY` string is also a candidate for constants (CODE-01)
**What goes wrong:** Phase 23 (CODE-01) is specifically about consolidating `LAST_BRANCH_KEY`. If Phase 20 touches `AssetList.tsx` and `new/page.tsx` for color changes, a merge conflict could occur if Phase 23 also edits those files.
**Why it happens:** Both phases touch the same files for different reasons.
**How to avoid:** Phase 20 should NOT consolidate `LAST_BRANCH_KEY` — that is explicitly Phase 23's scope. Make only color changes in those files.

### Pitfall 5: `import BRAND` in Server Components vs Client Components
**What goes wrong:** `layout.tsx` (Server Component) and `ReportClient.tsx` (Client Component, `'use client'`) both need BRAND. No issue — a plain TS module with no browser-specific APIs works in both contexts.
**Why it happens:** N/A — no issue, just document to avoid confusion.
**How to avoid:** Keep `brand.ts` as a plain data module (no `'use client'` directive, no `'use server'`).

---

## Code Examples

### Brand config module
```typescript
// src/lib/constants/brand.ts
export const BRAND = {
  /** Visible company name — used in UI headings, report headers, page titles */
  name: 'Slattery Auctions',
  /** Short brand identifier for logo monogram */
  logoMonogram: 'S',
  /** Full app title for browser tab / metadata */
  appTitle: 'Slattery Auctions Book-in',
  /** Page metadata description */
  appDescription: 'Asset book-in tool',
  /** Report header label */
  reportHeader: 'Slattery Auctions \u2014 Condition Report',
  /** Report footer text */
  reportFooter: 'Generated by Slattery Auctions Asset Book-In',
  /** Domain used in QR codes — change this one value to update all QR codes */
  domain: 'assetbookintool.com',
} as const
```

### Consuming brand config in layout.tsx (metadata)
```typescript
// src/app/layout.tsx
import { BRAND } from '@/lib/constants/brand'

export const metadata: Metadata = {
  title: BRAND.appTitle,
  description: BRAND.appDescription,
}
```

### Consuming brand config in login page (logo monogram + heading)
```typescript
// Before:
<span className="text-2xl font-black text-white tracking-tight">S</span>
<h1 ...>Slattery Auctions</h1>

// After:
import { BRAND } from '@/lib/constants/brand'
<span className="text-2xl font-black text-white tracking-tight">{BRAND.logoMonogram}</span>
<h1 ...>{BRAND.name}</h1>
```

### QR URL pattern (both output/page.tsx and ReportClient.tsx)
```typescript
import { BRAND } from '@/lib/constants/brand'

// QR src attribute:
`https://api.qrserver.com/v1/create-qr-code/?size=80x80&bgcolor=1a2e1a&color=ffffff&data=${encodeURIComponent(`https://${BRAND.domain}/assets/${assetId}/output`)}`

// Report footer:
{BRAND.reportFooter} · {BRAND.domain}
```

### Color substitution examples
```tsx
// LoginForm.tsx — before:
<p role="alert" className="text-[#F87171] text-sm">{error}</p>
// After:
<p role="alert" className="text-destructive text-sm">{error}</p>

// UploadProgressIndicator.tsx — before:
className={`... ${error ? 'bg-[#F87171]/60' : 'bg-black/50'}`}
// After:
className={`... ${error ? 'bg-destructive/60' : 'bg-black/50'}`}

// PhotoThumbnail.tsx — before:
className="... hover:text-[#F87171] ..."
// After:
className="... hover:text-destructive ..."

// PhotoThumbnailGrid.tsx — before:
<p className="text-sm text-[#F87171] mt-2">{orderError}</p>
// After:
<p className="text-sm text-destructive mt-2">{orderError}</p>

// new/page.tsx — before:
<p className="text-[#F87171] text-sm mb-4">{error}</p>
// After:
<p className="text-destructive text-sm mb-4">{error}</p>
```

### Confirmed globals.css token map
```css
/* From src/app/globals.css — these tokens are already defined: */
--destructive: oklch(0.74 0.15 20);    /* ≈ #F87171 red */
--background:  oklch(0.16 0.04 148);   /* deep dark green ≈ #0f1f0f */
--card:        oklch(0.20 0.05 148);   /* slightly elevated dark green */
--primary:     oklch(0.52 0.17 148);   /* bright green CTA */

/* @theme inline bridges these to Tailwind: */
--color-destructive: var(--destructive);  /* → text-destructive, bg-destructive */
--color-background:  var(--background);   /* → bg-background */
--color-card:        var(--card);         /* → bg-card */
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Tailwind v3 arbitrary values for brand colors | Tailwind v4 `@theme inline` with CSS custom properties | CSS vars are the correct abstraction — changing `:root` values updates all usages automatically |
| Separate color definitions per component | Semantic token system (destructive, primary, muted, etc.) | shadcn's naming convention is widely understood; developers read intent from class names |

**Deprecated/outdated:**
- Arbitrary Tailwind values like `bg-[#F87171]`: While still valid Tailwind v4 syntax, using them when an equivalent semantic token exists is a code smell. Use `bg-destructive` instead.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run src/__tests__/brand.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-01 | `BRAND.domain` is exported and equals a non-empty string | unit | `npx vitest run src/__tests__/brand.test.ts` | ❌ Wave 0 |
| BRAND-02 | `BRAND.name`, `BRAND.logoMonogram`, `BRAND.appTitle` are exported with non-empty values | unit | `npx vitest run src/__tests__/brand.test.ts` | ❌ Wave 0 |
| BRAND-03 | No hardcoded `#F87171`, `#166534`, `#0a1a0a`, `#111f11` remain in component files (grep-based) | smoke | `npx vitest run src/__tests__/brand.test.ts` | ❌ Wave 0 |

**Note on BRAND-03:** A grep-based test (checking that no component files contain the hex literals) is the most direct verification. This can be implemented as a Vitest test using Node's `fs` module to scan the `src/components` and `src/app` directories.

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/brand.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/brand.test.ts` — covers BRAND-01, BRAND-02, BRAND-03 (brand config exports + no hardcoded hex grep)

*(Existing test infrastructure: `vitest.config.ts`, `vitest.setup.ts`, and `src/__tests__/` directory all exist. Only the phase-specific test file is missing.)*

---

## Open Questions

1. **Is `bg-[#166534]` in `(app)/layout.tsx` visually distinct from `bg-background`?**
   - What we know: `#166534` ≈ `oklch(0.39 0.11 148)` (lighter mid-green); `--background` = `oklch(0.16 0.04 148)` (near-black dark green). They are different.
   - What's unclear: Whether the layout div's background is ever visible (the body background already fills the screen).
   - Recommendation: Implementer should remove `bg-[#166534]` from the div and check visually. If no change, use `bg-background`. If visible change, either keep the hardcoded value (it's a single instance, not a pattern) or add a `--surface` token.

2. **Should `global-error.tsx` use CSS vars in inline styles?**
   - What we know: Inline styles can reference CSS custom properties (`style={{ background: 'var(--background)' }}`), but `--background` may not be defined when the global error boundary fires (no stylesheet loaded).
   - What's unclear: Whether the CSS is loaded before error rendering in Next.js 15.
   - Recommendation: Keep hex values in `global-error.tsx` but update them to better match the actual brand (e.g., use `#0f1f0f` for background instead of `#166534`). BRAND-03 specifically lists this file — update the hex to the correct dark background color.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read — `src/app/globals.css`, all 11 component files listed in CONTEXT.md canonical refs
- Direct codebase read — `src/lib/constants/branches.ts` (establishes constants file pattern)
- Direct codebase read — `vitest.config.ts`, `src/__tests__/` directory (establishes test pattern)

### Secondary (MEDIUM confidence)
- Tailwind v4 `@theme inline` behavior: inferred from globals.css structure which is consistent with Tailwind v4 docs pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use, no new dependencies
- Architecture: HIGH — directly inspected all files named in CONTEXT.md canonical refs
- Pitfalls: HIGH — color mismatch pitfalls identified from direct hex value analysis; `#166534` vs `--background` discrepancy confirmed by reading both files

**Research date:** 2026-04-16
**Valid until:** Stable — no external dependencies changing; valid until codebase changes
