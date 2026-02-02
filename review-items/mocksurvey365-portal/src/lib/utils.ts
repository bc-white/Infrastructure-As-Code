import type { CategoryType } from '@/types/category';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Restored helper expected by layouts that was removed during a template update
export function getRouteMetadata(pathname: string): { title: string; subheading: string } {
  const mappings: Record<string, { title: string; subheading: string }> = {
    "/dashboard": { title: "Dashboard", subheading: "Overview and insights" },
    "/dashboard/super-admin": { title: "Super Admin", subheading: "Administrative overview" },
    "/dashboard/org-admin": { title: "Organization", subheading: "Organization overview" },
    "/dashboard/employee": { title: "Employees", subheading: "Manage your workforce" },
    "/dashboard/schedule": { title: "Schedules", subheading: "Plan and manage shifts" },
  };

  // Try exact match first
  if (mappings[pathname]) return mappings[pathname];

  // Fallback: derive from last path segment
  const segment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const title = segment
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

  return { title, subheading: "" };
}

export function getCategoryIcon(type: CategoryType): string {
    const icons: Record<CategoryType, string> = {
      food: '🍔',
      transportation: '🚗',
      entertainment: '🎬',
      health: '💊',
      education: '📚',
      shopping: '🛍️',
      services: '💼',
    };
    return icons[type] || '🏷️';
  };
