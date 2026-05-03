/**
 * Config Service Worker
 * Central service for managing instances, users, and configuration
 */

import { Env } from './types';
import { errorResponse } from './utils';

// Instance handlers
import {
  getInstance,
  listInstances,
  createInstance,
  updateInstance,
  deleteInstance,
} from './handlers/instance-handlers';

// User handlers
import {
  getUser,
  listUsers,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
} from './handlers/user-handlers';

// Project handlers
import {
  getProject,
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from './handlers/project-handlers';

// Model Config handlers
import {
  getModelConfig,
  listModelConfigs,
  createModelConfig,
  updateModelConfig,
  deleteModelConfig,
} from './handlers/model-config-handlers';

// Provider Key handlers
import {
  storeProviderKey,
  getProviderKeyStatus,
  deleteProviderKey,
  listProviderKeys,
} from './handlers/provider-key-handlers';

// Dev Credentials handlers
import {
  storeDevCredential,
  getDevCredential,
  deleteDevCredential,
  listDevCredentials,
} from './handlers/dev-credentials-handlers';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Enable CORS for all requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route matching
      const pathParts = pathname.split('/').filter(Boolean);

      // Health check
      if (pathname === '/health' || pathname === '/') {
        return new Response(
          JSON.stringify({ status: 'healthy', service: 'config-service' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Instance routes
      if (pathParts[0] === 'instance') {
        if (pathParts.length === 1) {
          // GET /instance or POST /instance
          if (method === 'GET') {
            const orgId = url.searchParams.get('org_id');
            const response = await listInstances(orgId, env);
            return addCorsHeaders(response, corsHeaders);
          } else if (method === 'POST') {
            const response = await createInstance(request, env);
            return addCorsHeaders(response, corsHeaders);
          }
        } else if (pathParts.length === 2) {
          const instanceId = pathParts[1];
          // GET /instance/{id}, PUT /instance/{id}, DELETE /instance/{id}
          if (method === 'GET') {
            const response = await getInstance(instanceId, env);
            return addCorsHeaders(response, corsHeaders);
          } else if (method === 'PUT') {
            const response = await updateInstance(instanceId, request, env);
            return addCorsHeaders(response, corsHeaders);
          } else if (method === 'DELETE') {
            const response = await deleteInstance(instanceId, env);
            return addCorsHeaders(response, corsHeaders);
          }
        }
      }

      // User routes
      if (pathParts[0] === 'user') {
        if (pathParts.length === 1) {
          // GET /user or POST /user
          if (method === 'GET') {
            const orgId = url.searchParams.get('org_id');
            const response = await listUsers(orgId, env);
            return addCorsHeaders(response, corsHeaders);
          } else if (method === 'POST') {
            const response = await createUser(request, env);
            return addCorsHeaders(response, corsHeaders);
          }
        } else if (pathParts.length === 2) {
          const userId = pathParts[1];
          // GET /user/{id}, PUT /user/{id}, DELETE /user/{id}
          if (method === 'GET') {
            const response = await getUser(userId, env);
            return addCorsHeaders(response, corsHeaders);
          } else if (method === 'PUT') {
            const response = await updateUser(userId, request, env);
            return addCorsHeaders(response, corsHeaders);
          } else if (method === 'DELETE') {
            const response = await deleteUser(userId, env);
            return addCorsHeaders(response, corsHeaders);
          }
        } else if (pathParts.length === 3 && pathParts[1] === 'email') {
          // GET /user/email/{email}
          const email = decodeURIComponent(pathParts[2]);
          if (method === 'GET') {
            const response = await getUserByEmail(email, env);
            return addCorsHeaders(response, corsHeaders);
          }
        }
      }

      // Project routes
      if (pathParts[0] === 'project') {
        if (pathParts.length === 1) {
          // GET /project or POST /project
          if (method === 'GET') {
            const instanceId = url.searchParams.get('instance_id');
            const response = await listProjects(instanceId, env);
            return addCorsHeaders(response, corsHeaders);
          } else if (method === 'POST') {
            const response = await createProject(request, env);
            return addCorsHeaders(response, corsHeaders);
          }
        } else if (pathParts.length === 2) {
          const projectId = pathParts[1];
          // GET /project/{id}, PUT /project/{id}, DELETE /project/{id}
          if (method === 'GET') {
            const response = await getProject(projectId, env);
            return addCorsHeaders(response, corsHeaders);
          } else if (method === 'PUT') {
            const response = await updateProject(projectId, request, env);
            return addCorsHeaders(response, corsHeaders);
          } else if (method === 'DELETE') {
            const response = await deleteProject(projectId, env);
            return addCorsHeaders(response, corsHeaders);
          }
        }
      }

      // Model Config routes
      if (pathParts[0] === 'model-config') {
        if (pathParts.length === 1) {
          // GET /model-config or POST /model-config
          if (method === 'GET') {
            const providerId = url.searchParams.get('provider_id');
            const status = url.searchParams.get('status');
            const response = await listModelConfigs(providerId, status, env);
            return addCorsHeaders(response, corsHeaders);
          } else if (method === 'POST') {
            const response = await createModelConfig(request, env);
            return addCorsHeaders(response, corsHeaders);
          }
        } else if (pathParts.length === 2) {
          const id = pathParts[1];
          // GET /model-config/{id}, PUT /model-config/{id}, DELETE /model-config/{id}
          if (method === 'GET') {
            const response = await getModelConfig(id, env);
            return addCorsHeaders(response, corsHeaders);
          } else if (method === 'PUT') {
            const response = await updateModelConfig(id, request, env);
            return addCorsHeaders(response, corsHeaders);
          } else if (method === 'DELETE') {
            const response = await deleteModelConfig(id, env);
            return addCorsHeaders(response, corsHeaders);
          }
        }
      }

      // Provider Key routes
      if (pathParts[0] === 'provider-key') {
        if (pathParts.length === 1) {
          // POST /provider-key
          if (method === 'POST') {
            const response = await storeProviderKey(request, env);
            return addCorsHeaders(response, corsHeaders);
          }
        } else if (pathParts.length === 2) {
          const instanceId = pathParts[1];
          // GET /provider-key/{instance_id} - list all providers
          if (method === 'GET') {
            const response = await listProviderKeys(instanceId, env);
            return addCorsHeaders(response, corsHeaders);
          }
        } else if (pathParts.length === 3) {
          const instanceId = pathParts[1];
          const provider = pathParts[2];
          // GET /provider-key/{instance_id}/{provider} - check status
          if (method === 'GET') {
            const response = await getProviderKeyStatus(instanceId, provider, env);
            return addCorsHeaders(response, corsHeaders);
          }
          // DELETE /provider-key/{instance_id}/{provider}
          if (method === 'DELETE') {
            const response = await deleteProviderKey(instanceId, provider, env);
            return addCorsHeaders(response, corsHeaders);
          }
        }
      }

      // Dev Credentials routes
      if (pathParts[0] === 'dev-credentials') {
        if (pathParts.length === 1) {
          // GET /dev-credentials - list all credentials
          if (method === 'GET') {
            const response = await listDevCredentials(request, env);
            return addCorsHeaders(response, corsHeaders);
          }
          // POST /dev-credentials - store credential
          if (method === 'POST') {
            const response = await storeDevCredential(request, env);
            return addCorsHeaders(response, corsHeaders);
          }
        } else if (pathParts.length === 2) {
          const credentialType = pathParts[1];
          // GET /dev-credentials/{type} - get credential value
          if (method === 'GET') {
            const response = await getDevCredential(credentialType, request, env);
            return addCorsHeaders(response, corsHeaders);
          }
          // DELETE /dev-credentials/{type} - delete credential
          if (method === 'DELETE') {
            const response = await deleteDevCredential(credentialType, request, env);
            return addCorsHeaders(response, corsHeaders);
          }
        }
      }

      // Route not found
      const response = errorResponse('Route not found', 404);
      return addCorsHeaders(response, corsHeaders);
    } catch (error) {
      console.error('Unhandled error:', error);
      const response = errorResponse(
        'Internal server error',
        500
      );
      return addCorsHeaders(response, corsHeaders);
    }
  },
};

/**
 * Add CORS headers to a response
 */
function addCorsHeaders(response: Response, corsHeaders: Record<string, string>): Response {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
