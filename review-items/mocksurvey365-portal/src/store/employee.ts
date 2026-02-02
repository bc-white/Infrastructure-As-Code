import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  startDate: string;
  status: "active" | "inactive" | "on-leave";
  accessLevel: "Super Admin" | "Administrator" | "Manager" | "Supervisor" | "Employee";
  avatar?: string;
  certifications: string[];
  lastLogin?: string;
  employeeId: string;
  organizationId?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  salary?: number;
  manager?: string;
  skills: string[];
  documents: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
  }[];
}

export interface TimeoffRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  requestType: "vacation" | "sick" | "personal" | "emergency" | "maternity" | "bereavement";
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  requestedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  remainingDays: number;
}

export interface Credential {
  id: string;
  employeeId: string;
  credentialType: string;
  credentialName: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  status: "active" | "expired" | "expiring-soon" | "pending-renewal";
  documentUrl?: string;
  renewalRequired: boolean;
  complianceLevel: "required" | "preferred" | "optional";
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: "present" | "absent" | "late" | "early-departure" | "partial";
  hoursWorked: number;
  scheduledHours: number;
  overtime: number;
  notes?: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  startTime: string;
  endTime: string;
  date: string;
  location: string;
  status: "scheduled" | "confirmed" | "completed" | "missed";
  shiftType: "regular" | "overtime" | "on-call";
}

export interface TaskAssignment {
  id: string;
  taskTitle: string;
  assignedTo: string;
  assignedBy: string;
  department: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "accepted" | "declined" | "completed";
  dueDate: string;
  description: string;
  estimatedHours: number;
}

export interface ShiftSwapRequest {
  id: string;
  requestedBy: string;
  swapWith: string;
  originalShift: string;
  requestedShift: string;
  date: string;
  reason: string;
  status: "pending" | "approved" | "declined";
  approvedBy?: string;
}

export interface CallOut {
  id: string;
  employeeName: string;
  shiftDate: string;
  shiftTime: string;
  reason: string;
  callOutTime: string;
  replacementFound: boolean;
  replacementName?: string;
  status: "active" | "covered" | "unresolved";
}

export interface AccessRecord {
  id: string;
  employeeName: string;
  position: string;
  department: string;
  email: string;
  accessLevel: "Super Admin" | "Administrator" | "Manager" | "Supervisor" | "Employee";
  permissions: string[];
  loginStatus: "active" | "locked" | "disabled" | "pending";
  lastLogin: string;
  passwordLastChanged: string;
  mfaEnabled: boolean;
  failedAttempts: number;
}

interface EmployeeStore {
  employees: Employee[];
  selectedEmployee: Employee | null;
  timeoffRequests: TimeoffRequest[];
  credentials: Credential[];
  attendanceRecords: AttendanceRecord[];
  shifts: Shift[];
  taskAssignments: TaskAssignment[];
  shiftSwapRequests: ShiftSwapRequest[];
  callOuts: CallOut[];
  accessRecords: AccessRecord[];
  loading: boolean;
  error: string | null;
  
  // Employee actions
  setEmployees: (employees: Employee[]) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  setSelectedEmployee: (employee: Employee | null) => void;
  
  // Timeoff actions
  setTimeoffRequests: (requests: TimeoffRequest[]) => void;
  addTimeoffRequest: (request: TimeoffRequest) => void;
  updateTimeoffRequest: (id: string, updates: Partial<TimeoffRequest>) => void;
  
  // Credentials actions
  setCredentials: (credentials: Credential[]) => void;
  addCredential: (credential: Credential) => void;
  updateCredential: (id: string, updates: Partial<Credential>) => void;
  
  // Attendance actions
  setAttendanceRecords: (records: AttendanceRecord[]) => void;
  addAttendanceRecord: (record: AttendanceRecord) => void;
  updateAttendanceRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  
  // Shift actions
  setShifts: (shifts: Shift[]) => void;
  addShift: (shift: Shift) => void;
  updateShift: (id: string, updates: Partial<Shift>) => void;
  
  // Task assignment actions
  setTaskAssignments: (tasks: TaskAssignment[]) => void;
  addTaskAssignment: (task: TaskAssignment) => void;
  updateTaskAssignment: (id: string, updates: Partial<TaskAssignment>) => void;
  
  // Shift swap actions
  setShiftSwapRequests: (requests: ShiftSwapRequest[]) => void;
  addShiftSwapRequest: (request: ShiftSwapRequest) => void;
  updateShiftSwapRequest: (id: string, updates: Partial<ShiftSwapRequest>) => void;
  
  // Call out actions
  setCallOuts: (callOuts: CallOut[]) => void;
  addCallOut: (callOut: CallOut) => void;
  updateCallOut: (id: string, updates: Partial<CallOut>) => void;
  
  // Access control actions
  setAccessRecords: (records: AccessRecord[]) => void;
  addAccessRecord: (record: AccessRecord) => void;
  updateAccessRecord: (id: string, updates: Partial<AccessRecord>) => void;
  removeAccessRecord: (id: string) => void;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearStore: () => void;
}

export const useEmployeeStore = create<EmployeeStore>()(
  persist(
    (set, get) => ({
      employees: [],
      selectedEmployee: null,
      timeoffRequests: [],
      credentials: [],
      attendanceRecords: [],
      shifts: [],
      taskAssignments: [],
      shiftSwapRequests: [],
      callOuts: [],
      accessRecords: [],
      loading: false,
      error: null,

      // Employee actions
      setEmployees: (employees) => set({ employees }),
      addEmployee: (employee) => 
        set({ employees: [...get().employees, employee] }),
      updateEmployee: (id, updates) =>
        set({
          employees: get().employees.map(emp => 
            emp.id === id ? { ...emp, ...updates } : emp
          )
        }),
      removeEmployee: (id) =>
        set({
          employees: get().employees.filter(emp => emp.id !== id)
        }),
      setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),

      // Timeoff actions
      setTimeoffRequests: (requests) => set({ timeoffRequests: requests }),
      addTimeoffRequest: (request) =>
        set({ timeoffRequests: [...get().timeoffRequests, request] }),
      updateTimeoffRequest: (id, updates) =>
        set({
          timeoffRequests: get().timeoffRequests.map(req =>
            req.id === id ? { ...req, ...updates } : req
          )
        }),

      // Credentials actions
      setCredentials: (credentials) => set({ credentials }),
      addCredential: (credential) =>
        set({ credentials: [...get().credentials, credential] }),
      updateCredential: (id, updates) =>
        set({
          credentials: get().credentials.map(cred =>
            cred.id === id ? { ...cred, ...updates } : cred
          )
        }),

      // Attendance actions
      setAttendanceRecords: (records) => set({ attendanceRecords: records }),
      addAttendanceRecord: (record) =>
        set({ attendanceRecords: [...get().attendanceRecords, record] }),
      updateAttendanceRecord: (id, updates) =>
        set({
          attendanceRecords: get().attendanceRecords.map(record =>
            record.id === id ? { ...record, ...updates } : record
          )
        }),

      // Shift actions
      setShifts: (shifts) => set({ shifts }),
      addShift: (shift) =>
        set({ shifts: [...get().shifts, shift] }),
      updateShift: (id, updates) =>
        set({
          shifts: get().shifts.map(shift =>
            shift.id === id ? { ...shift, ...updates } : shift
          )
        }),

      // Task assignment actions
      setTaskAssignments: (tasks) => set({ taskAssignments: tasks }),
      addTaskAssignment: (task) =>
        set({ taskAssignments: [...get().taskAssignments, task] }),
      updateTaskAssignment: (id, updates) =>
        set({
          taskAssignments: get().taskAssignments.map(task =>
            task.id === id ? { ...task, ...updates } : task
          )
        }),

      // Shift swap actions
      setShiftSwapRequests: (requests) => set({ shiftSwapRequests: requests }),
      addShiftSwapRequest: (request) =>
        set({ shiftSwapRequests: [...get().shiftSwapRequests, request] }),
      updateShiftSwapRequest: (id, updates) =>
        set({
          shiftSwapRequests: get().shiftSwapRequests.map(request =>
            request.id === id ? { ...request, ...updates } : request
          )
        }),

      // Call out actions
      setCallOuts: (callOuts) => set({ callOuts }),
      addCallOut: (callOut) =>
        set({ callOuts: [...get().callOuts, callOut] }),
      updateCallOut: (id, updates) =>
        set({
          callOuts: get().callOuts.map(callOut =>
            callOut.id === id ? { ...callOut, ...updates } : callOut
          )
        }),

      // Access control actions
      setAccessRecords: (records) => set({ accessRecords: records }),
      addAccessRecord: (record) =>
        set({ accessRecords: [...get().accessRecords, record] }),
      updateAccessRecord: (id, updates) =>
        set({
          accessRecords: get().accessRecords.map(record =>
            record.id === id ? { ...record, ...updates } : record
          )
        }),
      removeAccessRecord: (id) =>
        set({
          accessRecords: get().accessRecords.filter(record => record.id !== id)
        }),

      // Utility actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearStore: () => set({
        employees: [],
        selectedEmployee: null,
        timeoffRequests: [],
        credentials: [],
        attendanceRecords: [],
        shifts: [],
        taskAssignments: [],
        shiftSwapRequests: [],
        callOuts: [],
        accessRecords: [],
        loading: false,
        error: null,
      }),
    }),
    {
      name: "employee-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
); 