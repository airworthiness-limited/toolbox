'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AML_CATEGORIES, isValidAmlNumber } from '@/lib/logbook/constants'

interface Props {
  fullName: string
  amlLicenceNumber: string
  amlCategories: string[]
}

export function ProfileForm({ fullName: initialName, amlLicenceNumber: initialLicence, amlCategories: initialCategories }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState(initialName)
  const [amlLicenceNumber, setAmlLicenceNumber] = useState(initialLicence)
  const [amlCategories, setAmlCategories] = useState<string[]>(initialCategories)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function toggleCategory(value: string) {
    setAmlCategories(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    )
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)

    if (amlLicenceNumber && !isValidAmlNumber(amlLicenceNumber)) {
      setError('Licence number must be in the format UK.66.XXXXXXX (7 digits)')
      setSaving(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        aml_licence_number: amlLicenceNumber || null,
        aml_categories: amlLicenceNumber ? amlCategories : null,
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSaved(true)
    }
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Jane Smith"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aircraft Maintenance Licence</CardTitle>
          <CardDescription>
            Leave blank if you do not hold a Part 66 AML. Only AML holders can verify logbook entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="amlNumber">UK Part 66 Licence Number</Label>
            <Input
              id="amlNumber"
              value={amlLicenceNumber}
              onChange={e => setAmlLicenceNumber(e.target.value)}
              placeholder="UK.66.1234567"
            />
          </div>

          {amlLicenceNumber && (
            <div className="space-y-2">
              <Label>Licence Categories</Label>
              <p className="text-sm text-gray-500">
                Select all categories on your licence.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AML_CATEGORIES.map(cat => (
                  <label
                    key={cat.value}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                      amlCategories.includes(cat.value)
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={amlCategories.includes(cat.value)}
                      onChange={() => toggleCategory(cat.value)}
                      className="accent-blue-600"
                    />
                    {cat.value}
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {saved && <p className="text-sm text-green-600">Profile saved.</p>}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save Profile'}
      </Button>
    </div>
  )
}
