import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const body = await request.json()
  const { training_slug, completion_date, certificate_path } = body

  if (!training_slug || !completion_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const completionDate = new Date(completion_date)
  const expiryDate = new Date(completionDate)
  expiryDate.setFullYear(expiryDate.getFullYear() + 2)

  const { error } = await supabase
    .from('external_training_certificates')
    .upsert({
      user_id: user.id,
      training_slug,
      completion_date,
      expiry_date: expiryDate.toISOString().split('T')[0],
      ...(certificate_path !== undefined && { certificate_path }),
    }, {
      onConflict: 'user_id,training_slug',
    })

  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
