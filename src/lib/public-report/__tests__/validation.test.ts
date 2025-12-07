import { describe, it, expect } from 'vitest';
import { reportFormSchema } from '../validation';

describe('reportFormSchema', () => {
  describe('Happy Path', () => {
    it('should validate happy path data', () => {
      const data = {
        isProblem: false,
        routeStatus: 'COMPLETED' as const,
        delayMinutes: 0,
        delayReason: '',
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        timezone: 'Europe/Warsaw',
      };

      const result = reportFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow happy path with any values in problem fields', () => {
      const data = {
        isProblem: false,
        routeStatus: 'COMPLETED' as const,
        delayMinutes: 999,
        delayReason: 'ignored',
        cargoDamageDescription: 'ignored',
        vehicleDamageDescription: 'ignored',
        nextDayBlockers: 'ignored',
        timezone: 'Europe/Warsaw',
      };

      const result = reportFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Problem Path - Delay Validation', () => {
    it('should reject negative delay minutes', () => {
      const data = {
        isProblem: true,
        routeStatus: 'COMPLETED' as const,
        delayMinutes: -10,
        delayReason: '',
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        timezone: 'Europe/Warsaw',
      };

      const result = reportFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ujemne');
      }
    });

    it('should require delay reason when delay > 0', () => {
      const data = {
        isProblem: true,
        routeStatus: 'COMPLETED' as const,
        delayMinutes: 30,
        delayReason: '',
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        timezone: 'Europe/Warsaw',
      };

      const result = reportFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('delayReason');
      }
    });

    it('should require min 3 chars in delay reason', () => {
      const data = {
        isProblem: true,
        routeStatus: 'COMPLETED' as const,
        delayMinutes: 30,
        delayReason: 'ab', // only 2 chars
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        timezone: 'Europe/Warsaw',
      };

      const result = reportFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid delay with reason', () => {
      const data = {
        isProblem: true,
        routeStatus: 'COMPLETED' as const,
        delayMinutes: 60,
        delayReason: 'Korek na autostradzie',
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        timezone: 'Europe/Warsaw',
      };

      const result = reportFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Problem Path - Partial Completion Validation', () => {
    it('should require comment for PARTIALLY_COMPLETED', () => {
      const data = {
        isProblem: true,
        routeStatus: 'PARTIALLY_COMPLETED' as const,
        delayMinutes: 0,
        delayReason: '',
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        timezone: 'Europe/Warsaw',
      };

      const result = reportFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('nextDayBlockers');
      }
    });

    it('should accept PARTIALLY_COMPLETED with delayReason', () => {
      const data = {
        isProblem: true,
        routeStatus: 'PARTIALLY_COMPLETED' as const,
        delayMinutes: 30,
        delayReason: 'Częściowo wykonano trasę',
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        timezone: 'Europe/Warsaw',
      };

      const result = reportFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept PARTIALLY_COMPLETED with nextDayBlockers', () => {
      const data = {
        isProblem: true,
        routeStatus: 'PARTIALLY_COMPLETED' as const,
        delayMinutes: 0,
        delayReason: '',
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: 'Pojazd wymaga naprawy',
        timezone: 'Europe/Warsaw',
      };

      const result = reportFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Field Length Validation', () => {
    it('should reject delayReason > 1000 chars', () => {
      const longText = 'a'.repeat(1001);
      const data = {
        isProblem: true,
        routeStatus: 'COMPLETED' as const,
        delayMinutes: 30,
        delayReason: longText,
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        timezone: 'Europe/Warsaw',
      };

      const result = reportFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('1000');
      }
    });

    it('should accept exactly 1000 chars', () => {
      const text1000 = 'a'.repeat(1000);
      const data = {
        isProblem: true,
        routeStatus: 'COMPLETED' as const,
        delayMinutes: 30,
        delayReason: text1000,
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        timezone: 'Europe/Warsaw',
      };

      const result = reportFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Route Status Validation', () => {
    it('should accept all valid route statuses', () => {
      const statuses = ['COMPLETED', 'PARTIALLY_COMPLETED', 'CANCELLED'] as const;

      statuses.forEach(status => {
        const data = {
          isProblem: true,
          routeStatus: status,
          delayMinutes: 0,
          delayReason: '',
          cargoDamageDescription: null,
          vehicleDamageDescription: null,
          nextDayBlockers: status === 'PARTIALLY_COMPLETED' ? 'blocker' : null,
          timezone: 'Europe/Warsaw',
        };

        const result = reportFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Timezone Validation', () => {
    it('should require timezone', () => {
      const data = {
        isProblem: false,
        routeStatus: 'COMPLETED' as const,
        delayMinutes: 0,
        delayReason: '',
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        timezone: '',
      };

      const result = reportFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('timezone');
      }
    });
  });
});


