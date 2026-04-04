'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sun, Moon, Monitor, Download, KeyRound, Shield } from 'lucide-react'
import { DeleteAccountButton } from '@/app/(app)/dashboard/delete-account-button'

interface SettingsPanelProps {
  userEmail: string
}

export function SettingsPanel({ userEmail }: SettingsPanelProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Data export
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)

  async function handleChangePassword() {
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    }
    setPasswordLoading(false)
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

      {/* Change Password */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
        </div>
        <div className="rounded-xl border border-border p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-sm text-muted-foreground">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setPasswordError(''); setPasswordSuccess(false) }}
              placeholder="Minimum 8 characters"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-sm text-muted-foreground">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); setPasswordSuccess(false) }}
              placeholder="Re-enter password"
              className="h-11 rounded-xl"
            />
          </div>
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-green-600">Password updated.</p>}
          <Button
            onClick={handleChangePassword}
            disabled={passwordLoading || !newPassword || !confirmPassword}
            size="sm"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
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
          <h2 className="text-lg font-semibold text-red-600">Delete Account</h2>
        </div>
        <div className="rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <DeleteAccountButton />
        </div>
      </section>

    </div>
  )
}
