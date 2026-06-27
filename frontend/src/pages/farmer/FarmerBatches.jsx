import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/common/DashboardLayout'
import OrganicBadge from '../../components/common/OrganicBadge'
import { fmtDate } from '../../utils/formatDate'
import batchService from '../../services/batch.service'
import { Sprout, Plus, Search, Filter, ChevronRight, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_CFG = {
  pending:  { label: 'Pending',  cls: 'badge-yellow', icon: Clock },
  verified: { label: 'Verified', cls: 'badge-green',  icon: CheckCircle2 },
  rejected: { label: 'Rejected', cls: 'badge-red',    icon: XCircle },
}

export default function FarmerBatches() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')

  const load = () => {
    setLoading(true)
    batchService.myBatches()
      .then(r => setBatches(r.data.batches || []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this batch? This cannot be undone.')) return
    try {
      await batchService.delete(id)
      toast.success('Batch deleted')
      load()
    } catch {}
  }

  const filtered = batches.filter(b => {
    const matchSearch = !search || b.cropName.toLowerCase().includes(search.toLowerCase()) || b.batchId?.includes(search)
    const matchFilter = filter === 'all' || b.status === filter
    return matchSearch && matchFilter
  })

  return (
    <DashboardLayout
      title="My Crop Batches"
      actions={
        <Link to="/farmer/batches/add" className="btn-primary text-sm">
          <Plus size={15} /> New Batch
        </Link>
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="input pl-9"
            placeholder="Search by crop name or batch ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'verified', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize',
                filter === f ? 'bg-brand-600 text-white' : 'glass text-white/40 hover:text-white'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead>
            <tr>
              {['Crop', 'Batch ID', 'Harvest Date', 'Organic Score', 'Status', 'Actions'].map(h => (
                <th key={h} className="table-head">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }, (_, j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-5 rounded" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-white/30 text-sm">
                  {search || filter !== 'all' ? 'No batches match your filter' : 'No batches yet — add your first!'}
                </td>
              </tr>
            ) : (
              filtered.map(b => {
                const cfg  = STATUS_CFG[b.status] || STATUS_CFG.pending
                const Icon = cfg.icon
                return (
                  <tr key={b._id} className="table-row">
                    <td className="table-cell font-medium text-white">{b.cropName}</td>
                    <td className="table-cell font-mono text-xs text-brand-300">{b.batchId}</td>
                    <td className="table-cell text-white/50">{fmtDate(b.harvestDate)}</td>
                    <td className="table-cell"><OrganicBadge score={b.organicScore} showBar /></td>
                    <td className="table-cell">
                      <span className={cfg.cls}><Icon size={10} /> {cfg.label}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Link to={`/farmer/batches/${b._id}`} className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1">
                          View <ChevronRight size={12} />
                        </Link>
                        {b.status === 'pending' && (
                          <button onClick={() => handleDelete(b._id)} className="text-red-400/60 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
