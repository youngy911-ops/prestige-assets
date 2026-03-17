# Architecture Research

**Domain:** AI-powered internal data-capture web app (Next.js + Supabase)
**Researched:** 2026-03-17
**Confidence:** HIGH — based on Next.js official docs (v16.1.7, updated 2026-03-16) and Supabase documentation

---

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER (Browser — phone or desktop)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ PhotoCapture │  │ ReviewForm   │  │ OutputPanel              │  │
│  │ (file picker │  │ (dynamic per │  │ (copy-paste blocks)      │  │
│  │  + resize)   │  │  asset type) │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                     │                  │
│  ┌──────┴─────────────────┴─────────────────────┴───────────────┐  │
│  │  Client-side: Supabase BrowserClient, image resize, zustand  │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────┼──────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────┼──────────────────────────────────────┐
│  NEXT.JS SERVER LAYER       │                                       │
│                             │                                       │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │  middleware.ts — auth guard (Supabase ServerClient, cookies)  │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │  Server Actions (lib/actions/)                                │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────────┐   │  │
│  │  │ asset.actions   │  │  (no AI server actions — see      │  │
│  │  │ (CRUD, photo    │  │   Route Handler decision below)   │  │
│  │  │  order, schema  │  │                                   │  │
│  │  │  lookups)       │  │                                   │  │
│  │  └─────────────────┘  └──────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Route Handler: app/api/extract/route.ts (POST)               │  │
│  │  — AI vision call to OpenAI GPT-4o                            │  │
│  │  — Reads image from Supabase Storage via signed URL           │  │
│  │  — Returns structured JSON (zod-validated)                    │  │
│  │  — OpenAI API key NEVER leaves server                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  lib/schema-registry/ — Schema Registry (static TypeScript)  │  │
│  │  — Per-type field definitions, display labels, SF order       │  │
│  │  — Description template functions                             │  │
│  │  — Imported by both Server Actions and Client Components      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼──────────────────────────────────────┐
│  SUPABASE (hosted)          │                                       │
│                             │                                       │
│  ┌──────────────────────────▼───────┐  ┌──────────────────────┐    │
│  │  PostgreSQL DB                   │  │  Storage             │    │
│  │  - assets (record per booking)   │  │  - photos bucket     │    │
│  │  - asset_photos (ordered list)   │  │    (path: userId/    │    │
│  │  - sessions (Supabase Auth)      │  │     assetId/file)    │    │
│  └──────────────────────────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼──────────────────────────────────────┐
│  EXTERNAL APIs              │                                       │
│  ┌──────────────────────────▼───────────────────────────────────┐   │
│  │  OpenAI API (GPT-4o) — called from Route Handler only        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|---------------|----------------|
| `middleware.ts` | Auth guard: redirect unauthenticated users to `/login`; refresh Supabase session cookie on every request | Supabase `createServerClient` with `cookies()` from `next/headers` |
| `app/(auth)/login/page.tsx` | Login form — email/password via Supabase Auth | Client Component, calls Supabase `signInWithPassword` |
| `app/(app)/assets/page.tsx` | Asset list — in-progress and completed bookings | Server Component, reads from DB via Supabase ServerClient |
| `app/(app)/assets/new/page.tsx` | New asset wizard: photo upload → type select → AI extract → review → output | Primarily Client Components orchestrated by wizard state |
| `app/(app)/assets/[id]/page.tsx` | View/edit existing asset record | Hybrid: Server Component loads data, Client Components handle edits |
| `PhotoCapture` | File picker (camera roll on mobile), client-side resize to max 2MP using `browser-image-compression`, direct upload to Supabase Storage via BrowserClient | `'use client'` component |
| `AssetTypeSelector` | Dropdown/button group for asset type — triggers Schema Registry lookup | `'use client'` component |
| `ExtractionPanel` | Calls `/api/extract` Route Handler after photos are uploaded; shows loading state; displays result for review | `'use client'` component with `useActionState` / fetch |
| `DynamicFieldForm` | Renders fields from Schema Registry definition for the selected asset type; controlled form state | `'use client'` component |
| `OutputPanel` | Renders copy-paste blocks: structured fields + description (+ Glass's Valuation for Caravans); uses Schema Registry templates | `'use client'` component; output is pure deterministic string |
| `lib/schema-registry/` | Static TypeScript definitions: field lists, display labels, Salesforce order, description template functions per asset type | Pure TypeScript, no runtime deps; importable server and client |
| `lib/actions/asset.actions.ts` | Server Actions: create asset record, save confirmed fields, update photo order, soft-delete | `'use server'` file; uses Supabase ServerClient |
| `app/api/extract/route.ts` | Route Handler (POST): receives `{ assetId, photoUrls, assetType }`; fetches images via Supabase signed URLs; calls GPT-4o with structured output; returns validated JSON | Server-only; OpenAI key via `process.env` |

---

## App Router vs Pages Router Decision

**Use App Router.** The Pages Router is in maintenance mode. App Router is the current default.

For this app specifically, App Router provides:
- Server Components for authenticated data-fetching pages (asset list, record view) with zero client JS overhead
- Server Actions for all database mutations (create, update, reorder)
- Route Handlers for the AI extraction endpoint (needed because Server Actions are queued/sequential and cannot stream — the official Next.js docs state: "Server Actions are queued. Using them for data fetching introduces sequential execution.")
- Middleware for auth guard at the edge before any page renders

---

## Server Actions vs Route Handlers — The Split Decision

This is the most architecturally significant decision for this app.

**Use Server Actions for:** All database mutations (create asset, save fields, update photo order). These are form-adjacent, mutation-style operations that fit the Server Action model exactly.

**Use a Route Handler (POST) for:** The AI vision call to GPT-4o.

Rationale: The official Next.js docs (v16.1.7) explicitly state Server Actions are queued and sequential, making them unsuitable for data-fetching-style operations. The AI call is a long-running request (~5-15 seconds for GPT-4o vision) that:
1. Needs to be triggered by a button click, not a form submit
2. May benefit from streaming status updates to the client
3. Is fundamentally a "fetch data from AI" operation, not a mutation
4. Must stream a `ReadableStream` response if progress feedback is needed (Route Handlers support this; Server Actions do not)

The Route Handler at `app/api/extract/route.ts` keeps the OpenAI API key on the server (never in client code — a hard project constraint per PROJECT.md).

---

## Supabase Client Patterns

There are two distinct Supabase client types in a Next.js App Router app. Using the wrong one causes auth failures.

### Pattern: BrowserClient (Client Components only)

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Used in: `PhotoCapture` (direct Storage upload), `LoginForm` (`signInWithPassword`).

The browser client reads/writes the auth cookie directly in the browser. Use ONLY in `'use client'` components.

### Pattern: ServerClient (Server Components, Actions, Route Handlers)

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

Used in: Server Components (asset list page, record page), Server Actions (all DB mutations), Route Handler (AI extract — to verify auth before calling OpenAI), `middleware.ts`.

### Pattern: Middleware Auth Refresh

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

The middleware must run on every request to refresh the session JWT. Do not skip it for `app/` routes.

---

## Schema Registry Design

The Schema Registry is the central data structure of the entire application. Everything — form generation, AI output parsing, description generation, copy-paste output — is derived from it.

### Design Principle

The Schema Registry is **static TypeScript** (not a database table, not a JSON file). It lives in `lib/schema-registry/` and is imported wherever needed. This gives:
- Full TypeScript type safety at build time
- Zero runtime fetch overhead
- Easy to read and update by non-developers (just TypeScript objects)
- Importable from both server (Server Actions, Route Handlers) and client (DynamicFieldForm, OutputPanel)

### Structure

```typescript
// lib/schema-registry/types.ts

export type AssetType =
  | 'truck'
  | 'trailer'
  | 'earthmoving'
  | 'agriculture'
  | 'forklift'
  | 'caravan'
  | 'general_goods'

export type FieldDefinition = {
  key: string            // internal key, used in DB and form state
  label: string          // Salesforce display label (exact copy)
  sfOrder: number        // position in Salesforce fields block output
  inputType: 'text' | 'number' | 'select' | 'textarea'
  options?: string[]     // for select fields
  aiExtractable: boolean // whether GPT-4o should attempt to fill this field
  required: boolean      // whether to show in required section of form
}

export type AssetSchema = {
  assetType: AssetType
  displayName: string
  fields: FieldDefinition[]
  hasGlassValuation: boolean  // true only for 'caravan'
  descriptionTemplate: (fields: Record<string, string>) => string
}
```

```typescript
// lib/schema-registry/schemas/truck.ts

import type { AssetSchema } from '../types'

export const truckSchema: AssetSchema = {
  assetType: 'truck',
  displayName: 'Truck',
  hasGlassValuation: false,
  fields: [
    { key: 'chassis_number', label: 'Chassis Number', sfOrder: 1, inputType: 'text', aiExtractable: true, required: false },
    { key: 'vin',            label: 'VIN',            sfOrder: 2, inputType: 'text', aiExtractable: true, required: true },
    { key: 'make',           label: 'Make',           sfOrder: 3, inputType: 'text', aiExtractable: true, required: true },
    { key: 'model',          label: 'Model',          sfOrder: 4, inputType: 'text', aiExtractable: true, required: true },
    { key: 'year',           label: 'Year',           sfOrder: 5, inputType: 'number', aiExtractable: true, required: true },
    // ... all ~35 truck fields in Salesforce order
  ],
  descriptionTemplate: (fields) => {
    // Deterministic template — no AI generation
    // Returns the exact formatted description string
    return [
      `${fields.year} ${fields.make} ${fields.model}`,
      fields.cab_type ? `Cab Type: ${fields.cab_type}` : '',
      // ... per-type field ordering
      'Sold As Is, Untested & Unregistered.',
    ].filter(Boolean).join('\n')
  },
}
```

```typescript
// lib/schema-registry/index.ts

import { truckSchema } from './schemas/truck'
import { trailerSchema } from './schemas/trailer'
import { earthmovingSchema } from './schemas/earthmoving'
import { agricultureSchema } from './schemas/agriculture'
import { forkliftSchema } from './schemas/forklift'
import { caravanSchema } from './schemas/caravan'
import { generalGoodsSchema } from './schemas/general-goods'
import type { AssetType, AssetSchema } from './types'

export const SCHEMA_REGISTRY: Record<AssetType, AssetSchema> = {
  truck: truckSchema,
  trailer: trailerSchema,
  earthmoving: earthmovingSchema,
  agriculture: agricultureSchema,
  forklift: forkliftSchema,
  caravan: caravanSchema,
  general_goods: generalGoodsSchema,
}

export function getSchema(assetType: AssetType): AssetSchema {
  return SCHEMA_REGISTRY[assetType]
}

export function getAIExtractableFields(assetType: AssetType): string[] {
  return SCHEMA_REGISTRY[assetType].fields
    .filter(f => f.aiExtractable)
    .map(f => f.key)
}

export function generateFieldsBlock(assetType: AssetType, values: Record<string, string>): string {
  const schema = SCHEMA_REGISTRY[assetType]
  return schema.fields
    .sort((a, b) => a.sfOrder - b.sfOrder)
    .map(f => `${f.label}: ${values[f.key] ?? ''}`)
    .join('\n')
}

export function generateDescription(assetType: AssetType, values: Record<string, string>): string {
  return SCHEMA_REGISTRY[assetType].descriptionTemplate(values)
}
```

### How the Registry Connects to Everything

| Consumer | What it uses |
|----------|--------------|
| `DynamicFieldForm` | `getSchema(assetType).fields` — renders one input per field |
| `ExtractionPanel` → `/api/extract` | `getAIExtractableFields(assetType)` — tells GPT-4o which fields to extract |
| `OutputPanel` | `generateFieldsBlock()` + `generateDescription()` — produces copy-paste text |
| Server Action (save asset) | `getSchema(assetType).fields.map(f => f.key)` — validates which keys to persist |
| DB schema | `asset_type` column + `fields` JSONB column stores free-form field values keyed by `FieldDefinition.key` |

---

## Recommended Project Structure

```
prestige_assets/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx            # Login page (public)
│   ├── (app)/                      # Route group — all require auth
│   │   ├── layout.tsx              # Authenticated shell (nav)
│   │   ├── assets/
│   │   │   ├── page.tsx            # Asset list (Server Component)
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # New asset wizard (Client-heavy)
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Asset detail/edit
│   │   └── page.tsx                # Redirect to /assets
│   ├── api/
│   │   └── extract/
│   │       └── route.ts            # AI extraction Route Handler (POST)
│   ├── layout.tsx                  # Root layout
│   └── globals.css
├── components/
│   ├── asset/
│   │   ├── PhotoCapture.tsx        # File picker + client-side resize
│   │   ├── AssetTypeSelector.tsx   # Type picker
│   │   ├── ExtractionPanel.tsx     # AI trigger + loading + result
│   │   ├── DynamicFieldForm.tsx    # Schema-driven field form
│   │   └── OutputPanel.tsx         # Copy-paste output blocks
│   └── ui/                         # Generic UI primitives (button, input, etc.)
├── lib/
│   ├── schema-registry/
│   │   ├── types.ts                # AssetType, FieldDefinition, AssetSchema
│   │   ├── index.ts                # Registry map + helper functions
│   │   └── schemas/
│   │       ├── truck.ts
│   │       ├── trailer.ts
│   │       ├── earthmoving.ts
│   │       ├── agriculture.ts
│   │       ├── forklift.ts
│   │       ├── caravan.ts
│   │       └── general-goods.ts
│   ├── supabase/
│   │   ├── client.ts               # createBrowserClient (client-side only)
│   │   └── server.ts               # createServerClient (server-side only)
│   ├── actions/
│   │   └── asset.actions.ts        # 'use server' — all DB mutations
│   └── utils/
│       └── image.ts                # Client-side resize helpers
├── middleware.ts                   # Auth guard + session refresh
├── next.config.ts
├── tsconfig.json
└── package.json
```

### Structure Rationale

- **`app/(auth)/` vs `app/(app)/`:** Route groups with separate layouts. The `(auth)` group has no nav shell; the `(app)` group wraps everything in the authenticated layout. The middleware redirects unauthenticated users to `/login` before they reach any `(app)` route.
- **`lib/schema-registry/` at top-level lib:** The registry is pure TypeScript with no client/server boundary. Keeping it in `lib/` (not `app/`) makes it importable from both Server Actions and Client Components without tree-shaking concerns.
- **`lib/actions/` separate from `app/`:** Centralises all Server Actions in one place, making it easy to audit what mutations exist. File has `'use server'` directive at the top.
- **`lib/supabase/client.ts` vs `server.ts`:** The two files enforce the boundary. Importing `server.ts` in a `'use client'` file will error at build time — making the separation enforceable.
- **`components/asset/`:** All asset-workflow components colocated. Not split by page — these components are reused across new and edit flows.

---

## Data Flow

### Core Workflow: Photo → AI Extract → Review → Output

```
1. User opens /assets/new

2. PhotoCapture (client)
   File picker → browser-image-compression (resize to ≤2MP)
   → supabase.storage.from('photos').upload(path, resizedFile)
   → receives storage path, adds to local state

3. AssetTypeSelector (client)
   User selects asset type
   → getSchema(assetType) called client-side from Schema Registry
   → DynamicFieldForm renders field inputs for that type

4. ExtractionPanel (client) — "Extract from photo" button
   POST /api/extract { assetId, photoStoragePaths, assetType }
   → Route Handler: verifies auth via Supabase ServerClient
   → Route Handler: generates signed URLs for the photo(s)
   → Route Handler: calls OpenAI GPT-4o with image URLs + field list
   → Route Handler: validates response with zod
   → returns { extractedFields: Record<string, string> }
   → client merges into DynamicFieldForm state (user can override)

5. DynamicFieldForm (client) — user reviews, edits fields

6. "Save" button
   → Server Action: saveAssetFields(assetId, assetType, fieldValues)
   → Supabase DB: upsert asset record
   → revalidatePath('/assets')

7. OutputPanel (client)
   generateFieldsBlock(assetType, fieldValues)    → copy block 1
   generateDescription(assetType, fieldValues)    → copy block 2
   (if caravan) generateGlassBlock(glassValues)   → copy block 3
   User copies each block and pastes into Salesforce
```

### Auth Flow

```
Request to any (app) route
   → middleware.ts runs
   → createServerClient reads session cookie
   → supabase.auth.getUser() — validates JWT
   → if no user: redirect /login
   → if user: refresh session cookie, pass request through
   → Server Component / Server Action inherits valid session
```

### Photo Upload Flow (detail)

```
Client: user selects file(s)
   → browser-image-compression: resize to max 2MP, max 1920px
   → supabase BrowserClient (anon key, RLS enforced)
   → storage.upload(`${userId}/${assetId}/${filename}`, blob)
   → returns { data: { path } } — store path in asset_photos table
   → Server Action: upsert asset_photos record with order index

Note: Direct client→Storage upload is the correct pattern.
Routing photos through a Server Action / Route Handler would
double the bandwidth and increase latency significantly.
Supabase Storage RLS policies enforce that only authenticated
users can write to their own prefix.
```

---

## Key Architectural Decisions

### Decision 1: Route Handler for AI, Server Actions for DB

**What:** `/api/extract/route.ts` is a POST Route Handler; all DB mutations are Server Actions.

**Why:** Next.js v15+ docs explicitly state Server Actions are queued (sequential). A ~10-second GPT-4o call as a Server Action would block the action queue. Route Handlers run independently, support streaming, and have a clear HTTP interface for the client to poll or stream from. DB mutations are fire-and-update — Server Actions are the right fit.

**Trade-off:** Two invocation patterns in the codebase. Acceptable — they serve different purposes and the boundary is clear.

### Decision 2: Schema Registry as Static TypeScript, Not DB

**What:** All per-type field definitions live in `lib/schema-registry/` as TypeScript files.

**Why:** These schemas change only when Salesforce changes its field names — a rare, intentional event that should require a deploy, not a runtime DB update. Static TypeScript gives type safety everywhere, zero query overhead, and a single source of truth that the compiler enforces.

**Trade-off:** Schema changes require a code deploy. Acceptable — this is an internal tool, deploys are fast, and the field labels are critical correctness concerns.

### Decision 3: Direct Client-to-Storage Upload

**What:** Photos upload directly from the browser to Supabase Storage using the anon key BrowserClient.

**Why:** Routing multi-MB photos through a Next.js server would double bandwidth, increase latency, and add complexity. Supabase Storage RLS policies handle authorization server-side. The Next.js server never touches binary image data.

**Trade-off:** Client has the Supabase anon key (via `NEXT_PUBLIC_*` env vars). This is safe — the anon key is designed to be public; RLS policies enforce access control.

### Decision 4: JSONB Fields Column in DB

**What:** Asset field values stored as `fields: jsonb` in the `assets` table, keyed by `FieldDefinition.key`.

**Why:** Each asset type has a different field set (Truck has ~35, General Goods has 1). A normalized table with one column per field would require schema migrations for every field addition. JSONB stores the complete field map, validated at the application layer by the Schema Registry.

**Trade-off:** Cannot query individual field values with simple SQL (requires `->>`). Acceptable — this app never needs "find all assets where engine_type = X" at MVP.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: AI Call via Server Action

**What people do:** Put the OpenAI call in a `'use server'` Server Action for simplicity.

**Why it's wrong:** Server Actions are queued (sequential). A 10-second AI call blocks all other actions. No streaming support. The user gets no feedback until the full response arrives.

**Do this instead:** Route Handler at `/api/extract` — client fetches with `fetch()`, can show a streaming spinner, and the handler runs independently.

### Anti-Pattern 2: ServerClient in Client Components

**What people do:** Import `lib/supabase/server.ts` into a `'use client'` component.

**Why it's wrong:** `createServerClient` uses `cookies()` from `next/headers` which only works in server context. It will throw at runtime. Also exposes server-only logic to the client bundle.

**Do this instead:** `lib/supabase/client.ts` (BrowserClient) in all `'use client'` components. Never mix.

### Anti-Pattern 3: Schema Registry in the Database

**What people do:** Store field definitions in a `field_schemas` table to make them "configurable."

**Why it's wrong:** Field labels and ordering are critical for Salesforce copy-paste correctness. A DB-driven schema adds query latency, loses type safety, and makes accidental breakage harder to detect. "Configurability" is not a MVP requirement.

**Do this instead:** Static TypeScript in `lib/schema-registry/`. Changes require a deliberate deploy.

### Anti-Pattern 4: AI Generating Description Text

**What people do:** Ask GPT-4o to write the description block.

**Why it's wrong:** PROJECT.md explicitly prohibits this. Descriptions must follow strict per-type field ordering, no dot points, no marketing language, and a fixed footer. AI text generation is non-deterministic and cannot be relied on for correctness. This is also a security/quality constraint for an ISO 27001-certified business.

**Do this instead:** `descriptionTemplate()` function in each schema file — deterministic string interpolation from confirmed field values.

### Anti-Pattern 5: Skipping Middleware Auth Check in Route Handler

**What people do:** Assume the Route Handler at `/api/extract` is protected because the app has middleware.

**Why it's wrong:** The Next.js middleware protects page routes, but a determined client can POST to `/api/extract` directly. The Route Handler must independently verify the Supabase session before calling the OpenAI API.

**Do this instead:** Call `createClient()` (ServerClient) at the top of the handler, call `supabase.auth.getUser()`, and return 401 if no user.

---

## Build Order (Phase Dependencies)

The architecture creates a clear dependency chain. Phases must be built in this order:

```
1. Foundation
   - Next.js project scaffold (App Router)
   - Supabase project + DB schema (assets, asset_photos tables)
   - Auth: middleware + login page + session management
   - Supabase client/server wrappers

   MUST EXIST BEFORE: Everything else

2. Schema Registry
   - lib/schema-registry/types.ts
   - All 7 schema files (truck, trailer, earthmoving, agriculture, forklift, caravan, general-goods)
   - lib/schema-registry/index.ts with helper functions

   MUST EXIST BEFORE: DynamicFieldForm, ExtractionPanel, OutputPanel, Route Handler

3. Photo Capture + Storage
   - PhotoCapture component (file picker, resize, direct upload)
   - Supabase Storage bucket + RLS policies
   - asset_photos Server Action (save photo paths + order)

   MUST EXIST BEFORE: AI Extraction (needs photos in storage to extract from)

4. AI Extraction
   - /api/extract Route Handler
   - OpenAI integration (GPT-4o structured output)
   - ExtractionPanel component (trigger + loading state + result display)

   MUST EXIST BEFORE: Full end-to-end workflow test

5. Review + Save
   - DynamicFieldForm (schema-driven, pre-filled from extraction)
   - Save Server Action
   - revalidation after save

   MUST EXIST BEFORE: Output generation (needs saved/confirmed field values)

6. Output Generation
   - OutputPanel (generateFieldsBlock + generateDescription + Glass's Valuation)
   - Copy-to-clipboard UX
   - End-to-end workflow complete

7. Asset List + Navigation
   - Assets list page (Server Component)
   - Routing between list → new → detail
   - Edit existing record flow

   Can be built in parallel with steps 3-6 once Foundation is done
```

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI GPT-4o | REST API via `openai` npm package — called from Route Handler only | API key in `OPENAI_API_KEY` env var, never `NEXT_PUBLIC_*`. Use structured outputs (JSON mode) with zod schema validation |
| Supabase Auth | `@supabase/ssr` package — BrowserClient for client login, ServerClient + middleware for session management | Session stored in httpOnly cookie. `getUser()` on every server request |
| Supabase Storage | BrowserClient for direct upload (client), ServerClient for generating signed read URLs (Route Handler needs these to pass to OpenAI) | Bucket: `photos`. RLS: users can only read/write their own `userId/` prefix |
| Supabase PostgreSQL | ServerClient via Server Actions for all writes; Server Components for reads | Row Level Security on `assets` and `asset_photos` tables: `auth.uid() = user_id` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client Component → AI extraction | `fetch('POST /api/extract')` | Not a Server Action — intentional. See Decision 1 above |
| Client Component → DB mutations | Server Action import (`'use server'` file) | Type-safe, no HTTP overhead |
| Server Action → Supabase | `createClient()` from `lib/supabase/server.ts` | Must await `cookies()` in Next.js 15+ |
| Route Handler → Supabase Storage | ServerClient generates short-lived signed URLs; passes URLs to OpenAI | Signed URLs expire — generate per-request |
| Schema Registry → any consumer | Direct TypeScript import | No HTTP, no dynamic loading |

---

## Scaling Considerations

This is an internal tool for a small team (Slattery Auctions Brisbane). Scaling to thousands of concurrent users is not a requirement. Notes for completeness:

| Scale | Architecture Notes |
|-------|--------------------|
| 1-10 users (MVP) | Single Supabase free/pro project. No caching layer needed. Default Next.js behaviour. |
| 10-50 users | Supabase connection pooling (already built-in via pgBouncer). OpenAI rate limits may need monitoring. |
| 50+ users | No architectural changes required. OpenAI tier upgrade if needed. Supabase scales automatically. |

First bottleneck: OpenAI API rate limits and latency under concurrent use. Mitigation: queue on the client (don't allow concurrent extractions per user), add basic request deduplication in the Route Handler.

---

## Sources

- Next.js official docs v16.1.7 (updated 2026-03-16): Server Actions and Mutations — https://nextjs.org/docs/app/getting-started/updating-data
- Next.js official docs v16.1.7 (updated 2026-03-16): Route Handlers — https://nextjs.org/docs/app/api-reference/file-conventions/route
- Next.js official docs v16.1.7 (updated 2026-03-16): Backend for Frontend guide — https://nextjs.org/docs/app/guides/backend-for-frontend
- Next.js official docs v16.1.7 (updated 2026-03-16): Project Structure — https://nextjs.org/docs/app/getting-started/project-structure
- Supabase SSR package pattern: `@supabase/ssr` with `createServerClient` / `createBrowserClient`
- Project constraints: PROJECT.md (AI keys server-only, deterministic descriptions, copy-paste output)

---

*Architecture research for: prestige_assets — AI-powered asset book-in web tool*
*Researched: 2026-03-17*
