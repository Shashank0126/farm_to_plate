import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import OrganicBadge from '../../components/common/OrganicBadge'
import TxHashBadge from '../../components/blockchain/TxHashBadge'
import batchService from '../../services/batch.service'
import { fmtDate, fmtDateTime } from '../../utils/formatDate'
import toast from 'react-hot-toast'
import {
  CheckCircle2, XCircle, Eye, X, FileText, Image,
  MapPin, Beaker, Droplets, Sprout, Clock, ChevronDown
} from 'lucide-react'
import clsx from 'clsx'

export default function VerifyBatches() {
  const [batches,  setBatches]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)   // batch being reviewed
  const [note,     setNote]     = useState('')
  const [acting,   setActing]   = useState(false)
  const [filter,   setFilter]   = useState('pending')

  const load = () => {
    setLoading(true)
    batchService.getAll({ status: filter, sort: 'oldest' })
      .then(r => setBatches(r.data.batches || []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filter])

  const act = async (action) => {
    if (!selected) return
    setActing(true)
    try {
      if (action === 'verify') {
        await batchService.verify(selected._id, { note })
        toast.success('Batch verified and added to blockchain!')
      } else {
        if (!note.trim()) { toast.error('Provide a rejection reason'); setActing(false); return }
        await batchService.reject(selected._id, { note })
        toast.success('Batch rejected.')
      }
      setSelected(null)
      setNote('')
      load()
    } catch {
    } finally {
      setActing(false)
    }
  }

  return (
    <DashboardLayout title="Verify Batches">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {['pending', 'verified', 'rejected', 'all'].map(f => (
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

      {/* Batch list */}
      <div className="space-y-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)
        ) : batches.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <CheckCircle2 size={36} className="mx-auto mb-2 opacity-20" />
            <p>No {filter} batches</p>
          </div>
        ) : batches.map(b => (
          <div key={b._id} className="glass-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-900/40 border border-brand-700/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                <Sprout size={17} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium text-white text-sm">{b.cropName}
                      <span className="text-white/30 text-xs font-normal ml-2">{b.variety}</span>
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {b.farmerName} · {b.farmLocation} · {fmtDate(b.harvestDate)}
                    </p>
                    <p className="text-xs font-mono text-brand-300 mt-0.5">{b.batchId}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <OrganicBadge score={b.organicScore} />
                    <span className={b.status === 'verified' ? 'badge-green' : b.status === 'rejected' ? 'badge-red' : 'badge-yellow'}>
                      {b.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-2 text-xs text-white/30">
                  <span className="flex items-center gap-1"><Beaker size={10} /> {b.fertilizerType}</span>
                  <span className="flex items-center gap-1"><Droplets size={10} /> {b.irrigationType}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {fmtDateTime(b.createdAt)}</span>
                  {b.proofImages?.length > 0 && (
                    <span className="flex items-center gap-1"><Image size={10} /> {b.proofImages.length} proofs</span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <button onClick={() => { setSelected(b); setNote('') }} className="btn-secondary text-xs gap-1.5">
                    <Eye size={13} /> Review Details
                  </button>
                  {b.status === 'pending' && (
                    <>
                      <button onClick={() => { setSelected(b); setNote(''); setTimeout(() => act('verify'), 0) }}
                        disabled={acting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-brand-600/80 hover:bg-brand-500 text-white transition-all">
                        <CheckCircle2 size={13} /> Quick Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-strong rounded-2xl w-full max-w-2xl border border-white/10 my-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <h3 className="font-semibold text-white">{selected.cropName}</h3>
                <p className="text-xs text-white/40 font-mono">{selected.batchId}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {[
                  ['Farmer',          selected.farmerName],
                  ['Location',        selected.farmLocation],
                  ['Soil Type',       selected.soilType],
                  ['Soil Quality',    selected.soilQuality],
                  ['Season',          selected.season],
                  ['Harvest Date',    fmtDate(selected.harvestDate)],
                  ['Fertilizer Type', selected.fertilizerType],
                  ['Fertilizer Name', selected.fertilizerName],
                  ['Qty (kg)',        selected.fertilizerQty],
                  ['Irrigation',      selected.irrigationType],
                  ['Area (ha)',       selected.areaHectares],
                  ['Variety',         selected.variety],
                ].map(([k, v]) => v ? (
                  <div key={k} className="glass rounded-xl p-2.5">
                    <p className="text-[10px] text-white/30">{k}</p>
                    <p className="text-white/70 mt-0.5 capitalize">{v}</p>
                  </div>
                ) : null)}
              </div>

              {/* Organic score */}
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-white/40 mb-2">Organic Score</p>
                <OrganicBadge score={selected.organicScore} showBar />
              </div>

              {/* Proof images */}
              {selected.proofImages?.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 mb-2">Proof Documents</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.proofImages.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer"
                        className="aspect-square rounded-xl overflow-hidden glass border border-white/10 hover:border-brand-500/40 transition-all">
                        <img src={url} alt={`proof-${i}`} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selected.notes && (
                <div className="glass rounded-xl p-3">
                  <p className="text-xs text-white/40 mb-1">Farmer Notes</p>
                  <p className="text-xs text-white/60">{selected.notes}</p>
                </div>
              )}

              {/* Admin note */}
              {selected.status === 'pending' && (
                <div>
                  <label className="label">Admin Note (required for rejection)</label>
                  <textarea
                    rows={3}
                    className="input resize-none"
                    placeholder="e.g. Proof documents are unclear, please resubmit…"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Modal footer */}
            {selected.status === 'pending' && (
              <div className="px-6 py-4 border-t border-white/5 flex gap-3">
                <button
                  onClick={() => act('reject')}
                  disabled={acting}
                  className="btn-danger flex-1 justify-center"
                >
                  <XCircle size={15} /> Reject
                </button>
                <button
                  onClick={() => act('verify')}
                  disabled={acting}
                  className="btn-primary flex-1 justify-center"
                >
                  {acting
                    ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    : <><CheckCircle2 size={15} /> Verify &amp; Add to Chain</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
