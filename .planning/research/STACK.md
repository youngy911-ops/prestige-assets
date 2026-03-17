# Stack Research

**Domain:** Web app — Next.js + Supabase + AI vision extraction + file upload
**Researched:** 2026-03-17
**Confidence:** MEDIUM-HIGH (Next.js verified from official docs; library versions from training knowledge as of Aug 2025, flagged where uncertain)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x (App Router) | Full-stack framework | Confirmed current stable. App Router with React 19 is the standard path for new projects. Server Components keep AI keys server-side by default. Server Actions eliminate a separate API layer for mutations. |
| React | 19.x | UI runtime | Ships with Next.js 15 App Router. `useActionState` and form actions are idiomatic React 19 — replaces the `useFormStatus` workarounds from React 18 era. |
| TypeScript | 5.x | Type safety | First-class in Next.js (`next.config.ts` supported). Required for Zod schema ↔ TypeScript type inference to work correctly across Salesforce field schemas. |
| Supabase | `@supabase/supabase-js` ^2 | PostgreSQL + Storage + Auth | Single SDK covers all three backend needs. `@supabase/ssr` package handles cookie-based session management in the App Router. Storage SDK handles bucket uploads. Auth with `signInWithPassword` covers single-user auth requirement without multi-role overhead. |
| Tailwind CSS | ^3.4 (or ^4.0 if stable) | Styling | Standard pairing with Next.js. shadcn/ui components are built on Tailwind and Radix — this is the de facto 2025-2026 UI stack for Next.js apps. Avoids writing CSS for every field in the large Salesforce form schemas. |

**Note on Next.js version:** Official docs at nextjs.org show the docs system at "16.1.7" but this appears to be the docs platform version, not Next.js itself. The Next.js 15 blog post (October 2024) is the confirmed latest stable major release. Use `next@15` / `next@latest` at project creation time to get the current patch.

---

### Supporting Libraries

#### AI Vision Extraction

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ai` (Vercel AI SDK) | ^4.x | AI call orchestration | Core library for all AI interactions. `generateObject()` with a Zod schema produces type-safe structured output — this is exactly the pattern for extracting VIN/make/model/year from build plate photos. |
| `@ai-sdk/openai` | ^1.x | OpenAI provider for AI SDK | Use this to call GPT-4o. Supports image inputs (base64 or URL). Pair with `generateObject()` and a Zod schema for structured extraction. Keys are environment variables read only server-side. |
| `zod` | ^3.x | Schema validation | Defines the structured output shape for AI extraction AND validates Salesforce field data. Single source of truth: define once, get TypeScript types + runtime validation + AI output schema. |

**AI pattern to use:**
```typescript
// Server Action or Route Handler only — key never leaves server
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const buildPlateSchema = z.object({
  vin: z.string().nullable(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  year: z.number().nullable(),
  serialNumber: z.string().nullable(),
})

const { object } = await generateObject({
  model: openai('gpt-4o'),
  schema: buildPlateSchema,
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Extract build plate data from this image.' },
      { type: 'image', image: base64DataUrl },
    ],
  }],
})
```

#### File Upload and Image Handling

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `browser-image-compression` | ^2.x | Client-side image resize | Resizes photos to max 2MP before upload. Runs entirely in browser (Web Workers for non-blocking). Simple API: `imageCompression(file, { maxSizeMB: 2 })`. No server round-trip needed. |
| `@supabase/supabase-js` Storage API | (bundled with SDK) | Upload to Supabase Storage | Use `supabase.storage.from('bucket').upload(path, file)` from a Server Action — client sends file to server action via FormData, server action uploads to Storage. This keeps the Supabase service role key server-side for write operations. For public reads use signed URLs or public bucket. |

**Upload flow:**
1. User picks file via `<input type="file">` (works on iOS Safari camera roll + desktop filesystem)
2. Client resizes with `browser-image-compression` to max 2MP
3. Client sends compressed file to Server Action via FormData
4. Server Action uploads to Supabase Storage with service role key
5. Server Action returns the storage path/URL, saved to database

**Alternative upload pattern (direct-to-storage):** Supabase supports generating presigned upload URLs so the client uploads directly to storage without routing through the Next.js server. This is better for large files but adds complexity. For 2MP max images (~500KB-1MB), routing through a Server Action is simpler and avoids client-side key exposure. Use direct-to-storage only if upload latency becomes a problem.

#### Drag-to-Reorder

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@dnd-kit/core` | ^6.x | Drag-and-drop primitives | The standard choice for React in 2025-2026. Accessible, touch-friendly (iOS Safari works), and does not use HTML5 drag API (which is broken on mobile). |
| `@dnd-kit/sortable` | ^8.x | Sortable list utilities | Wraps `@dnd-kit/core` with `SortableContext` and `useSortable` hook. Required for photo reorder grid. |
| `@dnd-kit/utilities` | ^3.x | CSS transform helpers | Needed for smooth drag animations. Small package. |

**Why not `react-beautiful-dnd`:** Deprecated by Atlassian, no longer maintained, known issues on mobile browsers. Do not use.

**Why not `react-dnd`:** Relies on HTML5 drag API which does not work on iOS Safari. `@dnd-kit` uses pointer events which work everywhere.

#### Form Handling

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-hook-form` | ^7.x | Form state management | Industry standard for complex forms. This project has Salesforce schemas with 30-35 fields per asset type — RHF's uncontrolled approach avoids re-rendering on every keystroke. |
| `@hookform/resolvers` | ^3.x | Zod integration for RHF | Connects Zod schema to RHF validation. Single schema definition handles both AI output validation and form field validation. |

**Note on Server Actions + RHF:** Use RHF for the review/edit form (confirming AI-extracted data). The form `handleSubmit` calls a Server Action with the validated data object. Do not try to use RHF directly with a `<form action={serverAction}>` — RHF needs its `handleSubmit` wrapper. Pattern: `<form onSubmit={handleSubmit(async (data) => await saveAssetAction(data))}>`.

#### UI Components

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `shadcn/ui` | latest (CLI-based) | Accessible component primitives | Not a dependency — components are copied into your codebase via CLI. Based on Radix UI + Tailwind. Use for: dialogs, dropdowns, toast notifications, tabs (per asset type form). Copy only what you use. |
| `lucide-react` | ^0.4xx | Icons | Ships with shadcn/ui setup. Consistent icon set. |
| `clsx` + `tailwind-merge` | ^2.x | Conditional class merging | Standard shadcn/ui utilities. `cn()` helper pattern. |

#### State and Async

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | ^5.x | Client-side async state | Use for: fetching the asset list, photo order state, any client-side data that needs invalidation after Server Actions. Pairs well with Server Actions — call `queryClient.invalidateQueries()` after a mutation. Optional for MVP but strongly recommended once you have more than 2 fetch patterns. |

**For MVP simplicity:** Start without React Query. Use Server Components for initial data fetching and `useRouter().refresh()` after mutations. Add React Query in the first iteration if you hit stale-data problems.

#### Database Access

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/supabase-js` | ^2.x | Database queries | Use the Supabase typed client directly. No separate ORM needed — Supabase generates TypeScript types from your schema via `supabase gen types typescript`. This gives full type safety without Prisma/Drizzle overhead. |

**Why not Prisma or Drizzle:** Both are valid ORMs, but Supabase already provides a typed query client. Adding Prisma means maintaining two database-touching layers. For this app's CRUD-heavy workload, the Supabase client is sufficient and keeps the stack minimal. If you need complex multi-table transactions, reconsider Drizzle.

#### Auth

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/ssr` | ^0.5.x | Supabase auth for Next.js App Router | Replaces the deprecated `@supabase/auth-helpers-nextjs`. Handles cookie-based sessions in Server Components, middleware, and Route Handlers. Required for persistent login across sessions. |

**Auth flow:** `signInWithPassword()` email+password login. Middleware checks session on every request. No OAuth needed for MVP (single internal user). Enable Row Level Security (RLS) in Supabase — all queries should run as the authenticated user role, not service role.

---

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Supabase CLI | Local development, migrations, type generation | `supabase start` runs Postgres + Storage + Auth locally. `supabase gen types typescript` generates typed client. Essential — do not skip local development setup. |
| ESLint + `eslint-config-next` | Linting | Ships with Next.js. Next.js 15 supports ESLint 9 with flat config. |
| Prettier | Code formatting | Standard. Add `prettier-plugin-tailwindcss` to auto-sort Tailwind classes. |
| Turbopack | Dev server bundler | `next dev --turbo` is stable in Next.js 15. Faster HMR. Use it. |
| `@types/node` | TypeScript Node types | Required for Server Actions and server-only code. |

---

## Installation

```bash
# Scaffold
npx create-next-app@latest prestige-assets --typescript --tailwind --app --src-dir --import-alias "@/*"

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# AI
npm install ai @ai-sdk/openai zod

# Forms
npm install react-hook-form @hookform/resolvers

# Drag-to-reorder
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Image compression
npm install browser-image-compression

# UI utilities (shadcn/ui installs via CLI, not npm install)
npm install clsx tailwind-merge lucide-react

# Optional: Client-side async state
npm install @tanstack/react-query @tanstack/react-query-devtools

# Dev dependencies
npm install -D @types/node supabase
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@dnd-kit/core` + `@dnd-kit/sortable` | `react-beautiful-dnd` | Never — deprecated, mobile-broken |
| `@dnd-kit/core` + `@dnd-kit/sortable` | `react-dnd` | If you need desktop-only and HTML5 drag API is acceptable |
| `browser-image-compression` | Canvas API resize (manual) | If you need more control over resize algorithm; adds ~50 lines of code vs 3 lines with the library |
| `browser-image-compression` | Supabase image transforms | Supabase image transforms run server-side after upload — you'd still upload the full-size image, incurring bandwidth cost. Do client-side resize first, then upload. |
| Supabase typed client | Prisma | If you have complex multi-table joins, multiple providers, or need DB-level migrations tracked in code. For this CRUD app, unnecessary overhead. |
| Supabase typed client | Drizzle | Drizzle is lighter than Prisma and has good Supabase integration, but still adds a layer. Reconsider at v2 if query complexity grows. |
| `react-hook-form` | Formik | Formik is older, heavier, and slower (controlled inputs). RHF is the current standard. |
| `react-hook-form` | Native `<form action={serverAction}>` | Native form action works well for simple forms. For 30-35 field schemas with AI pre-fill and complex validation, RHF is worth the setup cost. |
| Vercel AI SDK `generateObject` | Raw OpenAI SDK (`openai` package) | Raw SDK gives more control but requires manual JSON parsing and retry logic. AI SDK's `generateObject` handles structured output mode and schema coercion automatically. Use raw SDK only if you need features the AI SDK doesn't expose. |
| `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | Auth helpers is deprecated. Do not use. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@supabase/auth-helpers-nextjs` | Deprecated by Supabase. Will receive no updates. | `@supabase/ssr` |
| `react-beautiful-dnd` | Officially deprecated by Atlassian; does not work on mobile browsers; unmaintained. | `@dnd-kit/core` + `@dnd-kit/sortable` |
| `react-dnd` | Uses HTML5 Drag API which is broken/unreliable on iOS Safari and Android browsers — critical failure for a mobile-capture use case. | `@dnd-kit/core` |
| `next/image` for user-uploaded photos | `next/image` is for static/known assets. User-uploaded Supabase Storage photos should be rendered with a regular `<img>` tag or a custom component using signed URLs. Trying to route through `next/image` with Supabase Storage requires extra `remotePatterns` config and can introduce CDN complexity. | `<img>` with Supabase Storage public/signed URL |
| Page Router | New project — no reason to use the legacy routing system. App Router is the current standard. Server Components and Server Actions are not available in the Page Router. | App Router |
| `@next/font` (external package) | Removed in Next.js 15. | `next/font` (built-in) |
| OpenAI API key in any client-side code | ISO 27001 constraint + general security. Exposed keys in browser JS are trivially extractable. | Server Actions or Route Handlers for all AI calls |
| AI-generated description text | Project requirement: descriptions must be deterministic templates, not AI prose. AI generates field values only. | Template engine in application code |

---

## Stack Patterns by Variant

**For AI extraction (build plate photo → structured fields):**
- Use a Server Action (or Route Handler) that accepts a base64 image
- Call `generateObject()` with `@ai-sdk/openai` and a Zod schema per asset type
- Return the extracted object to the client for review
- Never stream to client — `generateObject()` waits for complete structured response before returning

**For photo upload:**
- Client: resize with `browser-image-compression` → send as FormData to Server Action
- Server Action: upload to Supabase Storage bucket with a path like `{userId}/{assetId}/{timestamp}.jpg`
- Store the storage path in the asset's photos array in the database
- For display: use Supabase Storage public URLs (if bucket is public) or signed URLs (if private)

**For drag-to-reorder:**
- Store photo order as an array of storage paths in the asset record, e.g., `photos: string[]`
- `@dnd-kit/sortable` manages the drag state in the client
- On reorder, call a Server Action to update the `photos` array in the database
- First item in the array is the cover photo by convention

**For Salesforce output generation:**
- Deterministic template functions in server-side code (not AI)
- Accept the asset data object, return formatted strings
- One template function per asset type
- Three output sections: structured fields block, description block, Glass's Valuation block (Caravan only)
- Clipboard copy via `navigator.clipboard.writeText()` in client component

**For the review form:**
- React Hook Form pre-filled with AI-extracted values
- Zod schema per asset type matches Salesforce field schema
- `handleSubmit` → Server Action → Supabase insert/update
- User must submit the form explicitly (no auto-save)

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `next@15` | `react@19`, `react-dom@19` | Next.js 15 App Router requires React 19 RC/stable. Do not mix App Router with React 18. |
| `@supabase/ssr@^0.5` | `@supabase/supabase-js@^2` | Must use together. `@supabase/ssr` is a thin wrapper that adds cookie utilities. |
| `react-hook-form@^7` | `react@18 or ^19` | Compatible with both. No breaking changes for React 19. |
| `@dnd-kit/core@^6` | `react@^18 or ^19` | Compatible. No known React 19 issues. |
| `ai@^4` (Vercel AI SDK) | `next@15` | AI SDK v4 is compatible with Next.js 15 Server Actions and Route Handlers. Use Server Actions with `'use server'` or Route Handlers with `export const runtime = 'nodejs'` (not edge — Node.js runtime needed for full AI SDK feature set). |
| `browser-image-compression@^2` | Browser (client components only) | Import only in client components or utility files not imported by server code. Use dynamic import if needed: `const imageCompression = (await import('browser-image-compression')).default` |

---

## Confidence Notes

| Area | Confidence | Reason |
|------|------------|--------|
| Next.js 15 + React 19 + App Router | HIGH | Verified from official nextjs.org/blog/next-15 and nextjs.org/docs |
| Server Actions pattern | HIGH | Verified from official Next.js docs (version 16.1.7 docs system, content confirmed) |
| `@supabase/supabase-js` v2 + `@supabase/ssr` | MEDIUM | Consistent with Supabase docs direction as of mid-2025; verify `@supabase/ssr` minor version at install time |
| Vercel AI SDK v4 `generateObject` | MEDIUM | Training knowledge as of Aug 2025; verify `ai` package version at install time — run `npm install ai@latest` |
| `@dnd-kit` for drag-reorder | MEDIUM | Established library since 2021, no known deprecation; verify mobile Safari compatibility with current version at time of build |
| `browser-image-compression` | MEDIUM | Actively maintained; verify it works in iOS Safari PWA context at integration time |
| shadcn/ui | MEDIUM | CLI-based, not versioned as a package; check for any breaking changes to component primitives when initializing |

---

## Sources

- `https://nextjs.org/blog/next-15` — Next.js 15 feature list, breaking changes, React 19 support (HIGH confidence, official)
- `https://nextjs.org/docs/app/getting-started/updating-data` — Server Actions pattern, version confirmed as Next.js 16.1.7 docs system (HIGH confidence, official)
- `https://nextjs.org/docs` — Next.js current version and App Router feature summary (HIGH confidence, official)
- Training knowledge (Aug 2025 cutoff) — Supabase, Vercel AI SDK, dnd-kit, react-hook-form, browser-image-compression (MEDIUM confidence — verify versions at install time)

---

*Stack research for: Next.js + Supabase + AI vision web app (Prestige Assets / Slattery Auctions book-in tool)*
*Researched: 2026-03-17*
