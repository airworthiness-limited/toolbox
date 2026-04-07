import Link from 'next/link'

interface FeedPost {
  id: string
  author_id: string
  post_type: string
  data: Record<string, unknown>
  created_at: string
  author_handle: string
  author_display_name: string
  author_avatar_path: string | null
}

interface Props {
  post: FeedPost
  avatarUrl: string | null
  photoUrls?: string[]
  isOwn: boolean
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function renderBody(post: FeedPost, photoUrls: string[]): React.ReactNode {
  const d = post.data as Record<string, unknown>
  switch (post.post_type) {
    case 'module_pass': {
      const mcq = d.mcq_score as number | null
      const essay = d.essay_score as number | null
      return (
        <div>
          <p className="text-sm font-medium text-foreground">
            Passed Module {d.module_id as string} ({d.category as string})
          </p>
          {(mcq !== null || essay !== null) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {mcq !== null && <>MCQ {mcq}%</>}
              {mcq !== null && essay !== null && ' · '}
              {essay !== null && <>Essay {essay}%</>}
            </p>
          )}
        </div>
      )
    }
    case 'type_rating_added':
      return (
        <div>
          <p className="text-sm font-medium text-foreground">New type rating</p>
          <p className="text-xs text-muted-foreground mt-0.5">{d.rating as string}</p>
        </div>
      )
    case 'training_completed':
      return (
        <div>
          <p className="text-sm font-medium text-foreground">Continuation training completed</p>
          <p className="text-xs text-muted-foreground mt-0.5">{d.training_slug as string}</p>
        </div>
      )
    case 'task_share': {
      const aircraftType = d.aircraft_type as string | null
      const taskTypes = (d.task_types as string[]) ?? []
      const ataChapters = (d.ata_chapters as string[]) ?? []
      const note = d.note as string | null
      return (
        <div className="space-y-2">
          {aircraftType && (
            <p className="text-sm font-medium text-foreground">{aircraftType}</p>
          )}
          {(taskTypes.length > 0 || ataChapters.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {taskTypes.map(t => (
                <span key={`tt-${t}`} className="inline-flex items-center text-[11px] bg-muted text-foreground rounded-md px-2 py-0.5">
                  {t}
                </span>
              ))}
              {ataChapters.map(c => (
                <span key={`ata-${c}`} className="inline-flex items-center text-[11px] bg-muted text-foreground rounded-md px-2 py-0.5">
                  ATA {c}
                </span>
              ))}
            </div>
          )}
          {note && (
            <p className="text-sm text-foreground whitespace-pre-wrap">{note}</p>
          )}
          {photoUrls.length > 0 && (
            <div className={`grid gap-1.5 mt-2 ${
              photoUrls.length === 1 ? 'grid-cols-1'
              : photoUrls.length === 2 ? 'grid-cols-2'
              : 'grid-cols-2'
            }`}>
              {photoUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-full aspect-square object-cover rounded-lg border border-border/60"
                />
              ))}
            </div>
          )}
        </div>
      )
    }
    default:
      return <p className="text-sm text-muted-foreground">{post.post_type}</p>
  }
}

export function PostCard({ post, avatarUrl, photoUrls = [], isOwn }: Props) {
  return (
    <article className="rounded-xl border border-border p-5">
      <header className="flex items-center gap-3 mb-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-border/60" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted border border-border/60 flex items-center justify-center text-xs font-semibold text-muted-foreground">
            {post.author_display_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/u/${post.author_handle}`} className="text-sm font-medium text-foreground hover:underline">
            {post.author_display_name}
          </Link>
          <p className="text-xs text-muted-foreground">@{post.author_handle} · {relativeTime(post.created_at)}</p>
        </div>
        {isOwn && (
          <form action={`/api/posts/${post.id}`} method="DELETE" className="hidden" />
        )}
      </header>
      {renderBody(post, photoUrls)}
    </article>
  )
}
