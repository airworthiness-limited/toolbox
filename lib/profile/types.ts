export interface TypeEndorsement {
  rating: string
  b1Date: string | null
  b2Date: string | null
  b3Date: string | null
  cDate: string | null
}

export interface Profile {
  id: string
  full_name: string | null
  role: string
  aml_licence_number: string | null
  aml_categories: string[]
  type_ratings: TypeEndorsement[]
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
  totalDays: number
  requiredDays: number
  isCurrent: boolean
  periodStart: string
  periodEnd: string
}
