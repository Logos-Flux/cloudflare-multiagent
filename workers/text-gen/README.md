# Text Generation Worker

AI-powered text generation service using multiple providers (OpenAI, Anthropic). Part of the Cloudflare Multi-Agent multi-agent AI platform.

## Overview

The text generation worker provides a unified API for generating text content using various LLM providers. It handles authentication, rate limiting, and model selection, making it easy to integrate text generation into any application.

## Features

- **Multi-Provider Support**: OpenAI (GPT-4o, GPT-4 Turbo, GPT-4o-mini) and Anthropic (Claude 3.5 Sonnet, Claude 3.5 Haiku)
- **Selectable Models**: Choose the best model for your use case via the API
- **Instance-Based Auth**: Secure authentication using instance-specific API keys
- **Rate Limiting**: Built-in rate limiting per instance and provider
- **Advanced Options**: Control temperature, max tokens, and other parameters
- **CORS Enabled**: Ready for frontend integration

## Deployment

### Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed
- API keys for OpenAI and/or Anthropic

### Deploy

```bash
cd workers/text-gen

# Set your API keys as secrets
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY

# Deploy the worker
npx wrangler deploy
```

### Custom Domain

The worker is configured for `text.example.com`. To set up:

1. Add DNS CNAME record pointing `text` to `@`
2. Route is configured in `wrangler.toml`
3. Deploy will automatically set up the route

## API Reference

### POST /generate

Generate text from a prompt.

**Request:**
```json
{
  "prompt": "Write a haiku about clouds",
  "model": "gpt-4o-mini",
  "instance_id": "production",
  "options": {
    "max_tokens": 1000,
    "temperature": 0.7,
    "top_p": 1.0
  }
}
```

**Response:**
```json
{
  "success": true,
  "text": "Soft clouds drift above\nWhite pillows in azure sky\nNature's gentle art",
  "metadata": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "tokens_used": 28,
    "generation_time_ms": 1234
  },
  "request_id": "abc-123-def",
  "timestamp": "2024-01-24T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "error": "Prompt is required",
  "error_code": "INVALID_REQUEST",
  "request_id": "abc-123-def",
  "details": {}
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "text-gen",
  "timestamp": "2024-01-24T12:00:00.000Z"
}
```

## Supported Models

### OpenAI
- `gpt-4o` - Most capable model
- `gpt-4o-mini` - Fast and cost-effective (default)
- `gpt-4-turbo` - Previous generation flagship

### Anthropic
- `claude-3-5-sonnet-20241022` - Most capable Claude model (default for Anthropic)
- `claude-3-5-haiku-20241022` - Fast and cost-effective

## Configuration

### Environment Variables

Set in `wrangler.toml`:
- `DEFAULT_PROVIDER`: Default provider to use (default: "openai")

### Secrets

Set via `wrangler secret put`:
- `OPENAI_API_KEY`: Your OpenAI API key
- `ANTHROPIC_API_KEY`: Your Anthropic API key

### Instance Configuration

In production, instance configuration (API keys, rate limits) should be managed via the Config Service. The worker currently uses mock configuration for MVP.

## Rate Limiting

Rate limiting is handled per instance and provider using Durable Objects. Configure limits in the Config Service:

```javascript
{
  "instance_id": "production",
  "rate_limits": {
    "openai": {
      "rpm": 100,    // requests per minute
      "tpm": 50000   // tokens per minute
    },
    "anthropic": {
      "rpm": 50,
      "tpm": 50000
    }
  }
}
```

## Testing

Use the Text Testing GUI at `text-testing.example.com` or test with curl:

```bash
curl -X POST https://text.example.com/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a short poem about technology",
    "model": "gpt-4o-mini",
    "instance_id": "production",
    "options": {
      "max_tokens": 500,
      "temperature": 0.8
    }
  }'
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Missing or invalid parameters |
| `INSTANCE_NOT_FOUND` | Instance ID not found |
| `MISSING_API_KEY` | API key not configured for provider |
| `INVALID_API_KEY` | API key is invalid or expired |
| `PROVIDER_RATE_LIMIT` | Provider rate limit exceeded |
| `RATE_LIMIT_EXCEEDED` | Instance rate limit exceeded |
| `GATEWAY_TIMEOUT` | Generation took too long |
| `GENERATION_ERROR` | General generation error |

## Architecture

```
User Request
    ↓
Text-Gen Worker
    ↓
┌───────────────────────┐
│ 1. Validate Request   │
│ 2. Get Instance Config│
│ 3. Check Rate Limits  │
│ 4. Select Provider    │
│ 5. Generate Text      │
│ 6. Return Response    │
└───────────────────────┘
    ↓
OpenAI or Anthropic API
```

## Future Enhancements

- [ ] Streaming responses
- [ ] More providers (Gemini, Mistral, etc.)
- [ ] Prompt templates and management
- [ ] Response caching
- [ ] Token usage tracking and billing
- [ ] Integration with larger swarm workflows
- [ ] Output formatting and post-processing

## Related Services

- **Text Testing GUI**: Interactive web interface for testing
- **Config Service**: Central configuration management
- **Rate Limiter**: Durable Object-based rate limiting
- **Admin Panel**: Instance and API key management

## Support

For issues or questions:
- GitHub: https://github.com/Logos-Flux/cloudflare-multiagent
- Documentation: `/docs`

---

**Built with Claude Code** | **Powered by Cloudflare Workers**
