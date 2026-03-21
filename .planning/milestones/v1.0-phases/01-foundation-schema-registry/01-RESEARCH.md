# Phase 1: Foundation + Schema Registry — Research

**Researched:** 2026-03-17
**Domain:** Next.js 15 App Router scaffold, Supabase auth/DB/Storage setup, Schema Registry as static TypeScript
**Confidence:** HIGH — all canonical references pre-exist in `.planning/research/`; this document synthesises them for Phase 1 specifically

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**App Shell**
- Clean & functional visual style — white/light background, clear typography, no decoration; readable in bright outdoor/on-site light
- Login page: Slattery logo + email/password form + sign in button (minimal branded)
- Post-login landing: Asset list with a prominent "New Asset" button on the same screen
- Mobile layout: portrait/vertical orientation optimised, iOS-style feel, bottom tab bar or equivalent — staff use phones in portrait on-site exclusively

**New Asset Entry Flow**
1. Branch selection (remembered from last used, can change)
2. Asset type selection (grid of cards, icon + label, Salesforce-familiar layout)
3. Asset subtype selection (two-step: type → subtype)
4. Then proceeds to photo capture (Phase 2)

**Branches — fixed list, hardcoded in v1**
- Brisbane (QLD), Roma (QLD), Mackay (QLD), Newcastle (NSW), Sydney (NSW), Canberra (ACT), Melbourne (VIC), Perth (WA), Adelaide (SA), Karratha (WA)

**Asset Types (v1 — 7 types)**
- Truck, Trailer, Earthmoving, Agriculture, Forklift, Caravan/Motor Home, General Goods

**Asset Subtypes — every type has subtypes**
- Earthmoving: Excavator, Dozer, Grader, Wheel Loader, Skid Steer/CTL, Backhoe, Telehandler
- Caravan/Motor Home: Caravan, Motor Home, Camper Trailer
- Truck: Prime Mover, Rigid Truck, Tipper, Service Truck, Crane Truck
- Trailer: Flat Top, Drop Deck, Side Tipper, Dog Trailer, B-Double, Semi-Trailer
- Agriculture: Tractor, Header/Combine, Sprayer, Planter, Baler, Cultivation
- Forklift: Counterbalance, Reach Truck, Order Picker, Telehandler (Forklift type)
- General Goods: General (single subtype)

**Schema Registry Fidelity**
- Build from PROJECT.md field schemas as the starting point
- Field schemas are approximately correct but may have gaps — not confirmed against live Salesforce
- Field-correction pass deferred to Phase 5 (Output Generation)
- Schema Registry must be easily correctable — field label and ordering changes require editing one file only

**Security (hard constraints)**
- API keys are server-only (no `NEXT_PUBLIC_` prefix for AI keys; `server-only` import guard in place)
- Supabase Storage bucket is private
- RLS is enabled on all tables from day one

### Claude's Discretion
- Exact subtype lists per type (draft from reference project, Jack confirms in Phase 5)
- Bottom tab bar vs FAB pattern for mobile nav (iOS-style, portrait-optimised)
- Loading skeleton designs
- Error state handling (auth errors, network failures)
- Exact DB column types beyond what's specified in plans

### Deferred Ideas (OUT OF SCOPE)
- Extended asset types (Mining, Motor Vehicles, Crane, Marine, Portable Buildings, Bus, Rail, Aviation) — deferred to v2
- Admin UI for managing branches — hardcoded list sufficient for v1
- Full subtype list confirmation — Jack to confirm/correct during Phase 5
- Field schema corrections — defer to Phase 5; catch errors when copy-paste accuracy is tested against live Salesforce

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can log in with email and password | Supabase `signInWithPassword()` via BrowserClient in login page; `@supabase/ssr` package; confirmed pattern in ARCHITECTURE.md |
| AUTH-02 | User session persists across browser refresh | `middleware.ts` runs on every request, calls `supabase.auth.getUser()` and refreshes cookie; `@supabase/ssr` cookie-based session — confirmed working pattern |
| ASSET-01 | User can create a new asset record | Server Action `createAsset()` writes to `assets` table with Supabase ServerClient; DB schema section covers `assets` table structure |
| ASSET-02 | User can select asset type (7 valid types) | Asset type selection is the third step of the New Asset flow (after branch selection); type stored on asset record; Schema Registry validates the 7 valid type values |

</phase_requirements>

---

## Summary

Phase 1 establishes every load-bearing foundation element that all downstream phases depend on. There are three distinct workstreams: (1) Next.js 15 scaffold with auth middleware and the login page, (2) Supabase DB schema with `assets` and `asset_photos` tables plus RLS, and (3) the Schema Registry — seven TypeScript files covering all asset types and subtypes. All research for the underlying stack already exists in `.planning/research/`; this document synthesises the Phase 1-specific decisions, patterns, and constraints the planner needs.

The UI-SPEC (`01-UI-SPEC.md`) is approved and locked. The design is dark green (#166534) with white text — not the "white/light background" noted in initial decisions; the UI-SPEC supersedes that early note. Colours, copy, spacing, and component list are all specified. The planner must implement against the UI-SPEC, not the higher-level CONTEXT.md visual description.

The Schema Registry is the most load-bearing deliverable in this phase — it drives AI extraction (Phase 3), the review form (Phase 4), and output formatting (Phase 5). It must be built as static TypeScript (not DB), one file per asset type, with subtypes embedded in each schema. Phase 5 will correct any field errors once copy-paste accuracy can be tested against live Salesforce; the registry only needs to be _easily correctable_, not perfectly accurate at the end of Phase 1.

**Primary recommendation:** Build in plan order — scaffold + auth first, then DB schema, then Schema Registry. Each plan can be verified independently before the next begins.

---

## Standard Stack

### Core (Phase 1 scope)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x (App Router) | Full-stack framework | Official current stable; App Router + React 19 is the standard path. Server Components keep AI keys server-side. |
| React | 19.x | UI runtime | Ships with Next.js 15. `useActionState` replaces `useFormStatus` workarounds. |
| TypeScript | 5.x | Type safety | Required for Schema Registry typing + Zod schema ↔ TypeScript inference. |
| `@supabase/supabase-js` | ^2.x | PostgreSQL + Storage + Auth | Single SDK for all backend needs. |
| `@supabase/ssr` | ^0.5.x | Auth for App Router | Replaces the deprecated `@supabase/auth-helpers-nextjs`. Cookie-based sessions. **Do not use the deprecated package.** |
| Tailwind CSS | ^3.4 | Styling | Standard pairing with Next.js; shadcn/ui is built on it. |
| shadcn/ui | latest (CLI) | Component primitives | UI-SPEC mandates zinc preset. Installed via `npx shadcn init`, not `npm install`. |
| `lucide-react` | ^0.4xx | Icons | Ships with shadcn/ui. Asset type icon grid uses these. |
| `zod` | ^3.x | Schema validation | Required for Schema Registry types and future AI extraction. Define once, get TypeScript types + runtime validation. |
| `clsx` + `tailwind-merge` | ^2.x | Class merging | Standard `cn()` helper pattern for shadcn/ui. |
| `server-only` | latest | Security guard | Prevents accidental client-side import of server modules. Required on all AI utility files. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Supabase CLI | Local dev, migrations, type generation | `supabase start` for local Postgres + Auth + Storage. `supabase gen types typescript` generates typed client. Essential. |
| Turbopack | Dev server bundler | `next dev --turbo` is stable in Next.js 15. Use it. |
| ESLint + `eslint-config-next` | Linting | Ships with Next.js. Next.js 15 supports ESLint 9 flat config. |
| Prettier + `prettier-plugin-tailwindcss` | Formatting | Auto-sorts Tailwind classes. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | Auth helpers is deprecated — do not use |
| Static TypeScript Schema Registry | DB-driven schema table | DB adds query latency, loses type safety, adds accidental breakage risk — no benefit for MVP |
| shadcn/ui zinc preset | Custom design | UI-SPEC is locked — zinc preset with custom brand colours specified |

**Installation (Phase 1 only):**
```bash
# Scaffold
npx create-next-app@latest prestige-assets --typescript --tailwind --app --src-dir --import-alias "@/*"

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Validation
npm install zod

# UI
npm install clsx tailwind-merge lucide-react
npx shadcn init   # select zinc preset
npx shadcn add button input card label badge separator

# Security
npm install server-only

# Dev
npm install -D @types/node supabase
```

---

## Architecture Patterns

### Recommended Project Structure

```
prestige_assets/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # Login page (public route)
│   ├── (app)/                        # Route group — all require auth
│   │   ├── layout.tsx                # Authenticated shell (nav)
│   │   └── assets/
│   │       ├── page.tsx              # Asset list — Phase 1 shell only
│   │       └── new/
│   │           └── page.tsx          # New asset wizard steps 1-3
│   ├── layout.tsx                    # Root layout (Inter font, globals)
│   └── globals.css
├── components/
│   ├── asset/
│   │   ├── BranchSelector.tsx        # Step 1 — branch chip list
│   │   ├── AssetTypeSelector.tsx     # Step 2 — 7-card type grid
│   │   └── AssetSubtypeSelector.tsx  # Step 3 — subtype list
│   └── ui/                           # shadcn/ui components (button, input, card, etc.)
├── lib/
│   ├── schema-registry/
│   │   ├── types.ts                  # AssetType, FieldDefinition, AssetSchema, SubtypeSchema
│   │   ├── index.ts                  # Registry map + helper functions
│   │   └── schemas/
│   │       ├── truck.ts
│   │       ├── trailer.ts
│   │       ├── earthmoving.ts
│   │       ├── agriculture.ts
│   │       ├── forklift.ts
│   │       ├── caravan.ts
│   │       └── general-goods.ts
│   ├── supabase/
│   │   ├── client.ts                 # createBrowserClient (client-side only)
│   │   └── server.ts                 # createServerClient (server-side only)
│   └── actions/
│       └── asset.actions.ts          # 'use server' — createAsset, etc.
├── middleware.ts                      # Auth guard + session refresh
├── next.config.ts
├── tsconfig.json
└── package.json
```

### Pattern 1: Supabase BrowserClient (Client Components only)

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

Used in: `LoginForm` (`signInWithPassword`). Never import in Server Components or Server Actions.

### Pattern 2: Supabase ServerClient (Server Components, Actions, Route Handlers)

```typescript
// lib/supabase/server.ts
import 'server-only'
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

The `server-only` import at the top causes a build error if this file is ever accidentally imported into a `'use client'` component. Note: `cookies()` must be `await`ed in Next.js 15.

### Pattern 3: Middleware Auth Guard

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

### Pattern 4: Schema Registry Types

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

export type AssetSubtype = {
  key: string           // internal snake_case key
  label: string         // display label
}

export type FieldDefinition = {
  key: string           // internal key — used in DB and form state
  label: string         // exact Salesforce display label (copy-paste)
  sfOrder: number       // position in Salesforce fields block output
  inputType: 'text' | 'number' | 'select' | 'textarea'
  options?: string[]    // for select fields
  aiExtractable: boolean
  required: boolean
}

export type AssetSchema = {
  assetType: AssetType
  displayName: string
  subtypes: AssetSubtype[]
  fields: FieldDefinition[]
  hasGlassValuation: boolean   // true only for 'caravan'
  descriptionTemplate: (fields: Record<string, string>, subtype: string) => string
}
```

**Critical note on subtypes in the registry:** The `type + subtype` pair drives both the Salesforce field schema and the description template. General Goods has a single subtype ('general') with only a description field. The registry's `subtypes` array drives the step-3 picker UI and is the source of truth for valid type/subtype combinations.

### Pattern 5: Schema Registry Index

```typescript
// lib/schema-registry/index.ts
import { truckSchema } from './schemas/truck'
// ... all 7 imports

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

export function getSubtypes(assetType: AssetType): AssetSubtype[] {
  return SCHEMA_REGISTRY[assetType].subtypes
}

export function getAIExtractableFields(assetType: AssetType): string[] {
  return SCHEMA_REGISTRY[assetType].fields
    .filter(f => f.aiExtractable)
    .map(f => f.key)
}
```

### Pattern 6: DB Schema (Supabase SQL migration)

```sql
-- assets table
create table public.assets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  branch      text not null,
  asset_type  text not null,
  asset_subtype text not null,
  fields      jsonb not null default '{}',
  status      text not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Enable RLS immediately
alter table public.assets enable row level security;

-- RLS policy: users can only access their own records
create policy "users_own_assets"
  on public.assets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- asset_photos table
create table public.asset_photos (
  id          uuid primary key default gen_random_uuid(),
  asset_id    uuid not null references public.assets(id) on delete cascade,
  storage_path text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.asset_photos enable row level security;

-- RLS via join to assets
create policy "users_own_asset_photos"
  on public.asset_photos
  for all
  using (
    exists (
      select 1 from public.assets
      where assets.id = asset_photos.asset_id
        and assets.user_id = auth.uid()
    )
  );
```

**Why JSONB for fields:** Each asset type has a different field set (Truck ~35 fields, General Goods 1 field). JSONB stores the complete field map keyed by `FieldDefinition.key`, validated at the application layer by the Schema Registry. This avoids schema migrations for every field addition and handles the heterogeneous per-type schemas cleanly.

### Pattern 7: createAsset Server Action

```typescript
// lib/actions/asset.actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAsset(
  branch: string,
  assetType: string,
  assetSubtype: string
): Promise<{ assetId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('assets')
    .insert({
      user_id: user.id,
      branch,
      asset_type: assetType,
      asset_subtype: assetSubtype,
      fields: {},
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/assets')
  return { assetId: data.id }
}
```

### Pattern 8: New Asset Wizard Step Flow

The three-step wizard at `/assets/new` manages selection state client-side. On step 3 completion, it calls `createAsset()` and redirects to the asset detail page (Phase 2 stub).

```typescript
// Wizard state (client component)
type WizardState = {
  step: 1 | 2 | 3
  branch: string | null
  assetType: AssetType | null
  assetSubtype: string | null
}
```

Last-used branch: persist to `localStorage` with key `lastUsedBranch`. Read on mount to pre-select.

### Anti-Patterns to Avoid

- **`@supabase/auth-helpers-nextjs`:** Deprecated. Import `@supabase/ssr` only.
- **Server Actions for AI calls:** Server Actions are queued/sequential. AI calls must use Route Handlers. (Phase 3 concern, but establish the pattern now.)
- **Schema Registry in a DB table:** No runtime configurability needed; static TypeScript gives type safety and zero latency.
- **`NEXT_PUBLIC_` prefix on AI keys:** The anon Supabase key can be `NEXT_PUBLIC_*` (it's designed to be). OpenAI/AI keys must never have this prefix.
- **Using `cookies()` without `await` in Next.js 15:** The `cookies()` call is async in Next.js 15 — always `await` it.
- **Skipping `shadcn init` before `shadcn add`:** Components will fail to install without the base configuration file (`components.json`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie-based Supabase session management | Custom session cookie parsing | `@supabase/ssr` `createServerClient` + `createBrowserClient` | Session refresh, token rotation, and SameSite handling have many edge cases |
| Auth middleware | Custom JWT validation in middleware | `@supabase/ssr` pattern with `supabase.auth.getUser()` | getUser validates with Supabase server; local JWT decode doesn't catch invalidated sessions |
| Mobile-accessible UI components | Custom input/button/card components | `shadcn/ui` (UI-SPEC mandates it) | Radix UI accessibility primitives handle focus management, keyboard nav, ARIA |
| TypeScript type generation from DB | Hand-typed DB types | `supabase gen types typescript --local > lib/database.types.ts` | Types stay in sync with schema; free with Supabase CLI |

**Key insight:** The `@supabase/ssr` session management pattern looks like boilerplate but handles token expiry, refresh timing, and cookie attributes correctly across all request types (Server Components, Server Actions, Route Handlers, middleware). Do not attempt to simplify it.

---

## Common Pitfalls

### Pitfall 1: `cookies()` not awaited in Next.js 15
**What goes wrong:** `const cookieStore = cookies()` without `await` silently returns a Promise object instead of the cookie store. Subsequent `.getAll()` calls fail at runtime, breaking auth.
**Why it happens:** All prior tutorials and most Stack Overflow answers show the synchronous version from Next.js 14.
**How to avoid:** Always `const cookieStore = await cookies()` in server context. The Supabase SSR docs have been updated for this; check the current example code, not cached tutorials.
**Warning signs:** Auth appears to work locally but sessions don't persist, or middleware redirects loop.

### Pitfall 2: Importing `server.ts` in a client component
**What goes wrong:** `lib/supabase/server.ts` uses `cookies()` from `next/headers` which only runs in server context. Importing it in a `'use client'` component throws a runtime error and may expose server logic in the client bundle.
**How to avoid:** Add `import 'server-only'` at the top of `lib/supabase/server.ts`. This converts a runtime error into a build-time error — immediately caught, not discovered in production.

### Pitfall 3: RLS not enabled before first write
**What goes wrong:** Tables created without RLS enabled accept writes from any authenticated user. Adding RLS later requires auditing and potentially cleaning up cross-user data.
**How to avoid:** Enable RLS and add the `user_id = auth.uid()` policy in the same migration that creates the table. The SQL migration template above does this correctly.

### Pitfall 4: `shadcn init` preset mismatch
**What goes wrong:** Running `shadcn init` with the wrong theme (e.g. default/slate) then running `shadcn add` produces components with the wrong CSS variables. The dark green brand colours from the UI-SPEC cannot be applied over the wrong base.
**How to avoid:** UI-SPEC mandates zinc preset. Run `npx shadcn init` and select zinc. Then apply the brand colour overrides (`#166534`, `#14532D`, `#1E3A5F`) via CSS variable overrides in `globals.css`.

### Pitfall 5: Schema Registry subtypes not structured for the picker UI
**What goes wrong:** If subtypes are just a flat `string[]`, the picker component has no ability to distinguish between asset types at the type level and can't enforce that a valid subtype was selected for the given type.
**How to avoid:** Use `AssetSubtype[]` (key + label) as defined in the types pattern above. The `key` is stored in the DB; the `label` is displayed in the UI. This allows display labels to differ from stored keys without losing type safety.

### Pitfall 6: Branch stored as display string, not a key
**What goes wrong:** Storing `"Brisbane (QLD)"` in the DB means any label change requires a data migration. Filtering or grouping by state is impossible without string parsing.
**How to avoid:** Store a stable key (e.g. `"brisbane"`) in the DB; display the human label from a hardcoded map in the UI. The branch list is small enough that a simple constant works.

---

## Code Examples

### Verified pattern: Environment variables for Phase 1

```bash
# .env.local (never commit — in .gitignore by default)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]   # server-only, no NEXT_PUBLIC_
# AI keys NOT needed in Phase 1 — added in Phase 3
# OPENAI_API_KEY=[key]   # never NEXT_PUBLIC_
```

### Verified pattern: Asset type constants

```typescript
// lib/schema-registry/types.ts

export const ASSET_TYPES = [
  'truck',
  'trailer',
  'earthmoving',
  'agriculture',
  'forklift',
  'caravan',
  'general_goods',
] as const

export type AssetType = (typeof ASSET_TYPES)[number]

// Branch constant
export const BRANCHES = [
  { key: 'brisbane',   label: 'Brisbane (QLD)' },
  { key: 'roma',       label: 'Roma (QLD)' },
  { key: 'mackay',     label: 'Mackay (QLD)' },
  { key: 'newcastle',  label: 'Newcastle (NSW)' },
  { key: 'sydney',     label: 'Sydney (NSW)' },
  { key: 'canberra',   label: 'Canberra (ACT)' },
  { key: 'melbourne',  label: 'Melbourne (VIC)' },
  { key: 'perth',      label: 'Perth (WA)' },
  { key: 'adelaide',   label: 'Adelaide (SA)' },
  { key: 'karratha',   label: 'Karratha (WA)' },
] as const

export type BranchKey = (typeof BRANCHES)[number]['key']
```

### Verified pattern: Asset type to lucide-react icon mapping

```typescript
// components/asset/AssetTypeSelector.tsx
import { Truck, Container, HardHat, Tractor, Package2, Caravan, ShoppingBag } from 'lucide-react'
import type { AssetType } from '@/lib/schema-registry/types'

const ASSET_TYPE_ICONS: Record<AssetType, React.ComponentType> = {
  truck:        Truck,
  trailer:      Container,
  earthmoving:  HardHat,
  agriculture:  Tractor,
  forklift:     Package2,
  caravan:      Caravan,
  general_goods: ShoppingBag,
}

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  truck:        'Truck',
  trailer:      'Trailer',
  earthmoving:  'Earthmoving',
  agriculture:  'Agriculture',
  forklift:     'Forklift',
  caravan:      'Caravan / Motor Home',
  general_goods: 'General Goods',
}
```

Note: Verify the exact lucide-react icon names available at install time — some names may differ across versions. `Caravan` may not exist; `Camper` or `Tent` could substitute.

### Verified pattern: Login form (Client Component)

```typescript
// app/(auth)/login/page.tsx is a Server Component wrapper
// The form itself is a 'use client' component

'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.get('email') as string,
      password: form.get('password') as string,
    })
    if (error) {
      setError('Incorrect email or password. Please try again.')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  // ... render form with UI-SPEC copy and colours
}
```

---

## UI-SPEC Synthesis (Phase 1 specific)

The approved `01-UI-SPEC.md` specifies all visual and interaction details. Key extracts the planner must carry into task descriptions:

**Colour system (dark green brand, not light):**
- Primary background: `#166534`
- Secondary/elevated: `#14532D`
- Navy accent (buttons, active states): `#1E3A5F`
- Text primary: `#FFFFFF`
- Text muted: `rgba(255,255,255,0.65)`
- Destructive: `#F87171`

**shadcn/ui components to install (Phase 1 only):**
`button`, `input`, `card`, `label`, `badge`, `separator`

**Screens in scope (Phase 1):**
1. `/login` — Slattery Auctions heading, Book-in tool subheading, email + password + Sign In button
2. `/` — Asset list placeholder + "New Asset" FAB/button (empty state: "No assets yet" / "Tap New Asset to start booking in an asset.")
3. `/assets/new` step 1 — "Select Branch" heading, scrollable chip list, last-used branch pre-selected
4. `/assets/new` step 2 — "Asset Type" heading, 2-column card grid (portrait) with lucide icon + label
5. `/assets/new` step 3 — "{Type} — Subtype" heading, subtype list

**Touch targets:** minimum 44px height on all interactive elements; branch chips and type cards minimum 48px.

**Loading states:**
- Page load auth check: centered `Loader2` spinner (white) on green background — do not flash login page
- Sign In button: replace label with `Loader2` spinner, disable button, maintain width

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | ~2024 | Must use new package; old package receives no updates |
| `cookies()` synchronous | `await cookies()` in Next.js 15 | Next.js 15 (Oct 2024) | All server.ts `createClient()` functions must be async |
| `npx create-next-app` asks about App Router | App Router is now the default | Next.js 13+ (stable Next.js 14+) | No flag needed; App Router is selected by default |
| Page Router | App Router | Next.js 13 (stable 14) | New projects start with App Router only |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. Do not use.
- `@next/font` (external package): Removed in Next.js 15. Use `next/font` built-in.
- Page Router: In maintenance mode. Not for new projects.

---

## Open Questions

1. **lucide-react icon for Caravan/Motor Home type**
   - What we know: lucide-react ships with shadcn/ui; icon names vary by version
   - What's unclear: Whether a `Caravan` or `Camper` icon exists in the version installed
   - Recommendation: Check `node_modules/lucide-react/dist/esm/icons/` after install; substitute `Home` or `Tent` if needed

2. **Supabase Storage bucket creation (manual vs migration)**
   - What we know: Storage buckets can be created via the Supabase dashboard, CLI, or JS SDK
   - What's unclear: Whether the `supabase migration` system covers Storage bucket creation or if it must be done separately
   - Recommendation: Create the `photos` bucket as a manual step during Supabase setup (Plan 01-02) and document it in the plan's verification steps

3. **shadcn/ui zinc + brand colour override**
   - What we know: UI-SPEC specifies dark green (#166534) backgrounds; zinc preset provides neutral greys
   - What's unclear: Exact CSS variable names to override in `globals.css` for the brand colours
   - Recommendation: After `npx shadcn init`, inspect the generated `globals.css` for the `--background`, `--card`, `--primary` variables and override them with the brand hex values

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — greenfield project |
| Config file | Wave 0 — create `jest.config.ts` or equivalent |
| Quick run command | `npm test -- --passWithNoTests` |
| Full suite command | `npm test` |

**Recommended test setup for this phase:**

Given this is a Next.js 15 project, the standard test setup is Vitest (preferred with App Router for its ESM support) or Jest with the Next.js jest preset.

```bash
# Vitest setup (recommended)
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom' },
})
```

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `signInWithPassword` called with email+password; redirects on success | unit (mock Supabase) | `npx vitest run src/__tests__/login.test.ts` | Wave 0 |
| AUTH-02 | Middleware redirects unauthenticated requests to `/login`; passes authenticated | unit (mock cookies) | `npx vitest run src/__tests__/middleware.test.ts` | Wave 0 |
| ASSET-01 | `createAsset()` Server Action inserts record, returns `assetId` | unit (mock Supabase) | `npx vitest run src/__tests__/asset.actions.test.ts` | Wave 0 |
| ASSET-02 | Schema Registry contains exactly 7 asset types; each has `subtypes[]` with at least 1 entry | unit (pure TS) | `npx vitest run src/__tests__/schema-registry.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --passWithNoTests` (allows commits before tests exist)
- **Per wave merge:** `npm test` (full suite green)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/login.test.ts` — covers AUTH-01 (LoginForm calls `signInWithPassword` with correct args)
- [ ] `src/__tests__/middleware.test.ts` — covers AUTH-02 (middleware redirects unauthenticated, passes authenticated)
- [ ] `src/__tests__/asset.actions.test.ts` — covers ASSET-01 (`createAsset` inserts and returns ID)
- [ ] `src/__tests__/schema-registry.test.ts` — covers ASSET-02 (all 7 types present, subtypes non-empty, field sfOrder values are unique per type)
- [ ] `vitest.config.ts` — framework config
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — full stack research, verified from official Next.js docs and training knowledge
- `.planning/research/ARCHITECTURE.md` — App Router patterns, Supabase client patterns, Schema Registry design; all code examples verified from official sources
- `.planning/research/PITFALLS.md` — comprehensive pitfall list for this exact stack
- `.planning/PROJECT.md` — Salesforce field schemas, project constraints, key decisions
- `.planning/phases/01-foundation-schema-registry/01-CONTEXT.md` — locked implementation decisions
- `.planning/phases/01-foundation-schema-registry/01-UI-SPEC.md` — approved visual/interaction contract
- Next.js 15 official docs (nextjs.org) — Server Actions, App Router, middleware patterns

### Secondary (MEDIUM confidence)
- `@supabase/ssr` package pattern — official Supabase recommendation; verify minor version at install time (`^0.5.x`)
- shadcn/ui zinc preset + CSS variable override pattern — CLI-based, verify variable names in generated `globals.css`

### Tertiary (LOW confidence)
- Vitest setup for Next.js 15 App Router — training knowledge; verify at `vitest.dev` and `nextjs.org/docs/app/guides/testing` at install time

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed in pre-existing `.planning/research/STACK.md` with official source citations
- Architecture patterns: HIGH — patterns confirmed from official Next.js docs (v16.1.7) in ARCHITECTURE.md
- Pitfalls: HIGH — drawn from PITFALLS.md, cross-referenced against well-established patterns
- UI-SPEC: HIGH — approved document, locked decisions
- Validation architecture: MEDIUM — Vitest setup pattern is training knowledge; verify docs at setup time

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable stack — `@supabase/ssr` minor version worth rechecking at install time)
