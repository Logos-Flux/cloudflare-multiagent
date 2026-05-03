# Deployment Guide

Complete guide to deploying and managing the Cloudflare Multi-Agent System.

## Prerequisites

- Cloudflare account with Workers, D1, R2, and Durable Objects enabled
- Wrangler CLI installed: `npm install -g wrangler`
- GitHub account (for CI/CD)
- AI provider API keys (e.g., Ideogram)

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/YourOrg/cloudflare-multiagent.git
cd cloudflare-multiagent
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Wrangler

```bash
wrangler login
```

### 4. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
IDEOGRAM_API_KEY=your_ideogram_key
```

## Database Setup

### Create D1 Database

```bash
# Create production database
wrangler d1 create multi-agent-db-prod

# Create development database
wrangler d1 create multi-agent-db-dev
```

### Run Migrations

```bash
# Production
wrangler d1 execute multi-agent-db-prod --file=infrastructure/database/migrations/001-initial.sql

# Development
wrangler d1 execute multi-agent-db-dev --file=infrastructure/database/migrations/001-initial.sql
```

### Seed Database (Optional)

```bash
wrangler d1 execute multi-agent-db-prod --file=infrastructure/database/seed.sql
```

## R2 Storage Setup

### Create R2 Buckets

```bash
# Production bucket
wrangler r2 bucket create prod-images

# Development bucket
wrangler r2 bucket create dev-images
```

### Configure CORS (Optional)

```bash
# Allow cross-origin requests for CDN
wrangler r2 bucket cors put prod-images --cors-file=infrastructure/r2/cors-config.json
```

## Deploy Workers

### 1. Config Service Worker

```bash
cd infrastructure/config-service
wrangler deploy
```

### 2. Image Generation Worker

```bash
cd workers/image-gen
wrangler deploy
```

### 3. Verify Deployment

```bash
curl https://config-service-production.{your-subdomain}.workers.dev/health
```

## Deploy Interfaces

### Admin Panel

```bash
cd interfaces/admin-panel
npm install
npm run build
wrangler pages deploy dist --project-name=admin-panel
```

### Testing GUI

```bash
cd interfaces/testing-gui
wrangler pages deploy public --project-name=testing-gui
```

### Monitoring Dashboard

```bash
cd interfaces/monitoring
npm install
npm run build
wrangler pages deploy dist --project-name=monitoring-dashboard
```

## Create First Instance

### Via Admin Panel

1. Navigate to your deployed admin panel
2. Log in with admin API key
3. Go to "Instances" page
4. Click "Create Instance"
5. Fill in details:
   - Instance ID: `production`
   - Name: `Production Instance`
   - R2 Bucket: `prod-images`
   - Rate Limit: `500` requests/minute

### Via API

```bash
curl -X POST https://config-service.workers.dev/instance \
  -H "Authorization: Bearer ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instance_id": "production",
    "org_id": "your-org-id",
    "name": "Production Instance",
    "api_keys": {
      "ideogram": "YOUR_IDEOGRAM_KEY"
    },
    "rate_limits": {
      "ideogram": {
        "rpm": 500,
        "tpm": 100000
      }
    },
    "r2_bucket": "prod-images"
  }'
```

## GitHub Actions CI/CD

### Setup Secrets

In your GitHub repository, add the following secrets:

1. `CLOUDFLARE_API_TOKEN` - Cloudflare API token
2. `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### Deploy Workflow

The `.github/workflows/deploy.yml` file handles automated deployment:

```yaml
name: Deploy Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - name: Deploy Config Service
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
          workingDirectory: infrastructure/config-service
      - name: Deploy Image Gen Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
          workingDirectory: workers/image-gen
```

## Updating Workers

### Update Single Worker

```bash
cd workers/image-gen
# Make your changes
wrangler deploy
```

### Update All Workers

```bash
npm run deploy-all
```

### Rollback

```bash
# View deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback --deployment-id DEPLOYMENT_ID
```

## Monitoring

### View Logs

```bash
# Real-time logs
wrangler tail image-gen-production

# Filter by status
wrangler tail image-gen-production --status error
```

### Analytics

Access Cloudflare Analytics dashboard:
- Workers Analytics
- R2 Analytics
- D1 Query Analytics

## Scaling

### Increase Rate Limits

Update instance configuration:

```bash
curl -X PUT https://config-service.workers.dev/instance/production \
  -H "Authorization: Bearer ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rate_limits": {
      "ideogram": {
        "rpm": 1000,
        "tpm": 200000
      }
    }
  }'
```

### Add More Instances

Create new instances for different environments or clients:

```bash
# Staging instance
npm run deploy-instance -- --config instances/staging.json

# Client-specific instance
npm run deploy-instance -- --config instances/client-xyz.json
```

## Troubleshooting

### Worker Not Responding

1. Check deployment status: `wrangler deployments list`
2. View logs: `wrangler tail worker-name`
3. Verify bindings in `wrangler.toml`

### Database Connection Issues

1. Verify D1 database exists: `wrangler d1 list`
2. Check binding name in `wrangler.toml`
3. Verify migrations ran: `wrangler d1 execute DB --command "SELECT * FROM instances LIMIT 1"`

### Rate Limit Issues

1. Check Durable Object logs: `wrangler tail --durable-object RATE_LIMITER`
2. Verify rate limit configuration in instance
3. Monitor analytics for usage patterns

### R2 Upload Failures

1. Verify bucket exists: `wrangler r2 bucket list`
2. Check bucket permissions
3. Verify binding in `wrangler.toml`

## Health Checks

### Config Service

```bash
curl https://config-service.workers.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-20T12:00:00Z"
}
```

### Image Gen Worker

```bash
curl https://image-gen-production.workers.dev/health
```

## Performance Optimization

### Enable Caching

KV caching is enabled by default for instance configs (5 min TTL).

### CDN Configuration

R2 buckets automatically provide CDN URLs. No additional configuration needed.

### Monitor Performance

Use Cloudflare Analytics to monitor:
- Request latency (p50, p95, p99)
- Error rates
- Cache hit rates
- Worker CPU time

## Security

### Rotate API Keys

Regularly rotate provider API keys:

1. Update in Admin Panel → Instances → Edit
2. Or via API: `PUT /instance/{instance_id}`

### Review Access Logs

Monitor access patterns:

```bash
wrangler tail --format json | grep "401\\|403"
```

### Update Dependencies

```bash
npm audit
npm update
```

---

**Next Steps**: [Development Guide](../development/README.md) | [Admin Guide](../admin/README.md)
