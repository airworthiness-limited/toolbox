'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState(searchParams.get('email') || '')
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

  function handleTryDifferentEmail() {
    setState('idle')
    setError('')
    setResendCountdown(0)
  }

  // Sent state — magic link
  if (state === 'link_sent') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
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
              <button onClick={handleTryDifferentEmail} className="text-sm text-muted-foreground hover:underline">
                Try a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default — idle state
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Sign in to Airworthiness</h1>
          <p className="text-sm text-muted-foreground mt-2">
            The digital platform for aviation engineering.
          </p>
        </div>

        {/* Email OTP */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder=""
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="button"
            onClick={handleSendMagicLink}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold rounded-xl"
            disabled={loading || !email}
          >
            {loading ? 'Sending...' : 'Log In or Sign Up'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/60 text-center mt-6 leading-relaxed">
          By continuing you agree to our{' '}
          <Link href="/terms" className="hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}
