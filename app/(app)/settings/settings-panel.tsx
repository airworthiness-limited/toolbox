'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sun, Moon, Monitor, Download, Mail, Shield, Globe } from 'lucide-react'
import { DeleteAccountButton } from '@/app/(app)/dashboard/delete-account-button'

interface PublicProfile {
  handle: string
  is_public: boolean
}

interface SettingsPanelProps {
  userEmail: string
  socialProfileEnabled: boolean
  socialFollowEnabled: boolean
  pendingFollowRequests: number
  publicProfile: PublicProfile | null
}

export function SettingsPanel({
  userEmail,
  socialProfileEnabled,
  socialFollowEnabled,
  pendingFollowRequests,
  publicProfile,
}: SettingsPanelProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  // Change email
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)

  // Data export
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)

  // Social profile
  const [profile, setProfile] = useState<PublicProfile | null>(publicProfile)
  const [showOptInModal, setShowOptInModal] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const [socialBusy, setSocialBusy] = useState(false)
  const [socialError, setSocialError] = useState<string | null>(null)

  async function handleOptIn() {
    setSocialError(null)
    setSocialBusy(true)
    const res = await fetch('/api/profile/public/opt-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent: true }),
    })
    setSocialBusy(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setSocialError(body.error ?? 'Failed to enable public profile')
      return
    }
    const data = await res.json()
    setProfile({ handle: data.handle, is_public: true })
    setShowOptInModal(false)
    setConsentChecked(false)
    if (data.isNew) {
      router.push('/settings/profile-handle')
    } else {
      router.refresh()
    }
  }

  async function handleOptOut() {
    if (!window.confirm('Make profile private? Your public profile page will no longer be accessible. You can re-enable this at any time.')) return
    setSocialError(null)
    setSocialBusy(true)
    const res = await fetch('/api/profile/public/opt-out', { method: 'POST' })
    setSocialBusy(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setSocialError(body.error ?? 'Failed to disable public profile')
      return
    }
    setProfile(profile ? { ...profile, is_public: false } : null)
    router.refresh()
  }

  async function handleChangeEmail() {
    setEmailError('')
    setEmailSuccess(false)

    const trimmed = newEmail.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setEmailError('Please enter a valid email address.')
      return
    }
    if (trimmed === userEmail.toLowerCase()) {
      setEmailError('This is already your current email.')
      return
    }

    setEmailLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email: trimmed })

    if (error) {
      setEmailError(error.message)
    } else {
      setEmailSuccess(true)
      setNewEmail('')
    }
    setEmailLoading(false)
  }

  async function handleExportData() {
    setExporting(true)
    setExportDone(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setExporting(false); return }

    const [
      { data: profile },
      { data: logbook },
      { data: progress },
      { data: employment },
      { data: certificates },
      { data: externalTraining },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('logbook_entries').select('*').eq('user_id', user.id),
      supabase.from('module_exam_progress').select('*').eq('user_id', user.id),
      supabase.from('employment_periods').select('*').eq('user_id', user.id),
      supabase.from('certificates').select('*').eq('user_id', user.id),
      supabase.from('external_training_certificates').select('*').eq('user_id', user.id),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      profile,
      logbook_entries: logbook ?? [],
      module_exam_progress: progress ?? [],
      employment_periods: employment ?? [],
      certificates: certificates ?? [],
      external_training_certificates: externalTraining ?? [],
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `airworthiness-data-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    setExporting(false)
    setExportDone(true)
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <div className="max-w-lg space-y-8">

      {/* Account */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
        </div>
        <div className="rounded-xl border border-border p-5">
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="text-sm font-medium text-foreground">{userEmail}</p>
          </div>
        </div>
      </section>

      {/* Change Email */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-foreground">Change Email</h2>
        </div>
        <div className="rounded-xl border border-border p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            A confirmation link will be sent to both your current and new email address. You must confirm both to complete the change.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="new-email" className="text-sm text-muted-foreground">New Email Address</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setEmailError(''); setEmailSuccess(false) }}
              placeholder="new@example.com"
              className="h-11 rounded-xl"
            />
          </div>
          {emailError && <p className="text-sm text-red-600">{emailError}</p>}
          {emailSuccess && (
            <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center">
              <p className="text-sm font-medium text-green-600">
                Confirmation links sent. Check both your current and new email inbox.
              </p>
            </div>
          )}
          <Button
            onClick={handleChangeEmail}
            disabled={emailLoading || !newEmail.trim()}
            size="sm"
          >
            {emailLoading ? 'Sending...' : 'Change Email'}
          </Button>
        </div>
      </section>

      {/* Appearance */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        </div>
        <div className="rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-3">Choose your preferred theme.</p>
          <div className="flex gap-2">
            {themeOptions.map(opt => {
              const Icon = opt.icon
              const active = theme === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    active
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-muted-foreground border-border hover:border-foreground/40'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Social — only shown when the social_profile feature flag is on */}
      {socialProfileEnabled && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-lg font-semibold text-foreground">Social</h2>
          </div>
          <div className="rounded-xl border border-border p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">Public profile</p>
              <p className="text-sm text-muted-foreground mt-1">
                Share your professional credentials with other engineers via a public profile page.
                Disabled by default. You can switch this off at any time.
              </p>
            </div>

            {profile?.is_public ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-muted/40 border border-border/60 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Your profile is public at</p>
                  <Link
                    href={`/u/${profile.handle}`}
                    className="text-sm font-medium text-foreground hover:underline break-all"
                  >
                    airworthiness.org.uk/u/{profile.handle}
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/settings/profile-handle">
                    <Button variant="outline" size="sm">Change handle</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleOptOut} disabled={socialBusy}>
                    Make private
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowOptInModal(true)}
                disabled={socialBusy}
              >
                {profile ? 'Make profile public again' : 'Make profile public'}
              </Button>
            )}

            {socialError && <p className="text-sm text-red-600">{socialError}</p>}

            {socialFollowEnabled && (
              <div className="border-t border-border/60 pt-4">
                <Link href="/settings/follow-requests" className="text-sm font-medium text-foreground hover:underline">
                  Follow requests
                  {pendingFollowRequests > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-foreground text-background text-xs">
                      {pendingFollowRequests}
                    </span>
                  )}
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Privacy & Data */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-foreground">Privacy & Data</h2>
        </div>
        <div className="rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-4">
            Download a copy of all your data, including your profile, logbook entries, module progress, employment history, and certificates.
          </p>
          <Button
            onClick={handleExportData}
            disabled={exporting}
            variant="outline"
            size="sm"
          >
            {exporting ? 'Preparing download...' : exportDone ? 'Downloaded' : 'Download My Data'}
          </Button>
          {exportDone && <p className="text-sm text-green-600 mt-2">Your data has been downloaded.</p>}
        </div>
      </section>

      {/* Delete Account */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-foreground">Delete Account</h2>
        </div>
        <div className="rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <DeleteAccountButton />
        </div>
      </section>

      {/* Public profile opt-in modal */}
      {showOptInModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          onClick={() => { if (!socialBusy) { setShowOptInModal(false); setConsentChecked(false); setSocialError(null) } }}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground">Make your profile public</h3>
            <p className="text-sm text-muted-foreground">
              Your public profile will show your name, type ratings, licence categories, and any
              optional sections you choose to enable. It will be viewable by anyone with the link.
            </p>
            <div className="rounded-lg bg-muted/40 border border-border/60 p-3 text-sm space-y-2">
              <div>
                <span className="font-medium text-foreground">What is shared:</span>
                <span className="text-muted-foreground"> name, type ratings, licence categories, and any optional sections you turn on.</span>
              </div>
              <div>
                <span className="font-medium text-foreground">What is never shared:</span>
                <span className="text-muted-foreground"> licence number, date of birth, employer, logbook entries, exam results, contact details.</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              You can switch your profile back to private at any time. Doing so will immediately make the page return a 404.
            </p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={e => setConsentChecked(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm text-foreground">I understand and consent to my profile being publicly visible.</span>
            </label>
            {socialError && <p className="text-sm text-red-600">{socialError}</p>}
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowOptInModal(false); setConsentChecked(false); setSocialError(null) }}
                disabled={socialBusy}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleOptIn}
                disabled={!consentChecked || socialBusy}
              >
                {socialBusy ? 'Enabling...' : 'Make profile public'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
