/**
 * Test Token Generator for Public Reports
 * 
 * This script helps you generate a valid report link token for testing.
 * 
 * Usage:
 *   npx tsx scripts/generate-test-token.ts [driver-email]
 * 
 * Environment variables required:
 *   - PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - PRIVATE_TOKEN_PEPPER (optional, defaults to dev value)
 * 
 * To load from .env file, run:
 *   export $(cat .env | grep -v '^#' | xargs) && npx tsx scripts/generate-test-token.ts
 * 
 * The script will:
 * 1. Find a driver by email (or use first available driver)
 * 2. Generate a secure token
 * 3. Insert it into report_links table
 * 4. Print the test URL
 */

import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';

// Load env variables
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN_PEPPER = process.env.PRIVATE_TOKEN_PEPPER || 'dev-pepper-change-in-production';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('   Required: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Hash token for storage (same as used in API)
 */
function hashToken(token: string): string {
  return createHash('sha256')
    .update(token + TOKEN_PEPPER)
    .digest('hex');
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Main function
 */
async function main() {
  const driverEmailArg = process.argv[2];

  console.log('🔍 Finding driver...');

  // Query for driver
  let query = supabase
    .from('drivers')
    .select('uuid, name, email, company_uuid')
    .eq('is_active', true);

  if (driverEmailArg) {
    query = query.eq('email', driverEmailArg);
  }

  const { data: drivers, error: driverError } = await query.limit(1);

  if (driverError) {
    console.error('❌ Error fetching driver:', driverError);
    process.exit(1);
  }

  if (!drivers || drivers.length === 0) {
    console.error('❌ No active drivers found!');
    if (driverEmailArg) {
      console.error(`   Tried to find driver with email: ${driverEmailArg}`);
    }
    console.error('   💡 Tip: Create a driver first or check the database');
    process.exit(1);
  }

  const driver = drivers[0];
  console.log(`✅ Found driver: ${driver.name} (${driver.email})`);

  // Generate token
  console.log('\n🔐 Generating token...');
  const plainToken = generateToken();
  const hashedToken = hashToken(plainToken);

  // Set expiration to 24 hours from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Insert report link
  console.log('💾 Creating report link...');
  const { data: reportLink, error: linkError } = await supabase
    .from('report_links')
    .insert({
      driver_uuid: driver.uuid,
      company_uuid: driver.company_uuid,
      hashed_token: hashedToken,
      expires_at: expiresAt.toISOString(),
    })
    .select('uuid')
    .single();

  if (linkError) {
    console.error('❌ Error creating report link:', linkError);
    process.exit(1);
  }

  console.log('✅ Report link created!');

  // Detect port from environment or use default
  const devPort = process.env.PORT || process.env.DEV_PORT || '4321';
  
  // Print results
  console.log('\n' + '='.repeat(70));
  console.log('🎉 TEST TOKEN GENERATED');
  console.log('='.repeat(70));
  console.log(`
📋 Driver Details:
   Name:    ${driver.name}
   Email:   ${driver.email}
   UUID:    ${driver.uuid}

🔗 Report Link Details:
   Link UUID:   ${reportLink.uuid}
   Expires:     ${expiresAt.toLocaleString()}
   Valid for:   24 hours

🌐 Test URLs:
   Local:       http://localhost:${devPort}/public/report-links/${plainToken}
   Production:  https://your-domain.com/public/report-links/${plainToken}

💡 Note: If your dev server runs on a different port, update the URL accordingly.

🎯 Quick Test Commands:
   # Test GET endpoint (validate token)
   curl http://localhost:${devPort}/api/public/report-links/${plainToken}

   # Test POST endpoint (submit report)
   curl -X POST http://localhost:${devPort}/api/public/report-links/${plainToken}/reports \\
     -H "Content-Type: application/json" \\
     -d '{
       "routeStatus": "COMPLETED",
       "delayMinutes": 0,
       "delayReason": null,
       "cargoDamageDescription": null,
       "vehicleDamageDescription": null,
       "nextDayBlockers": null,
       "timezone": "Europe/Warsaw"
     }'

💡 Tips:
   - Token is valid for 24 hours
   - Can only be used once
   - To generate another token, run this script again
   - Keep the plain token safe - it's not stored in the database!
`);
  console.log('='.repeat(70));
}

main().catch(console.error);

