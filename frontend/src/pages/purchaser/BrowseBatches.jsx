import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/common/DashboardLayout'
import OrganicBadge from '../../components/common/OrganicBadge'
import TrustScore from '../../components/common/TrustScore'
import batchService from '../../services/batch.service'
import { fmtDate } from '../../utils/formatDate'
import { Search, Filter, Sprout, ChevronRight, MapPin, Droplets, Beaker } from 'lucide-react'
import clsx from 'clsx'

const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest'         },
  { value: 'organic', label: 'Highest Organic' },
  { value: 'trust',   label: 'Most Trusted'    },
]

export default function BrowseBatches() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [sort,    setSort]    = useState('newest')
  const [season,  setSeason]  = useState('')

  useEffect(() => {
    setLoading(true)
    batchService.getVerified({ sort, season })
      .then(r => setBatches(r.data.batches || []))
      .finally(() => setLoading(false))
  }, [sort, season])

  const filtered = batches.filter(b =>
    !search ||
    b.cropName.toLowerCase().includes(search.toLowerCase()) ||
    b.farmerName?.toLowerCase().includes(search.toLowerCase()) ||
    b.farmLocation?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout title="Browse Verified Batches">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input className="input pl-9" placeholder="Search crop, farmer, location…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={sort} onChange={e => setSort(e.target.value)}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input w-auto" value={season} onChange={e => setSeason(e.target.value)}>
          <option value="">All Seasons</option>
          {['Kharif','Rabi','Zaid','Annual'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Sprout size={36} className="mx-auto mb-2 opacity-20" />
          <p>No verified batches found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(b => (
            <div key={b._id} className="glass-card flex flex-col gap-3 animate-slide-up">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm">{b.cropName}</h3>
                  <p className="text-xs text-white/40 mt-0.5">{b.variety || b.season}</p>
                </div>
                <span className="badge-green text-[10px] flex-shrink-0">✓ Verified</span>
              </div>

              {/* Meta */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Sprout size={11} /> {b.farmerName}
                </div>
                {b.farmLocation && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <MapPin size={11} /> {b.farmLocation}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Beaker size={11} /> {b.fertilizerType} fertilizer
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Droplets size={11} /> {b.irrigationType} irrigation
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-2">
                <div className="glass rounded-xl p-2">
                  <p className="text-[10px] text-white/30">Organic</p>
                  <OrganicBadge score={b.organicScore} />
                </div>
                <div className="glass rounded-xl p-2">
                  <p className="text-[10px] text-white/30">Farmer Trust</p>
                  <TrustScore score={b.farmer?.trustScore ?? 0} size="sm" />
                </div>
              </div>

              {/* Harvest date */}
              <p className="text-[10px] text-white/25">Harvested: {fmtDate(b.harvestDate)}</p>

              {/* CTA */}
              <Link
                to={`/purchaser/purchase/${b._id}`}
                className="btn-primary w-full justify-center text-xs"
              >
                Purchase Batch <ChevronRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
