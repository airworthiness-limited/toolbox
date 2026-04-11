'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { MarketTable } from '@/components/market-table'

const MarketMap = dynamic(() => import('@/components/market-map').then(m => m.MarketMap), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] rounded-xl border bg-muted/30 flex items-center justify-center text-muted-foreground">
      Loading map...
    </div>
  ),
})

type MapOrg = {
  id: number
  reference_number: string
  organisation_name: string
  city: string | null
  country_code: string
  latitude: number
  longitude: number
  slug: string | null
  part147_ref?: string | null
  part21g_ref?: string | null
  part21j_ref?: string | null
}

export function MarketPageClient({
  approvals,
  part147OnlyApprovals,
  part21gOnlyApprovals = [],
  part21jOnlyApprovals = [],
  mapOrgs,
}: {
  approvals: any[]
  part147OnlyApprovals: any[]
  part21gOnlyApprovals?: any[]
  part21jOnlyApprovals?: any[]
  mapOrgs: MapOrg[]
}) {
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; name: string } | null>(null)

  const handleOrgExpand = useCallback((orgId: number | null) => {
    if (!orgId) {
      setFlyTo(null)
      return
    }
    // Find the org in approvals to get its coordinates
    const org = approvals.find((a: any) => a.id === orgId)
    if (org?.latitude && org?.longitude) {
      setFlyTo({ lat: org.latitude, lng: org.longitude, name: org.organisation_name })
    }
  }, [approvals])

  return (
    <>
      <div className="mt-8 mb-6">
        <MarketMap organisations={mapOrgs} flyTo={flyTo} />
      </div>

      <div>
        <MarketTable
          approvals={approvals}
          part147OnlyApprovals={part147OnlyApprovals}
          part21gOnlyApprovals={part21gOnlyApprovals}
          part21jOnlyApprovals={part21jOnlyApprovals}
          onOrgExpand={handleOrgExpand}
        />
      </div>
    </>
  )
}
