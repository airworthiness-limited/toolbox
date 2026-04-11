export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { getDb } from '@/lib/postgres/server'
import { MarketPageClient } from '@/components/market-page-client'

export const metadata: Metadata = {
  title: 'The Market | Airworthiness',
  description: 'Search UK CAA Part 145 and Part 147 approved maintenance and training organisations.',
}

export default async function MarketPage() {
  const db = getDb()

  const { rows: approvals } = await db.query(`
    SELECT
      a.id,
      a.reference_number,
      a.organisation_name,
      a.status,
      a.city,
      a.state,
      a.country_code,
      a.website,
      a.issued_date,
      a.part147_ref,
      a.part21g_ref,
      a.part21j_ref,
      a.latitude,
      a.longitude,
      COALESCE(
        json_agg(
          json_build_object(
            'id', r.id,
            'rating_class', r.rating_class,
            'category', r.category,
            'detail', r.detail,
            'base_maintenance', r.base_maintenance,
            'line_maintenance', r.line_maintenance
          )
        ) FILTER (WHERE r.id IS NOT NULL),
        '[]'
      ) AS part145_ratings,
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', r2.id,
            'category', r2.category,
            'licence', r2.licence,
            'training_code', r2.training_code,
            'type_name', r2.type_name,
            'basic_scope', r2.basic_scope
          )
        ) FROM part147_ratings r2
        JOIN part147_approvals p ON p.id = r2.approval_id
        WHERE p.reference_number = a.part147_ref),
        '[]'::json
      ) AS part147_ratings,
      COALESCE(
        (SELECT json_agg(
          json_build_object('id', r3.id, 'category', r3.category, 'scope_description', r3.scope_description)
        ) FROM part21g_ratings r3
        JOIN part21g_approvals g ON g.id = r3.approval_id
        WHERE g.reference_number = a.part21g_ref),
        '[]'::json
      ) AS part21g_ratings,
      COALESCE(
        (SELECT json_agg(
          json_build_object('id', r4.id, 'rating_type', r4.rating_type, 'rating_value', r4.rating_value)
        ) FROM part21j_ratings r4
        JOIN part21j_approvals j ON j.id = r4.approval_id
        WHERE j.reference_number = a.part21j_ref),
        '[]'::json
      ) AS part21j_ratings
    FROM part145_approvals a
    LEFT JOIN part145_ratings r ON r.approval_id = a.id
    GROUP BY a.id
    ORDER BY a.organisation_name
  `)

  // Part 147-only orgs (not linked to any Part 145)
  const { rows: part147OnlyApprovals } = await db.query(`
    SELECT
      a.id,
      a.reference_number,
      a.organisation_name,
      'ACTIVE' as status,
      a.city,
      NULL as state,
      a.country_code,
      a.website,
      a.issued_date,
      COALESCE(
        json_agg(
          json_build_object(
            'id', r.id,
            'category', r.category,
            'licence', r.licence,
            'training_code', r.training_code,
            'type_name', r.type_name,
            'basic_scope', r.basic_scope
          )
        ) FILTER (WHERE r.id IS NOT NULL),
        '[]'
      ) AS part147_ratings
    FROM part147_approvals a
    LEFT JOIN part147_ratings r ON r.approval_id = a.id
    WHERE a.reference_number NOT IN (
      SELECT part147_ref FROM part145_approvals WHERE part147_ref IS NOT NULL
    )
    GROUP BY a.id
    ORDER BY a.organisation_name
  `)

  // Part 21G-only orgs
  const { rows: part21gOnlyApprovals } = await db.query(`
    SELECT
      a.id,
      a.reference_number,
      a.organisation_name,
      'ACTIVE' as status,
      a.city,
      NULL as state,
      a.country_code,
      NULL as website,
      NULL as issued_date,
      COALESCE(
        json_agg(
          json_build_object('id', r.id, 'category', r.category, 'scope_description', r.scope_description)
        ) FILTER (WHERE r.id IS NOT NULL),
        '[]'
      ) AS part21g_ratings
    FROM part21g_approvals a
    LEFT JOIN part21g_ratings r ON r.approval_id = a.id
    WHERE lower(trim(a.organisation_name)) NOT IN (
      SELECT lower(trim(organisation_name)) FROM part145_approvals
    )
    GROUP BY a.id
    ORDER BY a.organisation_name
  `)

  // Part 21J-only orgs
  const { rows: part21jOnlyApprovals } = await db.query(`
    SELECT
      a.id,
      a.reference_number,
      a.organisation_name,
      'ACTIVE' as status,
      a.city,
      NULL as state,
      a.country_code,
      NULL as website,
      NULL as issued_date,
      COALESCE(
        json_agg(
          json_build_object('id', r.id, 'rating_type', r.rating_type, 'rating_value', r.rating_value)
        ) FILTER (WHERE r.id IS NOT NULL),
        '[]'
      ) AS part21j_ratings
    FROM part21j_approvals a
    LEFT JOIN part21j_ratings r ON r.approval_id = a.id
    WHERE lower(trim(a.organisation_name)) NOT IN (
      SELECT lower(trim(organisation_name)) FROM part145_approvals
    )
    GROUP BY a.id
    ORDER BY a.organisation_name
  `)

  // Map data
  const { rows: mapOrgs } = await db.query(`
    SELECT id, reference_number, organisation_name, city, country_code, latitude, longitude, slug, part147_ref, part21g_ref, part21j_ref
    FROM part145_approvals
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    UNION ALL
    SELECT id + 100000 as id, reference_number, organisation_name, city, country_code, latitude, longitude, slug, NULL as part147_ref, NULL as part21g_ref, NULL as part21j_ref
    FROM part147_approvals
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    AND reference_number NOT IN (SELECT part147_ref FROM part145_approvals WHERE part147_ref IS NOT NULL)
    UNION ALL
    SELECT id + 200000 as id, reference_number, organisation_name, city, country_code, latitude, longitude, slug, NULL as part147_ref, NULL as part21g_ref, NULL as part21j_ref
    FROM part21g_approvals
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    AND lower(trim(organisation_name)) NOT IN (SELECT lower(trim(organisation_name)) FROM part145_approvals)
    UNION ALL
    SELECT id + 300000 as id, reference_number, organisation_name, city, country_code, latitude, longitude, slug, NULL as part147_ref, NULL as part21g_ref, NULL as part21j_ref
    FROM part21j_approvals
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    AND lower(trim(organisation_name)) NOT IN (SELECT lower(trim(organisation_name)) FROM part145_approvals)
    ORDER BY organisation_name
  `)

  return (
    <div className="min-h-screen">
      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            The Market
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            We have developed the largest platform of airworthiness organisations approved to trade in the aviation market. Whether you need new floor panels, a hydraulic pump overhaul, a type training course, or support managing a maintenance programme, we can connect you with the right provider.
          </p>

          <MarketPageClient
            approvals={approvals}
            part147OnlyApprovals={part147OnlyApprovals}
            part21gOnlyApprovals={part21gOnlyApprovals}
            part21jOnlyApprovals={part21jOnlyApprovals}
            mapOrgs={mapOrgs}
          />
        </div>
      </section>
    </div>
  )
}
