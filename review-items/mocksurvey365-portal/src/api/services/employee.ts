import { useMutation, useQuery } from "@tanstack/react-query";

const createUnimplementedQuery = <TData = any>(queryKey: readonly unknown[], name: string) =>
  useQuery<TData>({
    queryKey,
    queryFn: async () => {
      throw new Error(`${name} is not implemented yet.`);
    },
    enabled: false,
  });

const createUnimplementedMutation = <TData = any, TVariables = any>(name: string) =>
  useMutation<TData, Error, TVariables>({
    mutationFn: async () => {
      throw new Error(`${name} is not implemented yet.`);
    },
  });

export const useGetEmployees = () => createUnimplementedQuery<any[]>(["employees"], "useGetEmployees");
export const useCreateEmployee = () => createUnimplementedMutation("useCreateEmployee");
export const useUpdateEmployee = () => createUnimplementedMutation("useUpdateEmployee");
export const useDeleteEmployee = () => createUnimplementedMutation("useDeleteEmployee");
export const useSearchEmployees = () => createUnimplementedMutation("useSearchEmployees");

export const useGetTimeoffRequests = () => createUnimplementedQuery<any[]>(["employees", "timeoff"], "useGetTimeoffRequests");
export const useCreateTimeoffRequest = () => createUnimplementedMutation("useCreateTimeoffRequest");
export const useApproveTimeoffRequest = () => createUnimplementedMutation("useApproveTimeoffRequest");
export const useDenyTimeoffRequest = () => createUnimplementedMutation("useDenyTimeoffRequest");

export const useGetCredentials = () => createUnimplementedQuery<any[]>(["employees", "credentials"], "useGetCredentials");
export const useCreateCredential = () => createUnimplementedMutation("useCreateCredential");
export const useUpdateCredential = () => createUnimplementedMutation("useUpdateCredential");

export const useGetAttendanceRecords = () => createUnimplementedQuery<any[]>(["employees", "attendance"], "useGetAttendanceRecords");
export const useCreateAttendanceRecord = () => createUnimplementedMutation("useCreateAttendanceRecord");
export const useCheckIn = () => createUnimplementedMutation("useCheckIn");
export const useCheckOut = () => createUnimplementedMutation("useCheckOut");

export const useGetShifts = () => createUnimplementedQuery<any[]>(["employees", "shifts"], "useGetShifts");
export const useCreateShift = () => createUnimplementedMutation("useCreateShift");
export const useUpdateShift = () => createUnimplementedMutation("useUpdateShift");

export const useUploadEmployeeDocument = () => createUnimplementedMutation("useUploadEmployeeDocument");

export const useGetEmployeeStats = () => createUnimplementedQuery<any>(["employees", "stats"], "useGetEmployeeStats");
export const useGetDepartmentStats = () => createUnimplementedQuery<any>(["employees", "department", "stats"], "useGetDepartmentStats");
export const useGetAttendanceStats = () => createUnimplementedMutation("useGetAttendanceStats");
