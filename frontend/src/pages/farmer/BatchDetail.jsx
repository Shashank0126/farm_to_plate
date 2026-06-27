import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DashboardLayout from '../../components/common/DashboardLayout'
import QRDisplay from '../../components/farmer/QRDisplay'
import TxHashBadge from '../../components/blockchain/TxHashBadge'
import OrganicBadge from '../../components/common/OrganicBadge'
import TrustScore from '../../components/common/TrustScore'
import FarmMap from '../../components/consumer/FarmMap'
import batchService from '../../services/batch.service'
import { fmtDate, fmtDateTime } from '../../utils/formatDate'
import { ArrowLeft, CheckCircle2, Clock, XCircle, Image, FileText, MapPin, Sprout, Beaker, Droplets } from 'lucide-react'
import clsx from 'clsx'

const STATUS_CFG = {
  pending:  { label: 'Pending Verification', cls: 'badge-yellow', icon: Clock,        bg: 'bg-yellow-900/10 border-yellow-700/30' },
  verified: { label: 'Verified on Chain',    cls: 'badge-green',  icon: CheckCircle2, bg: 'bg-brand-900/10 border-brand-700/30' },
  rejected: { label: 'Rejected',             cls: 'badge-red',    icon: XCircle,      bg: 'bg-red-900/10 border-red-700/30' },
}

export default function BatchDetail() {
  const { id }           = useParams()
  const [batch, setBatch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    batchService.getById(id)
      .then(r => setBatch(r.data.batch))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <DashboardLayout title="Batch Details">
      <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
    </DashboardLayout>
  )

  if (!batch) return (
    <DashboardLayout title="Batch Details">
      <div className="text-center py-16 text-white/30">Batch not found</div>
    </DashboardLayout>
  )

  const cfg  = STATUS_CFG[batch.status] || STATUS_CFG.pending
  const Icon = cfg.icon

  const infoRows = [
    { label: 'Farmer Name',     value: batch.farmerName,     icon: Sprout },
    { label: 'Farm Location',   value: batch.farmLocation,   icon: MapPin },
    { label: 'Soil Type',       value: batch.soilType,       icon: null },
    { label: 'Soil Quality',    value: batch.soilQuality,    icon: null },
    { label: 'Season',          value: batch.season,         icon: null },
    { label: 'Crop Name',       value: batch.cropName,       icon: Sprout },
    { label: 'Variety',         value: batch.variety || '—', icon: null },
    { label: 'Harvest Date',    value: fmtDate(batch.harvestDate), icon: null },
    { label: 'Area (ha)',       value: batch.areaHectares || '—',  icon: null },
    { label: 'Fertilizer Type', value: batch.fertilizerType, icon: Beaker },
    { label: 'Fertilizer Name', value: batch.fertilizerName || '—', icon: null },
    { label: 'Qty Used (kg)',   value: batch.fertilizerQty || '—',  icon: null },
    { label: 'Irrigation',      value: batch.irrigationType, icon: Droplets },
  ]

  return (
    <DashboardLayout title="Batch Details">
      <Link to="/farmer/batches" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white mb-2">
        <ArrowLeft size={13} /> Back to Batches
      </Link>

      {/* Status banner */}
      <div className={clsx('glass-card flex items-center gap-3 border', cfg.bg)}>
        <Icon size={18} className={batch.status === 'verified' ? 'text-brand-400' : batch.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'} />
        <div>
          <p className="font-medium text-white text-sm">{cfg.label}</p>
          {batch.adminNote && <p className="text-xs text-white/40 mt-0.5">Admin note: {batch.adminNote}</p>}
          {batch.verifiedAt && <p className="text-xs text-white/40 mt-0.5">{fmtDateTime(batch.verifiedAt)}</p>}
        </div>
        <div className="ml-auto">
          <span className={cfg.cls}><Icon size={10} /> {cfg.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left — info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Crop info grid */}
          <div className="glass-card">
            <h3 className="text-sm font-semibold text-white mb-4">Batch Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {infoRows.map(({ label, value }) => (
                <div key={label} className="glass rounded-xl p-3">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
                  <p className="text-sm text-white/80 mt-0.5 capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Proof documents */}
          {batch.proofImages?.length > 0 && (
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-white mb-4">Uploaded Proofs</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {batch.proofImages.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="aspect-square glass rounded-xl overflow-hidden hover:border-brand-500/30 transition-all">
                    <img src={url} alt={`proof-${i}`} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {batch.latitude && (
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-white mb-3">Farm Location</h3>
              <FarmMap lat={batch.latitude} lng={batch.longitude} farmerName={batch.farmerName} location={batch.farmLocation} />
            </div>
          )}
        </div>

        {/* Right — QR + blockchain + score */}
        <div className="space-y-4">
          {/* Organic score */}
          <div className="glass-card">
            <p className="text-xs text-white/40 mb-3 uppercase tracking-wider">Organic Score</p>
            <OrganicBadge score={batch.organicScore} showBar />
          </div>

          {/* QR code */}
          {batch.status === 'verified' && (
            <div className="glass-card">
              <p className="text-xs text-white/40 mb-4 uppercase tracking-wider">QR Code</p>
              <QRDisplay batchId={batch.batchId} />
            </div>
          )}

          {/* Blockchain */}
          {batch.blockchainHash && (
            <div className="glass-card space-y-2">
              <p className="text-xs text-white/40 uppercase tracking-wider">Blockchain Record</p>
              <TxHashBadge hash={batch.blockchainHash} label="Block Hash" />
              {batch.blockIndex !== undefined && (
                <div className="glass rounded-xl p-3">
                  <p className="text-[10px] text-white/30">Block Index</p>
                  <p className="text-sm font-mono text-white/70">#{batch.blockIndex}</p>
                </div>
              )}
            </div>
          )}

          {/* Trust score */}
          <div className="glass-card">
            <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Your Trust Score</p>
            <TrustScore score={batch.farmerTrustScore ?? 0} reviews={batch.reviewCount ?? 0} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
