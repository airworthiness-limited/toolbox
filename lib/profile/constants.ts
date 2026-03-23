// AML (Aircraft Maintenance Licence) categories per EASA Part 66
export const AML_CATEGORIES = [
  { value: 'A1', label: 'A1 – Aeroplanes Turbine' },
  { value: 'A2', label: 'A2 – Aeroplanes Piston' },
  { value: 'A3', label: 'A3 – Helicopters Turbine' },
  { value: 'A4', label: 'A4 – Helicopters Piston' },
  { value: 'B1.1', label: 'B1.1 – Aeroplanes Turbine' },
  { value: 'B1.2', label: 'B1.2 – Aeroplanes Piston' },
  { value: 'B1.3', label: 'B1.3 – Helicopters Turbine' },
  { value: 'B1.4', label: 'B1.4 – Helicopters Piston' },
  { value: 'B2', label: 'B2 – Avionics' },
  { value: 'B3', label: 'B3 – Light Aircraft' },
  { value: 'C', label: 'C – Base Maintenance' },
] as const

// Common aircraft types in the industry
export const AIRCRAFT_TYPES = [
  'A320 Family',
  'A330',
  'A340',
  'A350',
  'A380',
  'B737 Classic',
  'B737 NG',
  'B737 MAX',
  'B747',
  'B757',
  'B767',
  'B777',
  'B787',
  'ATR 42/72',
  'Bombardier CRJ',
  'Bombardier Dash 8',
  'Embraer E-Jet',
  'Embraer E2',
  'Cessna Citation',
  'Gulfstream',
  'Dassault Falcon',
  'AW139',
  'AW169',
  'H125/AS350',
  'H145/EC145',
  'H175',
  'S-76',
  'S-92',
] as const

// Training courses that need to be current (within 2 years)
export const REQUIRED_TRAINING = [
  { slug: 'human-factors', label: 'Human Factors' },
  { slug: 'ewis', label: 'EWIS (Electrical Wiring Interconnection System)' },
  { slug: 'fuel-tank-safety', label: 'Fuel Tank Safety' },
] as const

// Recency requirement: 6 months (approx 130 working days × 8 hours = 1040 hours)
// in the preceding 2 years
export const RECENCY_REQUIRED_HOURS = 1040
export const RECENCY_PERIOD_YEARS = 2

// Competency assessment questions for public profile listing
export const COMPETENCY_QUESTIONS = [
  {
    id: 'q1',
    question: 'What document must be consulted before carrying out any maintenance task on an aircraft?',
    options: [
      'The aircraft logbook',
      'The approved maintenance data (AMM, SRM, IPC, etc.)',
      'The previous shift handover notes',
      'The airline operations manual',
    ],
    correctIndex: 1,
  },
  {
    id: 'q2',
    question: 'Under EASA Part 145, who is authorised to sign a Certificate of Release to Service (CRS)?',
    options: [
      'Any licensed engineer present on shift',
      'The shift supervisor regardless of licence',
      'An appropriately rated certifying staff member with the correct type rating and authorisation',
      'The quality manager',
    ],
    correctIndex: 2,
  },
  {
    id: 'q3',
    question: 'What is the primary purpose of a duplicate inspection?',
    options: [
      'To speed up the maintenance process',
      'To provide an independent check of a flight-critical task to trap errors',
      'To allow less experienced engineers to complete tasks',
      'To reduce paperwork requirements',
    ],
    correctIndex: 1,
  },
  {
    id: 'q4',
    question: 'When a defect is found during scheduled maintenance that is beyond the scope of the current work order, what is the correct action?',
    options: [
      'Fix it immediately without documentation',
      'Ignore it if it seems minor',
      'Raise a new defect report / non-routine card and follow the organisation\'s procedures',
      'Defer it automatically to the next check',
    ],
    correctIndex: 2,
  },
  {
    id: 'q5',
    question: 'What is the "Dirty Dozen" in the context of Human Factors in aviation maintenance?',
    options: [
      'The 12 most common aircraft defects',
      'The 12 most common human error preconditions identified by Gordon Dupont',
      'The 12 required maintenance checks per year',
      'The 12 categories of aircraft maintenance licence',
    ],
    correctIndex: 1,
  },
  {
    id: 'q6',
    question: 'What does MEL stand for and what is its purpose?',
    options: [
      'Maintenance Engineering Log – records all maintenance actions',
      'Minimum Equipment List – defines what equipment can be inoperative for dispatch',
      'Maximum Exposure Limit – defines chemical handling limits',
      'Mandatory Engineering Letter – a directive from the manufacturer',
    ],
    correctIndex: 1,
  },
  {
    id: 'q7',
    question: 'When torquing a bolt, what must you verify before applying torque?',
    options: [
      'That the bolt looks clean',
      'That you have the correct torque value from approved data, correct calibrated tool, and the thread condition is appropriate',
      'That someone else has already started the job',
      'That the aircraft is powered down',
    ],
    correctIndex: 1,
  },
  {
    id: 'q8',
    question: 'What is the purpose of EWIS (Electrical Wiring Interconnection System) awareness training?',
    options: [
      'To teach engineers how to design new wiring systems',
      'To ensure awareness of wiring degradation risks, proper inspection techniques, and prevention of wiring-related hazards',
      'To certify engineers to work on high-voltage systems only',
      'To replace the need for circuit diagrams',
    ],
    correctIndex: 1,
  },
  {
    id: 'q9',
    question: 'Under EASA regulations, what is the maximum validity period for continuation training such as Human Factors?',
    options: [
      '1 year',
      '2 years',
      '3 years',
      '5 years',
    ],
    correctIndex: 1,
  },
  {
    id: 'q10',
    question: 'What should you do if you realise you have made an error after signing off a task?',
    options: [
      'Do nothing if the aircraft has already departed',
      'Wait until the next scheduled maintenance to correct it',
      'Immediately report it through your organisation\'s error reporting system / occurrence reporting',
      'Ask a colleague to fix it quietly',
    ],
    correctIndex: 2,
  },
] as const

export const COMPETENCY_PASS_SCORE = 80 // percentage
