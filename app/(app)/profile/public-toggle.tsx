'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface PublicToggleProps {
  isPublic: boolean
  canGoPublic: boolean
}

export function PublicToggle({ isPublic, canGoPublic }: PublicToggleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [checked, setChecked] = useState(isPublic)

  async function handleToggle() {
    if (!canGoPublic && !checked) return

    const newValue = !checked
    setChecked(newValue)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({ is_public: newValue })
      .eq('id', user.id)

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900">
          {checked ? 'Your profile is visible to recruiters' : 'Your profile is private'}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">
          {checked
            ? 'Recruiters on the platform can view your qualifications and contact you.'
            : 'Toggle on to appear in recruiter searches.'}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={!canGoPublic && !checked}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
          checked ? 'bg-green-500' : 'bg-gray-200'
        } ${(!canGoPublic && !checked) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
