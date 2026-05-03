-- Seed Data for Model Configurations
-- This script populates the model_configs table with example configurations
-- for various AI models across different providers

-- Ideogram V2 - Image Generation
INSERT INTO model_configs (
  config_id,
  model_id,
  provider_id,
  display_name,
  description,
  capabilities,
  pricing,
  rate_limits,
  payload_mapping,
  status,
  created_at,
  updated_at
) VALUES (
  'cfg_ideogram_v2',
  'ideogram-v2',
  'ideogram',
  'Ideogram V2',
  'High-quality image generation with excellent text rendering capabilities',
  '{"image": true, "video": false, "text": false, "inpainting": false}',
  '{"cost_per_image": 0.08, "currency": "USD", "billing_unit": "image"}',
  '{"rpm": 100, "tpm": 50000, "concurrent_requests": 10}',
  '{"endpoint": "https://api.ideogram.ai/generate", "method": "POST", "headers": {"Api-Key": "{api_key}", "Content-Type": "application/json"}, "body": {"image_request": {"model": "V_2", "prompt": "{user_prompt}", "aspect_ratio": "{aspect_ratio}", "magic_prompt_option": "AUTO"}}, "response_mapping": {"image_url": "$.data[0].url", "resolution": "$.data[0].resolution"}, "defaults": {"aspect_ratio": "1:1"}}',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Gemini Veo 3.1 - Video Generation
INSERT INTO model_configs (
  config_id,
  model_id,
  provider_id,
  display_name,
  description,
  capabilities,
  pricing,
  rate_limits,
  payload_mapping,
  status,
  created_at,
  updated_at
) VALUES (
  'cfg_gemini_veo_31',
  'gemini-veo-3.1',
  'gemini',
  'Gemini Veo 3.1',
  'Advanced video generation model with support for various aspect ratios and video lengths',
  '{"image": false, "video": true, "text": false, "image_to_video": true}',
  '{"cost_per_video": 0.50, "currency": "USD", "billing_unit": "video", "notes": "Pricing varies by video length"}',
  '{"rpm": 60, "tpm": 30000, "concurrent_requests": 5}',
  '{"endpoint": "/v1/models/gemini-veo-3.1:generateContent", "method": "POST", "headers": {"Authorization": "Bearer {api_key}", "Content-Type": "application/json"}, "body": {"contents": [{"role": "user", "parts": [{"text": "{user_prompt}"}]}], "generationConfig": {"aspectRatio": "{aspect_ratio}", "responseModality": "video", "videoLength": "{video_length}", "personGeneration": "allow"}}, "response_mapping": {"job_id": "$.name", "status": "$.status", "video_url": "$.candidates[0].content.parts[0].videoUrl"}, "defaults": {"aspect_ratio": "16:9", "video_length": "8s"}}',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Gemini 2.5 Flash (Nano Banana) - Fast Image Generation
INSERT INTO model_configs (
  config_id,
  model_id,
  provider_id,
  display_name,
  description,
  capabilities,
  pricing,
  rate_limits,
  payload_mapping,
  status,
  created_at,
  updated_at
) VALUES (
  'cfg_gemini_25_flash',
  'gemini-2.5-flash-nano-banana',
  'gemini',
  'Gemini 2.5 Flash Image (Nano Banana)',
  'Fast, cost-effective image generation with Google Gemini',
  '{"image": true, "video": false, "text": false}',
  '{"cost_per_image": 0.02, "currency": "USD", "billing_unit": "image"}',
  '{"rpm": 120, "tpm": 60000}',
  '{"endpoint": "/v1/models/gemini-2.5-flash:generateContent", "method": "POST", "headers": {"Authorization": "Bearer {api_key}", "Content-Type": "application/json"}, "body": {"contents": [{"parts": [{"text": "{user_prompt}"}]}], "generationConfig": {"responseModality": "image", "aspectRatio": "{aspect_ratio}", "quality": "standard"}}, "response_mapping": {"image_url": "$.candidates[0].content.parts[0].inlineData.data", "mime_type": "$.candidates[0].content.parts[0].inlineData.mimeType"}, "defaults": {"aspect_ratio": "1:1"}}',
  'beta',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- OpenAI DALL-E 3 - Image Generation
INSERT INTO model_configs (
  config_id,
  model_id,
  provider_id,
  display_name,
  description,
  capabilities,
  pricing,
  rate_limits,
  payload_mapping,
  status,
  created_at,
  updated_at
) VALUES (
  'cfg_dalle3',
  'dall-e-3',
  'openai',
  'DALL-E 3',
  'OpenAI premier text-to-image generation model with enhanced prompt adherence',
  '{"image": true, "video": false, "text": false}',
  '{"cost_per_image": 0.04, "currency": "USD", "billing_unit": "image"}',
  '{"rpm": 50, "tpm": 25000}',
  '{"endpoint": "/v1/images/generations", "method": "POST", "headers": {"Authorization": "Bearer {api_key}", "Content-Type": "application/json"}, "body": {"model": "dall-e-3", "prompt": "{user_prompt}", "size": "{size}", "quality": "{quality}", "n": 1, "response_format": "url"}, "response_mapping": {"image_url": "$.data[0].url", "revised_prompt": "$.data[0].revised_prompt"}, "defaults": {"size": "1024x1024", "quality": "standard"}}',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- OpenAI DALL-E 2 - Legacy Image Generation
INSERT INTO model_configs (
  config_id,
  model_id,
  provider_id,
  display_name,
  description,
  capabilities,
  pricing,
  rate_limits,
  payload_mapping,
  status,
  created_at,
  updated_at
) VALUES (
  'cfg_dalle2',
  'dall-e-2',
  'openai',
  'DALL-E 2',
  'Previous generation OpenAI image model (deprecated, use DALL-E 3)',
  '{"image": true, "video": false, "text": false}',
  '{"cost_per_image": 0.02, "currency": "USD", "billing_unit": "image"}',
  '{"rpm": 50, "tpm": 25000}',
  '{"endpoint": "/v1/images/generations", "method": "POST", "headers": {"Authorization": "Bearer {api_key}", "Content-Type": "application/json"}, "body": {"model": "dall-e-2", "prompt": "{user_prompt}", "size": "{size}", "n": 1}, "response_mapping": {"image_url": "$.data[0].url"}, "defaults": {"size": "512x512"}}',
  'deprecated',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Anthropic Claude 3.5 Sonnet - Text Generation (for comparison)
INSERT INTO model_configs (
  config_id,
  model_id,
  provider_id,
  display_name,
  description,
  capabilities,
  pricing,
  rate_limits,
  payload_mapping,
  status,
  created_at,
  updated_at
) VALUES (
  'cfg_claude_35_sonnet',
  'claude-3-5-sonnet',
  'anthropic',
  'Claude 3.5 Sonnet',
  'Anthropic most capable model for complex tasks',
  '{"image": false, "video": false, "text": true}',
  '{"cost_per_1k_tokens": 0.003, "currency": "USD", "billing_unit": "token"}',
  '{"rpm": 50, "tpm": 40000}',
  '{"endpoint": "/v1/messages", "method": "POST", "headers": {"x-api-key": "{api_key}", "anthropic-version": "2023-06-01", "Content-Type": "application/json"}, "body": {"model": "claude-3-5-sonnet-20250219", "max_tokens": 1024, "messages": [{"role": "user", "content": "{user_prompt}"}], "temperature": 1.0}, "response_mapping": {"text": "$.content[0].text", "usage_tokens": "$.usage.output_tokens", "stop_reason": "$.stop_reason"}, "defaults": {"temperature": "1.0"}}',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_model_configs_provider_status ON model_configs(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_model_configs_capabilities ON model_configs(capabilities);

-- Verification query - count configs by provider
SELECT provider_id, status, COUNT(*) as count
FROM model_configs
GROUP BY provider_id, status
ORDER BY provider_id, status;
