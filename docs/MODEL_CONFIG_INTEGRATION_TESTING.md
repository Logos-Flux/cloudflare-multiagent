# Model Config System Integration Testing Guide

This guide explains how to test the newly integrated Model Config System in the Image Gen Worker.

## Overview

The Image Gen Worker now dynamically fetches model configurations from the Config Service and uses the payload mapper to work with any image generation provider - not just hardcoded Ideogram logic.

## What Changed

### 1. New Files Created
- `/workers/shared/provider-adapters/dynamic-adapter.ts` - Generic adapter that uses payload mappings
- `/infrastructure/database/seed-model-configs.sql` - Updated with correct endpoint URLs

### 2. Modified Files
- `/workers/image-gen/index.ts` - Now fetches model config and uses dynamic adapter
- `/workers/image-gen/types.ts` - Added `model_id` parameter and config service URL
- `/workers/image-gen/wrangler.toml` - Added CONFIG_SERVICE_URL environment variable
- `/workers/shared/provider-adapters/index.ts` - Exports DynamicAdapter

## Testing the Integration

### Prerequisites

1. Config Service must be running at `https://api.example.com`
2. Model configs must be seeded in the D1 database
3. Image Gen Worker must be deployed with updated code

### Step 1: Seed Model Configurations

Run the seed script to populate model configs:

```bash
# Navigate to database directory
cd infrastructure/database

# Apply seed data to D1 database
wrangler d1 execute multi-agent-config --file=seed-model-configs.sql
```

### Step 2: Verify Config Service

Test that the Config Service can return model configs:

```bash
# List all model configs
curl https://api.example.com/model-config

# Get specific model config
curl https://api.example.com/model-config/ideogram-v2
```

Expected response:
```json
{
  "data": {
    "config_id": "cfg_ideogram_v2",
    "model_id": "ideogram-v2",
    "provider_id": "ideogram",
    "display_name": "Ideogram V2",
    "payload_mapping": {
      "endpoint": "https://api.ideogram.ai/generate",
      "method": "POST",
      "headers": {...},
      "body": {...},
      "response_mapping": {...}
    }
  }
}
```

### Step 3: Test Image Generation with Model Config

#### Test 1: Using model_id parameter (new way)

```bash
curl -X POST https://images.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape at sunset",
    "model_id": "ideogram-v2",
    "instance_id": "default",
    "options": {
      "aspect_ratio": "16:9"
    }
  }'
```

#### Test 2: Using model parameter (backwards compatible)

```bash
curl -X POST https://images.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic city skyline",
    "model": "ideogram-v2",
    "instance_id": "default"
  }'
```

#### Test 3: Without model_id (uses default)

```bash
curl -X POST https://images.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A colorful abstract painting",
    "instance_id": "default"
  }'
```

This should use `DEFAULT_MODEL_ID` from environment (ideogram-v2).

### Step 4: Test Fallback to Legacy Mode

If model config is not found, the worker should fall back to legacy adapter mode:

```bash
curl -X POST https://images.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test fallback mode",
    "model_id": "nonexistent-model",
    "instance_id": "default"
  }'
```

Expected behavior:
- Worker logs warning about model config not found
- Falls back to DEFAULT_PROVIDER (ideogram)
- Uses legacy IdeogramAdapter
- Still generates image successfully

### Step 5: Check Worker Logs

View logs to verify integration is working:

```bash
wrangler tail image-gen
```

Look for these log messages:
- `Fetching model config for ideogram-v2 from https://api.example.com`
- `Successfully fetched model config for ideogram-v2`
- `Using model config for ideogram-v2 (provider: ideogram)`
- `Applying payload mapping from model config`

If model config not found:
- `Model config not found for xxx - will use legacy mode`
- `Using legacy adapter formatRequest`

### Step 6: Test with Testing GUI

1. Open https://testing.example.com
2. Select an instance
3. Enter a prompt
4. Generate image
5. Verify:
   - Image generates successfully
   - Response includes proper metadata
   - R2 URL works

## Testing Multiple Providers (Future)

Once you add more provider configurations (DALL-E, Stable Diffusion, etc.):

1. Seed their model configs in database
2. Configure API keys in instance config
3. Test with different `model_id` values:

```bash
# Test DALL-E 3
curl -X POST https://images.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A modern office space",
    "model_id": "dall-e-3",
    "instance_id": "default",
    "options": {
      "quality": "hd"
    }
  }'
```

## Troubleshooting

### Issue: "Model config not found"

**Cause**: Model config not in database or Config Service not reachable

**Solution**:
1. Verify Config Service is running: `curl https://api.example.com/health`
2. Check if model exists: `curl https://api.example.com/model-config/ideogram-v2`
3. Re-run seed script if needed

### Issue: "API key not configured for provider"

**Cause**: Provider API key not set in instance config

**Solution**:
1. Check instance config in Config Service
2. Verify API keys are set in environment or D1
3. For testing, ensure IDEOGRAM_API_KEY secret is set

### Issue: "Provider adapter not found"

**Cause**: Provider is not registered in providerRegistry or DynamicAdapter failed

**Solution**:
1. Check worker logs for detailed error
2. Verify payload_mapping structure in database
3. Ensure provider_id is valid

### Issue: Invalid payload mapping

**Cause**: payload_mapping JSON in database is malformed

**Solution**:
1. Validate JSON structure using admin panel
2. Ensure required fields exist: endpoint, method, headers, body, response_mapping
3. Check template variables are properly formatted: `{api_key}`, `{user_prompt}`

## Success Criteria

Integration is successful when:

1. Worker can fetch model config from Config Service
2. Dynamic adapter correctly maps user input to provider request
3. Images generate successfully using model config
4. Fallback to legacy mode works when model config not found
5. Multiple models can be used by changing `model_id` parameter
6. Backwards compatibility maintained (existing API calls work)

## Next Steps

After successful testing:

1. Update Testing GUI to load models dynamically from Config Service
2. Add more provider configurations (DALL-E, Stable Diffusion, etc.)
3. Implement similar integration in Text Gen Worker
4. Update documentation for users
5. Add monitoring for model config fetches
