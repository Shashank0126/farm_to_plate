import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import TrustScore from '../../components/common/TrustScore'
import api from '../../services/api'
import { fmtDate } from '../../utils/formatDate'
import toast from 'react-hot-toast'
import {
  Users, Search, Shield, ShieldOff, UserX,
  CheckCircle2, Sprout, ShoppingCart, ChevronDown
} from 'lucide-react'
import clsx from 'clsx'

export default function ManageUsers() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [role,    setRole]    = useState('farmer')
  const [search,  setSearch]  = useState('')
  const [acting,  setActing]  = useState(null)

  const load = () => {
    setLoading(true)
    api.get(`/admin/users?role=${role}`)
      .then(r => setUsers(r.data.users || []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [role])

  const suspend = async (id, current) => {
    setActing(id)
    try {
      await api.put(`/admin/users/${id}/suspend`, { suspended: !current })
      toast.success(current ? 'User unsuspended' : 'User suspended')
      load()
    } catch {
    } finally {
      setActing(null)
    }
  }

  const adjustTrust = async (id, delta) => {
    setActing(id)
    try {
      await api.put(`/admin/users/${id}/trust`, { delta })
      toast.success('Trust score updated')
      load()
    } catch {
    } finally {
      setActing(null)
    }
  }

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout title="Manage Users">
      {/* Role tabs */}
      <div className="flex gap-2">
        {[
          { value: 'farmer',    label: '👨‍🌾 Farmers',    icon: Sprout },
          { value: 'purchaser', label: '🛒 Purchasers', icon: ShoppingCart },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setRole(value)}
            className={clsx(
              'px-5 py-2 rounded-xl text-sm font-medium transition-all',
              role === value ? 'bg-brand-600 text-white' : 'glass text-white/40 hover:text-white'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          className="input pl-9"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead>
            <tr>
              {['User', 'Email', 'Phone', role === 'farmer' ? 'Trust Score' : 'Purchases', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} className="table-head">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }, (_, j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-5 rounded" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-white/30 text-sm">
                  No {role}s found
                </td>
              </tr>
            ) : (
              filtered.map(u => (
                <tr key={u._id} className="table-row">
                  {/* User */}
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-900/40 flex items-center justify-center text-xs text-brand-300 font-semibold flex-shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-white text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="table-cell text-white/50 text-xs">{u.email}</td>
                  <td className="table-cell text-white/40 text-xs">{u.phone || '—'}</td>
                  <td className="table-cell">
                    {role === 'farmer' ? (
                      <div className="flex items-center gap-2">
                        <TrustScore score={u.trustScore ?? 0} size="sm" />
                        <div className="flex gap-1">
                          <button onClick={() => adjustTrust(u._id, -0.5)} disabled={acting === u._id}
                            className="text-xs px-1.5 py-0.5 glass rounded text-red-400 hover:text-red-300">−</button>
                          <button onClick={() => adjustTrust(u._id, +0.5)} disabled={acting === u._id}
                            className="text-xs px-1.5 py-0.5 glass rounded text-brand-400 hover:text-brand-300">+</button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-white/60">{u.purchaseCount ?? 0}</span>
                    )}
                  </td>
                  <td className="table-cell text-white/40 text-xs">{fmtDate(u.createdAt)}</td>
                  <td className="table-cell">
                    {u.suspended ? (
                      <span className="badge-red">Suspended</span>
                    ) : (
                      <span className="badge-green"><CheckCircle2 size={10} /> Active</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => suspend(u._id, u.suspended)}
                      disabled={acting === u._id}
                      className={clsx(
                        'flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl transition-all',
                        u.suspended
                          ? 'bg-brand-900/40 text-brand-300 hover:bg-brand-800/40'
                          : 'bg-red-900/40 text-red-300 hover:bg-red-800/40'
                      )}
                    >
                      {u.suspended ? <><Shield size={12} /> Unsuspend</> : <><ShieldOff size={12} /> Suspend</>}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
