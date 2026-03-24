export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  return new Response('Webhook route is alive', { status: 200 })
}

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  let body: string

  try {
    body = await request.text()
  } catch {
    return NextResponse.json({ error: 'Could not read body' }, { status: 400 })
  }

  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    // This will now print the REAL reason verification failed
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  console.log('Webhook received:', event.type)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id

    console.log('Payment completed for user:', userId)

    if (userId && session.id) {
      const { error } = await supabaseAdmin
        .from('purchases')
        .upsert({
          user_id: userId,
          stripe_session_id: session.id,
        })

      if (error) {
        console.error('Supabase insert error:', error.message)
      } else {
        console.log('Purchase saved successfully for user:', userId)
      }
    } else {
      console.error('Missing user_id in session metadata:', session.id)
    }
  }

  return NextResponse.json({ received: true })
}