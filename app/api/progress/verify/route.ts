import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { progressId, status, rejection_reason } = body as {
    progressId: string
    status: 'verified' | 'rejected'
    rejection_reason?: string
  }

  if (!progressId || !['verified', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { error } = await supabase
    .from('module_exam_progress')
    .update({
      verification_status: status,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      rejection_reason: status === 'rejected' ? (rejection_reason || null) : null,
    })
    .eq('id', progressId)

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
