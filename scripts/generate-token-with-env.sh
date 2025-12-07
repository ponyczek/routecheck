#!/usr/bin/env bash

# Wrapper script to load .env and run generate-test-token.ts
# Usage: ./scripts/generate-token-with-env.sh [driver-email]

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Check if .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  echo "❌ File .env not found!"
  echo ""
  echo "Please create a .env file with the following variables:"
  echo ""
  echo "PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
  echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
  echo "PRIVATE_TOKEN_PEPPER=your-random-pepper-string"
  echo ""
  echo "See docs/env-setup-troubleshooting.md for help."
  exit 1
fi

# Load .env file
echo "📂 Loading environment variables from .env..."
export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | grep -v '^$' | xargs)

# Check if required variables are set
if [ -z "$PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing required environment variables!"
  echo ""
  echo "Required variables:"
  echo "  - PUBLIC_SUPABASE_URL"
  echo "  - SUPABASE_SERVICE_ROLE_KEY"
  echo ""
  echo "Optional variables:"
  echo "  - PRIVATE_TOKEN_PEPPER (will use dev default if not set)"
  echo ""
  echo "See docs/env-setup-troubleshooting.md for help."
  exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Run the script
cd "$PROJECT_ROOT"
npx tsx scripts/generate-test-token.ts "$@"


