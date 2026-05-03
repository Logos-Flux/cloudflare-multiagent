import { useState } from 'react'
import { services } from '../config/services'

export default function Services() {
  const [copiedUrl, setCopiedUrl] = useState(null)

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedUrl(id)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  // Services are now imported from config/services.js
  // To add a new service, edit src/config/services.js

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Services</h1>
        <p className="mt-2 text-sm text-gray-700">
          Explore and interact with the deployed services in your multi-agent system
        </p>
      </div>

      <div className="space-y-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* Service Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl">{service.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">{service.name}</h2>
                    <p className="text-blue-100 text-sm">{service.description}</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {service.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* API Endpoints */}
                  {service.endpoints && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">API Endpoints</h3>
                      <div className="space-y-2">
                        {service.endpoints.map((endpoint, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-md p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`px-2 py-1 text-xs font-bold rounded ${
                                endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                                endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {endpoint.method}
                              </span>
                              <code className="text-sm font-mono text-gray-700">{endpoint.path}</code>
                            </div>
                            <p className="text-xs text-gray-600 ml-14">{endpoint.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Links */}
                  {service.links && service.links.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Links</h3>
                      <div className="space-y-2">
                        {service.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border border-gray-200 rounded-md p-3 hover:bg-blue-50 hover:border-blue-300 transition"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-blue-600 mb-1">{link.name}</div>
                                <div className="text-xs text-gray-600">{link.description}</div>
                              </div>
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Usage Instructions */}
                  {service.usage && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{service.usage.title}</h3>
                      <ol className="space-y-2">
                        {service.usage.steps.map((step, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs font-bold mr-3 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-sm text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Code Example */}
                  {service.example && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{service.example.title}</h3>
                      <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                          <code>{service.example.code}</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard(service.example.code, service.id)}
                          className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition"
                        >
                          {copiedUrl === service.id ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
        <p className="text-sm text-blue-800 mb-4">
          Check out the complete documentation or reach out to your team for assistance.
        </p>
        <div className="flex space-x-4">
          <a
            href="/docs"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition"
          >
            View Documentation
          </a>
          <a
            href="https://github.com/Logos-Flux/cloudflare-multiagent"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 rounded-md text-sm font-medium transition"
          >
            GitHub Repository
          </a>
        </div>
      </div>
    </div>
  )
}
