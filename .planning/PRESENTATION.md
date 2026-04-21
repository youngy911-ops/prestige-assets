# Asset Book-In App — Presentation Pack
*Manager presentation + IT supporting document + Q&A talking points*
*Updated: 2026-04-21 | Demo target: week of 2026-04-21*

---

## SLIDE 0 — Opening

> **"A book-in that takes 15 minutes today takes 1 minute with Salesforce API access. Here's what I've built, and here's what I need to get there."**

---

## SLIDE 1 — The Problem

**Manual book-in takes 10–15 minutes per asset. Most of that is research and typing, not inspection.**

Current process for every asset:
- Photograph asset on site
- Research specs (make, model, year, GVM, GCM, engine, etc.)
- Type data field-by-field into Salesforce
- Write auction description manually

The inspection itself is quick. The bottleneck is everything that happens after — specs research, data entry, description writing. That's what's eating the time.

---

## SLIDE 2 — The Solution

**Asset Book-In AI App — photos in, Salesforce-ready data out.**

Built independently, outside work hours.

How it works:
1. Field worker photographs asset (focus on compliance plate)
2. Uploads photos to the app
3. App extracts VIN, make, model, year, engine, GVM/GCM, etc. from the plate
4. App generates a Salesforce-ready record and auction description
5. User reviews, then data goes into Salesforce

Supported asset categories: trucks, trailers, earthmoving, agricultural, forklifts, marine, caravans, motor vehicles, general goods.

---

## SLIDE 3 — Live Demo

*No text — walk through 2–3 real assets live.*

Suggested demo order:
1. **Clean case** — common vehicle with a clear compliance plate (fast, clean extraction)
2. **Messy case** — older machine or dusty plate (shows graceful handling)
3. **Motor vehicle** — shows damage reporting alongside specs

Have a backup video ready in case the live demo fails or the API is slow.

---

## SLIDE 4 — Cost-Benefit Analysis

### Time per asset

| Process | Time |
|---------|------|
| Manual (current) | ~10 minutes |
| App with copy-paste (today) | ~2 minutes |
| App with API integration (the goal) | ~1 minute |

**90% reduction in book-in time per asset.**

---

### Time saved at scale

*Worked example at 100 assets/week — adjust to actual weekly volume*

| | Manual | With API |
|---|---|---|
| Time per asset | 10 min (avg) | 1 min |
| Hours per week | 16.7 hrs | 1.7 hrs |
| Hours per year | **867 hrs** | **87 hrs** |
| **Hours freed up per year** | | **≈ 780 hrs** |

That's nearly **half a full-time headcount freed up** to do inspections, customer work, yard management, or increase throughput.

---

### Running costs

| Item | Cost |
|------|------|
| AI extraction (per booking) | $0.02–$0.05 |
| At 100 bookings/week | ~$2–$5/week |
| Annual AI cost at 100/week | **~$150–$250/year** |
| Hosting (Vercel + Supabase) | ~$50/month (~$600/year) |
| Domain | ~$15/year |
| **Total annual running cost** | **~$765–$865/year** |

No new hardware. No new licences. No new infrastructure.

---

### Business value

| Benefit | Impact |
|---------|--------|
| Labour hours saved | ~996 hrs/year at 100 assets/week |
| Same team, higher volume | Process more assets without adding headcount |
| Consistent auction descriptions | On-brand, uniform, follows Slattery conventions every time |
| Faster listing to market | Book-ins on site in real time, not batched for later |
| Fewer data entry errors | AI extracts from compliance plates directly — no retyping |
| Better field staff experience | Less typing specs into mobile, more time on quality inspection |
| Better data for buyers | Damage reports and specs more consistent across listings |

---

### Risks and mitigations

| Risk | Mitigation |
|------|------------|
| AI extracts wrong data | Human review step before every Salesforce write — user confirms or edits |
| Bad/unreadable photos | App extracts what it can, flags missing fields rather than inventing data |
| OpenAI service outage | Clear error shown, user falls back to manual entry. No data lost. |
| Data residency concerns | Hosting in Australia (Sydney). OpenAI AU residency available if required. |
| Vendor lock-in | Extraction layer is modular — can swap providers without rewriting app |
| Ongoing maintenance | Addressed through pilot review → formalise as supported internal tool |

---

### ROI summary

- **Cost to run:** under $1,000/year
- **Value returned:** ~780 labour hours/year (at 100 assets/week) plus consistency, speed, and scalability
- **Payback period:** effectively immediate

*Yardhand loaded rate ~$40/hr (inc. super + on-costs on $62k salary): 780 hrs = ~$31,200 of labour capacity unlocked annually at a run cost of under $900. That's roughly a 36× return on run cost.*

---

## SLIDE 5 — The Ask

**Sandbox access + approval to build Salesforce API integration.**

Today: the app outputs copy-paste ready data.
Goal: direct write into Salesforce, no copy-paste step.

Specifically requesting:
1. Access to a Salesforce sandbox for development and testing
2. Creation of an **External Client App** in the sandbox (OAuth 2.0 Web Server Flow)
3. A defined pilot scope — e.g. one auction site, 2 weeks, X users
4. Review meeting at the end of pilot to decide on production rollout

---

## SLIDE 6 — Risk & Governance

### What happens when the photos are bad?
The app degrades gracefully. It extracts what it can from whatever photos are usable and flags missing fields rather than guessing. User can re-photograph or fill gaps manually. Worst case, partial extraction still beats starting from scratch.

### Who owns the data and where does it go?
- **Photos** are uploaded to Supabase (Sydney region, ap-southeast-2) — data stays in Australia
- **Extraction call** goes to OpenAI's API. Per OpenAI's API terms (updated Jan 2026): inputs and outputs are **not used for training by default**, retained up to 30 days for abuse monitoring only, then deleted.
- **Important upgrade available:** OpenAI now offers **data residency in Australia** for eligible API customers — sensitive content can be stored and processed at-rest in AU, addressing any "our data leaves the country" concern.
- **Zero Data Retention (ZDR)** is also available through OpenAI Enterprise agreements if required — eliminates the 30-day abuse monitoring retention entirely.
- **Extracted data** sits in Supabase (Sydney) — Slattery-owned, not shared
- Nothing is made public, nothing is shared with third parties beyond the OpenAI extraction call

### How does it integrate with Salesforce long-term?
Staged approach:
- **Stage 1 (now):** Copy-paste. Zero integration risk, no IT approvals needed, already working.
- **Stage 2 (the ask):** Direct write-back via Salesforce REST API, using an External Client App with OAuth 2.0 Web Server Flow. Users log in as themselves — writes carry correct audit trails.
- **Stage 3 (future):** Deeper features — photo attachments to asset records, triggering from Salesforce, damage inspection module.

### What's the fallback if OpenAI goes down or changes pricing?
- **Availability:** API down = clear error in the app, user falls back to manual entry. Same as today's process. No data lost.
- **Vendor risk:** Extraction is modular. Swapping to Claude, Gemini, or a local vision model is a change at the API layer, not a rewrite.

### Who maintains this?
Currently Jack, outside hours. If the pilot proves value, formalise it as a supported internal tool — this is part of what the pilot decision covers.

---

## SLIDE 7 — Path Forward

| Step | Timing | Owner |
|------|--------|-------|
| Approval in principle from managers | Today | Managers |
| IT provisions sandbox, creates External Client App (Consumer Key + Secret) | Week 1–2 | IT |
| Build and test Salesforce write-back against sandbox | Week 3–4 | Jack |
| IT security review of integration | Week 5 | IT |
| Limited production pilot — one site, small user group | Week 6 | Jack + Managers |
| Pilot review, decision on full rollout | Week 8 | Managers |

---

---

# SUPPORTING DOCUMENT FOR IT
*Hand this out or email after the meeting*

## Asset Book-In App — Technical Overview for IT

### What it is
A web/mobile app that extracts asset data from photographs and writes structured records into Salesforce. Designed specifically for Slattery's auction book-in workflow and schema (spo_Auction__c, spo_AssociatedAsset__c, Asset).

### Architecture (summary)
- **Frontend:** Web app (responsive, mobile-friendly for field use)
- **Backend / Database:** Hosted in Australia (ap-southeast-2 Sydney)
- **AI extraction:** Vision model via third-party API
- **Target:** Salesforce (slattery.my.salesforce.com, AUS72 instance, Unlimited Edition)

### Authentication & Authorisation
- **Flow:** OAuth 2.0 Web Server Flow (authorization code grant)
- **App type:** Salesforce **External Client App** (current recommended approach for new integrations as of Spring '26 — Connected Apps are being phased out for new creation)
- **User model:** Each user authenticates as themselves via Salesforce login. Access tokens are scoped per user, refreshed via refresh tokens.
- **Result:** All Salesforce writes carry the user's identity. Native Salesforce audit trail on every record.

### Salesforce scopes requested (minimum viable)
- `api` — access to REST API
- `refresh_token` — to keep sessions alive without re-login
- Object-level: read/write on `spo_Auction__c`, `spo_AssociatedAsset__c`, `Asset`, `Lot__c`, `Account` (read only), and related custom objects
- Gated to specific users via a Permission Set

### Salesforce API usage profile
- Current org API limit: 45,625,000 requests / 24 hours
- Expected app usage: ~10 API calls per asset booking (create record, upload attachments, related object writes)
- Estimated daily load: well under 0.01% of the available limit

### Data residency & privacy

| Data type | Location | Notes |
|-----------|----------|-------|
| Photos | Supabase (Sydney, AU) | Stored in Supabase Storage, AU data residency |
| Extracted structured data | Supabase (Sydney, AU) | Slattery-owned |
| AI extraction request | OpenAI API | Default processing region is US. **AU data residency available** for eligible API customers (Jan 2026 onwards) — images can be processed and stored at-rest in Australia |
| Salesforce records | Salesforce AUS72 (AU) | Written via OAuth-authenticated REST API |

**OpenAI API terms (current as of January 2026):** API inputs/outputs are **not** used to train models by default. Data is retained up to 30 days for abuse monitoring only, then deleted.
- **AU data residency** available for eligible API customers (announced Jan 2026)
- **Zero Data Retention (ZDR)** available through enterprise agreements
- **Enterprise Key Management (EKM)** available — customer-managed encryption keys
- **Data Processing Addendum (DPA)** can be signed to support enterprise data handling requirements

### Security
- All traffic HTTPS / TLS 1.2+
- OAuth client secret stored in server-side environment variables, never exposed to client
- No Salesforce credentials ever stored in the app
- Supabase Row Level Security (RLS) policies restrict data access per user
- Access tokens stored encrypted; refresh tokens rotated

### Integration plan (phased)

| Phase | Scope | IT involvement |
|-------|-------|----------------|
| 1 — Current | Copy-paste output | None |
| 2 — Pilot (the ask) | Sandbox External Client App, read/write Asset objects | Create ECA, issue Consumer Key/Secret, grant sandbox access |
| 3 — Production | Promote to prod org after pilot sign-off | Security review, prod ECA creation |
| 4 — Future | Attachments, webhooks, deeper workflow | TBD based on pilot outcomes |

### What we need from IT to proceed
1. Access to a Salesforce **sandbox**
2. Creation of a Salesforce **External Client App** in the sandbox with:
   - OAuth 2.0 Web Server Flow enabled
   - Callback URL: *(to be provided — will be the app's hosted domain + /auth/callback)*
   - Scopes: `api`, `refresh_token`, `openid`
3. Permission Set for pilot users
4. Consumer Key + Consumer Secret for the ECA
5. Agreement on pilot scope and success criteria

---

---

# TALKING POINTS — PROBABLE Q&A

**"What if the AI gets something wrong and we publish wrong specs to buyers?"**
Every extraction is reviewed by a human before it goes live. The app shows what was extracted from the plate vs what was inferred, so the reviewer knows exactly what to double-check. This is actually more reliable than current manual entry, where mistyped data never gets flagged.

**"Why not just buy an off-the-shelf tool?"**
Nothing on the market is built around Slattery's Salesforce schema and auction description conventions. Anything we bought would need custom integration work anyway, plus ongoing subscription costs. This is tailored to how Slattery actually works.

**"What stops a user writing garbage into Salesforce?"**
The review step. The app shows the proposed record before any write. Users confirm, then the API call happens. No write happens automatically from extraction alone.

**"What if you leave or get hit by a bus?"**
Fair question, and part of what the pilot decision covers. If it proves value, it becomes a supported internal tool — documented, handed over, or rebuilt by IT as appropriate. Today it's a proof of concept.

**"Why OpenAI and not [X]?"**
OpenAI's vision model is currently the strongest at reading messy real-world compliance plates. But the app is built so the extraction layer can be swapped — Claude, Gemini, or a local model — without rewriting the rest.

**"How much does this cost to run?"**
Approximately $0.02–$0.05 per asset in OpenAI API fees (GPT-4o Vision pricing). At ~100 assets a week that's $2–$5/week in AI costs, plus existing Supabase hosting. Costs scale linearly with volume, and would remain trivial even at 10× the current throughput.

**"Can we run this on-premise / avoid sending photos to OpenAI?"**
Three paths, in order of what's available now:
1. **AU data residency on OpenAI** (available now, Jan 2026 onwards) — images processed and stored at-rest in Australia, no US transit
2. **Zero Data Retention agreement** (via OpenAI enterprise contract) — eliminates even the 30-day abuse monitoring retention
3. **Local vision model** (future option) — e.g. Claude on AWS Bedrock in ap-southeast-2, or a self-hosted open-source model. Worth revisiting in 6–12 months.

The extraction layer is modular, so any of these are a swap at the API layer, not a rewrite.

**"What does IT actually have to do?"**
Create an External Client App in a sandbox, issue a Consumer Key and Secret, grant sandbox access, and set up a Permission Set for the pilot users. Everything else is on me. All work happens in the sandbox — production isn't touched until after the pilot review.

---

*Updated: 2026-04-21*
