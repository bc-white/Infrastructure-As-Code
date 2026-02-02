/**
 * Resident management utility functions
 */

import { normalizeDateValue } from './dateUtils';

export const normalizeResidentEntry = (resident = {}) => {
  const normalized = {
    ...resident,
    name: resident?.name || "",
    room: resident?.room || "",
    careArea: Array.isArray(resident?.careArea) ? resident.careArea : (resident?.careArea ? [resident.careArea] : []),
    notes: resident?.notes || "",
  };

  normalized.admissionDate = normalizeDateValue(resident?.admissionDate);

  return normalized;
};

export const ensureResidentArray = (residents) =>
  Array.isArray(residents) ? residents.map((resident) => normalizeResidentEntry(resident)) : [];
