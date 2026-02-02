/**
 * Date utility functions for survey management
 */

export const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

export const normalizeDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }
  const parsedDate = new Date(value);
  return isValidDate(parsedDate) ? parsedDate : null;
};
