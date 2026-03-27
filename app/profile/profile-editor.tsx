'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AML_CATEGORIES } from '@/lib/profile/constants'
import { UK_TYPE_RATINGS } from '@/lib/profile/type-ratings'
import type { TypeEndorsement } from '@/lib/profile/types'

// Determine if an aircraft type is complex or non-complex based on B1 subcategory
// Complex (B1.1, B1.3): 3 years for Cat C eligibility
// Non-Complex (B1.2, B1.4): 5 years for Cat C eligibility
function getCategoryForRating(rating: string): string | null {
  const match = UK_TYPE_RATINGS.find(r => r.rating === rating)
  return match?.category ?? null
}

function isComplexAircraft(rating: string): boolean {
  const cat = getCategoryForRating(rating)
  return cat === 'B1.1' || cat === 'B1.3'
}

function getCEligibilityYears(rating: string): number {
  return isComplexAircraft(rating) ? 3 : 5
}

function isCEligible(endorsement: TypeEndorsement): boolean {
  // C eligibility requires at least one of B1 or B2 date
  const earliestDate = getEarliestEndorsementDate(endorsement)
  if (!earliestDate) return false

  const yearsRequired = getCEligibilityYears(endorsement.rating)
  const eligibleDate = new Date(earliestDate)
  eligibleDate.setFullYear(eligibleDate.getFullYear() + yearsRequired)
  return new Date() >= eligibleDate
}

function getEarliestEndorsementDate(endorsement: TypeEndorsement): string | null {
  const dates = [endorsement.b1Date, endorsement.b2Date].filter(Boolean) as string[]
  if (dates.length === 0) return null
  return dates.sort()[0]
}

function getCEligibilityDate(endorsement: TypeEndorsement): string | null {
  const earliest = getEarliestEndorsementDate(endorsement)
  if (!earliest) return null
  const yearsRequired = getCEligibilityYears(endorsement.rating)
  const d = new Date(earliest)
  d.setFullYear(d.getFullYear() + yearsRequired)
  return d.toISOString().split('T')[0]
}

const EMPTY_ENDORSEMENT: TypeEndorsement = {
  rating: '',
  b1Date: null,
  b2Date: null,
  b3Date: null,
  cDate: null,
}

interface ProfileEditorProps {
  profile: {
    aml_licence_number: string
    aml_categories: string[]
    type_ratings: TypeEndorsement[]
  }
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [licenceNumber, setLicenceNumber] = useState(profile.aml_licence_number)
  const [categories, setCategories] = useState<string[]>(profile.aml_categories)
  const [endorsements, setEndorsements] = useState<TypeEndorsement[]>(() => {
    const existing = profile.type_ratings ?? []
    // Always have at least one empty row for input
    if (existing.length === 0 || existing[existing.length - 1].rating !== '') {
      return [...existing, { ...EMPTY_ENDORSEMENT }]
    }
    return existing
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeSearchRow, setActiveSearchRow] = useState<number | null>(null)
  const [typeSearch, setTypeSearch] = useState('')

  // Filter type ratings for search
  const filteredRatings = useMemo(() => {
    if (!typeSearch.trim()) return []
    const query = typeSearch.toLowerCase()
    const selectedRatings = endorsements.map(e => e.rating).filter(Boolean)
    return UK_TYPE_RATINGS
      .filter(r => {
        const matchesSearch =
          r.rating.toLowerCase().includes(query) ||
          r.make.toLowerCase().includes(query) ||
          r.model.toLowerCase().includes(query)
        const notAlreadySelected = !selectedRatings.includes(r.rating)
        return matchesSearch && notAlreadySelected
      })
      .slice(0, 20)
  }, [typeSearch, endorsements])

  // Auto-apply implied categories when a B category is selected
  // B1.1 → A1, B1.2 → A2 + B3, B1.3 → A3, B1.4 → A4
  const IMPLIED_CATEGORIES: Record<string, string[]> = {
    'B1.1': ['A1'],
    'B1.2': ['A2', 'B3'],
    'B1.3': ['A3'],
    'B1.4': ['A4'],
  }

  function toggleCategory(value: string) {
    setCategories(prev => {
      if (prev.includes(value)) {
        return prev.filter(c => c !== value)
      }
      const next = [...prev, value]
      // Auto-add implied categories
      const implied = IMPLIED_CATEGORIES[value]
      if (implied) {
        for (const cat of implied) {
          if (!next.includes(cat)) next.push(cat)
        }
      }
      return next
    })
    setSaved(false)
  }

  function selectAircraftType(rowIndex: number, rating: string) {
    setEndorsements(prev => {
      const updated = [...prev]
      updated[rowIndex] = { ...updated[rowIndex], rating }
      // Add a new empty row if the last row now has a rating
      if (rowIndex === updated.length - 1) {
        updated.push({ ...EMPTY_ENDORSEMENT })
      }
      return updated
    })
    setTypeSearch('')
    setActiveSearchRow(null)
    setSaved(false)
  }

  function updateEndorsementDate(rowIndex: number, field: 'b1Date' | 'b2Date' | 'b3Date' | 'cDate', value: string) {
    setEndorsements(prev => {
      const updated = [...prev]
      updated[rowIndex] = { ...updated[rowIndex], [field]: value || null }
      return updated
    })
    setSaved(false)
  }

  function removeEndorsement(rowIndex: number) {
    setEndorsements(prev => {
      const updated = prev.filter((_, i) => i !== rowIndex)
      // Ensure there's always an empty row at the end
      if (updated.length === 0 || updated[updated.length - 1].rating !== '') {
        updated.push({ ...EMPTY_ENDORSEMENT })
      }
      return updated
    })
    setSaved(false)
  }

  function formatLicenceNumber(value: string): string {
    const digits = value.replace(/[^0-9]/g, '')
    if (digits.length === 0 && !value.startsWith('UK')) return value
    if (digits.length <= 7) {
      return `UK.66.${digits.padEnd(7, '').trim()}`
    }
    return `UK.66.${digits.slice(0, 7)}`
  }

  function handleLicenceChange(value: string) {
    setLicenceNumber(value)
    setSaved(false)
  }

  function handleLicenceBlur() {
    if (licenceNumber && licenceNumber !== 'UK.66.') {
      const digits = licenceNumber.replace(/[^0-9]/g, '')
      if (digits.length > 0) {
        setLicenceNumber(`UK.66.${digits.slice(0, 7)}`)
      }
    }
  }

  async function handleSave() {
    setError('')
    setSaved(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Filter out empty rows before saving
    const validEndorsements = endorsements.filter(e => e.rating !== '')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        aml_licence_number: licenceNumber || null,
        aml_categories: categories,
        type_ratings: validEndorsements,
      })
      .eq('id', user.id)

    if (updateError) {
      setError('Failed to save. Please try again.')
      return
    }

    setSaved(true)
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Licence Reference */}
      <div>
        <Label htmlFor="licence-number">
          Aircraft Maintenance Licence Reference
        </Label>
        <Input
          id="licence-number"
          value={licenceNumber}
          onChange={e => handleLicenceChange(e.target.value)}
          onBlur={handleLicenceBlur}
          placeholder="UK.66.1234567"
          className="mt-1.5 max-w-xs"
        />
        <p className="text-xs text-gray-400 mt-1">UK.66.XXXXXXX (7 digits)</p>
      </div>

      {/* Categories */}
      <div>
        <Label>Categories</Label>
        <p className="text-xs text-gray-400 mt-0.5 mb-2">Select all that apply to your Aircraft Maintenance Licence.</p>
        <div className="flex flex-wrap gap-2">
          {AML_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggleCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                categories.includes(cat.value)
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {cat.value}
            </button>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            {categories.map(c => AML_CATEGORIES.find(a => a.value === c)?.label).join(', ')}
          </div>
        )}
      </div>

      {/* Type Endorsements Table */}
      <div>
        <Label>Type Endorsements</Label>
        <p className="text-xs text-gray-400 mt-0.5 mb-2">
          Enter the date each type was endorsed on your licence. Category C eligibility is calculated automatically.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-semibold text-gray-700 min-w-[240px]">Aircraft Type</th>
                <th className="text-center py-2 px-2 font-semibold text-gray-700 w-[130px]">B1</th>
                <th className="text-center py-2 px-2 font-semibold text-gray-700 w-[130px]">B2</th>
                <th className="text-center py-2 px-2 font-semibold text-gray-700 w-[130px]">B3</th>
                <th className="text-center py-2 px-2 font-semibold text-gray-700 w-[130px]">C</th>
                <th className="w-[40px]"></th>
              </tr>
            </thead>
            <tbody>
              {endorsements.map((endorsement, rowIndex) => {
                const isEmptyRow = !endorsement.rating
                const b1Sub = endorsement.rating ? getCategoryForRating(endorsement.rating) : null
                const eligible = endorsement.rating ? isCEligible(endorsement) : false
                const eligibleDate = endorsement.rating ? getCEligibilityDate(endorsement) : null

                return (
                  <tr key={rowIndex} className="border-b border-gray-100">
                    {/* Aircraft Type cell */}
                    <td className="py-2 px-2">
                      {isEmptyRow ? (
                        <div className="relative">
                          <Input
                            value={activeSearchRow === rowIndex ? typeSearch : ''}
                            onChange={e => {
                              setActiveSearchRow(rowIndex)
                              setTypeSearch(e.target.value)
                            }}
                            onFocus={() => setActiveSearchRow(rowIndex)}
                            placeholder="Search aircraft type..."
                            className="text-sm"
                          />
                          {activeSearchRow === rowIndex && filteredRatings.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredRatings.map(r => (
                                <button
                                  key={`${r.category}-${r.rating}`}
                                  type="button"
                                  onClick={() => selectAircraftType(rowIndex, r.rating)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0"
                                >
                                  <span className="font-medium">{r.rating}</span>
                                  <span className="text-gray-400 ml-2">{r.category} · {r.group}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium">{endorsement.rating}</span>
                          {b1Sub && (
                            <span className="text-xs text-gray-400 ml-2">({b1Sub})</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* B1 Date */}
                    <td className="py-2 px-2">
                      {isEmptyRow ? (
                        <div className="h-9 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-xs text-amber-600">N/A</div>
                      ) : (
                        <input
                          type="date"
                          value={endorsement.b1Date ?? ''}
                          onChange={e => updateEndorsementDate(rowIndex, 'b1Date', e.target.value)}
                          className={`w-full h-9 rounded-md border px-2 text-sm ${
                            endorsement.b1Date
                              ? 'bg-green-50 border-green-300 text-green-800'
                              : 'bg-amber-50 border-amber-200 text-amber-600'
                          }`}
                        />
                      )}
                    </td>

                    {/* B2 Date */}
                    <td className="py-2 px-2">
                      {isEmptyRow ? (
                        <div className="h-9 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-xs text-amber-600">N/A</div>
                      ) : (
                        <input
                          type="date"
                          value={endorsement.b2Date ?? ''}
                          onChange={e => updateEndorsementDate(rowIndex, 'b2Date', e.target.value)}
                          className={`w-full h-9 rounded-md border px-2 text-sm ${
                            endorsement.b2Date
                              ? 'bg-green-50 border-green-300 text-green-800'
                              : 'bg-amber-50 border-amber-200 text-amber-600'
                          }`}
                        />
                      )}
                    </td>

                    {/* B3 Date */}
                    <td className="py-2 px-2">
                      {isEmptyRow ? (
                        <div className="h-9 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-xs text-amber-600">N/A</div>
                      ) : (
                        <input
                          type="date"
                          value={endorsement.b3Date ?? ''}
                          onChange={e => updateEndorsementDate(rowIndex, 'b3Date', e.target.value)}
                          className={`w-full h-9 rounded-md border px-2 text-sm ${
                            endorsement.b3Date
                              ? 'bg-green-50 border-green-300 text-green-800'
                              : 'bg-amber-50 border-amber-200 text-amber-600'
                          }`}
                        />
                      )}
                    </td>

                    {/* C Date */}
                    <td className="py-2 px-2">
                      {isEmptyRow ? (
                        <div className="h-9 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-xs text-amber-600">N/A</div>
                      ) : endorsement.cDate ? (
                        <input
                          type="date"
                          value={endorsement.cDate ?? ''}
                          onChange={e => updateEndorsementDate(rowIndex, 'cDate', e.target.value)}
                          className="w-full h-9 rounded-md border px-2 text-sm bg-green-50 border-green-300 text-green-800"
                        />
                      ) : eligible ? (
                        <div className="relative">
                          <input
                            type="date"
                            value=""
                            onChange={e => updateEndorsementDate(rowIndex, 'cDate', e.target.value)}
                            className="w-full h-9 rounded-md border px-2 text-sm bg-green-50 border-green-300 text-green-800"
                          />
                          <span className="absolute -top-5 left-0 text-[10px] text-green-700 font-medium whitespace-nowrap">
                            Eligible for Cat C
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="date"
                            value=""
                            onChange={e => updateEndorsementDate(rowIndex, 'cDate', e.target.value)}
                            className="w-full h-9 rounded-md border px-2 text-sm bg-amber-50 border-amber-200 text-amber-600"
                          />
                          {eligibleDate && (
                            <span className="absolute -bottom-4 left-0 text-[10px] text-amber-600 whitespace-nowrap">
                              Eligible {new Date(eligibleDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Remove button */}
                    <td className="py-2 px-1">
                      {!isEmptyRow && (
                        <button
                          type="button"
                          onClick={() => removeEndorsement(rowIndex)}
                          className="text-gray-400 hover:text-red-500 text-lg leading-none"
                          title="Remove"
                        >
                          &times;
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Category A note */}
        <p className="text-xs text-gray-400 mt-3">
          Category A authorisations are granted by the approved organisation, not by CAA licence endorsement.
        </p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved successfully</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
