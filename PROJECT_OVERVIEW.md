# Cloudflare Multi-Agent - Project Overview

A multi-agent AI platform built on Cloudflare Workers infrastructure.

**Live Domain**: https://example.com

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    example.com                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTENDS (Cloudflare Pages)                                   │
│  ├── admin.example.com      → Admin Panel          │
│  ├── monitoring.example.com → Metrics Dashboard    │
│  ├── testing.example.com    → Image Gen Testing    │
│  └── text-testing.example.com → Text Gen Testing   │
│                                                                 │
│  BACKENDS (Cloudflare Workers)                                  │
│  ├── api.example.com        → Config Service       │
│  ├── images.example.com     → Image Generation     │
│  └── text.example.com       → Text Generation      │
│                                                                 │
│  STORAGE & STATE                                                │
│  ├── D1 Database    → instances, users, projects, model_configs │
│  ├── KV Namespace   → caching                                   │
│  ├── R2 Bucket      → generated images                          │
│  └── Durable Objects → rate limiting                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Services

| Service | URL | Status | Description |
|---------|-----|--------|-------------|
| Config Service | api.example.com | ✅ Live | Central config, auth, model management |
| Image Gen | images.example.com | ✅ Live | Ideogram image generation |
| Text Gen | text.example.com | ✅ Live | OpenAI & Anthropic text generation |
| Admin Panel | admin.example.com | ✅ Live | Instance/user/model management |
| Monitoring | monitoring.example.com | ✅ Live | Real-time metrics dashboard |
| Image Testing | testing.example.com | ✅ Live | Test image generation |
| Text Testing | text-testing.example.com | ✅ Live | Test text generation |

---

## Project Structure

```
cloudflare-multiagent/
├── infrastructure/
│   ├── config-service/     # Central API (D1 + KV)
│   ├── database/           # D1 schema & migrations
│   ├── auth/               # Authentication middleware
│   └── lookup/             # Instance resolution
├── workers/
│   ├── image-gen/          # Image generation worker
│   ├── text-gen/           # Text generation worker
│   └── shared/
│       ├── provider-adapters/  # Ideogram, OpenAI, Anthropic
│       ├── rate-limiter/       # Durable Object rate limiter
│       ├── r2-manager/         # R2 storage utilities
│       └── payload-mapper/     # Dynamic model config mapping
├── interfaces/
│   ├── admin-panel/        # React admin UI
│   ├── monitoring/         # React metrics dashboard
│   ├── testing-gui/        # Image gen testing (static)
│   └── text-testing-gui/   # Text gen testing (static)
├── scripts/                # Deployment automation
└── docs/                   # Specifications
```

---

## Current Status: ~85% Complete

### What's Working
- All 4 Workers deployed and responding
- All 4 Interfaces deployed with custom domains
- D1 database with full schema (including model_configs table)
- Rate limiting via Durable Objects
- R2 storage for generated images
- Admin Panel with model configuration UI
- CI/CD via GitHub Actions

### What's Remaining
See "Next Steps" below.

---

## Next Steps to Complete Deployment

### 1. Integrate Model Config System into Workers

The model configuration system is built (database, API, admin UI, payload mapper utility) but workers still use hardcoded provider logic.

**Image Gen Worker** (`workers/image-gen/index.ts`):
- Fetch model config from Config Service based on `model_id`
- Use payload mapper to transform requests dynamically
- Support multiple providers (not just Ideogram)

**Text Gen Worker** (`workers/text-gen/index.ts`):
- Replace hardcoded OpenAI/Anthropic logic with dynamic model selection
- Use payload mapper for unified request formatting

### 2. Dynamic Model Loading in Testing GUIs

**Text Testing GUI** (`interfaces/text-testing-gui/public/app.js`):
- Load available models from Config Service on instance selection
- Populate model dropdown dynamically
- Show model capabilities and pricing info

**Image Testing GUI** (`interfaces/testing-gui/public/app.js`):
- Same dynamic model loading

### 3. Seed Model Configurations

Add example model configs to the database:
- Ideogram V2 (image)
- DALL-E 3 (image)
- GPT-4o (text)
- Claude 3.5 Sonnet (text)

Can be done via Admin Panel or SQL migration.

### 4. Documentation Updates

- Admin guide for managing model configs
- API documentation for model config endpoints
- Update main README with final architecture

---

## Quick Commands

```bash
# Install dependencies
npm install

# Local development
npm run wrangler:dev

# Deploy all workers
npm run deploy-all

# Deploy single instance
npm run deploy-instance -- --config instances/production.json

# Run tests
npm test
```

---

## API Endpoints

### Config Service (api.example.com)
- `GET /health` - Health check
- `GET /instance/:id` - Get instance config
- `GET /model-config` - List model configurations
- `POST /model-config` - Create model config
- `PUT /model-config/:id` - Update model config
- `DELETE /model-config/:id` - Delete model config

### Image Gen (images.example.com)
- `POST /generate` - Generate image
- `GET /status/:id` - Check generation status
- `GET /health` - Health check

### Text Gen (text.example.com)
- `POST /generate` - Generate text
- `GET /health` - Health check

---

## Tech Stack

- **Compute**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Cache**: Cloudflare KV
- **State**: Cloudflare Durable Objects
- **Frontend**: React (Vite) + Static HTML/JS
- **CI/CD**: GitHub Actions
- **Language**: TypeScript

---

## Related Documentation

- `DEPLOYMENT_GUIDE.md` - Full deployment instructions
- `CUSTOM_DOMAIN_SETUP.md` - Domain configuration
- `MODEL_CONFIG_PROGRESS.md` - Model config system progress
- `AUTOMATION_GUIDE.md` - Automation scripts
