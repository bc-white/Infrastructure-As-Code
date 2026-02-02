/**
 * Occupancy Record Types
 * 
 * These types define the data structures for patient movement tracking
 * and occupancy records as per the user story requirements.
 */

export interface OccupancyRecord {
  id: string;
  patientId: string;
  roomId: string;
  roomNumber: string;
  bedId: string;
  bedNumber: string;
  unit: string;
  startDateTime: string; // ISO 8601 format
  endDateTime?: string; // ISO 8601 format - undefined for active records
  movementType: MovementType;
  authorizedBy: string; // User ID or name who authorized the movement
  reason: string; // Reason for the movement
  notes?: string; // Additional notes
  isActive: boolean; // True if this is the current occupancy record
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

export type MovementType = 'admission' | 'transfer' | 'discharge';

export interface AuditEvent {
  id: string;
  occupancyRecordId: string;
  action: AuditAction;
  timestamp: string; // ISO 8601 format
  performedBy: string; // User ID or name who performed the action
  details: string; // Human-readable description of the action
  previousValues?: Partial<OccupancyRecord>; // Previous state (for updates)
  newValues?: Partial<OccupancyRecord>; // New state (for updates/creates)
  ipAddress?: string; // IP address of the user
  userAgent?: string; // User agent string
}

export type AuditAction = 'created' | 'updated' | 'closed';

export interface GetOccupancyHistoryRequest {
  patientId?: string;
  roomId?: string;
  bedId?: string;
  unit?: string;
  startDate?: string; // ISO 8601 format
  endDate?: string; // ISO 8601 format
  movementType?: MovementType;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'startDateTime' | 'endDateTime' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface GetOccupancyHistoryResponse {
  records: OccupancyRecord[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateOccupancyRecordRequest {
  patientId: string;
  roomId: string;
  bedId: string;
  movementType: MovementType;
  reason: string;
  notes?: string;
  authorizedBy: string;
}

export interface UpdateOccupancyRecordRequest {
  id: string;
  endDateTime?: string; // Only endDateTime can be updated
  notes?: string;
  updatedBy: string;
}

export interface CloseOccupancyRecordRequest {
  id: string;
  reason: string;
  closedBy: string;
  notes?: string;
}

export interface OccupancyStats {
  totalActiveOccupancies: number;
  totalOccupancies: number;
  occupancyRate: number; // Percentage
  averageLengthOfStay: number; // In hours
  unitStats: {
    unitId: string;
    unitName: string;
    activeOccupancies: number;
    totalBeds: number;
    occupancyRate: number;
  }[];
}

export interface PatientMovementSummary {
  patientId: string;
  patientName: string;
  mrn: string;
  currentRoom?: string;
  currentBed?: string;
  currentUnit?: string;
  admissionDate?: string;
  dischargeDate?: string;
  totalMovements: number;
  totalDaysInFacility: number;
  movementHistory: OccupancyRecord[];
}

// Validation schemas (for runtime validation)
export const MovementTypeValues: MovementType[] = ['admission', 'transfer', 'discharge'];
export const AuditActionValues: AuditAction[] = ['created', 'updated', 'closed'];

// Helper functions
export const isActiveOccupancy = (record: OccupancyRecord): boolean => {
  return record.isActive && !record.endDateTime;
};

export const getOccupancyDuration = (record: OccupancyRecord): number => {
  const start = new Date(record.startDateTime);
  const end = record.endDateTime ? new Date(record.endDateTime) : new Date();
  return end.getTime() - start.getTime(); // Returns duration in milliseconds
};

export const formatOccupancyDuration = (durationMs: number): string => {
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (days > 0) {
    return `${days}d ${remainingHours}h`;
  }
  return `${hours}h`;
};
