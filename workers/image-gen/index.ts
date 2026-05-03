/**
 * Image Generation Worker
 * Main worker that orchestrates image generation workflow
 */

import { providerRegistry, DynamicAdapter } from '../shared/provider-adapters';
import type { DynamicAdapterConfig } from '../shared/provider-adapters';
import { checkAndRecordRequest } from '../shared/rate-limiter';
import {
  uploadImage,
  generateMetadata as createImageMetadata,
  serializeMetadata,
} from '../shared/r2-manager';
import { applyPayloadMapping } from '../shared/utils/payload-mapper';
import type {
  Env,
  GenerateRequest,
  GenerateResponse,
  ErrorResponse,
  InstanceConfig,
} from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Generate request ID for tracking
    const requestId = crypto.randomUUID();

    try {
      const url = new URL(request.url);

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      // Route handling
      if (url.pathname === '/generate' && request.method === 'POST') {
        const response = await handleGenerate(request, env, requestId);
        return addCorsHeaders(response);
      }

      if (url.pathname === '/health' && request.method === 'GET') {
        return addCorsHeaders(Response.json({
          status: 'healthy',
          service: 'image-gen',
          r2_configured: !!env.R2_BUCKET,
        }));
      }

      // Test R2 upload
      if (url.pathname === '/test-r2' && request.method === 'GET') {
        try {
          if (!env.R2_BUCKET) {
            return Response.json({ error: 'R2_BUCKET not configured' }, { status: 500 });
          }
          const testData = new TextEncoder().encode('test');
          await env.R2_BUCKET.put('test/test.txt', testData);
          const retrieved = await env.R2_BUCKET.get('test/test.txt');
          return Response.json({
            success: true,
            uploaded: !!retrieved,
            url: `${request.url.split('/test-r2')[0]}/images/test/test.txt`
          });
        } catch (error) {
          return Response.json({
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      // Serve images from R2
      if (url.pathname.startsWith('/images/') && request.method === 'GET') {
        const response = await handleImageServe(url.pathname.replace('/images/', ''), env);
        return addCorsHeaders(response);
      }

      return addCorsHeaders(createErrorResponse(
        'Not Found',
        'ROUTE_NOT_FOUND',
        requestId,
        404
      ));
    } catch (error) {
      console.error('Unhandled error:', error);
      return addCorsHeaders(createErrorResponse(
        error instanceof Error ? error.message : 'Internal Server Error',
        'INTERNAL_ERROR',
        requestId,
        500
      ));
    }
  },
};

/**
 * Add CORS headers to response
 */
function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');
  return newResponse;
}

/**
 * Handle image generation request
 */
async function handleGenerate(
  request: Request,
  env: Env,
  requestId: string
): Promise<Response> {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: GenerateRequest = await request.json();

    // Validate request
    if (!body.prompt || body.prompt.trim() === '') {
      return createErrorResponse(
        'Prompt is required',
        'INVALID_REQUEST',
        requestId,
        400
      );
    }

    // Extract instance ID (from body, header, or default)
    const instanceId =
      body.instance_id ||
      request.headers.get('X-Instance-ID') ||
      env.DEFAULT_INSTANCE_ID ||
      'default';

    // Step 1: Get instance configuration
    // Note: In production, this would call Team 1's Config Service
    // For now, we'll create a mock config
    const instanceConfig = await getInstanceConfig(instanceId, env);

    if (!instanceConfig) {
      return createErrorResponse(
        `Instance not found: ${instanceId}`,
        'INSTANCE_NOT_FOUND',
        requestId,
        404
      );
    }

    // Step 2: Determine model_id and fetch configuration
    // Support both 'model' and 'model_id' parameters for backwards compatibility
    const modelId = body.model_id || body.model || getDefaultModelId(env);
    const modelConfig = await getModelConfig(modelId, env);

    // Fallback to legacy provider-based approach if model config not found
    let provider: string;
    let useModelConfig = false;
    let adapter: any;

    if (modelConfig) {
      provider = modelConfig.provider_id;
      useModelConfig = true;
      console.log(`Using model config for ${modelId} (provider: ${provider})`);

      // Create dynamic adapter with model config
      const adapterConfig: DynamicAdapterConfig = {
        provider_id: modelConfig.provider_id,
        model_id: modelConfig.model_id,
        payload_mapping: modelConfig.payload_mapping,
      };
      adapter = new DynamicAdapter(adapterConfig);
    } else {
      provider = env.DEFAULT_PROVIDER || 'ideogram';
      console.warn(`Model config not found for ${modelId}, falling back to legacy mode with provider: ${provider}`);
      adapter = providerRegistry.getAdapter(provider);
    }

    // Step 3: Check rate limits
    const rateLimitConfig = instanceConfig.rate_limits[provider];
    if (rateLimitConfig && env.RATE_LIMITER) {
      const rateLimitResult = await checkAndRecordRequest(
        { RATE_LIMITER: env.RATE_LIMITER },
        instanceId,
        provider,
        rateLimitConfig
      );

      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Rate limit exceeded',
          'RATE_LIMIT_EXCEEDED',
          requestId,
          429,
          {
            retry_after: rateLimitResult.retry_after,
            reset: rateLimitResult.reset,
          }
        );
      }
    }

    // Step 4: Get API key for provider
    const apiKey = instanceConfig.api_keys[provider];
    if (!apiKey) {
      return createErrorResponse(
        `API key not configured for provider: ${provider}`,
        'MISSING_API_KEY',
        requestId,
        500
      );
    }

    // Step 5: Format request for provider
    let providerRequest: any;

    if (useModelConfig && modelConfig) {
      // Use model config payload mapping
      console.log('Applying payload mapping from model config');
      const mappedRequest = applyPayloadMapping(
        modelConfig.payload_mapping,
        {
          user_prompt: body.prompt,
          aspect_ratio: body.options?.aspect_ratio,
          style: body.options?.style,
          quality: body.options?.quality,
          num_images: body.options?.num_images || 1,
          ...body.options, // Include any additional options
        },
        apiKey
      );

      // Wrap in ProviderRequest format for DynamicAdapter
      providerRequest = {
        provider: provider,
        payload: mappedRequest,
      };
    } else {
      // Legacy: use adapter formatRequest
      console.log('Using legacy adapter formatRequest');
      providerRequest = adapter.formatRequest(body.prompt, body.options || {});
    }

    // Step 6: Submit job to provider
    const jobId = await adapter.submitJob(providerRequest, apiKey);

    // Step 8: Poll until complete (with timeout)
    const imageResult = await adapter.pollUntilComplete(
      jobId,
      apiKey,
      60000, // 60 second timeout
      2000 // Poll every 2 seconds
    );

    // Step 8: Download image from provider
    const imageResponse = await fetch(imageResult.image_url);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image from provider');
    }
    const imageData = await imageResponse.arrayBuffer();

    // Step 9: Upload to R2
    const filename = `${body.prompt.substring(0, 50).replace(/[^a-z0-9]/gi, '_')}.png`;
    const metadata = createImageMetadata(
      instanceId,
      provider,
      imageResult.model,
      body.prompt,
      body.project_id
    );

    const uploadResult = await uploadImage(
      imageData,
      {
        instanceId,
        projectId: body.project_id,
        filename,
        metadata: serializeMetadata(metadata),
      },
      {
        R2_BUCKET: env.R2_BUCKET,
        CDN_URL: request.url.match(/^https?:\/\/[^\/]+/)?.[0] || '', // Use worker URL as CDN
      }
    );

    // Step 10: Return success response with R2 URL
    const generationTime = Date.now() - startTime;

    const response: GenerateResponse = {
      success: true,
      image_url: uploadResult.cdn_url,
      r2_path: uploadResult.r2_path,
      metadata: {
        provider: imageResult.provider,
        model: imageResult.model,
        dimensions: imageResult.metadata.dimensions,
        format: imageResult.metadata.format,
        generation_time_ms: generationTime,
      },
      request_id: requestId,
      timestamp: new Date().toISOString(),
    };

    return Response.json(response, {
      headers: {
        'X-Request-ID': requestId,
      },
    });
  } catch (error) {
    console.error('Generation error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return createErrorResponse(
          'Image generation timed out',
          'GATEWAY_TIMEOUT',
          requestId,
          504
        );
      }

      if (error.message.includes('Rate limit')) {
        return createErrorResponse(
          'Provider rate limit exceeded',
          'PROVIDER_RATE_LIMIT',
          requestId,
          502
        );
      }
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'Generation failed',
      'GENERATION_ERROR',
      requestId,
      500
    );
  }
}

/**
 * Fetch model configuration from config service
 */
async function getModelConfig(modelId: string, env: Env): Promise<any> {
  const configServiceUrl = env.CONFIG_SERVICE_URL || 'https://api.example.com';

  try {
    console.log(`Fetching model config for ${modelId} from ${configServiceUrl}`);

    const response = await fetch(`${configServiceUrl}/model-config/${modelId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Model config not found for ${modelId} - will use legacy mode`);
      } else {
        console.error(`Failed to fetch model config for ${modelId}:`, response.status, response.statusText);
      }
      return null;
    }

    const result = await response.json();
    console.log(`Successfully fetched model config for ${modelId}`);

    // The config service returns data in a wrapper object
    return result.data || result;
  } catch (error) {
    console.error(`Error fetching model config for ${modelId}:`, error);
    return null;
  }
}

/**
 * Get default model ID for the instance
 */
function getDefaultModelId(env: Env): string {
  return env.DEFAULT_MODEL_ID || 'ideogram-v2';
}

/**
 * Get instance configuration
 * Note: This is a mock implementation. In production, this would call
 * Team 1's Config Service to get the real configuration from D1.
 */
async function getInstanceConfig(
  instanceId: string,
  env: Env
): Promise<InstanceConfig | null> {
  // Mock configuration for MVP
  // In production, this would query Team 1's Config Service
  return {
    instance_id: instanceId,
    org_id: 'your-org-id',
    api_keys: {
      // These would come from D1 database in production
      ideogram: env.IDEOGRAM_API_KEY || 'ide_mock_key',
      gemini: env.GEMINI_API_KEY || '',
      openai: env.OPENAI_API_KEY || '',
    },
    rate_limits: {
      ideogram: {
        rpm: 100,
        tpm: 50000,
      },
    },
    r2_bucket: 'production-images',
  };
}

/**
 * Serve image from R2
 */
async function handleImageServe(path: string, env: Env): Promise<Response> {
  if (!env.R2_BUCKET) {
    return new Response('R2 bucket not configured', { status: 500 });
  }

  const object = await env.R2_BUCKET.get(path);

  if (!object) {
    return new Response('Image not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  return new Response(object.body, {
    headers,
  });
}

/**
 * Create error response
 */
function createErrorResponse(
  message: string,
  code: string,
  requestId: string,
  status: number,
  details?: Record<string, any>
): Response {
  const errorResponse: ErrorResponse = {
    error: message,
    error_code: code,
    request_id: requestId,
    details,
  };

  return Response.json(errorResponse, {
    status,
    headers: {
      'X-Request-ID': requestId,
    },
  });
}
