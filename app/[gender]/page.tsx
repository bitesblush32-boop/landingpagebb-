import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import GenderLanding, { type Community } from './GenderLanding'
import { query } from '@/lib/db'

const VALID: Community[] = ['female', 'male', 'shemale']

const META: Record<Community, Pick<Metadata, 'title' | 'description' | 'keywords' | 'openGraph'>> = {
  female: {
    title: 'Apply as a Female Escort & Companion — BlushBite',
    description:
      'Join BlushBite\'s female companion community. Apply in seconds — EU-hosted, alias-protected, instant profile access. Build your stage and connect with verified clients.',
    keywords: [
      'female escorts apply',
      'female companion platform',
      'women escorts join',
      'female escort registration',
      'join female escort platform',
      'female companion portal',
      'escort platform for women',
      'female companion profile',
      'apply female escort Europe',
    ],
    openGraph: {
      title: 'Female Companion Portal — BlushBite',
      description: 'Join the female companion community on BlushBite. EU-hosted, alias-protected, instant access.',
    },
  },
  male: {
    title: 'Apply as a Male Escort & Companion — BlushBite',
    description:
      'Join BlushBite\'s male companion community. Apply in seconds — EU-hosted, alias-protected, instant profile access. Build your stage and connect with verified clients.',
    keywords: [
      'male escorts apply',
      'male companion platform',
      'male escort registration',
      'join male escort platform',
      'male companion portal',
      'gigolo platform apply',
      'male escort Europe',
      'male companion profile',
      'apply male escort',
    ],
    openGraph: {
      title: 'Male Companion Portal — BlushBite',
      description: 'Join the male companion community on BlushBite. EU-hosted, alias-protected, instant access.',
    },
  },
  shemale: {
    title: 'Apply as a TS Escort & Shemale Companion — BlushBite',
    description:
      'Join BlushBite\'s TS and shemale companion community. Verified profiles, EU-hosted, alias-protected. Apply in seconds — your stage is live instantly.',
    keywords: [
      'shemale escorts apply',
      'ts escorts platform',
      'transsexual escort registration',
      'shemale companion portal',
      'ts escort platform join',
      'shemale escort profile',
      'ts companion apply',
      'shemale escort Europe',
      'ts escorts join platform',
      'transsexual companion portal',
    ],
    openGraph: {
      title: 'TS & Shemale Companion Portal — BlushBite',
      description: 'Join the TS and shemale companion community on BlushBite. EU-hosted, verified, instant access.',
    },
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gender: string }>
}): Promise<Metadata> {
  const { gender } = await params
  if (!VALID.includes(gender as Community)) return { robots: { index: false } }

  const g = gender as Community
  return {
    ...META[g],
    robots: { index: true, follow: true },
    alternates: { canonical: `https://blushbite.live/${g}` },
    openGraph: {
      type: 'website',
      url: `https://blushbite.live/${g}`,
      siteName: 'BlushBite',
      locale: 'en_GB',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      ...META[g].openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og-image.png'],
    },
  }
}

export default async function GenderPage({
  params,
}: {
  params: Promise<{ gender: string }>
}) {
  const { gender } = await params
  if (!VALID.includes(gender as Community)) redirect('/')

  // Fetch live stats + active boosts for this community in parallel
  const [statsRows, boostRows, boostSettingsRows] = await Promise.all([
    query<{ companion_count: string; city_count: string }>(
      `SELECT
         COUNT(DISTINCT c.id)::text AS companion_count,
         COUNT(DISTINCT cp.city) FILTER (WHERE cp.city IS NOT NULL)::text AS city_count
       FROM companions c
       JOIN companion_profiles cp ON cp.companion_id = c.id
       WHERE c.gender_community = $1
         AND cp.is_live = true`,
      [gender]
    ).catch(() => []),

    query<{
      id: string
      boost_type: string
      banner_headline: string | null
      banner_tagline: string | null
      companion_name: string
      alias: string | null
      tagline: string | null
      city: string | null
      primary_photo_url: string | null
    }>(
      `SELECT
         cb.id, cb.boost_type, cb.banner_headline, cb.banner_tagline,
         c.name  AS companion_name,
         c.alias,
         cp.tagline,
         cp.city,
         (SELECT url FROM companion_photos
          WHERE companion_profile_id = cp.id
            AND is_primary = true AND deleted_at IS NULL
          LIMIT 1) AS primary_photo_url
       FROM companion_boosts cb
       JOIN companions c ON c.id = cb.companion_id
       JOIN companion_profiles cp ON cp.companion_id = cb.companion_id
       WHERE cb.community = $1
         AND cb.status = 'active'
         AND cb.is_enabled = true
         AND NOW() BETWEEN cb.week_start::timestamptz
             AND (cb.week_end + INTERVAL '1 day')::timestamptz
       ORDER BY cb.boost_type, cb.created_at`,
      [gender]
    ).catch(() => []),

    query<{
      header_banner_enabled: boolean
      right_rail_enabled: boolean
      featured_enabled: boolean
      mid_grid_enabled: boolean
    }>(`SELECT header_banner_enabled, right_rail_enabled, featured_enabled, mid_grid_enabled
        FROM boost_settings WHERE id = 1`).catch(() => []),
  ])

  const companionCount = parseInt(statsRows[0]?.companion_count ?? '0', 10)
  const cityCount      = parseInt(statsRows[0]?.city_count      ?? '0', 10)

  const bs = boostSettingsRows[0] ?? {
    header_banner_enabled: true, right_rail_enabled: true,
    featured_enabled: true, mid_grid_enabled: true,
  }

  const activeBoosts = {
    headerBanner: bs.header_banner_enabled
      ? (boostRows.find(b => b.boost_type === 'header_banner') ?? null)
      : null,
    rightRail: bs.right_rail_enabled
      ? (boostRows.find(b => b.boost_type === 'right_rail') ?? null)
      : null,
    featured: bs.featured_enabled
      ? boostRows.filter(b => b.boost_type.startsWith('featured')).slice(0, 3)
      : [],
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BlushBite',
    url: `https://blushbite.live/${gender}`,
    logo: 'https://blushbite.live/logo.png',
    description: META[gender as Community].description,
    areaServed: 'Worldwide',
    address: { '@type': 'PostalAddress', addressCountry: 'NL' },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GenderLanding
        community={gender as Community}
        companionCount={companionCount}
        cityCount={cityCount}
        activeBoosts={activeBoosts}
      />
    </>
  )
}
