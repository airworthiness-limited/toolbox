import type { AircraftCategory, EntryStatus, MaintenanceCategory } from './constants'

export interface LogbookEntry {
  id: string
  user_id: string
  task_date: string
  aircraft_type: string
  aircraft_registration: string
  ata_chapter: string
  description: string
  category: MaintenanceCategory
  aircraft_category: AircraftCategory
  duration_hours: number
  employer: string
  supervised: boolean
  job_number: string | null
  status: EntryStatus
  verifier_id: string | null
  verifier_comments: string | null
  verified_at: string | null
  qc_auditor_id: string | null
  qc_comments: string | null
  qc_reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface LogbookEntryWithRelations extends LogbookEntry {
  profiles?: { full_name: string }
  verifier?: { full_name: string; aml_licence_number: string }
  qc_auditor?: { full_name: string }
}

export interface EmploymentPeriod {
  id: string
  user_id: string
  employer: string
  start_date: string
  end_date: string | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  role: string
  aml_licence_number: string | null
  aml_categories: string[] | null
}
