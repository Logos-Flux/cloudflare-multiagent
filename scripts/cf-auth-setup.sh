#!/bin/bash
# cf-auth-setup.sh
# Fetches Cloudflare credentials from Config Service and sets up local environment
#
# Usage:
#   source scripts/cf-auth-setup.sh
#   # or
#   eval $(scripts/cf-auth-setup.sh --export)

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
        API_KEY=$(grep "^DE_API_KEY=" .env | cut -d'=' -f2)
    fi

    # Try home directory
    if [ -z "$API_KEY" ] && [ -f "$HOME/.de-credentials" ]; then
        API_KEY=$(grep "^DE_API_KEY=" "$HOME/.de-credentials" | cut -d'=' -f2)
    fi
fi

if [ -z "$API_KEY" ]; then
    print_error "No API key found. Set DE_API_KEY environment variable or add to .env file"
    print_warning "You can get an API key from the Admin Panel: https://admin.example.com"
    exit 1
fi

# Function to fetch a credential
fetch_credential() {
    local cred_type=$1
    local response

    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $API_KEY" \
        "${CONFIG_SERVICE_URL}/dev-credentials/${cred_type}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        echo "$body" | grep -o '"value":"[^"]*"' | cut -d'"' -f4
    else
        echo ""
    fi
}

# Check if --export flag is passed
EXPORT_MODE=false
if [ "$1" = "--export" ]; then
    EXPORT_MODE=true
fi

# Fetch credentials
print_status "Fetching Cloudflare credentials from Config Service..." >&2

CF_API_TOKEN=$(fetch_credential "cloudflare_api_token")
CF_ACCOUNT_ID=$(fetch_credential "cloudflare_account_id")

if [ -z "$CF_API_TOKEN" ]; then
    print_error "Could not fetch cloudflare_api_token"
    print_warning "Store it first with:"
    print_warning "  curl -X POST ${CONFIG_SERVICE_URL}/dev-credentials \\"
    print_warning "    -H 'Authorization: Bearer YOUR_API_KEY' \\"
    print_warning "    -H 'Content-Type: application/json' \\"
    print_warning "    -d '{\"credential_type\": \"cloudflare_api_token\", \"value\": \"YOUR_CF_TOKEN\"}'"
    exit 1
fi

if [ -z "$CF_ACCOUNT_ID" ]; then
    # Use default if not stored
    CF_ACCOUNT_ID="52b1c60ff2a24fb21c1ef9a429e63261"
    print_warning "Using default account ID: $CF_ACCOUNT_ID" >&2
fi

if [ "$EXPORT_MODE" = true ]; then
    # Output export commands for eval
    echo "export CLOUDFLARE_API_TOKEN='$CF_API_TOKEN'"
    echo "export CLOUDFLARE_ACCOUNT_ID='$CF_ACCOUNT_ID'"
else
    # Set in current shell
    export CLOUDFLARE_API_TOKEN="$CF_API_TOKEN"
    export CLOUDFLARE_ACCOUNT_ID="$CF_ACCOUNT_ID"

    print_status "Cloudflare credentials loaded!" >&2
    print_status "CLOUDFLARE_API_TOKEN: ${CF_API_TOKEN:0:20}..." >&2
    print_status "CLOUDFLARE_ACCOUNT_ID: $CF_ACCOUNT_ID" >&2

    # Verify with wrangler
    print_status "Verifying with wrangler..." >&2
    if npx wrangler whoami 2>/dev/null | grep -q "Account"; then
        print_status "Wrangler authenticated successfully!" >&2
    else
        print_warning "Wrangler verification failed - token may be invalid" >&2
    fi
fi
