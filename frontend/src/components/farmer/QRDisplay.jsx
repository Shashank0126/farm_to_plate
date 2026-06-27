import { QRCodeSVG } from 'qrcode.react'
import { Download, ExternalLink } from 'lucide-react'
import { useRef } from 'react'

export default function QRDisplay({ batchId, size = 180 }) {
  const url = `${window.location.origin}/trace/${batchId}`
  const ref = useRef()

  const download = () => {
    const svg  = ref.current?.querySelector('svg')
    if (!svg) return
    const data = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([data], { type: 'image/svg+xml' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `batch-${batchId}-qr.svg`
    a.click()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={ref}
        className="p-4 bg-white rounded-2xl shadow-glow"
      >
        <QRCodeSVG
          value={url}
          size={size}
          bgColor="#ffffff"
          fgColor="#052e16"
          level="H"
          includeMargin={false}
        />
      </div>
      <div className="text-center">
        <p className="text-xs text-white/40 font-mono break-all max-w-[220px]">{url}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={download} className="btn-secondary text-xs gap-1.5">
          <Download size={13} /> Download QR
        </button>
        <a href={url} target="_blank" rel="noreferrer" className="btn-secondary text-xs gap-1.5">
          <ExternalLink size={13} /> Open Trace
        </a>
      </div>
    </div>
  )
}
