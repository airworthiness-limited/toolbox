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

// B2 can verify avionics/electrical tasks on any aircraft category
export const B2_UNIVERSAL_AUTHORITY = 'B2' as const

// Maintenance categories per CAP 741
export const MAINTENANCE_CATEGORIES = [
  { value: 'line_maintenance', label: 'Line Maintenance' },
  { value: 'base_maintenance', label: 'Base Maintenance' },
  { value: 'component_maintenance', label: 'Component Maintenance' },
  { value: 'specialist_maintenance', label: 'Specialist Maintenance' },
] as const

export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number]['value']

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

// ATA 100 chapters (commonly used in maintenance)
export const ATA_CHAPTERS = [
  { value: '05', label: 'ATA 05 -Time Limits / Maintenance Checks' },
  { value: '06', label: 'ATA 06 -Dimensions & Areas' },
  { value: '07', label: 'ATA 07 -Lifting & Shoring' },
  { value: '08', label: 'ATA 08 -Levelling & Weighing' },
  { value: '09', label: 'ATA 09 -Towing & Taxiing' },
  { value: '10', label: 'ATA 10 -Parking, Mooring, Storage & Return to Service' },
  { value: '11', label: 'ATA 11 -Placards & Markings' },
  { value: '12', label: 'ATA 12 -Servicing' },
  { value: '20', label: 'ATA 20 -Standard Practices – Airframe' },
  { value: '21', label: 'ATA 21 -Air Conditioning & Pressurisation' },
  { value: '22', label: 'ATA 22 -Auto Flight' },
  { value: '23', label: 'ATA 23 -Communications' },
  { value: '24', label: 'ATA 24 -Electrical Power' },
  { value: '25', label: 'ATA 25 -Equipment / Furnishings' },
  { value: '26', label: 'ATA 26 -Fire Protection' },
  { value: '27', label: 'ATA 27 -Flight Controls' },
  { value: '28', label: 'ATA 28 -Fuel' },
  { value: '29', label: 'ATA 29 -Hydraulic Power' },
  { value: '30', label: 'ATA 30 -Ice & Rain Protection' },
  { value: '31', label: 'ATA 31 -Indicating / Recording Systems' },
  { value: '32', label: 'ATA 32 -Landing Gear' },
  { value: '33', label: 'ATA 33 -Lights' },
  { value: '34', label: 'ATA 34 -Navigation' },
  { value: '35', label: 'ATA 35 -Oxygen' },
  { value: '36', label: 'ATA 36 -Pneumatic' },
  { value: '37', label: 'ATA 37 -Vacuum' },
  { value: '38', label: 'ATA 38 -Water / Waste' },
  { value: '45', label: 'ATA 45 -Central Maintenance System' },
  { value: '46', label: 'ATA 46 -Information Systems' },
  { value: '49', label: 'ATA 49 -Airborne Auxiliary Power' },
  { value: '51', label: 'ATA 51 -Standard Practices & Structures' },
  { value: '52', label: 'ATA 52 -Doors' },
  { value: '53', label: 'ATA 53 -Fuselage' },
  { value: '54', label: 'ATA 54 -Nacelles / Pylons' },
  { value: '55', label: 'ATA 55 -Stabilisers' },
  { value: '56', label: 'ATA 56 -Windows' },
  { value: '57', label: 'ATA 57 -Wings' },
  { value: '61', label: 'ATA 61 -Propellers / Propulsors' },
  { value: '62', label: 'ATA 62 -Main Rotor' },
  { value: '63', label: 'ATA 63 -Main Rotor Drive' },
  { value: '64', label: 'ATA 64 -Tail Rotor' },
  { value: '65', label: 'ATA 65 -Tail Rotor Drive' },
  { value: '67', label: 'ATA 67 -Rotors Flight Control' },
  { value: '71', label: 'ATA 71 -Powerplant' },
  { value: '72', label: 'ATA 72 -Engine -Turbine / Turboprop' },
  { value: '73', label: 'ATA 73 -Engine -Fuel & Control' },
  { value: '74', label: 'ATA 74 -Ignition' },
  { value: '75', label: 'ATA 75 -Air' },
  { value: '76', label: 'ATA 76 -Engine Controls' },
  { value: '77', label: 'ATA 77 -Engine Indicating' },
  { value: '78', label: 'ATA 78 -Exhaust' },
  { value: '79', label: 'ATA 79 -Oil' },
  { value: '80', label: 'ATA 80 -Starting' },
  { value: '81', label: 'ATA 81 -Turbines' },
  { value: '82', label: 'ATA 82 -Water Injection' },
  { value: '83', label: 'ATA 83 -Accessory Gearboxes' },
  { value: '85', label: 'ATA 85 -Reciprocating Engine' },
] as const

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
