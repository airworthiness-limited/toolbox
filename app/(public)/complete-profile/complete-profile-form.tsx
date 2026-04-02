'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AML_CATEGORIES } from '@/lib/profile/constants'

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

export function CompleteProfileForm() {
  const router = useRouter()
  const supabase = createClient()

  const [firstName, setFirstName] = useState('')
  const [middleNames, setMiddleNames] = useState('')
  const [lastName, setLastName] = useState('')
  const [hasLicence, setHasLicence] = useState<'yes' | 'no' | ''>('')
  const [licenceNumber, setLicenceNumber] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [employer, setEmployer] = useState('')
  const [approvalType, setApprovalType] = useState('')
  const [approvalNumber, setApprovalNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleCategory(cat: string) {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) {
        // Removing — also remove any categories that are only implied by this one
        const implied = IMPLIED_CATEGORIES[cat] || []
        const otherImplied = Object.entries(IMPLIED_CATEGORIES)
          .filter(([k]) => k !== cat && prev.includes(k))
          .flatMap(([, v]) => v)
        return prev
          .filter(c => c !== cat)
          .filter(c => !implied.includes(c) || otherImplied.includes(c))
      } else {
        // Adding — also add implied categories
        const implied = IMPLIED_CATEGORIES[cat] || []
        return [...new Set([...prev, cat, ...implied])]
      }
    })
  }

  function isCategoryImplied(cat: string): boolean {
    return Object.entries(IMPLIED_CATEGORIES).some(
      ([parent, children]) => children.includes(cat) && selectedCategories.includes(parent)
    )
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
        aml_licence_number: hasLicence === 'yes' ? (licenceNumber.trim() || null) : null,
        aml_categories: hasLicence === 'yes' ? selectedCategories : [],
        industry: approvalType || null,
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
          <h1 className="text-2xl font-bold text-black tracking-tight">Complete your profile</h1>
          <p className="text-sm text-gray-500 mt-2">
            We need a few details to set up your profile.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-5">

          {/* Name section */}
          <div>
            <p className="text-xs font-bold text-black mb-3">Your full name</p>
            <p className="text-[11px] text-gray-400 mb-3">If you hold a Part 66 licence, this should match the name on your licence.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs text-gray-500">First name</Label>
                <Input
                  id="firstName"
                  placeholder="James"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs text-gray-500">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
                />
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              <Label htmlFor="middleNames" className="text-xs text-gray-500">
                Middle name(s) <span className="text-gray-300">optional</span>
              </Label>
              <Input
                id="middleNames"
                value={middleNames}
                onChange={e => setMiddleNames(e.target.value)}
                className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
              />
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Licence question */}
          <div>
            <p className="text-xs font-bold text-black mb-1">Do you hold a Part 66 Aircraft Maintenance Licence?</p>
            <p className="text-[11px] text-gray-400 mb-3">This may be issued by any competent authority (e.g. UK.66.123456A).</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setHasLicence('yes')}
                className={`flex-1 h-12 rounded-xl text-sm font-bold transition-colors ${
                  hasLicence === 'yes'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => { setHasLicence('no'); setLicenceNumber(''); setSelectedCategories([]) }}
                className={`flex-1 h-12 rounded-xl text-sm font-bold transition-colors ${
                  hasLicence === 'no'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Licence details — only shown if user holds a licence */}
          {hasLicence === 'yes' && (
            <>
              <div>
                <p className="text-xs font-bold text-black mb-3">Licence details</p>
                <p className="text-[11px] text-gray-400 mb-3">Used to track your module exam progress and generate your continuation training record.</p>
                <div className="space-y-1.5">
                  <Label htmlFor="licenceNumber" className="text-xs text-gray-500">
                    Licence number <span className="text-gray-300">optional</span>
                  </Label>
                  <Input
                    id="licenceNumber"
                    placeholder="e.g. UK.66.12345, ES.66.1234567, IE.66.1234567"
                    value={licenceNumber}
                    onChange={e => setLicenceNumber(e.target.value)}
                    className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-black mb-1">Licence categories</p>
                <p className="text-[11px] text-gray-400 mb-3">Select your current or target categories. This determines which modules appear in your tracker.</p>
                <div className="flex flex-wrap gap-2">
                  {AML_CATEGORIES.map(cat => {
                    const isSelected = selectedCategories.includes(cat.value)
                    const isImplied = isCategoryImplied(cat.value)
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => !isImplied && toggleCategory(cat.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                          isSelected
                            ? isImplied
                              ? 'bg-gray-700 text-white cursor-default'
                              : 'bg-black text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isImplied ? `Automatically included with ${Object.entries(IMPLIED_CATEGORIES).find(([, v]) => v.includes(cat.value))?.[0]}` : cat.label}
                      >
                        {cat.value}
                      </button>
                    )
                  })}
                </div>
                {selectedCategories.some(c => Object.values(IMPLIED_CATEGORIES).flat().includes(c)) && (
                  <p className="text-[11px] text-gray-400 mt-2">
                    Grey categories are automatically included with your selected B1 category.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Unlicensed context */}
          {hasLicence === 'no' && (
            <p className="text-[11px] text-gray-400 bg-gray-50 rounded-xl p-3">
              No problem. You can still use the digital logbook, continuation training tracker, and all other tools. You can add licence details later from your profile if you obtain one.
            </p>
          )}

          <div className="h-px bg-gray-100" />

          {/* Organisation section */}
          <div>
            <p className="text-xs font-bold text-black mb-3">Organisation</p>
            <p className="text-[11px] text-gray-400 mb-3">The organisation you currently work for. This appears on your logbook entries and training records.</p>
            <div className="space-y-1.5">
              <Label htmlFor="employer" className="text-xs text-gray-500">
                Organisation <span className="text-gray-300">optional</span>
              </Label>
              <Input
                id="employer"
                placeholder="e.g. British Airways Engineering"
                value={employer}
                onChange={e => setEmployer(e.target.value)}
                className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
              />
            </div>
          </div>

          {/* Approval Type */}
          <div className="space-y-1.5">
            <Label htmlFor="approvalType" className="text-xs font-bold text-black">
              Approval type <span className="text-gray-300 font-normal">optional</span>
            </Label>
            <p className="text-[11px] text-gray-400 mb-2">The type of approval held by your organisation.</p>
            <select
              id="approvalType"
              value={approvalType}
              onChange={e => setApprovalType(e.target.value)}
              className="w-full h-12 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-black focus:ring-black focus:outline-none"
            >
              <option value="">Select approval type</option>
              {APPROVAL_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Approval Number */}
          <div className="space-y-1.5">
            <Label htmlFor="approvalNumber" className="text-xs font-bold text-black">
              Approval number <span className="text-gray-300 font-normal">optional</span>
            </Label>
            <Input
              id="approvalNumber"
              placeholder="e.g. UK.145.0000"
              value={approvalNumber}
              onChange={e => setApprovalNumber(e.target.value)}
              className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 bg-black text-white hover:bg-gray-800 font-bold rounded-xl"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Continue'}
          </Button>

          <p className="text-[11px] text-gray-300 text-center leading-relaxed">
            You can update these details at any time from your profile settings. Your data is processed in accordance with our Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  )
}
