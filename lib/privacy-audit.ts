import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/**
 * Privacy audit log — record GDPR-relevant events.
 *
 * Use this for any action that:
 * - Grants or revokes consent
 * - Changes a privacy setting (visibility, public profile, etc.)
 * - Exports or deletes user data
 * - Modifies follower/blocking relationships (Phase 2+)
 * - Touches anything a regulator might ask about later
 *
 * The function never throws — audit logging failure must not break the
 * user-facing action. Failures are logged to console for monitoring.
 *
 * Metadata must NEVER contain PII beyond what is necessary to describe
 * the event. Use IDs and short codes, not free text or names.
 */

export type PrivacyEventCategory =
  | 'consent'         // Cookie consent, social opt-in, etc.
  | 'profile'         // Profile visibility, handle changes
  | 'social'          // Follow/unfollow, block, post visibility
  | 'data_export'     // SAR / data download requests
  | 'data_deletion'   // Account or content deletion
  | 'authentication'  // Login, logout, password reset

export interface LogPrivacyEventParams {
  /** Short, structured event identifier, e.g. 'cookies_accepted' */
  eventType: string
  /** High-level category for filtering and reporting */
  eventCategory: PrivacyEventCategory
  /** Event-specific structured data. NO PII. Max 4KB serialised. */
  metadata?: Record<string, unknown>
}

/**
 * Record a privacy-sensitive event to the audit log.
 *
 * The current authenticated user is determined server-side via the Supabase
 * session cookie. The IP address and user agent are read from the request
 * headers automatically.
 *
 * Returns the new audit row id on success, or null on failure (which is
 * logged but not thrown).
 */
export async function logPrivacyEvent(params: LogPrivacyEventParams): Promise<string | null> {
  try {
    const h = await headers()
    const ipAddress = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null
    const userAgent = h.get('user-agent') ?? null

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('log_privacy_event', {
      p_event_type: params.eventType,
      p_event_category: params.eventCategory,
      p_metadata: params.metadata ?? {},
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
    })

    if (error) {
      console.error('[privacy-audit] Failed to log event:', params.eventType, error.message)
      return null
    }

    return data as string
  } catch (err) {
    console.error('[privacy-audit] Unexpected error logging event:', params.eventType, err)
    return null
  }
}
