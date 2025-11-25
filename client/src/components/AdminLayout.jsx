import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Bike,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Home
} from 'lucide-react'
import GearIcon from './icons/GearIcon'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/rentals', icon: Calendar, label: 'Rentals' },
    { path: '/admin/bikes', icon: Bike, label: 'Bikes' },
    { path: '/admin/customers', icon: Users, label: 'Customers' },
    { path: '/admin/content', icon: FileText, label: 'Website Content' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-bike-dark flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col bg-bike-blue/50 border-r border-bike-gray/50">
        <div className="p-4 border-b border-bike-gray/50">
          <Link to="/admin" className="flex items-center gap-2">
            <GearIcon className="w-8 h-8 text-bike-orange" />
            <div>
              <span className="font-heading text-lg block">Joe's Garage</span>
              <span className="text-xs text-gray-400">Admin Panel</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                isActive(item.path, item.exact)
                  ? 'bg-bike-orange/20 text-bike-orange border-r-2 border-bike-orange'
                  : 'text-gray-300 hover:bg-bike-gray/30 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-bike-gray/50">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Home size={20} />
            View Website
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors w-full"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-bike-dark border-b border-bike-gray/50">
        <div className="flex items-center justify-between p-4">
          <Link to="/admin" className="flex items-center gap-2">
            <GearIcon className="w-8 h-8 text-bike-orange" />
            <span className="font-heading">Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-white"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-bike-dark transform transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-bike-gray/50">
          <span className="font-heading text-lg">Admin Panel</span>
        </div>
        <nav className="py-4">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm ${
                isActive(item.path, item.exact)
                  ? 'bg-bike-orange/20 text-bike-orange'
                  : 'text-gray-300'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-bike-gray/50">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400"
          >
            <Home size={20} />
            View Website
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 w-full"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-0 pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
