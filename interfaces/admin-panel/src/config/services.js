/**
 * Services Configuration
 *
 * ADD YOUR NEW SERVICE HERE when creating a new worker or interface!
 *
 * This file defines all available services displayed in the Admin Panel Services page.
 * When you create a new worker or service, add it to the array below.
 *
 * Service Object Structure:
 * - id: Unique identifier (string, kebab-case)
 * - name: Display name (string)
 * - description: Brief description of what the service does (string)
 * - status: 'active' | 'development' | 'deprecated' (string)
 * - icon: Emoji or icon (string)
 * - endpoints: Array of API endpoints (optional)
 *   - method: HTTP method (string)
 *   - path: Endpoint path (string)
 *   - description: What the endpoint does (string)
 * - links: Array of related links (optional)
 *   - name: Link display name (string)
 *   - url: URL (string)
 *   - description: What the link is for (string)
 * - usage: Usage instructions (optional)
 *   - title: Section title (string)
 *   - steps: Array of instruction steps (array of strings)
 * - example: Code example (optional)
 *   - title: Example title (string)
 *   - code: Code snippet (string)
 */

export const services = [
  {
    id: 'image-gen',
    name: 'Image Generation Worker',
    description: 'AI-powered image generation using multiple providers (Ideogram, DALL-E, etc.)',
    status: 'active',
    icon: '🎨',
    endpoints: [
      {
        method: 'POST',
        path: '/generate',
        description: 'Generate an image from a text prompt'
      },
      {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint'
      }
    ],
    links: [
      {
        name: 'Testing GUI',
        url: 'https://testing.your-domain.com',
        description: 'Interactive web interface for testing image generation'
      },
      {
        name: 'API Documentation',
        url: '/docs/api/image-generation',
        description: 'Complete API reference and examples'
      }
    ],
    usage: {
      title: 'Quick Start',
      steps: [
        'Get your API key from the Users page',
        'Open the Testing GUI or use curl/Postman',
        'Select your instance ID (production, development, etc.)',
        'Enter a text prompt (e.g., "A serene mountain landscape at sunset")',
        'Click Generate and wait 3-15 seconds for the result',
        'Your image will be stored in R2 and served via CDN'
      ]
    },
    example: {
      title: 'Example Request',
      code: `curl -X POST https://images.your-domain.com/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A serene mountain landscape at sunset",
    "instance_id": "production",
    "options": {
      "aspect_ratio": "16:9",
      "style": "realistic"
    }
  }'`
    }
  },
  {
    id: 'config-service',
    name: 'Config Service',
    description: 'Central configuration management for instances, users, and API keys',
    status: 'active',
    icon: '⚙️',
    endpoints: [
      {
        method: 'GET',
        path: '/api/instances',
        description: 'List all instances'
      },
      {
        method: 'POST',
        path: '/api/instances',
        description: 'Create a new instance'
      },
      {
        method: 'GET',
        path: '/api/users',
        description: 'List all users'
      },
      {
        method: 'POST',
        path: '/api/keys',
        description: 'Generate API key'
      }
    ],
    links: [
      {
        name: 'Admin Panel',
        url: typeof window !== 'undefined' ? window.location.origin : '/',
        description: 'This admin interface (you are here!)'
      }
    ],
    usage: {
      title: 'Getting Started',
      steps: [
        'Navigate to the Instances page to manage worker instances',
        'Create instances for different environments (production, staging, dev)',
        'Go to Users page to create users and assign instance access',
        'Generate API keys for users to authenticate with workers',
        'View Logs page to monitor system activity'
      ]
    }
  },
  {
    id: 'monitoring',
    name: 'Monitoring Dashboard',
    description: 'Real-time monitoring, metrics, and analytics for all services',
    status: 'active',
    icon: '📊',
    endpoints: [
      {
        method: 'GET',
        path: '/api/metrics',
        description: 'Get system metrics'
      },
      {
        method: 'GET',
        path: '/api/health',
        description: 'System health status'
      }
    ],
    links: [
      {
        name: 'Monitoring Dashboard',
        url: 'https://monitoring.your-domain.com',
        description: 'View real-time metrics and system health'
      }
    ],
    usage: {
      title: 'Monitoring Features',
      steps: [
        'View real-time request rates and response times',
        'Monitor rate limit usage across instances',
        'Track API key usage and quotas',
        'View error rates and system health',
        'Analyze performance trends over time'
      ]
    }
  },
  {
    id: 'text-gen',
    name: 'Text Generation Worker',
    description: 'AI-powered text generation using multiple providers (OpenAI, Anthropic, etc.)',
    status: 'active',
    icon: '📝',
    endpoints: [
      {
        method: 'POST',
        path: '/generate',
        description: 'Generate text from a prompt'
      },
      {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint'
      }
    ],
    links: [
      {
        name: 'Text Testing GUI',
        url: 'https://text-testing.example.com',
        description: 'Interactive web interface for testing text generation'
      },
      {
        name: 'API Documentation',
        url: '/docs/api/text-generation',
        description: 'Complete API reference and examples'
      }
    ],
    usage: {
      title: 'Quick Start',
      steps: [
        'Get your API key from the Users page',
        'Open the Text Testing GUI or use curl/Postman',
        'Select your instance ID and model (GPT-4o, Claude, etc.)',
        'Enter a text prompt (e.g., "Write a short story about...")',
        'Click Generate and receive your text response',
        'Supports OpenAI and Anthropic models'
      ]
    },
    example: {
      title: 'Example Request',
      code: `curl -X POST https://text.example.com/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Write a haiku about clouds",
    "model": "gpt-4o-mini",
    "instance_id": "production",
    "options": {
      "max_tokens": 1000,
      "temperature": 0.7
    }
  }'`
    }
  },
  {
    id: 'rate-limiter',
    name: 'Rate Limiter',
    description: 'Durable Object-based rate limiting per instance and provider',
    status: 'active',
    icon: '🚦',
    endpoints: [
      {
        method: 'POST',
        path: '/check',
        description: 'Check if request is within limits'
      },
      {
        method: 'POST',
        path: '/record',
        description: 'Record request usage'
      }
    ],
    usage: {
      title: 'Rate Limit Configuration',
      steps: [
        'Rate limits are configured per instance in the Instances page',
        'Set RPM (requests per minute) and TPM (tokens per minute)',
        'Limits are shared across all projects in an instance',
        'When limits are exceeded, requests return 429 status',
        'Durable Objects ensure consistent limiting at the edge'
      ]
    }
  }
]

/**
 * Get a service by ID
 * @param {string} id - Service ID
 * @returns {object|undefined} Service object or undefined if not found
 */
export function getServiceById(id) {
  return services.find(service => service.id === id)
}

/**
 * Get all active services
 * @returns {array} Array of active services
 */
export function getActiveServices() {
  return services.filter(service => service.status === 'active')
}

/**
 * Get services by status
 * @param {string} status - Service status
 * @returns {array} Array of services with the given status
 */
export function getServicesByStatus(status) {
  return services.filter(service => service.status === status)
}
