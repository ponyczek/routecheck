import { describe, it, expect } from 'vitest';
import { assignmentFormSchema } from '../assignmentFormSchema';

describe('assignmentFormSchema', () => {
  describe('driverUuid validation', () => {
    it('should accept valid UUID', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '123e4567-e89b-12d3-a456-426614174000',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-15',
        endDate: '2024-02-15',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: 'not-a-uuid',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-15',
        endDate: '2024-02-15',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Wybierz kierowcę');
      }
    });

    it('should reject empty driverUuid', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-15',
        endDate: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('vehicleUuid validation', () => {
    it('should accept valid UUID', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '123e4567-e89b-12d3-a456-426614174000',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-15',
        endDate: '',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '123e4567-e89b-12d3-a456-426614174000',
        vehicleUuid: 'invalid-uuid',
        startDate: '2024-01-15',
        endDate: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Wybierz pojazd');
      }
    });
  });

  describe('startDate validation', () => {
    it('should accept valid date in YYYY-MM-DD format', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '123e4567-e89b-12d3-a456-426614174000',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-15',
        endDate: '',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '123e4567-e89b-12d3-a456-426614174000',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '15-01-2024',
        endDate: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Nieprawidłowy format daty');
      }
    });

    it('should reject empty startDate', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '123e4567-e89b-12d3-a456-426614174000',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '',
        endDate: '',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid date (like 2024-13-32)', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '123e4567-e89b-12d3-a456-426614174000',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-13-32',
        endDate: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Nieprawidłowa data');
      }
    });
  });

  describe('endDate validation', () => {
    it('should accept valid endDate', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '123e4567-e89b-12d3-a456-426614174000',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-15',
        endDate: '2024-02-15',
      });

      expect(result.success).toBe(true);
    });

    it('should accept empty endDate (bezterminowe)', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '123e4567-e89b-12d3-a456-426614174000',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-15',
        endDate: '',
      });

      expect(result.success).toBe(true);
    });

    it('should reject endDate before startDate', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '123e4567-e89b-12d3-a456-426614174000',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-02-15',
        endDate: '2024-01-15',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Data zakończenia musi być późniejsza');
      }
    });

    it('should accept endDate equal to startDate', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '123e4567-e89b-12d3-a456-426614174000',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-15',
        endDate: '2024-01-15',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('complete form validation', () => {
    it('should accept valid complete form', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '123e4567-e89b-12d3-a456-426614174000',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-15',
        endDate: '2024-12-31',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          driverUuid: '123e4567-e89b-12d3-a456-426614174000',
          vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
          startDate: '2024-01-15',
          endDate: '2024-12-31',
        });
      }
    });

    it('should accept valid form without endDate', () => {
      const result = assignmentFormSchema.safeParse({
        driverUuid: '123e4567-e89b-12d3-a456-426614174000',
        vehicleUuid: '123e4567-e89b-12d3-a456-426614174001',
        startDate: '2024-01-15',
        endDate: '',
      });

      expect(result.success).toBe(true);
    });
  });
});


