import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import blockchainService from '../../services/blockchain.service'
import { fmtDateTime } from '../../utils/formatDate'
import { Link2, ChevronDown, ChevronRight, CheckCircle2, RefreshCw, Copy, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

function HashBox({ label, value }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="glass rounded-xl p-2.5">
      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-xs font-mono text-brand-300 truncate flex-1">{value}</p>
        <button onClick={copy} className="text-white/30 hover:text-white transition-colors flex-shrink-0">
          {copied ? <CheckCheck size={12} className="text-brand-400" /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  )
}

function BlockCard({ block, index }) {
  const [open, setOpen] = useState(index === 0)

  return (
    <div className={clsx(
      'glass-card border transition-all',
      index === 0 ? 'border-brand-700/30' : 'border-white/5'
    )}>
      {/* Block header */}
      <button
        className="w-full flex items-center gap-3 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
          index === 0 ? 'bg-brand-700 text-white' : 'bg-white/10 text-white/60'
        )}>
          #{block.index}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            {block.index === 0 ? '⛓ Genesis Block' : `Block #${block.index}`}
          </p>
          <p className="text-xs text-white/30 font-mono truncate">{block.hash}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-white/30">{fmtDateTime(block.timestamp)}</p>
          {open ? <ChevronDown size={15} className="text-white/30" /> : <ChevronRight size={15} className="text-white/30" />}
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <HashBox label="Current Hash"  value={block.hash} />
            <HashBox label="Previous Hash" value={block.previousHash} />
          </div>

          {/* Block data */}
          {block.data && typeof block.data === 'object' && (
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Block Data</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {Object.entries(block.data).filter(([,v]) => v).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-white/30">{k}: </span>
                    <span className="text-white/70">{String(v).slice(0, 40)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-white/30">
            <span>Nonce: <span className="text-white/50 font-mono">{block.nonce ?? '—'}</span></span>
            <span>Transactions: <span className="text-white/50">{block.transactions ?? 1}</span></span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BlockchainLogs() {
  const [chain,    setChain]    = useState([])
  const [valid,    setValid]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [refresh,  setRefresh]  = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      blockchainService.getChain(),
      blockchainService.validate(),
    ]).then(([c, v]) => {
      setChain(c.data.chain || [])
      setValid(v.data.valid)
    }).finally(() => setLoading(false))
  }, [refresh])

  return (
    <DashboardLayout title="Blockchain Logs">
      {/* Header stats */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="glass-card flex items-center gap-3 flex-1 min-w-0 p-4">
          <Link2 size={18} className="text-brand-400" />
          <div>
            <p className="text-lg font-semibold text-white">{chain.length}</p>
            <p className="text-xs text-white/40">Total Blocks</p>
          </div>
        </div>
        <div className={clsx(
          'glass-card flex items-center gap-3 flex-1 min-w-0 p-4 border',
          valid === true ? 'border-brand-700/30' : valid === false ? 'border-red-700/30' : 'border-white/5'
        )}>
          <CheckCircle2 size={18} className={valid === true ? 'text-brand-400' : valid === false ? 'text-red-400' : 'text-white/30'} />
          <div>
            <p className="text-lg font-semibold text-white">
              {valid === null ? '—' : valid ? 'Valid' : 'Invalid!'}
            </p>
            <p className="text-xs text-white/40">Chain Integrity</p>
          </div>
        </div>
        <button
          onClick={() => setRefresh(r => r + 1)}
          disabled={loading}
          className="btn-secondary p-3"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Chain */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : chain.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Link2 size={36} className="mx-auto mb-2 opacity-20" />
          <p>No blocks yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...chain].reverse().map((block, i) => (
            <div key={block.hash || i} className="relative">
              {i < chain.length - 1 && (
                <div className="absolute left-[17px] top-[52px] w-0.5 h-4 bg-brand-700/30 z-10" />
              )}
              <BlockCard block={block} index={i} />
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
