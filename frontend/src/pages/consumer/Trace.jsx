import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import FarmMap from '../../components/consumer/FarmMap'
import TraceTimeline from '../../components/consumer/TraceTimeline'
import OrganicBadge from '../../components/common/OrganicBadge'
import TrustScore from '../../components/common/TrustScore'
import TxHashBadge from '../../components/blockchain/TxHashBadge'
import batchService from '../../services/batch.service'
import { fmtDate } from '../../utils/formatDate'
import {
  Sprout, MapPin, Beaker, Droplets, Calendar, Shield,
  CheckCircle2, ArrowLeft, QrCode, Leaf, Image, ExternalLink,
  Info, Star, Clock
} from 'lucide-react'
import clsx from 'clsx'

function Section({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={clsx('glass-card', className)}>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
        {Icon && <Icon size={15} className="text-brand-400" />}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/40 flex-shrink-0">{label}</span>
      <span className="text-xs text-white/80 text-right capitalize">{value}</span>
    </div>
  )
}

export default function Trace() {
  const { id }             = useParams()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    batchService.trace(id)
      .then(r => setData(r.data))
      .catch(() => setError('Batch not found or not yet verified.'))
      .finally(() => setLoading(false))
  }, [id])

  const url = `${window.location.origin}/trace/${id}`

  if (loading) return (
    <div className="min-h-screen bg-farm-gradient bg-pattern flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-brand-500 animate-spin mx-auto mb-3" />
        <p className="text-sm text-white/40">Fetching blockchain record…</p>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen bg-farm-gradient bg-pattern flex items-center justify-center p-4">
      <div className="glass-card text-center max-w-sm">
        <Shield size={36} className="text-red-400 mx-auto mb-3" />
        <h2 className="font-display text-lg text-white mb-2">Not Found</h2>
        <p className="text-sm text-white/40">{error}</p>
        <Link to="/" className="btn-secondary mt-4 inline-flex text-xs">← Back to Home</Link>
      </div>
    </div>
  )

  const { batch, timeline, purchases } = data

  // Build timeline events
  const events = [
    {
      type: 'created',
      date: batch.createdAt,
      description: `Batch registered by ${batch.farmerName}`,
      metadata: { crop: batch.cropName, season: batch.season, area: `${batch.areaHectares || '?'} ha` }
    },
    {
      type: batch.status === 'verified' ? 'verified' : batch.status === 'rejected' ? 'rejected' : 'pending',
      date: batch.verifiedAt || batch.createdAt,
      description: batch.status === 'verified'
        ? 'Proof documents verified by admin. Batch added to blockchain.'
        : batch.status === 'rejected'
        ? `Rejected: ${batch.adminNote}`
        : 'Awaiting admin verification',
      metadata: batch.blockchainHash ? { txHash: batch.blockchainHash.slice(0, 16) + '…' } : {}
    },
    ...(purchases || []).map(p => ({
      type: 'purchased',
      date: p.purchaseDate,
      description: `Purchased by ${p.purchaserName}`,
      metadata: {
        quantity: `${p.quantityPurchased} kg`,
        destination: p.marketDestination,
        storage: p.storageConditions || '—',
      }
    })),
  ]

  return (
    <div className="min-h-screen bg-farm-gradient bg-pattern">
      {/* Top bar */}
      <nav className="border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 bg-[#071a0f]/80 backdrop-blur-xl z-40">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shadow-glow flex-shrink-0">
            <Sprout size={14} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Farm to Plate</p>
            <p className="text-[10px] text-white/30 hidden sm:block">Blockchain Traceability</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-green hidden sm:flex">
            <CheckCircle2 size={10} /> Verified on Blockchain
          </span>
          <Link to="/scan" className="btn-secondary text-xs gap-1">
            <QrCode size={12} /> Scan Another
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {/* Hero */}
        <div className="glass-card animate-fade-in">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-brand-400" />
                <span className="text-xs text-brand-300 font-medium">Blockchain Verified</span>
              </div>
              <h1 className="font-display text-3xl text-white font-bold">{batch.cropName}</h1>
              {batch.variety && <p className="text-sm text-white/40 mt-1">{batch.variety}</p>}
              <p className="text-xs text-white/30 font-mono mt-2">{batch.batchId}</p>
            </div>

            {/* QR */}
            <div className="p-3 bg-white rounded-2xl shadow-glow flex-shrink-0">
              <QRCodeSVG value={url} size={90} bgColor="#ffffff" fgColor="#052e16" level="H" />
            </div>
          </div>

          {/* Score row */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] text-white/30 mb-1.5">Organic Score</p>
              <OrganicBadge score={batch.organicScore} showBar />
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] text-white/30 mb-1.5">Farmer Trust</p>
              <TrustScore score={batch.farmer?.trustScore ?? 0} reviews={batch.farmer?.reviewCount ?? 0} size="sm" />
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] text-white/30 mb-1.5">Harvest Date</p>
              <p className="text-sm text-white/80">{fmtDate(batch.harvestDate)}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] text-white/30 mb-1.5">Season</p>
              <p className="text-sm text-white/80">{batch.season}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Left column */}
          <div className="md:col-span-3 space-y-5">
            {/* Farmer info */}
            <Section title="Farmer Information" icon={Sprout}>
              <InfoRow label="Farmer Name"   value={batch.farmerName} />
              <InfoRow label="Farm Location" value={batch.farmLocation} />
              <InfoRow label="Soil Type"     value={batch.soilType} />
              <InfoRow label="Soil Quality"  value={batch.soilQuality} />
              {batch.latitude && (
                <div className="mt-3">
                  <FarmMap
                    lat={parseFloat(batch.latitude)}
                    lng={parseFloat(batch.longitude)}
                    farmerName={batch.farmerName}
                    location={batch.farmLocation}
                    height="200px"
                  />
                </div>
              )}
            </Section>

            {/* Crop details */}
            <Section title="Crop Details" icon={Leaf}>
              <InfoRow label="Crop Name"        value={batch.cropName} />
              <InfoRow label="Variety"          value={batch.variety} />
              <InfoRow label="Season"           value={batch.season} />
              <InfoRow label="Area (Hectares)"  value={batch.areaHectares} />
              <InfoRow label="Harvest Date"     value={fmtDate(batch.harvestDate)} />
            </Section>

            {/* Fertilizer */}
            <Section title="Fertilizer & Irrigation" icon={Beaker}>
              <InfoRow label="Fertilizer Type"  value={batch.fertilizerType} />
              <InfoRow label="Fertilizer Name"  value={batch.fertilizerName} />
              <InfoRow label="Quantity Used"    value={batch.fertilizerQty ? `${batch.fertilizerQty} kg` : null} />
              <InfoRow label="Irrigation Type"  value={batch.irrigationType} />
            </Section>

            {/* Proof images */}
            {batch.proofImages?.length > 0 && (
              <Section title="Proof Documents" icon={Image}>
                <div className="grid grid-cols-3 gap-2">
                  {batch.proofImages.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer"
                      className="aspect-square glass rounded-xl overflow-hidden border border-white/10 hover:border-brand-500/30 transition-all group">
                      <img src={url} alt={`proof-${i}`} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
                <p className="text-[10px] text-white/20 mt-2">Documents verified by platform admin</p>
              </Section>
            )}
          </div>

          {/* Right column */}
          <div className="md:col-span-2 space-y-5">
            {/* Supply chain timeline */}
            <Section title="Supply Chain Journey" icon={Clock}>
              <TraceTimeline events={events} />
            </Section>

            {/* Blockchain record */}
            <Section title="Blockchain Record" icon={Shield}>
              {batch.blockchainHash ? (
                <div className="space-y-2">
                  <TxHashBadge hash={batch.blockchainHash} label="Block Hash" />
                  <div className="glass rounded-xl p-3">
                    <p className="text-[10px] text-white/30">Block Index</p>
                    <p className="text-sm font-mono text-white/70">#{batch.blockIndex}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-[10px] text-white/30">Verified At</p>
                    <p className="text-xs text-white/70">{fmtDate(batch.verifiedAt)}</p>
                  </div>
                  <div className="glass rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-brand-400" />
                    <p className="text-xs text-white/60">This record is immutable and tamper-proof</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/30">Not yet on chain</p>
              )}
            </Section>

            {/* Organic score breakdown */}
            <Section title="Organic Score Breakdown" icon={Info}>
              <div className="space-y-2">
                {[
                  { label: 'Fertilizer Type', value: batch.fertilizerType === 'Organic' ? 40 : batch.fertilizerType === 'Mixed' ? 20 : 0, max: 40 },
                  { label: 'Soil Quality',    value: batch.soilQuality === 'Excellent' ? 30 : batch.soilQuality === 'Good' ? 22 : batch.soilQuality === 'Average' ? 12 : 4, max: 30 },
                  { label: 'Season Match',    value: 15, max: 20 },
                  { label: 'Irrigation',      value: batch.irrigationType === 'Drip' || batch.irrigationType === 'Rainfed' ? 10 : 5, max: 10 },
                ].map(({ label, value, max }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">{label}</span>
                      <span className="text-white/70">{value}/{max}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-700"
                        style={{ width: `${(value / max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Total Score</span>
                    <OrganicBadge score={batch.organicScore} />
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-white/20">
            This page is publicly accessible at{' '}
            <span className="text-brand-400/60 font-mono">/trace/{id}</span>
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link to="/" className="text-xs text-white/30 hover:text-white flex items-center gap-1">
              <Sprout size={11} /> Farm to Plate
            </Link>
            <Link to="/scan" className="text-xs text-white/30 hover:text-white flex items-center gap-1">
              <QrCode size={11} /> Scan Another
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
