You are Agent 2.4 working for Team Leader 2 on the Image Generation Worker.

YOUR TASK:
Build the main Image Generation Worker that orchestrates all components into a working service.

BRANCH: agent-2-4-image-gen (create from team-2-workers)

PREREQUISITES:
Wait for Agent 2.1, 2.2, and 2.3 to complete.

CREATE:
1. /workers/image-gen/index.ts
   - Main worker handling POST /generate requests
   - Orchestrates: auth → lookup → rate limit → provider → R2 → response

2. /workers/image-gen/wrangler.toml
   - Worker configuration
   - Bindings: D1, KV, R2, Durable Objects

3. /workers/image-gen/README.md
   - API documentation
   - Example requests
   - Deployment instructions

4. /tests/image-gen/
   - E2E test with mocked provider
   - Test error handling (rate limit, provider fail, auth fail)

FLOW:
```
1. POST /generate with { prompt, api_key, instance_id }
2. Authenticate via Team 1's auth middleware → get user
3. Resolve instance via Team 1's lookup → get config
4. Check rate limit via Agent 2.2 → proceed or 429
5. Get provider adapter via Agent 2.1 → format request
6. Submit to provider (Ideogram) → get job ID
7. Poll status until complete (with timeout)
8. Fetch image result
9. Upload to R2 via Agent 2.3 → get CDN URL
10. Record usage in database
11. Return response with image URL + metadata
```

ERROR HANDLING:
- Auth fail → 401
- Instance not found → 404
- Rate limit → 429
- Provider timeout → 504, return job ID for later retrieval
- Provider error → 502, retry with fallback (future)

RESPONSE:
```json
{
  "success": true,
  "image_url": "https://cdn.../image.png",
  "r2_path": "production/demo-project/12345_image.png",
  "metadata": {
    "provider": "ideogram",
    "model": "ideogram-v2",
    "dimensions": "1024x1024",
    "generation_time_ms": 3240
  },
  "request_id": "uuid"
}
```

DEPLOYMENT:
Worker URL: https://image-gen-{instance}.{account}.workers.dev

COMPLETION:
1. Deploy to Cloudflare (use wrangler deploy)
2. Test with real Ideogram API call
3. Commit, push, notify: "[AGENT-2-4] Image Gen Worker deployed and tested"

BEGIN.
