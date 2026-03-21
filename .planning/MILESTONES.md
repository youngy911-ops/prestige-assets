# Milestones

## v1.0 MVP (Shipped: 2026-03-21)

**Phases completed:** 7 phases, 21 plans
**Timeline:** 2026-03-17 → 2026-03-21 (4 days)
**Stats:** 215 files changed, ~6,975 lines of TypeScript, 140 commits

**Key accomplishments:**
1. Next.js app scaffolded with Supabase auth and Schema Registry for 7 asset types (Truck, Trailer, Earthmoving, Agriculture, Forklift, Caravan, General Goods)
2. Mobile-first photo upload with EXIF orientation correction, client-side 2MP resize, drag-to-reorder cover photo order persisted to Supabase Storage
3. GPT-4o extraction pipeline via Route Handler — per-field confidence scores, optional inspection notes, photos-only workflow fully supported
4. Dynamic react-hook-form review form with mandatory missing-info checklist, blocking field enforcement (VIN, rego), and re-extraction path
5. Copy-paste-ready Salesforce output — GPT-4o description generation + deterministic fields block with per-block clipboard buttons
6. Asset list with recency sorting, status badges, resume-editing routing, BottomNav for mobile and desktop
7. AI extraction quality uplift — aiHint field annotations across all schemas, 25+ new fields enabled for earthmoving/agriculture/forklift/trailer, explicit plate-type routing in system prompt

---

