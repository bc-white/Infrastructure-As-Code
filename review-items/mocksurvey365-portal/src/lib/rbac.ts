import { Role } from "@/types/rbac";
import type { Permission, RoleDefinition } from "@/types/rbac";
import { useAuthStore } from "@/store/auth";

// Static role -> permissions mapping
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    "ORG_READ",
    "ORG_WRITE",
    "ORG_ADMIN",
    "FACILITY_READ",
    "FACILITY_WRITE",
    "EMPLOYEE_READ",
    "EMPLOYEE_WRITE",
    "SCHEDULE_READ",
    "SCHEDULE_WRITE",
    "PATIENT_READ",
    "PATIENT_WRITE",
    "AUDIT_READ",
    "SECURITY_ADMIN",
  ],
  [Role.ORGANIZATION_ADMIN]: [
    "ORG_READ",
    "ORG_WRITE",
    "FACILITY_READ",
    "EMPLOYEE_READ",
    "EMPLOYEE_WRITE",
    "SCHEDULE_READ",
    "SCHEDULE_WRITE",
    "PATIENT_READ",
    "AUDIT_READ",
  ],
  [Role.FACILITY_ADMIN]: [
    "FACILITY_READ",
    "FACILITY_WRITE",
    "EMPLOYEE_READ",
    "EMPLOYEE_WRITE",
    "SCHEDULE_READ",
    "SCHEDULE_WRITE",
    "PATIENT_READ",
    "AUDIT_READ",
  ],
  [Role.MANAGER]: [
    "EMPLOYEE_READ",
    "SCHEDULE_READ",
    "SCHEDULE_WRITE",
    "PATIENT_READ",
  ],
  [Role.NURSE]: [
    "SCHEDULE_READ",
    "PATIENT_READ",
  ],
  [Role.CNA]: [
    "SCHEDULE_READ",
    "PATIENT_READ",
  ],
};

export const ALL_PERMISSIONS: Permission[] = Array.from(
  new Set(Object.values(rolePermissions).flat())
);

// Optional: allow server-provided overrides in future
let cachedRoleDefinitions: Record<Role, Permission[]> | null = null;
let lastCacheTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export function getPermissionsForRole(role: Role): Permission[] {
  if (cachedRoleDefinitions && Date.now() - lastCacheTs < CACHE_TTL_MS) {
    return cachedRoleDefinitions[role] || [];
  }
  return rolePermissions[role] || [];
}

export function warmPermissionsCache(definitions: RoleDefinition[]): void {
  cachedRoleDefinitions = definitions.reduce<Record<Role, Permission[]>>((acc, def) => {
    acc[def.role] = def.permissions;
    return acc;
  }, {} as Record<Role, Permission[]>);
  lastCacheTs = Date.now();
}

export function hasPermission(permission: Permission): boolean {
  const state = useAuthStore.getState();
  const role = (state.user?.role as Role) || Role.NURSE;
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}

export function hasAnyPermission(required: Permission[]): boolean {
  return required.some((p) => hasPermission(p));
}


