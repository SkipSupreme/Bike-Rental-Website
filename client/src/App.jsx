import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Public pages
import HomePage from './pages/HomePage'
import BikesPage from './pages/BikesPage'
import RentPage from './pages/RentPage'
import RepairsPage from './pages/RepairsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WaiverPage from './pages/WaiverPage'
import PaymentPage from './pages/PaymentPage'
import ConfirmationPage from './pages/ConfirmationPage'

// Customer pages
import MyRentalsPage from './pages/MyRentalsPage'
import ProfilePage from './pages/ProfilePage'
import ReviewPage from './pages/ReviewPage'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminBikes from './pages/admin/Bikes'
import AdminRentals from './pages/admin/Rentals'
import AdminCustomers from './pages/admin/Customers'
import AdminContent from './pages/admin/Content'
import AdminSettings from './pages/admin/Settings'

// Components
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bike-dark">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/bikes" element={<BikesPage />} />
        <Route path="/rent" element={<RentPage />} />
        <Route path="/repairs" element={<RepairsPage />} />
        <Route path="/login" element={user ? <Navigate to={user.isAdmin ? '/admin' : '/my-rentals'} /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/rent" /> : <RegisterPage />} />

        {/* Protected customer routes */}
        <Route path="/waiver" element={
          <ProtectedRoute>
            <WaiverPage />
          </ProtectedRoute>
        } />
        <Route path="/payment/:rentalId" element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        } />
        <Route path="/confirmation/:rentalId" element={
          <ProtectedRoute>
            <ConfirmationPage />
          </ProtectedRoute>
        } />
        <Route path="/my-rentals" element={
          <ProtectedRoute>
            <MyRentalsPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/review" element={
          <ProtectedRoute>
            <ReviewPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="bikes" element={<AdminBikes />} />
        <Route path="rentals" element={<AdminRentals />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
