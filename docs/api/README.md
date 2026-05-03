# API Reference

Complete API documentation for the Cloudflare Multi-Agent System.

## Base URLs

- **Config Service**: `https://config-service.{instance}.workers.dev`
- **Image Generation**: `https://image-gen-{instance}.workers.dev`

## Authentication

All API endpoints require authentication via Bearer token:

```http
Authorization: Bearer {api_key}
```

API keys can be generated through the Admin Panel or Config Service API.

## Config Service API

### Get Instance Configuration

Retrieve configuration for a specific instance.

**Endpoint**: `GET /instance/{instance_id}`

**Request**:
```bash
curl -X GET https://config-service.production.workers.dev/instance/production \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response** (200 OK):
```json
{
  "instance_id": "production",
  "org_id": "your-org-id",
  "name": "Production Instance",
  "api_keys": {
    "ideogram": "ide_***xxx"
  },
  "rate_limits": {
    "ideogram": {
      "rpm": 500,
      "tpm": 100000
    }
  },
  "worker_urls": {
    "image_gen": "https://image-gen-production.workers.dev"
  },
  "r2_bucket": "prod-images",
  "authorized_users": ["user_123", "user_456"],
  "created_at": "2025-11-20T00:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized` - Invalid or missing API key
- `403 Forbidden` - User not authorized for this instance
- `404 Not Found` - Instance doesn't exist

---

### Create Instance

Create a new worker instance.

**Endpoint**: `POST /instance`

**Request**:
```bash
curl -X POST https://config-service.production.workers.dev/instance \
  -H "Authorization: Bearer ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instance_id": "staging",
    "org_id": "your-org-id",
    "name": "Staging Instance",
    "api_keys": {
      "ideogram": "ide_staging_key"
    },
    "rate_limits": {
      "ideogram": {
        "rpm": 100,
        "tpm": 50000
      }
    },
    "r2_bucket": "staging-images"
  }'
```

**Response** (201 Created):
```json
{
  "instance_id": "staging",
  "org_id": "your-org-id",
  "name": "Staging Instance",
  "created_at": "2025-11-20T12:30:00Z",
  "worker_urls": {
    "image_gen": "https://image-gen-staging.workers.dev"
  }
}
```

---

### Update Instance

Update instance configuration.

**Endpoint**: `PUT /instance/{instance_id}`

**Request**:
```bash
curl -X PUT https://config-service.production.workers.dev/instance/production \
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

**Response** (200 OK):
```json
{
  "instance_id": "production",
  "updated_at": "2025-11-20T12:35:00Z",
  "message": "Instance configuration updated"
}
```

---

### Get User Information

Retrieve user details and permissions.

**Endpoint**: `GET /user/{user_id}`

**Response** (200 OK):
```json
{
  "user_id": "user_123",
  "email": "developer@example.com",
  "role": "user",
  "org_id": "your-org-id",
  "instances": ["production", "development"],
  "created_at": "2025-01-15T00:00:00Z"
}
```

---

### Create User

Create a new user.

**Endpoint**: `POST /user`

**Request**:
```json
{
  "email": "newdev@example.com",
  "role": "user",
  "org_id": "your-org-id",
  "instances": ["development"]
}
```

**Response** (201 Created):
```json
{
  "user_id": "user_789",
  "email": "newdev@example.com",
  "api_key": "ak_xxxxxxxxxx",
  "created_at": "2025-11-20T12:40:00Z"
}
```

---

## Image Generation API

### Generate Image

Generate an image using AI providers.

**Endpoint**: `POST /generate`

**Request**:
```bash
curl -X POST https://image-gen-production.workers.dev/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape at sunset",
    "model": "ideogram-v2",
    "instance_id": "production",
    "project_id": "demo-project",
    "options": {
      "aspect_ratio": "16:9",
      "style": "realistic"
    }
  }'
```

**Fields**:
- `prompt` (required) - Text description of desired image
- `model` (optional) - Specific model to use
- `instance_id` (optional) - Override default instance
- `project_id` (optional) - Project for organization
- `options` (optional) - Provider-specific options

**Response** (200 OK):
```json
{
  "success": true,
  "image_url": "https://cdn.example.com/production/demo-project/12345_image.png",
  "r2_path": "production/demo-project/12345_image.png",
  "metadata": {
    "provider": "ideogram",
    "model": "ideogram-v2",
    "dimensions": "1920x1080",
    "format": "png",
    "generation_time_ms": 3240
  },
  "request_id": "req_abcdef123456",
  "timestamp": "2025-11-20T12:45:00Z"
}
```

**Error Responses**:
- `429 Too Many Requests` - Rate limit exceeded
  ```json
  {
    "error": "Rate limit exceeded",
    "error_code": "RATE_LIMIT_EXCEEDED",
    "retry_after": 60,
    "request_id": "req_xyz"
  }
  ```
- `502 Bad Gateway` - Provider API error
- `504 Gateway Timeout` - Provider timeout

---

### Check Generation Status

Check status of an async generation job.

**Endpoint**: `GET /status/{request_id}`

**Response** (200 OK):
```json
{
  "request_id": "req_abcdef123456",
  "status": "completed",
  "image_url": "https://cdn.example.com/...",
  "progress": 100
}
```

**Status Values**:
- `pending` - Job queued
- `processing` - Generation in progress
- `completed` - Image ready
- `failed` - Generation failed

---

## Common Headers

### Request Headers
- `Authorization: Bearer {api_key}` - Required for authentication
- `Content-Type: application/json` - For POST/PUT requests
- `X-Request-ID: {uuid}` - Optional, for request tracking
- `X-Instance-ID: {instance_id}` - Optional, override default instance

### Response Headers
- `X-Request-ID: {uuid}` - Request correlation ID
- `X-RateLimit-Remaining: {number}` - Requests remaining in window
- `X-RateLimit-Reset: {timestamp}` - When rate limit resets

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit hit |
| `INVALID_REQUEST` | 400 | Malformed request |
| `INTERNAL_ERROR` | 500 | Server error |
| `PROVIDER_ERROR` | 502 | AI provider error |
| `PROVIDER_TIMEOUT` | 504 | Provider timeout |

---

## Rate Limits

Rate limits are per-instance and shared across all projects in that instance.

**Default Limits**:
- Production: 500 requests/minute, 100K tokens/minute
- Development: 100 requests/minute, 50K tokens/minute

**Headers**:
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Unix timestamp when limit resets

**Exceeding Limits**:
- Returns `429 Too Many Requests`
- Includes `Retry-After` header (seconds)

---

## Examples

### Complete Example: Generate Image

```javascript
async function generateImage(prompt) {
  const response = await fetch('https://image-gen-production.workers.dev/generate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: prompt,
      instance_id: 'production',
      options: {
        aspect_ratio: '16:9',
        style: 'realistic'
      }
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`${error.error_code}: ${error.error}`)
  }

  const result = await response.json()
  return result.image_url
}

// Usage
const imageUrl = await generateImage('A serene mountain landscape')
console.log('Image generated:', imageUrl)
```

### Python Example

```python
import requests

def generate_image(prompt, api_key):
    url = 'https://image-gen-production.workers.dev/generate'
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    data = {
        'prompt': prompt,
        'instance_id': 'production',
        'options': {
            'aspect_ratio': '16:9',
            'style': 'realistic'
        }
    }

    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()

    return response.json()['image_url']

# Usage
image_url = generate_image('A serene mountain landscape', 'YOUR_API_KEY')
print(f'Image generated: {image_url}')
```

---

**For more details, see the [API Contracts Specification](../specs/api-contracts.md)**
