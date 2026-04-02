'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReset() {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reset your password</h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter your email and we will send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">Check your email for a password reset link.</p>
            <Link href="/login">
              <Button variant="outline" className="w-full h-12 rounded-xl font-semibold">Back to login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleReset() }} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-gray-500">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              disabled={loading || !email}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>

            <p className="text-sm text-center text-gray-400">
              Remember your password?{' '}
              <Link href="/signup?mode=login" className="text-[#123456] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
