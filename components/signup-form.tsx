'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export function SignUpForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email.trim()) {
      router.push(`/signup?email=${encodeURIComponent(email)}`)
    } else {
      router.push('/signup')
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="h-14 text-base rounded-xl px-5 border-gray-200"
          />
        </div>
        <Button
          type="submit"
          className="w-full h-14 bg-[#123456] text-white hover:bg-[#0e2a45] text-base font-semibold rounded-xl"
        >
          Get started free
        </Button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <Link href="/signup?mode=login" className="block">
        <Button
          variant="outline"
          className="w-full h-14 text-base font-semibold rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          Log in
        </Button>
      </Link>
    </div>
  )
}
