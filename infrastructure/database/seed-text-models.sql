-- Additional Seed Data for Text Generation Model Configurations
-- This script adds popular text generation models to complement the existing seed data

-- OpenAI GPT-4o - Latest OpenAI Text Generation
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
  'cfg_gpt4o',
  'gpt-4o',
  'openai',
  'GPT-4o',
  'OpenAI latest flagship model with multimodal capabilities',
  '{"image": false, "video": false, "text": true}',
  '{"cost_per_1k_tokens": 0.005, "currency": "USD", "billing_unit": "token"}',
  '{"rpm": 500, "tpm": 30000}',
  '{"endpoint": "/v1/chat/completions", "method": "POST", "headers": {"Authorization": "Bearer {api_key}", "Content-Type": "application/json"}, "body": {"model": "gpt-4o", "messages": [{"role": "user", "content": "{user_prompt}"}], "max_tokens": 1000, "temperature": 0.7, "top_p": 1.0}, "response_mapping": {"text": "$.choices[0].message.content", "tokens_used": "$.usage.total_tokens", "model": "$.model"}, "defaults": {"max_tokens": "1000", "temperature": "0.7", "top_p": "1.0"}}',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- OpenAI GPT-4o-mini - Cost-effective text generation
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
  'cfg_gpt4o_mini',
  'gpt-4o-mini',
  'openai',
  'GPT-4o Mini',
  'OpenAI cost-effective model for simpler tasks',
  '{"image": false, "video": false, "text": true}',
  '{"cost_per_1k_tokens": 0.00015, "currency": "USD", "billing_unit": "token"}',
  '{"rpm": 500, "tpm": 200000}',
  '{"endpoint": "/v1/chat/completions", "method": "POST", "headers": {"Authorization": "Bearer {api_key}", "Content-Type": "application/json"}, "body": {"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "{user_prompt}"}], "max_tokens": 1000, "temperature": 0.7, "top_p": 1.0}, "response_mapping": {"text": "$.choices[0].message.content", "tokens_used": "$.usage.total_tokens", "model": "$.model"}, "defaults": {"max_tokens": "1000", "temperature": "0.7", "top_p": "1.0"}}',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Anthropic Claude 3 Haiku - Fast text generation
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
  'cfg_claude_3_haiku',
  'claude-3-haiku',
  'anthropic',
  'Claude 3 Haiku',
  'Anthropic fastest model for instant responses',
  '{"image": false, "video": false, "text": true}',
  '{"cost_per_1k_tokens": 0.00025, "currency": "USD", "billing_unit": "token"}',
  '{"rpm": 50, "tpm": 100000}',
  '{"endpoint": "/v1/messages", "method": "POST", "headers": {"x-api-key": "{api_key}", "anthropic-version": "2023-06-01", "Content-Type": "application/json"}, "body": {"model": "claude-3-haiku-20240307", "max_tokens": 1024, "messages": [{"role": "user", "content": "{user_prompt}"}], "temperature": 1.0}, "response_mapping": {"text": "$.content[0].text", "tokens_used": "$.usage.output_tokens", "stop_reason": "$.stop_reason"}, "defaults": {"temperature": "1.0"}}',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Verification query - show all text generation models
SELECT
  model_id,
  provider_id,
  display_name,
  status
FROM model_configs
WHERE JSON_EXTRACT(capabilities, '$.text') = 1
ORDER BY provider_id, display_name;
