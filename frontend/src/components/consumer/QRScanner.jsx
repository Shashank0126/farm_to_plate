import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CameraOff } from 'lucide-react'
import toast from 'react-hot-toast'
import QrReader from 'react-qr-scanner'

const previewStyle = {
  width: '100%',
  height: '100%',
}

export default function QRScanner() {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [manual, setManual] = useState('')
  const navigate = useNavigate()

  const handleScan = (data) => {
    if (!data) return
    const text = typeof data === 'string' ? data : data?.text || ''
    if (!text) return

    const match = text.match(/\/trace\/([A-Za-z0-9-_]+)/)
    if (match) {
      navigate(`/trace/${match[1]}`)
    } else {
      toast.error('Invalid QR code — not a Farm to Plate batch')
    }
  }

  const handleError = (err) => {
    console.error('QR Scanner error:', err)
    setError('Unable to access camera. Check permission or use manual entry.')
    setScanning(false)
  }

  const handleManual = (e) => {
    e.preventDefault()
    if (manual.trim()) {
      navigate(`/trace/${manual.trim()}`)
    }
  }

  const openScanner = () => {
    setError(null)
    setScanning(true)
  }

  const closeScanner = () => {
    setScanning(false)
  }

  return (
    <div className="space-y-6">
      {!scanning ? (
        <div className="glass-card flex flex-col items-center justify-center gap-4 py-14">
          <div className="w-16 h-16 rounded-2xl bg-brand-900/40 border border-brand-700/30 flex items-center justify-center">
            <Camera size={28} className="text-brand-400" />
          </div>
          <div className="text-center">
            <p className="text-white font-medium">QR Code Scanner</p>
            <p className="text-sm text-white/40 mt-1">Point camera at a Farm to Plate QR code</p>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={openScanner} className="btn-primary">
            <Camera size={15} /> Start Camera
          </button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden p-0">
          <div className="relative bg-black aspect-square max-h-72">
            <QrReader
              delay={300}
              style={previewStyle}
              onError={handleError}
              onScan={handleScan}
              facingMode="environment"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-brand-500/60 rounded-xl relative mx-auto">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />
                  <div className="absolute inset-x-0 h-0.5 bg-brand-500/70 animate-[slide-down_2s_ease-in-out_infinite]" style={{ top: '50%' }} />
                </div>
              </div>
              <p className="absolute bottom-4 w-full text-center text-xs text-white/40">Scanning…</p>
            </div>
          </div>
          <div className="p-4 flex justify-center">
            <button onClick={closeScanner} className="btn-secondary text-sm gap-2">
              <CameraOff size={14} /> Stop Camera
            </button>
          </div>
        </div>
      )}

      <div className="glass-card">
        <p className="text-xs text-white/40 mb-3 uppercase tracking-wider">Manual Batch ID Entry</p>
        <form onSubmit={handleManual} className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Enter Batch ID (e.g. BATCH-20240101-ABC)"
            value={manual}
            onChange={e => setManual(e.target.value)}
          />
          <button type="submit" className="btn-primary whitespace-nowrap">
            Trace
          </button>
        </form>
      </div>
    </div>
  )
}
