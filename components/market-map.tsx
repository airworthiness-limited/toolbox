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

// Colour per approval type
const APPROVAL_COLORS: Record<string, string> = {
  part145: '#3b82f6', // Blue
  part147: '#22c55e', // Green
  part21g: '#f59e0b', // Amber
  part21j: '#f43f5e', // Rose
}

const APPROVAL_LABELS: Record<string, string> = {
  part145: 'Maintenance (Part 145)',
  part147: 'Training (Part 147)',
  part21g: 'Production (Part 21G)',
  part21j: 'Design (Part 21J)',
}

// Pixel offsets via iconAnchor — spreads dots into a 2×2 grid
// Higher anchor value = icon shifts left/up, lower = right/down
const APPROVAL_OFFSETS: Record<string, [number, number]> = {
  part145: [10, 10],
  part147: [4, 10],
  part21g: [10, 4],
  part21j: [4, 4],
}

function createMarkerIcon(color: string, anchor: [number, number]): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: anchor,
  })
}

function getApprovalTypes(org: MapOrg): { type: string; ref: string }[] {
  const types: { type: string; ref: string }[] = []
  const r = org.reference_number

  // Base type from reference_number prefix
  if (r.includes('.145.')) types.push({ type: 'part145', ref: r })
  else if (r.includes('.147.')) types.push({ type: 'part147', ref: r })
  else if (r.includes('.21G.')) types.push({ type: 'part21g', ref: r })
  else if (r.includes('.21J.')) types.push({ type: 'part21j', ref: r })

  // Linked approvals (avoid duplicates)
  if (org.part147_ref && !types.some(t => t.ref === org.part147_ref)) {
    types.push({ type: 'part147', ref: org.part147_ref })
  }
  if (org.part21g_ref && !types.some(t => t.ref === org.part21g_ref)) {
    types.push({ type: 'part21g', ref: org.part21g_ref })
  }
  if (org.part21j_ref && !types.some(t => t.ref === org.part21j_ref)) {
    types.push({ type: 'part21j', ref: org.part21j_ref })
  }

  return types
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

    // Add markers — one per approval type per org
    const markers: L.Marker[] = []
    for (const org of filtered) {
      if (!org.latitude || !org.longitude) continue

      const approvalTypes = getApprovalTypes(org)
      const multiApproval = approvalTypes.length > 1

      // Popup content (shared across all markers for this org)
      const refs = [org.reference_number, org.part147_ref, org.part21g_ref, org.part21j_ref].filter(Boolean).sort() as string[]
      const refBadges = refs.map(r => `<span style="display:inline-block;padding:2px 8px;margin:2px 2px;border-radius:6px;background:#f4f4f5;font-size:11px;font-weight:500">${r}</span>`).join('')
      const popupHtml = `
        <div style="min-width:220px">
          <strong>${org.organisation_name}</strong><br/>
          <div style="margin:4px 0">${refBadges}</div>
          ${org.city ? `<span style="font-size:12px">${org.city}, ${COUNTRY_NAMES[org.country_code] || org.country_code}</span><br/>` : ''}
          <a href="/market/${org.slug || org.reference_number}" style="color:#3b82f6;font-size:12px;text-decoration:underline">View profile →</a>
        </div>
      `

      for (const { type } of approvalTypes) {
        const color = APPROVAL_COLORS[type] || '#6366f1'
        const anchor: [number, number] = multiApproval ? APPROVAL_OFFSETS[type] : [7, 7]
        const icon = createMarkerIcon(color, anchor)

        const marker = L.marker([org.latitude, org.longitude], { icon })
        marker.bindPopup(popupHtml)
        marker.addTo(map)
        markers.push(marker)
      }
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
      <div className="rounded-xl border overflow-hidden bg-card relative">
        <div ref={mapRef} style={{ height: '400px', width: '100%' }} />
        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-zinc-200 dark:border-zinc-700">
          <div className="space-y-1">
            {Object.entries(APPROVAL_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2 text-[11px]">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full border border-white shadow-sm flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="text-zinc-700 dark:text-zinc-300">{APPROVAL_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
