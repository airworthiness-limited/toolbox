import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, aml_licence_number, aml_categories')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Profile</h1>
        <p className="text-gray-500 mb-8">
          If you hold a Part 66 Aircraft Maintenance Licence, enter your details below to verify other engineers&apos; logbook entries.
        </p>

        <ProfileForm
          fullName={profile?.full_name ?? ''}
          amlLicenceNumber={profile?.aml_licence_number ?? ''}
          amlCategories={profile?.aml_categories ?? []}
        />
      </div>
    </div>
  )
}
