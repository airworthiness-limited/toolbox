'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUpdatePassword() {
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/profile')
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Set new password</h1>
          <p className="text-sm text-gray-500 mt-2">Enter your new password below.</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleUpdatePassword() }} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs text-gray-500">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-xs text-gray-500">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 bg-[#123456] text-white hover:bg-[#0e2a45] font-semibold rounded-xl"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
