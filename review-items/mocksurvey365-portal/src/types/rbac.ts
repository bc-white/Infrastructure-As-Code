export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ORGANIZATION_ADMIN = "ORGANIZATION_ADMIN",
  MANAGER = "MANAGER",
  NURSE = "NURSE",
  CNA = "CNA",
  FACILITY_ADMIN = "FACILITY_ADMIN",
}

export type Permission =
  | "ORG_READ"
  | "ORG_WRITE"
  | "ORG_ADMIN"
  | "FACILITY_READ"
  | "FACILITY_WRITE"
  | "EMPLOYEE_READ"
  | "EMPLOYEE_WRITE"
  | "SCHEDULE_READ"
  | "SCHEDULE_WRITE"
  | "PATIENT_READ"
  | "PATIENT_WRITE"
  | "AUDIT_READ"
  | "SECURITY_ADMIN";

export interface RoleDefinition {
  role: Role;
  permissions: Permission[];
}

export interface UpdateUserRoleRequest {
  userId: string;
  role: Role;
}

export interface UpdateUserPermissionsRequest {
  userId: string;
  permissions: Permission[];
}


