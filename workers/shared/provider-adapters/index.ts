/**
 * Provider Adapters Module
 * Extensible framework for AI provider integrations
 */

export { ProviderAdapter } from './base-adapter';
export { IdeogramAdapter } from './ideogram-adapter';
export { DynamicAdapter } from './dynamic-adapter';
export type { DynamicAdapterConfig } from './dynamic-adapter';
export { providerRegistry, ProviderRegistry } from './registry';
export type {
  ImageGenerationOptions,
  ProviderRequest,
  JobStatus,
  ImageResult,
  ProviderError,
} from './types';
