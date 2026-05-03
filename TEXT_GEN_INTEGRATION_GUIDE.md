# Text Generation Worker - Model Config Integration Guide

## Overview

The Text Generation Worker has been successfully integrated with the Model Configuration System. This allows the worker to dynamically fetch model configurations from the Config Service and use the payload mapper to support any text generation provider without code changes.

## What Changed

### 1. New Types (`workers/text-gen/types.ts`)

Added support for model configuration:

```typescript
// New request parameter
export interface GenerateRequest {
  prompt: string;
  model?: string;           // Legacy: provider:model format
  model_id?: string;        // New: Model config ID from database
  instance_id?: string;
  project_id?: string;
  options?: { ... };
}

// New model config types
export interface ModelConfig {
  config_id: string;
  model_id: string;
  provider_id: string;
  display_name: string;
  capabilities: Capabilities;
  payload_mapping: PayloadMapping;
  // ... other fields
}
```

### 2. Dynamic Model Config Support (`workers/text-gen/index.ts`)

New functions added:

- `fetchModelConfig(modelId, env)` - Fetches model config from Config Service
- `generateWithModelConfig(modelConfig, prompt, options, apiKey)` - Generates text using dynamic payload mapping
- `getProviderBaseUrl(providerId)` - Returns base URL for different providers

### 3. Enhanced Request Flow

The `handleGenerate` function now:

1. Checks if `model_id` is provided
2. If yes:
   - Fetches model config from Config Service
   - Validates model has text capability
   - Uses payload mapper to build provider request
   - Sends request to provider API
   - Extracts response using response mapping
3. If no:
   - Falls back to legacy hardcoded OpenAI/Anthropic functions
   - Maintains backward compatibility

### 4. Environment Configuration

Updated `wrangler.toml`:

```toml
[vars]
DEFAULT_PROVIDER = "openai"
CONFIG_SERVICE_URL = "https://api.example.com"
```

## How to Use

### Option 1: Using Model ID (Dynamic Config)

Request with `model_id` to use dynamic model configuration:

```bash
curl -X POST https://text.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a haiku about programming",
    "model_id": "gpt-4o",
    "options": {
      "temperature": 0.8,
      "max_tokens": 500
    }
  }'
```

### Option 2: Legacy Model Parameter (Hardcoded)

Request with `model` parameter still works (backward compatible):

```bash
curl -X POST https://text.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a haiku about programming",
    "model": "openai:gpt-4o-mini"
  }'
```

### Option 3: Default Provider

Request without model specified uses default:

```bash
curl -X POST https://text.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a haiku about programming"
  }'
```

## Available Text Models

The following text generation models are available in the seed data:

### Anthropic

1. **Claude 3.5 Sonnet** (`claude-3-5-sonnet`)
   - Most capable for complex tasks
   - Cost: $0.003 per 1K tokens
   - RPM: 50, TPM: 40,000

2. **Claude 3 Haiku** (`claude-3-haiku`)
   - Fastest for instant responses
   - Cost: $0.00025 per 1K tokens
   - RPM: 50, TPM: 100,000

### OpenAI

1. **GPT-4o** (`gpt-4o`)
   - Latest flagship model
   - Cost: $0.005 per 1K tokens
   - RPM: 500, TPM: 30,000

2. **GPT-4o Mini** (`gpt-4o-mini`)
   - Cost-effective for simpler tasks
   - Cost: $0.00015 per 1K tokens
   - RPM: 500, TPM: 200,000

## Testing Steps

### 1. Deploy Database Changes

If not already deployed, load the seed data:

```bash
# Load initial seed data (includes Claude 3.5 Sonnet)
wrangler d1 execute DB --file=infrastructure/database/seed-model-configs.sql

# Load additional text models (GPT-4o, GPT-4o Mini, Claude Haiku)
wrangler d1 execute DB --file=infrastructure/database/seed-text-models.sql
```

### 2. Deploy Text-Gen Worker

```bash
cd workers/text-gen
wrangler deploy
```

### 3. Test Dynamic Model Config

Test with Claude 3.5 Sonnet:

```bash
curl -X POST https://text.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in one sentence",
    "model_id": "claude-3-5-sonnet",
    "options": {
      "temperature": 0.7
    }
  }'
```

Test with GPT-4o:

```bash
curl -X POST https://text.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in one sentence",
    "model_id": "gpt-4o",
    "options": {
      "max_tokens": 100,
      "temperature": 0.5
    }
  }'
```

### 4. Test Fallback Behavior

Test with non-existent model (should fall back to legacy):

```bash
curl -X POST https://text.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello world",
    "model_id": "non-existent-model",
    "model": "openai:gpt-4o-mini"
  }'
```

### 5. Verify Response Format

Expected response:

```json
{
  "success": true,
  "text": "Quantum computing harnesses quantum mechanical phenomena...",
  "metadata": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet",
    "tokens_used": 42,
    "generation_time_ms": 1234
  },
  "request_id": "uuid-here",
  "timestamp": "2025-01-16T10:30:00Z"
}
```

## Architecture Benefits

### 1. Zero-Code Model Addition

Add new text models via Admin Panel without deploying code:

1. Open Admin Panel → Models
2. Click "Add Model Config"
3. Fill in model details and payload mapping
4. Save
5. Model immediately available to all users

### 2. Provider Flexibility

Support any text provider by configuring payload mapping:

- OpenAI
- Anthropic
- Google (Gemini)
- Cohere
- Mistral
- Any custom LLM API

### 3. Unified Interface

Users provide simple inputs:

```json
{
  "prompt": "User's question",
  "model_id": "any-configured-model",
  "options": {
    "temperature": 0.8
  }
}
```

System handles:
- Provider-specific payload formatting
- Authentication headers
- Request/response transformation
- Error handling

### 4. Graceful Fallback

If model config not found:
- Worker logs a warning
- Falls back to hardcoded OpenAI/Anthropic functions
- User still gets a response

## Adding a New Provider

Example: Adding Cohere text generation

### 1. Create Model Config

Via Admin Panel or API:

```json
{
  "model_id": "cohere-command-r",
  "provider_id": "cohere",
  "display_name": "Cohere Command R",
  "capabilities": {
    "text": true
  },
  "payload_mapping": {
    "endpoint": "/v1/generate",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer {api_key}",
      "Content-Type": "application/json"
    },
    "body": {
      "prompt": "{user_prompt}",
      "max_tokens": "{max_tokens}",
      "temperature": "{temperature}"
    },
    "response_mapping": {
      "text": "$.generations[0].text",
      "tokens_used": "$.meta.tokens.total_tokens"
    },
    "defaults": {
      "max_tokens": "1000",
      "temperature": "0.7"
    }
  },
  "status": "active"
}
```

### 2. Add Provider Base URL (if needed)

If provider not in `getProviderBaseUrl()`, add it:

```typescript
function getProviderBaseUrl(providerId: string): string {
  const providerUrls: Record<string, string> = {
    openai: 'https://api.openai.com',
    anthropic: 'https://api.anthropic.com',
    cohere: 'https://api.cohere.ai',  // Add this
    // ...
  };
  return providerUrls[providerId.toLowerCase()] || `https://api.${providerId}.com`;
}
```

### 3. Configure API Key

Add API key to instance config or environment:

```bash
wrangler secret put COHERE_API_KEY
```

### 4. Test

```bash
curl -X POST https://text.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test prompt",
    "model_id": "cohere-command-r"
  }'
```

## Troubleshooting

### Model Config Not Found

**Symptom**: Warning in logs: "Model config not found for {model_id}, falling back to hardcoded providers"

**Causes**:
1. Model not in database
2. Config Service unavailable
3. Wrong model_id spelling

**Solutions**:
- Check model exists: `curl https://api.example.com/model-config/{model_id}`
- Add model via Admin Panel
- Use correct model_id from database

### Invalid Payload Mapping

**Symptom**: Error: "Invalid payload mapping in model config"

**Causes**:
- Missing required fields (endpoint, method, headers, body, response_mapping)
- Malformed JSON in database

**Solutions**:
- Verify payload mapping via Admin Panel
- Use payload mapping examples from docs
- Test mapping with `validatePayloadMapping()` utility

### API Key Missing

**Symptom**: Error: "API key not configured for provider: {provider}"

**Causes**:
- API key not in instance config
- API key not in environment secrets

**Solutions**:
- Add API key via Admin Panel → Instances
- Set secret: `wrangler secret put {PROVIDER}_API_KEY`

### Provider API Error

**Symptom**: Error: "Provider API error (4xx/5xx): {message}"

**Causes**:
- Invalid API key
- Incorrect payload mapping
- Provider rate limit
- Provider service issue

**Solutions**:
- Verify API key is valid
- Check payload mapping matches provider docs
- Check provider status page
- Review worker logs for raw request/response

## Code Examples

### Testing Payload Mapping Locally

```typescript
import {
  applyPayloadMapping,
  applyResponseMapping,
} from '../shared/utils/payload-mapper';

// Test OpenAI payload mapping
const openaiMapping = {
  endpoint: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer {api_key}',
    'Content-Type': 'application/json',
  },
  body: {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: '{user_prompt}' }],
    max_tokens: 1000,
  },
  response_mapping: {
    text: '$.choices[0].message.content',
    tokens_used: '$.usage.total_tokens',
  },
};

const request = applyPayloadMapping(
  openaiMapping,
  { user_prompt: 'Hello!', max_tokens: 500 },
  'sk-test-key'
);

console.log('Generated request:', JSON.stringify(request, null, 2));
```

### Adding Custom Provider Headers

Some providers need special headers:

```json
{
  "headers": {
    "Authorization": "Bearer {api_key}",
    "X-Custom-Header": "custom-value",
    "User-Agent": "DistributedElectrons/1.0"
  }
}
```

### Response Mapping Examples

Simple field:
```json
{
  "text": "$.content"
}
```

Nested field:
```json
{
  "text": "$.response.data.message.text"
}
```

Array index:
```json
{
  "text": "$.choices[0].text"
}
```

Multiple fields:
```json
{
  "text": "$.content[0].text",
  "tokens_used": "$.usage.total_tokens",
  "model": "$.model",
  "finish_reason": "$.stop_reason"
}
```

## Performance Considerations

### Config Service Caching

The worker fetches model configs from the Config Service on each request. For production, consider:

1. **KV Cache**: Cache model configs in KV for 1 hour
2. **Worker Cache**: Cache in-memory for worker instance lifetime
3. **CDN Cache**: Config Service can set cache headers

Example with KV cache:

```typescript
async function fetchModelConfig(
  modelId: string,
  env: Env
): Promise<ModelConfig | null> {
  // Try cache first
  if (env.MODEL_CONFIG_CACHE) {
    const cached = await env.MODEL_CONFIG_CACHE.get(modelId, 'json');
    if (cached) return cached;
  }

  // Fetch from Config Service
  const config = await /* fetch logic */;

  // Cache for 1 hour
  if (config && env.MODEL_CONFIG_CACHE) {
    await env.MODEL_CONFIG_CACHE.put(
      modelId,
      JSON.stringify(config),
      { expirationTtl: 3600 }
    );
  }

  return config;
}
```

## Files Modified

1. `/workers/text-gen/types.ts` - Added ModelConfig types
2. `/workers/text-gen/index.ts` - Added dynamic config support
3. `/workers/text-gen/wrangler.toml` - Added CONFIG_SERVICE_URL
4. `/infrastructure/database/seed-text-models.sql` - Added text model seed data

## Next Steps

1. **Deploy**: Deploy text-gen worker to production
2. **Test**: Verify all model configs work correctly
3. **Monitor**: Watch logs for any errors or fallbacks
4. **Optimize**: Add caching if needed for performance
5. **Document**: Update user-facing docs with new models

## Related Documentation

- [Payload Mapping Specification](docs/PAYLOAD_MAPPING_SPEC.md)
- [Model Configuration Plan](docs/MODEL_CONFIGURATION_PLAN.md)
- [Model Config Admin Guide](docs/MODEL_CONFIG_ADMIN_GUIDE.md)
- [Model Config Progress](MODEL_CONFIG_PROGRESS.md)

## Support

For issues or questions:
1. Check worker logs: `wrangler tail`
2. Test Config Service: `curl https://api.example.com/model-config`
3. Review this guide
4. Check payload mapping examples in docs
