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
  const moduleId = formData.get('module_id') as string | null
  const targetCategory = formData.get('target_category') as string | null

  if (!file || !moduleId || !targetCategory) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, PDF' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const storagePath = `${user.id}/${moduleId}-${targetCategory}-${timestamp}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('module-certificates')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // Upsert the progress record with the file path
  const { error: dbError } = await supabase
    .from('module_exam_progress')
    .upsert(
      {
        user_id: user.id,
        target_category: targetCategory,
        module_id: moduleId,
        certificate_photo_path: storagePath,
        verification_status: 'pending',
      },
      { onConflict: 'user_id,target_category,module_id' }
    )

  if (dbError) {
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }

  return NextResponse.json({ path: storagePath })
}
