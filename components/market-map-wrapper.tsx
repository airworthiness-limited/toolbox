'use client'

import dynamic from 'next/dynamic'

const MarketMap = dynamic(() => import('@/components/market-map').then(m => m.MarketMap), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] rounded-xl border bg-muted/30 flex items-center justify-center text-muted-foreground">
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

export function MarketMapWrapper({ organisations }: { organisations: MapOrg[] }) {
  return <MarketMap organisations={organisations} />
}
