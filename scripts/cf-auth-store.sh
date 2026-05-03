#!/bin/bash
# cf-auth-store.sh
# Stores Cloudflare credentials in Config Service for later retrieval
#
# Usage:
#   scripts/cf-auth-store.sh
#   # Will prompt for token or use current wrangler OAuth token

set -e

CONFIG_SERVICE_URL="${CONFIG_SERVICE_URL:-https://api.example.com}"
API_KEY="${DE_API_KEY:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

# Check if we have an API key
if [ -z "$API_KEY" ]; then
    # Try to read from .env file
    if [ -f ".env" ]; then
        API_KEY=$(grep "^DE_API_KEY=" .env 2>/dev/null | cut -d'=' -f2)
    fi

    # Try home directory
    if [ -z "$API_KEY" ] && [ -f "$HOME/.de-credentials" ]; then
        API_KEY=$(grep "^DE_API_KEY=" "$HOME/.de-credentials" 2>/dev/null | cut -d'=' -f2)
    fi
fi

if [ -z "$API_KEY" ]; then
    print_error "No API key found. Set DE_API_KEY environment variable or add to .env file"
    exit 1
fi

# Get Cloudflare API token
CF_TOKEN=""

# Check if passed as argument
if [ -n "$1" ]; then
    CF_TOKEN="$1"
fi

# Check environment variable
if [ -z "$CF_TOKEN" ] && [ -n "$CLOUDFLARE_API_TOKEN" ]; then
    CF_TOKEN="$CLOUDFLARE_API_TOKEN"
    print_status "Using CLOUDFLARE_API_TOKEN from environment"
fi

# Try to extract from wrangler OAuth config
if [ -z "$CF_TOKEN" ]; then
    WRANGLER_CONFIG="$HOME/.wrangler/config/default.toml"
    if [ -f "$WRANGLER_CONFIG" ]; then
        OAUTH_TOKEN=$(grep "^oauth_token" "$WRANGLER_CONFIG" 2>/dev/null | cut -d'"' -f2)
        if [ -n "$OAUTH_TOKEN" ]; then
            print_warning "Found OAuth token in wrangler config"
            print_warning "Note: OAuth tokens expire. Consider creating an API token instead."
            read -p "Use OAuth token? (y/n): " USE_OAUTH
            if [ "$USE_OAUTH" = "y" ]; then
                CF_TOKEN="$OAUTH_TOKEN"
            fi
        fi
    fi
fi

# Prompt user if still no token
if [ -z "$CF_TOKEN" ]; then
    echo ""
    echo "Enter your Cloudflare API Token:"
    echo "(Create one at: https://dash.cloudflare.com/profile/api-tokens)"
    echo ""
    read -s -p "Token: " CF_TOKEN
    echo ""
fi

if [ -z "$CF_TOKEN" ]; then
    print_error "No Cloudflare token provided"
    exit 1
fi

# Store the token
print_status "Storing Cloudflare API token..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${CONFIG_SERVICE_URL}/dev-credentials" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"credential_type\": \"cloudflare_api_token\", \"value\": \"$CF_TOKEN\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_status "Cloudflare API token stored successfully!"
else
    print_error "Failed to store token: $BODY"
    exit 1
fi

# Store account ID if provided
CF_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-52b1c60ff2a24fb21c1ef9a429e63261}"
print_status "Storing Cloudflare Account ID: $CF_ACCOUNT_ID"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${CONFIG_SERVICE_URL}/dev-credentials" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"credential_type\": \"cloudflare_account_id\", \"value\": \"$CF_ACCOUNT_ID\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    print_status "Cloudflare Account ID stored successfully!"
else
    print_warning "Failed to store account ID (non-critical)"
fi

echo ""
print_status "Done! You can now use: source scripts/cf-auth-setup.sh"
