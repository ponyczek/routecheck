import type { IsoDateString } from '@/types';

/**
 * Formats an ISO date string to a localized date and time
 * @param isoDate - ISO 8601 date string
 * @param locale - Locale code (defaults to 'pl-PL')
 * @returns Formatted date and time string
 */
export function formatDateTime(isoDate: IsoDateString, locale = 'pl-PL'): string {
  const date = new Date(isoDate);
  
  return date.toLocaleString(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/**
 * Formats a duration in milliseconds to human-readable format
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted duration string (e.g., "9 min 58 s")
 */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes} min ${seconds} s`;
  }
  
  return `${seconds} s`;
}

/**
 * Calculates time left until a target date
 * @param targetDate - Target ISO date string
 * @returns Time left in milliseconds (0 if past)
 */
export function getTimeLeft(targetDate: IsoDateString): number {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const timeLeft = target - now;
  
  return Math.max(0, timeLeft);
}

/**
 * Checks if current time is before target date
 * @param targetDate - Target ISO date string
 * @returns True if current time is before target
 */
export function isBefore(targetDate: IsoDateString): boolean {
  return getTimeLeft(targetDate) > 0;
}


