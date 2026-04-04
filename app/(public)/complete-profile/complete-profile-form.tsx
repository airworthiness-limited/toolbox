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
  'Design (Part 21J)',
  'Maintenance (Part 145)',
  'Management (Part M/CAMO)',
  'Other',
  'Production (Part 21G)',
  'Training (Part 147)',
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
      const iso = `${y}-${m}-${d}`
      // Reject future dates
      const parsed = new Date(iso)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (!isNaN(parsed.getTime()) && parsed > today) {
        setDisplay('')
        onChange('')
        return
      }
      const formatted = `${d}/${m}/${y}`
      setDisplay(formatted)
      onChange(iso)
    }
  }

  return (
    <input
      type="text"
      placeholder="DD/MM/YYYY"
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
  certifyingStaff: boolean
  arcSignatory: boolean
  instructor: boolean
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
  const [employers, setEmployers] = useState<{ name: string; startDate: string; endDate: string; approvals: Approval[] }[]>([{ name: '', startDate: '', endDate: '', approvals: [{ type: '', reference: '', certifyingStaff: false, arcSignatory: false, instructor: false }] }])
  const [marketingOptIn, setMarketingOptIn] = useState(true)
  const [recruitmentOptIn, setRecruitmentOptIn] = useState(false)
  const [licenceFrontPath, setLicenceFrontPath] = useState<string | null>(null)
  const [licenceBackPath, setLicenceBackPath] = useState<string | null>(null)
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

  // Employer approval helpers
  function updateEmployerApproval(empIndex: number, appIndex: number, field: keyof Approval, value: string | boolean) {
    setEmployers(prev => prev.map((e, i) => {
      if (i !== empIndex) return e
      return { ...e, approvals: e.approvals.map((a, j) => j === appIndex ? { ...a, [field]: value } : a) }
    }))
  }

  function removeEmployerApproval(empIndex: number, appIndex: number) {
    setEmployers(prev => prev.map((e, i) => {
      if (i !== empIndex) return e
      return { ...e, approvals: e.approvals.filter((_, j) => j !== appIndex) }
    }))
  }

  function addEmployerApproval(empIndex: number) {
    setEmployers(prev => prev.map((e, i) => {
      if (i !== empIndex) return e
      return { ...e, approvals: [...e.approvals, { type: '', reference: '', certifyingStaff: false, arcSignatory: false, instructor: false }] }
    }))
  }

  async function handleLicencePhotoUpload(side: 'front' | 'back', file: File) {
    if (file.size > 5 * 1024 * 1024) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/licence-${side}-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('module-certificates')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (!error) {
      if (side === 'front') setLicenceFrontPath(path)
      else setLicenceBackPath(path)
    }
  }

  async function handleDeleteLicencePhoto(side: 'front' | 'back') {
    const path = side === 'front' ? licenceFrontPath : licenceBackPath
    if (!path) return
    await supabase.storage.from('module-certificates').remove([path])
    if (side === 'front') setLicenceFrontPath(null)
    else setLicenceBackPath(null)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    if (!firstName.trim() || !lastName.trim()) {
      setError('Required information is missing.')
      setLoading(false)
      return
    }

    if (hasLicence === 'yes') {
      const hasValidLicence = licences.some(l => l.number.trim() && l.categories.length > 0)
      if (!hasValidLicence) {
        setError('Required information is missing.')
        setLoading(false)
        return
      }
      // Check type rating dates
      for (const licence of licences) {
        for (const endorsement of licence.endorsements) {
          if (endorsement.rating && !endorsement.b1Date && !endorsement.b2Date) {
            setError('Each type rating requires at least a B1 or B2 endorsement date.')
            setLoading(false)
            return
          }
        }
      }
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
        industry: employers.flatMap(e => e.approvals).filter(a => a.type).map(a => a.type).join(', ') || null,
      })
      .eq('id', user.id)

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    if (licenceFrontPath || licenceBackPath) {
      await supabase.from('profiles').update({
        aml_photo_path: licenceFrontPath,
        aml_photo_back_path: licenceBackPath,
      }).eq('id', user.id)
    }

    const validEmployers = employers.filter(e => e.name.trim())
    if (validEmployers.length > 0) {
      await supabase.from('employment_periods').insert(
        validEmployers.map(e => ({
          user_id: user.id,
          employer: e.name.trim(),
          start_date: e.startDate || new Date().toISOString().split('T')[0],
          end_date: e.endDate || null,
        }))
      )
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
            <p className="text-xs text-muted-foreground mb-3">If you hold an Aircraft Maintenance Licence, this should match.</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">First Name <span className="text-muted-foreground/60">Required</span></Label>
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
                <Label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">Last Name <span className="text-muted-foreground/60">Required</span></Label>
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

          {/* Licence checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasLicence === 'yes'}
              onChange={e => {
                if (e.target.checked) {
                  setHasLicence('yes')
                } else {
                  setHasLicence('no')
                  setLicences([{ number: '', categories: [], endorsements: [{ ...EMPTY_ENDORSEMENT }], showTypeRatings: false, typeSearch: '', activeSearchRow: null }])
                }
              }}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-foreground">Aircraft Maintenance Licence (Part 66)</span>
              <p className="text-xs text-muted-foreground mt-0.5">This may be issued by any competent authority (e.g. UK.66.123456A).</p>
            </div>
          </label>

          {/* Licence Photo Upload */}
          {hasLicence === 'yes' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground mb-1">Licence Photo(s)</p>
              <p className="text-xs text-muted-foreground mb-3">Upload a photo of the front and back of your licence.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1.5 block">Front</Label>
                  {licenceFrontPath ? (
                    <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-green-300 dark:border-green-700">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600 font-medium">Uploaded</span>
                        <button type="button" onClick={() => handleDeleteLicencePhoto('front')} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border hover:border-foreground/40 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handleLicencePhotoUpload('front', file)
                        }}
                      />
                      <span className="text-xs text-muted-foreground">Upload front</span>
                    </label>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1.5 block">Back</Label>
                  {licenceBackPath ? (
                    <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-green-300 dark:border-green-700">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600 font-medium">Uploaded</span>
                        <button type="button" onClick={() => handleDeleteLicencePhoto('back')} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border hover:border-foreground/40 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handleLicencePhotoUpload('back', file)
                        }}
                      />
                      <span className="text-xs text-muted-foreground">Upload back</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Licence details — each licence has its own number + categories */}
          {hasLicence === 'yes' && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Licence Details</p>
              <div className="space-y-4">
                {licences.map((licence, index) => (
                  <div key={index} className="space-y-3">
                    {index > 0 && <div className="h-px bg-border my-1" />}
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Licence Number {licences.length > 1 && `(${index + 1})`} <span className="text-muted-foreground/60">Required</span>
                        </Label>
                        <Input
                          placeholder="e.g. UK.66.123456A"
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
                      <p className="text-sm font-medium text-muted-foreground mb-2">Categories{licences.length > 1 ? ` (${index + 1})` : ''} <span className="text-muted-foreground/60">Required</span></p>
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
                      <span className="text-sm font-medium text-muted-foreground">Aircraft Type Rating(s)</span>
                    </label>

                    {/* Type Ratings cards */}
                    {licence.showTypeRatings && (() => {
                      const filledEndorsements = licence.endorsements.filter(e => e.rating)
                      const emptyRow = licence.endorsements.find(e => !e.rating)
                      const emptyRowIndex = licence.endorsements.indexOf(emptyRow!)
                      const filtered = emptyRow && licence.activeSearchRow === emptyRowIndex ? getFilteredRatings(licence) : []

                      return (
                      <div className="mt-3 space-y-3">
                        {/* Filled endorsement cards */}
                        {filledEndorsements.map((endorsement, i) => {
                          const rowIndex = licence.endorsements.indexOf(endorsement)
                          return (
                            <div key={rowIndex} className="border rounded-xl p-4 relative">
                              <button
                                type="button"
                                onClick={() => removeEndorsement(index, rowIndex)}
                                className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <p className="text-sm font-semibold text-foreground">{endorsement.rating}</p>
                              <div className="space-y-2 mt-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">B1</span>
                                  <div className="flex-1"><DateInput value={endorsement.b1Date} onChange={v => updateEndorsementDate(index, rowIndex, 'b1Date', v)} filled={!!endorsement.b1Date} /></div>
                                  <button type="button" onClick={() => updateEndorsementDate(index, rowIndex, 'b1Date', '')} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 w-4" title="Clear date">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">B2</span>
                                  <div className="flex-1"><DateInput value={endorsement.b2Date} onChange={v => updateEndorsementDate(index, rowIndex, 'b2Date', v)} filled={!!endorsement.b2Date} /></div>
                                  <button type="button" onClick={() => updateEndorsementDate(index, rowIndex, 'b2Date', '')} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 w-4" title="Clear date">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">C</span>
                                  <div className="flex-1"><DateInput value={endorsement.cDate} onChange={v => updateEndorsementDate(index, rowIndex, 'cDate', v)} filled={!!endorsement.cDate} /></div>
                                  <button type="button" onClick={() => updateEndorsementDate(index, rowIndex, 'cDate', '')} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 w-4" title="Clear date">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}

                        {/* Search input for adding new type */}
                        <div className="relative">
                          <Input
                            value={licence.activeSearchRow === emptyRowIndex ? licence.typeSearch : ''}
                            onChange={e => {
                              setLicenceActiveSearchRow(index, emptyRowIndex)
                              setLicenceTypeSearch(index, e.target.value)
                            }}
                            onFocus={() => setLicenceActiveSearchRow(index, emptyRowIndex)}
                            placeholder="e.g. Boeing 737-600/700/800/900 (CFM56)"
                            className="text-sm h-12 rounded-xl"
                          />
                          {filtered.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filtered.map(r => (
                                <button
                                  key={`${r.category}-${r.rating}`}
                                  type="button"
                                  onClick={() => selectAircraftType(index, emptyRowIndex, r.rating)}
                                  className="w-full text-left px-4 py-3 text-sm hover:bg-muted border-b last:border-0"
                                >
                                  <span className="font-medium">{r.rating}</span>
                                  <span className="text-muted-foreground ml-2 text-xs">{r.group}</span>
                                </button>
                              ))}
                            </div>
                          )}
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
                  + Add Licence
                </button>
              </div>
            </div>
          )}

          <div className="h-px bg-border" />

          {/* Employer section */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Employer(s) <span className="text-muted-foreground/60 font-normal">Required</span></p>
            <div className="space-y-4">
              {employers.map((emp, i) => (
                <div key={i} className="space-y-3">
                  {i > 0 && <div className="h-px bg-border" />}
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Organisation {employers.length > 1 && `(${i + 1})`}
                      </Label>
                      <Input
                        placeholder="e.g. British Airways"
                        value={emp.name}
                        onChange={e => setEmployers(prev => prev.map((p, j) => j === i ? { ...p, name: e.target.value } : p))}
                        className="h-12 rounded-xl border-border"
                      />
                    </div>
                    {employers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEmployers(prev => prev.filter((_, j) => j !== i))}
                        className="self-end h-12 px-3 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground">Start Date <span className="text-muted-foreground/60">Required</span></Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <DateInput
                          value={emp.startDate || null}
                          onChange={v => setEmployers(prev => prev.map((p, j) => j === i ? { ...p, startDate: v } : p))}
                          filled={!!emp.startDate}
                        />
                      </div>
                      {emp.startDate && (
                        <button
                          type="button"
                          onClick={() => setEmployers(prev => prev.map((p, j) => j === i ? { ...p, startDate: '' } : p))}
                          className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                          title="Clear date"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground">End Date <span className="text-muted-foreground/60">Optional</span></Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <DateInput
                          value={emp.endDate || null}
                          onChange={v => setEmployers(prev => prev.map((p, j) => j === i ? { ...p, endDate: v } : p))}
                          filled={!!emp.endDate}
                        />
                      </div>
                      {emp.endDate && (
                        <button
                          type="button"
                          onClick={() => setEmployers(prev => prev.map((p, j) => j === i ? { ...p, endDate: '' } : p))}
                          className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                          title="Clear date"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Organisation Approval within employer */}
                  <div className="mt-2">
                    <div className="space-y-3">
                      {emp.approvals.map((approval, aIdx) => (
                        <div key={aIdx} className="space-y-2">
                          {aIdx > 0 && <div className="h-px bg-border mt-1" />}
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                                Approval Type {emp.approvals.length > 1 && `(${aIdx + 1})`} <span className="text-muted-foreground/60">Required</span>
                              </Label>
                              <select
                                value={approval.type}
                                onChange={e => updateEmployerApproval(i, aIdx, 'type', e.target.value)}
                                className="w-full h-12 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none"
                              >
                                <option value="">e.g. Maintenance (Part 145)</option>
                                {APPROVAL_TYPES.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                            {emp.approvals.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeEmployerApproval(i, aIdx)}
                                className="self-end h-12 px-3 text-muted-foreground hover:text-red-500 transition-colors"
                                title="Remove approval"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                              Approval Reference {emp.approvals.length > 1 && `(${aIdx + 1})`} <span className="text-muted-foreground/60">Optional</span>
                            </Label>
                            <Input
                              placeholder="e.g. UK.145.0000"
                              value={approval.reference}
                              onChange={e => updateEmployerApproval(i, aIdx, 'reference', e.target.value)}
                              className="h-12 rounded-xl border-border"
                            />
                          </div>
                          {/* Conditional role checkboxes */}
                          {approval.type === 'Maintenance (Part 145)' && (
                            <label className="flex items-start gap-3 cursor-pointer mt-2">
                              <input
                                type="checkbox"
                                checked={approval.certifyingStaff}
                                onChange={e => updateEmployerApproval(i, aIdx, 'certifyingStaff', e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                              />
                              <div>
                                <span className="text-sm font-medium text-foreground">Certifying Staff or Support Staff</span>
                                <p className="text-xs text-muted-foreground mt-0.5">Staff that hold an authorisation with certifying privileges.</p>
                              </div>
                            </label>
                          )}
                          {approval.type === 'Management (Part M/CAMO)' && (
                            <label className="flex items-start gap-3 cursor-pointer mt-2">
                              <input
                                type="checkbox"
                                checked={approval.arcSignatory}
                                onChange={e => updateEmployerApproval(i, aIdx, 'arcSignatory', e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                              />
                              <span className="text-sm font-medium text-foreground">Airworthiness Review Certificate Signatory</span>
                            </label>
                          )}
                          {approval.type === 'Training (Part 147)' && (
                            <label className="flex items-start gap-3 cursor-pointer mt-2">
                              <input
                                type="checkbox"
                                checked={approval.instructor}
                                onChange={e => updateEmployerApproval(i, aIdx, 'instructor', e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                              />
                              <span className="text-sm font-medium text-foreground">Instructor</span>
                            </label>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addEmployerApproval(i)}
                        className="text-xs font-semibold text-foreground hover:underline"
                      >
                        + Add Approval
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEmployers(prev => [...prev, { name: '', startDate: '', endDate: '', approvals: [{ type: '', reference: '', certifyingStaff: false, arcSignatory: false, instructor: false }] }])}
                className="text-xs font-semibold text-foreground hover:underline"
              >
                + Add Employer
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
