/**
 * Dev Credentials Handlers
 * Manages encrypted storage and retrieval of development credentials
 * like Cloudflare API tokens for local development
 */

import { Env } from '../types';
import {
  errorResponse,
  successResponse,
  parseJsonBody,
  validateRequiredFields,
  generateRequestId,
} from '../utils';

// Supported credential types
const SUPPORTED_CREDENTIALS = ['cloudflare_api_token', 'cloudflare_account_id', 'github_token'];

/**
 * Encrypt a value using AES-GCM
 */
async function encrypt(plaintext: string, keyString: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoded
  );

  const ivBase64 = btoa(String.fromCharCode(...iv));
  const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

  return `${ivBase64}:${ciphertextBase64}`;
}

/**
 * Decrypt a value using AES-GCM
 */
async function decrypt(encrypted: string, keyString: string): Promise<string> {
  const [ivBase64, ciphertextBase64] = encrypted.split(':');

  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Validate API key from request
 */
async function validateApiKey(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  const apiKeyHeader = request.headers.get('X-API-Key');

  const apiKey = authHeader?.replace('Bearer ', '') || apiKeyHeader;

  if (!apiKey) return false;

  // Check if API key exists in database
  const result = await env.DB.prepare(
    'SELECT api_key FROM api_keys WHERE api_key = ? AND is_active = 1'
  ).bind(apiKey).first();

  return !!result;
}

interface StoreCredentialRequest {
  credential_type: string;
  value: string;
}

/**
 * Store a dev credential
 * POST /dev-credentials
 */
export async function storeDevCredential(
  request: Request,
  env: Env
): Promise<Response> {
  const requestId = generateRequestId();

  try {
    // Validate API key
    const isValid = await validateApiKey(request, env);
    if (!isValid) {
      return errorResponse('Unauthorized - valid API key required', 401, requestId);
    }

    if (!env.PROVIDER_KEYS) {
      return errorResponse('Credential storage not configured', 500, requestId);
    }

    const body = await parseJsonBody<StoreCredentialRequest>(request);

    const validation = validateRequiredFields(body, ['credential_type', 'value']);
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing?.join(', ')}`,
        400,
        requestId
      );
    }

    // Validate credential type
    if (!SUPPORTED_CREDENTIALS.includes(body.credential_type.toLowerCase())) {
      return errorResponse(
        `Unsupported credential type: ${body.credential_type}. Supported: ${SUPPORTED_CREDENTIALS.join(', ')}`,
        400,
        requestId
      );
    }

    // Build KV key
    const kvKey = `dev_credentials:${body.credential_type.toLowerCase()}`;

    // Encrypt if we have an encryption key
    let valueToStore = body.value;
    if (env.ENCRYPTION_KEY) {
      valueToStore = await encrypt(body.value, env.ENCRYPTION_KEY);
    } else {
      console.warn('ENCRYPTION_KEY not set, storing plaintext (not recommended)');
    }

    // Store in KV
    await env.PROVIDER_KEYS.put(kvKey, valueToStore, {
      metadata: {
        credential_type: body.credential_type.toLowerCase(),
        updated_at: new Date().toISOString(),
      },
    });

    return successResponse({
      credential_type: body.credential_type.toLowerCase(),
      stored: true,
      updated_at: new Date().toISOString(),
    }, requestId);
  } catch (error) {
    console.error('Error storing dev credential:', error);
    if ((error as Error).message === 'Invalid JSON body') {
      return errorResponse('Invalid JSON body', 400, requestId);
    }
    return errorResponse('Failed to store dev credential', 500, requestId);
  }
}

/**
 * Get a dev credential (decrypted)
 * GET /dev-credentials/{credential_type}
 */
export async function getDevCredential(
  credentialType: string,
  request: Request,
  env: Env
): Promise<Response> {
  const requestId = generateRequestId();

  try {
    // Validate API key
    const isValid = await validateApiKey(request, env);
    if (!isValid) {
      return errorResponse('Unauthorized - valid API key required', 401, requestId);
    }

    if (!env.PROVIDER_KEYS) {
      return errorResponse('Credential storage not configured', 500, requestId);
    }

    const kvKey = `dev_credentials:${credentialType.toLowerCase()}`;
    const result = await env.PROVIDER_KEYS.getWithMetadata(kvKey);

    if (!result.value) {
      return errorResponse(`Credential not found: ${credentialType}`, 404, requestId);
    }

    // Decrypt if we have an encryption key
    let value = result.value;
    if (env.ENCRYPTION_KEY && value.includes(':')) {
      try {
        value = await decrypt(value, env.ENCRYPTION_KEY);
      } catch (e) {
        console.error('Decryption failed, returning as-is');
      }
    }

    return successResponse({
      credential_type: credentialType.toLowerCase(),
      value: value,
      updated_at: (result.metadata as any)?.updated_at || '',
    }, requestId);
  } catch (error) {
    console.error('Error getting dev credential:', error);
    return errorResponse('Failed to get dev credential', 500, requestId);
  }
}

/**
 * Delete a dev credential
 * DELETE /dev-credentials/{credential_type}
 */
export async function deleteDevCredential(
  credentialType: string,
  request: Request,
  env: Env
): Promise<Response> {
  const requestId = generateRequestId();

  try {
    // Validate API key
    const isValid = await validateApiKey(request, env);
    if (!isValid) {
      return errorResponse('Unauthorized - valid API key required', 401, requestId);
    }

    if (!env.PROVIDER_KEYS) {
      return errorResponse('Credential storage not configured', 500, requestId);
    }

    const kvKey = `dev_credentials:${credentialType.toLowerCase()}`;
    await env.PROVIDER_KEYS.delete(kvKey);

    return successResponse({
      deleted: true,
      credential_type: credentialType.toLowerCase(),
    }, requestId);
  } catch (error) {
    console.error('Error deleting dev credential:', error);
    return errorResponse('Failed to delete dev credential', 500, requestId);
  }
}

/**
 * List all stored dev credentials (types only, not values)
 * GET /dev-credentials
 */
export async function listDevCredentials(
  request: Request,
  env: Env
): Promise<Response> {
  const requestId = generateRequestId();

  try {
    // Validate API key
    const isValid = await validateApiKey(request, env);
    if (!isValid) {
      return errorResponse('Unauthorized - valid API key required', 401, requestId);
    }

    if (!env.PROVIDER_KEYS) {
      return errorResponse('Credential storage not configured', 500, requestId);
    }

    // List all dev credentials
    const prefix = 'dev_credentials:';
    const list = await env.PROVIDER_KEYS.list({ prefix });

    const credentials = list.keys.map(key => ({
      credential_type: key.name.replace(prefix, ''),
      configured: true,
      updated_at: (key.metadata as any)?.updated_at || '',
    }));

    return successResponse({
      credentials,
      supported_types: SUPPORTED_CREDENTIALS,
    }, requestId);
  } catch (error) {
    console.error('Error listing dev credentials:', error);
    return errorResponse('Failed to list dev credentials', 500, requestId);
  }
}
