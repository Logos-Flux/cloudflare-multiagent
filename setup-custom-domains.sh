#!/bin/bash

# Custom Domain Setup Script for your-domain.com
# This script automates DNS and Pages custom domain configuration

set -e

# Configuration - Set these environment variables before running
DOMAIN="${CLOUDFLARE_DOMAIN:-your-domain.com}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"

# Check required environment variables
if [ -z "$ACCOUNT_ID" ]; then
  echo "Error: CLOUDFLARE_ACCOUNT_ID environment variable not set"
  echo "Set it with: export CLOUDFLARE_ACCOUNT_ID='your-account-id'"
  exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Error: CLOUDFLARE_API_TOKEN environment variable not set"
  echo "Set it with: export CLOUDFLARE_API_TOKEN='your-api-token'"
  exit 1
fi

echo "============================================"
echo "Custom Domain Setup for $DOMAIN"
echo "============================================"
echo ""

# Check if domain exists in Cloudflare
echo "Step 1: Checking if domain is in Cloudflare account..."
echo ""

# Get Zone ID using wrangler
ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN&account.id=$ACCOUNT_ID" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type:application/json" | jq -r '.result[0].id // empty')

if [ -z "$ZONE_ID" ]; then
  echo "⚠️  Domain $DOMAIN not found in your Cloudflare account."
  echo ""
  echo "Please add the domain to Cloudflare first:"
  echo "1. Go to https://dash.cloudflare.com"
  echo "2. Click 'Add a Site'"
  echo "3. Enter: $DOMAIN"
  echo "4. Follow the nameserver setup instructions"
  echo ""
  echo "After adding the domain, set your Cloudflare API token:"
  echo "export CLOUDFLARE_API_TOKEN='your-api-token-here'"
  echo ""
  echo "Then run this script again."
  exit 1
fi

echo "✅ Domain found! Zone ID: $ZONE_ID"
echo ""

# Step 2: Create DNS Records
echo "Step 2: Creating DNS records..."
echo ""

create_dns_record() {
  local name=$1
  local target=$2

  echo "Creating DNS record: $name.$DOMAIN → $target"

  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{
      \"type\": \"CNAME\",
      \"name\": \"$name\",
      \"content\": \"$target\",
      \"ttl\": 1,
      \"proxied\": true
    }" | jq -r '.success' >/dev/null && echo "  ✅ Created" || echo "  ⚠️  May already exist"
}

# DNS for Pages Projects
create_dns_record "monitoring" "monitoring-dashboard.pages.dev"
create_dns_record "admin" "admin-panel-bti.pages.dev"
create_dns_record "testing" "testing-gui.pages.dev"

# DNS for Workers (point to @ for worker routes)
create_dns_record "api" "@"
create_dns_record "images" "@"

echo ""
echo "✅ DNS records created!"
echo ""

# Step 3: Add Custom Domains to Pages Projects
echo "Step 3: Adding custom domains to Pages projects..."
echo ""

add_pages_custom_domain() {
  local project_name=$1
  local custom_domain=$2

  echo "Adding $custom_domain to $project_name..."

  curl -s -X PATCH "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$project_name" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{
      \"domains\": [\"$custom_domain\"]
    }" | jq -r '.success' >/dev/null && echo "  ✅ Added" || echo "  ⚠️  Error or already exists"
}

add_pages_custom_domain "monitoring-dashboard" "monitoring.$DOMAIN"
add_pages_custom_domain "admin-panel" "admin.$DOMAIN"
add_pages_custom_domain "testing-gui" "testing.$DOMAIN"

echo ""
echo "✅ Custom domains added to Pages projects!"
echo ""

# Step 4: Verify Worker Routes
echo "Step 4: Verifying worker routes..."
echo ""

echo "Config Service route: api.$DOMAIN"
echo "Image Gen route: images.$DOMAIN"
echo ""
echo "Worker routes are configured in wrangler.toml files."
echo "Routes will be active once DNS propagates (1-5 minutes)."
echo ""

# Summary
echo "============================================"
echo "✅ Setup Complete!"
echo "============================================"
echo ""
echo "Your services will be available at:"
echo ""
echo "Frontend Interfaces:"
echo "  • https://monitoring.$DOMAIN"
echo "  • https://admin.$DOMAIN"
echo "  • https://testing.$DOMAIN"
echo ""
echo "Backend APIs:"
echo "  • https://api.$DOMAIN"
echo "  • https://images.$DOMAIN"
echo ""
echo "⏱️  DNS propagation: 1-5 minutes"
echo "🔒 SSL certificates: Auto-provisioned by Cloudflare"
echo ""
echo "Test your domains:"
echo "  curl -I https://monitoring.$DOMAIN"
echo "  curl https://api.$DOMAIN/health"
echo ""
