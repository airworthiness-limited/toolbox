import Link from 'next/link'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'

interface Props {
  searchParams: Promise<{ session_id?: string }>
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams

  if (!session_id) {
    redirect('/courses')
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabaseAdmin = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const session = await stripe.checkout.sessions.retrieve(session_id)

  if (session.payment_status !== 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border p-12 text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment not confirmed
          </h1>
          <p className="text-gray-500 mb-8">
            We couldn&apos;t confirm this payment yet.
          </p>
          <Link href="/courses">
            <Button className="w-full">Back to courses</Button>
          </Link>
        </div>
      </div>
    )
  }

  const metadataUserId = session.metadata?.user_id

  if (!metadataUserId || metadataUserId !== user.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border p-12 text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment user mismatch
          </h1>
          <p className="text-gray-500 mb-8">
            This payment session does not belong to the current user.
          </p>
          <Link href="/courses">
            <Button className="w-full">Back to courses</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { error } = await supabaseAdmin.from('purchases').upsert({
    user_id: user.id,
    stripe_session_id: session.id,
  })

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border p-12 text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment received, but unlock failed
          </h1>
          <p className="text-gray-500 mb-8">{error.message}</p>
          <Link href="/courses">
            <Button className="w-full">Back to courses</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border p-12 text-center max-w-md">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You&apos;re now a premium member!
        </h1>
        <p className="text-gray-500 mb-8">
          All premium courses are now unlocked. Start learning.
        </p>
        <Link href="/courses">
          <Button className="w-full">Browse premium courses →</Button>
        </Link>
      </div>
    </div>
  )
}