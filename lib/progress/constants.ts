// Part-66 Appendix I -Basic Knowledge Requirements
// Module definitions, category requirements, knowledge levels, and equivalency rules

export const PART_66_MODULES = [
  { id: '1', title: 'Mathematics', hasEssay: false },
  { id: '2', title: 'Physics', hasEssay: false },
  { id: '3', title: 'Electrical Fundamentals', hasEssay: false },
  { id: '4', title: 'Electronic Fundamentals', hasEssay: false },
  { id: '5', title: 'Digital Techniques / Electronic Instrument Systems', hasEssay: false },
  { id: '6', title: 'Materials and Hardware', hasEssay: false },
  { id: '7A', title: 'Maintenance Practices', hasEssay: true },
  { id: '7B', title: 'Maintenance Practices', hasEssay: true },
  { id: '8', title: 'Basic Aerodynamics', hasEssay: false },
  { id: '9A', title: 'Human Factors', hasEssay: true },
  { id: '9B', title: 'Human Factors', hasEssay: true },
  { id: '10', title: 'Aviation Legislation', hasEssay: true },
  { id: '11A', title: 'Aeroplane Aerodynamics, Structures and Systems', hasEssay: false },
  { id: '11B', title: 'Aeroplane Aerodynamics, Structures and Systems', hasEssay: false },
  { id: '11C', title: 'Aeroplane Aerodynamics, Structures and Systems', hasEssay: false },
  { id: '12', title: 'Helicopter Aerodynamics, Structures and Systems', hasEssay: false },
  { id: '13', title: 'Aircraft Aerodynamics, Structures and Systems', hasEssay: false },
  { id: '14', title: 'Propulsion', hasEssay: false },
  { id: '15', title: 'Gas Turbine Engine', hasEssay: false },
  { id: '16', title: 'Piston Engine', hasEssay: false },
  { id: '17A', title: 'Propeller', hasEssay: false },
  { id: '17B', title: 'Propeller', hasEssay: false },
] as const

export type ModuleId = (typeof PART_66_MODULES)[number]['id']

export const ESSAY_MODULES: readonly string[] = ['7A', '7B', '9A', '9B', '10']

export const PASS_MARK = 75

// Target categories available for progress tracking (excludes C -no modular exams)
export const PROGRESS_CATEGORIES = [
  { value: 'A1', label: 'Turbine Aeroplanes' },
  { value: 'A2', label: 'Piston Aeroplanes' },
  { value: 'A3', label: 'Turbine Helicopters' },
  { value: 'A4', label: 'Piston Helicopters' },
  { value: 'B1.1', label: 'Turbine Aeroplanes' },
  { value: 'B1.2', label: 'Piston Aeroplanes' },
  { value: 'B1.3', label: 'Turbine Helicopters' },
  { value: 'B1.4', label: 'Piston Helicopters' },
  { value: 'B2', label: 'Avionics' },
  { value: 'B3', label: 'Non-Pressurised Piston Aeroplanes' },
] as const

export type ProgressCategory = (typeof PROGRESS_CATEGORIES)[number]['value']

// Required modules per sub-category
// Module 4 is NOT required for any Category A
export const MODULE_REQUIREMENTS: Record<string, string[]> = {
  // Category A -Aeroplanes
  A1: ['1', '2', '3', '5', '6', '7A', '8', '9A', '10', '11A', '15', '17A'],
  A2: ['1', '2', '3', '5', '6', '7A', '8', '9A', '10', '11B', '16', '17A'],
  // Category A -Helicopters
  A3: ['1', '2', '3', '5', '6', '7A', '8', '9A', '10', '12', '15'],
  A4: ['1', '2', '3', '5', '6', '7A', '8', '9A', '10', '12', '16'],
  // Category B1 -Aeroplanes
  'B1.1': ['1', '2', '3', '4', '5', '6', '7A', '8', '9A', '10', '11A', '15', '17A'],
  'B1.2': ['1', '2', '3', '4', '5', '6', '7A', '8', '9A', '10', '11B', '16', '17A'],
  // Category B1 -Helicopters
  'B1.3': ['1', '2', '3', '4', '5', '6', '7A', '8', '9A', '10', '12', '15', '17A'],
  'B1.4': ['1', '2', '3', '4', '5', '6', '7A', '8', '9A', '10', '12', '16', '17A'],
  // Category B2 -Avionics
  B2: ['1', '2', '3', '4', '5', '6', '7B', '8', '9B', '10', '13', '14'],
  // Category B3 -Non-Pressurised Piston Aeroplanes
  B3: ['1', '2', '3', '4', '5', '6', '7A', '8', '9A', '10', '11C', '16', '17B'],
}

// Knowledge levels per module per category group
// A = Category A level, B1 = Category B1 level, B2 = Category B2 level, B3 = Category B3 level
// A dash (0) means not required for that category
// Levels: 1 = basic, 2 = detailed, 3 = in-depth
export const KNOWLEDGE_LEVELS: Record<string, Record<string, number>> = {
  '1':   { A: 1, B1: 2, B2: 2, B3: 2 },
  '2':   { A: 1, B1: 2, B2: 2, B3: 2 },
  '3':   { A: 1, B1: 2, B2: 2, B3: 2 },
  '4':   { A: 0, B1: 2, B2: 2, B3: 2 },
  '5':   { A: 1, B1: 2, B2: 2, B3: 2 },
  '6':   { A: 1, B1: 2, B2: 2, B3: 2 },
  '7A':  { A: 1, B1: 3, B2: 0, B3: 3 },
  '7B':  { A: 0, B1: 0, B2: 3, B3: 0 },
  '8':   { A: 1, B1: 2, B2: 2, B3: 2 },
  '9A':  { A: 1, B1: 2, B2: 0, B3: 2 },
  '9B':  { A: 0, B1: 0, B2: 2, B3: 0 },
  '10':  { A: 1, B1: 3, B2: 3, B3: 3 },
  '11A': { A: 1, B1: 2, B2: 0, B3: 0 },
  '11B': { A: 1, B1: 2, B2: 0, B3: 0 },
  '11C': { A: 0, B1: 0, B2: 0, B3: 2 },
  '12':  { A: 1, B1: 2, B2: 0, B3: 0 },
  '13':  { A: 0, B1: 0, B2: 2, B3: 0 },
  '14':  { A: 0, B1: 0, B2: 2, B3: 0 },
  '15':  { A: 1, B1: 2, B2: 0, B3: 0 },
  '16':  { A: 1, B1: 2, B2: 0, B3: 2 },
  '17A': { A: 1, B1: 2, B2: 0, B3: 0 },
  '17B': { A: 0, B1: 0, B2: 0, B3: 2 },
}

// Helper to get the category group for a sub-category (for knowledge level lookup)
export function getCategoryGroup(category: string): string {
  if (category.startsWith('A')) return 'A'
  if (category.startsWith('B1')) return 'B1'
  if (category === 'B2') return 'B2'
  if (category === 'B3') return 'B3'
  return 'A'
}

// Get knowledge level for a module in a specific category
export function getKnowledgeLevel(moduleId: string, category: string): number {
  const group = getCategoryGroup(category)
  return KNOWLEDGE_LEVELS[moduleId]?.[group] ?? 0
}

// Equivalency rules: if you pass a module at a higher level, it counts for lower-level requirements
// Format: { sourceModule, sourceCategories, targetModule, targetCategories, description }
export const EQUIVALENCY_RULES = [
  // B1 passes count for corresponding A modules (all common modules)
  // B1.1 → A1
  { sourceCategory: 'B1.1', targetCategory: 'A1', description: 'B1.1 modules count toward A1' },
  // B1.2 → A2
  { sourceCategory: 'B1.2', targetCategory: 'A2', description: 'B1.2 modules count toward A2' },
  // B1.3 → A3
  { sourceCategory: 'B1.3', targetCategory: 'A3', description: 'B1.3 modules count toward A3' },
  // B1.4 → A4
  { sourceCategory: 'B1.4', targetCategory: 'A4', description: 'B1.4 modules count toward A4' },
  // B2 common modules count for A categories (modules 1-3, 5-6, 8, 10)
  // B3 common modules count for A2 (similar base modules)
] as const

// Cross-module equivalencies (where a different module satisfies a requirement)
export const CROSS_MODULE_EQUIVALENCIES = [
  // B1 Module 15 (Gas Turbine) at Level 2 satisfies B2 Module 14 (Propulsion) at Level 2
  {
    sourceModule: '15',
    sourceCategories: ['B1.1', 'B1.3'],
    targetModule: '14',
    targetCategories: ['B2'],
    description: 'Module 15: Gas Turbine Engine for B1 is higher or equivalent to Module 14: Propulsion for B2',
  },
  // B1.2 modules satisfy B3 requirements (pressurised covers non-pressurised)
  // Module 11B (Piston Aeroplanes) satisfies 11C (Non-Pressurised Piston Aeroplanes)
  {
    sourceModule: '11B',
    sourceCategories: ['B1.2'],
    targetModule: '11C',
    targetCategories: ['B3'],
    description: 'Module 11B: Aeroplane Aerodynamics, Structures and Systems for B1.2 is higher or equivalent to Module 11C for B3',
  },
  // Module 17A (Propeller) at B1 level satisfies 17B (Propeller) for B3
  {
    sourceModule: '17A',
    sourceCategories: ['B1.1', 'B1.2', 'B1.3', 'B1.4'],
    targetModule: '17B',
    targetCategories: ['B3'],
    description: 'Module 17A: Propeller for B1 is higher or equivalent to Module 17B: Propeller for B3',
  },
] as const

// Check whether passing a module in one category can satisfy the same module in another category
// (higher level satisfies lower level for the SAME module)
export function isSameModuleEquivalent(
  passedCategory: string,
  targetCategory: string,
  moduleId: string
): boolean {
  const passedLevel = getKnowledgeLevel(moduleId, passedCategory)
  const targetLevel = getKnowledgeLevel(moduleId, targetCategory)
  if (passedLevel === 0 || targetLevel === 0) return false
  return passedLevel >= targetLevel
}

// Check whether a cross-module equivalency applies
export function getCrossModuleEquivalency(
  targetModule: string,
  targetCategory: string
): { sourceModule: string; sourceCategories: string[]; description: string } | null {
  for (const rule of CROSS_MODULE_EQUIVALENCIES) {
    if (
      rule.targetModule === targetModule &&
      (rule.targetCategories as readonly string[]).includes(targetCategory)
    ) {
      return {
        sourceModule: rule.sourceModule,
        sourceCategories: [...rule.sourceCategories],
        description: rule.description,
      }
    }
  }
  return null
}

// Verification statuses
export const VERIFICATION_STATUSES = {
  unverified: { label: 'Unverified', color: 'outline' },
  verified: { label: 'Verified', color: 'default' },
} as const

export type VerificationStatus = keyof typeof VERIFICATION_STATUSES

// Module passes are valid for 10 years from issue date
export const PASS_VALIDITY_YEARS = 10

// Experience requirements (years) per category -with and without Basic Training Course
export const EXPERIENCE_REQUIREMENTS: Record<string, { withBtc: number; withoutBtc: number }> = {
  A1: { withBtc: 2, withoutBtc: 3 },
  A2: { withBtc: 2, withoutBtc: 3 },
  A3: { withBtc: 2, withoutBtc: 3 },
  A4: { withBtc: 2, withoutBtc: 3 },
  'B1.1': { withBtc: 3, withoutBtc: 5 },
  'B1.2': { withBtc: 3, withoutBtc: 5 },
  'B1.3': { withBtc: 3, withoutBtc: 5 },
  'B1.4': { withBtc: 3, withoutBtc: 5 },
  B2: { withBtc: 3, withoutBtc: 5 },
  B3: { withBtc: 2, withoutBtc: 3 },
}
