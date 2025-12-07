import type { DateRange } from "./types";

/**
 * Validates the date range for CSV export
 * @param range - Date range to validate
 * @returns Error message if validation fails, undefined if valid
 */
export function validateDateRange(range: DateRange): string | undefined {
  const { from, to } = range;

  // Check if both dates are filled
  if (!from || !to) {
    return "Zakres dat jest wymagany";
  }

  // Check if start date is not later than end date
  if (from > to) {
    return "Data początkowa musi być wcześniejsza lub równa dacie końcowej";
  }

  // Check if range does not exceed 31 days
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (daysDiff > 31) {
    return "Zakres nie może przekraczać 31 dni";
  }

  // Check if dates are not in the future
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  if (from > today || to > today) {
    return "Nie możesz wybrać dat w przyszłości";
  }

  return undefined;
}

/**
 * Validates the entire export form
 * @param formData - Form data to validate
 * @returns Object containing validation errors
 */
export function validateForm(dateRange: DateRange): { dateRange?: string } {
  const errors: { dateRange?: string } = {};

  const dateRangeError = validateDateRange(dateRange);
  if (dateRangeError) {
    errors.dateRange = dateRangeError;
  }

  return errors;
}
