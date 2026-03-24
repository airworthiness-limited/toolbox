export interface ModuleExamProgress {
  id: string
  user_id: string
  target_category: string
  module_id: string
  issue_date: string | null
  part_147_approval_number: string | null
  certificate_number: string | null
  mcq_score: number | null
  essay_score: number | null
  certificate_photo_path: string | null
  verification_status: 'pending' | 'verified' | 'rejected'
  verified_by: string | null
  verified_at: string | null
  rejection_reason: string | null
  is_btc: boolean
  is_equivalent: boolean
  equivalency_source: string | null
  created_at: string
  updated_at: string
}

export interface ModuleProgressRow {
  moduleId: string
  title: string
  knowledgeLevel: number
  hasEssay: boolean
  progress: ModuleExamProgress | null
  equivalentFrom: {
    sourceModule: string
    sourceCategory: string
    description: string
  } | null
}
