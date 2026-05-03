-- ============================================================================
-- SEED DATA for D1 Database
-- Description: Test data for development and testing
-- Date: 2025-11-20
-- ============================================================================

-- ============================================================================
-- SEED: organizations
-- Creates 1 test organization
-- ============================================================================
INSERT INTO organizations (org_id, name, billing_email, created_at) VALUES
('org_550e8400-e29b-41d4-a716-446655440000', 'Acme Corp.', 'billing@example.com', CURRENT_TIMESTAMP);

-- ============================================================================
-- SEED: instances
-- Creates 2 instances: production and development
-- ============================================================================
INSERT INTO instances (instance_id, org_id, name, config, created_at) VALUES
(
    'inst_550e8400-e29b-41d4-a716-446655440001',
    'org_550e8400-e29b-41d4-a716-446655440000',
    'production',
    json('{
        "instance_id": "inst_550e8400-e29b-41d4-a716-446655440001",
        "org_id": "org_550e8400-e29b-41d4-a716-446655440000",
        "api_keys": {
            "ideogram": "encrypted_key_placeholder_prod",
            "openai": "encrypted_key_placeholder_prod"
        },
        "rate_limits": {
            "ideogram": {
                "rpm": 100,
                "tpm": 50000
            },
            "openai": {
                "rpm": 500,
                "tpm": 150000
            }
        },
        "worker_urls": {
            "config_service": "https://config-prod.your-subdomain.workers.dev",
            "image_generation": "https://images-prod.your-subdomain.workers.dev"
        },
        "r2_bucket": "your-prod-assets",
        "authorized_users": []
    }'),
    CURRENT_TIMESTAMP
),
(
    'inst_550e8400-e29b-41d4-a716-446655440002',
    'org_550e8400-e29b-41d4-a716-446655440000',
    'development',
    json('{
        "instance_id": "inst_550e8400-e29b-41d4-a716-446655440002",
        "org_id": "org_550e8400-e29b-41d4-a716-446655440000",
        "api_keys": {
            "ideogram": "encrypted_key_placeholder_dev",
            "openai": "encrypted_key_placeholder_dev"
        },
        "rate_limits": {
            "ideogram": {
                "rpm": 50,
                "tpm": 25000
            },
            "openai": {
                "rpm": 200,
                "tpm": 75000
            }
        },
        "worker_urls": {
            "config_service": "https://config-dev.your-subdomain.workers.dev",
            "image_generation": "https://images-dev.your-subdomain.workers.dev"
        },
        "r2_bucket": "your-dev-assets",
        "authorized_users": []
    }'),
    CURRENT_TIMESTAMP
);

-- ============================================================================
-- SEED: users
-- Creates 2 users: admin and regular user
-- ============================================================================
INSERT INTO users (user_id, email, role, org_id, created_at) VALUES
('user_650e8400-e29b-41d4-a716-446655440001', 'admin@example.com', 'admin', 'org_550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP),
('user_650e8400-e29b-41d4-a716-446655440002', 'developer@example.com', 'user', 'org_550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP);

-- ============================================================================
-- SEED: user_instance_access
-- Grant both users access to both instances
-- ============================================================================
INSERT INTO user_instance_access (user_id, instance_id, granted_at) VALUES
('user_650e8400-e29b-41d4-a716-446655440001', 'inst_550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
('user_650e8400-e29b-41d4-a716-446655440001', 'inst_550e8400-e29b-41d4-a716-446655440002', CURRENT_TIMESTAMP),
('user_650e8400-e29b-41d4-a716-446655440002', 'inst_550e8400-e29b-41d4-a716-446655440002', CURRENT_TIMESTAMP);

-- ============================================================================
-- SEED: projects
-- Creates 2 projects: one in production, one in development
-- ============================================================================
INSERT INTO projects (project_id, instance_id, name, settings, created_at) VALUES
(
    'proj_750e8400-e29b-41d4-a716-446655440001',
    'inst_550e8400-e29b-41d4-a716-446655440001',
    'Demo Project',
    json('{
        "description": "AI-powered content generation system",
        "default_provider": "openai",
        "max_tokens": 2000,
        "temperature": 0.7
    }'),
    CURRENT_TIMESTAMP
),
(
    'proj_750e8400-e29b-41d4-a716-446655440002',
    'inst_550e8400-e29b-41d4-a716-446655440002',
    'Image Generator Dev',
    json('{
        "description": "Development environment for image generation testing",
        "default_provider": "ideogram",
        "test_mode": true
    }'),
    CURRENT_TIMESTAMP
);

-- ============================================================================
-- SEED: api_keys
-- Creates API keys for the admin user and one project
-- NOTE: In production, key_hash would be SHA-256 hash of actual API key
-- ============================================================================
INSERT INTO api_keys (key_id, user_id, project_id, key_hash, created_at, expires_at) VALUES
(
    'key_850e8400-e29b-41d4-a716-446655440001',
    'user_650e8400-e29b-41d4-a716-446655440001',
    NULL,
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', -- SHA-256 of 'test_admin_key'
    CURRENT_TIMESTAMP,
    NULL -- No expiration
),
(
    'key_850e8400-e29b-41d4-a716-446655440002',
    NULL,
    'proj_750e8400-e29b-41d4-a716-446655440001',
    '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', -- SHA-256 of 'test_project_key'
    CURRENT_TIMESTAMP,
    datetime('now', '+90 days') -- Expires in 90 days
);

-- ============================================================================
-- SEED: usage_logs
-- Creates sample usage logs for monitoring and billing tests
-- ============================================================================
INSERT INTO usage_logs (log_id, instance_id, timestamp, provider, tokens_used, cost, request_id) VALUES
(
    'log_950e8400-e29b-41d4-a716-446655440001',
    'inst_550e8400-e29b-41d4-a716-446655440001',
    datetime('now', '-2 hours'),
    'openai',
    1500,
    0.03,
    'req_a1b2c3d4e5f6'
),
(
    'log_950e8400-e29b-41d4-a716-446655440002',
    'inst_550e8400-e29b-41d4-a716-446655440001',
    datetime('now', '-1 hour'),
    'ideogram',
    2000,
    0.05,
    'req_b2c3d4e5f6g7'
),
(
    'log_950e8400-e29b-41d4-a716-446655440003',
    'inst_550e8400-e29b-41d4-a716-446655440002',
    datetime('now', '-30 minutes'),
    'openai',
    800,
    0.016,
    'req_c3d4e5f6g7h8'
);

-- ============================================================================
-- SEED DATA SUMMARY
-- ============================================================================
-- Organizations: 1 (Acme Corp.)
-- Instances: 2 (production, development)
-- Users: 2 (admin, developer)
-- User Access: Admin has access to both instances, developer only to dev
-- Projects: 2 (Demo Project in prod, Image Generator Dev in dev)
-- API Keys: 2 (one for admin user, one for Demo Project project)
-- Usage Logs: 3 sample log entries
-- ============================================================================
