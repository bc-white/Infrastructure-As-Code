// Application Constants

// US States list
export const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
]

// Florida state constant (for reference)
export const FLORIDA_STATE = 'Florida'

// User roles (from SRS)
export const USER_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  FACILITY_ADMIN: 'facility_admin',
  SURVEY_ADMIN: 'survey_admin',
  DON: 'don',
  COMPLIANCE_OFFICER: 'compliance_officer',
  SURVEY_COORDINATOR: 'survey_coordinator',
  CLINICAL_STAFF: 'clinical_staff',
  VIEWER: 'viewer'
}

// Role display names
export const ROLE_NAMES = {
  [USER_ROLES.SYSTEM_ADMIN]: 'System Administrator',
  [USER_ROLES.FACILITY_ADMIN]: 'Facility Administrator',
  [USER_ROLES.SURVEY_ADMIN]: 'Survey Administrator',
  [USER_ROLES.DON]: 'Director of Health Services / DON',
  [USER_ROLES.COMPLIANCE_OFFICER]: 'Compliance Officer',
  [USER_ROLES.SURVEY_COORDINATOR]: 'Survey Coordinator',
  [USER_ROLES.CLINICAL_STAFF]: 'Clinical Staff',
  [USER_ROLES.VIEWER]: 'Viewer'
}

// Survey types (from SRS)
export const SURVEY_TYPES = {
  STANDARD: 'Standard',
  COMPLAINT_INVESTIGATION: 'Complaint Investigation',
  FOLLOW_UP: 'Follow-up',
  ABBREVIATED: 'Abbreviated',
  PRE_LICENSING: 'Pre-licensing'
}

// Deficiency severity levels (Florida-specific)
export const DEFICIENCY_SEVERITY = {
  IMMEDIATE_JEOPARDY: 'Immediate Jeopardy',
  ACTUAL_HARM: 'Actual Harm',
  POTENTIAL_FOR_HARM: 'Potential for Harm',
  NO_ACTUAL_HARM: 'No Actual Harm'
}

// Deficiency scope (Florida-specific)
export const DEFICIENCY_SCOPE = {
  ISOLATED: 'Isolated',
  PATTERN: 'Pattern',
  WIDESPREAD: 'Widespread'
}

// Deficiency status
export const DEFICIENCY_STATUS = {
  IDENTIFIED: 'Identified',
  POC_REQUIRED: 'POC Required',
  POC_SUBMITTED: 'POC Submitted',
  POC_APPROVED: 'POC Approved',
  IN_REMEDIATION: 'In Remediation',
  CORRECTED: 'Corrected',
  VERIFIED: 'Verified',
  CLOSED: 'Closed'
}

// POC status
export const POC_STATUS = {
  DRAFT: 'Draft',
  UNDER_REVIEW: 'Under Review',
  APPROVED_INTERNALLY: 'Approved Internally',
  SUBMITTED: 'Submitted',
  APPROVED_BY_SURVEYOR: 'Approved by Surveyor',
  REJECTED: 'Rejected'
}

// Survey status
export const SURVEY_STATUS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived'
}

// Document categories
export const DOCUMENT_CATEGORIES = {
  POLICIES_PROCEDURES: 'Policies and Procedures',
  CARE_PLANS: 'Care Plans',
  TRAINING_RECORDS: 'Training Records',
  INCIDENT_REPORTS: 'Incident Reports',
  MEDICATION_RECORDS: 'Medication Records (MAR)',
  SURVEY_EVIDENCE: 'Survey Evidence',
  SURVEY_RESPONSES: 'Survey Responses',
  LICENSES_CERTIFICATIONS: 'Licenses and Certifications',
  DEFICIENCY_DOCUMENTATION: 'Deficiency Documentation',
  POC_DOCUMENTATION: 'POC Documentation',
  OTHER: 'Other'
}

// OTP expiration time (5 minutes)
export const OTP_EXPIRATION_MS = 5 * 60 * 1000

// Session expiration time (24 hours)
export const SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000

// Test OTP code (for development)
export const TEST_OTP_CODE = '123456'

