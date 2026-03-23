import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  console.log('Creating checkout for user:', user.id)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: process.env.STRIPE_PREMIUM_PRICE_ID!,
        quantity: 1,
      },
    ],

    // 🔥 THIS IS THE IMPORTANT PART
    metadata: {
      user_id: user.id,
    },

    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/courses`,
  })

  console.log('Stripe session created:', session.id)

  return NextResponse.json({ url: session.url })
}