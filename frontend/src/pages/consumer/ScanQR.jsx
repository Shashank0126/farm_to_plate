import { Link } from 'react-router-dom'
import QRScanner from '../../components/consumer/QRScanner'
import { Sprout, ArrowLeft } from 'lucide-react'

export default function ScanQR() {
  return (
    <div className="min-h-screen bg-farm-gradient bg-pattern">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-glow">
            <Sprout size={16} className="text-white" />
          </div>
          <span className="font-display font-semibold text-white text-sm">Farm to Plate</span>
        </div>
        <Link to="/" className="text-xs text-white/40 hover:text-white flex items-center gap-1">
          <ArrowLeft size={13} /> Home
        </Link>
      </nav>

      <div className="max-w-md mx-auto px-4 pt-12 pb-16">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-white mb-2">Scan QR Code</h1>
          <p className="text-sm text-white/40">
            Scan any Farm to Plate QR code to verify the product's origin, organic score, and full supply chain history.
          </p>
        </div>
        <QRScanner />
      </div>
    </div>
  )
}
