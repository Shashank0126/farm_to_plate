import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import TrustScore from '../../components/common/TrustScore'
import batchService from '../../services/batch.service'
import { fmtDateTime } from '../../utils/formatDate'
import toast from 'react-hot-toast'
import { MessageSquareWarning, CheckCircle2, AlertTriangle, User, Sprout } from 'lucide-react'
import clsx from 'clsx'

const TYPE_LABELS = {
  quality_mismatch:   { label: 'Quality Mismatch',   cls: 'badge-yellow' },
  organic_inaccurate: { label: 'Organic Inaccurate',  cls: 'badge-red'    },
  damaged_produce:    { label: 'Damaged Produce',     cls: 'badge-red'    },
  fake_info:          { label: 'Fake Information',    cls: 'badge-red'    },
  other:              { label: 'Other',               cls: 'badge-gray'   },
}

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('open')
  const [acting,     setActing]     = useState(null)

  const load = () => {
    setLoading(true)
    batchService.getComplaints()
      .then(r => setComplaints(r.data.complaints || []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const resolve = async (id) => {
    setActing(id)
    try {
      await batchService.resolveComplaint(id)
      toast.success('Complaint resolved')
      load()
    } catch {
    } finally {
      setActing(null)
    }
  }

  const filtered = complaints.filter(c =>
    filter === 'all' ? true :
    filter === 'open' ? !c.resolved :
    c.resolved
  )

  return (
    <DashboardLayout title="Purchaser Complaints">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',    value: complaints.length,                     color: 'text-white' },
          { label: 'Open',     value: complaints.filter(c => !c.resolved).length, color: 'text-yellow-400' },
          { label: 'Resolved', value: complaints.filter(c => c.resolved).length,  color: 'text-brand-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card text-center py-4">
            <p className={clsx('text-2xl font-semibold font-display', color)}>{value}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['open', 'resolved', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all',
              filter === f ? 'bg-brand-600 text-white' : 'glass text-white/40 hover:text-white'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Complaints list */}
      <div className="space-y-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <MessageSquareWarning size={36} className="mx-auto mb-2 opacity-20" />
            <p>No {filter} complaints</p>
          </div>
        ) : (
          filtered.map(c => {
            const typeCfg = TYPE_LABELS[c.type] || TYPE_LABELS.other
            return (
              <div key={c._id} className={clsx(
                'glass-card border transition-all',
                c.resolved ? 'border-white/5 opacity-70' : 'border-yellow-700/20'
              )}>
                <div className="flex items-start gap-4">
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    c.resolved ? 'bg-white/5 text-white/30' : 'bg-yellow-900/30 text-yellow-400'
                  )}>
                    <MessageSquareWarning size={17} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={typeCfg.cls}>{typeCfg.label}</span>
                          {c.resolved && <span className="badge-green"><CheckCircle2 size={10} /> Resolved</span>}
                        </div>
                        <p className="text-xs text-white/40 mt-1">{fmtDateTime(c.createdAt)}</p>
                      </div>
                      {/* Rating */}
                      <div className="flex items-center gap-1 text-xs text-yellow-400">
                        {'★'.repeat(c.rating || 0)}{'☆'.repeat(5 - (c.rating || 0))}
                        <span className="text-white/30">{c.rating}/5</span>
                      </div>
                    </div>

                    {/* Purchaser & Batch info */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="glass rounded-xl p-2.5 flex items-center gap-2">
                        <User size={12} className="text-blue-400" />
                        <div>
                          <p className="text-[10px] text-white/30">Purchaser</p>
                          <p className="text-xs text-white/70">{c.purchaser?.name || c.purchaserName || '—'}</p>
                        </div>
                      </div>
                      <div className="glass rounded-xl p-2.5 flex items-center gap-2">
                        <Sprout size={12} className="text-brand-400" />
                        <div>
                          <p className="text-[10px] text-white/30">Farmer</p>
                          <p className="text-xs text-white/70">{c.batch?.farmerName || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Batch info */}
                    <div className="text-xs text-white/40">
                      Batch: <span className="text-white/60 font-mono">{c.batch?.batchId}</span>
                      {' · '}
                      <span className="text-white/60">{c.batch?.cropName}</span>
                    </div>

                    {/* Farmer trust score */}
                    {c.batch?.farmer && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30">Farmer trust:</span>
                        <TrustScore score={c.batch.farmer.trustScore ?? 0} size="sm" />
                        <AlertTriangle size={11} className="text-yellow-400" />
                        <span className="text-xs text-yellow-300">Score affected by this complaint</span>
                      </div>
                    )}

                    {/* Description */}
                    {c.description && (
                      <p className="text-xs text-white/50 italic">"{c.description}"</p>
                    )}

                    {/* Actions */}
                    {!c.resolved && (
                      <button
                        onClick={() => resolve(c._id)}
                        disabled={acting === c._id}
                        className="btn-secondary text-xs gap-1.5 mt-1"
                      >
                        {acting === c._id
                          ? <span className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin" />
                          : <><CheckCircle2 size={13} /> Mark Resolved</>
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </DashboardLayout>
  )
}
