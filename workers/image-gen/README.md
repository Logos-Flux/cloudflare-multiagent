# Image Generation Worker

Main worker that orchestrates AI image generation using multiple providers.

## Features

- **Provider-Agnostic**: Supports multiple AI providers via adapter framework
- **Rate Limiting**: Per-instance, per-provider rate limiting using Durable Objects
- **R2 Storage**: Automatic upload and CDN URL generation
- **Error Handling**: Comprehensive error handling with retry logic
- **Monitoring**: Request ID tracking for debugging

## API

### POST /generate

Generate an image using AI providers.

**Request:**
```json
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

**Response (200 OK):**
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

**Error Responses:**
- `400`: Invalid request (missing prompt, etc.)
- `404`: Instance not found
- `429`: Rate limit exceeded
- `500`: Internal error
- `502`: Provider API error
- `504`: Generation timeout

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "image-gen"
}
```

## Workflow

1. **Receive Request**: Parse and validate incoming generation request
2. **Get Instance Config**: Retrieve instance configuration (from Team 1's Config Service)
3. **Check Rate Limits**: Verify request is within rate limits using Durable Object
4. **Get Provider Adapter**: Load appropriate provider adapter (e.g., Ideogram)
5. **Submit Job**: Send generation request to provider API
6. **Poll Status**: Wait for generation to complete (with timeout)
7. **Download Image**: Fetch generated image from provider
8. **Upload to R2**: Store image in R2 with metadata
9. **Generate CDN URL**: Create public CDN URL for the image
10. **Return Response**: Send success response with image URL

## Configuration

### Environment Variables

- `DEFAULT_PROVIDER`: Default AI provider to use (default: "ideogram")
- `CDN_URL`: CDN base URL for serving images
- `DEFAULT_INSTANCE_ID`: Fallback instance ID if not specified

### Secrets

Set with `wrangler secret put <NAME>`:

- `IDEOGRAM_API_KEY`: Ideogram API key (or retrieved from instance config)

### Bindings

- `CONFIG_DB`: D1 database (Team 1's config service)
- `KV_CACHE`: KV namespace for caching instance configs
- `R2_BUCKET`: R2 bucket for image storage
- `RATE_LIMITER`: Durable Object namespace for rate limiting

## Deployment

```bash
# Deploy to Cloudflare
wrangler deploy

# Deploy to specific environment
wrangler deploy --env production

# Tail logs
wrangler tail

# Test locally
wrangler dev
```

## Testing

```bash
# Run tests
npm test workers/image-gen

# Test with curl
curl -X POST https://image-gen.workers.dev/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "instance_id": "production",
    "project_id": "test"
  }'
```

## Dependencies

- **Team 1**: Config Service (for instance configuration)
- **Agent 2.1**: Provider Adapter Framework
- **Agent 2.2**: Rate Limiter Durable Object
- **Agent 2.3**: R2 Storage Manager

## Integration Points

### With Team 1 (Infrastructure)

- Calls Config Service to get instance configuration
- Uses authentication middleware for API key validation
- Uses instance lookup logic for resolving instance IDs

### With Other Workers

- Can be extended to support multiple generation types (text, video, etc.)
- Shares rate limiter with other workers for coordinated limiting
- Uses shared R2 storage infrastructure

## Error Handling

- **Provider Timeouts**: 60 second timeout with clear error message
- **Rate Limits**: Returns 429 with retry-after header
- **Missing Config**: Returns 404 for unknown instances
- **Provider Errors**: Returns 502 with provider error details
- **Request Tracking**: All errors include request_id for debugging

## Performance

- **Generation Time**: ~3-15 seconds end-to-end
- **Polling Interval**: 2 seconds
- **Timeout**: 60 seconds max
- **R2 Upload**: ~1-2 seconds for typical images

## Future Enhancements

- Support for multiple providers (DALL-E, Midjourney, etc.)
- Async job handling with webhook callbacks
- Queue system for rate limit handling
- Image variations and edits
- Batch generation
- Cost tracking and billing
