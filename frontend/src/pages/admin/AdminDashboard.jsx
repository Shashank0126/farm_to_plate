import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import { StatCard } from '../../components/common/GlassCard'
import TrustScore from '../../components/common/TrustScore'
import { fmtDate } from '../../utils/formatDate'
import api from '../../services/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts'
import {
  Package, Users, CheckCircle2, AlertTriangle,
  Sprout, Link2, TrendingUp, ShieldAlert,
  Activity, ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

const COLORS = ['#22c55e', '#d97316', '#3b82f6', '#a855f7', '#ef4444']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-xl px-3 py-2 border border-white/10 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="text-white font-medium">{p.value}</span></p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null)
  const [batches,  setBatches]  = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/batches?limit=6&sort=newest'),
    ]).then(([s, b]) => {
      setStats(s.data)
      setBatches(b.data.batches || [])
    }).finally(() => setLoading(false))
  }, [])

  const organicPie = [
    { name: 'High Organic (≥70%)',   value: stats?.highOrganic   ?? 0 },
    { name: 'Moderate (40–69%)',      value: stats?.midOrganic    ?? 0 },
    { name: 'Low Organic (<40%)',     value: stats?.lowOrganic    ?? 0 },
  ]

  const monthlyData = stats?.monthlyBatches ?? []

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package}      label="Total Batches"      value={stats?.totalBatches   ?? '—'} color="brand"  />
        <StatCard icon={CheckCircle2} label="Verified"           value={stats?.verified       ?? '—'} color="brand"  trend={stats?.verifiedTrend} />
        <StatCard icon={Users}        label="Registered Users"   value={stats?.totalUsers     ?? '—'} color="blue"   />
        <StatCard icon={AlertTriangle}label="Open Complaints"    value={stats?.openComplaints ?? '—'} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly batch trend */}
        <div className="lg:col-span-2 glass-card">
          <h3 className="text-sm font-semibold text-white mb-4">Monthly Batch Activity</h3>
          {monthlyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-white/20 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total"    stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} name="Total" />
                <Line type="monotone" dataKey="verified" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} name="Verified" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Organic distribution pie */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-white mb-4">Organic Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={organicPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {organicPie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Regional bar chart */}
        <div className="lg:col-span-2 glass-card">
          <h3 className="text-sm font-semibold text-white mb-4">Batches by Region</h3>
          {!stats?.regionalData?.length ? (
            <div className="h-48 flex items-center justify-center text-white/20 text-sm">No regional data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.regionalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Batches" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Most trusted farmers */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Top Farmers</h3>
            <Link to="/admin/users" className="text-xs text-brand-400 flex items-center gap-1">
              All <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {(stats?.topFarmers ?? []).length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">No data</p>
            ) : (
              stats.topFarmers.slice(0, 5).map((f, i) => (
                <div key={f._id} className="flex items-center gap-3">
                  <span className="text-xs text-white/30 w-4">{i + 1}</span>
                  <div className="w-7 h-7 rounded-lg bg-brand-900/40 flex items-center justify-center text-xs text-brand-300 font-semibold">
                    {f.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{f.name}</p>
                    <p className="text-[10px] text-white/30">{f.verifiedBatches} batches</p>
                  </div>
                  <TrustScore score={f.trustScore ?? 0} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent batches quick view */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Recent Batches</h3>
          <Link to="/admin/verify" className="text-xs text-brand-400 flex items-center gap-1">
            Verify Queue <ChevronRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Batch ID', 'Crop', 'Farmer', 'Organic%', 'Status', 'Date'].map(h => (
                  <th key={h} className="table-head">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b._id} className="table-row">
                  <td className="table-cell font-mono text-xs text-brand-300">{b.batchId}</td>
                  <td className="table-cell text-white">{b.cropName}</td>
                  <td className="table-cell text-white/60">{b.farmerName}</td>
                  <td className="table-cell">
                    <span className={b.organicScore >= 70 ? 'text-brand-400' : b.organicScore >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                      {b.organicScore}%
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={b.status === 'verified' ? 'badge-green' : b.status === 'rejected' ? 'badge-red' : 'badge-yellow'}>
                      {b.status}
                    </span>
                  </td>
                  <td className="table-cell text-white/40">{fmtDate(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blockchain activity */}
      <div className="glass-card border border-brand-700/20">
        <div className="flex items-center gap-3 mb-3">
          <Link2 size={16} className="text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Blockchain Health</h3>
          <span className="badge-green ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Valid Chain
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-lg font-semibold text-white">{stats?.chainLength ?? '—'}</p>
            <p className="text-[10px] text-white/40">Total Blocks</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-lg font-semibold text-white">{stats?.transactions ?? '—'}</p>
            <p className="text-[10px] text-white/40">Transactions</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-lg font-semibold text-white">{stats?.lastBlockTime ?? '—'}</p>
            <p className="text-[10px] text-white/40">Last Block</p>
          </div>
        </div>
        <div className="mt-3 text-right">
          <Link to="/admin/blockchain" className="text-xs text-brand-400 hover:text-brand-300 flex items-center justify-end gap-1">
            View full chain <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
