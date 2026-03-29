import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const slug = formData.get('slug') as string | null

  if (!file || !slug) {
    return NextResponse.json({ error: 'No file or slug provided' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, PDF' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const storagePath = `${user.id}/${slug}-${timestamp}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('training-certificates')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // Update the external training record with the certificate path
  const { error: dbError } = await supabase
    .from('external_training_certificates')
    .update({ certificate_path: storagePath })
    .eq('user_id', user.id)
    .eq('training_slug', slug)

  if (dbError) {
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }

  return NextResponse.json({ path: storagePath })
}
