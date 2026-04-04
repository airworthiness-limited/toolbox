import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompleteProfileForm } from '@/app/(public)/complete-profile/complete-profile-form'
import type { ProfileFormInitialData } from '@/app/(public)/complete-profile/complete-profile-form'

export const metadata: Metadata = { title: 'Manage Profile | Airworthiness' }

function parseFullName(fullName: string | null): { firstName: string; middleNames: string; lastName: string } {
  if (!fullName) return { firstName: '', middleNames: '', lastName: '' }
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], middleNames: '', lastName: '' }
  if (parts.length === 2) return { firstName: parts[0], middleNames: '', lastName: parts[1] }
  return {
    firstName: parts[0],
    middleNames: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  }
}

export default async function ManageProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, date_of_birth, aml_licence_number, aml_categories, type_ratings, aml_photo_path, industry')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: employmentPeriods } = await supabase
    .from('employment_periods')
    .select('employer, start_date, end_date')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false })

  const { firstName, middleNames, lastName } = parseFullName(profile.full_name)

  // Reconstruct licence entries from flat profile data
  const licenceNumbers = profile.aml_licence_number
    ? profile.aml_licence_number.split(', ').filter(Boolean)
    : []
  const categories = profile.aml_categories ?? []
  const typeRatings = Array.isArray(profile.type_ratings) ? profile.type_ratings : []

  // Normalise type ratings (stored as JSON strings in text[] column)
  const normalised = typeRatings.map((item: any) => {
    if (typeof item === 'string') {
      try {
        const parsed = JSON.parse(item)
        return { rating: parsed.rating ?? '', b1Date: parsed.b1Date ?? null, b2Date: parsed.b2Date ?? null, b3Date: parsed.b3Date ?? null, cDate: parsed.cDate ?? null }
      } catch {
        return { rating: item, b1Date: null, b2Date: null, b3Date: null, cDate: null }
      }
    }
    return item
  })

  const hasLicence = licenceNumbers.length > 0 || categories.length > 0

  const licences = licenceNumbers.length > 0
    ? licenceNumbers.map((num: string, i: number) => ({
        number: num,
        categories: i === 0 ? categories : [],
        endorsements: i === 0
          ? [...normalised, { rating: '', b1Date: null, b2Date: null, b3Date: null, cDate: null }]
          : [{ rating: '', b1Date: null, b2Date: null, b3Date: null, cDate: null }],
        showTypeRatings: i === 0 && normalised.length > 0,
        typeSearch: '',
        activeSearchRow: null,
      }))
    : [{ number: '', categories: [], endorsements: [{ rating: '', b1Date: null, b2Date: null, b3Date: null, cDate: null }], showTypeRatings: false, typeSearch: '', activeSearchRow: null }]

  const employers = (employmentPeriods && employmentPeriods.length > 0)
    ? employmentPeriods.map(e => ({
        name: e.employer ?? '',
        startDate: e.start_date ?? '',
        endDate: e.end_date ?? '',
        approvals: [{ type: '', reference: '', certifyingStaff: false, arcSignatory: false, instructor: false }],
      }))
    : [{ name: '', startDate: '', endDate: '', approvals: [{ type: '', reference: '', certifyingStaff: false, arcSignatory: false, instructor: false }] }]

  const initialData: ProfileFormInitialData = {
    firstName,
    middleNames,
    lastName,
    dateOfBirth: profile.date_of_birth ?? '',
    hasLicence: hasLicence ? 'yes' : '',
    licences,
    employers,
    licenceFrontPath: profile.aml_photo_path ?? null,
    licenceBackPath: null,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Manage Profile
        </h1>
      </div>
      <div className="max-w-md">
        <CompleteProfileForm mode="edit" initialData={initialData} />

        <div className="mt-10 pt-6 border-t border-red-100">
          <h2 className="text-base font-semibold text-red-600 mb-1">Delete Account</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  )
}

import { DeleteAccountButton } from '@/app/(app)/dashboard/delete-account-button'
