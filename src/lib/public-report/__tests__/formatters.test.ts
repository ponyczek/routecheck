import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  formatDateTime, 
  formatDuration, 
  getTimeLeft, 
  isBefore 
} from '../utils/formatters';

describe('formatters', () => {
  describe('formatDateTime', () => {
    it('should format ISO date to localized string', () => {
      const isoDate = '2025-12-01T14:30:00Z';
      const result = formatDateTime(isoDate, 'en-US');
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should use pl-PL locale by default', () => {
      const isoDate = '2025-12-01T14:30:00Z';
      const result = formatDateTime(isoDate);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('formatDuration', () => {
    it('should format duration in minutes and seconds', () => {
      const ms = 125000; // 2 min 5 sec
      const result = formatDuration(ms);
      
      expect(result).toBe('2 min 5 s');
    });

    it('should format duration with only seconds', () => {
      const ms = 45000; // 45 sec
      const result = formatDuration(ms);
      
      expect(result).toBe('45 s');
    });

    it('should handle zero duration', () => {
      const ms = 0;
      const result = formatDuration(ms);
      
      expect(result).toBe('0 s');
    });

    it('should handle large durations', () => {
      const ms = 600000; // 10 min
      const result = formatDuration(ms);
      
      expect(result).toBe('10 min 0 s');
    });
  });

  describe('getTimeLeft', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return time left in milliseconds', () => {
      const now = new Date('2025-12-01T14:00:00Z');
      vi.setSystemTime(now);

      const targetDate = '2025-12-01T14:10:00Z'; // 10 minutes in future
      const timeLeft = getTimeLeft(targetDate);
      
      expect(timeLeft).toBe(600000); // 10 min in ms
    });

    it('should return 0 for past dates', () => {
      const now = new Date('2025-12-01T14:00:00Z');
      vi.setSystemTime(now);

      const targetDate = '2025-12-01T13:00:00Z'; // 1 hour in past
      const timeLeft = getTimeLeft(targetDate);
      
      expect(timeLeft).toBe(0);
    });

    it('should return 0 for current time', () => {
      const now = new Date('2025-12-01T14:00:00Z');
      vi.setSystemTime(now);

      const targetDate = '2025-12-01T14:00:00Z';
      const timeLeft = getTimeLeft(targetDate);
      
      expect(timeLeft).toBe(0);
    });
  });

  describe('isBefore', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for future dates', () => {
      const now = new Date('2025-12-01T14:00:00Z');
      vi.setSystemTime(now);

      const targetDate = '2025-12-01T15:00:00Z';
      
      expect(isBefore(targetDate)).toBe(true);
    });

    it('should return false for past dates', () => {
      const now = new Date('2025-12-01T14:00:00Z');
      vi.setSystemTime(now);

      const targetDate = '2025-12-01T13:00:00Z';
      
      expect(isBefore(targetDate)).toBe(false);
    });

    it('should return false for current time', () => {
      const now = new Date('2025-12-01T14:00:00Z');
      vi.setSystemTime(now);

      const targetDate = '2025-12-01T14:00:00Z';
      
      expect(isBefore(targetDate)).toBe(false);
    });
  });
});


