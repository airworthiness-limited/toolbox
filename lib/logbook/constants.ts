// AML (Aircraft Maintenance Licence) categories per Part 66
export const AML_CATEGORIES = [
  { value: 'A1', label: 'A1 -Aeroplanes Turbine' },
  { value: 'A2', label: 'A2 -Aeroplanes Piston' },
  { value: 'A3', label: 'A3 -Helicopters Turbine' },
  { value: 'A4', label: 'A4 -Helicopters Piston' },
  { value: 'B1.1', label: 'B1.1 -Aeroplanes Turbine' },
  { value: 'B1.2', label: 'B1.2 -Aeroplanes Piston' },
  { value: 'B1.3', label: 'B1.3 -Helicopters Turbine' },
  { value: 'B1.4', label: 'B1.4 -Helicopters Piston' },
  { value: 'B2', label: 'B2 -Avionics' },
  { value: 'B3', label: 'B3 -Light aircraft (non-pressurised ≤2000 kg)' },
  { value: 'C', label: 'C -Base Maintenance' },
] as const

export type AmlCategory = (typeof AML_CATEGORIES)[number]['value']

// Aircraft categories -determines which AML categories can verify
export const AIRCRAFT_CATEGORIES = [
  { value: 'aeroplane_turbine', label: 'Aeroplane \u2013 Turbine' },
  { value: 'aeroplane_piston', label: 'Aeroplane \u2013 Piston' },
  { value: 'helicopter_turbine', label: 'Helicopter \u2013 Turbine' },
  { value: 'helicopter_piston', label: 'Helicopter \u2013 Piston' },
] as const

export type AircraftCategory = (typeof AIRCRAFT_CATEGORIES)[number]['value']

// Which AML categories can verify work on which aircraft categories
export const VERIFICATION_AUTHORITY: Record<AircraftCategory, AmlCategory[]> = {
  aeroplane_turbine: ['A1', 'B1.1', 'C'],
  aeroplane_piston: ['A2', 'B1.2', 'B3'],
  helicopter_turbine: ['A3', 'B1.3'],
  helicopter_piston: ['A4', 'B1.4'],
}

// Recency thresholds per CAP 741
export const RECENCY_PERIOD_YEARS = 2
export const RECENCY_TASK_THRESHOLD = 180
export const RECENCY_DAY_THRESHOLD = 100

// Scope of work descriptions per licence category group
export const SCOPE_OF_WORK: Record<string, string> = {
  'B1/B3': 'Maintenance on structure, powerplant, mechanical and electrical systems; simple avionics tests not requiring troubleshooting.',
  'B2': 'Avionics and electrical systems; electrical and avionics within powerplant and mechanical systems requiring simple tests.',
  'Category A': 'Minor scheduled line maintenance and simple defect rectification.',
}

// Experience validity
export const EXPERIENCE_VALIDITY_YEARS = 10

// Experience requirements per AML category (in years)
export const EXPERIENCE_REQUIREMENTS: Record<string, { years: number; yearsWithBtc: number }> = {
  A1: { years: 3, yearsWithBtc: 1 },
  A2: { years: 3, yearsWithBtc: 1 },
  A3: { years: 3, yearsWithBtc: 1 },
  A4: { years: 3, yearsWithBtc: 1 },
  'B1.1': { years: 5, yearsWithBtc: 2 },
  'B1.2': { years: 3, yearsWithBtc: 1 },
  'B1.3': { years: 5, yearsWithBtc: 2 },
  'B1.4': { years: 3, yearsWithBtc: 1 },
  B2: { years: 5, yearsWithBtc: 2 },
  B3: { years: 3, yearsWithBtc: 1 },
}

// Military/non-civil: minimum civil experience always required
export const MIN_CIVIL_MONTHS = 12

// Map AML categories to the aircraft_category values they count toward
export const CATEGORY_TO_AIRCRAFT: Record<string, AircraftCategory[]> = {
  A1: ['aeroplane_turbine'],
  A2: ['aeroplane_piston'],
  A3: ['helicopter_turbine'],
  A4: ['helicopter_piston'],
  'B1.1': ['aeroplane_turbine'],
  'B1.2': ['aeroplane_piston'],
  'B1.3': ['helicopter_turbine'],
  'B1.4': ['helicopter_piston'],
  B2: ['aeroplane_turbine', 'aeroplane_piston', 'helicopter_turbine', 'helicopter_piston'],
  B3: ['aeroplane_piston'],
}

// B2 can verify avionics/electrical tasks on any aircraft category
export const B2_UNIVERSAL_AUTHORITY = 'B2' as const

// Maintenance types for logbook entries
export const MAINTENANCE_TYPES = [
  { value: 'base_maintenance', label: 'Base Maintenance' },
  { value: 'line_maintenance', label: 'Line Maintenance' },
  { value: 'military_experience', label: 'Military Experience' },
  { value: 'student_experience', label: 'Student Experience' },
] as const

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number]['value']

// Maintenance types that require verification for licence application
export const REQUIRES_VERIFICATION: MaintenanceType[] = ['base_maintenance', 'line_maintenance']

// Maintenance types that don't need aircraft registration/type
export const NO_AIRCRAFT_REQUIRED: MaintenanceType[] = ['military_experience', 'student_experience']

// Legacy maintenance categories (kept for backward compatibility with existing entries)
export const MAINTENANCE_CATEGORIES = [
  { value: 'line_maintenance', label: 'Line Maintenance' },
  { value: 'base_maintenance', label: 'Base Maintenance' },
  { value: 'component_maintenance', label: 'Component Maintenance' },
  { value: 'specialist_maintenance', label: 'Specialist Maintenance' },
] as const

export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number]['value']

// ATA sub-chapter target for representative cross-section
export const ATA_SUB_CHAPTER_TARGET = 10

// Entry statuses
export const ENTRY_STATUSES = {
  draft: { label: 'Draft', color: 'secondary' },
  pending_verification: { label: 'Pending Verification', color: 'outline' },
  verified: { label: 'Verified', color: 'default' },
  rejected: { label: 'Rejected', color: 'destructive' },
  pending_qc: { label: 'Pending QC', color: 'outline' },
  qc_approved: { label: 'QC Approved', color: 'default' },
  qc_rejected: { label: 'QC Rejected', color: 'destructive' },
} as const

export type EntryStatus = keyof typeof ENTRY_STATUSES

// ATA chapters: re-export ATA iSpec 2200 (314 sub-chapters)
export { ATA_2200_CHAPTERS, type Ata2200Chapter } from './ata-2200'

// Backward-compatible alias so existing files can still import ATA_CHAPTERS
import { ATA_2200_CHAPTERS as _ATA_2200 } from './ata-2200'
export const ATA_CHAPTERS = _ATA_2200

// ATA label lookup (handles both 4-digit xx-xx and legacy 2-digit codes)
export function getAtaLabel(code: string): string {
  const match = _ATA_2200.find(c => c.value === code)
  if (match) return match.label
  const main = _ATA_2200.find(c => c.value.startsWith(code + '-'))
  return main ? main.label.split(':')[0] + ` (${code})` : `ATA ${code}`
}

// Check if a verifier's AML categories allow them to verify a given aircraft category
export function canVerify(
  verifierCategories: string[],
  aircraftCategory: AircraftCategory
): boolean {
  const required = VERIFICATION_AUTHORITY[aircraftCategory]
  return verifierCategories.some(
    cat => required.includes(cat as AmlCategory) || cat === B2_UNIVERSAL_AUTHORITY
  )
}

// Validate UK Part 66 licence number format: UK.66.XXXXXXX
export function isValidAmlNumber(licenceNumber: string): boolean {
  return /^UK\.66\.\d{7}$/.test(licenceNumber)
}
