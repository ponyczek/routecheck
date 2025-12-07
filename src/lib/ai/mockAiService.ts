/**
 * Mock AI Service for MVP
 * 
 * Provides rule-based "AI" summary and risk assessment for reports.
 * This is a simplified implementation that meets MVP requirements without
 * requiring external AI API integration (OpenRouter).
 * 
 * For production, replace with real AI service using OpenRouter.ai
 */

import type { ReportRiskLevel } from '@/types';

export interface ReportForAI {
  routeStatus: 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'CANCELLED';
  delayMinutes: number;
  delayReason: string | null;
  cargoDamageDescription: string | null;
  vehicleDamageDescription: string | null;
  nextDayBlockers: string | null;
  isProblem: boolean;
}

export interface AIResult {
  aiSummary: string;
  riskLevel: ReportRiskLevel;
  tags: string[];
}

/**
 * Generate mock AI summary and risk assessment
 * Uses rule-based logic to simulate AI analysis
 */
export async function generateAISummary(report: ReportForAI): Promise<AIResult> {
  // Simulate AI processing delay (50-200ms)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));

  let riskLevel: ReportRiskLevel = 'NONE';
  let summary = '';
  const tags: string[] = [];

  // ============================================
  // Rule 1: Route Status Analysis
  // ============================================
  
  if (report.routeStatus === 'CANCELLED') {
    riskLevel = 'HIGH';
    summary = 'Trasa została anulowana. ';
    tags.push('cancellation');
    
    if (report.delayReason) {
      summary += `Powód: ${report.delayReason}. `;
    }
    
    if (report.nextDayBlockers) {
      summary += 'Zgłoszono blokery na następny dzień.';
      riskLevel = 'HIGH';
    }
    
  } else if (report.routeStatus === 'PARTIALLY_COMPLETED') {
    riskLevel = 'MEDIUM';
    summary = 'Trasa wykonana częściowo. ';
    tags.push('partial');
    
    if (report.nextDayBlockers) {
      summary += `Blokery: ${report.nextDayBlockers}. `;
    }
    
  } else {
    // COMPLETED
    summary = 'Trasa wykonana. ';
  }

  // ============================================
  // Rule 2: Delay Analysis
  // ============================================
  
  if (report.delayMinutes > 0) {
    tags.push('delay');
    
    if (report.delayMinutes >= 120) {
      // 2+ hours
      riskLevel = upgradeRisk(riskLevel, 'HIGH');
      summary += `Znaczące opóźnienie ${report.delayMinutes} min. `;
      
    } else if (report.delayMinutes >= 60) {
      // 1-2 hours
      riskLevel = upgradeRisk(riskLevel, 'MEDIUM');
      summary += `Opóźnienie ${report.delayMinutes} min. `;
      
    } else if (report.delayMinutes >= 30) {
      // 30-60 min
      riskLevel = upgradeRisk(riskLevel, 'LOW');
      summary += `Niewielkie opóźnienie ${report.delayMinutes} min. `;
      
    } else {
      // <30 min
      riskLevel = upgradeRisk(riskLevel, 'LOW');
      summary += `Minimalne opóźnienie ${report.delayMinutes} min. `;
    }
    
    // Add delay reason if provided
    if (report.delayReason) {
      const reason = report.delayReason.toLowerCase();
      summary += `Przyczyna: ${report.delayReason}. `;
      
      // Analyze reason for additional tags
      if (reason.includes('korek') || reason.includes('ruch') || reason.includes('traffic')) {
        tags.push('traffic');
      } else if (reason.includes('awaria') || reason.includes('usterka')) {
        tags.push('breakdown');
        riskLevel = upgradeRisk(riskLevel, 'MEDIUM');
      } else if (reason.includes('pogoda') || reason.includes('weather')) {
        tags.push('weather');
      } else if (reason.includes('klient') || reason.includes('customer')) {
        tags.push('customer');
      }
    }
  }

  // ============================================
  // Rule 3: Damage Analysis
  // ============================================
  
  if (report.cargoDamageDescription) {
    tags.push('cargo_damage');
    riskLevel = upgradeRisk(riskLevel, 'MEDIUM');
    
    const damage = report.cargoDamageDescription.toLowerCase();
    
    if (damage.includes('całkowit') || damage.includes('total') || damage.includes('zniszcz')) {
      riskLevel = upgradeRisk(riskLevel, 'HIGH');
      summary += 'UWAGA: Poważne uszkodzenie ładunku! ';
    } else {
      summary += 'Zgłoszono uszkodzenie ładunku. ';
    }
  }
  
  if (report.vehicleDamageDescription) {
    tags.push('vehicle_damage');
    riskLevel = upgradeRisk(riskLevel, 'MEDIUM');
    
    const damage = report.vehicleDamageDescription.toLowerCase();
    
    if (damage.includes('awaria') || damage.includes('nie jedzie') || damage.includes('breakdown')) {
      riskLevel = upgradeRisk(riskLevel, 'HIGH');
      summary += 'UWAGA: Awaria pojazdu wymaga naprawy! ';
    } else {
      summary += 'Zgłoszono usterki pojazdu. ';
    }
  }

  // ============================================
  // Rule 4: Next Day Blockers
  // ============================================
  
  if (report.nextDayBlockers && report.routeStatus === 'COMPLETED') {
    tags.push('blocker');
    riskLevel = upgradeRisk(riskLevel, 'LOW');
    
    const blockers = report.nextDayBlockers.toLowerCase();
    
    if (blockers.includes('brak') || blockers.includes('nie mo') || blockers.includes('niemożliw')) {
      riskLevel = upgradeRisk(riskLevel, 'MEDIUM');
    }
    
    summary += 'Uwaga na następny dzień. ';
  }

  // ============================================
  // Rule 5: Happy Path (No Problems)
  // ============================================
  
  if (!report.isProblem && report.delayMinutes === 0) {
    riskLevel = 'NONE';
    summary = 'Trasa wykonana bez problemów. Wszystko zgodnie z planem.';
    tags.length = 0; // Clear any tags
  }

  // Trim and finalize summary
  summary = summary.trim();
  
  // Ensure summary is not too long (max 200 chars for readability)
  if (summary.length > 200) {
    summary = summary.substring(0, 197) + '...';
  }

  return {
    aiSummary: summary,
    riskLevel,
    tags: Array.from(new Set(tags)), // Remove duplicates
  };
}

/**
 * Upgrade risk level if new level is higher
 */
function upgradeRisk(current: ReportRiskLevel, proposed: ReportRiskLevel): ReportRiskLevel {
  const levels: ReportRiskLevel[] = ['NONE', 'LOW', 'MEDIUM', 'HIGH'];
  const currentIndex = levels.indexOf(current);
  const proposedIndex = levels.indexOf(proposed);
  
  return proposedIndex > currentIndex ? proposed : current;
}

/**
 * Check if mock AI is enabled
 * In production, you'd check env var to decide between mock and real AI
 */
export function isUsingMockAI(): boolean {
  return !process.env.OPENROUTER_API_KEY || process.env.USE_MOCK_AI === 'true';
}

