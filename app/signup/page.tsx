'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdPlaceholder } from '@/components/ad-placeholder'

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
  const [email, setEmail] = useState('')
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
      <div className="min-h-screen flex items-center justify-center aw-gradient px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-sm text-gray-500">
              We have sent a confirmation link to <span className="font-medium text-gray-700">{email}</span>. Please verify your email to continue.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="aw-gradient">
      {/* Top ad banner */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <AdPlaceholder format="banner" />
      </div>

      <div className="flex min-h-[calc(100vh-200px)]">
        {/* Left sidebar ad */}
        <div className="hidden xl:flex items-center pl-4">
          <AdPlaceholder format="sidebar" />
        </div>

        {/* Left panel - branding */}
        <div className="hidden lg:flex flex-1 flex-col justify-center p-12">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
              Airworthiness
            </h1>
            <p className="text-white/50 text-sm mt-1 tracking-wide">for Everyone</p>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white leading-snug">
                The digital platform for<br />aviation engineering<br />professionals and airworthiness<br />organisations.
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Aircraft Maintenance Licence (Part 66) Module Tracker</p>
                  <p className="text-white/50 text-xs mt-0.5">Track your progress towards completing your subject modules required for a licence category.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Digital Logbook (CAP741)</p>
                  <p className="text-white/50 text-xs mt-0.5">Record your range of tasks towards a licence category, or to demonstrate recent experience.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Verification by Licensed Engineers</p>
                  <p className="text-white/50 text-xs mt-0.5">Licensed Aircraft Engineers will be awarded trusted user privileges to verify an Aircraft Mechanic's tasks on their licence journey.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-white/30 text-xs mt-12">
            Airworthiness Limited. All rights reserved.
          </p>
        </div>

        {/* Right panel - form */}
        <div className="w-full lg:w-auto lg:min-w-[480px] flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8 text-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">Airworthiness</h1>
              <p className="text-white/50 text-xs mt-0.5 tracking-wide">for Everyone</p>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Tab switcher */}
            <div className="flex border-b border-gray-100">
              <button
                type="button"
                onClick={() => { setMode('signup'); setError('') }}
                className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${
                  mode === 'signup'
                    ? 'text-[#2d3a80] border-b-2 border-[#2d3a80]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${
                  mode === 'login'
                    ? 'text-[#2d3a80] border-b-2 border-[#2d3a80]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Sign In
              </button>
            </div>

            <div className="p-8 space-y-5">
              {mode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-xs text-gray-500 uppercase tracking-wider">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="James"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-xs text-gray-500 uppercase tracking-wider">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Smith"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="middleNames" className="text-xs text-gray-500 uppercase tracking-wider">Middle Name(s)</Label>
                    <Input
                      id="middleNames"
                      placeholder="Optional"
                      value={middleNames}
                      onChange={e => setMiddleNames(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-gray-500 uppercase tracking-wider">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmEmail" className="text-xs text-gray-500 uppercase tracking-wider">Confirm Email</Label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={confirmEmail}
                    onChange={e => setConfirmEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-gray-500 uppercase tracking-wider">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Your password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs text-gray-500 uppercase tracking-wider">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="h-11"
                  />
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-[#2d3a80] transition-colors">
                    Forgot password?
                  </Link>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                className="w-full h-11 bg-[#2d3a80] text-white hover:bg-[#232e66] font-semibold text-sm"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? (mode === 'signup' ? 'Creating account...' : 'Signing in...')
                  : (mode === 'signup' ? 'Create Account' : 'Sign In')}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wider">or continue with</span>
                </div>
              </div>

              {/* Social login placeholders */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center h-11 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  title="Sign in with Google (coming soon)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center h-11 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  title="Sign in with Apple (coming soon)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center h-11 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  title="Sign in with Facebook (coming soon)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
              </div>

              {mode === 'signup' && (
                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  By creating an account you agree to our{' '}
                  <Link href="/terms" className="text-[#2d3a80] hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-[#2d3a80] hover:underline">Privacy Policy</Link>.
                </p>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Right sidebar ad */}
        <div className="hidden xl:flex items-center pr-4">
          <AdPlaceholder format="sidebar" />
        </div>
      </div>

      {/* Bottom ad banner */}
      <div className="max-w-6xl mx-auto px-4 pb-4">
        <AdPlaceholder format="banner" />
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center aw-gradient">
        <div className="text-white/50 text-sm">Loading...</div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}
