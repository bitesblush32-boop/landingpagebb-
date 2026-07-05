# BlushBite — Master Todo List
## Complete Development Roadmap with Implementation Details

> This file is the single source of truth for all pending work.
> Every item includes exact files to change, what to change, and why.
> Sessions that pick this up should read this file fully before touching code.

---

## UNDERSTANDING THE CURRENT SYSTEM (Read Before Any Changes)

### Current Registration Flow (what exists today)
```
1. Landing page (app/page.tsx) — 3-step wizard
   Step 1: fullName, email, dateOfBirth, country, city, whatsappNumber
   Step 2: displayName, gender, tagline, bio
   Step 3: photo upload (optional)

2. POST /api/companions/apply/route.ts
   - Validates fields
   - Creates companions row (companion_stage=3, onboarding_complete=false)
   - Creates companion_profiles row (is_live=false, is_visible_to_users=false, is_verified=false)
   - Creates companion_photos row if photo provided (is_approved=false)
   - Inserts companion_onboarding_progress stages 1 + 2 as 'completed'
   - Sets session cookie
   - Returns redirectTo: '/status?new=1'

3. /status page (app/status/page.tsx)
   - Fetches /api/companions/me
   - Shows "Under review — 24-48 hours" if status = 'pending'
   - Shows confetti + "Go to dashboard" if status = 'approved'
   - Shows rejection reason if status = 'rejected'

4. /api/companions/me/route.ts — status logic (lines 31-33):
   let status = 'pending'
   if (row.review_status === 'rejected') status = 'rejected'
   else if (row.review_status === 'completed' && row.is_live) status = 'approved'
   -- status is 'approved' ONLY when admin inserts stage 7 as 'completed' AND sets is_live=true

5. Admin (on blushbite.co) reviews companion, clicks Approve:
   - Sets companion_profiles.is_live = true
   - Sets companion_profiles.is_visible_to_users = true
   - Inserts companion_onboarding_progress stage 7 as 'completed'
   - Sends approval email

6. On next login, /api/companions/login/verify-otp/route.ts:
   - Checks stage 7 status and is_live
   - If completed + live → redirectTo: '/dashboard'
   - If rejected → redirectTo: '/reapply'
   - Else → redirectTo: '/status'
```

### Current Auth System
- JWT HS256, cookie name: `__Host-bb_session` (prod) / `bb_session` (dev)
- 7 day expiry
- Payload: { sub: companionId (UUID), email, name, exp }
- lib/session.ts: signJwt, verifyJwt, getSession(), buildSessionCookie(), clearSessionCookie()
- middleware.ts: Edge Runtime JWT check, protects /dashboard/*, /status, /reapply, /api/companions/* (except public routes)
- Public API routes: /api/companions/send-otp, /api/companions/verify-otp, /api/companions/apply, /api/companions/login/*

### Current Dashboard Lock Logic (app/dashboard/layout.tsx lines 36, 59-67)
- UNLOCKED = ['/dashboard/profile'] — only profile page accessible before approval
- isApproved = me?.status === 'approved'
- Non-approved companions redirected to /dashboard/profile from all other pages
- Sidebar: locked nav items shown greyed out with 'no' icon, pointer-events: none

---

## SECTION A — INSTANT LIVE: REMOVE ADMIN APPROVAL GATE

### What Changes
- Remove the 48-hour admin review requirement for going live
- As soon as OTP is verified and account created → companion lands on /dashboard directly
- All dashboard pages immediately accessible (no locked state for new registrations)
- Admin panel REMAINS but role changes: from "approve to live" → "monitor and take down"
- Admin still sees every companion profile. Default state is live. Admin can take down bad profiles.

### Exact Files to Change

---

#### A1. app/api/companions/apply/route.ts
**Current state (lines 135-158):** companion_profiles inserted with is_live=false, is_visible_to_users=false
**Current state (line 187):** redirectTo: '/status?new=1'

**Change 1 — set is_live and is_visible_to_users to true on creation:**
```
Line 152: false,   → true,   (is_live)
Line 154: false,   → true,   (is_visible_to_users)
```

**Change 2 — redirect to dashboard not status:**
```
Line 187:
BEFORE: return NextResponse.json({ success: true, redirectTo: '/status?new=1' }, { status: 201 })
AFTER:  return NextResponse.json({ success: true, redirectTo: '/dashboard?welcome=1' }, { status: 201 })
```

**Change 3 — also insert stage 7 as 'completed' in the same transaction (new registrations are auto-approved):**
Add this query after the stage 2 insert (after line 182):
```typescript
await client.query(
  `INSERT INTO companion_onboarding_progress (companion_id, stage, status, completed_at, notes)
   VALUES ($1, 7, 'completed', $2, 'Auto-approved on registration')
   ON CONFLICT (companion_id, stage) DO NOTHING`,
  [id, now]
)
```
This means /api/companions/me will return status: 'approved' immediately.

---

#### A2. app/api/companions/me/route.ts
**Current status logic (lines 31-33):**
```typescript
let status = 'pending'
if (row.review_status === 'rejected') status = 'rejected'
else if (row.review_status === 'completed' && row.is_live) status = 'approved'
```

**New logic — approved unless explicitly taken down:**
```typescript
let status = 'approved'
if (row.review_status === 'rejected') status = 'rejected'
else if (row.is_live === false && row.review_status !== 'completed') status = 'taken_down'
// Default to 'approved' — all registered companions are live
```

Note: also need to add `taken_down` to the CompanionMe interface in dashboard/layout.tsx and status/page.tsx.

---

#### A3. app/api/companions/login/verify-otp/route.ts
**Current redirect logic (lines 36-41):**
```typescript
let redirectTo = '/status'
if (statusRows.length > 0) {
  const { review_status, is_live } = statusRows[0]
  if (review_status === 'completed' && is_live) redirectTo = '/dashboard'
  else if (review_status === 'rejected') redirectTo = '/reapply'
}
```

**New logic — everyone goes to dashboard by default:**
```typescript
let redirectTo = '/dashboard'
if (statusRows.length > 0) {
  const { review_status } = statusRows[0]
  if (review_status === 'rejected') redirectTo = '/reapply'
  // taken_down companions still land on dashboard but see a notice there
}
```

---

#### A4. app/dashboard/layout.tsx
**Current lock logic (line 36, 59-67):**
```typescript
const UNLOCKED = ['/dashboard/profile']
...
const isApproved = me?.status === 'approved'
const isUnlocked = UNLOCKED.some(...)
useEffect(() => {
  if (authChecked && !isApproved && !isUnlocked) {
    router.replace('/dashboard/profile')
  }
}, [authChecked, isApproved, isUnlocked, router])
```

**Change — remove the lock entirely. All companions get full dashboard access:**
```typescript
// Remove UNLOCKED constant — no longer needed
// Remove isApproved and isUnlocked derived values
// Remove the redirect useEffect that enforces locks
// Remove locked styling from NAV items (the greyed-out 'no' icon state)
// All nav items render as active/clickable for all authenticated companions
```

Also change the sidebar status badge (lines 195-216) — the "Under review / Application rejected" amber/red badge should now only show if `me.status === 'rejected'` or `me.status === 'taken_down'`. Remove the 'pending' amber badge entirely.

For taken_down status: show a red notice "Your profile has been paused by our team. Contact support." with a support email link.

---

#### A5. app/page.tsx — landing page wizard
**Current (line ~187 in the apply submit handler):**
The wizard submits and redirects to the URL returned in `redirectTo` from the API.
Since the API will now return `/dashboard?welcome=1`, this redirect will automatically land them on the dashboard.

No change needed to the redirect logic — it already follows whatever `redirectTo` the API returns.

However, change the success state copy on the landing page (current success screen after apply):
```
BEFORE: "Application received. We'll be in touch within 48 hours."
AFTER:  "You're in. Your stage is waiting." + "Go to your dashboard →" button
        that links to /dashboard?welcome=1
```

---

#### A6. app/status/page.tsx
The status page is still needed for:
- Rejected companions (link from /reapply)
- Taken-down companions
- Returning logins who land here from old session

Change the 'pending' section to redirect to /dashboard since pending no longer exists.
Add a new 'taken_down' section explaining the profile was paused.

Keep the page, just update states.

---

#### A7. Admin Panel on blushbite.co (separate codebase — note for that session)
The admin panel at `C:\Users\Ravi Desai\Downloads\BlushBite\` needs:

**Change the Approve button to a Take Down / Restore toggle:**
- Instead of: [Approve] [Reject]
- New:        [Take Down] (if is_live=true) / [Restore] (if is_live=false) [Reject]

**Take Down action:**
- PATCH /api/admin/companions/[id] { is_live: false, is_visible_to_users: false }
- Add a reason/note field (stored in companion_onboarding_progress notes or a new takedown_reason column)
- Send email to companion: "Your profile has been temporarily paused. Reason: [reason]. Contact support."

**Restore action:**
- PATCH /api/admin/companions/[id] { is_live: true, is_visible_to_users: true }

**Admin companions list:**
- All companions now show as "Live" by default
- Filter: All | Live | Taken Down | Rejected
- Remove the "Pending review" filter (it will always be empty)
- Add "New today" badge for companions registered in last 24 hours

**What admin still does:**
- Reviews profiles for policy violations (nudity before approval, fake profiles)
- Takes down bad profiles immediately
- Rejects applicants who clearly violate terms (reapply flow still works)
- Photo approval: individual photo approve/reject still works
- Story moderation: stories still go through moderation_status = pending/approved

---

### Welcome State on Dashboard (New)
When a companion lands on /dashboard?welcome=1 for the first time, show an onboarding banner:

```
"Your stage is live. Here's how to attract your first dreamers:"

[ ] Complete your profile (bio, tagline, city)    → /dashboard/profile
[ ] Upload at least 3 photos                       → /dashboard/photos
[ ] Write your first story                         → /dashboard/stories
[ ] Set your session rate                          → /dashboard/profile
[ ] Toggle yourself Live                           → (sidebar toggle)
```

Store completion in localStorage key `bb_onboarding_done`. Remove banner once all 5 done.
This goes in app/dashboard/page.tsx.

---

## SECTION B — ONBOARDING FIELD COMPARISON + SIMPLIFICATION

### Competitor Field Comparison

| Field | BlushBite (current) | MassageRepublic | ShemaLeListing | EmpireEscort | Skokka |
|---|---|---|---|---|---|
| Email | Step 1 (required) | Required | Required | Required | Required |
| Password | None (OTP only) | Required | Required | Required | Optional |
| Full legal name | Step 1 (required) | Not required | Not required | Not required | Not required |
| Date of Birth | Step 1 (required) | Not required (just 18+ checkbox) | Not required | Not required | Not required |
| Country | Step 1 (required) | Optional/profile | Optional | Not required | City only |
| City | Step 1 (required) | Profile builder | Profile builder | Yes (for listing) | Yes (required for listing) |
| WhatsApp number | Step 1 (optional) | Not collected | Not collected | Not collected | Not collected |
| Display name / stage name | Step 2 | Profile builder | Profile builder | Profile builder | Ad title |
| Gender | Step 2 | Profile builder | Profile builder | Profile builder | Category selection |
| Tagline | Step 2 | Profile builder | Profile builder | Profile builder | Ad description |
| Bio | Step 2 | Profile builder | Profile builder | Profile builder | Ad description |
| Session modality | Step 2 | Profile builder | Not collected | Not collected | Not collected |
| Profile photo | Step 3 | Profile builder (after signup) | Profile builder | Profile builder | Ad images |
| Notes | Step 3 | Not collected | Not collected | Not collected | Not collected |
| 18+ agreement | None (just DOB validation) | Checkbox | Checkbox | Disclaimer click | Age gate |
| ToS agreement | None | Required | Required | Required | Required |
| OTP email verify | Yes (before apply) | No (email link after) | No | No | No |

### Key Finding
BlushBite collects the MOST fields at registration — 10+ fields across 3 steps — while competitors collect 2-4 fields max and push everything else to profile builder post-signup.

BlushBite also collects DOB as hard gate (validate 18+) while every competitor uses a simple 18+ checkbox. The DOB gate is defensible legally but adds friction.

### Recommended Simplified Flow

**New Step 1 (only 3 fields):**
- Display name / stage name (not legal name)
- Email
- 18+ checkbox + ToS agree
→ "Send me a login link" button

**New Step 2:**
- OTP 6-digit code from email

**On OTP verify → account created → redirect to /dashboard?welcome=1**

**Everything else moves to /dashboard/profile:**
- Full legal name (for internal records, never shown publicly)
- Date of birth (for internal records, age verification)
- Country, City
- WhatsApp number
- Gender, tagline, bio, session modality
- Photos, videos

### What This Achieves
- Reduces registration from 10+ fields across 3 steps to 3 fields in 1 step
- Matches competitor onboarding friction
- Companion gets into dashboard immediately and builds profile there
- More field completion because companions are motivated once they're inside the platform
- DOB/legal name still collected (in dashboard profile) — legal protection maintained

### Implementation Files
- `app/page.tsx` — rewrite wizard to 2-step (email+name+agree → OTP)
- `app/api/companions/apply/route.ts` — update validate() to only require email, displayName, 18+agree
  - Remove required checks for: fullName, dateOfBirth, country, city
  - Keep optional for: all other fields (they come from profile builder later)
- `app/api/companions/profile/route.ts` — add fullName, dateOfBirth fields to PATCH handler
  - These fields now get updated from profile builder, not apply
- `app/dashboard/profile/page.tsx` — add fullName, dateOfBirth fields to the profile form
  - Mark them as "Required for compliance" to encourage completion
  - Show a yellow notice if not yet filled: "Add your legal name and DOB to secure your account"

### Keep These in Apply (minimum required)
- displayName (needed to create JWT payload name field and alias)
- email (required — it's the account identifier)
- 18+ checkbox agree (required — legal compliance)
- ToS agree (required — legal compliance)
- gender (optional at apply — for routing to correct category on creation)

### Remove from Apply, Move to Profile Builder
- fullName (legal name) — move to profile, mark required for compliance
- dateOfBirth — move to profile, mark required for compliance
- country — move to profile
- city — move to profile (also needed for listing location)
- whatsappNumber — move to settings
- tagline — move to profile
- bio — move to profile
- sessionModality — move to profile
- notes — remove entirely (never surfaced anywhere currently)
- profilePhoto — keep as optional Step 2 or move to dashboard photos

---

## SECTION C — AGE GATE + TERMS AND CONDITIONS

### C1. Age Gate Implementation

**File to create:** `components/AgeGate.tsx`
**Where to add it:** `app/layout.tsx` — render conditionally based on localStorage

**Behaviour:**
- On first visit (no localStorage key `bb_age_confirmed`), show fullscreen overlay
- Blocks all content behind it
- Two buttons: "I am 18 or older — Enter" and "Exit"
- "Exit" redirects to https://www.google.com
- On confirm: set localStorage `bb_age_confirmed = '1'`, dismiss overlay
- Must NOT fire on server render (use `useEffect` + mounted state to read localStorage)
- Cookie alternative for SEO bots: also set a cookie `bb_age=1; max-age=31536000`

**Visual design (matching BlushBite style):**
```
Full viewport overlay: background #07090f, z-index 9999
Centered card: max-width 400px, background #0d1117, border #1c2333, border-radius 20px

Logo at top
Then:
  "This website contains adult content intended for mature audiences only."
  "By entering, you confirm you are at least 18 years of age."

[I am 18 or older — Enter]   ← primary button, full width, background #e8607a
[Exit]                        ← ghost button, full width, border #1c2333
```

**Component structure:**
```typescript
// components/AgeGate.tsx
'use client'
import { useState, useEffect } from 'react'

export function AgeGate() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('bb_age_confirmed')) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  function confirm() {
    localStorage.setItem('bb_age_confirmed', '1')
    document.cookie = 'bb_age=1; max-age=31536000; path=/; SameSite=Lax'
    setShow(false)
  }

  function exit() {
    window.location.href = 'https://www.google.com'
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#07090f',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* card + logo + copy + buttons */}
    </div>
  )
}
```

Add `<AgeGate />` in `app/layout.tsx` before the `{children}` render.

---

### C2. Terms and Conditions Page

**File to create:** `app/terms/page.tsx`
**Style:** Server component, same dark design as rest of site, no auth required

**Content (adapted from MassageRepublic — Netherlands law — with BlushBite specifics):**

```
BLUSHBITE — TERMS AND CONDITIONS
Last updated: [current date]
Governing law: Kingdom of the Netherlands

1. ACCEPTANCE OF TERMS
By accessing or using blushbite.live, you confirm that you are at least 18 years of age
and that you accept these Terms in full. If you do not accept these Terms, you must
leave this website immediately.

2. NATURE OF THE SERVICE
BlushBite is a private platform that allows adult companions to advertise their time
and companionship to other consenting adults. BlushBite is an advertising platform
and intermediary only. We do not provide, arrange, or facilitate any physical services.
All advertisements are placed by independent adult individuals acting on their own behalf.

3. AGE VERIFICATION
You must be 18 years of age or older to use this website. By entering, you confirm
this under penalty of immediate account termination. If we find that you have
misrepresented your age, your profile will be deleted without warning or refund.

4. USER RESPONSIBILITIES
You are solely responsible for:
- The accuracy and legality of your listings and content
- Complying with all applicable local, national, and international laws
- Any agreements made between you and other users
BlushBite accepts no responsibility for interactions between users.

5. PROHIBITED CONTENT
You may not post content that:
- Displays full frontal nudity or genitalia on publicly accessible pages
- Involves or appears to involve anyone under 18 years of age
- Promotes racism, bigotry, hatred, or physical harm
- Contains spam, false information, or misleading claims
- Infringes any third-party intellectual property rights
- Violates applicable law in the Netherlands or your jurisdiction

6. INTELLECTUAL PROPERTY
You retain ownership of content you upload. By uploading content, you grant BlushBite
a non-exclusive, worldwide, royalty-free licence to display and distribute that content
on this platform.

7. ACCOUNT TERMINATION
BlushBite may suspend or terminate any account at any time for violation of these Terms,
without notice or refund obligation.

8. LIMITATION OF LIABILITY
BlushBite provides this platform on an "as is" basis. We make no warranties as to
accuracy, availability, or fitness for purpose. To the maximum extent permitted by law,
BlushBite is not liable for any direct, indirect, incidental, or consequential damages.

9. PRIVACY AND DATA
Your data is processed in accordance with our Privacy Policy, which forms part of
these Terms. BlushBite complies with the General Data Protection Regulation (GDPR).

10. CHANGES TO TERMS
We may update these Terms at any time. Continued use of the platform after changes
constitutes acceptance of the updated Terms.

11. GOVERNING LAW
These Terms are governed exclusively by the laws of the Kingdom of the Netherlands.
Any disputes shall be subject to the exclusive jurisdiction of the courts of Amsterdam,
Netherlands.

12. CONTACT
For questions about these Terms: legal@blushbite.live
```

**Add to middleware.ts PUBLIC routes** (terms page should be publicly accessible — not protected):
Terms page is a Server Component at `/terms` so middleware already ignores it (only protects /dashboard/*, /status, /reapply, /api/companions/*).

---

### C3. Privacy Policy Page

**File to create:** `app/privacy/page.tsx`

**Content (GDPR-compliant, Netherlands):**

```
BLUSHBITE — PRIVACY POLICY
Last updated: [current date]
Data Controller: BlushBite, Netherlands

1. WHAT DATA WE COLLECT
- Registration data: display name, email address, date of birth, country, city
- Profile data: bio, tagline, photos, videos, stories, session preferences
- Communication data: WhatsApp number (optional)
- Usage data: page views, session duration (via privacy-respecting analytics)
- Technical data: IP address, browser type, cookie identifiers

2. HOW WE USE YOUR DATA
- To operate and maintain your companion profile
- To process bookings and communications with dreamers
- To send transactional emails (OTP, notifications)
- To comply with legal obligations
- To prevent fraud and abuse

3. DATA STORAGE
Your data is stored on servers in the European Union. We use Railway (EU region) for
database hosting and Cloudinary (EU region) for media storage.

4. DATA RETENTION
Active account data: retained while account is active.
Deleted accounts: personal data deleted within 30 days of account deletion request.
Financial records: retained for 7 years per Dutch tax law.

5. YOUR RIGHTS (GDPR)
You have the right to: access, correct, delete, restrict processing of, and port your data.
To exercise these rights: privacy@blushbite.live. We will respond within 30 days.

6. COOKIES
We use essential cookies for authentication (bb_session) and age verification (bb_age).
We do not use advertising or third-party tracking cookies.

7. THIRD PARTIES
We share data with:
- Cloudinary (media storage) — cloudinary.com/privacy
- Resend (email delivery) — resend.com/privacy
- Railway (hosting) — railway.app/privacy

8. CONTACT
Data protection queries: privacy@blushbite.live
```

---

### C4. Cookie Consent Banner

**File to create:** `components/CookieBanner.tsx`
**Where to add:** `app/layout.tsx`

Minimal — since BlushBite only uses essential cookies (no analytics, no ads), the banner can be simple:

```
"We use essential cookies for login and age verification only. No tracking.
[Got it]"
```

Show once, dismiss to localStorage `bb_cookie_ok = '1'`.
Fixed bottom of screen, z-index below age gate (8000).

---

### C5. Footer Links
Update the landing page footer to include:
- Terms & Conditions → /terms
- Privacy Policy → /privacy
- Companion Guidelines → /companion-guidelines (to build)
- Contact → mailto:hello@blushbite.live

These links MUST be present on the landing page. They are required for:
- Google not flagging as untrustworthy
- Netherlands legal compliance
- GDPR Article 13 (inform users of data processing at point of collection)

---

## SECTION D — PHOTO VERIFICATION BADGE SYSTEM

### What to Build
When admin reviews a companion's photos, they can mark individual photos as verified.
A "Verified Photos" badge appears on the companion's public profile on blushbite.co.

### Files

**D1. Database — companion_photos table**
Add column: `photo_verification_status VARCHAR DEFAULT 'pending'`
Values: 'pending' | 'verified' | 'failed'

Migration SQL:
```sql
ALTER TABLE companion_photos ADD COLUMN IF NOT EXISTS
  photo_verification_status VARCHAR(20) DEFAULT 'pending';
```

**D2. app/api/companions/photos/route.ts**
Add `photo_verification_status` to the SELECT in GET handler.

**D3. app/dashboard/photos/page.tsx**
Update badge rendering:
- `is_approved = true AND photo_verification_status = 'verified'` → show gold "✦ Verified" badge
- `is_approved = true AND photo_verification_status = 'pending'` → show amber "⏳ Approved" badge (current)
- `is_approved = false` → show "⏳ Pending review" badge (current)

**D4. Admin panel on blushbite.co (note for that codebase)**
Add "Verify photo" button per photo in companion detail view:
- POST /api/admin/companions/[id]/photos/[photoId]/verify
- Sets photo_verification_status = 'verified'
- Separate from is_approved (can be approved but not yet verified with selfie)

---

## SECTION E — SEO FOUNDATION

### E1. Meta Tags in app/layout.tsx (Quick Win)
Add to the root metadata export:
```typescript
export const metadata: Metadata = {
  title: 'BlushBite — Private Companions',
  description: 'A private platform where adult companions advertise their time and companionship. Verified profiles. Netherlands-based.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'BlushBite — Private Companions',
    description: 'A curated platform for adult companions.',
    url: 'https://blushbite.live',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}
```

### E2. JSON-LD Structured Data in app/layout.tsx
Add a `<script type="application/ld+json">` tag:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BlushBite",
  "url": "https://blushbite.live",
  "logo": "https://blushbite.live/logo.png",
  "description": "A private platform where adult companions advertise their time and companionship"
}
```

### E3. robots.txt
Create `public/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /reapply
Sitemap: https://blushbite.live/sitemap.xml
```

### E4. sitemap.xml
Create `app/sitemap.ts` (Next.js 15 dynamic sitemap):
```typescript
export default function sitemap() {
  return [
    { url: 'https://blushbite.live', lastModified: new Date() },
    { url: 'https://blushbite.live/terms', lastModified: new Date() },
    { url: 'https://blushbite.live/privacy', lastModified: new Date() },
    // Add city pages as they are created
  ]
}
```

### E5. Geographic Landing Pages (Medium Term)
Create `app/companions/[country]/[city]/page.tsx` as SSG:
- Fetches approved, live companions in that city
- SEO title: "[City] Companions — BlushBite"
- Breadcrumb schema: BlushBite > Companions > [Country] > [City]
- Start with: amsterdam, berlin, london, paris, brussels (EU focus)
- Later: bangalore, mumbai, delhi (if India expansion planned)

---

## SECTION F — PAYMENT SYSTEM (Revenue)

### F1. Choose Payment Processor
Stripe, PayPal, and Razorpay WILL terminate adult platform accounts.

**Recommended: CCBill** (industry standard, EU merchants supported)
Alternative: Verotel (EU-based, GDPR native)
Also add: Crypto (USDT via CoinGate or similar) — zero chargeback risk

CCBill onboarding:
1. Apply at ccbill.com as EU merchant
2. Provide Netherlands company registration + ID
3. Provide website URL + terms/privacy pages (required by CCBill) — another reason to build legal pages first
4. CCBill provides a flexform URL (hosted payment page)
5. Integrate via CCBill Datalink API for subscription management

### F2. Subscription Tiers Data Model
Add to database:
```sql
CREATE TABLE companion_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id UUID REFERENCES companions(id),
  tier VARCHAR(20) NOT NULL,          -- 'free' | 'standard' | 'premium'
  status VARCHAR(20) NOT NULL,        -- 'active' | 'cancelled' | 'expired'
  ccbill_subscription_id VARCHAR(100),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### F3. Tier Definitions
```
Free:
  - Profile exists but NOT visible to dreamers (is_visible_to_users = false)
  - Can build profile, upload content
  - No bookings receivable

Standard — EUR 29/month:
  - Profile visible to dreamers
  - Up to 8 photos + 3 videos
  - Up to 5 stories
  - Basic analytics
  - Bookings enabled

Premium — EUR 59/month:
  - Everything in Standard
  - Featured placement in city/category browse
  - Verified badge priority
  - Unlimited stories + videos
  - Full analytics (30-day chart, source tracking)
  - Priority support

Top Placement — EUR 15/week (add-on, any tier):
  - Pinned to top of city results for 7 days
```

### F4. Implementation Files
- `app/dashboard/upgrade/page.tsx` — new page showing tier comparison + upgrade CTA
- `app/api/companions/subscription/route.ts` — GET current tier, POST initiate upgrade
- `app/api/webhooks/ccbill/route.ts` — handle CCBill payment notifications
- `lib/subscription.ts` — tier check helper: `getCompanionTier(companionId)`
- Update `app/dashboard/layout.tsx` sidebar to show current tier badge
- Gate certain dashboard features behind tier checks

---

## SECTION G — POST-APPLICATION COMMUNICATION SEQUENCE

Currently nothing is sent after registration. Build this sequence:

### G1. Immediately on Apply (already in apply/route.ts — extend it)
Add after successful INSERT:
```
WhatsApp (if whatsappNumber provided):
"Welcome to BlushBite. Your stage is live. Start building now: blushbite.live/dashboard"

Email (Resend):
Subject: "Your BlushBite stage is waiting"
Body: Welcome message, link to dashboard, what to do first
```

### G2. T+4 hours (cron job / Railway scheduled task)
If profile_completeness < 30:
```
WhatsApp: "Your profile is only 30% complete. Add photos and a bio to attract your first dreamers."
```

### G3. T+24 hours
If no photos uploaded:
```
WhatsApp: "Your stage is empty. Upload your first photo — it takes 2 minutes."
```

### G4. T+72 hours
If not toggled live (is_live = false):
```
Email: "3 dreamers searched for companions in [city] today. Your profile isn't visible yet — go live now."
```

### Implementation
- `lib/email.ts` — add sendWelcomeEmail function
- `app/api/companions/apply/route.ts` — call sendWelcomeEmail after COMMIT
- Railway cron jobs for T+4h, T+24h, T+72h sequences

---

## SECTION H — DASHBOARD UX IMPROVEMENTS

### H1. Welcome Banner for New Companions (app/dashboard/page.tsx)
Show when URL has ?welcome=1 or localStorage `bb_onboarding_done` is not set.

Checklist items (check against live data):
1. Profile complete (bio + tagline filled) — check cp.bio and cp.tagline
2. Photos uploaded (≥1) — check companion_photos count
3. First story written — check stories count
4. Rate set (hourly_rate > 0) — check cp.hourly_rate
5. Toggled Live — check cp.is_live

### H2. Status Page Cleanup (app/status/page.tsx)
- Remove the 'pending' state UI entirely (or repurpose for taken_down)
- Add 'taken_down' state: "Your profile has been temporarily paused by our team. [Contact support]"
- Keep 'rejected' state unchanged
- Keep 'approved' state (now shows immediately after registration confetti)

### H3. Sidebar Profile Completeness (app/dashboard/layout.tsx)
Currently shows completeness bar only for approved companions.
Since all companions are now approved on registration, always show it.
Add motivation text below bar: "Complete your profile to appear in more searches."

### H4. Application Status Badge in Sidebar
Currently shows amber "Under review" badge for pending.
Replace with nothing for normal companions.
For taken_down: show red "Profile paused — contact support" badge.

---

## EXECUTION ORDER (Priority Sequence)

```
SPRINT 1 — Legal Foundation (Do Before Any Marketing — 2-3 days)
  [ ] C1 — Age gate component (AgeGate.tsx)
  [ ] C2 — Terms & Conditions page (app/terms/page.tsx)
  [ ] C3 — Privacy Policy page (app/privacy/page.tsx)
  [ ] C4 — Cookie consent banner (CookieBanner.tsx)
  [ ] C5 — Footer links updated on landing page

SPRINT 2 — Instant Live (Core Flow Change — 1-2 days)
  [ ] A1 — apply/route.ts: set is_live=true, is_visible_to_users=true, insert stage 7, redirectTo /dashboard?welcome=1
  [ ] A2 — me/route.ts: change status logic (approved by default, taken_down state)
  [ ] A3 — login/verify-otp/route.ts: default redirect to /dashboard
  [ ] A4 — dashboard/layout.tsx: remove lock logic, all nav unlocked
  [ ] A5 — page.tsx: update success screen copy
  [ ] A6 — status/page.tsx: add taken_down state, remove pending state
  [ ] NOTE admin panel (blushbite.co): change Approve→TakeDown in that codebase separately

SPRINT 3 — Onboarding Simplification (1-2 days)
  [ ] B1 — Rewrite app/page.tsx wizard to 2-step (email+name+agree → OTP)
  [ ] B2 — Update apply/route.ts validate() — remove required checks on fullName, DOB, country, city
  [ ] B3 — Update dashboard/profile/page.tsx — add fullName, DOB, country fields
  [ ] B4 — Update profile/route.ts PATCH — handle fullName, dateOfBirth updates
  [ ] B5 — Add "Required for compliance" notice on profile page for legal fields

SPRINT 4 — Trust Signals (1 day)
  [ ] D1 — DB migration: add photo_verification_status column
  [ ] D2 — photos/route.ts: add field to GET
  [ ] D3 — dashboard/photos/page.tsx: update badge logic
  [ ] H1 — Welcome banner on dashboard/page.tsx with onboarding checklist
  [ ] E1 — Meta tags in app/layout.tsx
  [ ] E2 — JSON-LD in app/layout.tsx
  [ ] E3 — robots.txt
  [ ] E4 — sitemap.ts

SPRINT 5 — Communications (1 day)
  [ ] G1 — sendWelcomeEmail in lib/email.ts
  [ ] G1 — Call sendWelcomeEmail from apply/route.ts after COMMIT
  [ ] G1 — WhatsApp welcome message from apply/route.ts (if whatsappNumber provided)

SPRINT 6 — Revenue Foundation (1 week)
  [ ] F1 — Apply to CCBill (requires legal pages to be done first)
  [ ] F2 — DB migration: companion_subscriptions table
  [ ] F3 — app/dashboard/upgrade/page.tsx
  [ ] F4 — api/companions/subscription route
  [ ] F4 — api/webhooks/ccbill route
  [ ] F4 — lib/subscription.ts tier check helper

SPRINT 7 — SEO Growth (ongoing)
  [ ] E5 — Geographic landing pages (start with 5 EU cities)
  [ ] Add more cities as companion base grows
```

---

## COMPANION-GUIDELINES PAGE (to build)

**File:** `app/companion-guidelines/page.tsx`

Content:
```
BLUSHBITE COMPANION GUIDELINES

Who can join BlushBite:
- Adults 18 years of age or older
- Anyone wishing to advertise their companionship and time
- All genders and identities welcome

What content is allowed:
- Professional photos (tasteful, non-explicit)
- Short personality videos (face, speaking to camera, max 60s)
- Literary stories (emotionally written, not pornographically explicit)
- Session offerings describing your time and companionship

What is NOT allowed:
- Explicit sexual content (genitalia, sexual acts) on any public-facing page
- Photos of anyone under 18
- Misleading information (catfishing, fake photos)
- Advertising illegal services
- Multiple accounts for the same person
- Content that violates another person's privacy or consent

Your profile will be reviewed. Violations result in:
- First violation: content removed, warning issued
- Second violation: profile suspended
- Third violation: permanent ban, data deletion

How to appeal: support@blushbite.live
```

---

## FILES SUMMARY (All Files to Create or Modify)

### New Files to Create
```
components/AgeGate.tsx
components/CookieBanner.tsx
app/terms/page.tsx
app/privacy/page.tsx
app/companion-guidelines/page.tsx
app/sitemap.ts
public/robots.txt
lib/subscription.ts  (Sprint 6)
app/dashboard/upgrade/page.tsx  (Sprint 6)
app/api/companions/subscription/route.ts  (Sprint 6)
app/api/webhooks/ccbill/route.ts  (Sprint 6)
```

### Existing Files to Modify
```
app/layout.tsx                           — add AgeGate, CookieBanner, metadata, JSON-LD
app/page.tsx                             — simplify wizard to 2-step, update success copy
app/status/page.tsx                      — remove pending state, add taken_down state
app/dashboard/layout.tsx                 — remove lock logic, always show completeness bar
app/dashboard/page.tsx                   — add welcome banner with onboarding checklist
app/dashboard/profile/page.tsx           — add fullName, DOB, country fields
app/api/companions/apply/route.ts        — auto-approve, redirect to dashboard, simplify validation
app/api/companions/me/route.ts           — change status logic
app/api/companions/login/verify-otp/route.ts — default redirect to dashboard
app/api/companions/profile/route.ts      — handle fullName, dateOfBirth in PATCH
app/api/companions/photos/route.ts       — add photo_verification_status to GET
app/dashboard/photos/page.tsx            — update badge logic for verification status
lib/email.ts                             — add sendWelcomeEmail function
```

### Separate Codebase (blushbite.co admin — note for that session)
```
Change Approve button → TakeDown/Restore toggle
Change companions list filter: remove Pending, add Taken Down
Add "New today" badge
Update PATCH /api/admin/companions/[id] to handle is_live toggle as takedown
```

---

*Last updated: July 2026 | Based on research.md findings | BlushBite companion portal: C:\Users\Ravi Desai\Downloads\blush\landingpagebb-*
