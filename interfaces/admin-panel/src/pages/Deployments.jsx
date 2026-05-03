import { useState, useEffect } from 'react'

export default function Deployments() {
  const [deployments, setDeployments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'workers', 'pages'
  const [sortBy, setSortBy] = useState('name') // 'name', 'type', 'lastDeployed'

  useEffect(() => {
    // In a real implementation, this would fetch from Cloudflare API
    // For now, we'll use hardcoded data based on the app structure
    const mockDeployments = [
      {
        id: 'config-service',
        name: 'config-service',
        type: 'Worker',
        description: 'Central configuration management API',
        url: 'https://api.example.com',
        customDomain: 'api.example.com',
        dateCreated: '2024-01-15',
        lastDeployed: '2024-01-24',
        lastUsed: '2024-01-24',
        status: 'active',
        requestsToday: 1247,
        errorRate: 0.02
      },
      {
        id: 'image-gen',
        name: 'image-gen',
        type: 'Worker',
        description: 'AI-powered image generation worker',
        url: 'https://images.example.com',
        customDomain: 'images.example.com',
        dateCreated: '2024-01-18',
        lastDeployed: '2024-01-24',
        lastUsed: '2024-01-24',
        status: 'active',
        requestsToday: 342,
        errorRate: 0.01
      },
      {
        id: 'text-gen',
        name: 'text-gen',
        type: 'Worker',
        description: 'AI-powered text generation worker',
        url: 'https://text.example.com',
        customDomain: 'text.example.com',
        dateCreated: '2024-01-24',
        lastDeployed: '2024-01-24',
        lastUsed: '2024-01-24',
        status: 'active',
        requestsToday: 0,
        errorRate: 0.00
      },
      {
        id: 'rate-limiter',
        name: 'rate-limiter',
        type: 'Worker (Durable Object)',
        description: 'Rate limiting service',
        url: 'Internal',
        customDomain: null,
        dateCreated: '2024-01-16',
        lastDeployed: '2024-01-23',
        lastUsed: '2024-01-24',
        status: 'active',
        requestsToday: 1589,
        errorRate: 0.00
      },
      {
        id: 'monitoring-dashboard',
        name: 'monitoring-dashboard',
        type: 'Pages',
        description: 'Real-time monitoring and metrics dashboard',
        url: 'https://monitoring.example.com',
        customDomain: 'monitoring.example.com',
        dateCreated: '2024-01-20',
        lastDeployed: '2024-01-24',
        lastUsed: '2024-01-24',
        status: 'active',
        requestsToday: 87,
        errorRate: 0.00
      },
      {
        id: 'admin-panel',
        name: 'admin-panel',
        type: 'Pages',
        description: 'Admin interface for managing instances and users',
        url: 'https://admin.example.com',
        customDomain: 'admin.example.com',
        dateCreated: '2024-01-19',
        lastDeployed: '2024-01-24',
        lastUsed: '2024-01-24',
        status: 'active',
        requestsToday: 156,
        errorRate: 0.00
      },
      {
        id: 'testing-gui',
        name: 'testing-gui',
        type: 'Pages',
        description: 'Interactive testing interface for image generation',
        url: 'https://testing.example.com',
        customDomain: 'testing.example.com',
        dateCreated: '2024-01-21',
        lastDeployed: '2024-01-24',
        lastUsed: '2024-01-24',
        status: 'active',
        requestsToday: 234,
        errorRate: 0.00
      },
      {
        id: 'text-testing-gui',
        name: 'text-testing-gui',
        type: 'Pages',
        description: 'Interactive testing interface for text generation',
        url: 'https://text-testing.example.com',
        customDomain: 'text-testing.example.com',
        dateCreated: '2024-01-24',
        lastDeployed: '2024-01-24',
        lastUsed: '2024-01-24',
        status: 'active',
        requestsToday: 0,
        errorRate: 0.00
      }
    ]

    setDeployments(mockDeployments)
    setLoading(false)
  }, [])

  const filteredDeployments = deployments.filter(d => {
    if (filter === 'workers') return d.type.includes('Worker')
    if (filter === 'pages') return d.type === 'Pages'
    return true
  })

  const sortedDeployments = [...filteredDeployments].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'type') return a.type.localeCompare(b.type)
    if (sortBy === 'lastDeployed') return new Date(b.lastDeployed) - new Date(a.lastDeployed)
    return 0
  })

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.active}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Deployments</h1>
        <p className="mt-2 text-sm text-gray-700">
          All Workers and Pages projects for Cloudflare Multi-Agent
        </p>
      </div>

      {/* Filters and Stats */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">{deployments.length}</div>
            <div className="text-sm text-blue-700">Total Deployments</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">
              {deployments.filter(d => d.type.includes('Worker')).length}
            </div>
            <div className="text-sm text-green-700">Workers</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-900">
              {deployments.filter(d => d.type === 'Pages').length}
            </div>
            <div className="text-sm text-purple-700">Pages Projects</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-900">
              {deployments.filter(d => d.customDomain).length}
            </div>
            <div className="text-sm text-orange-700">Custom Domains</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({deployments.length})
            </button>
            <button
              onClick={() => setFilter('workers')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === 'workers'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Workers ({deployments.filter(d => d.type.includes('Worker')).length})
            </button>
            <button
              onClick={() => setFilter('pages')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === 'pages'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pages ({deployments.filter(d => d.type === 'Pages').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 font-medium">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Name</option>
              <option value="type">Type</option>
              <option value="lastDeployed">Last Deployed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deployments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL / Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Deployed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requests Today
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedDeployments.map((deployment) => (
                <tr key={deployment.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{deployment.name}</div>
                      <div className="text-xs text-gray-500">{deployment.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      deployment.type.includes('Worker')
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {deployment.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {deployment.customDomain ? (
                      <a
                        href={deployment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {deployment.customDomain}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500">{deployment.url}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(deployment.dateCreated)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(deployment.lastDeployed)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(deployment.lastUsed)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {deployment.requestsToday.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {deployment.errorRate}% errors
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(deployment.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">About This Page</h3>
        <p className="text-sm text-blue-800 mb-4">
          This page helps you track all Workers and Pages projects associated with the Cloudflare Multi-Agent app.
          Use this inventory to manage deployments across your Cloudflare account.
        </p>
        <div className="space-y-2 text-sm text-blue-700">
          <p><strong>Workers:</strong> Backend services running on Cloudflare's edge network</p>
          <p><strong>Pages:</strong> Frontend applications deployed via Cloudflare Pages</p>
          <p><strong>Custom Domains:</strong> Production URLs configured for public access</p>
        </div>
      </div>
    </div>
  )
}
