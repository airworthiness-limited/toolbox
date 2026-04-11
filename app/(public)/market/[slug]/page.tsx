export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { queryOne, queryAll } from '@/lib/db'
import { ProfileRatings } from './profile-ratings'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await queryOne<{ organisation_name: string }>(
    'SELECT organisation_name FROM part145_approvals WHERE slug = $1',
    [slug],
  )

  if (!data) return { title: 'Not Found | Airworthiness' }

  return {
    title: `${data.organisation_name} | Airworthiness`,
    description: `Approved organisation profile for ${data.organisation_name}. View maintenance and training capabilities.`,
  }
}

const COUNTRY_NAMES: Record<string, string> = {
  AE: 'United Arab Emirates', AT: 'Austria', AU: 'Australia', BE: 'Belgium', BG: 'Bulgaria',
  BR: 'Brazil', CA: 'Canada', CH: 'Switzerland', CN: 'China', CY: 'Cyprus', CZ: 'Czech Republic',
  DE: 'Germany', DK: 'Denmark', ES: 'Spain', FI: 'Finland', FR: 'France', GB: 'United Kingdom',
  GR: 'Greece', HK: 'Hong Kong', HR: 'Croatia', HU: 'Hungary', IE: 'Ireland', IL: 'Israel',
  IN: 'India', IT: 'Italy', JP: 'Japan', KR: 'South Korea', MY: 'Malaysia', NL: 'Netherlands',
  NO: 'Norway', NZ: 'New Zealand', PL: 'Poland', PT: 'Portugal', QA: 'Qatar', RO: 'Romania',
  SA: 'Saudi Arabia', SE: 'Sweden', SG: 'Singapore', TH: 'Thailand', TR: 'Turkey', US: 'United States',
}

const TRADING_AS_PATTERN = /\s+(?:t\/a|T\/A|d\/b\/a|D\/B\/A|dba|DBA|trading as|Trading As)\s+/

function parseOrgName(name: string): { legalName: string; tradingAs: string | null } {
  const match = name.match(TRADING_AS_PATTERN)
  if (!match) return { legalName: name, tradingAs: null }
  const idx = match.index!
  return { legalName: name.slice(0, idx), tradingAs: name.slice(idx + match[0].length) }
}

export default async function OrgProfilePage({ params }: Props) {
  const { slug } = await params

  const org = await queryOne<{
    id: string
    organisation_name: string
    reference_number: string
    country_code: string | null
    city: string | null
    website: string | null
    part147_ref: string | null
  }>(
    'SELECT id, organisation_name, reference_number, country_code, city, website, part147_ref, part21g_ref, part21j_ref FROM part145_approvals WHERE slug = $1',
    [slug],
  )

  if (!org) notFound()

  const ratings = await queryAll<{
    id: string
    rating_class: string
    category: string
    detail: string | null
  }>(
    'SELECT id, rating_class, category, detail FROM part145_ratings WHERE approval_id = $1 ORDER BY rating_class, category',
    [org.id],
  )

  // Part 147 ratings if linked
  let part147Ratings: { id: string; category: string; licence: string; training_code: string | null; type_name: string | null; basic_scope: string | null }[] = []
  if (org.part147_ref) {
    part147Ratings = await queryAll(
      `SELECT r.id, r.category, r.licence, r.training_code, r.type_name, r.basic_scope
       FROM part147_ratings r
       JOIN part147_approvals a ON a.id = r.approval_id
       WHERE a.reference_number = $1
       ORDER BY r.category, r.licence`,
      [org.part147_ref],
    )
  }

  // Part 21G ratings if linked
  let part21gRatings: { id: string; category: string; scope_description: string | null }[] = []
  if ((org as any).part21g_ref) {
    part21gRatings = await queryAll(
      `SELECT r.id, r.category, r.scope_description
       FROM part21g_ratings r
       JOIN part21g_approvals a ON a.id = r.approval_id
       WHERE a.reference_number = $1
       ORDER BY r.category`,
      [(org as any).part21g_ref],
    )
  }

  // Part 21J ratings if linked
  let part21jRatings: { id: string; rating_type: string; rating_value: string }[] = []
  if ((org as any).part21j_ref) {
    part21jRatings = await queryAll(
      `SELECT r.id, r.rating_type, r.rating_value
       FROM part21j_ratings r
       JOIN part21j_approvals a ON a.id = r.approval_id
       WHERE a.reference_number = $1
       ORDER BY r.rating_type, r.rating_value`,
      [(org as any).part21j_ref],
    )
  }

  const { legalName, tradingAs } = parseOrgName(org.organisation_name)

  return (
    <div className="min-h-screen">
      <section className="py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Back link */}
          <Link href="/market" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            &larr; Back to directory
          </Link>

          {/* Header */}
          <div className="mt-6 mb-8">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              {legalName}
            </h1>
            {tradingAs && (
              <p className="text-sm text-muted-foreground mt-1">Trading as {tradingAs}</p>
            )}
          </div>

          {/* Organisation details */}
          <div className="bg-card rounded-xl border p-6 mb-8">
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {org.city && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">City</span>
                  <p className="text-foreground">{org.city}</p>
                </div>
              )}
              {org.country_code && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Country</span>
                  <p className="text-foreground">{COUNTRY_NAMES[org.country_code] || org.country_code}</p>
                </div>
              )}
              {org.website && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Website</span>
                  <p>
                    <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {org.website}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Ratings — client component for collapsible sections */}
          <ProfileRatings
            part145Ref={org.reference_number}
            part147Ref={org.part147_ref}
            part21gRef={(org as any).part21g_ref}
            part21jRef={(org as any).part21j_ref}
            ratings={ratings}
            part147Ratings={part147Ratings}
            part21gRatings={part21gRatings}
            part21jRatings={part21jRatings}
          />
        </div>
      </section>
    </div>
  )
}
