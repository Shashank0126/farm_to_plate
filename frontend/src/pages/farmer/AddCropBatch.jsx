import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/common/DashboardLayout'
import OrganicBadge from '../../components/common/OrganicBadge'
import { calcOrganicScore } from '../../utils/organicScore'
import batchService from '../../services/batch.service'
import toast from 'react-hot-toast'
import {
  Sprout, MapPin, Beaker, Droplets, Calendar, Upload,
  X, Image, FileText, ChevronRight, ChevronLeft, Check, Info
} from 'lucide-react'
import clsx from 'clsx'

const STEPS = ['Farm Info', 'Crop Details', 'Fertilizer', 'Upload Proof', 'Review']

const SEASONS       = ['Kharif', 'Rabi', 'Zaid', 'Annual']
const SOIL_TYPES    = ['Clay', 'Sandy', 'Loamy', 'Silt', 'Peaty', 'Chalky', 'Black Cotton']
const SOIL_QUALITY  = ['Excellent', 'Good', 'Average', 'Poor']
const FERT_TYPES    = ['Organic', 'Inorganic', 'Mixed']
const FERT_NAMES    = ['Urea', 'DAP', 'NPK', 'Compost', 'Vermicompost', 'FYM', 'Neem Cake', 'Bio-fertilizer']
const IRRIG_TYPES   = ['Drip', 'Sprinkler', 'Canal', 'Rainfed', 'Borewell', 'Tank']

const EMPTY = {
  // Farm
  farmerName: '', farmLocation: '', latitude: '', longitude: '',
  soilType: '', soilQuality: '',
  // Crop
  cropName: '', season: '', harvestDate: '', variety: '', areaHectares: '',
  // Fertilizer
  fertilizerType: '', fertilizerName: '', fertilizerQty: '', irrigationType: '',
  // Notes
  notes: '',
}

export default function AddCropBatch() {
  const navigate       = useNavigate()
  const [step,   setStep]   = useState(0)
  const [form,   setForm]   = useState(EMPTY)
  const [files,  setFiles]  = useState({ cropImages: [], fertilizerBill: [], soilReport: [], farmPhotos: [] })
  const [loading, setLoading] = useState(false)

  const preview = calcOrganicScore({
    fertilizerType: form.fertilizerType,
    soilQuality:    form.soilQuality,
    season:         form.season,
    irrigationType: form.irrigationType,
    cropName:       form.cropName,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleChange = e => set(e.target.name, e.target.value)

  const handleFiles = (key, e) => {
    const added = Array.from(e.target.files)
    setFiles(f => ({ ...f, [key]: [...f[key], ...added].slice(0, 5) }))
  }
  const removeFile = (key, idx) => {
    setFiles(f => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }))
  }

  const geoLocate = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { set('latitude', coords.latitude.toFixed(6)); set('longitude', coords.longitude.toFixed(6)) },
      () => toast.error('Could not get location')
    )
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      Object.entries(files).forEach(([key, arr]) => arr.forEach(f => fd.append(key, f)))
      const { data } = await batchService.create(fd)
      toast.success('Batch created! Pending admin verification.')
      navigate(`/farmer/batches/${data.batch._id}`)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }

  // ── Step renderers ────────────────────────────────────────────────
  const steps = [
    // Step 0 — Farm Info
    <div key={0} className="space-y-4">
      <p className="text-xs text-white/40">Enter details about your farm location and soil.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">Farmer / Farm Name *</label>
          <input name="farmerName" className="input" placeholder="Ravi Kumar Farm" value={form.farmerName} onChange={handleChange} required />
        </div>
        <div className="md:col-span-2">
          <label className="label">Farm Location (Address)</label>
          <input name="farmLocation" className="input" placeholder="Village, District, State" value={form.farmLocation} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Latitude</label>
          <div className="flex gap-2">
            <input name="latitude" className="input" placeholder="17.3850" value={form.latitude} onChange={handleChange} />
            <button type="button" onClick={geoLocate} className="btn-secondary px-3 flex-shrink-0">
              <MapPin size={14} />
            </button>
          </div>
        </div>
        <div>
          <label className="label">Longitude</label>
          <input name="longitude" className="input" placeholder="78.4867" value={form.longitude} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Soil Type *</label>
          <select name="soilType" className="input" value={form.soilType} onChange={handleChange}>
            <option value="">Select soil type</option>
            {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Soil Quality *</label>
          <select name="soilQuality" className="input" value={form.soilQuality} onChange={handleChange}>
            <option value="">Select quality</option>
            {SOIL_QUALITY.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </div>,

    // Step 1 — Crop Details
    <div key={1} className="space-y-4">
      <p className="text-xs text-white/40">Enter details about the crop batch.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Crop Name *</label>
          <input name="cropName" className="input" placeholder="e.g. Wheat, Rice, Cotton" value={form.cropName} onChange={handleChange} required />
        </div>
        <div>
          <label className="label">Variety / Cultivar</label>
          <input name="variety" className="input" placeholder="e.g. HD-2967" value={form.variety} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Season *</label>
          <select name="season" className="input" value={form.season} onChange={handleChange}>
            <option value="">Select season</option>
            {SEASONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Harvest Date *</label>
          <input name="harvestDate" type="date" className="input" value={form.harvestDate} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Area (Hectares)</label>
          <input name="areaHectares" type="number" min="0" step="0.1" className="input" placeholder="2.5" value={form.areaHectares} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Irrigation Type *</label>
          <select name="irrigationType" className="input" value={form.irrigationType} onChange={handleChange}>
            <option value="">Select irrigation</option>
            {IRRIG_TYPES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </div>,

    // Step 2 — Fertilizer
    <div key={2} className="space-y-4">
      <div className="flex items-center gap-3 p-3 glass rounded-xl border border-brand-700/20">
        <Info size={14} className="text-brand-400 flex-shrink-0" />
        <p className="text-xs text-white/50">Fertilizer data drives the organic score prediction. Be accurate.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Fertilizer Type *</label>
          <select name="fertilizerType" className="input" value={form.fertilizerType} onChange={handleChange}>
            <option value="">Select type</option>
            {FERT_TYPES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Fertilizer Name</label>
          <select name="fertilizerName" className="input" value={form.fertilizerName} onChange={handleChange}>
            <option value="">Select fertilizer</option>
            {FERT_NAMES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Quantity Used (kg)</label>
          <input name="fertilizerQty" type="number" min="0" className="input" placeholder="50" value={form.fertilizerQty} onChange={handleChange} />
        </div>
      </div>

      {/* Live organic score preview */}
      {(form.fertilizerType || form.soilQuality) && (
        <div className="glass rounded-xl p-4 border border-white/10">
          <p className="text-xs text-white/40 mb-2">Live Organic Score Preview</p>
          <OrganicBadge score={preview} showBar />
        </div>
      )}

      <div>
        <label className="label">Additional Notes</label>
        <textarea name="notes" rows={3} className="input resize-none" placeholder="Any additional information about farming practices…" value={form.notes} onChange={handleChange} />
      </div>
    </div>,

    // Step 3 — Upload Proof
    <div key={3} className="space-y-4">
      <p className="text-xs text-white/40">Upload proof documents. Admin will verify these before approving your batch.</p>
      {[
        { key: 'cropImages',      label: 'Crop Images *',      icon: Image,     accept: 'image/*' },
        { key: 'fertilizerBill',  label: 'Fertilizer Bills',   icon: FileText,  accept: 'image/*,application/pdf' },
        { key: 'soilReport',      label: 'Soil Reports',       icon: FileText,  accept: 'image/*,application/pdf' },
        { key: 'farmPhotos',      label: 'Farm Photos',        icon: Image,     accept: 'image/*' },
      ].map(({ key, label, icon: Icon, accept }) => (
        <div key={key}>
          <label className="label">{label}</label>
          <div className="glass rounded-xl p-3 border border-dashed border-white/10 hover:border-brand-500/30 transition-colors">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-brand-900/30 flex items-center justify-center text-brand-400">
                <Upload size={16} />
              </div>
              <div>
                <p className="text-xs text-white/60">Click to upload (max 5 files)</p>
                <p className="text-[10px] text-white/30">{accept.replace(/\*/g, 'all')}</p>
              </div>
              <input type="file" multiple accept={accept} className="hidden" onChange={e => handleFiles(key, e)} />
            </label>
            {files[key].length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {files[key].map((f, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 glass rounded-lg text-[10px] text-white/60">
                    <Icon size={10} /> {f.name.slice(0, 20)}{f.name.length > 20 ? '…' : ''}
                    <button onClick={() => removeFile(key, i)} className="text-red-400 hover:text-red-300 ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>,

    // Step 4 — Review
    <div key={4} className="space-y-4">
      <p className="text-xs text-white/40">Review your batch details before submitting.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {Object.entries(form).filter(([,v]) => v).map(([k, v]) => (
          <div key={k} className="glass rounded-xl p-3">
            <p className="text-white/30 uppercase tracking-wider text-[10px]">{k.replace(/([A-Z])/g, ' $1')}</p>
            <p className="text-white/80 mt-0.5">{v}</p>
          </div>
        ))}
      </div>
      <div className="glass-card border border-brand-700/30">
        <p className="text-xs text-white/40 mb-1">Estimated Organic Score</p>
        <OrganicBadge score={preview} showBar />
      </div>
      <div className="glass rounded-xl p-4 border border-yellow-700/20 bg-yellow-900/10">
        <p className="text-xs text-yellow-300 font-medium">⚠ After submission</p>
        <p className="text-xs text-white/40 mt-1">Your batch will be in <strong className="text-white/60">Pending</strong> state until an admin verifies your proof documents. Only verified batches are added to the blockchain.</p>
      </div>
    </div>,
  ]

  const canNext = [
    form.farmerName && form.soilType && form.soilQuality,
    form.cropName && form.season && form.harvestDate && form.irrigationType,
    form.fertilizerType,
    files.cropImages.length > 0,
    true,
  ]

  return (
    <DashboardLayout title="Add Crop Batch">
      <div className="max-w-2xl mx-auto">
        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-all flex-shrink-0',
                  i < step  ? 'bg-brand-600 border-brand-600 text-white' :
                  i === step ? 'bg-brand-900/50 border-brand-500 text-brand-300' :
                              'glass border-white/10 text-white/30'
                )}
              >
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <div className="flex-1 mx-1 last:hidden">
                <div className={clsx('h-0.5 rounded-full', i < step ? 'bg-brand-600' : 'bg-white/10')} />
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card">
          <h3 className="font-semibold text-white mb-1">{STEPS[step]}</h3>
          <div className="h-px bg-white/5 mb-5" />
          {steps[step]}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
            <button
              disabled={step === 0}
              onClick={() => setStep(s => s - 1)}
              className={clsx('btn-secondary text-sm', step === 0 && 'opacity-30 pointer-events-none')}
            >
              <ChevronLeft size={15} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                disabled={!canNext[step]}
                onClick={() => setStep(s => s + 1)}
                className={clsx('btn-primary text-sm', !canNext[step] && 'opacity-40 pointer-events-none')}
              >
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary text-sm"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  : <><Sprout size={15} /> Submit Batch</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
