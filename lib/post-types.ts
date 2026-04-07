/**
 * Phase 3 milestone post types and their data shapes.
 *
 * Each post type has:
 * - a unique key stored in posts.post_type
 * - a Zod-style validator (manual; we don't depend on zod)
 * - a renderer that takes the data payload and returns an object
 *   describing how to display the post card
 *
 * Adding a new post type means adding it here AND adding a render case
 * in components/post-card.tsx.
 */

export type PostType =
  | 'module_pass'
  | 'type_rating_added'
  | 'training_completed'
  | 'task_share'

export const MAX_TASK_NOTE_LENGTH = 140
export const MAX_TASK_PHOTOS = 4

export interface PostTypeDescriptor {
  key: PostType
  label: string
  validate: (data: unknown) => { ok: true; data: Record<string, unknown> } | { ok: false; error: string }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const isOptionalNumber = (v: unknown): boolean => v === undefined || v === null || (typeof v === 'number' && v >= 0 && v <= 100)

export const POST_TYPES: Record<PostType, PostTypeDescriptor> = {
  module_pass: {
    key: 'module_pass',
    label: 'Module pass',
    validate: (data) => {
      if (!isObject(data)) return { ok: false, error: 'data must be an object' }
      if (!isString(data.module_id)) return { ok: false, error: 'module_id is required' }
      if (!isString(data.category)) return { ok: false, error: 'category is required' }
      if (!isOptionalNumber(data.mcq_score)) return { ok: false, error: 'mcq_score must be 0-100' }
      if (!isOptionalNumber(data.essay_score)) return { ok: false, error: 'essay_score must be 0-100' }
      return {
        ok: true,
        data: {
          module_id: data.module_id,
          category: data.category,
          mcq_score: data.mcq_score ?? null,
          essay_score: data.essay_score ?? null,
        },
      }
    },
  },
  type_rating_added: {
    key: 'type_rating_added',
    label: 'Type rating',
    validate: (data) => {
      if (!isObject(data)) return { ok: false, error: 'data must be an object' }
      if (!isString(data.rating)) return { ok: false, error: 'rating is required' }
      return { ok: true, data: { rating: data.rating } }
    },
  },
  training_completed: {
    key: 'training_completed',
    label: 'Training completed',
    validate: (data) => {
      if (!isObject(data)) return { ok: false, error: 'data must be an object' }
      if (!isString(data.training_slug)) return { ok: false, error: 'training_slug is required' }
      if (data.completion_date !== undefined && data.completion_date !== null && !isString(data.completion_date)) {
        return { ok: false, error: 'completion_date must be a string' }
      }
      return {
        ok: true,
        data: {
          training_slug: data.training_slug,
          completion_date: data.completion_date ?? null,
        },
      }
    },
  },
  task_share: {
    key: 'task_share',
    label: 'Task share',
    validate: (data) => {
      if (!isObject(data)) return { ok: false, error: 'data must be an object' }
      // Required: at least one of aircraft_type or task_types
      if (!isString(data.aircraft_type) && !Array.isArray(data.task_types)) {
        return { ok: false, error: 'aircraft_type or task_types required' }
      }

      // Optional fields
      const aircraft_type = isString(data.aircraft_type) ? data.aircraft_type : null
      const aircraft_category = isString(data.aircraft_category) ? data.aircraft_category : null
      const task_types = Array.isArray(data.task_types)
        ? data.task_types.filter(isString).slice(0, 20)
        : []
      const ata_chapters = Array.isArray(data.ata_chapters)
        ? data.ata_chapters.filter(isString).slice(0, 20)
        : []
      const task_date = isString(data.task_date) ? data.task_date : null

      // Note (140 char max)
      let note: string | null = null
      if (data.note !== undefined && data.note !== null) {
        if (!isString(data.note)) {
          return { ok: false, error: 'note must be a string' }
        }
        if (data.note.length > MAX_TASK_NOTE_LENGTH) {
          return { ok: false, error: `note must be ${MAX_TASK_NOTE_LENGTH} chars or fewer` }
        }
        note = data.note
      }

      // Photos (max MAX_TASK_PHOTOS, each must be a string path)
      let photos: string[] = []
      if (data.photos !== undefined && data.photos !== null) {
        if (!Array.isArray(data.photos)) {
          return { ok: false, error: 'photos must be an array' }
        }
        if (data.photos.length > MAX_TASK_PHOTOS) {
          return { ok: false, error: `Maximum ${MAX_TASK_PHOTOS} photos per post` }
        }
        if (!data.photos.every(isString)) {
          return { ok: false, error: 'each photo must be a path string' }
        }
        photos = data.photos as string[]
      }

      return {
        ok: true,
        data: {
          aircraft_type,
          aircraft_category,
          task_types,
          ata_chapters,
          task_date,
          note,
          photos,
        },
      }
    },
  },
}

export function isValidPostType(type: string): type is PostType {
  return type in POST_TYPES
}
