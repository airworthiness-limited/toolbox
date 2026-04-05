'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SignUpForm() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState<'idle' | 'link_sent'>('idle')
  const [resendCountdown, setResendCountdown] = useState(0)

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  async function handleSendMagicLink() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/complete-profile`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      setState('link_sent')
      setResendCountdown(60)
    }
    setLoading(false)
  }

  if (state === 'link_sent') {
    return (
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          If you do not see it, check your junk or spam folder.
        </p>
        <div className="mt-6 space-y-3">
          {resendCountdown > 0 ? (
            <p className="text-sm text-muted-foreground">Resend available in {resendCountdown}s</p>
          ) : (
            <button
              onClick={handleSendMagicLink}
              disabled={loading}
              className="text-sm font-semibold text-foreground hover:underline"
            >
              {loading ? 'Sending...' : 'Resend magic link'}
            </button>
          )}
          <div>
            <button onClick={() => { setState('idle'); setError('') }} className="text-sm text-muted-foreground hover:underline">
              Try a different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handleSendMagicLink() }} className="space-y-4">
      <Input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        className="h-14 text-base rounded-xl px-5"
      />
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <Button
        type="submit"
        className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/80 text-base font-semibold rounded-xl"
        disabled={loading || !email.trim()}
      >
        {loading ? 'Sending...' : 'Log In or Sign Up'}
      </Button>
    </form>
  )
}
