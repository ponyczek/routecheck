import { describe, it, expect } from 'vitest';
import { generateAISummary } from '../mockAiService';
import type { ReportForAI } from '../mockAiService';

describe('mockAiService', () => {
  describe('generateAISummary', () => {
    it('should classify happy path as NONE risk', async () => {
      const report: ReportForAI = {
        routeStatus: 'COMPLETED',
        delayMinutes: 0,
        delayReason: null,
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        isProblem: false,
      };

      const result = await generateAISummary(report);

      expect(result.riskLevel).toBe('NONE');
      expect(result.aiSummary).toContain('bez problemów');
      expect(result.tags).toHaveLength(0);
    });

    it('should classify minor delay as LOW risk', async () => {
      const report: ReportForAI = {
        routeStatus: 'COMPLETED',
        delayMinutes: 20,
        delayReason: 'Korek na autostradzie',
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        isProblem: true,
      };

      const result = await generateAISummary(report);

      expect(result.riskLevel).toBe('LOW');
      expect(result.aiSummary).toContain('20 min');
      expect(result.tags).toContain('delay');
      expect(result.tags).toContain('traffic');
    });

    it('should classify major delay as HIGH risk', async () => {
      const report: ReportForAI = {
        routeStatus: 'COMPLETED',
        delayMinutes: 150,
        delayReason: 'Awaria pojazdu',
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        isProblem: true,
      };

      const result = await generateAISummary(report);

      expect(result.riskLevel).toBe('HIGH');
      expect(result.aiSummary).toContain('Znaczące opóźnienie');
      expect(result.tags).toContain('delay');
      expect(result.tags).toContain('breakdown');
    });

    it('should classify cargo damage as MEDIUM risk', async () => {
      const report: ReportForAI = {
        routeStatus: 'COMPLETED',
        delayMinutes: 0,
        delayReason: null,
        cargoDamageDescription: 'Uszkodzenie opakowania',
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        isProblem: true,
      };

      const result = await generateAISummary(report);

      expect(result.riskLevel).toBe('MEDIUM');
      expect(result.aiSummary).toContain('uszkodzenie ładunku');
      expect(result.tags).toContain('cargo_damage');
    });

    it('should classify cancelled route as HIGH risk', async () => {
      const report: ReportForAI = {
        routeStatus: 'CANCELLED',
        delayMinutes: 0,
        delayReason: 'Klient anulował zamówienie',
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        isProblem: true,
      };

      const result = await generateAISummary(report);

      expect(result.riskLevel).toBe('HIGH');
      expect(result.aiSummary).toContain('anulowana');
      expect(result.tags).toContain('cancellation');
    });

    it('should classify partially completed as MEDIUM risk', async () => {
      const report: ReportForAI = {
        routeStatus: 'PARTIALLY_COMPLETED',
        delayMinutes: 30,
        delayReason: null,
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: 'Brak dostępu do magazynu',
        isProblem: true,
      };

      const result = await generateAISummary(report);

      expect(result.riskLevel).toBe('MEDIUM');
      expect(result.aiSummary).toContain('częściowo');
      expect(result.tags).toContain('partial');
    });

    it('should handle multiple issues and upgrade risk appropriately', async () => {
      const report: ReportForAI = {
        routeStatus: 'COMPLETED',
        delayMinutes: 90,
        delayReason: 'Awaria',
        cargoDamageDescription: 'Uszkodzony ładunek',
        vehicleDamageDescription: 'Pęknięta szyba',
        nextDayBlockers: null,
        isProblem: true,
      };

      const result = await generateAISummary(report);

      // Multiple medium issues should result in MEDIUM or HIGH
      expect(['MEDIUM', 'HIGH']).toContain(result.riskLevel);
      expect(result.tags.length).toBeGreaterThan(2);
      expect(result.tags).toContain('delay');
      expect(result.tags).toContain('cargo_damage');
      expect(result.tags).toContain('vehicle_damage');
    });

    it('should remove duplicate tags', async () => {
      const report: ReportForAI = {
        routeStatus: 'COMPLETED',
        delayMinutes: 45,
        delayReason: 'Korek w ruchu miejskim',
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        isProblem: true,
      };

      const result = await generateAISummary(report);

      // Check that tags are unique
      const uniqueTags = Array.from(new Set(result.tags));
      expect(result.tags).toEqual(uniqueTags);
    });

    it('should truncate very long summaries', async () => {
      const longReason = 'A'.repeat(300);
      const report: ReportForAI = {
        routeStatus: 'CANCELLED',
        delayMinutes: 200,
        delayReason: longReason,
        cargoDamageDescription: 'Damage',
        vehicleDamageDescription: 'More damage',
        nextDayBlockers: 'Blockers',
        isProblem: true,
      };

      const result = await generateAISummary(report);

      expect(result.aiSummary.length).toBeLessThanOrEqual(200);
    });
  });
});

