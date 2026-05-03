/**
 * Dynamic Provider Adapter
 * Generic adapter that uses payload mapping from model config to work with any provider
 */

import { ProviderAdapter } from './base-adapter';
import {
  applyPayloadMapping,
  applyResponseMapping,
  PayloadMapping,
} from '../utils/payload-mapper';
import type {
  ImageGenerationOptions,
  ProviderRequest,
  JobStatus,
  ImageResult,
  ProviderError,
} from './types';

export interface DynamicAdapterConfig {
  provider_id: string;
  model_id: string;
  payload_mapping: PayloadMapping;
}

/**
 * Dynamic adapter that uses model config payload mapping
 * to work with any image generation provider
 */
export class DynamicAdapter extends ProviderAdapter {
  private config: DynamicAdapterConfig;

  constructor(config: DynamicAdapterConfig) {
    super(config.provider_id);
    this.config = config;
  }

  /**
   * Format request using legacy adapter interface (not used in dynamic mode)
   * This is kept for compatibility but the worker will call applyPayloadMapping directly
   */
  formatRequest(
    prompt: string,
    options: ImageGenerationOptions
  ): ProviderRequest {
    // Not used when using model config, but required by base class
    return {
      provider: this.providerName,
      payload: { prompt, ...options },
    };
  }

  /**
   * Submit job to provider using mapped payload
   */
  async submitJob(request: ProviderRequest, apiKey: string): Promise<string> {
    const { endpoint, method, headers, body } = request.payload;

    const response = await fetch(endpoint, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw await this.handleError(response, this.providerName);
    }

    const data = await response.json();

    // Extract job_id from response using response mapping
    const responseMapping = this.config.payload_mapping.response_mapping;

    if (responseMapping.job_id) {
      const extracted = applyResponseMapping(data, { job_id: responseMapping.job_id });
      if (extracted.job_id) {
        return String(extracted.job_id);
      }
    }

    // If response includes job_id at top level
    if (data.job_id || data.id || data.request_id) {
      return data.job_id || data.id || data.request_id;
    }

    // For synchronous APIs (like Ideogram), store the entire response as "job_id"
    return JSON.stringify(data);
  }

  /**
   * Check status of submitted job
   * For synchronous APIs, always returns completed
   */
  async checkStatus(jobId: string, apiKey: string): Promise<JobStatus> {
    // Try to parse as JSON - if it works, this is a synchronous API response
    try {
      JSON.parse(jobId);
      return {
        status: 'completed',
        progress: 100,
      };
    } catch {
      // This is an actual job ID - would need to implement polling logic
      // For MVP, we'll assume synchronous APIs
      return {
        status: 'completed',
        progress: 100,
      };
    }
  }

  /**
   * Fetch result from completed job
   */
  async fetchResult(jobId: string, apiKey: string): Promise<ImageResult> {
    // Try to parse jobId as the full response (for synchronous APIs)
    try {
      const data = JSON.parse(jobId);
      const responseMapping = this.config.payload_mapping.response_mapping;

      // Extract fields using response mapping
      const extracted = applyResponseMapping(data, responseMapping);

      return {
        image_url: extracted.image_url || extracted.url,
        provider: this.providerName,
        model: this.config.model_id,
        metadata: {
          dimensions: extracted.dimensions || extracted.resolution || '1024x1024',
          format: extracted.format || 'png',
          generation_time_ms: 0,
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse job result: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Poll for job completion with timeout
   */
  async pollUntilComplete(
    jobId: string,
    apiKey: string,
    timeoutMs: number = 60000,
    pollIntervalMs: number = 2000
  ): Promise<ImageResult> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.checkStatus(jobId, apiKey);

      if (status.status === 'completed') {
        return await this.fetchResult(jobId, apiKey);
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Job failed');
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Job timeout: Generation took too long');
  }

  /**
   * Handle API errors
   */
  private async handleError(
    response: Response,
    providerName: string
  ): Promise<ProviderError> {
    let errorMessage = `${providerName} API error: ${response.status}`;
    let errorCode = 'PROVIDER_ERROR';
    let retryAfter: number | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
      errorCode = errorData.error_code || errorCode;
    } catch {
      // Response not JSON, use status text
      errorMessage = `${errorMessage} ${response.statusText}`;
    }

    if (response.status === 429) {
      errorCode = 'RATE_LIMIT_EXCEEDED';
      const retryAfterHeader = response.headers.get('Retry-After');
      retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
    }

    const error = new Error(errorMessage) as ProviderError;
    error.code = errorCode;
    error.statusCode = response.status;
    error.retryAfter = retryAfter;

    return error;
  }
}
