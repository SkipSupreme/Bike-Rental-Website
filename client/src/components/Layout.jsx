import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, Bike, User, LogOut, Settings } from 'lucide-react'
import GearIcon from './icons/GearIcon'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/bikes', label: 'Our Bikes' },
    { path: '/rent', label: 'Rent Now' },
    { path: '/repairs', label: 'Repairs' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bike-dark/95 backdrop-blur-sm border-b border-bike-gray/50">
        <nav className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <GearIcon className="w-10 h-10 text-bike-orange gear-spin" />
                <Bike className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
              </div>
              <span className="font-heading text-xl text-white">Joe's Garage</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.path) ? 'text-bike-orange' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <div className="flex items-center gap-4">
                  {user.isAdmin ? (
                    <Link to="/admin" className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                      <Settings size={16} />
                      Admin
                    </Link>
                  ) : (
                    <Link to="/my-rentals" className="text-sm text-gray-300 hover:text-white">
                      My Rentals
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="btn-primary text-sm py-2 px-4">
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Nav */}
          {menuOpen && (
            <div className="md:hidden absolute left-0 right-0 top-full bg-bike-dark border-b border-bike-gray/50 py-4 px-4">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-3 text-lg font-medium ${
                    isActive(link.path) ? 'text-bike-orange' : 'text-gray-300'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-3 border-bike-gray/50" />
              {user ? (
                <>
                  {user.isAdmin ? (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="block py-3 text-lg font-medium text-bike-orange"
                    >
                      Admin Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/my-rentals"
                        onClick={() => setMenuOpen(false)}
                        className="block py-3 text-lg font-medium text-gray-300"
                      >
                        My Rentals
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block py-3 text-lg font-medium text-gray-300"
                      >
                        Profile
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="block py-3 text-lg font-medium text-red-400"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 text-lg font-medium text-bike-orange"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 text-lg font-medium text-gray-300"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-bike-blue/50 border-t border-bike-gray/50 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GearIcon className="w-8 h-8 text-bike-orange" />
                <span className="font-heading text-lg">Joe's Garage</span>
              </div>
              <p className="text-gray-400 text-sm">
                Bicycle Rental & Repair on the Bow River Pathway since 2007.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-bike-orange">Location</h4>
              <p className="text-gray-400 text-sm">
                355 8 St SW, Calgary, AB<br />
                Bow River Pathway, near 10th Street LRT
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-bike-orange">Contact</h4>
              <p className="text-gray-400 text-sm">
                Phone: (403) 874-5637<br />
                Open Daily: 10 AM - 7 PM<br />
                Weather Permitting
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-bike-gray/50 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Joe's Garage. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
