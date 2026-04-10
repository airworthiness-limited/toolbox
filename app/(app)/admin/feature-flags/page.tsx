export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { queryAll } from '@/lib/db'
import { FeatureFlagToggle } from './feature-flag-toggle'

export const metadata: Metadata = { title: 'Feature Flags | Airworthiness Admin' }

export default async function FeatureFlagsPage() {
  const flags = await queryAll<{ key: string; enabled: boolean; description: string | null; updated_at: string; updated_by: string | null }>(
    'SELECT key, enabled, description, updated_at, updated_by FROM feature_flags ORDER BY key'
  )

  const recentAudit = await queryAll<{ id: string; flag_key: string; previous_value: boolean | null; new_value: boolean; changed_at: string; changed_by: string }>(
    'SELECT id, flag_key, previous_value, new_value, changed_at, changed_by FROM feature_flag_audit ORDER BY changed_at DESC LIMIT 20'
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Feature Flags</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kill switches for platform features. Changes take effect within 60 seconds across all servers.
          Every change is recorded in the audit log below.
        </p>
      </div>

      <div className="space-y-3">
        {flags?.map(flag => (
          <FeatureFlagToggle
            key={flag.key}
            flagKey={flag.key}
            initialEnabled={flag.enabled}
            description={flag.description ?? ''}
          />
        ))}
      </div>

      {recentAudit && recentAudit.length > 0 && (
        <div className="mt-12">
          <h2 className="text-base font-semibold text-foreground mb-3">Recent changes</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">Flag</th>
                  <th className="text-left px-4 py-2">Change</th>
                  <th className="text-left px-4 py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {recentAudit.map(entry => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-xs">{entry.flag_key}</td>
                    <td className="px-4 py-2">
                      {entry.previous_value === null
                        ? <span className="text-muted-foreground">created &rarr; {String(entry.new_value)}</span>
                        : <span>{String(entry.previous_value)} &rarr; {String(entry.new_value)}</span>}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      {new Date(entry.changed_at).toLocaleString('en-GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
