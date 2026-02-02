export type ShiftStatus = 'draft' | 'published' | 'locked' | 'archived';
export type ShiftType = 'Regular' | 'Float' | 'On-call';

export interface Shift {
  id: string;
  name: string;
  time: string;
  startTime: string;
  endTime: string;
  assignedNurses: number;
  totalSlots: number;
  type: ShiftType;
  status: ShiftStatus;
  department: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  description: string;
  shifts: Shift[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleExportOptions {
  format: 'csv' | 'pdf';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeNotes: boolean;
  departments?: string[];
}

export interface NotificationPreference {
  id: string;
  type: 'unfilled-shifts' | 'call-outs' | 'schedule-changes' | 'shift-swaps' | 'schedule-conflicts';
  enabled: boolean;
  threshold?: number; // For time-based notifications (in hours)
  channels: ('email' | 'in-app' | 'sms')[];
}

export interface BulkGenerateOptions {
  startDate: Date;
  endDate: Date;
  pattern: 'weekly' | 'biweekly' | 'monthly';
  templateId?: string;
  departments: string[];
  excludeDates?: Date[];
}

export interface DragDropAssignment {
  shiftId: string;
  nurseId: string;
  date: Date;
  position: {
    x: number;
    y: number;
  };
} 