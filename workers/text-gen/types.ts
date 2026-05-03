/**
 * Text Generation Worker Types
 */

export interface GenerateRequest {
  prompt: string;
  model?: string;
  model_id?: string; // Model ID to fetch config from Config Service
  instance_id?: string;
  project_id?: string;
  options?: {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    stream?: boolean;
    [key: string]: any;
  };
}

export interface GenerateResponse {
  success: boolean;
  text: string;
  metadata: {
    provider: string;
    model: string;
    tokens_used: number;
    generation_time_ms: number;
  };
  request_id: string;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  error_code: string;
  request_id: string;
  details?: Record<string, any>;
}

export interface Env {
  // Bindings
  RATE_LIMITER?: DurableObjectNamespace;

  // Environment variables
  DEFAULT_INSTANCE_ID?: string;
  DEFAULT_PROVIDER?: string;
  CONFIG_SERVICE_URL?: string; // Config Service URL

  // API Keys (from secrets)
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}

export interface InstanceConfig {
  instance_id: string;
  org_id: string;
  api_keys: Record<string, string>;
  rate_limits: Record<
    string,
    {
      rpm: number;
      tpm: number;
    }
  >;
  authorized_users?: string[];
}

export interface ProviderAdapter {
  name: string;
  generate: (prompt: string, options: any, apiKey: string) => Promise<TextResult>;
}

export interface TextResult {
  text: string;
  provider: string;
  model: string;
  tokens_used: number;
  metadata?: Record<string, any>;
}

// Model Config Types (from Config Service)
export interface Capabilities {
  image?: boolean;
  video?: boolean;
  text?: boolean;
  audio?: boolean;
  [key: string]: boolean | undefined;
}

export interface PayloadMapping {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  response_mapping: Record<string, string>;
  defaults?: Record<string, any>;
  transformations?: Record<string, string>;
}

export interface ModelConfig {
  config_id: string;
  model_id: string;
  provider_id: string;
  display_name: string;
  description?: string;
  capabilities: Capabilities;
  pricing?: any;
  rate_limits?: any;
  payload_mapping: PayloadMapping;
  prompt_template?: any;
  status: 'active' | 'beta' | 'deprecated';
  created_at: string;
  updated_at: string;
}
