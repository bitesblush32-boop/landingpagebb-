# BlushBite — Complete Page Flow & Architecture
## Visual Tabular Flowchart
> Last updated: July 2026 | Based on research.md + todo.md

---

## LEGEND

| Symbol | Meaning |
|--------|---------|
| 🟢 | Live / Public page |
| 🔵 | Auth-required page |
| 🟡 | Admin-controlled |
| 🔴 | Error / Blocked state |
| 🌐 | SEO-indexed, standalone ranked page |
| 🔒 | Gated / restricted access |
| ➡️ | Redirects to |
| 👁️ | Visible to dreamers (users) |
| 💼 | Companion-only page |

---

## PART 1 — ENTRY POINT & CATEGORY ROUTING

### 1A — Main Entry Flow

```
USER VISITS blushbite.live
       │
       ▼
[AGE GATE — Full-screen overlay]
"This website contains adult content for 18+ only."
  [I am 18 or older — Enter]    [Exit → google.com]
  • Stored: localStorage bb_age_confirmed = 1
  • Cookie: bb_age=1 (for SEO bots — SafeSearch compliance)
  • Does NOT show again once confirmed
       │ Confirmed 18+
       ▼
blushbite.live — MAIN LANDING PAGE
(Category Selector)
       │
  ┌────┴──────────────────────────────┐
  ▼              ▼                    ▼
/female         /male             /shemale
(SEO page)    (SEO page)         (SEO page)
```

### 1B — Category Picker on blushbite.live

| Element | Detail |
|---------|--------|
| Hero section | Brand identity + trust signals (companion count, cities) |
| Category cards | 👩 Female → /female │ 👨 Male → /male │ 🏳️‍⚧️ Shemale → /shemale |
| Companion CTA | "Are you a companion? Join BlushBite →" |
| Footer | Terms ｜ Privacy ｜ Guidelines ｜ Contact |
| Age gate | Fires on every page if bb_age_confirmed not in localStorage |

---

## PART 2 — CATEGORY LANDING PAGES (Independent SEO Components)

> Each category URL is a **fully independent SEO-ranked page**.
> Direct traffic to /shemale, /female, or /male acts as **that category's homepage**.
> Users who land directly on a category page NEVER see other categories.

### 2A — Category Page Properties

| Property | /female | /male | /shemale |
|----------|---------|-------|----------|
| **Page type** | 🌐 SSG / ISR | 🌐 SSG / ISR | 🌐 SSG / ISR |
| **SEO title** | Female Companions — BlushBite | Male Companions — BlushBite | Shemale Companions — BlushBite |
| **Meta description** | Verified female companions advertising time & companionship | Verified male companions advertising time & companionship | Verified trans companions advertising time & companionship |
| **JSON-LD** | Organization + BreadcrumbList | Organization + BreadcrumbList | Organization + BreadcrumbList |
| **Breadcrumb** | BlushBite → Female | BlushBite → Male | BlushBite → Shemale |
| **Companion filter** | gender = female only | gender = male only | gender = trans_woman / shemale only |
| **Profiles shown** | Female profiles only | Male profiles only | Shemale/trans profiles only |
| **Cross-navigate?** | ❌ No — stays in /female | ❌ No — stays in /male | ❌ No — stays in /shemale |
| **Ranked separately?** | ✅ Yes — own SEO | ✅ Yes — own SEO | ✅ Yes — own SEO |
| **Age gate fires?** | ✅ If not already confirmed | ✅ If not already confirmed | ✅ If not already confirmed |

### 2B — Category Page Flow (Example: /shemale)

```
blushbite.live/shemale — SHEMALE CATEGORY HOME
(Acts as the homepage for shemale segment)
(Can be landed on directly — fully self-contained)

  Hero: "Meet BlushBite's Trans Companions"
  Filter bar: City | Country | Availability | Rate

  [Profile Card 1]  [Profile Card 2]  [Profile Card 3] ...
  (Only shemale/trans_woman profiles — is_live=true)

  "Are you a companion? Join BlushBite →"  [Register CTA]
  Footer: Terms | Privacy | Guidelines | Contact
       │
  ┌────┴────────────────┐
  ▼                     ▼
Dreamer clicks profile  Companion clicks Register
(see Part 3)            (see Part 4)
```

### 2C — Direct Landing URL Map

| URL | Acts as | SEO Target | Content shown |
|-----|---------|------------|---------------|
| blushbite.live | Main landing / category picker | Brand homepage | Category selector + hero |
| blushbite.live/female | Female homepage 🌐 | "female companions" | Female companion listings |
| blushbite.live/male | Male homepage 🌐 | "male companions" | Male companion listings |
| blushbite.live/shemale | Shemale homepage 🌐 | "shemale companions / ts" | Shemale/trans listings |
| blushbite.live/female/amsterdam | City page 🌐 | "female companions amsterdam" | Female companions in Amsterdam |
| blushbite.live/shemale/bangalore | City page 🌐 | "shemale escorts bangalore" | Shemale companions in Bangalore |
| blushbite.live/companions/[slug] | Individual profile 👁️ | Companion name + city | Single companion public profile |

---

## PART 3 — DREAMER (USER) JOURNEY

### 3A — Dreamer Flow (No Account Required to Browse)

```
DREAMER ENTERS blushbite.live
       │
       ▼
  [Age Gate if first visit]
       │ Confirmed
       ▼
  blushbite.live  [Category Selector]
       │
  ├──→ /female  ──→  Browse female profiles
  ├──→ /male    ──→  Browse male profiles
  └──→ /shemale ──→  Browse shemale profiles
             │
             ▼
     Profile Card clicked
             │
             ▼
   /companions/[slug]
   (Public profile — no login required)
             │
             ▼
   Companion Public Profile Page
   • Photos (approved only)
   • Bio + Tagline
   • City, rates, availability
   • "Verified Photos" badge (if set)
   • Contact/Book button
   • Stories (if any)
             │
             ▼
   Contact companion via WhatsApp
   or Booking form
```

### 3B — Dreamer Content Isolation Table

| Dreamer starts at | Sees | Does NOT see |
|------------------|------|--------------|
| /female | Female profiles only | Male, shemale profiles |
| /male | Male profiles only | Female, shemale profiles |
| /shemale | Shemale/trans profiles only | Female, male profiles |
| /companions/[slug] (shemale companion) | That companion's profile | No category leakage |

---

## PART 4 — COMPANION REGISTRATION FLOW

> Based on SECTION B simplified onboarding (todo.md) + SECTION A instant-live

### 4A — Full Registration Flow

```
COMPANION CLICKS "Join BlushBite" (on any page / any category)
       │
       ▼
STEP 1 — SIMPLIFIED REGISTRATION (3 fields only)
  • Stage Name / Display Name  (required)
  • Email Address              (required)
  • ☑ I confirm I am 18+       (required — legal checkbox)
  • ☑ I agree to Terms of Service (required)
  • Gender (optional — for routing to correct category)

  [ Send me a login link ]

  NOTE: No legal name, DOB, country, city, WhatsApp here
        (moved to dashboard profile builder post-signup)
       │
       │ POST /api/companions/apply
       ▼
OTP EMAIL SENT
"Check your email — 6-digit code sent to [email]"
       │
       ▼
STEP 2 — OTP VERIFICATION
  [ _ ] [ _ ] [ _ ] [ _ ] [ _ ] [ _ ]  ← 6-digit code
  [ Verify & Enter BlushBite ]
       │
       │ POST /api/companions/verify-otp
       ▼
BACKEND AUTO-ACTIONS (apply/route.ts)
  1. Creates companions row
  2. Creates companion_profiles row
     └─ is_live = TRUE          (auto-approved)
     └─ is_visible_to_users = TRUE
  3. Inserts onboarding stage 7 as 'completed' (auto-approve)
  4. Sets JWT session cookie (__Host-bb_session)
  5. Sends welcome email (Resend)
  6. Sends WhatsApp message (if number provided)
  7. redirectTo: /dashboard?welcome=1
       │
       ▼
  ➡️ /dashboard?welcome=1
  (see Part 5)
```

### 4B — Registration Steps Comparison Table

| Step | Old Flow (removed) | New Flow (current) |
|------|-------------------|-------------------|
| **Step 1** | fullName + email + DOB + country + city + WhatsApp (6 fields) | stageName + email + 18+agree (3 fields) |
| **Step 2** | displayName + gender + tagline + bio (4 fields) | OTP 6-digit code |
| **Step 3** | Photo upload | — (moved to dashboard) |
| **Post-apply** | 48-hour admin review wait | ✅ Instant live — go to dashboard |
| **Status page** | Shows "Under review" | Only shows for rejected/taken_down |
| **Dashboard access** | Locked until approved | ✅ Full access immediately |

---

## PART 5 — COMPANION DASHBOARD

### 5A — Dashboard Entry States

| State | How companion gets here | What they see |
|-------|------------------------|---------------|
| **New registration** (?welcome=1) | First registration → auto-approve | Welcome banner + onboarding checklist |
| **Returning login** | OTP login → verified | Dashboard home (no banner) |
| **Rejected** | review_status = rejected | ➡️ /reapply |
| **Taken down** | Admin sets is_live=false | Dashboard with red notice "Profile paused" |

### 5B — Dashboard Page Map

| URL | Page | Access |
|-----|------|--------|
| /dashboard | Home: stats overview + welcome banner (if new) | 🔵 All companions |
| /dashboard/profile | Profile builder (legal name, DOB, city, bio, tagline, rate) | 🔵 All companions |
| /dashboard/photos | Photo management (upload, approval + verification status) | 🔵 All companions |
| /dashboard/videos | Video management | 🔵 All companions |
| /dashboard/stories | Literary stories (create, edit, moderation status) | 🔵 All companions |
| /dashboard/analytics | View counts, profile views, booking stats | 🔵 All companions |
| /dashboard/bookings | Incoming booking requests | 🔵 All companions |
| /dashboard/settings | WhatsApp, email, password, notifications | 🔵 All companions |
| /dashboard/upgrade | Subscription tier page (Free → Standard → Premium) | 🔵 Sprint 6 |

### 5C — Dashboard Welcome Checklist (shown on ?welcome=1)

| Step | Trigger | Link |
|------|---------|------|
| ✅ Account created | Always done | — |
| ☐ Complete profile (bio + tagline) | cp.bio and cp.tagline empty | /dashboard/profile |
| ☐ Upload 3+ photos | companion_photos count < 3 | /dashboard/photos |
| ☐ Write first story | stories count = 0 | /dashboard/stories |
| ☐ Set session rate | cp.hourly_rate = 0 | /dashboard/profile |
| ☐ Toggle Live | cp.is_live = false | Sidebar toggle |

> Checklist stored in localStorage: bb_onboarding_done. Dismissed once all 5 complete.

### 5D — Companion Photo States

| Photo state | Badge shown | Visible on public profile? |
|-------------|------------|---------------------------|
| is_approved=false (pending) | ⏳ Pending review | ❌ No |
| is_approved=true, photo_verification_status=pending | ✅ Approved | ✅ Yes |
| is_approved=true, photo_verification_status=verified | ✦ Verified (gold) | ✅ Yes + badge |
| is_approved=false, photo_verification_status=failed | ❌ Rejected | ❌ No |

---

## PART 6 — RETURNING COMPANION LOGIN

```
blushbite.live
      │
      ▼
  [Login] tab on landing page
      │
      ▼
Enter email → POST /api/companions/login/send-otp
      │
      ▼
6-digit OTP sent to email
      │
      ▼
Enter OTP → POST /api/companions/login/verify-otp
      │
  ├── review_status = rejected  ──→  /reapply
  ├── is_live = false (taken down) → /dashboard (with red "paused" notice)
  └── default (all others)     ──→  /dashboard
```

---

## PART 7 — ADMIN MONITORING (blushbite.co — separate codebase)

> Admin role has shifted: approve-to-live → monitor-and-takedown

### 7A — Admin Actions Table

| Old Action | New Action |
|-----------|-----------|
| [Approve] — makes companion live | [Take Down] — removes from public |
| [Reject] — blocks companion | [Reject] — still blocks permanently |
| "Pending review" filter | "New today" badge instead |
| Companion starts as pending | Companion starts as LIVE (new default) |

### 7B — Admin Companion States

| Status | is_live | review_status | Visible to dreamers | Admin action |
|--------|---------|---------------|---------------------|-------------|
| Live (default) | true | — | ✅ Yes | [Take Down] |
| Taken down | false | — | ❌ No | [Restore] |
| Rejected | false | rejected | ❌ No | [Delete] |

### 7C — Admin Panel Pages

| Page | Purpose |
|------|---------|
| /admin/companions | All companions — filter: All / Live / Taken Down / Rejected |
| /admin/companions/[id] | Companion detail — Take Down / Restore / Reject |
| /admin/companions/[id]/photos | Per-photo: Approve / Reject / Verify |
| /admin/stories | Story moderation queue |
| /admin/bookings | Booking management |

---

## PART 8 — SEO PAGE ARCHITECTURE

### 8A — Indexed Pages (Google / Bing crawlable)

| URL | Type | SEO Purpose | JSON-LD |
|-----|------|-------------|---------|
| blushbite.live | Landing | Brand homepage | Organization |
| blushbite.live/female | Category home 🌐 | "female companions" | Organization + BreadcrumbList |
| blushbite.live/male | Category home 🌐 | "male companions" | Organization + BreadcrumbList |
| blushbite.live/shemale | Category home 🌐 | "shemale companions / ts" | Organization + BreadcrumbList |
| blushbite.live/female/[city] | City page 🌐 | "female companions [city]" | BreadcrumbList |
| blushbite.live/male/[city] | City page 🌐 | "male companions [city]" | BreadcrumbList |
| blushbite.live/shemale/[city] | City page 🌐 | "shemale companions [city]" | BreadcrumbList |
| blushbite.live/companions/[slug] | Profile 🌐 | Companion name + city | Person schema |
| blushbite.live/terms | Legal | Trust signal | — |
| blushbite.live/privacy | Legal | GDPR compliance | — |
| blushbite.live/companion-guidelines | Legal | Content rules | — |

### 8B — Blocked from Indexing (robots.txt)

| URL Pattern | Reason |
|------------|--------|
| /dashboard/* | Private companion area |
| /api/* | Backend routes |
| /reapply | Auth-only flow |
| /status | Auth-only flow |

---

## PART 9 — LEGAL & COMPLIANCE PAGES

| Page | File | Purpose | Required by |
|------|------|---------|-------------|
| Age Gate | components/AgeGate.tsx | 18+ confirmation overlay | Google SafeSearch + NL law |
| Cookie Banner | components/CookieBanner.tsx | Cookie consent notice | GDPR / Dutch law |
| Terms of Service | app/terms/page.tsx | Platform legal shield | NL law + DSA safe harbour |
| Privacy Policy | app/privacy/page.tsx | GDPR compliance | GDPR Article 13 |
| Companion Guidelines | app/companion-guidelines/page.tsx | Content rules + liability deflection | Legal protection + trust |

---

## PART 10 — COMPLETE SYSTEM FLOW SUMMARY

```
                    blushbite.live
                          │
                     [Age Gate]
                          │
               ┌──────────┴──────────┐
               │   Category picker    │
               └──────────┬──────────┘
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
     /female             /male           /shemale
  (own SEO)           (own SEO)         (own SEO)
         │                 │                 │
  Browse female     Browse male      Browse shemale
  companions        companions       companions
         │                 │                 │
  Click profile     Click profile    Click profile
         └─────────────────┴─────────────────┘
                           │
                /companions/[slug]
                (Public profile page)
                           │
                Contact companion


COMPANION SIDE:
  blushbite.live → Register (any page / any category)
       │
  Simplified wizard (3 fields + OTP)
       │
  Auto-approved → /dashboard?welcome=1
       │
  Build profile: photos, bio, stories, rate
       │
  Toggle Live → appear in category browse
       │
  Dreamers can find and contact companion


ADMIN SIDE (blushbite.co):
  Monitor live companions
  Take down violations
  Verify photos
  Moderate stories
  Reject bad actors
```

---

## PART 11 — SUBSCRIPTION TIER FLOW (Sprint 6 — Revenue)

```
Companion registered (Free tier — default)
      │
      │  Free: Profile NOT visible to dreamers
      │
      ▼
/dashboard/upgrade  → Choose tier
      │
  ┌───┴───────────────────────┐
  ▼                           ▼
Standard (€29/mo)         Premium (€59/mo)
• Visible to dreamers     • Everything in Standard
• 8 photos + 3 videos     • Featured in city browse
• 5 stories               • Verified badge priority
• Basic analytics         • Unlimited content
• Bookings enabled        • Full analytics
                          • Priority support
  │                           │
  └────────────┬──────────────┘
               │
         Add-on: Top Placement
         €15/week — pinned to top
         of city results for 7 days
```

### Payment Processor Table

| Processor | Type | Notes |
|-----------|------|-------|
| **CCBill** | Credit card | Industry standard adult, 7.5-10% + €0.10/txn |
| **Verotel** | Credit card | EU-based, GDPR native |
| **Crypto (USDT/BTC)** | Crypto | Zero chargeback risk |
| **SEPA transfer** | Bank | EU companions only |
| ~~Stripe~~ | ❌ | Will terminate adult accounts |
| ~~PayPal~~ | ❌ | Will terminate adult accounts |
| ~~Razorpay~~ | ❌ | Will terminate adult accounts |

---

## PART 12 — POST-REGISTRATION COMMUNICATION SEQUENCE

| Time | Channel | Message | Condition |
|------|---------|---------|-----------|
| T+0 (instant) | Email | "Your BlushBite stage is waiting" + dashboard link | Always |
| T+0 (instant) | WhatsApp | "Welcome to BlushBite. Your stage is live." | If WhatsApp number provided |
| T+4h | WhatsApp | "Profile is only 30% complete — add photos" | If profile_completeness < 30% |
| T+24h | WhatsApp | "Upload your first photo — takes 2 minutes" | If no photos uploaded |
| T+72h | Email | "3 dreamers searched [city] today. Go live now." | If is_live still false |

---

## PART 13 — FILE CREATION PRIORITY MAP

### Sprint 1 — Legal Foundation

| File | Action | Purpose |
|------|--------|---------|
| components/AgeGate.tsx | CREATE | 18+ gate overlay |
| components/CookieBanner.tsx | CREATE | GDPR cookie consent |
| app/terms/page.tsx | CREATE | Terms of Service |
| app/privacy/page.tsx | CREATE | Privacy Policy |
| app/companion-guidelines/page.tsx | CREATE | Content rules |
| app/layout.tsx | MODIFY | Add AgeGate + CookieBanner + JSON-LD + meta |

### Sprint 2 — Category Routing (NEW — from user requirements)

| File | Action | Purpose |
|------|--------|---------|
| app/female/page.tsx | CREATE | Female category homepage (own SEO) |
| app/male/page.tsx | CREATE | Male category homepage (own SEO) |
| app/shemale/page.tsx | CREATE | Shemale category homepage (own SEO) |
| app/female/[city]/page.tsx | CREATE | Female city landing pages |
| app/male/[city]/page.tsx | CREATE | Male city landing pages |
| app/shemale/[city]/page.tsx | CREATE | Shemale city landing pages |
| app/companions/[slug]/page.tsx | CREATE | Individual companion public profile |
| app/page.tsx | MODIFY | Category picker on main landing |

### Sprint 3 — Instant Live (Registration)

| File | Action | Purpose |
|------|--------|---------|
| app/page.tsx | MODIFY | Simplify wizard to 2-step |
| app/api/companions/apply/route.ts | MODIFY | Auto-approve, redirect /dashboard?welcome=1 |
| app/api/companions/me/route.ts | MODIFY | Default status = approved |
| app/api/companions/login/verify-otp/route.ts | MODIFY | Default redirect = /dashboard |
| app/dashboard/layout.tsx | MODIFY | Remove lock logic |
| app/dashboard/page.tsx | MODIFY | Add welcome banner + onboarding checklist |
| app/status/page.tsx | MODIFY | Remove pending, add taken_down state |

### Sprint 4 — SEO + Trust

| File | Action | Purpose |
|------|--------|---------|
| public/robots.txt | CREATE | Control crawler access |
| app/sitemap.ts | CREATE | XML sitemap for all pages |
| lib/email.ts | MODIFY | Add sendWelcomeEmail |

### Sprint 5 — Revenue (Month 2)

| File | Action | Purpose |
|------|--------|---------|
| app/dashboard/upgrade/page.tsx | CREATE | Tier selection UI |
| app/api/companions/subscription/route.ts | CREATE | Subscription management |
| app/api/webhooks/ccbill/route.ts | CREATE | Payment webhook handler |
| lib/subscription.ts | CREATE | Tier check helper |

---

*BlushBite Page Architecture Flowchart | July 2026*
*Sources: research.md + todo.md | Project: landingpagebb-*
