import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/common/DashboardLayout'
import { StatCard } from '../../components/common/GlassCard'
import TrustScore from '../../components/common/TrustScore'
import OrganicBadge from '../../components/common/OrganicBadge'
import TxHashBadge from '../../components/blockchain/TxHashBadge'
import { fmtDate } from '../../utils/formatDate'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  Sprout, Plus, Clock, CheckCircle2, XCircle, TrendingUp,
  Package, Star, AlertTriangle, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_CFG = {
  pending:  { label: 'Pending',  className: 'badge-yellow', icon: Clock },
  verified: { label: 'Verified', className: 'badge-green',  icon: CheckCircle2 },
  rejected: { label: 'Rejected', className: 'badge-red',    icon: XCircle },
}

export default function FarmerDashboard() {
  const { user } = useAuth()
  const [stats,   setStats]   = useState(null)
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/farmers/stats'),
      api.get('/batches/my?limit=5'),
    ]).then(([s, b]) => {
      setStats(s.data)
      setBatches(b.data.batches || [])
    }).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { icon: Package,      label: 'Total Batches',     value: stats?.total    ?? '—', color: 'brand'  },
    { icon: CheckCircle2, label: 'Verified',           value: stats?.verified ?? '—', color: 'brand'  },
    { icon: Clock,        label: 'Pending Review',     value: stats?.pending  ?? '—', color: 'yellow' },
    { icon: TrendingUp,   label: 'Avg Organic Score',  value: stats?.avgOrganic ? `${stats.avgOrganic}%` : '—', color: 'earth' },
  ]

  return (
    <DashboardLayout
      title="Farmer Dashboard"
      actions={
        <Link to="/farmer/batches/add" className="btn-primary text-sm">
          <Plus size={15} /> New Batch
        </Link>
      }
    >
      {/* Welcome banner */}
      <div className="glass-card flex items-center justify-between p-5">
        <div>
          <p className="text-white/40 text-sm">Good morning,</p>
          <h2 className="font-display text-xl text-white font-semibold">{user?.name}</h2>
          <p className="text-xs text-white/30 mt-0.5">{user?.email}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40 mb-1">Trust Score</p>
          <TrustScore score={stats?.trustScore ?? 0} reviews={stats?.reviews ?? 0} size="lg" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent batches */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Recent Batches</h3>
          <Link to="/farmer/batches" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-10">
            <Sprout size={32} className="text-white/10 mx-auto mb-2" />
            <p className="text-sm text-white/30">No batches yet</p>
            <Link to="/farmer/batches/add" className="btn-primary mt-3 text-xs inline-flex">
              <Plus size={13} /> Add your first batch
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {batches.map((b) => {
              const cfg  = STATUS_CFG[b.status] || STATUS_CFG.pending
              const Icon = cfg.icon
              return (
                <Link
                  key={b._id}
                  to={`/farmer/batches/${b._id}`}
                  className="flex items-center gap-4 p-3 glass rounded-xl hover:border-brand-500/30 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-900/40 border border-brand-700/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                    <Sprout size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{b.cropName}</p>
                    <p className="text-xs text-white/30 mt-0.5">{b.batchId} · {fmtDate(b.harvestDate)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cfg.className}>
                      <Icon size={10} /> {cfg.label}
                    </span>
                    <OrganicBadge score={b.organicScore} />
                  </div>
                  <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Alerts */}
      {stats?.complaints > 0 && (
        <div className="glass-card border border-yellow-700/30 bg-yellow-900/10">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-300">
                {stats.complaints} complaint{stats.complaints > 1 ? 's' : ''} received
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                Purchasers have flagged issues on some of your batches. Review them to protect your trust score.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
