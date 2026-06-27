import { Link2, Copy, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function TxHashBadge({ hash, label = 'TX Hash' }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(hash)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!hash) return null

  const short = `${hash.slice(0, 10)}…${hash.slice(-8)}`

  return (
    <div className="flex items-center gap-2 px-3 py-2 glass rounded-xl border border-brand-700/20">
      <Link2 size={13} className="text-brand-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-mono text-brand-300 truncate">{short}</p>
      </div>
      <button onClick={copy} className="text-white/30 hover:text-white transition-colors">
        {copied ? <CheckCheck size={13} className="text-brand-400" /> : <Copy size={13} />}
      </button>
    </div>
  )
}
