# Model Config Integration - Deployment Checklist

Use this checklist to deploy the Model Config System integration to the Image Gen Worker.

## Pre-Deployment

### 1. Verify Prerequisites
- [ ] Config Service is deployed and accessible at https://api.example.com
- [ ] D1 database has `model_configs` table (check schema.sql)
- [ ] You have access to deploy workers via Wrangler CLI
- [ ] You have access to the database for seeding

### 2. Review Changes
- [ ] Review all modified files (see FILES_MODIFIED.md)
- [ ] Understand the dual-mode operation (dynamic + legacy)
- [ ] Review testing guide
- [ ] Review implementation notes

## Deployment Steps

### Step 1: Backup Current State
```bash
# Export current worker code (if needed)
cd /home/chris/projects/cloudflare-multiagent/workers/image-gen

# Note current deployment version
wrangler deployments list image-gen | head -5
```

### Step 2: Seed Model Configurations
```bash
# Navigate to database directory
cd /home/chris/projects/cloudflare-multiagent/infrastructure/database

# Verify seed file exists and is correct
cat seed-model-configs.sql | head -50

# Apply seed data to D1 database
wrangler d1 execute multi-agent-config --file=seed-model-configs.sql

# Verify data was inserted
wrangler d1 execute multi-agent-config --command="SELECT model_id, provider_id, status FROM model_configs"
```

Expected output:
```
model_id                    provider_id  status
ideogram-v2                 ideogram     active
gemini-veo-3.1             gemini       active
gemini-2.5-flash-nano...   gemini       beta
dall-e-3                   openai       active
dall-e-2                   openai       deprecated
claude-3-5-sonnet          anthropic    active
```

### Step 3: Verify Config Service
```bash
# Test health endpoint
curl https://api.example.com/health

# Test model config endpoint
curl https://api.example.com/model-config

# Test specific model
curl https://api.example.com/model-config/ideogram-v2
```

All should return 200 OK with valid JSON.

### Step 4: Deploy Image Gen Worker
```bash
# Navigate to worker directory
cd /home/chris/projects/cloudflare-multiagent/workers/image-gen

# Review wrangler.toml changes
cat wrangler.toml | grep -A5 "\[vars\]"

# Deploy worker
wrangler deploy

# Verify deployment
wrangler deployments list image-gen
```

Expected output:
```
Deployment ID: xxxx
Created: 2025-12-04
Status: Active
```

### Step 5: Verify Environment Variables
```bash
# Check worker environment via logs
wrangler tail image-gen

# In another terminal, trigger a health check
curl https://images.example.com/health
```

Look for in logs:
- R2_BUCKET configured
- DEFAULT_MODEL_ID set
- CONFIG_SERVICE_URL set

### Step 6: Test Basic Functionality
```bash
# Test 1: Health check
curl https://images.example.com/health

# Test 2: Generate with model_id
curl -X POST https://images.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape",
    "model_id": "ideogram-v2",
    "instance_id": "default"
  }'

# Test 3: Generate without model_id (uses default)
curl -X POST https://images.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic city",
    "instance_id": "default"
  }'
```

### Step 7: Monitor Logs
```bash
# Watch logs in real-time
wrangler tail image-gen

# Look for these success indicators:
# - "Fetching model config for ideogram-v2 from https://api.example.com"
# - "Successfully fetched model config for ideogram-v2"
# - "Using model config for ideogram-v2 (provider: ideogram)"
# - "Applying payload mapping from model config"
```

### Step 8: Test Fallback Mode
```bash
# Test with non-existent model
curl -X POST https://images.example.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test fallback",
    "model_id": "nonexistent-model",
    "instance_id": "default"
  }'

# Should see in logs:
# - "Model config not found for nonexistent-model - will use legacy mode"
# - "Using legacy adapter formatRequest"
```

### Step 9: Test via Testing GUI
```bash
# Open browser
open https://testing.example.com

# Or curl the GUI to verify it's accessible
curl -I https://testing.example.com
```

Steps:
1. Select instance
2. Enter prompt
3. Click Generate
4. Verify image appears
5. Check R2 URL works

### Step 10: Verify Integration Points
```bash
# Test Config Service integration
curl https://api.example.com/model-config/ideogram-v2 | jq '.data.payload_mapping'

# Test R2 integration
# (Should see images uploaded during testing)
wrangler r2 object list production-images --limit 5
```

## Post-Deployment Validation

### Functional Tests
- [ ] Image generation works with model_id parameter
- [ ] Image generation works without model_id (uses default)
- [ ] Backwards compatibility with 'model' parameter
- [ ] Fallback to legacy mode when model not found
- [ ] R2 uploads working correctly
- [ ] CDN URLs accessible
- [ ] Testing GUI working

### Performance Tests
- [ ] Response time reasonable (<10s for generation)
- [ ] No memory leaks (monitor for 1 hour)
- [ ] Config Service not rate limited
- [ ] R2 uploads not failing

### Error Scenarios
- [ ] Invalid model_id returns appropriate error
- [ ] Missing prompt returns 400 error
- [ ] Invalid instance_id returns 404 error
- [ ] Config Service timeout handled gracefully
- [ ] Provider API errors handled correctly

### Log Verification
- [ ] No unexpected errors in logs
- [ ] Model config fetches logging correctly
- [ ] Payload mapping logging correctly
- [ ] Provider responses logging correctly

## Rollback Plan

If issues are detected:

### Quick Rollback (Use Legacy Mode)
Since fallback is built-in, just delete model configs temporarily:
```bash
# Remove model config from database
wrangler d1 execute multi-agent-config --command="DELETE FROM model_configs WHERE model_id = 'ideogram-v2'"

# Worker will automatically fall back to legacy mode
```

### Full Rollback (Revert Deployment)
```bash
# List recent deployments
wrangler deployments list image-gen

# Rollback to previous deployment
wrangler rollback image-gen --deployment-id <previous-deployment-id>

# Verify rollback
curl https://images.example.com/health
```

### Database Rollback (If needed)
```bash
# Delete all model configs
wrangler d1 execute multi-agent-config --command="DELETE FROM model_configs"

# Or drop and recreate table
wrangler d1 execute multi-agent-config --file=schema.sql
```

## Monitoring

### Key Metrics to Watch
1. **Success Rate**: Image generation success vs. failures
2. **Response Time**: Time from request to image URL
3. **Config Service Calls**: Success rate of model config fetches
4. **Fallback Rate**: How often falling back to legacy mode
5. **Error Rate**: Any unexpected errors

### Log Queries
```bash
# Count model config fetches
wrangler tail image-gen | grep "Fetching model config"

# Count successful generations
wrangler tail image-gen | grep "success.*true"

# Count fallback mode usage
wrangler tail image-gen | grep "falling back to legacy mode"

# Monitor errors
wrangler tail image-gen | grep -i error
```

### Alerting (Optional)
Set up alerts for:
- Error rate > 5%
- Response time > 15s
- Config Service availability < 99%
- Fallback rate > 10%

## Success Criteria

Deployment is successful when:

- [x] Worker deploys without errors
- [x] Model configs visible in database
- [x] Config Service returns model configs
- [x] Image generation works with model_id
- [x] Fallback mode works when needed
- [x] Backwards compatibility maintained
- [x] No increase in error rate
- [x] Response times acceptable
- [x] Testing GUI works correctly
- [x] Logs show expected flow

## Next Steps After Deployment

1. **Monitor for 24 hours**
   - Watch logs for any issues
   - Check error rates
   - Verify user feedback

2. **Update Documentation**
   - Update API docs with model_id parameter
   - Create user guide for model selection
   - Document available models

3. **Add More Models**
   - Configure DALL-E 3
   - Configure Stable Diffusion
   - Test with multiple providers

4. **Update Testing GUI**
   - Load models dynamically from API
   - Show model capabilities
   - Display pricing info

5. **Implement Enhancements**
   - Add KV caching for model configs
   - Add metrics collection
   - Add retry logic

## Support

If you encounter issues:

1. **Check logs first**
   ```bash
   wrangler tail image-gen
   ```

2. **Verify Config Service**
   ```bash
   curl https://api.example.com/health
   curl https://api.example.com/model-config/ideogram-v2
   ```

3. **Check database**
   ```bash
   wrangler d1 execute multi-agent-config --command="SELECT * FROM model_configs LIMIT 5"
   ```

4. **Review documentation**
   - `/docs/MODEL_CONFIG_INTEGRATION_TESTING.md`
   - `/docs/IMPLEMENTATION_NOTES.md`
   - `/docs/MODEL_CONFIG_INTEGRATION_SUMMARY.md`

5. **Contact team**
   - Share logs
   - Share error messages
   - Share reproduction steps

## Sign-off

- [ ] Deployment completed by: _______________
- [ ] Date: _______________
- [ ] All tests passed: Yes / No
- [ ] Issues encountered: _______________
- [ ] Rollback performed: Yes / No
- [ ] Sign-off: _______________
