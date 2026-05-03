# System Architecture

## Hierarchical Model: Organization → Instance → Project

### Organization
- Top-level entity (e.g., Acme Corp., Voltage Labs)
- Has Admins who manage everything below
- Multiple instances can belong to one organization

### Instance (Key Concept - Like a VM)
Self-contained environment with its own:
- **API Keys**: Shared by all projects in this instance
- **Rate Limits**: Shared pool across all projects
- **Worker Deployments**: Full set of workers
- **R2 Storage Buckets**: Instance-specific storage
- **Configuration**: Isolated from other instances

Examples: "production", "development", "staging", "client-xyz"

### Project (Lightweight - Just Metadata)
- Logical grouping within an instance
- All projects in an instance share that instance's resources
- Examples: "Demo Project", "Solar Proposals", "Website Chat"

---

## Instance Config Structure

```json
{
  "instance_id": "string",
  "org_id": "string",
  "api_keys": {
    "provider_name": "string"
  },
  "rate_limits": {
    "provider_name": {
      "rpm": "number",
      "tpm": "number"
    }
  },
  "worker_urls": {
    "worker_type": "https://url"
  },
  "r2_bucket": "string",
  "authorized_users": ["user_id"]
}
```

---

## API Key Format

### Storage Requirements
- All API keys **must be stored encrypted** in D1 database
- Retrieved via Config Service only
- **Never logged** to console, files, or monitoring systems
- Rotation supported through Config Service API

### Encryption
- Use Cloudflare's built-in encryption for D1
- Keys encrypted at rest
- Decrypted only when needed for provider API calls
- Never returned in API responses (only metadata)

---

## Rate Limit Tracking

### Implementation
- **Durable Object** per instance+provider combination
- Key format: `instance:{instance_id}:provider:{provider}`
- Example: `instance:production:provider:ideogram`

### Algorithm
- Rolling window algorithm
- Track requests per minute (RPM) and tokens per minute (TPM)
- Graceful degradation when limits hit (queue or reject)

### Behavior
- When limit reached: Return 429 with Retry-After header
- Queue system can defer requests
- Cross-project coordination within same instance

---

## Database Schema Overview

### Tables

**organizations**
- org_id (PK, TEXT)
- name (TEXT)
- billing_email (TEXT)
- created_at (TIMESTAMP)

**instances**
- instance_id (PK, TEXT)
- org_id (FK → organizations)
- name (TEXT)
- config (JSON) - Full instance configuration
- created_at (TIMESTAMP)

**users**
- user_id (PK, TEXT)
- email (TEXT, UNIQUE)
- role (TEXT) - 'user', 'admin', 'superadmin'
- org_id (FK → organizations)
- created_at (TIMESTAMP)

**user_instance_access**
- user_id (FK → users)
- instance_id (FK → instances)
- PRIMARY KEY (user_id, instance_id)

**projects**
- project_id (PK, TEXT)
- instance_id (FK → instances)
- name (TEXT)
- settings (JSON)
- created_at (TIMESTAMP)

**api_keys**
- key_id (PK, TEXT)
- user_id (FK → users, nullable)
- project_id (FK → projects, nullable)
- key_hash (TEXT) - SHA-256 hash of the key
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP, nullable)

**usage_logs**
- log_id (PK, TEXT)
- instance_id (FK → instances)
- timestamp (TIMESTAMP)
- provider (TEXT)
- tokens_used (INTEGER)
- cost (REAL)
- request_id (TEXT)

---

## Worker Architecture

### Config Service Worker
- **Purpose**: Central configuration and instance management
- **Endpoints**:
  - GET /instance/{instance_id}
  - POST /instance (create)
  - PUT /instance/{instance_id} (update)
  - GET /user/{user_id}
  - POST /user (create)
- **Bindings**: D1 (database), KV (cache)

### Image Generation Worker
- **Purpose**: Generate images via AI providers
- **Endpoints**:
  - POST /generate
- **Bindings**: D1, R2 (storage), Durable Objects (rate limiter)
- **Flow**: Auth → Lookup → Rate Check → Provider → Storage → Response

### Rate Limiter (Durable Object)
- **Purpose**: Enforce per-instance rate limits
- **Methods**:
  - checkLimit(rpm, tpm) → boolean
  - recordRequest(tokensUsed) → void
- **State**: In-memory timestamps, token counts

### R2 Storage Manager
- **Purpose**: Save generated content to R2
- **Features**:
  - Instance-specific buckets
  - CDN URL generation
  - Metadata attachment

---

## Authentication Flow

1. Client sends request with `Authorization: Bearer {api_key}` header
2. Auth middleware hashes the key
3. Lookup key_hash in database → get user_id
4. Load user and their instance access
5. Attach to request context: `ctx.auth = { user, instances, permissions }`
6. If not found: Return 401 Unauthorized

---

## Instance Lookup Flow

1. Authenticated request arrives
2. Extract instance_id from:
   - Header: `X-Instance-ID`
   - Request body: `instance_id` field
   - Or use user's default instance
3. Check KV cache for instance config (5 min TTL)
4. On cache miss: Query Config Service
5. Store in KV cache
6. Return instance configuration

---

## Error Handling Standards

### HTTP Status Codes
- **200**: Success
- **401**: Unauthorized (invalid/missing API key)
- **403**: Forbidden (user lacks access to instance)
- **404**: Not Found (instance/resource doesn't exist)
- **429**: Rate Limited (exceeded rate limits)
- **500**: Internal Error (unexpected failure)
- **502**: Bad Gateway (provider API error)
- **503**: Service Unavailable (temporary failure)
- **504**: Gateway Timeout (provider timeout)

### Error Response Format
```json
{
  "error": "Human-readable error message",
  "error_code": "MACHINE_READABLE_CODE",
  "request_id": "uuid",
  "details": {
    "field": "additional context"
  }
}
```

---

## Performance Targets

- **Config Service**: < 50ms response time
- **Instance Lookup**: < 20ms (cached), < 100ms (uncached)
- **Image Generation**: < 15s end-to-end
- **Rate Limiter**: < 5ms overhead
- **R2 Upload**: < 2s for typical images

---

## Security Considerations

1. **API Keys**: Never log, always hash, rotate regularly
2. **Instance Isolation**: Strict enforcement via database FKs
3. **Rate Limiting**: Prevent abuse, DDoS protection
4. **Input Validation**: All user input sanitized
5. **CORS**: Configured per instance requirements
6. **Secrets**: Never in git, only in environment variables

---

**Document Version**: 1.0
**Last Updated**: 2025-11-20
**Status**: Specification for Multi-Agent Development
