# CLAUDE.md — blushbite.live Companion Portal

> Read this before writing any code. This is the single source of truth for architecture, schema, auth, and patterns.
> Last updated: July 2026 — reflects Sprint 0–6 implementation state.

---

## Project Overview

**blushbite.live** — companion onboarding + self-service portal. Next.js 15 App Router, TypeScript, Railway PostgreSQL, Cloudinary, Resend email.

**blushbite.co** — main consumer app (dreamers). Separate codebase, separate deployment, shares the same Railway PostgreSQL database.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router (`app/`) |
| Language | TypeScript 5 |
| CSS | Tailwind CSS 4 + inline styles (no CSS modules) |
| Database | Railway PostgreSQL via `pg` Pool |
| ORM | Raw SQL with `query()` helper from `lib/db.ts` |
| Auth | Custom JWT (HS256 HMAC) — see Auth section |
| Storage | Cloudinary (photos + videos) |
| Email | Resend |
| Hosting | Railway via `nixpacks.toml` |

---

## Current Architecture — Full Flow (as built)

### 1. Root Page — Gender Picker + 3-Layer Device Binding

`app/page.tsx` is a **server component** that renders `app/GenderPickerClient.tsx` (client component).

**Middleware handles routing for `/`** (in `middleware.ts`):
1. **Layer 1 — Authenticated session**: if valid `bb_session` JWT exists → redirect `/dashboard`
2. **Layer 2 — Device community cookie**: if `bb_community` cookie is set and valid → redirect `/{community}`
3. **Layer 3 — Fall through**: render the gender picker

**GenderPickerClient.tsx logic** (runs client-side after picker loads):
1. Check `localStorage.getItem('bb_community')` — if set, redirect immediately
2. If not in localStorage: compute SHA-256 device fingerprint via `lib/fingerprint.ts`
3. Call `GET /api/device/community-lookup?fp={hash}` — if found in DB, redirect to that community
4. Else: show the three community cards (Female / Male / Shemale) for manual selection
5. On community select: store in `localStorage`, POST `/api/device/bind` with fingerprint + community, set `bb_community` cookie client-side, redirect to `/{community}`

### 2. Community Landing Pages

`app/[gender]/page.tsx` — **server component**
- Valid values: `female`, `male`, `shemale` (redirects `/` on any other value)
- Fetches live stats from DB (companion_count, city_count for this community)
- Generates community-specific SEO metadata via `generateMetadata()`
- Injects JSON-LD Organization schema
- Renders `GenderLanding.tsx` with community + stats props

`app/[gender]/GenderLanding.tsx` — **client component**
- Community-specific config (`COMMUNITY_CONFIG`): accent color, grid color, hero copy, badge text, hero h1/sub
- **2-step apply form** (NOT the old 3-step wizard):
  - Step 1: displayName + email + 18+ checkbox + ToS agree → "Send me a login link"
  - Step 2: 6-digit OTP input → submit → account created → redirect `/dashboard?welcome=1`
- Live stats bar: `{companionCount} companions · {cityCount} cities · EU-verified`
- Features section (4 cards: booking management, stories, analytics, privacy)
- Trust bar (EU hosted, GDPR, admin-backed, alias protected)
- Footer: Terms · Privacy · Companion Guidelines · Contact

### 3. Application API — Instant Live (no approval gate)

`app/api/companions/apply/route.ts`:
- Validates: `displayName`, `email`, `agreeToTerms` only (minimal friction)
- Creates DB rows in a transaction:
  - `companions` row (`companion_stage=3`, `onboarding_complete=false`, `gender_community` set)
  - `companion_profiles` row with `is_live=TRUE`, `is_visible_to_users=TRUE` (instant live)
  - `companion_onboarding_progress` stages 1, 2, 7 as `'completed'` (auto-approved)
- Sets session JWT cookie (`bb_session`) and community cookie (`bb_community`)
- Calls `sendWelcomeEmail()` after commit
- Returns `{ success: true, redirectTo: '/dashboard?welcome=1' }`

**Result: companions go live immediately on registration. No 48-hour wait. No admin approval needed.**

Admin role changes from "approve to live" → "monitor and take down" (is_live=false if violation).

### 4. Login Flow

`app/login/page.tsx`:
1. Email → POST `/api/companions/login/send-otp` → Resend 6-digit OTP (10 min TTL)
2. OTP → POST `/api/companions/login/verify-otp` → session JWT + `bb_community` cookie set
3. Redirect: rejected → `/reapply` | everyone else → `/dashboard`

### 5. Dashboard

`app/dashboard/layout.tsx`:
- Fetches `/api/companions/me` on mount — redirects to `/login` if unauthenticated
- **No approval lock** — all nav items freely accessible for all authenticated companions
- Desktop (≥768px): 240px fixed sidebar — logo, completeness bar, live toggle, full nav, tier badge
- Mobile (<768px): fixed bottom tab bar — 5 tabs
- `taken_down` status: shows red "Profile paused — contact support" badge in sidebar
- Sidebar shows tier badge (Premium / Standard / Upgrade) based on subscription

`app/dashboard/page.tsx`:
- Shows welcome onboarding checklist when `?welcome=1` or `localStorage.bb_onboarding_done` not set
- Checklist: complete profile · upload 3 photos · write first story · set rate · toggle live
- Progress stored in localStorage key `bb_onboarding_done`

---

## Auth System

### JWT Cookie

- **Algorithm**: HS256 HMAC (Web Crypto in middleware, Node `crypto` in routes)
- **Cookie name (prod)**: `__Host-bb_session` (requires HTTPS + no Domain attribute)
- **Cookie name (dev)**: `bb_session`
- **Expiry**: 7 days
- **Env var**: `COMPANION_JWT_SECRET` (required — server throws at startup if missing)
- **Payload**: `{ sub: companionId (UUID), email, name, community, exp }`
  - `community` field added — middleware injects it as `x-companion-community` header

### Community Cookie

- **Cookie name**: `bb_community`
- **Values**: `female` | `male` | `shemale`
- **Set by**: `apply/route.ts` and `login/verify-otp/route.ts`
- **Read by**: `middleware.ts` for root `/` routing (Layer 2)
- **Set client-side also**: `GenderPickerClient.tsx` sets it on community selection

### Key files

| File | Purpose |
|---|---|
| `lib/session.ts` | `signJwt`, `verifyJwt`, `getSession()`, `buildSessionCookie()`, `buildCommunityCookie()`, `clearSessionCookie()` |
| `middleware.ts` | Edge Runtime JWT verification, 3-layer root routing, protects routes, injects request headers |
| `lib/fingerprint.ts` | Client-side SHA-256 fingerprint from browser signals (language, screen, timezone, platform, CPU, memory) |

### Protected routes (middleware)

- Pages: `/dashboard/*`, `/status`, `/reapply`
- API: `/api/companions/*` except: `send-otp`, `verify-otp`, `apply`, `login/*`
- Device API: `/api/device/*` — public (no auth required)
- Cron API: `/api/cron/*` — secured by `Authorization: Bearer {CRON_SECRET}` header (not JWT)

### How to read session in a Route Handler

```ts
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // session.sub = companionId (UUID)
  // session.community = 'female' | 'male' | 'shemale'
}
```

**Always guard with early `if (!session) return 401` before any DB or side-effect operations.**

---

## Middleware — Root Routing Logic

```ts
// middleware.ts — root '/' routing (3-layer):
if (pathname === '/') {
  // Layer 1: already logged in → skip the picker entirely
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (token) {
    const session = await verifyJwt(token)
    if (session) return redirect('/dashboard')
  }
  // Layer 2: device already bound to a community via cookie
  const community = req.cookies.get('bb_community')?.value
  if (community && VALID_COMMUNITIES.includes(community)) return redirect(`/${community}`)
  // Layer 3: show picker
  return NextResponse.next()
}
```

Matcher: `['/', '/dashboard/:path*', '/status', '/reapply', '/api/companions/:path*']`

---

## Device Binding System

Stores a mapping of device fingerprint → community in the database.

### `lib/fingerprint.ts`

Computes a SHA-256 hex hash (64 chars) from browser signals:
- `navigator.language`, `screen.width x height x colorDepth`
- `Intl.DateTimeFormat().resolvedOptions().timeZone`
- `navigator.platform`, `navigator.hardwareConcurrency`, `navigator.deviceMemory`

### `app/api/device/bind` (POST)

- Validates: `fingerprint_hash` (64-char hex) + `community` (female/male/shemale)
- Optionally attaches `companion_id` from session if authenticated
- Upserts into `device_community_bindings` table:
  ```sql
  INSERT ... ON CONFLICT (fingerprint_hash) DO UPDATE
    SET community = $2, companion_id = COALESCE($3, ...), last_seen = now()
  ```

### `app/api/device/community-lookup` (GET)

- Query param: `?fp={hash}`
- Returns `{ found: true, community: 'female' }` or `{ found: false }`
- Fire-and-forget `last_seen` update on hit

---

## Database

### Connection

```ts
import { query, pool } from '@/lib/db'

// Single statement — use query()
const rows = await query<{ id: string }>('SELECT id FROM companions WHERE email = $1', [email])

// Multi-statement / transaction — use pool.connect()
const client = await pool.connect()
try {
  await client.query('BEGIN')
  // ... queries ...
  await client.query('COMMIT')
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  throw err
} finally {
  client.release()
}
```

**Always use a transaction (`BEGIN/COMMIT/ROLLBACK`) when doing multiple INSERTs that must all succeed or all fail.**

### Key Tables

#### `companions`
```
id UUID PK
email VARCHAR UNIQUE
name VARCHAR            -- display name / stage name
alias VARCHAR UNIQUE    -- generated public alias
full_name VARCHAR       -- legal name (filled via dashboard/profile)
date_of_birth TIMESTAMP -- filled via dashboard/profile
country VARCHAR         -- filled via dashboard/profile
whatsapp_number VARCHAR
companion_stage INT     -- 3 after apply
gender_community VARCHAR -- 'female' | 'male' | 'shemale' (set on apply)
hashed_password VARCHAR -- bcrypt, nullable (OTP is default login)
onboarding_complete BOOLEAN
created_at, updated_at TIMESTAMP
```

#### `companion_profiles`
```
id UUID PK
companion_id UUID FK → companions.id
bio TEXT
tagline VARCHAR(300)
city VARCHAR
city_slug VARCHAR(100)    -- URL-safe slug e.g. 'new-delhi' (written by profile PATCH)
country_slug VARCHAR(100) -- URL-safe slug e.g. 'india' (written by profile PATCH)
gender VARCHAR
availability_status VARCHAR  -- 'offline' | 'online' | 'busy'
whatsapp_number VARCHAR
session_modality VARCHAR     -- 'in_person' | 'online' | 'both'
hourly_rate NUMERIC
currency VARCHAR
is_live BOOLEAN              -- admin can set false to take down
is_verified BOOLEAN          -- admin verified
is_visible_to_users BOOLEAN  -- synced with is_live
profile_completeness INT     -- 0–100
instagram_handle VARCHAR
website_url TEXT
height_cm INT
body_type VARCHAR
eye_color VARCHAR
hair_color VARCHAR
skin_color VARCHAR
created_at, updated_at TIMESTAMP
```

#### `companion_photos`
```
id UUID PK
companion_profile_id UUID FK → companion_profiles.id
url TEXT                        -- Cloudinary secure_url
storage_key VARCHAR             -- Cloudinary public_id
alt_text TEXT
sort_order INT
is_primary BOOLEAN
is_approved BOOLEAN
photo_verification_status VARCHAR DEFAULT 'pending'  -- 'pending' | 'verified' | 'failed'
moderation_status VARCHAR
deleted_at TIMESTAMP    -- soft delete — always filter WHERE deleted_at IS NULL
created_at TIMESTAMP
```

#### `companion_videos`
```
id UUID PK
companion_profile_id UUID FK → companion_profiles.id
url TEXT
storage_key VARCHAR
thumbnail_url TEXT
duration_seconds INT
is_approved BOOLEAN
moderation_status VARCHAR
deleted_at TIMESTAMP    -- soft delete
created_at TIMESTAMP
```

#### `stories`
```
id UUID PK
title VARCHAR(200)
body TEXT
excerpt VARCHAR(500)
author_companion_id UUID FK → companions.id   (NOT companion_profiles.id)
moderation_status VARCHAR  -- 'pending' | 'approved' | 'rejected'
like_count, view_count, comment_count, save_count INT
deleted_at TIMESTAMP    -- soft delete
created_at, updated_at TIMESTAMP
```

#### `booking_requests`
```
id UUID PK
companion_profile_id UUID FK → companion_profiles.id
user_id UUID FK → users.id (on blushbite.co)
status VARCHAR  -- 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'
message TEXT
requested_for TIMESTAMP
modality VARCHAR
companion_notes TEXT
created_at, updated_at TIMESTAMP
```

#### `companion_onboarding_progress`
```
companion_id UUID FK → companions.id
stage INT               -- 1–7
status VARCHAR          -- 'completed' | 'rejected'
completed_at TIMESTAMP
notes TEXT
UNIQUE (companion_id, stage)
```

**Stage 7 status='completed' = companion is in the system. Combined with is_live=true = visible to dreamers.**
**On instant-live registration: stages 1, 2, 7 are all auto-completed. is_live=true immediately.**

#### `device_community_bindings` (NEW — Sprint 0)
```
id UUID PK
fingerprint_hash VARCHAR(64) UNIQUE  -- SHA-256 hex
community VARCHAR                    -- 'female' | 'male' | 'shemale'
companion_id UUID NULL               -- FK → companions.id (attached if authenticated)
created_at TIMESTAMP
last_seen TIMESTAMP
```

#### `companion_nudges` (NEW — Sprint 5)
```
id UUID PK
companion_id UUID FK → companions.id
nudge_type VARCHAR  -- 'profile_incomplete' | 'no_photos' | 'go_live'
sent_at TIMESTAMP
```
Prevents duplicate drip emails. Checked before sending each nudge.

#### `companion_subscriptions` (NEW — Sprint 6 — DB only, API pending)
```
id UUID PK
companion_id UUID FK → companions.id
tier VARCHAR(20)              -- 'free' | 'standard' | 'premium'
status VARCHAR(20)            -- 'active' | 'cancelled' | 'expired'
ccbill_subscription_id VARCHAR(100)
current_period_start TIMESTAMP
current_period_end TIMESTAMP
created_at, updated_at TIMESTAMP
```

### Companion Status Logic

```ts
// In /api/companions/me:
let status = 'approved'  // default — all registered companions are live
if (row.review_status === 'rejected') status = 'rejected'
else if (row.is_live === false && row.review_status !== 'completed') status = 'taken_down'
// taken_down = admin set is_live=false; companion can still login but sees paused notice
```

### Geo Slug Helper — `lib/slug.ts`

```ts
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
// "New Delhi" → "new-delhi" | "São Paulo" → "sao-paulo"
```

`city_slug` and `country_slug` are written to `companion_profiles` on every PATCH to city/country via `app/api/companions/profile/route.ts`. Used by geo landing pages on blushbite.co.

---

## File Upload Field Names

| Upload type | Frontend FormData field | Route reads |
|---|---|---|
| Photo (dashboard) | `form.append('file', file)` | `formData.get('file')` |
| Video (dashboard) | `form.append('video', file)` | `formData.get('video')` |

**Do not change these field names — they must match between frontend and route.**

---

## Cloudinary

```
Folder — photos:  'companion-applications'
Folder — videos:  'companion-videos'
resource_type:    'image' for photos, 'video' for videos
```

Env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

---

## OTP System

In-memory Map (`lib/otp.ts`). Survives requests within the same Railway process, but is lost on restart. TTL: 10 min. Rate limit: 3 requests/10-min window. Max attempts: 5.

Cleanup: expired entries are swept on every `storeOtp()` call.

---

## Email (Resend)

`lib/email.ts` — functions:
- `sendOtpEmail` — OTP delivery
- `sendApprovalEmail` — legacy (admin approval path, now unused in instant-live flow)
- `sendRejectionEmail` — sent when admin rejects
- `sendAdminReapplyNotification` — alerts admin when companion reapplies
- `sendWelcomeEmail` — NEW: sent immediately on registration (called in apply/route.ts)
- `sendProfileNudgeEmail` — NEW: T+4h drip if completeness < 30%
- `sendPhotoNudgeEmail` — NEW: T+24h drip if no photos uploaded
- `sendGoLiveNudgeEmail` — NEW: T+72h drip if is_live=false

Env vars: `RESEND_API_KEY`, `RESEND_FROM` (optional, defaults to `admin@blushbite.co`)

---

## Drip Email Cron

`app/api/cron/drip/route.ts` — POST endpoint, secured with `Authorization: Bearer {CRON_SECRET}`.

Checks all companions registered in the last 7 days and sends nudges based on state:
- T+4h: `sendProfileNudgeEmail` if `profile_completeness < 30` and not yet sent
- T+24h: `sendPhotoNudgeEmail` if no photos and not yet sent
- T+72h: `sendGoLiveNudgeEmail` if `is_live=false` and not yet sent

Uses `companion_nudges` table to prevent duplicate sends.

**Railway setup:** Add Cron Job service in Railway dashboard, schedule every 15 min:
```
curl -s -X POST https://blushbite.live/api/cron/drip -H "Authorization: Bearer $CRON_SECRET"
```

---

## Legal & SEO Pages

### Age Gate — `components/AgeGate.tsx`

Client component, added in `app/layout.tsx` before `{children}`.
- First visit (no `localStorage.bb_age_confirmed`): shows fullscreen overlay
- Blocks all content: "I am 18 or older — Enter" | "Exit" (→ google.com)
- On confirm: sets `localStorage.bb_age_confirmed = '1'` + cookie `bb_age=1; max-age=31536000`
- Does NOT render server-side (uses mounted state pattern)

### Cookie Banner — `components/CookieBanner.tsx`

Fixed bottom bar, z-index 8000 (below age gate). Dismissed to `localStorage.bb_cookie_ok = '1'`.

### Legal Pages (server components, no auth required)

| Page | File |
|---|---|
| `/terms` | `app/terms/page.tsx` |
| `/privacy` | `app/privacy/page.tsx` |
| `/companion-guidelines` | `app/companion-guidelines/page.tsx` |

All use Netherlands governing law framing. Terms use "time and companionship" language (MassageRepublic pattern — DSA safe harbour compliance).

### SEO Configuration

**`app/layout.tsx`** — root metadata:
- Title: `BlushBite — Private Companions`
- Description with "time and companionship" framing
- `robots: { index: true, follow: true }`
- OpenGraph + Twitter card
- JSON-LD Organization schema

**`app/[gender]/page.tsx`** — per-community metadata:
- Community-specific title, description, keywords (escort-safe framing)
- `alternates.canonical`: `https://blushbite.live/{gender}`
- JSON-LD Organization schema with community-specific description
- `robots: { index: true, follow: true }`

**`app/sitemap.ts`** — dynamic sitemap:
- Static: `/`, `/female`, `/male`, `/shemale`, `/terms`, `/privacy`, `/companion-guidelines`
- Priority 1.0 on community pages

**`app/robots.ts`** — robots configuration:
```
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /reapply
Sitemap: https://blushbite.live/sitemap.xml
```

**Geo landing pages** — built on blushbite.co (separate codebase), NOT on blushbite.live.
The slug columns (`city_slug`, `country_slug`) in `companion_profiles` feed those pages.

---

## Subscription / Upgrade

`app/dashboard/upgrade/page.tsx` — exists, shows 3-tier comparison (Free / Standard €29 / Premium €59).
- Upgrade buttons placeholder (CCBill integration pending).
- Shows current tier badge pulled from `/api/companions/me` (tier field).

**Status: DB migration done, upgrade page done. API routes + webhook NOT yet built.**
See todo.md SPRINT 6 for remaining items.

---

## Required Environment Variables

```bash
DATABASE_URL                    # Railway PostgreSQL connection string
COMPANION_JWT_SECRET            # HS256 signing secret — REQUIRED
RESEND_API_KEY                  # Email sending
RESEND_FROM                     # From address (default: admin@blushbite.co)
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CRON_SECRET                     # Bearer token for /api/cron/drip
NODE_ENV                        # 'production' | 'development'

# CCBill (pending — set when approved)
CCBILL_ACCOUNT_NUMBER
CCBILL_SUBACC_STANDARD
CCBILL_SUBACC_PREMIUM
CCBILL_FORM_NAME
CCBILL_SALT

# Optional
PORT                            # HTTP port, defaults to 3001
```

---

## API Routes

All under `app/api/companions/` unless noted:

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `send-otp` | POST | Public | Send login OTP to email |
| `verify-otp` | POST | Public | Verify OTP, issue session cookie |
| `apply` | POST | Public | Apply (creates companion + profile, instant live) |
| `login/send-otp` | POST | Public | Same as send-otp (login path) |
| `login/verify-otp` | POST | Public | Same as verify-otp (login path) |
| `logout` | POST | Auth | Clear session cookie |
| `me` | GET | Auth | Current companion data + status + tier |
| `application` | PATCH | Auth | Update personal details (name, DOB, country) |
| `profile` | GET/PATCH | Auth | Profile (bio, tagline, city + writes slugs, etc.) |
| `photos` | GET | Auth | List photos (includes photo_verification_status) |
| `upload-photo` | POST | Auth | Upload photo to Cloudinary + DB |
| `photos/[id]` | DELETE | Auth | Soft-delete photo |
| `photos/set-primary` | POST | Auth | Set primary photo |
| `videos` | GET/DELETE | Auth | List / delete videos |
| `videos/upload` | POST | Auth | Upload video to Cloudinary + DB |
| `stories` | GET/POST | Auth | List / create stories |
| `stories/[id]` | GET/PATCH/DELETE | Auth | Get / update / soft-delete story |
| `bookings` | GET | Auth | List booking requests |
| `bookings/[id]` | PATCH | Auth | Accept / decline / complete booking |
| `settings` | GET/PATCH/POST/DELETE | Auth | Contact / live toggle / password / deactivate |
| `reapply` | GET/POST | Auth | Fetch / submit updated application (rejected only) |
| `analytics` | GET | Auth | Profile view stats + 30-day chart |
| `subscription` | GET/POST | Auth | **PENDING** — current tier / initiate CCBill upgrade |
| `/api/device/bind` | POST | Public | Store fingerprint → community binding |
| `/api/device/community-lookup` | GET | Public | Lookup community by fingerprint |
| `/api/cron/drip` | POST | CRON_SECRET | Send drip nudge emails |
| `/api/webhooks/ccbill` | POST | CCBill sig | **PENDING** — handle payment events |

---

## Pages

| Page | Auth | Purpose |
|---|---|---|
| `/` | Public | Gender picker (3-layer device binding) |
| `/female` | Public | Female community landing + 2-step apply form |
| `/male` | Public | Male community landing + 2-step apply form |
| `/shemale` | Public | TS/Shemale community landing + 2-step apply form |
| `/login` | Public | OTP login |
| `/terms` | Public | Terms of Service (NL law) |
| `/privacy` | Public | GDPR Privacy Policy |
| `/companion-guidelines` | Public | Content rules and moderation policy |
| `/status` | Auth | taken_down state notice / rejected reason |
| `/reapply` | Auth | Edit and re-submit rejected application |
| `/dashboard` | Auth | Overview + welcome onboarding checklist |
| `/dashboard/profile` | Auth | Profile builder (bio, tagline, city, attributes) |
| `/dashboard/photos` | Auth | Photo management (3-state badge: Verified/Approved/Pending) |
| `/dashboard/videos` | Auth | Video management |
| `/dashboard/stories` | Auth | Story management |
| `/dashboard/bookings` | Auth | Booking requests |
| `/dashboard/analytics` | Auth | Profile analytics |
| `/dashboard/settings` | Auth | Account settings |
| `/dashboard/upgrade` | Auth | Subscription tier comparison (CCBill pending) |

---

## Components

| File | Purpose |
|---|---|
| `components/AgeGate.tsx` | Fullscreen 18+ gate on first visit |
| `components/CookieBanner.tsx` | GDPR cookie notice (fixed bottom) |
| `app/GenderPickerClient.tsx` | Community picker with 3-layer device binding |
| `app/[gender]/GenderLanding.tsx` | Community-specific landing page + 2-step apply form |

---

## Common Patterns & Rules

### Never do these
- Do NOT mix CJS `require()` with ESM `import` in the same file — causes webpack module errors
- Do NOT call DB from client components — only Server Components, Route Handlers, or Server Actions
- Do NOT upload to Cloudinary before checking session — always auth-guard first
- Do NOT run multiple INSERTs without a transaction when they must all succeed together
- Do NOT update frontend state before checking `response.ok`

### Always do these
- `await client.query('ROLLBACK').catch(() => {})` in catch before rethrowing
- `client.release()` in finally block always
- Early `if (!session) return 401` at the top of every protected route
- Check `res.rows.length === 0` after INSERT…RETURNING before accessing `res.rows[0]`
- Use `formData.get('file')` for photo uploads, `formData.get('video')` for video uploads
- Write `city_slug` + `country_slug` via `toSlug()` whenever city/country changes in profile PATCH

### WhatsApp validation regex
```ts
/^\+[1-9]\d{7,14}$/   // E.164 — minimum 9 digits total
```

### Static asset caching
Logo, favicon, og-image: `Cache-Control: public, max-age=31536000, immutable` via `next.config.ts` headers.

### `canvas-confetti` ESM interop (CJS package)
```ts
const mod = await import('canvas-confetti')
const confetti = (mod.default ?? (mod as any)) as (options?: object) => void
```

---

## Build & Deploy

```bash
npm run build    # node --max-old-space-size=4096 next build
npm start        # next start -p ${PORT:-3001}
```

Railway uses `nixpacks.toml`: `npm install` → `npm run build` → `npm start`.

`outputFileTracingRoot` is set in `next.config.ts` to prevent build trace ENOENT errors on Windows.

---

## Design System

- **Primary accent**: `#e8607a` (rose)
- **Gold**: `#c9a96e`
- **Dark bg**: `#07090f` (page), `#0d1117` (cards/modals), `#111620` (inputs), `#1c2333` (borders)
- **Text**: `#eeeef0` (primary), `#9ca3af` (secondary), `#6b7280` (muted), `#4b5563` (disabled)
- **Fonts**: Playfair Display (`var(--font-serif)`), DM Sans (`var(--font-sans)`)
- **Italic accent**: key word at end of serif heading in rose `#e8607a`
- **Noise texture**: `position:fixed; inset:0; pointer-events:none; z-index:1000; opacity:0.6` SVG fractalNoise
- **Rose glow**: `radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)`
- **Grid overlay**: `linear-gradient` in community accent color at `.04` opacity

All dashboard pages use inline `style={}` objects. No Tailwind inside dashboard pages.
Landing/community pages use Tailwind classes. Community accent grid color is per-community (not hardcoded rose).

---

## Full Package Versions

| Package | Version | Role |
|---|---|---|
| `next` | ^15.3.3 | Framework — App Router |
| `react` / `react-dom` | ^19.0.0 | UI |
| `typescript` | ^5 | Language |
| `tailwindcss` | ^4.1.10 | CSS (landing + community pages only) |
| `pg` | ^8.13.3 | PostgreSQL client |
| `cloudinary` | ^2.5.1 | Photo + video storage |
| `resend` | ^4.0.0 | Transactional email |
| `bcryptjs` | ^2.4.3 | Password hashing (optional) |
| `canvas-confetti` | ^1.9.3 | Status page celebration animation |
| `libphonenumber-js` | ^1.13.7 | Phone validation |
| `lucide-react` | ^0.511.0 | Icon set |

Node: `>=20`. **No ORM** — raw SQL via `pg`. No Prisma, no Drizzle.

---

## Platform Purpose

**BlushBite** is a premium adult companion & erotic fantasy platform. EU-hosted (Netherlands). 18+ globally.

**Positioning: "desire engine" — not an escort directory.**

**blushbite.live's three jobs (in order):**
1. **Attract** — shatter expectations of cheap directories on first impression
2. **Build trust** — EU hosting, GDPR, admin review, alias protection
3. **Convert** — "Begin your journey" — never "Submit your details"

**Brand voice:**
- Headlines: sound like opening lines of an erotic story. "Your private world awaits." — never "Browse companions."
- CTAs: personal, present-tense. "Begin your journey" / "Enter my world" — never "Submit" / "Next" / "Book now"
- Empty states: evocative. "Your stage is ready." — never "No results found."
- Errors: warm. "That code isn't right — check your inbox." — never "Invalid OTP. Error 400."
- Italic accent pattern: `<em style="font-style:italic; color:#e8607a"> awaits.</em>`
- NEVER use: "Browse", "Submit", "Get started", "Manage", "Book now", "Dashboard" as a heading

**Two platforms:**
- `blushbite.live` — companion portal (this codebase)
- `blushbite.co` — consumer platform for dreamers (separate codebase, shared DB)

**Dreamers never visit blushbite.live.**

---

## Admin Panel (blushbite.co — separate codebase)

Admin at `C:\Users\Ravi Desai\Downloads\BlushBite\` manages companions via blushbite.co.

**Changed role (instant-live era):** Admin no longer "approves to live." Admin monitors and takes down violating profiles.

**Pending changes to admin panel (NOT YET DONE):**
- Change [Approve] button → [Take Down] / [Restore] toggle
- Take Down: sets `is_live=false`, `is_visible_to_users=false`, sends email to companion
- Restore: sets `is_live=true`, `is_visible_to_users=true`
- Filter: change "Pending review" → "New today" badge (companions registered in last 24h)
- All companions now show as "Live" by default in the list
