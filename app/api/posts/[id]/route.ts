import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logPrivacyEvent } from '@/lib/privacy-audit'

/**
 * Delete a post. Only the author can delete their own posts (RLS enforced).
 *
 * For task_share posts, also removes any associated photos from storage.
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, post_type, data')
    .eq('id', id)
    .maybeSingle()

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  if (post.author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Collect photo paths to clean up after the row is deleted
  const photoPaths: string[] = (() => {
    if (post.post_type !== 'task_share') return []
    const data = post.data as { photos?: unknown }
    if (!Array.isArray(data?.photos)) return []
    return data.photos.filter((p): p is string => typeof p === 'string')
  })()

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Best-effort cleanup of associated photos. If this fails the user is
  // still successfully unposted; the orphaned files can be pruned later.
  if (photoPaths.length > 0) {
    await supabase.storage.from('post-photos').remove(photoPaths)
  }

  await logPrivacyEvent({
    eventType: 'post_deleted',
    eventCategory: 'social',
    metadata: { post_id: id, post_type: post.post_type, photo_count: photoPaths.length },
  })

  return NextResponse.json({ success: true })
}
