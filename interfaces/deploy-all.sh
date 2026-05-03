#!/bin/bash

# Deploy all Team 4 interfaces to Cloudflare Pages
# Usage: ./deploy-all.sh [environment]
# Environment: production (default) or development

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying all interfaces to Cloudflare Pages ($ENVIRONMENT environment)"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to deploy with error handling
deploy_interface() {
    local name=$1
    local dir=$2
    local build_needed=$3

    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Deploying: $name${NC}"
    echo -e "${BLUE}========================================${NC}"

    cd "$dir" || exit 1

    if [ "$build_needed" = "true" ]; then
        echo "📦 Installing dependencies..."
        npm install

        echo "🔨 Building..."
        npm run build

        echo "🚀 Deploying built files..."
        if [ "$ENVIRONMENT" = "production" ]; then
            wrangler pages deploy dist --project-name="$name" --branch=main
        else
            wrangler pages deploy dist --project-name="$name" --branch=development
        fi
    else
        echo "🚀 Deploying static files..."
        if [ "$ENVIRONMENT" = "production" ]; then
            wrangler pages deploy public --project-name="$name" --branch=main
        else
            wrangler pages deploy public --project-name="$name" --branch=development
        fi
    fi

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $name deployed successfully!${NC}"
    else
        echo -e "${RED}❌ $name deployment failed!${NC}"
        exit 1
    fi

    echo ""
    cd - > /dev/null || exit 1
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: wrangler CLI not found${NC}"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Cloudflare${NC}"
    echo "Run: wrangler login"
    exit 1
fi

echo "✨ Starting deployment process..."
echo ""

# Deploy Testing GUI (no build needed)
deploy_interface "testing-gui" "./testing-gui" false

# Deploy Admin Panel (React build needed)
deploy_interface "admin-panel" "./admin-panel" true

# Deploy Monitoring Dashboard (React build needed)
deploy_interface "monitoring-dashboard" "./monitoring" true

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 All interfaces deployed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Deployed URLs:"
echo "  - Testing GUI: https://testing-gui.pages.dev"
echo "  - Admin Panel: https://admin-panel.pages.dev"
echo "  - Monitoring Dashboard: https://monitoring-dashboard.pages.dev"
echo ""
echo "Next steps:"
echo "  1. Verify deployments in browser"
echo "  2. Update API endpoints in code (see DEPLOYMENT.md)"
echo "  3. Run UAT checklist (see UAT_CHECKLIST.md)"
echo ""
