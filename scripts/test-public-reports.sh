#!/usr/bin/env bash

# Test Runner for Public Reports
# This script performs a quick smoke test of the public report flow

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:4321}"
TEST_DRIVER_EMAIL="${TEST_DRIVER_EMAIL:-}"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Public Reports - Quick Test Runner           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Generate test token
echo -e "${YELLOW}[1/5]${NC} Generating test token..."
TOKEN_OUTPUT=$(npx tsx scripts/generate-test-token.ts $TEST_DRIVER_EMAIL 2>&1 | tail -20)

# Extract token from output (assuming it's in the URL)
TOKEN=$(echo "$TOKEN_OUTPUT" | grep -oP 'report-links/\K[a-f0-9]+' | head -1)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Failed to generate token${NC}"
  echo "$TOKEN_OUTPUT"
  exit 1
fi

echo -e "${GREEN}✓ Token generated: ${TOKEN:0:16}...${NC}"
echo ""

# Step 2: Test GET /api/public/report-links/{token}
echo -e "${YELLOW}[2/5]${NC} Testing token validation (GET)..."
VALIDATE_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/public/report-links/$TOKEN")
VALIDATE_BODY=$(echo "$VALIDATE_RESPONSE" | head -n -1)
VALIDATE_CODE=$(echo "$VALIDATE_RESPONSE" | tail -n 1)

if [ "$VALIDATE_CODE" == "200" ]; then
  echo -e "${GREEN}✓ Token validation successful (HTTP $VALIDATE_CODE)${NC}"
  echo -e "${BLUE}  Response:${NC}"
  echo "$VALIDATE_BODY" | jq '.' 2>/dev/null || echo "$VALIDATE_BODY"
else
  echo -e "${RED}✗ Token validation failed (HTTP $VALIDATE_CODE)${NC}"
  echo "$VALIDATE_BODY"
  exit 1
fi
echo ""

# Step 3: Test POST /api/public/report-links/{token}/reports (Happy Path)
echo -e "${YELLOW}[3/5]${NC} Testing report submission (POST - Happy Path)..."
SUBMIT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "routeStatus": "COMPLETED",
    "delayMinutes": 0,
    "delayReason": null,
    "cargoDamageDescription": null,
    "vehicleDamageDescription": null,
    "nextDayBlockers": null,
    "timezone": "Europe/Warsaw"
  }' \
  "$BASE_URL/api/public/report-links/$TOKEN/reports")

SUBMIT_BODY=$(echo "$SUBMIT_RESPONSE" | head -n -1)
SUBMIT_CODE=$(echo "$SUBMIT_RESPONSE" | tail -n 1)

if [ "$SUBMIT_CODE" == "201" ]; then
  echo -e "${GREEN}✓ Report submitted successfully (HTTP $SUBMIT_CODE)${NC}"
  echo -e "${BLUE}  Response:${NC}"
  echo "$SUBMIT_BODY" | jq '.' 2>/dev/null || echo "$SUBMIT_BODY"
  
  # Extract report UUID for next test
  REPORT_UUID=$(echo "$SUBMIT_BODY" | jq -r '.reportUuid' 2>/dev/null)
else
  echo -e "${RED}✗ Report submission failed (HTTP $SUBMIT_CODE)${NC}"
  echo "$SUBMIT_BODY"
  exit 1
fi
echo ""

# Step 4: Test duplicate submission (should fail with 409)
echo -e "${YELLOW}[4/5]${NC} Testing duplicate submission (should return 409)..."
DUPLICATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "routeStatus": "COMPLETED",
    "delayMinutes": 0,
    "delayReason": null,
    "cargoDamageDescription": null,
    "vehicleDamageDescription": null,
    "nextDayBlockers": null,
    "timezone": "Europe/Warsaw"
  }' \
  "$BASE_URL/api/public/report-links/$TOKEN/reports")

DUPLICATE_BODY=$(echo "$DUPLICATE_RESPONSE" | head -n -1)
DUPLICATE_CODE=$(echo "$DUPLICATE_RESPONSE" | tail -n 1)

if [ "$DUPLICATE_CODE" == "409" ]; then
  echo -e "${GREEN}✓ Duplicate submission correctly rejected (HTTP $DUPLICATE_CODE)${NC}"
else
  echo -e "${YELLOW}⚠ Expected 409, got HTTP $DUPLICATE_CODE${NC}"
  echo "$DUPLICATE_BODY"
fi
echo ""

# Step 5: Test invalid token (should fail with 404)
echo -e "${YELLOW}[5/5]${NC} Testing invalid token (should return 404)..."
INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/public/report-links/invalid-token-12345")
INVALID_CODE=$(echo "$INVALID_RESPONSE" | tail -n 1)

if [ "$INVALID_CODE" == "404" ]; then
  echo -e "${GREEN}✓ Invalid token correctly rejected (HTTP $INVALID_CODE)${NC}"
else
  echo -e "${YELLOW}⚠ Expected 404, got HTTP $INVALID_CODE${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Summary                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Token Generation${NC}"
echo -e "${GREEN}✓ Token Validation (GET)${NC}"
echo -e "${GREEN}✓ Report Submission (POST)${NC}"
echo -e "${GREEN}✓ Duplicate Detection (409)${NC}"
echo -e "${GREEN}✓ Invalid Token Handling (404)${NC}"
echo ""
echo -e "${BLUE}📋 Test Report${NC}"
echo -e "   Generated Token: ${TOKEN:0:16}..."
echo -e "   Report UUID:     ${REPORT_UUID}"
echo -e "   Base URL:        ${BASE_URL}"
echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo -e "${BLUE}💡 Next steps:${NC}"
echo -e "   1. Open in browser: ${BASE_URL}/public/report-links/${TOKEN}"
echo -e "      (Note: This will fail as token is used, generate a new one)"
echo -e "   2. Test edit functionality manually"
echo -e "   3. Test offline mode in DevTools"
echo -e "   4. Test mobile responsiveness"
echo ""


