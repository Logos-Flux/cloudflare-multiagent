import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ onLogout }) {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
      ? 'bg-blue-700 text-white'
      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
  }

  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-white text-xl font-bold">
              Cloudflare Multi-Agent Admin
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                to="/instances"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/instances')}`}
              >
                Instances
              </Link>
              <Link
                to="/users"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/users')}`}
              >
                Users
              </Link>
              <Link
                to="/services"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/services')}`}
              >
                Services
              </Link>
              <Link
                to="/models"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/models')}`}
              >
                Models
              </Link>
              <Link
                to="/deployments"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/deployments')}`}
              >
                Deployments
              </Link>
              <Link
                to="/logs"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/logs')}`}
              >
                Logs
              </Link>
            </div>
          </div>

          {/* Logout Button */}
          <div>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
