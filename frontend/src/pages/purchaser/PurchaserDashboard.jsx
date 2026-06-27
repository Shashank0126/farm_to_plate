import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/common/DashboardLayout'
import { StatCard } from '../../components/common/GlassCard'
import OrganicBadge from '../../components/common/OrganicBadge'
import TrustScore from '../../components/common/TrustScore'
import { fmtDate } from '../../utils/formatDate'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { ShoppingCart, Package, TrendingUp, Leaf, ChevronRight, Eye } from 'lucide-react'

export default function PurchaserDashboard() {
  const { user }          = useAuth()
  const [stats, setStats]     = useState(null)
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/purchasers/stats'),
      api.get('/purchases/my?limit=5'),
    ]).then(([s, p]) => {
      setStats(s.data)
      setRecent(p.data.purchases || [])
    }).finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout
      title="Purchaser Dashboard"
      actions={
        <Link to="/purchaser/browse" className="btn-primary text-sm">
          <Eye size={15} /> Browse Batches
        </Link>
      }
    >
      {/* Welcome */}
      <div className="glass-card flex items-center justify-between p-5">
        <div>
          <p className="text-white/40 text-sm">Welcome back,</p>
          <h2 className="font-display text-xl text-white font-semibold">{user?.name}</h2>
        </div>
        <div className="text-right text-sm text-white/40">
          <p>Total Spent</p>
          <p className="text-white font-semibold text-lg">₹{stats?.totalSpent?.toLocaleString('en-IN') ?? '—'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package}     label="Total Purchases"    value={stats?.total       ?? '—'} color="brand"  />
        <StatCard icon={Leaf}        label="Avg Organic Score"  value={stats?.avgOrganic ? `${stats.avgOrganic}%` : '—'} color="earth" />
        <StatCard icon={TrendingUp}  label="This Month"         value={stats?.thisMonth   ?? '—'} color="blue"   />
        <StatCard icon={ShoppingCart}label="Pending Feedback"   value={stats?.pendingFeedback ?? '—'} color="yellow" />
      </div>

      {/* Recent purchases */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Recent Purchases</h3>
          <Link to="/purchaser/history" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : recent.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingCart size={32} className="text-white/10 mx-auto mb-2" />
            <p className="text-sm text-white/30">No purchases yet</p>
            <Link to="/purchaser/browse" className="btn-primary mt-3 text-xs inline-flex">Browse verified batches</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(p => (
              <div key={p._id} className="flex items-center gap-4 p-3 glass rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-blue-900/40 border border-blue-700/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <ShoppingCart size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.batch?.cropName}</p>
                  <p className="text-xs text-white/30">{fmtDate(p.purchaseDate)} · {p.quantityPurchased} kg · {p.marketDestination}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <OrganicBadge score={p.batch?.organicScore} />
                  <TrustScore score={p.batch?.farmer?.trustScore ?? 0} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
