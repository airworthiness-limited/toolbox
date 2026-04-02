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
  const [state, setState] = useState<'idle' | 'link_sent' | 'code_sent'>('idle')
  const [code, setCode] = useState('')
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

  async function handleSendCode() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) {
      setError(error.message)
    } else {
      setState('code_sent')
      setResendCountdown(60)
    }
    setLoading(false)
  }

  async function handleVerifyCode() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })
    if (error) {
      setError(error.message)
    } else {
      router.push('/complete-profile')
    }
    setLoading(false)
  }

  function handleTryDifferentEmail() {
    setState('idle')
    setCode('')
    setError('')
    setResendCountdown(0)
  }

  // Sent state — magic link
  if (state === 'link_sent') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Check your email</h2>
          <p className="text-sm text-gray-500">
            We sent a sign-in link to <span className="font-medium text-gray-700">{email}</span>.
          </p>
          <div className="mt-6 space-y-3">
            {resendCountdown > 0 ? (
              <p className="text-sm text-gray-400">Resend available in {resendCountdown}s</p>
            ) : (
              <button
                onClick={handleSendMagicLink}
                disabled={loading}
                className="text-sm font-bold text-black hover:underline"
              >
                {loading ? 'Sending...' : 'Resend magic link'}
              </button>
            )}
            <div>
              <button onClick={handleTryDifferentEmail} className="text-sm text-gray-400 hover:underline">
                Try a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sent state — 6-digit code
  if (state === 'code_sent') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-black mb-2">Enter your code</h2>
            <p className="text-sm text-gray-500">
              We sent a verification code to <span className="font-medium text-gray-700">{email}</span>.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleVerifyCode() }} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-bold text-black">Verification code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                placeholder="00000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="h-12 rounded-xl text-center text-lg tracking-widest border-gray-300 focus:border-black focus:ring-black"
                autoFocus
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-black text-white hover:bg-gray-800 font-bold rounded-xl"
              disabled={loading || code.length < 6}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            {resendCountdown > 0 ? (
              <p className="text-sm text-gray-400">Resend available in {resendCountdown}s</p>
            ) : (
              <button
                onClick={handleSendCode}
                disabled={loading}
                className="text-sm font-bold text-black hover:underline"
              >
                {loading ? 'Sending...' : 'Resend code'}
              </button>
            )}
            <div>
              <button onClick={handleTryDifferentEmail} className="text-sm text-gray-400 hover:underline">
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
          <h1 className="text-2xl font-bold text-black tracking-tight">Sign in to Airworthiness</h1>
          <p className="text-sm text-gray-500 mt-2">
            The digital platform for aviation engineering professionals.
          </p>
        </div>

        {/* Email OTP */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-black">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="button"
            onClick={handleSendMagicLink}
            className="w-full h-12 bg-black text-white hover:bg-gray-800 font-bold rounded-xl"
            disabled={loading || !email}
          >
            {loading ? 'Sending...' : 'Send magic link'}
          </Button>

          <button
            type="button"
            onClick={handleSendCode}
            disabled={loading || !email}
            className="w-full h-12 rounded-xl border border-black text-black font-bold hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Send code instead
          </button>
        </div>

        <p className="text-[11px] text-gray-300 text-center mt-6 leading-relaxed">
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
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}
