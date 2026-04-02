'use client'

import { Suspense } from 'react'
import { useState } from 'react'
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

  const [mode, setMode] = useState<'signup' | 'login'>(
    searchParams.get('mode') === 'login' ? 'login' : 'signup'
  )
  const [firstName, setFirstName] = useState('')
  const [middleNames, setMiddleNames] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError('')

    if (mode === 'signup') {
      if (!firstName.trim() || !lastName.trim()) {
        setError('First name and last name are required.')
        setLoading(false)
        return
      }
      if (email !== confirmEmail) {
        setError('Email addresses do not match.')
        setLoading(false)
        return
      }
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

      const fullName = [firstName.trim(), middleNames.trim(), lastName.trim()].filter(Boolean).join(' ')

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setSuccess(true)
      setLoading(false)
      return
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    }

    router.push('/profile')
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500">
            We have sent a confirmation link to <span className="font-medium text-gray-700">{email}</span>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {mode === 'signup'
              ? 'Free tools for aviation engineering professionals.'
              : 'Sign in to your Airworthiness account.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs text-gray-500">First name</Label>
                  <Input
                    id="firstName"
                    placeholder="James"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs text-gray-500">Last name</Label>
                  <Input
                    id="lastName"
                    placeholder="Smith"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="middleNames" className="text-xs text-gray-500">Middle name(s) <span className="text-gray-300">optional</span></Label>
                <Input
                  id="middleNames"
                  value={middleNames}
                  onChange={e => setMiddleNames(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-gray-500">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <Label htmlFor="confirmEmail" className="text-xs text-gray-500">Confirm email</Label>
              <Input
                id="confirmEmail"
                type="email"
                placeholder="you@example.com"
                value={confirmEmail}
                onChange={e => setConfirmEmail(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs text-gray-500">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Your password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs text-gray-500">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-gray-600">
                Forgot password?
              </Link>
            </div>
          )}

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
            {loading
              ? (mode === 'signup' ? 'Creating account...' : 'Signing in...')
              : (mode === 'signup' ? 'Create account' : 'Sign in')}
          </Button>
        </form>

        {/* Switch mode */}
        <p className="text-sm text-gray-400 text-center mt-6">
          {mode === 'signup' ? (
            <>Already have an account?{' '}
              <button type="button" onClick={() => { setMode('login'); setError('') }} className="text-[#123456] font-medium hover:underline">
                Sign in
              </button>
            </>
          ) : (
            <>No account?{' '}
              <button type="button" onClick={() => { setMode('signup'); setError('') }} className="text-[#123456] font-medium hover:underline">
                Create one
              </button>
            </>
          )}
        </p>

        {mode === 'signup' && (
          <p className="text-[11px] text-gray-300 text-center mt-4 leading-relaxed">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
          </p>
        )}
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
