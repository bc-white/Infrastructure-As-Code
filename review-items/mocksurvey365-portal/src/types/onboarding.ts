// Facility Onboarding Types

export interface OnboardingProgress {
  currentStep: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  steps: {
    [key: string]: {
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
      completedAt?: string;
    };
  };
  summary?: {
    totalSteps: number;
    completedSteps: number;
    percentageComplete: number;
  };
}

// ADD_UNITS step
export interface AddUnitData {
  name: string;
  type: string; // ENUM: ICU, ER, Medical, Surgical, etc.
  floor: string;
  rn_hppd: string | number;
  lpn_hppd: string | number;
  cna_hppd: string | number;
  target_HPPD: number;
  cms_minimum_HPPD: number;
}

// ADD_ROOMS_AND_BEDS step
export interface AddRoomsAndBedsData {
  unit_id: string;
  start_number: string;
  end_number: string;
  beds_per_room: number;
  bed_naming: 'LETTERS' | 'NUMBERS';
  room_type: 'PRIVATE' | 'SEMI_PRIVATE' | 'WARD';
  room_prefix?: string;
  defaults: {
    capabilities: string[];
    equipment: Array<{
      name: string;
      type: string;
      isAvailable?: boolean;
    }>;
  };
}

// ADD_EMPLOYEES step
export interface AddEmployeeData {
  employee_code?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  channel: 'email' | 'sms';
  job_title: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'temporary';
  start_date: string;
  end_date?: string;
  salary: number;
  bank_account?: string;
  ssnit_number?: string;
  tax_id?: string;
  documents?: any[];
}

// ADD_PATIENT step
export interface AddPatientData {
  core: {
    date_of_birth: string;
    gender: 'male' | 'female' | 'other' | 'unknown';
    facility_id: string;
    active?: boolean;
    deceased?: boolean;
    marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'unknown';
    photo?: string;
  };
  names: Array<{
    use: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
    family: string;
    given: string[];
  }>;
  identifiers?: Array<{
    system: string;
    value: string;
    type?: string;
  }>;
  addresses?: Array<{
    use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
    line: string[];
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  }>;
  telecoms?: Array<{
    system: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
    value: string;
    use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  }>;
  contacts?: Array<{
    relationship_role_code: string;
    name: string;
    gender?: 'male' | 'female' | 'other' | 'unknown';
    period_start?: string;
    period_end?: string;
    addresses?: Array<{
      use?: string;
      line: string[];
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    }>;
    telecoms?: Array<{
      system: string;
      value: string;
      use?: string;
    }>;
  }>;
}

export type OnboardingStepData = AddUnitData | AddRoomsAndBedsData | AddEmployeeData | AddPatientData[];

export const ONBOARDING_STEPS = {
  ADD_UNITS: 'ADD_UNITS',
  ADD_ROOMS_AND_BEDS: 'ADD_ROOMS_AND_BEDS',
  ADD_EMPLOYEES: 'ADD_EMPLOYEES',
  ADD_PATIENT: 'ADD_PATIENT',
} as const;

export type OnboardingStep = keyof typeof ONBOARDING_STEPS;

