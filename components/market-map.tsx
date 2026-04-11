'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

const COUNTRY_NAMES: Record<string, string> = {
  AE: 'UAE', AT: 'Austria', AU: 'Australia', BE: 'Belgium', BG: 'Bulgaria',
  BH: 'Bahrain', BR: 'Brazil', CA: 'Canada', CH: 'Switzerland', CN: 'China',
  CY: 'Cyprus', CZ: 'Czech Republic', DE: 'Germany', DK: 'Denmark',
  ES: 'Spain', FI: 'Finland', FR: 'France', GB: 'United Kingdom',
  GR: 'Greece', HK: 'Hong Kong', HR: 'Croatia', HU: 'Hungary',
  IE: 'Ireland', IL: 'Israel', IN: 'India', IT: 'Italy',
  JP: 'Japan', KR: 'South Korea', KW: 'Kuwait', MY: 'Malaysia',
  NL: 'Netherlands', NO: 'Norway', NZ: 'New Zealand', PL: 'Poland',
  PT: 'Portugal', QA: 'Qatar', RO: 'Romania', SA: 'Saudi Arabia',
  SE: 'Sweden', SG: 'Singapore', TH: 'Thailand', TR: 'Turkey',
  US: 'United States', ZA: 'South Africa',
}

export function MarketMap({ organisations, flyTo }: { organisations: MapOrg[]; flyTo?: { lat: number; lng: number; name: string } | null }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const filtered = organisations

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [51.5, -0.1],
      zoom: 3,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    // Custom marker icon
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="width:10px;height:10px;border-radius:50%;background:#6366f1;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })

    // Add markers
    const markers: L.Marker[] = []
    for (const org of filtered) {
      if (!org.latitude || !org.longitude) continue

      const marker = L.marker([org.latitude, org.longitude], { icon })
      const refs = [org.reference_number, org.part147_ref, org.part21g_ref, org.part21j_ref].filter(Boolean).sort() as string[]
      const refBadges = refs.map(r => `<span style="display:inline-block;padding:2px 8px;margin:2px 2px;border-radius:6px;background:#f4f4f5;font-size:11px;font-weight:500">${r}</span>`).join('')
      marker.bindPopup(`
        <div style="min-width:220px">
          <strong>${org.organisation_name}</strong><br/>
          <div style="margin:4px 0">${refBadges}</div>
          ${org.city ? `<span style="font-size:12px">${org.city}, ${COUNTRY_NAMES[org.country_code] || org.country_code}</span><br/>` : ''}
          <a href="/market/${org.slug || org.reference_number}" style="color:#6366f1;font-size:12px;text-decoration:underline">View profile →</a>
        </div>
      `)
      marker.addTo(map)
      markers.push(marker)
    }

    // Fit bounds if we have markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers)
      map.fitBounds(group.getBounds().pad(0.1))
    }
  }, [filtered])

  // Fly to selected org
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !flyTo) return

    map.flyTo([flyTo.lat, flyTo.lng], 10, {
      duration: 1.5,
    })

    // Open the popup for the matching marker
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        const latlng = layer.getLatLng()
        if (Math.abs(latlng.lat - flyTo.lat) < 0.001 && Math.abs(latlng.lng - flyTo.lng) < 0.001) {
          layer.openPopup()
        }
      }
    })
  }, [flyTo])

  return (
    <div>
      <div className="rounded-xl border overflow-hidden bg-card">
        <div ref={mapRef} style={{ height: '400px', width: '100%' }} />
      </div>
    </div>
  )
}
