import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'
import { Search } from 'lucide-react'

export const metadata: Metadata = { title: 'Discover engineers | Airworthiness' }

interface SearchResult {
  user_id: string
  handle: string
  display_name: string
  avatar_path: string | null
}

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  if (!(await isFeatureEnabledForUser('social_profile', user.id))) {
    redirect('/dashboard')
  }

  const { q } = await searchParams
  const query = (q ?? '').trim()

  let results: SearchResult[] = []
  if (query.length >= 2) {
    const { data } = await supabase.rpc('search_profiles', { p_query: query, p_limit: 20 })
    results = (data as SearchResult[]) ?? []
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        <SidebarTriggerInline />
        <h1 className="text-2xl font-semibold text-foreground">Discover engineers</h1>
      </div>

      <div className="max-w-2xl">
        <form action="/discover" method="GET" className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search by name or handle (e.g. alex-king)"
              autoFocus
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
            />
          </div>
        </form>

        {query.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Search for other engineers by their handle or name to find profiles to follow.
          </p>
        )}

        {query.length > 0 && query.length < 2 && (
          <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div className="rounded-xl border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No engineers found matching &ldquo;{query}&rdquo;.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map(r => {
              const avatarUrl = r.avatar_path
                ? supabase.storage.from('public-profile-avatars').getPublicUrl(r.avatar_path).data.publicUrl
                : null
              return (
                <Link
                  key={r.user_id}
                  href={`/u/${r.handle}`}
                  className="rounded-xl border border-border p-4 flex items-center gap-3 hover:border-foreground/40 transition-colors"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-border/60" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted border border-border/60 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      {r.display_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{r.handle}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
