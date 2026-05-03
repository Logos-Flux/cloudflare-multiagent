# API Contracts

## Config Service API

### Base URL
`https://config-service.{instance}.workers.dev`

---

### GET /instance/{instance_id}

**Description**: Retrieve instance configuration

**Auth**: Required (API key)

**Request**:
```http
GET /instance/production HTTP/1.1
Authorization: Bearer {api_key}
```

**Response** (200 OK):
```json
{
  "instance_id": "production",
  "org_id": "your-org-id",
  "name": "Production Instance",
  "api_keys": {
    "ideogram": "ide_...xxx"
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

**Errors**:
- 401: Invalid API key
- 403: User not authorized for this instance
- 404: Instance not found

---

### POST /instance

**Description**: Create new instance

**Auth**: Required (Admin only)

**Request**:
```http
POST /instance HTTP/1.1
Authorization: Bearer {admin_api_key}
Content-Type: application/json

{
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
}
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

**Errors**:
- 401: Invalid API key
- 403: User not admin
- 409: Instance ID already exists

---

### PUT /instance/{instance_id}

**Description**: Update instance configuration

**Auth**: Required (Admin only)

**Request**:
```http
PUT /instance/production HTTP/1.1
Authorization: Bearer {admin_api_key}
Content-Type: application/json

{
  "rate_limits": {
    "ideogram": {
      "rpm": 1000,
      "tpm": 200000
    }
  }
}
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

### GET /user/{user_id}

**Description**: Get user information and permissions

**Auth**: Required

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

### POST /user

**Description**: Create new user

**Auth**: Required (Admin only)

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

## Image Generation Worker API

### Base URL
`https://image-gen-{instance}.workers.dev`

---

### POST /generate

**Description**: Generate an image using AI providers

**Auth**: Required (API key)

**Request**:
```http
POST /generate HTTP/1.1
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "prompt": "A serene mountain landscape at sunset",
  "model": "ideogram-v2",
  "instance_id": "production",
  "project_id": "demo-project",
  "options": {
    "aspect_ratio": "16:9",
    "style": "realistic"
  }
}
```

**Fields**:
- `prompt` (required): Text description of desired image
- `model` (optional): Specific model to use, defaults to instance default
- `instance_id` (optional): Instance to use, defaults from API key
- `project_id` (optional): Project for organization/billing
- `options` (optional): Provider-specific options

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

**Errors**:
- 401: Invalid API key
- 404: Instance not found
- 429: Rate limit exceeded
  ```json
  {
    "error": "Rate limit exceeded",
    "error_code": "RATE_LIMIT_EXCEEDED",
    "retry_after": 60,
    "request_id": "req_xyz"
  }
  ```
- 502: Provider API error
- 504: Provider timeout

---

### GET /status/{request_id}

**Description**: Check status of an async generation job

**Auth**: Required

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
- `pending`: Job queued
- `processing`: Generation in progress
- `completed`: Image ready
- `failed`: Generation failed

---

## Provider Adapter Interface

All providers must implement these methods:

### formatRequest(prompt, options)

**Input**:
```typescript
{
  prompt: string;
  options: {
    model?: string;
    aspect_ratio?: string;
    style?: string;
    [key: string]: any;
  }
}
```

**Output**: Provider-specific request payload

---

### submitJob(request, apiKey)

**Input**:
- `request`: Formatted provider request
- `apiKey`: Provider API key

**Output**:
```typescript
{
  job_id: string;
  status: 'pending' | 'processing';
}
```

---

### checkStatus(jobId)

**Input**: `job_id` from submitJob

**Output**:
```typescript
{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  error?: string;
}
```

---

### fetchResult(jobId)

**Input**: `job_id` from completed job

**Output**: Standardized ImageResult
```typescript
{
  image_url: string;
  image_data?: ArrayBuffer;
  provider: string;
  model: string;
  metadata: {
    dimensions: string;
    format: string;
    generation_time_ms: number;
  }
}
```

---

### supportsStreaming()

**Output**: `boolean` - Whether provider supports streaming responses

---

## Rate Limiter (Durable Object) Interface

### checkLimit(limits)

**Input**:
```typescript
{
  rpm: number;  // Requests per minute
  tpm: number;  // Tokens per minute
}
```

**Output**:
```typescript
{
  allowed: boolean;
  retry_after?: number; // Seconds until next available slot
}
```

---

### recordRequest(tokensUsed)

**Input**: `tokensUsed: number`

**Output**: `void`

**Side Effect**: Records timestamp and token usage for rate limiting

---

## R2 Storage Manager Interface

### uploadImage(imageData, options, env)

**Input**:
```typescript
imageData: ArrayBuffer | ReadableStream
options: {
  instanceId: string;
  projectId?: string;
  filename: string;
  metadata: Record<string, string>;
}
env: Env  // Cloudflare Worker environment
```

**Output**:
```typescript
{
  r2_path: string;
  cdn_url: string;
  bucket: string;
  size_bytes: number;
  uploaded_at: string;
}
```

---

## Common Headers

### All Requests
- `Authorization: Bearer {api_key}` - Required for authentication
- `Content-Type: application/json` - For POST/PUT requests
- `X-Request-ID: {uuid}` - Optional, for request tracking
- `X-Instance-ID: {instance_id}` - Optional, override default instance

### All Responses
- `X-Request-ID: {uuid}` - Request correlation ID
- `X-RateLimit-Remaining: {number}` - Requests remaining in window
- `X-RateLimit-Reset: {timestamp}` - When rate limit resets

---

**Document Version**: 1.0
**Last Updated**: 2025-11-20
**Status**: Specification for Multi-Agent Development
