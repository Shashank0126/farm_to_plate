import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import DashboardLayout from '../../components/common/DashboardLayout'
import OrganicBadge from '../../components/common/OrganicBadge'
import TrustScore from '../../components/common/TrustScore'
import TxHashBadge from '../../components/blockchain/TxHashBadge'
import batchService from '../../services/batch.service'
import { fmtDate } from '../../utils/formatDate'
import toast from 'react-hot-toast'
import { ArrowLeft, ShoppingCart, Sprout, MapPin, Leaf, Truck } from 'lucide-react'

const STORAGE_CONDS = ['Refrigerated', 'Dry Storage', 'Controlled Atmosphere', 'Ambient', 'Cold Chain']

export default function PurchaseBatch() {
  const { id }         = useParams()
  const navigate       = useNavigate()
  const [batch, setBatch]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    purchaserName: '', purchaseDate: new Date().toISOString().split('T')[0],
    quantityPurchased: '', marketDestination: '', storageConditions: '',
    transportMode: '', notes: '',
  })

  useEffect(() => {
    batchService.getById(id)
      .then(r => setBatch(r.data.batch))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.purchaserName || !form.quantityPurchased || !form.marketDestination) {
      toast.error('Please fill all required fields')
      return
    }
    setSubmitting(true)
    try {
      await batchService.purchase(id, form)
      toast.success('Purchase recorded on blockchain!')
      navigate('/purchaser/history')
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <DashboardLayout title="Purchase Batch">
      <div className="skeleton h-96 rounded-2xl" />
    </DashboardLayout>
  )

  if (!batch) return (
    <DashboardLayout title="Purchase Batch">
      <div className="text-center py-16 text-white/30">Batch not found</div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Purchase Batch">
      <Link to="/purchaser/browse" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white mb-2">
        <ArrowLeft size={13} /> Back to Browse
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Batch summary — left */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge-green">✓ Verified</span>
              <span className="text-xs text-white/30">{batch.batchId}</span>
            </div>
            <h2 className="font-display text-xl text-white">{batch.cropName}</h2>
            <p className="text-xs text-white/40 mt-1">{batch.variety} · {batch.season}</p>

            <div className="mt-4 space-y-2 text-xs text-white/50">
              <div className="flex items-center gap-2"><Sprout size={12} /> {batch.farmerName}</div>
              <div className="flex items-center gap-2"><MapPin size={12} /> {batch.farmLocation || 'Location not specified'}</div>
              <div className="flex items-center gap-2"><Leaf size={12} /> {batch.fertilizerType} fertilizer</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] text-white/30">Organic Score</p>
                <OrganicBadge score={batch.organicScore} showBar />
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] text-white/30">Farmer Trust</p>
                <TrustScore score={batch.farmer?.trustScore ?? 0} size="sm" />
              </div>
            </div>

            <div className="mt-3">
              <TxHashBadge hash={batch.blockchainHash} label="Blockchain Hash" />
            </div>

            <div className="mt-3 text-xs text-white/30">
              Harvested: {fmtDate(batch.harvestDate)}
            </div>
          </div>
        </div>

        {/* Purchase form — right */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 glass-card space-y-4">
          <h3 className="text-sm font-semibold text-white">Purchase Details</h3>
          <p className="text-xs text-white/40">This transaction will be appended to the batch's blockchain history.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Your Name / Company *</label>
              <input name="purchaserName" required className="input" placeholder="Agro Traders Ltd." value={form.purchaserName} onChange={handleChange} />
            </div>

            <div>
              <label className="label">Purchase Date *</label>
              <input name="purchaseDate" type="date" required className="input" value={form.purchaseDate} onChange={handleChange} />
            </div>

            <div>
              <label className="label">Quantity Purchased (kg) *</label>
              <input name="quantityPurchased" type="number" min="1" required className="input" placeholder="500" value={form.quantityPurchased} onChange={handleChange} />
            </div>

            <div>
              <label className="label">Market Destination *</label>
              <input name="marketDestination" required className="input" placeholder="Mumbai APMC Market" value={form.marketDestination} onChange={handleChange} />
            </div>

            <div>
              <label className="label">Storage Conditions</label>
              <select name="storageConditions" className="input" value={form.storageConditions} onChange={handleChange}>
                <option value="">Select condition</option>
                {STORAGE_CONDS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Transport Mode</label>
              <input name="transportMode" className="input" placeholder="Truck / Rail / Air" value={form.transportMode} onChange={handleChange} />
            </div>

            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <textarea name="notes" rows={3} className="input resize-none" placeholder="Any additional notes about this purchase…" value={form.notes} onChange={handleChange} />
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3">
              {submitting
                ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                : <><ShoppingCart size={15} /> Record Purchase on Blockchain</>
              }
            </button>
            <p className="text-[10px] text-white/25 text-center mt-2">
              This transaction is permanent and immutable once recorded.
            </p>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
