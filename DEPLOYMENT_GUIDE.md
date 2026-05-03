# Cloudflare Multi-Agent System - Deployment Guide

**Version**: 1.0
**Date**: 2025-11-20
**Status**: Production Ready
**Test Pass Rate**: 417/417 (100%)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Phase 1: Infrastructure Setup](#phase-1-infrastructure-setup)
4. [Phase 2: Worker Deployment](#phase-2-worker-deployment)
5. [Phase 3: Interface Deployment](#phase-3-interface-deployment)
6. [Phase 4: GitHub Actions Setup](#phase-4-github-actions-setup)
7. [Phase 5: Integration Testing](#phase-5-integration-testing)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Troubleshooting](#troubleshooting)
10. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Accounts & Access

- [ ] **Cloudflare Account** with Workers Paid plan ($5/month minimum)
  - Workers Paid (required for Durable Objects)
  - D1 Database access
  - KV Storage access
  - R2 Storage access
  - Pages access

- [ ] **Ideogram API Account**
  - Sign up at https://ideogram.ai/
  - Generate API key from dashboard
  - Ensure billing is set up (pay-per-use)

- [ ] **GitHub Repository Access**
  - Admin access to repository settings
  - Ability to add secrets
  - Ability to enable Actions

### Required Tools

Install these on your local machine:

```bash
# Node.js 20+ and npm
node --version  # Should be v20+
npm --version

# Wrangler CLI (Cloudflare's deployment tool)
npm install -g wrangler

# Git
git --version
```

### Authentication Setup

```bash
# Login to Cloudflare via Wrangler
wrangler login

# This will open a browser window for OAuth authentication
# Verify you're authenticated:
wrangler whoami
```

---

## Pre-Deployment Checklist

### Environment Verification

```bash
# 1. Clone and enter repository
git clone https://github.com/Logos-Flux/cloudflare-multiagent.git
cd cloudflare-multiagent

# 2. Install dependencies
npm install

# 3. Run tests to verify everything works
npm test

# Expected output: 417/417 tests passing
```

### Gather Required Information

Create a `.env` file in the project root with the following (don't commit this file):

```bash
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here

# Ideogram API
IDEOGRAM_API_KEY=your_ideogram_api_key_here

# Test API Key (generate any random string)
TEST_API_KEY=sk_test_$(openssl rand -hex 16)
```

**To find your Cloudflare Account ID:**
1. Go to https://dash.cloudflare.com/
2. Click on any zone/domain
3. Look for "Account ID" in the right sidebar
4. Or run: `wrangler whoami` (shown as Account ID)

**To create a Cloudflare API Token:**
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use template: "Edit Cloudflare Workers"
4. Add permissions:
   - Account → Workers Scripts → Edit
   - Account → D1 → Edit
   - Account → Workers KV Storage → Edit
   - Account → R2 → Edit
   - Zone → Workers Routes → Edit
5. Click "Continue to summary" → "Create Token"
6. Copy the token (you won't see it again!)

---

## Phase 1: Infrastructure Setup

**Estimated Time**: 30-45 minutes

### Step 1.1: Create D1 Database

```bash
# Create production database
wrangler d1 create multiagent_system

# Expected output:
# ✅ Successfully created DB 'multiagent_system'!
#
# [[d1_databases]]
# binding = "DB"
# database_name = "multiagent_system"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# IMPORTANT: Copy the database_id from output
```

**Save this information:**
```
DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DATABASE_NAME=multiagent_system
```

### Step 1.2: Create KV Namespace

```bash
# Create production KV namespace
wrangler kv:namespace create CONFIG_CACHE

# Expected output:
# ✅ Success!
# Add the following to your wrangler.toml:
#
# [[kv_namespaces]]
# binding = "CONFIG_CACHE"
# id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"

# IMPORTANT: Copy the id from output
```

**Save this information:**
```
KV_NAMESPACE_ID=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

### Step 1.3: Create R2 Bucket

```bash
# Create production R2 bucket
wrangler r2 bucket create production-images

# Expected output:
# ✅ Created bucket 'production-images'
```

**Save this information:**
```
R2_BUCKET_NAME=production-images
```

### Step 1.4: Update Configuration Files

Now update the `wrangler.toml` files with the IDs you just created:

**File**: `infrastructure/config-service/wrangler.toml`

```bash
# Open the file
nano infrastructure/config-service/wrangler.toml

# Or use your preferred editor
code infrastructure/config-service/wrangler.toml
```

Update these sections:

```toml
# Replace the database_id with your DATABASE_ID
[[d1_databases]]
binding = "DB"
database_name = "multiagent_system"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Update this

# Replace the id with your KV_NAMESPACE_ID
[[kv_namespaces]]
binding = "CONFIG_CACHE"
id = "YOUR_KV_NAMESPACE_ID_HERE"  # ← Update this
```

**File**: `workers/image-gen/wrangler.toml`

```toml
# Replace the database_id
[[d1_databases]]
binding = "DB"
database_name = "multiagent_system"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Update this

# Replace the bucket_name
[[r2_buckets]]
binding = "R2"
bucket_name = "production-images"  # Should already be correct

# Replace the namespace_id for rate limiter
[[durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiter"
script_name = "rate-limiter"
```

**File**: `workers/shared/rate-limiter/wrangler.toml`

```toml
# This file should be good as-is, but verify:
name = "rate-limiter"
main = "limiter.ts"
compatibility_date = "2024-01-01"

[[durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiter"
script_name = "rate-limiter"
```

### Step 1.5: Run Database Migrations

```bash
# Run the schema migration
wrangler d1 execute multiagent_system --file=infrastructure/database/schema.sql

# Expected output:
# 🌀 Executing on multiagent_system (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx):
# 🌀 To execute on your local development database, use --local
# ✅ Executed 7 commands in 0.123s
```

**Verify tables were created:**

```bash
wrangler d1 execute multiagent_system --command="SELECT name FROM sqlite_master WHERE type='table'"

# Expected output should list:
# - instances
# - users
# - user_instance_access
# - api_keys
# - projects
# - usage_logs
# - request_logs
```

### Step 1.6: Seed Initial Data (Optional)

```bash
# Load seed data for testing
wrangler d1 execute multiagent_system --file=infrastructure/database/seed.sql

# This creates:
# - Test instance configurations
# - Test users
# - Test API keys
```

---

## Phase 2: Worker Deployment

**Estimated Time**: 20-30 minutes

### Step 2.1: Deploy Config Service

```bash
# Navigate to config service directory
cd infrastructure/config-service

# Deploy to Cloudflare
wrangler deploy

# Expected output:
# ⛅️ wrangler 3.x.x
# ------------------
# Total Upload: XX.XX KiB / gzip: XX.XX KiB
# Uploaded config-service (X.XX sec)
# Published config-service (X.XX sec)
#   https://config-service.YOUR-SUBDOMAIN.workers.dev
#
# ✅ Success!

# Save the deployed URL
CONFIG_SERVICE_URL=https://config-service.YOUR-SUBDOMAIN.workers.dev

# Test health endpoint
curl $CONFIG_SERVICE_URL/health

# Expected: {"status":"healthy","timestamp":"2025-11-20T..."}
```

### Step 2.2: Deploy Rate Limiter

```bash
# Navigate to rate limiter directory
cd ../../workers/shared/rate-limiter

# Deploy
wrangler deploy

# Expected output:
# Published rate-limiter (X.XX sec)
#   https://rate-limiter.YOUR-SUBDOMAIN.workers.dev
# ✅ Success!

# Save the deployed URL
RATE_LIMITER_URL=https://rate-limiter.YOUR-SUBDOMAIN.workers.dev
```

### Step 2.3: Set Secrets for Image Gen Worker

```bash
# Navigate to image gen worker
cd ../../image-gen

# Set Ideogram API key as a secret
wrangler secret put IDEOGRAM_API_KEY

# When prompted, paste your Ideogram API key and press Enter
# Expected: ✅ Success! Uploaded secret IDEOGRAM_API_KEY
```

### Step 2.4: Deploy Image Gen Worker

```bash
# Still in workers/image-gen directory
wrangler deploy

# Expected output:
# Published image-gen (X.XX sec)
#   https://image-gen.YOUR-SUBDOMAIN.workers.dev
# ✅ Success!

# Save the deployed URL
IMAGE_GEN_URL=https://image-gen.YOUR-SUBDOMAIN.workers.dev

# Test health endpoint
curl $IMAGE_GEN_URL/health

# Expected: {"status":"healthy","timestamp":"2025-11-20T..."}
```

### Step 2.5: Verify All Workers

```bash
# List all deployed workers
wrangler deployments list

# You should see:
# - config-service
# - rate-limiter
# - image-gen
```

**Record all URLs in your notes:**

```
CONFIG_SERVICE_URL=https://config-service.YOUR-SUBDOMAIN.workers.dev
RATE_LIMITER_URL=https://rate-limiter.YOUR-SUBDOMAIN.workers.dev
IMAGE_GEN_URL=https://image-gen.YOUR-SUBDOMAIN.workers.dev
```

---

## Phase 3: Interface Deployment

**Estimated Time**: 30-45 minutes

### Step 3.1: Update API Endpoints in Interfaces

Before deploying, update the mock API URLs to use your real deployed workers.

**File**: `interfaces/testing-gui/public/app.js`

```javascript
// Find and update this line (around line 3-5):
const API_BASE_URL = 'https://image-gen.YOUR-SUBDOMAIN.workers.dev';  // ← Update this

// Also update the mock mode toggle if desired
let useMockAPI = false;  // Change to false to use real API by default
```

**File**: `interfaces/admin-panel/src/services/api.js`

```javascript
// Find and update:
const API_BASE_URL = import.meta.env.VITE_API_URL ||
                     'https://config-service.YOUR-SUBDOMAIN.workers.dev';  // ← Update this
```

**File**: `interfaces/monitoring/src/main.jsx`

```javascript
// Find and update:
const API_BASE_URL = import.meta.env.VITE_API_URL ||
                     'https://config-service.YOUR-SUBDOMAIN.workers.dev';  // ← Update this
```

### Step 3.2: Deploy Testing GUI

```bash
# Navigate to testing GUI
cd ../../interfaces/testing-gui

# Deploy to Cloudflare Pages
wrangler pages deploy public --project-name=testing-gui

# Expected output:
# ✨ Success! Uploaded 6 files (X.XX sec)
# ✨ Deployment complete! Take a peek over at
#    https://testing-gui.pages.dev
#
# ✅ Success!

# Save the URL
TESTING_GUI_URL=https://testing-gui.pages.dev
```

### Step 3.3: Deploy Admin Panel

```bash
# Navigate to admin panel
cd ../admin-panel

# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# Expected output:
# vite v5.x.x building for production...
# ✓ XX modules transformed.
# dist/index.html                  X.XX kB
# dist/assets/index-XXXXX.js      XX.XX kB │ gzip: XX.XX kB
# ✓ built in X.XXs

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=admin-panel

# Expected output:
# ✨ Deployment complete!
#    https://admin-panel.pages.dev

# Save the URL
ADMIN_PANEL_URL=https://admin-panel.pages.dev
```

### Step 3.4: Deploy Monitoring Dashboard

```bash
# Navigate to monitoring
cd ../monitoring

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=monitoring-dashboard

# Expected output:
# ✨ Deployment complete!
#    https://monitoring-dashboard.pages.dev

# Save the URL
MONITORING_URL=https://monitoring-dashboard.pages.dev
```

### Step 3.5: Configure Custom Domains (Optional)

If you want custom domains like `admin.yourdomain.com`:

```bash
# For each Pages project, add a custom domain:
wrangler pages domains add testing-gui test.yourdomain.com
wrangler pages domains add admin-panel admin.yourdomain.com
wrangler pages domains add monitoring-dashboard monitor.yourdomain.com

# Make sure DNS is configured (CNAME to *.pages.dev)
```

---

## Phase 4: GitHub Actions Setup

**Estimated Time**: 10-15 minutes

### Step 4.1: Configure Repository Secrets

1. Go to your repository on GitHub
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** for each:

**Add these secrets:**

| Secret Name | Value | Where to Find |
|-------------|-------|---------------|
| `CLOUDFLARE_API_TOKEN` | Your API token | From Phase 1 or Cloudflare dashboard |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID | From `wrangler whoami` |
| `IDEOGRAM_API_KEY` | Your Ideogram key | Ideogram dashboard |
| `TEST_API_KEY` | Generated test key | From your `.env` file |

**For each secret:**
1. Click "New repository secret"
2. Enter the name (e.g., `CLOUDFLARE_API_TOKEN`)
3. Paste the value
4. Click "Add secret"

### Step 4.2: Verify Workflows

```bash
# Check that workflow files exist
ls -la .github/workflows/

# Should show:
# test.yml              - Runs tests on every PR
# deploy.yml            - Auto-deploys on merge to main
# deploy-instance.yml   - Manual instance deployment
```

### Step 4.3: Test GitHub Actions

**Option A: Push a small change**

```bash
# Make a trivial change
echo "# Deployment completed on $(date)" >> DEPLOYMENT_LOG.md

# Commit and push
git add DEPLOYMENT_LOG.md
git commit -m "Test GitHub Actions deployment"
git push origin main

# Go to GitHub → Actions tab
# You should see:
# - "Test" workflow running/completed ✅
# - "Deploy to Cloudflare" workflow running/completed ✅
```

**Option B: Manual workflow trigger**

1. Go to GitHub → **Actions** tab
2. Click on **"Deploy New Instance"** workflow
3. Click **"Run workflow"**
4. Fill in test values:
   - Instance ID: `test-deploy`
   - Org ID: `test-org`
   - Environment: `development`
5. Click **"Run workflow"**
6. Watch the deployment progress

### Step 4.4: Verify Auto-Deployment

Every time you merge to `main`, the deploy workflow will:
1. Run all tests
2. Deploy Config Service
3. Deploy Image Gen Worker
4. Run smoke tests
5. Send notification (if configured)

---

## Phase 5: Integration Testing

**Estimated Time**: 1-2 hours

### Step 5.1: End-to-End Image Generation Test

```bash
# Test the complete flow
curl -X POST $IMAGE_GEN_URL/generate \
  -H "X-API-Key: $TEST_API_KEY" \
  -H "X-Instance-ID: production" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape at sunset",
    "aspect_ratio": "16:9",
    "model": "V_2"
  }'

# Expected response:
# {
#   "request_id": "req_xxxxx",
#   "status": "processing",
#   "estimated_time": 30
# }

# Wait 30 seconds, then check status:
curl $IMAGE_GEN_URL/status/req_xxxxx

# Expected response:
# {
#   "status": "completed",
#   "image_url": "https://pub-xxxxx.r2.dev/production/xxxxx.png",
#   "cdn_url": "https://pub-xxxxx.r2.dev/production/xxxxx.png",
#   "metadata": { ... }
# }
```

### Step 5.2: Test Admin Panel

1. Open `$ADMIN_PANEL_URL` in browser
2. **Login Test**:
   - Email: `admin@example.com`
   - Password: `admin123` (from seed data)
   - Should redirect to dashboard ✅

3. **Instances Page**:
   - View existing instances ✅
   - Create new instance ✅
   - Edit instance configuration ✅
   - Delete test instance ✅

4. **Users Page**:
   - View users list ✅
   - Create new user ✅
   - Assign instance access ✅

5. **API Keys Page**:
   - View API keys (masked) ✅
   - Generate new API key ✅
   - Copy key (shown once) ✅
   - Revoke key ✅

6. **Logs Page**:
   - View request logs ✅
   - Filter by level ✅
   - Search logs ✅

### Step 5.3: Test Testing GUI

1. Open `$TESTING_GUI_URL` in browser
2. **Mock Mode Test**:
   - Toggle "Use Mock API" ON
   - Enter prompt: "Test image"
   - Click "Generate Image"
   - Should show mock image instantly ✅

3. **Production Mode Test**:
   - Toggle "Use Mock API" OFF
   - Enter your test API key
   - Select instance: "production"
   - Enter prompt: "A beautiful sunset"
   - Click "Generate Image"
   - Should show loading → image appears ✅
   - Verify CDN URL is displayed ✅
   - Verify metadata is shown ✅

### Step 5.4: Test Monitoring Dashboard

1. Open `$MONITORING_URL` in browser
2. **Dashboard Overview**:
   - Should show 4 charts ✅
   - Request volume chart ✅
   - Error rate chart ✅
   - Response time chart ✅
   - Provider usage chart ✅

3. **Auto-Refresh Test**:
   - Enable auto-refresh
   - Wait 30 seconds
   - Charts should update ✅

4. **Time Range Selection**:
   - Change to "Last 7 days"
   - Data should update ✅

### Step 5.5: Test Rate Limiting

```bash
# Generate 10 rapid requests
for i in {1..10}; do
  curl -X POST $IMAGE_GEN_URL/generate \
    -H "X-API-Key: $TEST_API_KEY" \
    -H "X-Instance-ID: production" \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Test '$i'"}' &
done
wait

# Some requests should return 429 (rate limited)
# Expected response for rate-limited requests:
# {
#   "error": "Rate limit exceeded",
#   "code": "RATE_LIMITED",
#   "retry_after": 60
# }
```

### Step 5.6: Test Multi-Tenant Isolation

```bash
# Create two instances with different rate limits
# Instance 1: Low limits (5 RPM)
# Instance 2: High limits (100 RPM)

# Test that Instance 1 gets rate limited faster
# Test that Instance 2 can make more requests
# Verify logs show correct instance_id
```

---

## Post-Deployment Verification

### Health Check Dashboard

Create a simple health check script:

```bash
#!/bin/bash
# health-check.sh

echo "=== Cloudflare Multi-Agent System Health Check ==="
echo ""

# Config Service
echo -n "Config Service: "
curl -s $CONFIG_SERVICE_URL/health | grep -q healthy && echo "✅ Healthy" || echo "❌ Down"

# Image Gen Worker
echo -n "Image Gen Worker: "
curl -s $IMAGE_GEN_URL/health | grep -q healthy && echo "✅ Healthy" || echo "❌ Down"

# Testing GUI
echo -n "Testing GUI: "
curl -s -o /dev/null -w "%{http_code}" $TESTING_GUI_URL | grep -q 200 && echo "✅ Healthy" || echo "❌ Down"

# Admin Panel
echo -n "Admin Panel: "
curl -s -o /dev/null -w "%{http_code}" $ADMIN_PANEL_URL | grep -q 200 && echo "✅ Healthy" || echo "❌ Down"

# Monitoring
echo -n "Monitoring Dashboard: "
curl -s -o /dev/null -w "%{http_code}" $MONITORING_URL | grep -q 200 && echo "✅ Healthy" || echo "❌ Down"

echo ""
echo "=== Health Check Complete ==="
```

Run it:
```bash
chmod +x health-check.sh
./health-check.sh
```

### Monitoring Setup

**Cloudflare Dashboard**:
1. Go to https://dash.cloudflare.com/
2. Click **Workers & Pages**
3. Monitor metrics:
   - Request count
   - Error rate
   - CPU time
   - Duration

**Set up Alerts** (optional):
1. Go to **Notifications** in Cloudflare dashboard
2. Create alerts for:
   - Worker error rate > 5%
   - Worker CPU time > 10ms
   - R2 storage usage

### Performance Verification

```bash
# Test response times
time curl -X POST $IMAGE_GEN_URL/generate \
  -H "X-API-Key: $TEST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test"}'

# Expected: < 200ms for API response
# Expected: 10-30s for image generation
```

---

## Troubleshooting

### Issue: "Database not found"

**Symptoms**: Config Service returns 500 error, logs show "Database binding not found"

**Solution**:
```bash
# Verify database exists
wrangler d1 list

# Verify binding in wrangler.toml
cat infrastructure/config-service/wrangler.toml | grep -A 3 d1_databases

# Re-deploy with correct binding
cd infrastructure/config-service
wrangler deploy
```

### Issue: "KV namespace not bound"

**Symptoms**: Instance lookup fails, cache errors

**Solution**:
```bash
# List KV namespaces
wrangler kv:namespace list

# Update wrangler.toml with correct ID
# Re-deploy
```

### Issue: "R2 bucket not accessible"

**Symptoms**: Images fail to upload, 404 on CDN URLs

**Solution**:
```bash
# Verify bucket exists
wrangler r2 bucket list

# Verify binding in wrangler.toml
cat workers/image-gen/wrangler.toml | grep -A 3 r2_buckets

# Test R2 access manually
wrangler r2 object put production-images/test.txt --file=test.txt
wrangler r2 object get production-images/test.txt
```

### Issue: "Rate limiter not working"

**Symptoms**: No rate limiting happening, or all requests fail

**Solution**:
```bash
# Verify Durable Object deployment
wrangler deployments list rate-limiter

# Check bindings in image-gen worker
cat workers/image-gen/wrangler.toml | grep -A 5 durable_objects

# Re-deploy rate limiter
cd workers/shared/rate-limiter
wrangler deploy

# Re-deploy image-gen worker
cd ../../image-gen
wrangler deploy
```

### Issue: "Ideogram API errors"

**Symptoms**: All image generations fail with 401 or 403

**Solution**:
```bash
# Verify API key is set
wrangler secret list --name image-gen

# Should show: IDEOGRAM_API_KEY

# If not, set it again:
wrangler secret put IDEOGRAM_API_KEY

# Test Ideogram API directly
curl https://api.ideogram.ai/generate \
  -H "Api-Key: $IDEOGRAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'
```

### Issue: "GitHub Actions failing"

**Symptoms**: Deploy workflow fails, red X on commits

**Solution**:
```bash
# Check secrets are set correctly
# Go to GitHub → Settings → Secrets → Actions
# Verify all 4 secrets exist

# Check workflow logs for specific error
# Common issues:
# - Invalid API token (regenerate)
# - Account ID mismatch (check wrangler whoami)
# - Missing permissions on token

# Test deployment locally first:
wrangler deploy --dry-run
```

### Issue: "CORS errors in browser"

**Symptoms**: Admin panel can't fetch from Config Service, CORS error in console

**Solution**:

Check Config Service CORS headers:
```typescript
// In infrastructure/config-service/index.ts
// Verify headers include:
headers.set('Access-Control-Allow-Origin', '*');
headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
```

Re-deploy after fixing:
```bash
cd infrastructure/config-service
wrangler deploy
```

---

## Rollback Procedures

### Rollback Workers

```bash
# List recent deployments
wrangler deployments list config-service

# Output shows:
# Created:     2025-11-20 15:30:00
# ID:          xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
#
# Created:     2025-11-20 14:00:00  ← Previous version
# ID:          yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy

# Rollback to previous version
wrangler rollback config-service --deployment-id yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy

# Verify rollback
curl $CONFIG_SERVICE_URL/health
```

### Rollback Pages

```bash
# List deployments
wrangler pages deployments list testing-gui

# Rollback to specific deployment
wrangler pages deployments rollback testing-gui --deployment-id DEPLOYMENT_ID
```

### Rollback Database

**⚠️ WARNING: Database rollbacks require backups**

```bash
# Export current data (backup)
wrangler d1 export multiagent_system --output=backup-$(date +%Y%m%d-%H%M%S).sql

# To restore from backup:
wrangler d1 execute multiagent_system --file=backup-TIMESTAMP.sql
```

**Best Practice**: Always export database before running migrations:
```bash
# Before migration
wrangler d1 export multiagent_system --output=pre-migration-backup.sql

# Run migration
wrangler d1 execute multiagent_system --file=new-migration.sql

# If issues, restore:
wrangler d1 execute multiagent_system --file=pre-migration-backup.sql
```

---

## Production Checklist

**Before Going Live:**

- [ ] All health checks passing
- [ ] End-to-end tests completed successfully
- [ ] Rate limiting verified working
- [ ] Multi-tenant isolation tested
- [ ] Image generation working with real Ideogram API
- [ ] R2 CDN URLs accessible
- [ ] Admin panel functional
- [ ] Monitoring dashboard showing data
- [ ] GitHub Actions workflows tested
- [ ] Backup procedures documented
- [ ] Team trained on rollback procedures
- [ ] Monitoring alerts configured
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] API keys rotated from test keys
- [ ] Documentation updated with production URLs

**Post-Launch Monitoring (First 24 Hours):**

- [ ] Monitor error rates (target: < 1%)
- [ ] Monitor response times (target: < 200ms)
- [ ] Monitor rate limiting (should see some 429s)
- [ ] Monitor R2 storage usage
- [ ] Monitor D1 query performance
- [ ] Check for any timeout errors
- [ ] Verify CDN cache hit rates
- [ ] Monitor Ideogram API costs

---

## Additional Resources

**Cloudflare Documentation**:
- Workers: https://developers.cloudflare.com/workers/
- D1 Database: https://developers.cloudflare.com/d1/
- KV Storage: https://developers.cloudflare.com/kv/
- R2 Storage: https://developers.cloudflare.com/r2/
- Durable Objects: https://developers.cloudflare.com/durable-objects/
- Pages: https://developers.cloudflare.com/pages/

**Project Documentation**:
- API Reference: `/docs/api/README.md`
- Developer Guide: `/docs/development/README.md`
- Admin Guide: `/docs/admin/README.md`
- Deployment Scripts: `/scripts/README.md`

**Wrangler Commands Reference**:
```bash
wrangler --help              # Show all commands
wrangler deploy --help       # Deploy help
wrangler d1 --help           # D1 commands
wrangler kv:namespace --help # KV commands
wrangler r2 --help           # R2 commands
wrangler pages --help        # Pages commands
wrangler secret --help       # Secrets management
```

---

## Support Contacts

**For Deployment Issues**:
- Cloudflare Support: https://support.cloudflare.com/
- Cloudflare Community: https://community.cloudflare.com/
- Wrangler GitHub: https://github.com/cloudflare/workers-sdk

**For Ideogram API Issues**:
- Ideogram Docs: https://api-docs.ideogram.ai/
- Ideogram Support: support@ideogram.ai

**For This System**:
- GitHub Issues: https://github.com/Logos-Flux/cloudflare-multiagent/issues
- Project Documentation: `/docs/README.md`

---

## Appendix: Quick Reference

### All Deployed URLs (Update After Deployment)

```bash
# Workers
CONFIG_SERVICE_URL=https://config-service.YOUR-SUBDOMAIN.workers.dev
IMAGE_GEN_URL=https://image-gen.YOUR-SUBDOMAIN.workers.dev
RATE_LIMITER_URL=https://rate-limiter.YOUR-SUBDOMAIN.workers.dev

# Interfaces
TESTING_GUI_URL=https://testing-gui.pages.dev
ADMIN_PANEL_URL=https://admin-panel.pages.dev
MONITORING_URL=https://monitoring-dashboard.pages.dev

# Resources
DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
KV_NAMESPACE_ID=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
R2_BUCKET=production-images
```

### Common Commands

```bash
# Deploy everything
cd infrastructure/config-service && wrangler deploy
cd ../../workers/shared/rate-limiter && wrangler deploy
cd ../../image-gen && wrangler deploy
cd ../../interfaces && ./deploy-all.sh production

# Health checks
curl $CONFIG_SERVICE_URL/health
curl $IMAGE_GEN_URL/health

# View logs
wrangler tail config-service
wrangler tail image-gen

# List deployments
wrangler deployments list config-service
wrangler deployments list image-gen

# Database queries
wrangler d1 execute multiagent_system --command="SELECT COUNT(*) FROM instances"
wrangler d1 execute multiagent_system --command="SELECT * FROM usage_logs LIMIT 10"
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-20
**Deployment Status**: ✅ Ready for Production
**Test Pass Rate**: 417/417 (100%)

🚀 **You're ready to deploy!** Follow the phases in order and you'll have a production system running in 6-8 hours.
