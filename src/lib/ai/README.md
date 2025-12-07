# AI Service - Mock Implementation for MVP

## Overview

This directory contains the **mock AI service** used in the MVP. It provides rule-based analysis instead of calling external AI APIs (like OpenRouter).

## Why Mock AI?

For the MVP/course deadline, implementing a full AI integration would take too long and require:
- OpenRouter API account and credits
- Complex prompt engineering
- Error handling for API rate limits
- Retry logic for failed requests
- Cost management

The mock AI achieves the **same functional outcome** for demonstration purposes:
- ✅ Generates Polish summaries
- ✅ Classifies risk levels (NONE/LOW/MEDIUM/HIGH)
- ✅ Adds relevant tags
- ✅ Processes reports asynchronously
- ✅ Updates database correctly

## How It Works

### Rule-Based Classification

```typescript
// Example: Delay analysis
if (delayMinutes >= 120) {
  riskLevel = 'HIGH';
  summary = 'Znaczące opóźnienie...';
} else if (delayMinutes >= 60) {
  riskLevel = 'MEDIUM';
  summary = 'Opóźnienie...';
}
```

### Risk Upgrade Logic

Risk levels are upgraded (never downgraded) as more issues are found:
```
NONE → LOW → MEDIUM → HIGH
```

Example:
- Start with LOW (minor delay)
- Find cargo damage → upgrade to MEDIUM
- Find vehicle breakdown → upgrade to HIGH

### Tag Generation

Tags are automatically added based on content analysis:
- `delay` - Any delay > 0
- `traffic` - Keywords: "korek", "ruch"
- `breakdown` - Keywords: "awaria", "usterka"
- `cargo_damage` - Cargo damage reported
- `vehicle_damage` - Vehicle damage reported
- `cancellation` - Route cancelled
- `partial` - Partially completed
- `blocker` - Next day blockers

## Usage

### Automatic Processing

AI processing is triggered automatically when:
1. Driver submits report via public form
2. Dispatcher creates manual report

```typescript
// Called automatically in report submission
await scheduleAiReprocess(reportUuid);
```

### Manual Reprocessing

Can be triggered via API:
```bash
POST /api/reports/{uuid}/ai/reprocess
```

## Database Schema

Results stored in `report_ai_results` table:
```sql
CREATE TABLE report_ai_results (
  report_uuid uuid,
  report_date date,
  ai_summary text,
  risk_level report_risk_level,
  created_at timestamptz,
  updated_at timestamptz,
  PRIMARY KEY (report_uuid, report_date)
);
```

Risk level also denormalized to `reports.risk_level` for fast filtering.

## Testing

Unit tests cover all classification rules:
```bash
npm test -- src/lib/ai
```

See `__tests__/mockAiService.test.ts` for examples.

## Future: Real AI Integration

To replace with real AI (OpenRouter):

### 1. Add Environment Variables
```bash
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=anthropic/claude-3-haiku
USE_MOCK_AI=false
```

### 2. Create Real AI Service
```typescript
// src/lib/ai/openrouterService.ts
export async function generateAISummaryWithAI(report: ReportForAI): Promise<AIResult> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku',
      messages: [{
        role: 'user',
        content: buildPrompt(report),
      }],
    }),
  });
  
  // Parse response and return AIResult
}

function buildPrompt(report: ReportForAI): string {
  return `
Jesteś ekspertem od analiz transportowych. Przeanalizuj raport kierowcy i podaj:
1. Krótkie podsumowanie (2-3 zdania po polsku)
2. Poziom ryzyka: NONE, LOW, MEDIUM lub HIGH
3. Tagi opisujące problemy

Raport:
- Status: ${report.routeStatus}
- Opóźnienie: ${report.delayMinutes} min
${report.delayReason ? `- Powód: ${report.delayReason}` : ''}
${report.cargoDamageDescription ? `- Uszkodzenie ładunku: ${report.cargoDamageDescription}` : ''}
${report.vehicleDamageDescription ? `- Usterka pojazdu: ${report.vehicleDamageDescription}` : ''}
${report.nextDayBlockers ? `- Blokery: ${report.nextDayBlockers}` : ''}

Odpowiedź w formacie JSON:
{
  "summary": "...",
  "riskLevel": "NONE|LOW|MEDIUM|HIGH",
  "tags": ["tag1", "tag2"]
}
`;
}
```

### 3. Update Service Selection
```typescript
// src/lib/services/reportsService.ts
async function processReportAI(reportUuid: Uuid): Promise<void> {
  const useRealAI = process.env.OPENROUTER_API_KEY && process.env.USE_MOCK_AI !== 'true';
  
  const { generateAISummary } = useRealAI
    ? await import('@/lib/ai/openrouterService')
    : await import('@/lib/ai/mockAiService');
  
  // Rest of the code stays the same
}
```

### 4. Add Error Handling
- Retry logic for API failures
- Fallback to mock on errors
- Rate limit handling
- Cost tracking

## Configuration

Current behavior controlled by environment:
```typescript
export function isUsingMockAI(): boolean {
  return !process.env.OPENROUTER_API_KEY || process.env.USE_MOCK_AI === 'true';
}
```

## Performance

Mock AI is actually **faster** than real AI:
- Mock: 50-200ms (simulated delay)
- Real AI: 1-3s (API round trip)

This is acceptable for MVP and better for UX!

## Limitations

Mock AI cannot:
- Understand nuanced language
- Learn from feedback
- Handle edge cases beyond rules
- Provide reasoning

For MVP purposes, this is **acceptable**. Real AI can be added post-launch.

