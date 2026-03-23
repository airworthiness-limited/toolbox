export interface Profile {
  id: string
  full_name: string | null
  role: string
  bio: string | null
  aml_licence_number: string | null
  aml_categories: string[]
  type_ratings: string[]
  is_public: boolean
  competency_completed_at: string | null
  created_at: string | null
}

export interface TrainingStatus {
  slug: string
  label: string
  certificateDate: string | null
  isCurrent: boolean
}

export interface RecencyStatus {
  totalHours: number
  requiredHours: number
  isCurrent: boolean
  periodStart: string
  periodEnd: string
}
