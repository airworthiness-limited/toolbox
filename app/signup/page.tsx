'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [mode, setMode] = useState<'signup' | 'login'>(
    searchParams.get('mode') === 'login' ? 'login' : 'signup'
  )
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError('')

    if (mode === 'signup') {
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

  return (
    <div className="min-h-screen flex items-center justify-center aw-gradient">
      <Card className="w-full max-w-md bg-white">
        <CardHeader>
          <CardTitle>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</CardTitle>
          <CardDescription>
            {mode === 'signup'
              ? 'Start learning and earning certificates'
              : 'Log in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                placeholder="Jane Smith"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Your password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {mode === 'login' && (
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
                Forgot password?
              </Link>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            className="w-full bg-[#2d3a80] text-white hover:bg-[#232e66]"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? (mode === 'signup' ? 'Creating account...' : 'Logging in...')
              : (mode === 'signup' ? 'Sign up' : 'Log in')}
          </Button>

          <p className="text-sm text-center text-gray-500">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError('') }}
                  className="text-[#2d3a80] hover:underline font-medium"
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError('') }}
                  className="text-[#2d3a80] hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
