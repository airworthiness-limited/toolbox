export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'

interface Props {
  searchParams: Promise<{ session_id?: string }>
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams

  if (!session_id) {
    redirect('/dashboard')
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const session = await auth()
  const user = session?.user

  if (!user) {
    redirect('/')
  }

  const stripeSession = await stripe.checkout.sessions.retrieve(session_id)

  if (stripeSession.payment_status !== 'paid') {
    return (
      <div className="min-h-screen aw-gradient flex items-center justify-center">
        <div className="bg-card rounded-2xl border p-12 text-center max-w-md">
          <div className="flex justify-center mb-4">
            <SidebarTriggerInline />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Payment not confirmed
          </h1>
          <p className="text-muted-foreground mb-8">
            We could not confirm this payment yet. If you have been charged, please contact us and we will resolve it.
          </p>
          <Link href="/dashboard">
            <Button className="w-full">Back to profile</Button>
          </Link>
        </div>
      </div>
    )
  }

  const metadataUserId = stripeSession.metadata?.user_id

  if (!metadataUserId || metadataUserId !== user.id) {
    return (
      <div className="min-h-screen aw-gradient flex items-center justify-center">
        <div className="bg-card rounded-2xl border p-12 text-center max-w-md">
          <div className="flex justify-center mb-4">
            <SidebarTriggerInline />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Payment user mismatch
          </h1>
          <p className="text-muted-foreground mb-8">
            This payment session does not belong to the current user. Please contact us if you believe this is an error.
          </p>
          <Link href="/dashboard">
            <Button className="w-full">Back to profile</Button>
          </Link>
        </div>
      </div>
    )
  }

  try {
    await query(
      'INSERT INTO purchases (user_id, stripe_session_id) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET stripe_session_id = $2',
      [user.id, stripeSession.id]
    )
  } catch (error) {
    return (
      <div className="min-h-screen aw-gradient flex items-center justify-center">
        <div className="bg-card rounded-2xl border p-12 text-center max-w-md">
          <div className="flex justify-center mb-4">
            <SidebarTriggerInline />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Payment received, but activation failed
          </h1>
          <p className="text-muted-foreground mb-8">
            Your payment was successful but we could not activate your ad-free experience. Please contact us and we will resolve this immediately.
          </p>
          <a href="mailto:contact@airworthiness.org.uk">
            <Button className="w-full">Contact us</Button>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen aw-gradient flex items-center justify-center">
      <div className="bg-card rounded-2xl border p-12 text-center max-w-md">
        <div className="flex justify-center mb-4">
          <SidebarTriggerInline />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Adverts removed
        </h1>
        <p className="text-muted-foreground mb-8">
          Thank you for your support. All advertisements have been removed from your account. Enjoy the clean experience.
        </p>
        <Link href="/dashboard">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/80">Go to your profile</Button>
        </Link>
      </div>
    </div>
  )
}
