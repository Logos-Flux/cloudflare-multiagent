#!/bin/bash

# Text Generation Worker - Model Config Integration Test Script
# This script tests the text-gen worker with dynamic model configuration

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
WORKER_URL="${WORKER_URL:-https://text.example.com}"
CONFIG_SERVICE_URL="${CONFIG_SERVICE_URL:-https://api.example.com}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Text-Gen Worker Integration Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
echo "GET $WORKER_URL/health"
curl -s "$WORKER_URL/health" | jq '.'
echo ""

# Test 2: List Available Model Configs
echo -e "${YELLOW}Test 2: List Available Text Models${NC}"
echo "GET $CONFIG_SERVICE_URL/model-config"
curl -s "$CONFIG_SERVICE_URL/model-config" | jq '.data.configs[] | select(.capabilities.text == true) | {model_id, provider_id, display_name, status}'
echo ""

# Test 3: Get Specific Model Config
echo -e "${YELLOW}Test 3: Get Claude 3.5 Sonnet Config${NC}"
echo "GET $CONFIG_SERVICE_URL/model-config/claude-3-5-sonnet"
curl -s "$CONFIG_SERVICE_URL/model-config/claude-3-5-sonnet" | jq '.data'
echo ""

# Test 4: Generate with Claude 3.5 Sonnet (using model_id)
echo -e "${YELLOW}Test 4: Generate with Claude 3.5 Sonnet (dynamic config)${NC}"
curl -s -X POST "$WORKER_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in one sentence",
    "model_id": "claude-3-5-sonnet"
  }' | jq '.'
echo ""

# Test 5: Generate with GPT-4o (using model_id)
echo -e "${YELLOW}Test 5: Generate with GPT-4o (dynamic config)${NC}"
curl -s -X POST "$WORKER_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in one sentence",
    "model_id": "gpt-4o",
    "options": {
      "max_tokens": 100,
      "temperature": 0.5
    }
  }' | jq '.'
echo ""

# Test 6: Generate with GPT-4o Mini (using model_id)
echo -e "${YELLOW}Test 6: Generate with GPT-4o Mini (dynamic config)${NC}"
curl -s -X POST "$WORKER_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a haiku about programming",
    "model_id": "gpt-4o-mini"
  }' | jq '.'
echo ""

# Test 7: Test Legacy API (backward compatibility)
echo -e "${YELLOW}Test 7: Legacy API with model parameter (backward compatibility)${NC}"
curl -s -X POST "$WORKER_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, world!",
    "model": "openai:gpt-4o-mini"
  }' | jq '.'
echo ""

# Test 8: Test Fallback (non-existent model_id)
echo -e "${YELLOW}Test 8: Fallback to legacy when model_id not found${NC}"
curl -s -X POST "$WORKER_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test fallback",
    "model_id": "non-existent-model",
    "model": "openai:gpt-4o-mini"
  }' | jq '.'
echo ""

# Test 9: Test with options
echo -e "${YELLOW}Test 9: Generate with custom options${NC}"
curl -s -X POST "$WORKER_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Tell me a joke",
    "model_id": "claude-3-haiku",
    "options": {
      "temperature": 0.9,
      "max_tokens": 200
    }
  }' | jq '.'
echo ""

# Test 10: Invalid request (no prompt)
echo -e "${YELLOW}Test 10: Invalid request (missing prompt)${NC}"
curl -s -X POST "$WORKER_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "gpt-4o"
  }' | jq '.'
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All Tests Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "- Test 1: Health check"
echo "- Test 2: List available text models from Config Service"
echo "- Test 3: Get specific model config"
echo "- Test 4-6: Dynamic model config generation (Claude, GPT-4o, GPT-4o Mini)"
echo "- Test 7: Legacy API backward compatibility"
echo "- Test 8: Fallback behavior when model not found"
echo "- Test 9: Custom options support"
echo "- Test 10: Error handling"
echo ""
echo -e "${BLUE}To test locally:${NC}"
echo "1. Set environment variables:"
echo "   export WORKER_URL=http://localhost:8787"
echo "   export CONFIG_SERVICE_URL=https://api.example.com"
echo ""
echo "2. Run tests:"
echo "   ./test-text-gen-integration.sh"
