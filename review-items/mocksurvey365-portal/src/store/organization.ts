export interface OrganizationProps {
  id: string;
  name: string;
  OrgType: string;
  address: string;
  contact: string;
  email: string;
  status: "active" | "inactive";
  branches: number;
  administrators: number;
  createdAt: string;
}
export interface AdministratoProps {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  role: "org_admin" | "branch_admin";
  permissions: string[];
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
}

export interface PolicyProps {
  id: string;
  name: string;
  type: "data_usage" | "security" | "retention" | "compliance" | "privacy";
  status: "active" | "draft" | "archived";
  version: string;
  updatedAt: string;
}

export interface AuditLogProps {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  entityId: string;
  user: string;
  userRole: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface ExportJobProps {
  id: string;
  name: string;
  type: "manual" | "scheduled";
  format: "JSON" | "CSV" | "PDF";
  entities: string[];
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  createdAt: string;
  completedAt?: string;
  fileSize?: string;
  downloadUrl?: string;
}

export interface BranchProps {
  id: string;
  name: string;
  location: string;
  manager: string;
  managerEmail: string;
  contact: string;
  employees: number;
  status: "active" | "inactive";
  createdAt: string;
}