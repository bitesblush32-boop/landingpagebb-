# CLAUDE.md — blushbite.live Companion Portal

> Read this before writing any code. This is the single source of truth for architecture, schema, auth, and patterns.

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

## Auth System

### JWT Cookie

- **Algorithm**: HS256 HMAC (Web Crypto in middleware, Node `crypto` in routes)
- **Cookie name (prod)**: `__Host-bb_session` (requires HTTPS + no Domain attribute)
- **Cookie name (dev)**: `bb_session`
- **Expiry**: 7 days
- **Env var**: `COMPANION_JWT_SECRET` (required — server throws at startup if missing)
- **Payload**: `{ sub: companionId (UUID), email, name, exp }`

### Key files

| File | Purpose |
|---|---|
| `lib/session.ts` | `signJwt`, `verifyJwt`, `getSession()` (server components/routes), `buildSessionCookie()`, `clearSessionCookie()` |
| `middleware.ts` | Edge Runtime JWT verification, protects routes, injects `x-companion-id` / `x-companion-email` / `x-companion-name` headers |

### Protected routes (middleware)

- Pages: `/dashboard/*`, `/status`, `/reapply`
- API: `/api/companions/*` except: `send-otp`, `verify-otp`, `apply`, `login/*`

### How to read session in a Route Handler

```ts
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // session.sub = companionId (UUID)
}
```

**Always guard with early `if (!session) return 401` before any DB or side-effect operations.**

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
name VARCHAR            -- display name / first name
alias VARCHAR UNIQUE    -- generated public alias
full_name VARCHAR       -- legal name
date_of_birth TIMESTAMP
country VARCHAR
whatsapp_number VARCHAR
companion_stage INT     -- 3 after landing page apply
hashed_password VARCHAR -- bcrypt, nullable (login via OTP)
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
gender VARCHAR
availability_status VARCHAR  -- 'offline' | 'online' | 'busy'
whatsapp_number VARCHAR
session_modality VARCHAR     -- 'in_person' | 'online' | 'both'
hourly_rate NUMERIC
currency VARCHAR
is_live BOOLEAN              -- companion toggled live
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
url TEXT                -- Cloudinary secure_url
storage_key VARCHAR     -- Cloudinary public_id
alt_text TEXT
sort_order INT
is_primary BOOLEAN
is_approved BOOLEAN
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
body TEXT               -- full story content
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

**Stage 7 status='completed' AND companion_profiles.is_live=true = approved companion.**

### Companion Approval Status Logic

```ts
// In /api/companions/me:
let status = 'pending'
if (row.review_status === 'rejected') status = 'rejected'
else if (row.review_status === 'completed' && row.is_live) status = 'approved'
```

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

`lib/email.ts` — functions: `sendOtpEmail`, `sendApprovalEmail`, `sendRejectionEmail`, `sendAdminReapplyNotification`.

Env vars: `RESEND_API_KEY`, `RESEND_FROM` (optional, defaults to `admin@blushbite.co`)

---

## Required Environment Variables

```bash
DATABASE_URL                    # Railway PostgreSQL connection string
COMPANION_JWT_SECRET            # HS256 signing secret — REQUIRED, server throws if missing
RESEND_API_KEY                  # Email sending
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NODE_ENV                        # 'production' | 'development'

# Optional
RESEND_FROM                     # From address, defaults to admin@blushbite.co
PORT                            # HTTP port, defaults to 3001
```

---

## API Routes

All under `app/api/companions/`:

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `send-otp` | POST | Public | Send login OTP to email |
| `verify-otp` | POST | Public | Verify OTP, issue session cookie |
| `apply` | POST | Public | Landing page application (creates companion + profile) |
| `login/send-otp` | POST | Public | Same as send-otp (legacy path) |
| `login/verify-otp` | POST | Public | Same as verify-otp (legacy path) |
| `logout` | POST | Auth | Clear session cookie |
| `me` | GET | Auth | Current companion data + approval status |
| `application` | PATCH | Auth | Update personal details (name, DOB, country) |
| `profile` | GET/PATCH | Auth | Companion profile (bio, tagline, city, etc.) |
| `photos` | GET | Auth | List photos |
| `upload-photo` | POST | Auth | Upload photo to Cloudinary + DB |
| `photos/[id]` | DELETE | Auth | Soft-delete photo |
| `photos/set-primary` | POST | Auth | Set primary photo |
| `videos` | GET/DELETE | Auth | List / delete videos |
| `videos/upload` | POST | Auth | Upload video to Cloudinary + DB |
| `stories` | GET/POST | Auth | List / create stories |
| `stories/[id]` | GET/PATCH/DELETE | Auth | Get full story / update / soft-delete |
| `bookings` | GET | Auth | List booking requests |
| `bookings/[id]` | PATCH | Auth | Accept / decline / complete booking |
| `settings` | GET/PATCH/POST/DELETE | Auth | Contact info / live toggle / password / deactivate |
| `reapply` | GET/POST | Auth | Fetch / submit updated application (rejected companions) |
| `analytics` | GET | Auth | Profile view stats + 30-day chart |

---

## Pages

| Page | Auth | Purpose |
|---|---|---|
| `/` | Public | Landing page + 3-step application wizard |
| `/login` | Public | OTP login |
| `/status` | Auth | Application status (pending/approved/rejected) |
| `/reapply` | Auth | Edit and re-submit rejected application |
| `/dashboard` | Auth | Overview stats |
| `/dashboard/profile` | Auth (any status) | Profile builder — only page unlocked before approval |
| `/dashboard/photos` | Auth + approved | Photo management |
| `/dashboard/videos` | Auth + approved | Video management |
| `/dashboard/stories` | Auth + approved | Story management |
| `/dashboard/bookings` | Auth + approved | Booking requests |
| `/dashboard/analytics` | Auth + approved | Profile analytics |
| `/dashboard/settings` | Auth + approved | Account settings |

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

### WhatsApp validation regex
```ts
/^\+[1-9]\d{7,14}$/   // E.164 — minimum 9 digits total
```

### Static asset caching
Logo, favicon, og-image are served with `Cache-Control: public, max-age=31536000, immutable` via `next.config.ts` headers.

---

## Build & Deploy

```bash
npm run build    # node --max-old-space-size=4096 next build
npm start        # next start -p ${PORT:-3001}
```

Railway uses `nixpacks.toml`: `npm install` → `npm run build` → `npm start`.

`outputFileTracingRoot` is set in `next.config.ts` to prevent build trace ENOENT errors on Windows (multiple lockfile detection).

---

## Design System

- **Primary accent**: `#e8607a` (rose)
- **Gold**: `#c9a96e`
- **Dark bg**: `#07090f` (page), `#0d1117` (cards), `#111620` (inputs), `#1c2333` (borders)
- **Text**: `#eeeef0` (primary), `#9ca3af` (secondary), `#6b7280` (muted), `#4b5563` (disabled)
- **Fonts**: Playfair Display (`var(--font-serif)`), DM Sans (`var(--font-sans)`)
- **Style**: intimate, dimly-lit, private — not a directory, a personal stage

All dashboard pages use inline `style={}` objects. No Tailwind inside dashboard pages.
Landing page (`app/page.tsx`) uses Tailwind classes.

---

## Full Package Versions

| Package | Version | Role |
|---|---|---|
| `next` | ^15.3.3 | Framework — App Router |
| `react` / `react-dom` | ^19.0.0 | UI |
| `typescript` | ^5 | Language |
| `tailwindcss` | ^4.1.10 | CSS (landing page only) |
| `pg` | ^8.13.3 | PostgreSQL client |
| `cloudinary` | ^2.5.1 | Photo + video storage |
| `resend` | ^4.0.0 | Transactional email |
| `bcryptjs` | ^2.4.3 | Password hashing (optional — OTP is default login) |
| `canvas-confetti` | ^1.9.3 | Status page celebration animation |
| `libphonenumber-js` | ^1.13.7 | Phone number validation (landing page wizard) |
| `lucide-react` | ^0.511.0 | Icon set |

Node: `>=20`. **No ORM** — raw SQL via `pg`. No Prisma, no Drizzle.

`canvas-confetti` is CJS — always use ESM interop when importing dynamically:
```ts
const mod = await import('canvas-confetti')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const confetti = (mod.default ?? (mod as any)) as (options?: object) => void
```

Never use `require()` in any file — causes webpack module factory errors in Next.js.

---

## Feature Inventory

### Landing Page (`app/page.tsx`) — `'use client'`, Tailwind only
3-step application wizard — no login required:
- **Step 1 — Personal**: fullName, email, DOB, country, city, whatsappNumber (E.164, validated with `libphonenumber-js`)
- **Step 2 — Identity**: displayName (stage name), gender, tagline (short), bio
- **Step 3 — Photo & Notes**: optional profile photo upload (preview before submit), additional notes

Photo upload flow: file input → preview → POST `/api/companions/upload-photo` (field name: `file`) → returns `{ url }` → stored temporarily → included in final apply payload.

Final submit: POST `/api/companions/apply` → DB transaction creates: `companions` + `companion_profiles` + `companion_photos` (if photo) + `companion_onboarding_progress` rows atomically.

Success screen: "Application received. We'll be in touch within 48 hours."

### Login (`app/login/page.tsx`) — `'use client'`
1. Email → POST `/api/companions/send-otp` → Resend delivers 6-digit OTP (10 min TTL)
2. OTP → POST `/api/companions/verify-otp` → session cookie set → redirect:
   - `pending` → `/status` | `rejected` → `/reapply` | `approved` → `/dashboard`

### Status (`app/status/page.tsx`) — `'use client'`
Shows review state via GET `/api/companions/me`. If approved: `canvas-confetti` burst. If rejected: reason + link to `/reapply`.

### Reapply (`app/reapply/page.tsx`) — `'use client'`
Pre-fills form with existing application data. PATCH `/api/companions/reapply` on submit. Only reachable if `review_status = 'rejected'`.

### Dashboard Layout (`app/dashboard/layout.tsx`) — `'use client'`
- Fetches `/api/companions/me` on mount — redirects to `/login` if unauthenticated
- Desktop (≥768px): 240px fixed sidebar — logo, completeness bar, live toggle, full nav
- Mobile (<768px): fixed bottom tab bar — 5 tabs (Home, Profile, Photos, Stats, More)
- Pre-approval: all nav except `/dashboard/profile` locked (greyed, ⊘ icon, pointer-events: none)
- Live toggle: PATCH `/api/companions/settings` `{ is_live: boolean }`
- Non-approved companions redirected to `/dashboard/profile` from any other dashboard route

### Dashboard Overview (`app/dashboard/page.tsx`)
At-a-glance: profile completeness %, pending bookings count, recent activity. Quick nav links.

### Dashboard Profile (`app/dashboard/profile/page.tsx`)
Unlocked pre-approval. Fields: bio, tagline, city, gender, availability status (`offline`/`online`/`busy`), session modality (`in_person`/`online`/`both`), hourly rate, currency, Instagram handle, website URL, physical attributes (height_cm, body type, eye/hair/skin color). GET/PATCH `/api/companions/profile`.

### Dashboard Photos (`app/dashboard/photos/page.tsx`)
- Grid, max 8 photos, JPEG/PNG/WEBP, max 5MB each
- Upload: POST `/api/companions/upload-photo` (field: `file`)
- Set primary: POST `/api/companions/photos/set-primary` `{ id }`
- Delete: DELETE `/api/companions/photos/[id]` (soft delete)
- Badges: "✦ Approved" (gold) or "⏳ Pending" (amber) · "✦ Primary" overlay on primary photo

### Dashboard Videos (`app/dashboard/videos/page.tsx`)
- Upload field: `video`, route: POST `/api/companions/videos/upload`
- Cloudinary folder: `companion-videos`, resource_type: `video`
- Thumbnail auto-generated by Cloudinary
- Delete: DELETE `/api/companions/videos/[id]` (soft delete)

### Dashboard Stories (`app/dashboard/stories/page.tsx`)
- List with title, excerpt, badge (Live ✦ / Pending ⏳)
- Create/Edit modal: Title (max 200), Excerpt optional (max 500), Content (max 20,000)
- Edit pre-fills `body` via GET `/api/companions/stories/[id]` (async on modal open)
- PATCH resets `moderation_status` to `'pending'`
- Delete: soft delete via `deleted_at`

### Dashboard Bookings (`app/dashboard/bookings/page.tsx`)
- Filter: Pending (default) | All
- Card shows: user alias, session title, duration, price+currency, modality, requested date, message
- Accept/Decline: PATCH `/api/companions/bookings/[id]` `{ status: 'accepted' | 'declined' }`
- Error state checked (`r.ok`) — error banner shown, state not updated on failure

### Dashboard Analytics (`app/dashboard/analytics/page.tsx`)
Profile views, story reads, booking conversion stats. 30-day chart. GET `/api/companions/analytics`.

### Dashboard Settings (`app/dashboard/settings/page.tsx`)
WhatsApp + Instagram update (E.164 enforced), optional password (bcrypt), go-live toggle, account deactivation. GET/PATCH/POST/DELETE `/api/companions/settings`.

---

## Platform Purpose

**BlushBite** is a premium adult companion & erotic fantasy platform. EU-hosted (Netherlands — jurisdiction fully permits adult services). 18+ globally.

**Positioning: "desire engine" — not an escort directory.** The difference:
- Directory: grid of people with prices. BlushBite: builds desire first via stories and audio.
- Directory: transactional. BlushBite: psychological, intimate.
- Directory: customers. BlushBite: people with a private inner world.

**Core conversion loop:** Story/audio → character identification → companion card → booking.

**blushbite.live's three jobs (in order):**
1. **Attract** — shatter expectations of cheap directories on first impression
2. **Build trust** — EU hosting, GDPR, admin review, "we screen your clients — not just you"
3. **Convert** — "Begin your journey" / "Your stage is waiting" — never "Submit your details"

**Full companion journey:**
```
blushbite.live
  → 3-step wizard (public, no auth)
  → POST /api/companions/apply → DB transaction → companion_stage = 3
  → "Application received. 48 hours."

blushbite.co/admin
  → Admin reviews → PATCH /api/admin/companions/[id] { is_live: true }
  → Resend approval email to companion

blushbite.live/login
  → OTP login → session cookie → pending/rejected/approved routing

blushbite.live/dashboard
  → Build profile → go live (is_live toggle)
  → Manage bookings, track analytics

blushbite.co (consumer)
  → Companion visible (is_visible_to_users = true)
  → Dreamers read stories → identify → book
```

---

## Brand Voice (apply to all copy and UI)

**The room metaphor:** Every screen is a dimly-lit, expensive, intimate room. Dark. Rose-lit. Private. A little breathless.

**Companion portal tone:** Empowered, not administrative. "Your profile is your stage." / "Your world is live." / "A new request." / "Your story is in the world."

**Headlines:** Sound like opening lines of an erotic story. "Your private world awaits." — never "Browse companions."

**CTAs:** Personal, present-tense invitations. "Begin your journey" / "Enter my world" / "She's waiting" — never "Submit" / "Continue" / "Book now" / "Next".

**Empty states:** Evocative. "Your stage is ready." / "Nothing yet — your story is just beginning." — never "No results found."

**Errors:** Warm and human. "That code isn't right — check your inbox and try again." — never "Invalid OTP. Error 400."

**Italic accent pattern** — key word at end of serif heading in rose `#e8607a`:
```html
<h1 style="font-family:'Playfair Display',serif; color:#eeeef0">
  Your private world<em style="font-style:italic; color:#e8607a"> awaits.</em>
</h1>
```

**NEVER use:** "Browse", "Submit", "Get started", "Manage", "Book now", "Dashboard" as a heading, generic corporate language.

---

## What Companions Are

Verified adult professionals offering companionship, fantasy sessions, and personal experiences. Primarily Europe (NL, DE, UK, BE, FR). They value personal brand and quality clients over volume. blushbite.live must feel like "backstage at a premium private members club."

**Content they post:**
- **Photos** — max 8 (code limit), JPEG/PNG/WEBP, max 5MB, semi-nude allowed, no full nudity, moderated before live
- **Videos** — 15s non-nude clips, face/personality/speaking to camera
- **Stories** — literary erotica (emotionally rich, not pornographic) — feeds the dreamer "character identification bridge"
