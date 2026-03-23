'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AML_CATEGORIES, AIRCRAFT_TYPES } from '@/lib/profile/constants'

interface ProfileEditorProps {
  profile: {
    aml_licence_number: string
    aml_categories: string[]
    type_ratings: string[]
    bio: string
  }
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [licenceNumber, setLicenceNumber] = useState(profile.aml_licence_number)
  const [categories, setCategories] = useState<string[]>(profile.aml_categories)
  const [typeRatings, setTypeRatings] = useState<string[]>(profile.type_ratings)
  const [bio, setBio] = useState(profile.bio)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function toggleCategory(value: string) {
    setCategories(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    )
    setSaved(false)
  }

  function toggleType(value: string) {
    setTypeRatings(prev =>
      prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
    )
    setSaved(false)
  }

  async function handleSave() {
    setError('')
    setSaved(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        aml_licence_number: licenceNumber || null,
        aml_categories: categories,
        type_ratings: typeRatings,
        bio: bio || null,
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
      {/* Licence Number */}
      <div>
        <Label htmlFor="licence-number">UK CAA / EASA Licence Number</Label>
        <Input
          id="licence-number"
          value={licenceNumber}
          onChange={e => { setLicenceNumber(e.target.value); setSaved(false) }}
          placeholder="e.g. UK.66.XXXX"
          className="mt-1.5 max-w-xs"
        />
      </div>

      {/* Bio */}
      <div>
        <Label htmlFor="bio">Short Bio</Label>
        <textarea
          id="bio"
          value={bio}
          onChange={e => { setBio(e.target.value); setSaved(false) }}
          placeholder="Brief summary of your experience and specialisations..."
          rows={3}
          className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      {/* AML Categories */}
      <div>
        <Label>Licence Categories Held</Label>
        <p className="text-xs text-gray-400 mt-0.5 mb-2">Select all that apply to your Part 66 licence.</p>
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

      {/* Type Ratings */}
      <div>
        <Label>Aircraft Type Ratings</Label>
        <p className="text-xs text-gray-400 mt-0.5 mb-2">Select the aircraft types you are rated to certify.</p>
        <div className="flex flex-wrap gap-2">
          {AIRCRAFT_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                typeRatings.includes(type)
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
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
