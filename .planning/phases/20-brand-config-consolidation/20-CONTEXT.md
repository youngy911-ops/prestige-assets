# Phase 20: Brand & Config Consolidation - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Centralize brand identity, QR domain, and color tokens into single sources of truth. Every brand-visible value (domain, company name, logo, colors) is sourced from a single config — not scattered across files.

</domain>

<decisions>
## Implementation Decisions

### Brand identity
- Keep "Slattery Auctions" as the visible brand name — the app should feel like a company tool, not a personal project
- Consolidate all occurrences of "Slattery Auctions" into a single brand config file so the string is defined once and imported everywhere
- Brand config feeds UI strings only: login page, layout title/metadata, report headers, report footers
- Do NOT touch the AI description system prompt (`/api/describe/route.ts`) — that prompt is carefully tuned and the company name there is contextual, not branding. Leave it locked.

### QR code domain
- Claude's Discretion: pick a sensible default domain (currently `assetbookintool.com`)
- Make the domain configurable from one place in the brand config
- QR codes appear in output page and report page — both should read from config

### Color token strategy
- Claude's Discretion: handle color cleanup sensibly
- Replace obvious hardcoded hex values with existing semantic Tailwind tokens:
  - `#F87171` (6 files) → `destructive` (already defined in CSS vars)
  - `#166534` / `bg-[#166534]` → `background` (already defined)
  - `#0a1a0a`, `#111f11` one-off dark variants → evaluate whether to replace or keep
- Add new semantic tokens (warning, success) to `globals.css` if needed for completeness
- `global-error.tsx` uses inline styles with hex — convert to use CSS vars or Tailwind classes

### Claude's Discretion
- Brand config file location and shape (e.g., `src/lib/brand.ts` or `src/config/brand.ts`)
- Whether to add warning/success semantic tokens or just use existing ones
- How to handle the one-off dark color variants (`#0a1a0a`, `#111f11`)
- QR code generation approach (keep external `api.qrserver.com` or switch to local — weigh simplicity vs reliability)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Brand strings (files to consolidate FROM)
- `src/app/layout.tsx` — Page title metadata ("Slattery Auctions Book-in")
- `src/app/(auth)/login/page.tsx` — Login page brand text
- `src/components/asset/ReportClient.tsx` — Report header + footer text, QR code URL
- `src/app/(app)/assets/[id]/output/page.tsx` — Output page QR code URL

### Color tokens
- `src/app/globals.css` — Existing CSS custom properties (destructive, background, etc.)
- `src/app/global-error.tsx` — Inline hex styles that need conversion
- `src/components/asset/PhotoThumbnailGrid.tsx` — Hardcoded `#F87171`
- `src/components/asset/UploadProgressIndicator.tsx` — Hardcoded `#F87171`
- `src/components/asset/PhotoThumbnail.tsx` — Hardcoded `#F87171`
- `src/components/asset/PhotoUploadZone.tsx` — Hardcoded `#F87171`
- `src/components/auth/LoginForm.tsx` — Hardcoded `#F87171`
- `src/app/(app)/assets/new/page.tsx` — Hardcoded `#F87171`
- `src/components/asset/OutputPanel.tsx` — Hardcoded `#0a1a0a`
- `src/components/asset/AssetList.tsx` — Hardcoded `#111f11`
- `src/app/(app)/layout.tsx` — Hardcoded `bg-[#166534]`

### AI prompt (DO NOT MODIFY)
- `src/app/api/describe/route.ts` — Description system prompt contains "Slattery Auctions" but is deliberately excluded from brand config scope

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Tailwind v4 + shadcn CSS vars already set up in `globals.css` — semantic tokens (`--destructive`, `--background`, `--primary`, etc.) exist and are wired into `@theme inline`
- No existing brand config or constants file — this is greenfield

### Established Patterns
- CSS custom properties defined in `:root` in `globals.css`, consumed via Tailwind's `@theme inline` bridge
- shadcn component library uses semantic color tokens (destructive, primary, secondary, etc.)
- QR codes generated via external service (`api.qrserver.com`) with URL params

### Integration Points
- Brand config will be imported by layout, login page, report client, and output page
- Color tokens defined in `globals.css` `:root` — adding new tokens follows existing pattern
- QR URL construction in output page and report client

</code_context>

<specifics>
## Specific Ideas

- User wants the app to feel like a proper company tool — "Slattery Auctions" branding stays, just gets consolidated
- AI description prompt is sacred — user has strong instinct about description quality and doesn't want it touched
- This is a quick consolidation phase, not a rebrand

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 20-brand-config-consolidation*
*Context gathered: 2026-04-16*
