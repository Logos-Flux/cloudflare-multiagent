#!/bin/bash

# Add New Service Automation Script
# Usage: ./add-service.sh <service-type> <subdomain> <project-name>
# Example: ./add-service.sh worker api my-api-worker
# Example: ./add-service.sh pages dashboard my-dashboard

set -e

# Configuration - Set these environment variables before running
DOMAIN="${CLOUDFLARE_DOMAIN:-your-domain.com}"
ZONE_ID="${CLOUDFLARE_ZONE_ID:-}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"

# Check required environment variables
if [ -z "$ZONE_ID" ]; then
  echo -e "${RED}Error: CLOUDFLARE_ZONE_ID environment variable not set${NC}"
  echo "Set it with: export CLOUDFLARE_ZONE_ID='your-zone-id'"
  exit 1
fi

if [ -z "$ACCOUNT_ID" ]; then
  echo -e "${RED}Error: CLOUDFLARE_ACCOUNT_ID environment variable not set${NC}"
  echo "Set it with: export CLOUDFLARE_ACCOUNT_ID='your-account-id'"
  exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if API token is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo -e "${RED}Error: CLOUDFLARE_API_TOKEN environment variable not set${NC}"
  echo ""
  echo "Set it with: export CLOUDFLARE_API_TOKEN='your-token-here'"
  echo "Or pass it inline: CLOUDFLARE_API_TOKEN='token' ./add-service.sh ..."
  exit 1
fi

# Parse arguments
SERVICE_TYPE="${1:-}"
SUBDOMAIN="${2:-}"
PROJECT_NAME="${3:-}"

# Validate arguments
if [ -z "$SERVICE_TYPE" ] || [ -z "$SUBDOMAIN" ]; then
  echo "Usage: $0 <service-type> <subdomain> [project-name]"
  echo ""
  echo "Service Types:"
  echo "  worker  - Cloudflare Worker (requires project-name)"
  echo "  pages   - Cloudflare Pages (requires project-name)"
  echo "  cname   - Just create DNS CNAME (requires target in project-name)"
  echo ""
  echo "Examples:"
  echo "  $0 worker api config-service"
  echo "  $0 pages monitoring monitoring-dashboard"
  echo "  $0 cname cdn cdn.example.com"
  exit 1
fi

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Add New Service: ${subdomain}.${DOMAIN}${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Step 1: Create DNS Record
echo -e "${YELLOW}Step 1: Creating DNS record...${NC}"

case "$SERVICE_TYPE" in
  worker)
    # Workers use CNAME to root domain for routing
    DNS_TARGET="$DOMAIN"
    ;;
  pages)
    if [ -z "$PROJECT_NAME" ]; then
      echo -e "${RED}Error: project-name required for pages service${NC}"
      exit 1
    fi
    # Pages uses CNAME to the .pages.dev domain
    DNS_TARGET="${PROJECT_NAME}.pages.dev"
    ;;
  cname)
    if [ -z "$PROJECT_NAME" ]; then
      echo -e "${RED}Error: target domain required for CNAME${NC}"
      exit 1
    fi
    DNS_TARGET="$PROJECT_NAME"
    ;;
  *)
    echo -e "${RED}Error: Unknown service type '$SERVICE_TYPE'${NC}"
    exit 1
    ;;
esac

echo "Creating CNAME: ${SUBDOMAIN}.${DOMAIN} → ${DNS_TARGET}"

DNS_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{
    \"type\": \"CNAME\",
    \"name\": \"$SUBDOMAIN\",
    \"content\": \"$DNS_TARGET\",
    \"ttl\": 1,
    \"proxied\": true
  }")

DNS_SUCCESS=$(echo "$DNS_RESPONSE" | jq -r '.success')

if [ "$DNS_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✓ DNS record created successfully${NC}"
else
  ERROR_MSG=$(echo "$DNS_RESPONSE" | jq -r '.errors[0].message // "Unknown error"')

  # Check if record already exists
  if echo "$ERROR_MSG" | grep -q "already exists"; then
    echo -e "${YELLOW}⚠ DNS record already exists, skipping...${NC}"
  else
    echo -e "${RED}✗ Failed to create DNS record: $ERROR_MSG${NC}"
    exit 1
  fi
fi

echo ""

# Step 2: Add custom domain to Pages project (if applicable)
if [ "$SERVICE_TYPE" = "pages" ]; then
  echo -e "${YELLOW}Step 2: Adding custom domain to Pages project...${NC}"

  CUSTOM_DOMAIN="${SUBDOMAIN}.${DOMAIN}"
  echo "Adding ${CUSTOM_DOMAIN} to ${PROJECT_NAME}..."

  PAGES_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"name\": \"$CUSTOM_DOMAIN\"}")

  PAGES_SUCCESS=$(echo "$PAGES_RESPONSE" | jq -r '.success')

  if [ "$PAGES_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓ Custom domain added to Pages project${NC}"
  else
    ERROR_MSG=$(echo "$PAGES_RESPONSE" | jq -r '.errors[0].message // "Unknown error"')

    # Check if domain already added
    if echo "$ERROR_MSG" | grep -q "already"; then
      echo -e "${YELLOW}⚠ Custom domain already added, skipping...${NC}"
    else
      echo -e "${RED}✗ Failed to add custom domain: $ERROR_MSG${NC}"
      echo -e "${YELLOW}You may need to add it manually in the Cloudflare dashboard${NC}"
    fi
  fi

  echo ""
fi

# Step 3: Summary
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✓ Service Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Service URL: ${BLUE}https://${SUBDOMAIN}.${DOMAIN}${NC}"
echo ""
echo "Next steps:"

if [ "$SERVICE_TYPE" = "worker" ]; then
  echo "1. Add route to wrangler.toml:"
  echo "   routes = ["
  echo "     { pattern = \"${SUBDOMAIN}.${DOMAIN}/*\", zone_name = \"${DOMAIN}\" }"
  echo "   ]"
  echo ""
  echo "2. Deploy your worker:"
  echo "   cd path/to/worker"
  echo "   npx wrangler deploy"
elif [ "$SERVICE_TYPE" = "pages" ]; then
  echo "1. Build and deploy your Pages project:"
  echo "   cd path/to/project"
  echo "   npm run build"
  echo "   npx wrangler pages deploy dist --project-name=${PROJECT_NAME}"
fi

echo ""
echo "DNS propagation: 1-5 minutes"
echo "SSL certificate: Auto-provisioned by Cloudflare"
echo ""
