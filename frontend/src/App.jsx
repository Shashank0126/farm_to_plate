import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import ProtectedRoute from './components/common/ProtectedRoute'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Farmer Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard'
import AddCropBatch from './pages/farmer/AddCropBatch'
import BatchDetail from './pages/farmer/BatchDetail'
import FarmerBatches from './pages/farmer/FarmerBatches'

// Purchaser Pages
import PurchaserDashboard from './pages/purchaser/PurchaserDashboard'
import BrowseBatches from './pages/purchaser/BrowseBatches'
import PurchaseHistory from './pages/purchaser/PurchaseHistory'
import PurchaseBatch from './pages/purchaser/PurchaseBatch'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageUsers from './pages/admin/ManageUsers'
import VerifyBatches from './pages/admin/VerifyBatches'
import BlockchainLogs from './pages/admin/BlockchainLogs'
import Complaints from './pages/admin/Complaints'

// Consumer Pages
import ScanQR from './pages/consumer/ScanQR'
import Trace from './pages/consumer/Trace'
import Landing from './pages/Landing'

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d2418',
              color: '#e2f0e8',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '12px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#052e16' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#052e16' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/"          element={<Landing />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/trace/:id" element={<Trace />} />
          <Route path="/scan"      element={<ScanQR />} />

          {/* Farmer */}
          <Route path="/farmer" element={<ProtectedRoute role="farmer" />}>
            <Route index                element={<FarmerDashboard />} />
            <Route path="batches"       element={<FarmerBatches />} />
            <Route path="batches/add"   element={<AddCropBatch />} />
            <Route path="batches/:id"   element={<BatchDetail />} />
          </Route>

          {/* Purchaser */}
          <Route path="/purchaser" element={<ProtectedRoute role="purchaser" />}>
            <Route index                  element={<PurchaserDashboard />} />
            <Route path="browse"          element={<BrowseBatches />} />
            <Route path="purchase/:id"    element={<PurchaseBatch />} />
            <Route path="history"         element={<PurchaseHistory />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute role="admin" />}>
            <Route index                  element={<AdminDashboard />} />
            <Route path="users"           element={<ManageUsers />} />
            <Route path="verify"          element={<VerifyBatches />} />
            <Route path="blockchain"      element={<BlockchainLogs />} />
            <Route path="complaints"      element={<Complaints />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  )
}
