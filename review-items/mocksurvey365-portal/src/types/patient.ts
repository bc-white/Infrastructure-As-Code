export type ISODate = string;
export type ISODateTime = string;
export type FacilityId = string;
export type LocationType = 'home' | 'facility';

export interface CreatePatientRequest {
  resourceType: 'Patient';
  identifier: Array<{
    use: 'official';
    type: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v2-0203';
        code: 'MR';
        display: 'Medical Record Number';
      }];
    };
    system: string;
    value: string;
  }>;
  name: [{
    use: 'official';
    family: string;
    given: string[];
  }];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: ISODate;
  address?: [{
    use: 'home';
    type: 'physical';
    line: string[];
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }];
  contact?: Array<{
    relationship: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v2-0131';
        code: 'C';
        display: 'Emergency Contact';
      }];
    }];
    name: { family: string; given: string[] };
    telecom: Array<{ system: 'phone'; value: string; use: 'home' | 'work' | 'mobile' }>;
  }>;
  _omcura: {
    facilityId: FacilityId;
    locationType: LocationType;
    homeCareDetails?: {
      accessInstructions?: string;
      specialNeeds?: string[];
      safetyConsiderations?: string[];
      preferredVisitTimes?: string[];
    };
    clinicalInfo?: {
      primaryDiagnosis?: string;
      secondaryDiagnoses?: string[];
    };
    episodeOfCare?: {
      resourceType: 'EpisodeOfCare';
      status: 'planned' | 'waitlist' | 'active' | 'onhold' | 'finished' | 'cancelled' | 'entered-in-error';
      type?: Array<{ coding: Array<{ system: string; code: string; display?: string }> }>;
      diagnosis?: Array<{
        condition: { reference: string; display?: string };
        role?: { coding: Array<{ system: string; code: string; display?: string }> };
        rank?: number;
      }>;
      managingOrganization: { reference: string; display?: string };
      period: { start: ISODateTime; end?: ISODateTime };
    };
    encounter?: {
      resourceType: 'Encounter';
      status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled' | 'entered-in-error' | 'unknown';
      class: { system: string; code: string; display?: string };
      type?: Array<{ coding: Array<{ system: string; code: string; display?: string }> }>;
      subject: { reference: string; display?: string };
      episodeOfCare?: Array<{ reference: string; display?: string }>;
      period: { start: ISODateTime; end?: ISODateTime };
      hospitalization?: {
        admitSource?: { coding: Array<{ system: string; code: string; display?: string }> };
        dischargeDisposition?: { coding: Array<{ system: string; code: string; display?: string }> };
      };
    };
  };
}

export interface Patient {
  id: string;
  name: string;
}

export interface PatientHome {
  patientId: string;
  address: { line: string[]; city: string; state: string; postalCode: string; country: string };
  accessInstructions?: string;
}

export interface ServiceArea {
  id: string;
  name: string;
  boundary: unknown;
}

export interface CreatePatientResponse {
  patient: Patient;
  _omcura: {
    patientHome?: PatientHome;
    serviceArea?: ServiceArea;
    isNewServiceArea: boolean;
    createdResources: string[];
  };
}

