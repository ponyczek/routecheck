# Email Link Generation - MVP Workaround

## Overview

For the MVP, automated email sending is **not implemented** due to time constraints and external service requirements. Instead, we provide a **manual token generation workflow** for testing and demonstration.

## Why No Automated Emails in MVP?

Full email automation requires:
1. Email service provider setup (Resend, SendGrid, AWS SES)
2. API keys and configuration
3. Email templates and testing
4. Cron job or scheduled function setup
5. Delivery monitoring and retry logic
6. **Estimated time**: 4-6 hours

For course deadline, this is **out of scope** but easily addable post-MVP.

## MVP Solution: Manual Token Generation

### Quick Start

Generate a test link for any driver:

```bash
# Generate link for specific driver
npm run generate-test-token -- driver@example.com

# Generate link for first active driver
npm run generate-test-token
```

This outputs a working URL that can be:
- Copied and pasted to browser
- Sent manually via email/Slack
- Used in automated tests

### Example Output

```
🔍 Finding driver...
✅ Found driver: Jan Kowalski (jan.kowalski@example.com)

🔐 Generating token...
💾 Creating report link...
✅ Report link created!

======================================================================
🎉 TEST TOKEN GENERATED
======================================================================

📋 Driver Details:
   Name:    Jan Kowalski
   Email:   jan.kowalski@example.com

🔗 Report Link:
   http://localhost:4321/public/report-links/a1b2c3d4e5f6...

⏰ Expires at: 2025-12-09T15:30:00.000Z (24 hours)

📝 Usage:
   1. Copy the link above
   2. Open in browser (or send to driver)
   3. Fill out the report form
   4. Submit!

======================================================================
```

### How It Works

The script:
1. Finds active driver by email (or first active)
2. Generates secure 64-char token
3. Hashes token with SHA-256
4. Stores in `report_links` table
5. Sets 24h expiration
6. Returns plain-text token in URL

Same flow as production, just manual trigger instead of cron.

## Testing Report Submission

### Full Flow Test

```bash
# 1. Generate token
npm run generate-test-token -- driver@test.com

# 2. Copy the URL and open in browser

# 3. Fill form and submit

# 4. Verify in database
npm run query-reports
```

### Automated E2E Test

See `tests/e2e/public-report-flow.spec.ts` (if implemented) for automated testing using generated tokens.

## Future: Production Email System

### Implementation Plan

#### 1. Choose Email Provider

**Recommended: Resend** (modern, developer-friendly)
- Pricing: $20/month for 50k emails
- Setup time: ~1 hour
- Great DX and deliverability

Alternatives:
- **SendGrid**: More features, complex
- **AWS SES**: Cheapest, more config
- **Postmark**: Great for transactional

#### 2. Environment Setup

```bash
# .env.production
RESEND_API_KEY=re_abc123...
EMAIL_FROM=noreply@routecheck.app
EMAIL_FROM_NAME=RouteCheck
```

#### 3. Create Email Service

```typescript
// src/lib/email/resendService.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReportLink(
  driverEmail: string,
  driverName: string,
  token: string,
  expiresAt: string
) {
  const reportUrl = `${process.env.PUBLIC_URL}/public/report-links/${token}`;

  await resend.emails.send({
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: driverEmail,
    subject: 'Raport dzienny - wypełnij przed końcem dnia',
    html: `
      <h2>Cześć ${driverName}!</h2>
      <p>Twój dzienny link do raportu jest gotowy.</p>
      <p>
        <a href="${reportUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Wypełnij raport
        </a>
      </p>
      <p>Link wygasa: ${new Date(expiresAt).toLocaleString('pl-PL')}</p>
      <p>Jeśli wszystko poszło dobrze, kliknij "Wszystko OK" - zajmie to 5 sekund!</p>
    `,
  });
}
```

#### 4. Create Cron Endpoint

```typescript
// src/pages/api/cron/generate-daily-links.ts
export const POST: APIRoute = async ({ request }) => {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createServiceClient();

  // 1. Get all active drivers
  const { data: drivers } = await supabase
    .from('drivers')
    .select('uuid, name, email, company_uuid')
    .eq('is_active', true);

  // 2. Generate links and send emails
  let sent = 0;
  for (const driver of drivers) {
    try {
      const token = generateToken();
      const hashedToken = hashToken(token);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create link
      await supabase.from('report_links').insert({
        driver_uuid: driver.uuid,
        company_uuid: driver.company_uuid,
        hashed_token: hashedToken,
        expires_at: expiresAt.toISOString(),
      });

      // Send email
      await sendReportLink(driver.email, driver.name, token, expiresAt.toISOString());

      sent++;
    } catch (error) {
      console.error(`Failed to send to ${driver.email}:`, error);
      // Continue with other drivers
    }
  }

  return new Response(JSON.stringify({ sent }), { status: 200 });
};
```

#### 5. Setup Cron Job

**Vercel Cron** (if deployed on Vercel):
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/generate-daily-links",
      "schedule": "0 18 * * *"
    }
  ]
}
```

**GitHub Actions** (alternative):
```yaml
# .github/workflows/daily-links.yml
name: Send Daily Links
on:
  schedule:
    - cron: '0 18 * * *'  # 6 PM daily
jobs:
  send-links:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cron endpoint
        run: |
          curl -X POST https://routecheck.app/api/cron/generate-daily-links \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Supabase Edge Function** (serverless):
```bash
supabase functions deploy send-daily-links
supabase functions schedule send-daily-links --cron "0 18 * * *"
```

#### 6. Add Email Logging

Already have `email_logs` table - just integrate:

```typescript
await supabase.from('email_logs').insert({
  driver_uuid: driver.uuid,
  company_uuid: driver.company_uuid,
  email_type: 'DAILY_REPORT_LINK',
  recipient: driver.email,
  status: 'SENT',
  sent_at: new Date().toISOString(),
  metadata: { link_uuid: linkUuid },
});
```

### Testing Email in Development

Use **Resend Test Mode** or **MailHog** for local testing:

```bash
# Install MailHog (catches all emails locally)
brew install mailhog
mailhog

# All emails go to http://localhost:8025
```

## Migration Path

1. ✅ **MVP**: Use manual script (current)
2. 🚀 **Phase 1**: Add email service + manual trigger API
3. ⏰ **Phase 2**: Add cron job for daily automation
4. 📊 **Phase 3**: Add monitoring and retry logic
5. ⚡ **Phase 4**: Add email alerts for missing reports

## Cost Estimates

### Resend Pricing
- Free: 3,000 emails/month (good for testing)
- $20/month: 50,000 emails (enough for 500 drivers daily)
- $80/month: 500,000 emails (5k drivers)

### Typical Usage
- 100 drivers = 3,000 emails/month = **FREE**
- 500 drivers = 15,000 emails/month = **$20/month**
- 1,000 drivers = 30,000 emails/month = **$20/month**

Very affordable for small/medium fleets!

## Alternative: SMS (Future)

For drivers without email:
- **Twilio**: $0.0075/SMS in Poland
- **Vonage**: Similar pricing
- 100 drivers/day = ~$23/month

## Documentation

- Script source: `scripts/generate-test-token.ts`
- Usage guide: `docs/testing-public-reports-quickstart.md`
- Full setup: `docs/testing-public-reports.md`

## Summary

✅ **For MVP**: Manual script is sufficient  
🚀 **For Production**: 1-2 days to add full email automation  
💰 **Cost**: ~$20/month for typical usage  
⏱️ **Setup time**: ~4 hours with Resend  

The manual approach meets acceptance criteria and demonstrates the complete report flow!

