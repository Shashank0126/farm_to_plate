import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import OrganicBadge from '../../components/common/OrganicBadge'
import batchService from '../../services/batch.service'
import { fmtDate } from '../../utils/formatDate'
import toast from 'react-hot-toast'
import { ShoppingCart, MessageSquare, X, Send, AlertTriangle, CheckCircle } from 'lucide-react'
import clsx from 'clsx'

const FEEDBACK_TYPES = [
  { value: 'quality_mismatch',   label: 'Crop Quality Mismatch'  },
  { value: 'organic_inaccurate', label: 'Organic Claim Inaccurate'},
  { value: 'damaged_produce',    label: 'Damaged Produce'         },
  { value: 'fake_info',          label: 'Fake Information'        },
  { value: 'other',              label: 'Other'                   },
]

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [feedbackModal, setFeedbackModal] = useState(null) // purchase object
  const [fbForm, setFbForm] = useState({ type: '', description: '', rating: 5 })
  const [fbLoading, setFbLoading] = useState(false)

  useEffect(() => {
    batchService.myPurchases()
      .then(r => setPurchases(r.data.purchases || []))
      .finally(() => setLoading(false))
  }, [])

  const openFeedback = (p) => {
    setFeedbackModal(p)
    setFbForm({ type: '', description: '', rating: 5 })
  }

  const submitFeedback = async () => {
    if (!fbForm.type) { toast.error('Select a feedback type'); return }
    setFbLoading(true)
    try {
      await batchService.submitFeedback(feedbackModal.batch._id, fbForm)
      toast.success('Feedback submitted. Thank you!')
      setFeedbackModal(null)
      setPurchases(ps => ps.map(p =>
        p._id === feedbackModal._id ? { ...p, feedbackSubmitted: true } : p
      ))
    } catch {
    } finally {
      setFbLoading(false)
    }
  }

  return (
    <DashboardLayout title="Purchase History">
      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <ShoppingCart size={36} className="mx-auto mb-2 opacity-20" />
          <p>No purchases yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map(p => (
            <div key={p._id} className="glass-card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-900/40 border border-blue-700/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <ShoppingCart size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white text-sm">{p.batch?.cropName}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {p.quantityPurchased} kg · {p.marketDestination} · {fmtDate(p.purchaseDate)}
                      </p>
                      <p className="text-xs text-white/30 font-mono mt-0.5">{p.batch?.batchId}</p>
                    </div>
                    <OrganicBadge score={p.batch?.organicScore} />
                  </div>

                  {p.storageConditions && (
                    <p className="text-xs text-white/30 mt-1">Storage: {p.storageConditions}</p>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    {p.feedbackSubmitted ? (
                      <span className="flex items-center gap-1 text-xs text-brand-400">
                        <CheckCircle size={12} /> Feedback submitted
                      </span>
                    ) : (
                      <button
                        onClick={() => openFeedback(p)}
                        className="btn-secondary text-xs gap-1.5"
                      >
                        <MessageSquare size={13} /> Submit Feedback
                      </button>
                    )}
                    <span className="text-xs text-white/20 font-mono">{p.blockchainHash?.slice(0,16)}…</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm">Submit Feedback</h3>
              <button onClick={() => setFeedbackModal(null)} className="text-white/30 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-white/40 mb-4">
              Batch: <span className="text-white/70">{feedbackModal.batch?.cropName}</span> · {feedbackModal.batch?.batchId}
            </p>

            <div className="space-y-4">
              <div>
                <label className="label">Issue Type *</label>
                <select className="input" value={fbForm.type} onChange={e => setFbForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="">Select issue type</option>
                  {FEEDBACK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Rating (1–5)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFbForm(f => ({ ...f, rating: n }))}
                      className={clsx(
                        'w-9 h-9 rounded-xl text-sm font-semibold border transition-all',
                        fbForm.rating >= n
                          ? 'bg-yellow-900/40 border-yellow-600/50 text-yellow-300'
                          : 'glass border-white/10 text-white/30'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  className="input resize-none"
                  placeholder="Describe the issue in detail…"
                  value={fbForm.description}
                  onChange={e => setFbForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2 p-3 glass rounded-xl border border-yellow-700/20 bg-yellow-900/10">
                <AlertTriangle size={13} className="text-yellow-400 flex-shrink-0" />
                <p className="text-xs text-white/40">Repeated complaints will reduce the farmer's trust score and trigger admin review.</p>
              </div>

              <button onClick={submitFeedback} disabled={fbLoading} className="btn-primary w-full justify-center">
                {fbLoading
                  ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  : <><Send size={14} /> Submit Feedback</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
