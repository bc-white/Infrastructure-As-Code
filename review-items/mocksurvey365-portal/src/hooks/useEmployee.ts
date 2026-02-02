import { useEmployeeStore } from "@/store/employee";
import { useAuth } from "./useAuth";
import {
  useGetEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useSearchEmployees,
  useGetTimeoffRequests,
  useCreateTimeoffRequest,
  useApproveTimeoffRequest,
  useDenyTimeoffRequest,
  useGetCredentials,
  useCreateCredential,
  useUpdateCredential,
  useGetAttendanceRecords,
  useCreateAttendanceRecord,
  useCheckIn,
  useCheckOut,
  useGetShifts,
  useCreateShift,
  useUpdateShift,
  useUploadEmployeeDocument,
  useGetEmployeeStats,
  useGetDepartmentStats,
  useGetAttendanceStats,
} from "@/api/services/employee";

export const useEmployee = () => {
  const { user } = useAuth();
  const {
    employees,
    selectedEmployee,
    timeoffRequests,
    credentials,
    attendanceRecords,
    shifts,
    loading,
    error,
    setSelectedEmployee,
    clearStore,
  } = useEmployeeStore();

  // Employee operations
  const employeeQuery = useGetEmployees();
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();
  const searchEmployeeMutation = useSearchEmployees();

  // Timeoff operations
  const timeoffQuery = useGetTimeoffRequests();
  const createTimeoffMutation = useCreateTimeoffRequest();
  const approveTimeoffMutation = useApproveTimeoffRequest();
  const denyTimeoffMutation = useDenyTimeoffRequest();

  // Credential operations
  const credentialsQuery = useGetCredentials();
  const createCredentialMutation = useCreateCredential();
  const updateCredentialMutation = useUpdateCredential();

  // Attendance operations
  const attendanceQuery = useGetAttendanceRecords();
  const createAttendanceMutation = useCreateAttendanceRecord();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  // Shift operations
  const shiftsQuery = useGetShifts();
  const createShiftMutation = useCreateShift();
  const updateShiftMutation = useUpdateShift();

  // Document operations
  const uploadDocumentMutation = useUploadEmployeeDocument();

  // Stats operations
  const employeeStatsQuery = useGetEmployeeStats();
  const departmentStatsQuery = useGetDepartmentStats();
  const attendanceStatsMutation = useGetAttendanceStats();

  // Helper functions
  const getEmployeeById = (id: string) => {
    return employees.find(emp => emp.id === id);
  };

  const getEmployeesByDepartment = (department: string) => {
    return employees.filter(emp => emp.department === department);
  };

  const getEmployeesByStatus = (status: string) => {
    return employees.filter(emp => emp.status === status);
  };

  const getActiveEmployees = () => {
    return employees.filter(emp => emp.status === "active");
  };

  const getPendingTimeoffRequests = () => {
    return timeoffRequests.filter(req => req.status === "pending");
  };

  const getExpiringCredentials = (days: number = 30) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return credentials.filter(cred => {
      const expiryDate = new Date(cred.expiryDate);
      return expiryDate <= futureDate && cred.status === "active";
    });
  };

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendanceRecords.filter(record => record.date === today);
  };

  const getTodayShifts = () => {
    const today = new Date().toISOString().split('T')[0];
    return shifts.filter(shift => shift.date === today);
  };

  // Stats calculations
  const calculateStats = () => {
    const total = employees.length;
    const active = getActiveEmployees().length;
    const onLeave = employees.filter(emp => emp.status === "on-leave").length;
    const inactive = employees.filter(emp => emp.status === "inactive").length;
    
    const pendingTimeoff = getPendingTimeoffRequests().length;
    const expiringCreds = getExpiringCredentials().length;
    const todayPresent = getTodayAttendance().filter(att => att.status === "present").length;
    const todayShifts = getTodayShifts().length;

    return {
      employees: { total, active, onLeave, inactive },
      timeoff: { pending: pendingTimeoff },
      credentials: { expiring: expiringCreds },
      attendance: { present: todayPresent },
      shifts: { today: todayShifts }
    };
  };

  // Action wrappers with error handling
  const actions = {
    // Employee actions
    createEmployee: async (employeeData: any) => {
      try {
        await createEmployeeMutation.mutateAsync(employeeData);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    updateEmployee: async (id: string, updates: any) => {
      try {
        await updateEmployeeMutation.mutateAsync({ id, employee: updates });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    deleteEmployee: async (id: string) => {
      try {
        await deleteEmployeeMutation.mutateAsync(id);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    searchEmployees: async (query: string) => {
      try {
        const result = await searchEmployeeMutation.mutateAsync(query);
        return { success: true, data: result.data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    // Timeoff actions
    createTimeoffRequest: async (requestData: any) => {
      try {
        await createTimeoffMutation.mutateAsync(requestData);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    approveTimeoff: async (id: string) => {
      try {
        await approveTimeoffMutation.mutateAsync({ 
          id, 
          approvedBy: user?.name || "Unknown" 
        });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    denyTimeoff: async (id: string, reason?: string) => {
      try {
        await denyTimeoffMutation.mutateAsync({ 
          id, 
          deniedBy: user?.name || "Unknown",
          reason 
        });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    // Attendance actions
    checkIn: async (employeeId: string) => {
      try {
        await checkInMutation.mutateAsync(employeeId);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    checkOut: async (employeeId: string) => {
      try {
        await checkOutMutation.mutateAsync(employeeId);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    // Document actions
    uploadDocument: async (employeeId: string, file: File, documentType: string) => {
      try {
        await uploadDocumentMutation.mutateAsync({ employeeId, file, documentType });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    // Stats actions
    getAttendanceStats: async (startDate?: string, endDate?: string) => {
      try {
        const result = await attendanceStatsMutation.mutateAsync({ startDate, endDate });
        return { success: true, data: result.data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  };

  return {
    // State
    employees,
    selectedEmployee,
    timeoffRequests,
    credentials,
    attendanceRecords,
    shifts,
    loading,
    error,

    // Queries
    queries: {
      employees: employeeQuery,
      timeoff: timeoffQuery,
      credentials: credentialsQuery,
      attendance: attendanceQuery,
      shifts: shiftsQuery,
      employeeStats: employeeStatsQuery,
      departmentStats: departmentStatsQuery,
    },

    // Actions
    actions,

    // Helper functions
    helpers: {
      getEmployeeById,
      getEmployeesByDepartment,
      getEmployeesByStatus,
      getActiveEmployees,
      getPendingTimeoffRequests,
      getExpiringCredentials,
      getTodayAttendance,
      getTodayShifts,
      calculateStats,
    },

    // Utilities
    setSelectedEmployee,
    clearStore,

    // Loading states
    isLoading: loading || 
      employeeQuery.isLoading || 
      timeoffQuery.isLoading || 
      credentialsQuery.isLoading || 
      attendanceQuery.isLoading || 
      shiftsQuery.isLoading,

    // Mutation states
    mutations: {
      createEmployee: createEmployeeMutation,
      updateEmployee: updateEmployeeMutation,
      deleteEmployee: deleteEmployeeMutation,
      searchEmployee: searchEmployeeMutation,
      createTimeoff: createTimeoffMutation,
      approveTimeoff: approveTimeoffMutation,
      denyTimeoff: denyTimeoffMutation,
      createCredential: createCredentialMutation,
      updateCredential: updateCredentialMutation,
      createAttendance: createAttendanceMutation,
      checkIn: checkInMutation,
      checkOut: checkOutMutation,
      createShift: createShiftMutation,
      updateShift: updateShiftMutation,
      uploadDocument: uploadDocumentMutation,
      attendanceStats: attendanceStatsMutation,
    }
  };
}; 