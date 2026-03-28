'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface BtcToggleProps {
  initialValue: boolean
  selectedCategory: string
  userId: string
}

export function BtcToggle({ initialValue, selectedCategory, userId }: BtcToggleProps) {
  const router = useRouter()
  const [checked, setChecked] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  async function handleToggle(value: boolean) {
    setChecked(value)
    setSaving(true)

    const supabase = createClient()

    // Upsert a marker row for this category with the BTC flag
    // We use module_id '_btc' as a sentinel row for the category-level BTC setting
    await supabase
      .from('module_exam_progress')
      .upsert(
        {
          user_id: userId,
          target_category: selectedCategory,
          module_id: '_btc',
          is_btc: value,
        },
        { onConflict: 'user_id,target_category,module_id' }
      )

    setSaving(false)
    router.refresh()
  }

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => handleToggle(e.target.checked)}
        disabled={saving}
        className="h-5 w-5 rounded border-gray-300"
      />
      <div>
        <span className="text-sm font-medium text-gray-900">
          Basic Training Course
        </span>
        <p className="text-xs text-gray-400">
          I have completed a Part 147 Basic Training Course to reduce the practical experience required in my logbook.
        </p>
      </div>
    </label>
  )
}
