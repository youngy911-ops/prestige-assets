# Manager Presentation — AI Asset Book-In App
*Slide deck outline + presenter script*

---

## Slide 1 — Title

**Heading:** AI-Powered Asset Book-In
**Subheading:** Turning 5–15 minutes of manual work per asset into under 2

*[Your name] · Slattery Auctions · [Date]*

---
**Script:**
> "Thanks for the time. I want to show you something I've built that I think changes how we do asset book-ins. It's live, it's working, and I've been using it on real jobs. I'll keep this short — five minutes of slides, then I'd rather show you the actual tool."

---

## Slide 2 — The Problem

**Heading:** Book-ins take too long

**Bullet points:**
- Staff photograph build plates on-site
- Then manually look up VIN, serial, make/model, specs in RitchieSpecs, PowerTorque, manufacturer sites
- Then manually type all Salesforce fields — correct order, correct labels
- Then write the description from scratch following our format rules
- **One asset = 5–15 minutes of research and typing, every single asset**

---
**Script:**
> "Here's what currently happens when we book in an excavator or a prime mover. We take photos on-site, which is fine. But then we're manually cross-referencing websites to get the right specs, finding the exact Salesforce field order, and writing a description that has to follow our formatting rules exactly — no dot points, right footer, correct subtype layout. That's 5–15 minutes per asset. Multiply that across a full sale — 50, 100 lots — and it adds up fast. And the consistency isn't always there either, especially across different staff or asset types they don't book in often."

---

## Slide 3 — The Solution

**Heading:** Photo → AI → Salesforce. Done.

**Single image/diagram:**
```
📷 Photo on-site
      ↓
🤖 GPT-4o reads the plate, extracts all fields
      ↓
✅ Staff reviews and confirms (30 seconds)
      ↓
📋 Copy-paste-ready Salesforce fields + formatted description
```

**Caption:** No manual research. No formatting. Just confirm and copy.

---
**Script:**
> "The app flips that process. Staff upload the build plate photos directly from their phone. GPT-4o reads the plate and extracts every relevant Salesforce field — VIN, make, model, year, engine details, weight ratings, hours — and it uses its own knowledge to fill in spec fields it can infer from the model. The staff member reviews the AI's work, fixes anything wrong, and hits confirm. They get a ready-to-paste Salesforce fields block and a correctly formatted description. The whole thing takes about two minutes."

---

## Slide 4 — What It Covers

**Heading:** All 8 asset types. Every Salesforce subtype.

| Asset Type | Subtypes |
|------------|----------|
| Truck | 24 subtypes (Prime Mover, Tipper, Vacuum Truck, Concrete Pump, EWP...) |
| Trailer | 24 subtypes (Flat Deck, Low Loader, Skel, Timber Jinker...) |
| Earthmoving | 19 subtypes (Excavator, Motor Grader, Bulldozer/Crawler Tractor...) |
| Agriculture | 12 subtypes — first time with subtype-aware descriptions |
| Forklift | 9 subtypes (Telehandler, EWP, Walkie Stacker...) |
| Caravan / Motorhome | 5 subtypes |
| Marine | 10 subtypes (replacing Boat/Yacht/Jet Ski) |
| General Goods | 16 subtypes |

**Footer note:** Every subtype has its own description template — not generic output.

---
**Script:**
> "It's not just trucks and excavators. We cover all eight asset types with every Salesforce subtype aligned exactly to the SF taxonomy — the same choices you'd pick in the dropdown. Agriculture, Forklift, Caravan all have subtype selectors now for the first time. And critically, every subtype has its own description template. An EWP description looks different to a Tipper, a Telehandler looks different to a Walkie Stacker. The AI knows the difference and formats accordingly."

---

## Slide 5 — Who Can Use It

**Heading:** Anyone can book in an asset. First time, every time.

**The app guides you through it — you don't need to already know the rules.**

| Role | What it means for them |
|------|------------------------|
| **Valuations team** | Book-ins done before they leave the yard — no data entry back at the desk |
| **BDMs** | Can book in assets themselves on-site without relying on admin |
| **Admin staff** | No more chasing specs across RitchieSpecs, PowerTorque, manufacturer sites |
| **New staff** | Correct Salesforce format and description rules built in — no training required to get it right |
| **On-site auctions** | Walk the yard, photograph each asset, book-ins complete before you leave |
| **Bulk general goods** | Rapid-fire through a large lot — photo, type, confirm, next — no per-item research |

**On-site auctions:**
> Staff walk the yard with their phone. Each asset gets photographed, AI does the work, and by the time the auction starts the book-ins are done — not sitting as a backlog on someone's desk.

**Bulk general goods / large lots:**
> General goods used to mean typing individual descriptions for every item. Now it's: photo, select the category, confirm, copy. Move to the next one. You can process a large general goods consignment in a fraction of the time.

---
**Script:**
> "Think about what this means for on-site auctions. Right now there's a lag — someone walks the yard, takes photos, and then all that data entry happens later. With this, you walk the yard and you're done. Photos go straight into the app, AI pulls the fields, you confirm it in 30 seconds and move to the next asset. By the time you're back at the office the book-ins are already in Salesforce. And for large general goods lots — workshop clearances, estate sales, that kind of thing — instead of sitting there writing individual descriptions for 40 items, you're just moving through them on your phone. It genuinely changes the pace of how we can turn a job around."

---

## Slide 6 — The Description Quality

**Heading:** Descriptions that follow our rules. Every time.

**Two-column layout:**

*Before (manual):*
> ❌ Inconsistent format between staff
> ❌ Wrong footer variant on attachments
> ❌ Marketing language slipping in
> ❌ TBC for unknown specs
> ❌ Hours/serial in description body

*After (app):*
> ✅ Correct footer enforced — always, no exceptions
> ✅ No dot points, no marketing language
> ✅ Omits unknown fields rather than guessing
> ✅ Subtype-specific format (Tipper ≠ Prime Mover ≠ EWP)
> ✅ Editable before copy-paste

---
**Script:**
> "One thing I was firm about from the start: the descriptions have to follow our format rules exactly, every time — not just when I'm the one writing them. The footer is enforced programmatically. It cannot output the wrong footer variant. It never writes TBC for a spec it doesn't know — it just omits it. And because every subtype has its own template, a concrete agitator description has the drum capacity and mix details, an EWP has boom length and platform height. The output is editable before you copy it, so staff can make adjustments, but the starting point is already correct."

---

## Slide 7 — Live Demo

**Heading:** Let me show you

**Talking points for demo:**
1. Open the app on phone — show the asset type selector (8 tiles)
2. Create new asset → select Truck → Tipper
3. Upload build plate photo(s)
4. Show AI extraction in progress → fields populate
5. Review screen — show confidence indicators, fix a field
6. Show the Salesforce fields output (copy button)
7. Generate description → show the formatted result
8. Copy and paste into a Salesforce record

---
**Script:**
> "Let me just show you. [Open app] This is what staff see when they start a book-in. They pick the asset type — here I'll pick Truck, Tipper. They upload their photos from the phone's camera roll. [Upload] The AI runs for about 15–20 seconds. [Wait] And here are the extracted fields — make, model, VIN from the plate, year, engine details. The yellow ones are fields it's less confident about — we review those. [Fix one if needed] Here's the Salesforce fields output, ready to paste. And then [tap Generate Description] here's the description. Tipper format — body dimensions, payload, correct footer. [Show copy button] That's it."

---

## Slide 8 — Built to Last

**Heading:** Not a prototype. Production software.

- **365 automated tests** — regression protection as we add features
- **ISO 27001 compatible** — all AI calls server-side, no data leaves our stack in client code
- **Extendable** — adding a new subtype is one file change + one test
- **5 shipped versions** in 7 days — v1.0 → v1.4
- **In active use** on real Slattery assets

---
**Script:**
> "A few things for context. This isn't a quick demo script I threw together — it's production software with 365 automated tests. Every description rule, every field extraction path, every Salesforce subtype is tested. When we add something new, we know immediately if something breaks. The AI calls are all server-side, so no asset data touches a client browser in a way that would concern compliance. And because it's built on the same Schema Registry we use for Salesforce, adding a new asset type when Slattery adds a new category is a matter of hours, not weeks."

---

## Slide 9 — What's Next: Salesforce API Integration

**Heading:** The next step eliminates copy-paste entirely

**The vision:**
```
📷 Photo on-site
      ↓
🤖 AI extracts all fields
      ↓
✅ Staff confirms (30 seconds)
      ↓
🚀 App pushes directly to Salesforce record — done
```

**What's needed:**
- IT to approve a Salesforce Connected App (standard configuration, no custom development required on the SF side)
- Once approved: the app already has all the data in the right format — it's one integration step

**Also on the roadmap:**
- Multi-user access — roll out to the full book-in team, each with their own login
- PPSR result capture — store the PPSR check result against the asset record in the app

---
**Script:**
> "The one thing that would make this a lot more powerful is Salesforce API access. Right now the app gives you the output ready to paste — that's already saving real time. But if IT can set up a Connected App, the copy-paste step goes away entirely. You confirm the AI's work and the app writes straight into Salesforce. I can build that side of it, I just need IT to approve it. Would you be able to help move that along?"

---

## Slide 10 — Summary

**Heading:** Where things stand

| | Today | With Salesforce API |
|---|---|---|
| Time per asset | ~2 min (down from 5–15) | ~1 min |
| Salesforce entry | Copy-paste | Automatic |
| Description format | Enforced by the app | Enforced by the app |
| Who can use it | Anyone — no training needed | Anyone — no training needed |
| 100-lot sale | ~3 hrs of data entry | ~1.5 hrs, zero formatting errors |

**Valuations, BDMs, admin, new staff — anyone can do a correct book-in, first time.**
**The knowledge is in the app.**

Running cost: a few cents per asset in AI fees.

---
**Script:**
> "That's where things stand. It's already saving real time and the quality is consistent regardless of who does the booking — that's the part I think is underrated. A new staff member can do their first book-in correctly without anyone showing them the Salesforce field order or the description rules. That knowledge is just built in. The Salesforce API is the next step that makes it seamless for everyone. I've done everything I can on my end. I just need the Connected App sorted with IT. That's the ask."

---

## Appendix — Technical Details (if asked)

**Stack:**
- Next.js 15 (App Router) — web app, phone browser + desktop
- Supabase — database, photo storage, auth
- GPT-4o — field extraction (photos → structured fields) and description generation
- Vitest — 365 automated tests

**How AI extraction works:**
- Photos uploaded → sent to GPT-4o with a Zod schema specifying every Salesforce field for that asset type
- Each field has an `aiHint` annotation with field-specific guidance (e.g. "read from compliance plate", "infer from engine model if not visible")
- GPT-4o returns structured JSON; confidence scores flag uncertain fields
- Pre-entered values (VIN, odometer, hours) are injected as authoritative overrides before extraction

**How descriptions work:**
- Second GPT-4o call after user confirms fields
- System prompt contains ALL_CAPS template sections for every subtype (e.g. `TIPPER`, `PRIME MOVER`, `EWP`)
- GPT-4o selects the matching template for the confirmed subtype
- `normalizeFooter` post-processes output to enforce correct footer regardless of GPT output
- Result is editable before copy-paste

---

*Presentation prepared: 2026-03-24*
