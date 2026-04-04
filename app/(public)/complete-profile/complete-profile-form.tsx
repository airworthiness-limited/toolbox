'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AML_CATEGORIES } from '@/lib/profile/constants'
import { UK_TYPE_RATINGS } from '@/lib/profile/type-ratings'
import type { TypeEndorsement } from '@/lib/profile/types'

const IMPLIED_CATEGORIES: Record<string, string[]> = {
  'B1.1': ['A1'],
  'B1.2': ['A2', 'B3'],
  'B1.3': ['A3'],
  'B1.4': ['A4'],
}

const APPROVAL_TYPES = [
  'Part 145 (Aircraft Maintenance)',
  'Part 145 (Engine Maintenance)',
  'Part 145 (Component Maintenance)',
  'Part CAMO (Continuing Airworthiness Management)',
  'Part 147 (Aircraft Maintenance Training)',
  'Part 21 Subpart G (Production)',
  'Part 21 Subpart J (Design)',
  'Other',
]

interface LicenceEntry {
  number: string
  categories: string[]
  endorsements: TypeEndorsement[]
  showTypeRatings: boolean
  typeSearch: string
  activeSearchRow: number | null
}

const EMPTY_ENDORSEMENT: TypeEndorsement = {
  rating: '',
  b1Date: null,
  b2Date: null,
  b3Date: null,
  cDate: null,
}

// Convert ISO date (yyyy-mm-dd) to UK format (dd/mm/yyyy)
function isoToUk(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// Convert UK format (dd/mm/yyyy) to ISO date (yyyy-mm-dd)
function ukToIso(uk: string): string {
  const parts = uk.replace(/[^\d]/g, '')
  if (parts.length === 8) {
    const d = parts.substring(0, 2)
    const m = parts.substring(2, 4)
    const y = parts.substring(4, 8)
    return `${y}-${m}-${d}`
  }
  return ''
}

function DateInput({ value, onChange, filled }: { value: string | null, onChange: (v: string) => void, filled: boolean }) {
  const [display, setDisplay] = useState(isoToUk(value))

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Allow digits and slashes only, max 10 chars
    const cleaned = e.target.value.replace(/[^\d/]/g, '').slice(0, 10)
    setDisplay(cleaned)
  }

  function handleBlur() {
    // On blur, try to parse and format
    const digits = display.replace(/[^\d]/g, '')
    if (digits.length === 0) {
      setDisplay('')
      onChange('')
      return
    }
    if (digits.length >= 8) {
      const d = digits.slice(0, 2)
      const m = digits.slice(2, 4)
      const y = digits.slice(4, 8)
      const formatted = `${d}/${m}/${y}`
      setDisplay(formatted)
      onChange(`${y}-${m}-${d}`)
    }
  }

  return (
    <input
      type="text"
      placeholder="dd/mm/yyyy"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      maxLength={10}
      className={`w-full h-10 rounded-md border px-1 text-xs text-center ${filled ? 'bg-green-50 border-green-300 text-green-800 dark:bg-green-950 dark:border-green-700 dark:text-green-100' : 'bg-muted border-border text-muted-foreground placeholder:text-muted-foreground/60'}`}
    />
  )
}

function getCategoryForRating(rating: string): string | null {
  const match = UK_TYPE_RATINGS.find(r => r.rating === rating)
  return match?.category ?? null
}

interface Approval {
  type: string
  reference: string
}

function toggleCategoryInList(categories: string[], cat: string): string[] {
  if (categories.includes(cat)) {
    const implied = IMPLIED_CATEGORIES[cat] || []
    const otherImplied = Object.entries(IMPLIED_CATEGORIES)
      .filter(([k]) => k !== cat && categories.includes(k))
      .flatMap(([, v]) => v)
    return categories
      .filter(c => c !== cat)
      .filter(c => !implied.includes(c) || otherImplied.includes(c))
  } else {
    const implied = IMPLIED_CATEGORIES[cat] || []
    return [...new Set([...categories, cat, ...implied])]
  }
}

function isCategoryImpliedIn(categories: string[], cat: string): boolean {
  return Object.entries(IMPLIED_CATEGORIES).some(
    ([parent, children]) => children.includes(cat) && categories.includes(parent)
  )
}

export function CompleteProfileForm() {
  const router = useRouter()
  const supabase = createClient()

  const [firstName, setFirstName] = useState('')
  const [middleNames, setMiddleNames] = useState('')
  const [lastName, setLastName] = useState('')
  const [hasLicence, setHasLicence] = useState<'yes' | 'no' | ''>('')
  const [licences, setLicences] = useState<LicenceEntry[]>([{ number: '', categories: [], endorsements: [{ ...EMPTY_ENDORSEMENT }], showTypeRatings: false, typeSearch: '', activeSearchRow: null }])
  const [employer, setEmployer] = useState('')
  const [approvals, setApprovals] = useState<Approval[]>([{ type: '', reference: '' }])
  const [marketingOptIn, setMarketingOptIn] = useState(true)
  const [recruitmentOptIn, setRecruitmentOptIn] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Licence helpers
  function updateLicenceNumber(index: number, value: string) {
    setLicences(prev => prev.map((l, i) => i === index ? { ...l, number: value } : l))
  }

  function toggleLicenceCategory(index: number, cat: string) {
    setLicences(prev => prev.map((l, i) =>
      i === index ? { ...l, categories: toggleCategoryInList(l.categories, cat) } : l
    ))
  }

  function removeLicence(index: number) {
    setLicences(prev => prev.filter((_, i) => i !== index))
  }

  function addLicence() {
    setLicences(prev => [...prev, { number: '', categories: [], endorsements: [{ ...EMPTY_ENDORSEMENT }], showTypeRatings: false, typeSearch: '', activeSearchRow: null }])
  }

  function toggleTypeRatings(index: number) {
    setLicences(prev => prev.map((l, i) => i === index ? { ...l, showTypeRatings: !l.showTypeRatings } : l))
  }

  function setLicenceTypeSearch(index: number, value: string) {
    setLicences(prev => prev.map((l, i) => i === index ? { ...l, typeSearch: value } : l))
  }

  function setLicenceActiveSearchRow(index: number, row: number | null) {
    setLicences(prev => prev.map((l, i) => i === index ? { ...l, activeSearchRow: row } : l))
  }

  function selectAircraftType(licenceIndex: number, rowIndex: number, rating: string) {
    setLicences(prev => prev.map((l, i) => {
      if (i !== licenceIndex) return l
      const updated = [...l.endorsements]
      updated[rowIndex] = { ...updated[rowIndex], rating }
      if (rowIndex === updated.length - 1) updated.push({ ...EMPTY_ENDORSEMENT })
      return { ...l, endorsements: updated, typeSearch: '', activeSearchRow: null }
    }))
  }

  function updateEndorsementDate(licenceIndex: number, rowIndex: number, field: 'b1Date' | 'b2Date' | 'b3Date' | 'cDate', value: string) {
    setLicences(prev => prev.map((l, i) => {
      if (i !== licenceIndex) return l
      const updated = [...l.endorsements]
      updated[rowIndex] = { ...updated[rowIndex], [field]: value || null }
      return { ...l, endorsements: updated }
    }))
  }

  function removeEndorsement(licenceIndex: number, rowIndex: number) {
    setLicences(prev => prev.map((l, i) => {
      if (i !== licenceIndex) return l
      return { ...l, endorsements: l.endorsements.filter((_, j) => j !== rowIndex) }
    }))
  }

  function getFilteredRatings(licence: LicenceEntry) {
    if (!licence.typeSearch.trim()) return []
    const query = licence.typeSearch.toLowerCase()
    const selected = licence.endorsements.map(e => e.rating).filter(Boolean)
    return UK_TYPE_RATINGS
      .filter(r => {
        const matches = r.rating.toLowerCase().includes(query) || r.make.toLowerCase().includes(query) || r.model.toLowerCase().includes(query)
        return matches && !selected.includes(r.rating)
      })
      .slice(0, 20)
  }

  // Approval helpers
  function updateApproval(index: number, field: keyof Approval, value: string) {
    setApprovals(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }

  function removeApproval(index: number) {
    setApprovals(prev => prev.filter((_, i) => i !== index))
  }

  function addApproval() {
    setApprovals(prev => [...prev, { type: '', reference: '' }])
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.')
      setLoading(false)
      return
    }

    const fullName = [firstName.trim(), middleNames.trim(), lastName.trim()].filter(Boolean).join(' ')
    const validLicences = licences.filter(l => l.number.trim())
    const allCategories = [...new Set(licences.flatMap(l => l.categories))]
    const allEndorsements = licences
      .flatMap(l => l.endorsements)
      .filter(e => e.rating)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Session expired. Please sign in again.')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        aml_licence_number: hasLicence === 'yes' && validLicences.length > 0
          ? validLicences.map(l => l.number.trim()).join(', ')
          : null,
        aml_categories: hasLicence === 'yes' ? allCategories : [],
        type_ratings: hasLicence === 'yes' ? allEndorsements : [],
        industry: approvals.filter(a => a.type).map(a => a.type).join(', ') || null,
      })
      .eq('id', user.id)

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    if (employer.trim()) {
      await supabase.from('employment_periods').insert({
        user_id: user.id,
        employer: employer.trim(),
        start_date: new Date().toISOString().split('T')[0],
      })
    }

    await supabase.auth.updateUser({ data: { full_name: fullName } })

    router.push('/profile')
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Complete your profile</h1>
          <p className="text-sm text-muted-foreground mt-2">
            We need a few details to set up your profile.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-5">

          {/* Name section */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Your Full Name</p>
            <p className="text-xs text-muted-foreground mb-3">If you hold a Part 66 licence, this should match the name on your licence.</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="h-12 rounded-xl border-border"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="middleNames" className="text-sm font-medium text-muted-foreground">
                  Middle Name(s) <span className="text-muted-foreground/60">Optional</span>
                </Label>
                <Input
                  id="middleNames"
                  value={middleNames}
                  onChange={e => setMiddleNames(e.target.value)}
                  className="h-12 rounded-xl border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="h-12 rounded-xl border-border"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Licence question */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Do you hold a Part 66 Aircraft Maintenance Licence?</p>
            <p className="text-xs text-muted-foreground mb-3">This may be issued by any competent authority (e.g. UK.66.123456A).</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setHasLicence('yes')}
                className={`flex-1 h-12 rounded-xl text-sm font-semibold transition-colors ${
                  hasLicence === 'yes'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => { setHasLicence('no'); setLicences([{ number: '', categories: [], endorsements: [{ ...EMPTY_ENDORSEMENT }], showTypeRatings: false, typeSearch: '', activeSearchRow: null }]) }}
                className={`flex-1 h-12 rounded-xl text-sm font-semibold transition-colors ${
                  hasLicence === 'no'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Licence details — each licence has its own number + categories */}
          {hasLicence === 'yes' && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Licence Details</p>
              <p className="text-xs text-muted-foreground mb-3">Used to track your module exam progress and generate your continuation training record.</p>
              <div className="space-y-4">
                {licences.map((licence, index) => (
                  <div key={index} className="space-y-3">
                    {index > 0 && <div className="h-px bg-border my-1" />}
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Licence Number {licences.length > 1 && `(${index + 1})`} <span className="text-muted-foreground/60">Optional</span>
                        </Label>
                        <Input
                          placeholder="e.g. UK.66.12345"
                          value={licence.number}
                          onChange={e => updateLicenceNumber(index, e.target.value)}
                          className="h-12 rounded-xl border-border"
                        />
                      </div>
                      {licences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLicence(index)}
                          className="self-end h-12 px-3 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Categories{licences.length > 1 ? ` (${index + 1})` : ''}</p>
                      <div className="flex flex-wrap gap-2">
                        {AML_CATEGORIES.map(cat => {
                          const isSelected = licence.categories.includes(cat.value)
                          return (
                            <button
                              key={cat.value}
                              type="button"
                              onClick={() => toggleLicenceCategory(index, cat.value)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                              title={cat.label}
                            >
                              {cat.value}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Type Ratings toggle */}
                    <label className="flex items-center gap-3 cursor-pointer mt-3">
                      <input
                        type="checkbox"
                        checked={licence.showTypeRatings}
                        onChange={() => toggleTypeRatings(index)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-muted-foreground">I have aircraft type ratings on this licence</span>
                    </label>

                    {/* Type Ratings table */}
                    {licence.showTypeRatings && (() => {
                      const firstCDate = licence.endorsements.find(e => e.cDate)?.cDate ?? null
                      return (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Enter the date each type was endorsed on this licence.</p>
                        <div className="overflow-x-auto border rounded-lg">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="border-b border-border bg-muted">
                                <th className="text-left py-2 px-2 font-semibold text-foreground min-w-[320px] text-xs">Aircraft Type</th>
                                <th className="text-center py-2 px-2 font-semibold text-foreground w-[115px] text-xs">B1</th>
                                <th className="text-center py-2 px-2 font-semibold text-foreground w-[115px] text-xs">B2</th>
                                <th className="text-center py-2 px-2 font-semibold text-foreground w-[115px] text-xs">B3</th>
                                <th className="text-center py-2 px-2 font-semibold text-foreground w-[115px] text-xs">C</th>
                                <th className="w-[30px]"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {licence.endorsements.map((endorsement, rowIndex) => {
                                const isEmptyRow = !endorsement.rating
                                const b1Sub = endorsement.rating ? getCategoryForRating(endorsement.rating) : null
                                const filtered = isEmptyRow && licence.activeSearchRow === rowIndex ? getFilteredRatings(licence) : []
                                const cDateValue = endorsement.cDate ?? (firstCDate && !isEmptyRow ? firstCDate : null)

                                return (
                                  <tr key={rowIndex} className="border-b border-border">
                                    <td className="py-2 px-2">
                                      {isEmptyRow ? (
                                        <div className="relative">
                                          <Input
                                            value={licence.activeSearchRow === rowIndex ? licence.typeSearch : ''}
                                            onChange={e => {
                                              setLicenceActiveSearchRow(index, rowIndex)
                                              setLicenceTypeSearch(index, e.target.value)
                                            }}
                                            onFocus={() => setLicenceActiveSearchRow(index, rowIndex)}
                                            placeholder="Search aircraft type..."
                                            className="text-sm h-12"
                                          />
                                          {filtered.length > 0 && (
                                            <div className="absolute z-10 mt-1 w-full min-w-[360px] bg-background border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                                              {filtered.map(r => (
                                                <button
                                                  key={`${r.category}-${r.rating}`}
                                                  type="button"
                                                  onClick={() => selectAircraftType(index, rowIndex, r.rating)}
                                                  className="w-full text-left px-4 py-3 text-sm hover:bg-muted border-b last:border-0"
                                                >
                                                  <span className="font-medium">{r.rating}</span>
                                                  <span className="text-muted-foreground ml-2 text-xs">{r.category} · {r.group}</span>
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div>
                                          <span className="font-medium text-xs">{endorsement.rating}</span>
                                          {b1Sub && <span className="text-[10px] text-muted-foreground ml-1">({b1Sub})</span>}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-2 px-1">
                                      {isEmptyRow ? (
                                        <div className="h-10 rounded-md bg-muted border border-border flex items-center justify-center text-[10px] text-muted-foreground">-</div>
                                      ) : (
                                        <DateInput value={endorsement.b1Date} onChange={v => updateEndorsementDate(index, rowIndex, 'b1Date', v)} filled={!!endorsement.b1Date} />
                                      )}
                                    </td>
                                    <td className="py-2 px-1">
                                      {isEmptyRow ? (
                                        <div className="h-10 rounded-md bg-muted border border-border flex items-center justify-center text-[10px] text-muted-foreground">-</div>
                                      ) : (
                                        <DateInput value={endorsement.b2Date} onChange={v => updateEndorsementDate(index, rowIndex, 'b2Date', v)} filled={!!endorsement.b2Date} />
                                      )}
                                    </td>
                                    <td className="py-2 px-1">
                                      {isEmptyRow ? (
                                        <div className="h-10 rounded-md bg-muted border border-border flex items-center justify-center text-[10px] text-muted-foreground">-</div>
                                      ) : (
                                        <DateInput value={endorsement.b3Date} onChange={v => updateEndorsementDate(index, rowIndex, 'b3Date', v)} filled={!!endorsement.b3Date} />
                                      )}
                                    </td>
                                    <td className="py-2 px-1">
                                      {isEmptyRow ? (
                                        <div className="h-10 rounded-md bg-muted border border-border flex items-center justify-center text-[10px] text-muted-foreground">-</div>
                                      ) : (
                                        <DateInput value={endorsement.cDate ?? cDateValue} onChange={v => updateEndorsementDate(index, rowIndex, 'cDate', v)} filled={!!(endorsement.cDate ?? cDateValue)} />
                                      )}
                                    </td>
                                    <td className="py-2 px-1">
                                      {!isEmptyRow && (
                                        <button type="button" onClick={() => removeEndorsement(index, rowIndex)}
                                          className="text-muted-foreground hover:text-red-500 text-sm">&times;</button>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      )
                    })()}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLicence}
                  className="text-xs font-semibold text-foreground hover:underline"
                >
                  + Add another licence
                </button>
              </div>
            </div>
          )}

          {/* Unlicensed context */}
          {hasLicence === 'no' && (
            <p className="text-xs text-muted-foreground bg-muted rounded-xl p-3">
              No problem. You can still use the digital logbook, continuation training tracker, and all other tools. You can add licence details later from your profile if you obtain one.
            </p>
          )}

          <div className="h-px bg-border" />

          {/* Organisation section */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Organisation <span className="text-muted-foreground/60 font-normal">Optional</span></p>
            <div className="space-y-1.5">
              <Input
                id="employer"
                placeholder="e.g. British Airways"
                value={employer}
                onChange={e => setEmployer(e.target.value)}
                className="h-12 rounded-xl border-border"
              />
            </div>
          </div>

          {/* Approvals — repeatable */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Organisation Approval</p>
            <p className="text-xs text-muted-foreground mb-3">The type of approval and reference number held by your organisation.</p>
            <div className="space-y-3">
              {approvals.map((approval, index) => (
                <div key={index} className="space-y-2">
                  {index > 0 && <div className="h-px bg-border mt-1" />}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        Approval Type {approvals.length > 1 && `(${index + 1})`} <span className="text-muted-foreground/60">Optional</span>
                      </Label>
                      <select
                        value={approval.type}
                        onChange={e => updateApproval(index, 'type', e.target.value)}
                        className="w-full h-12 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none"
                      >
                        <option value="">Select approval type</option>
                        {APPROVAL_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    {approvals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeApproval(index)}
                        className="self-end h-12 px-3 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                      Approval Reference {approvals.length > 1 && `(${index + 1})`} <span className="text-muted-foreground/60">Optional</span>
                    </Label>
                    <Input
                      placeholder="e.g. UK.145.0000"
                      value={approval.reference}
                      onChange={e => updateApproval(index, 'reference', e.target.value)}
                      className="h-12 rounded-xl border-border"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addApproval}
                className="text-xs font-semibold text-foreground hover:underline"
              >
                + Add another approval
              </button>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Consent */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              By continuing you agree to our <Link href="/terms" className="text-foreground font-semibold hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-foreground font-semibold hover:underline">Privacy Policy</Link>.
            </p>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={e => setMarketingOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-muted-foreground">
                Keep me updated with product news, regulatory changes, and training resources. You can unsubscribe at any time.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={recruitmentOptIn}
                onChange={e => setRecruitmentOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-muted-foreground">
                Share my profile with approved recruitment partners to receive relevant job opportunities and salary insights.
              </span>
            </label>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold rounded-xl"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Continue'}
          </Button>

          <p className="text-xs text-muted-foreground/60 text-center leading-relaxed">
            You can update these details at any time from your profile settings.
          </p>
        </form>
      </div>
    </div>
  )
}
