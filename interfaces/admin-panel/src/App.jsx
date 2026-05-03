import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Login from './pages/Login'
import Instances from './pages/Instances'
import Users from './pages/Users'
import Logs from './pages/Logs'
import Services from './pages/Services'
import Models from './pages/Models'
import Deployments from './pages/Deployments'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in (check localStorage)
    const apiKey = localStorage.getItem('adminApiKey')
    if (apiKey) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (apiKey) => {
    localStorage.setItem('adminApiKey', apiKey)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminApiKey')
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onLogout={handleLogout} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <Routes>
          <Route path="/" element={<Navigate to="/instances" replace />} />
          <Route path="/instances" element={<Instances />} />
          <Route path="/users" element={<Users />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/services" element={<Services />} />
          <Route path="/models" element={<Models />} />
          <Route path="/deployments" element={<Deployments />} />
          <Route path="*" element={<Navigate to="/instances" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
