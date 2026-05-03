# Development Guide

Guide for local development, testing, and extending the Cloudflare Multi-Agent System.

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Wrangler CLI
- Git

### Clone and Install

```bash
git clone https://github.com/YourOrg/cloudflare-multiagent.git
cd cloudflare-multiagent
npm install
```

### Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with development credentials:

```env
# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_dev_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# AI Providers
IDEOGRAM_API_KEY=your_ideogram_key

# Development
NODE_ENV=development
```

### Local Database

```bash
# Create local D1 database
wrangler d1 create multi-agent-db-local --local

# Run migrations
wrangler d1 migrations apply multi-agent-db-local --local
```

## Running Locally

### Config Service Worker

```bash
cd infrastructure/config-service
wrangler dev --local
```

Access at `http://localhost:8787`

### Image Generation Worker

```bash
cd workers/image-gen
wrangler dev --local --port 8788
```

Access at `http://localhost:8788`

### Admin Panel

```bash
cd interfaces/admin-panel
npm run dev
```

Access at `http://localhost:3000`

### Testing GUI

```bash
cd interfaces/testing-gui
npm run dev
```

Access at `http://localhost:8080`

## Project Structure

```
cloudflare-multiagent/
├── docs/                       # Documentation
├── infrastructure/
│   ├── database/              # D1 schema and migrations
│   ├── config-service/        # Central config worker
│   ├── auth/                  # Authentication middleware
│   └── lookup/                # Instance resolution
├── workers/
│   ├── shared/                # Shared utilities
│   │   ├── provider-adapters/ # AI provider adapters
│   │   ├── rate-limiter/      # Rate limiting (DO)
│   │   ├── r2-manager/        # R2 storage manager
│   │   ├── error-handling/    # Error utilities
│   │   └── logging/           # Logging utilities
│   └── image-gen/             # Image generation worker
├── interfaces/
│   ├── testing-gui/           # Testing interface
│   ├── admin-panel/           # Admin panel
│   └── monitoring/            # Monitoring dashboard
├── tests/                     # Test suites
├── scripts/                   # Deployment scripts
└── prompts/                   # Multi-agent prompts
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run test:coverage
```

## Adding a New AI Provider

### 1. Create Provider Adapter

Create `workers/shared/provider-adapters/new-provider.ts`:

```typescript
import { ProviderAdapter, ImageRequest, ImageResult } from './types'

export class NewProviderAdapter implements ProviderAdapter {
  constructor(private apiKey: string) {}

  async generateImage(request: ImageRequest): Promise<ImageResult> {
    // Call provider API
    const response = await fetch('https://api.newprovider.com/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: request.prompt,
        ...request.options
      })
    })

    const data = await response.json()

    return {
      image_url: data.url,
      image_data: await this.fetchImage(data.url),
      provider: 'new-provider',
      model: request.options?.model || 'default',
      metadata: {
        dimensions: data.dimensions,
        format: 'png',
        generation_time_ms: data.processing_time
      }
    }
  }

  private async fetchImage(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url)
    return await response.arrayBuffer()
  }
}
```

### 2. Register Provider

Update `workers/shared/provider-adapters/index.ts`:

```typescript
import { NewProviderAdapter } from './new-provider'

export function getProviderAdapter(provider: string, apiKey: string) {
  switch (provider) {
    case 'ideogram':
      return new IdeogramAdapter(apiKey)
    case 'new-provider':
      return new NewProviderAdapter(apiKey)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}
```

### 3. Add Provider to Instance Config

Update instance configuration to include new provider:

```json
{
  "api_keys": {
    "ideogram": "ide_xxx",
    "new-provider": "np_xxx"
  },
  "rate_limits": {
    "ideogram": { "rpm": 500, "tpm": 100000 },
    "new-provider": { "rpm": 1000, "tpm": 200000 }
  }
}
```

### 4. Test Provider

```bash
curl -X POST http://localhost:8788/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test image",
    "provider": "new-provider"
  }'
```

## Code Style

### TypeScript

Use TypeScript for all Workers and infrastructure code:

```typescript
// Good
interface ImageRequest {
  prompt: string
  model?: string
  options?: Record<string, any>
}

// Avoid 'any' - use specific types
async function processRequest(request: ImageRequest): Promise<ImageResult> {
  // ...
}
```

### Linting

```bash
# Check code style
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Formatting

```bash
# Check formatting
npm run format:check

# Auto-format code
npm run format
```

## Database Migrations

### Create Migration

```bash
# Create new migration file
npm run migration:create -- add_new_table
```

This creates `infrastructure/database/migrations/002-add_new_table.sql`.

### Apply Migration

```bash
# Local
wrangler d1 migrations apply multi-agent-db-local --local

# Production
wrangler d1 migrations apply multi-agent-db-prod
```

### Migration Best Practices

- Always include `IF NOT EXISTS` for CREATE statements
- Never delete migrations that have been deployed
- Test migrations locally before deploying
- Include rollback instructions in comments

Example:

```sql
-- Migration: Add projects table
-- Rollback: DROP TABLE IF EXISTS projects;

CREATE TABLE IF NOT EXISTS projects (
  project_id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  name TEXT NOT NULL,
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instance_id) REFERENCES instances(instance_id)
);

CREATE INDEX IF NOT EXISTS idx_projects_instance
ON projects(instance_id);
```

## Debugging

### Enable Debug Logs

Set environment variable:

```bash
export DEBUG=true
wrangler dev --local
```

### Chrome DevTools

Wrangler dev supports Chrome DevTools:

```bash
wrangler dev --local --inspect
```

Then open `chrome://inspect` and click "Inspect".

### Log Levels

Use structured logging:

```typescript
import { Logger } from '@/shared/logging'

const logger = new Logger('image-gen')

logger.debug('Processing request', { request_id: '123' })
logger.info('Image generated', { url: 'https://...' })
logger.warn('Rate limit approaching', { remaining: 10 })
logger.error('Provider error', { error: err.message })
```

## Performance Testing

### Load Testing

Use `k6` for load testing:

```javascript
import http from 'k6/http'
import { check } from 'k6'

export const options = {
  vus: 10,
  duration: '30s',
}

export default function () {
  const response = http.post(
    'https://image-gen-production.workers.dev/generate',
    JSON.stringify({
      prompt: 'Test image',
      instance_id: 'production'
    }),
    {
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      }
    }
  )

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 5s': (r) => r.timings.duration < 5000
  })
}
```

Run:

```bash
k6 run tests/load/image-gen.js
```

## Contributing

### Branch Strategy

- `main` - Production code
- `development` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `team-*` - Multi-agent team branches

### Commit Messages

Follow conventional commits:

```
feat(image-gen): add DALL-E provider support
fix(rate-limiter): correct token counting logic
docs(api): update generate endpoint examples
test(auth): add middleware unit tests
```

### Pull Requests

1. Create feature branch from `main`
2. Make changes and commit
3. Run tests: `npm test`
4. Push and create PR
5. Wait for CI/CD checks
6. Request review
7. Merge after approval

## Useful Commands

```bash
# Development
npm run dev              # Run all services locally
npm run build            # Build all workers
npm test                 # Run tests
npm run lint             # Check code style
npm run typecheck        # Type check TypeScript

# Deployment
npm run deploy-all       # Deploy all workers
npm run deploy-instance  # Deploy single instance

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:reset         # Reset and reseed

# Wrangler
wrangler dev             # Local development server
wrangler deploy          # Deploy worker
wrangler tail            # View logs
wrangler d1 execute      # Run SQL query
```

---

**Next Steps**: [API Reference](../api/README.md) | [Deployment Guide](../deployment/README.md)
