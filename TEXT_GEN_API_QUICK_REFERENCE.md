# Text Generation API - Quick Reference

## Endpoint

```
POST https://text.example.com/generate
```

## Request Format

### Option 1: Dynamic Model Config (Recommended)

```json
{
  "prompt": "Your text prompt here",
  "model_id": "model-identifier-from-config",
  "options": {
    "temperature": 0.7,
    "max_tokens": 1000,
    "top_p": 1.0
  }
}
```

### Option 2: Legacy Format (Backward Compatible)

```json
{
  "prompt": "Your text prompt here",
  "model": "provider:model-name",
  "options": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

## Available Models

| Model ID | Provider | Name | Best For | Cost/1K |
|----------|----------|------|----------|---------|
| `gpt-4o` | OpenAI | GPT-4o | Complex tasks | $0.005 |
| `gpt-4o-mini` | OpenAI | GPT-4o Mini | Simple tasks | $0.00015 |
| `claude-3-5-sonnet` | Anthropic | Claude 3.5 Sonnet | Advanced reasoning | $0.003 |
| `claude-3-haiku` | Anthropic | Claude 3 Haiku | Fast responses | $0.00025 |

## Response Format

```json
{
  "success": true,
  "text": "Generated text response",
  "metadata": {
    "provider": "openai",
    "model": "gpt-4o",
    "tokens_used": 42,
    "generation_time_ms": 1234
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-01-16T10:30:00.000Z"
}
```

## Error Response

```json
{
  "error": "Error message",
  "error_code": "ERROR_CODE",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "details": {
    "additional": "info"
  }
}
```

## Common Error Codes

| Code | Description | Status |
|------|-------------|--------|
| `INVALID_REQUEST` | Missing or invalid prompt | 400 |
| `INSTANCE_NOT_FOUND` | Invalid instance ID | 404 |
| `INVALID_MODEL_CAPABILITY` | Model doesn't support text | 400 |
| `MISSING_API_KEY` | API key not configured | 500 |
| `PROVIDER_RATE_LIMIT` | Rate limit exceeded | 429 |
| `INVALID_API_KEY` | Invalid provider API key | 401 |
| `GENERATION_ERROR` | Text generation failed | 500 |

## Examples

### Basic Generation

```bash
curl -X POST https://text.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing",
    "model_id": "gpt-4o-mini"
  }'
```

### With Options

```bash
curl -X POST https://text.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a creative story",
    "model_id": "claude-3-5-sonnet",
    "options": {
      "temperature": 0.9,
      "max_tokens": 2000
    }
  }'
```

### Legacy Format

```bash
curl -X POST https://text.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello world",
    "model": "openai:gpt-4o-mini"
  }'
```

## Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `temperature` | number | 0.7 | Randomness (0-2) |
| `max_tokens` | number | 1000 | Max output length |
| `top_p` | number | 1.0 | Nucleus sampling |

## Use Cases

### Code Explanation
```json
{
  "prompt": "Explain this code: function fibonacci(n) { ... }",
  "model_id": "gpt-4o",
  "options": { "temperature": 0.3 }
}
```

### Creative Writing
```json
{
  "prompt": "Write a sci-fi short story about...",
  "model_id": "claude-3-5-sonnet",
  "options": { "temperature": 0.9, "max_tokens": 2000 }
}
```

### Quick Answers
```json
{
  "prompt": "What is the capital of France?",
  "model_id": "gpt-4o-mini",
  "options": { "max_tokens": 50 }
}
```

### Analysis
```json
{
  "prompt": "Analyze this data and provide insights...",
  "model_id": "claude-3-5-sonnet",
  "options": { "temperature": 0.5, "max_tokens": 1500 }
}
```

## Rate Limits

| Model | RPM | TPM |
|-------|-----|-----|
| GPT-4o | 500 | 30,000 |
| GPT-4o Mini | 500 | 200,000 |
| Claude 3.5 Sonnet | 50 | 40,000 |
| Claude 3 Haiku | 50 | 100,000 |

## Tips

1. **Choose the right model**:
   - Use mini/haiku for simple tasks
   - Use full models for complex reasoning

2. **Optimize temperature**:
   - Low (0.0-0.3): Factual, deterministic
   - Medium (0.4-0.7): Balanced
   - High (0.8-1.0+): Creative, random

3. **Set max_tokens appropriately**:
   - Too low: Truncated responses
   - Too high: Wasted tokens and cost

4. **Use model_id for flexibility**:
   - New models added without code changes
   - Easy to switch between providers

## Health Check

```bash
curl https://text.example.com/health
```

Response:
```json
{
  "status": "healthy",
  "service": "text-gen",
  "timestamp": "2025-01-16T10:30:00.000Z"
}
```

## TypeScript/JavaScript Example

```typescript
async function generateText(prompt: string, modelId: string) {
  const response = await fetch('https://text.example.com/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      model_id: modelId,
      options: {
        temperature: 0.7,
        max_tokens: 1000,
      },
    }),
  });

  const data = await response.json();

  if (data.success) {
    return data.text;
  } else {
    throw new Error(data.error);
  }
}

// Usage
const text = await generateText(
  "Explain quantum computing",
  "gpt-4o-mini"
);
console.log(text);
```

## Python Example

```python
import requests

def generate_text(prompt, model_id):
    response = requests.post(
        'https://text.example.com/generate',
        json={
            'prompt': prompt,
            'model_id': model_id,
            'options': {
                'temperature': 0.7,
                'max_tokens': 1000
            }
        }
    )

    data = response.json()

    if data.get('success'):
        return data['text']
    else:
        raise Exception(data.get('error'))

# Usage
text = generate_text(
    "Explain quantum computing",
    "gpt-4o-mini"
)
print(text)
```

## More Information

- Full Integration Guide: `/TEXT_GEN_INTEGRATION_GUIDE.md`
- Implementation Summary: `/TEXT_GEN_INTEGRATION_SUMMARY.md`
- Test Script: `/test-text-gen-integration.sh`
- Payload Mapping Spec: `/docs/PAYLOAD_MAPPING_SPEC.md`
