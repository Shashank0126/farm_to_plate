import clsx from 'clsx'
import { Cpu, Sparkles } from 'lucide-react'

export default function DualPredictionBadge({ mlPrediction, groqScore, className }) {
  return (
    <div className={clsx('flex flex-wrap items-center gap-1.5', className)}>
      {/* ML Model Prediction Badge */}
      {mlPrediction != null ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shadow-sm">
          <Cpu size={10} className="text-cyan-400" />
          <span>🌱 Farm Check: {mlPrediction}%</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-white/40 border border-white/10">
          <Cpu size={10} />
          <span>Farm Check: N/A</span>
        </span>
      )}

      {/* Groq AI Prediction Badge */}
      {groqScore != null ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-violet-950/60 text-violet-300 border border-violet-500/30 shadow-sm">
          <Sparkles size={10} className="text-violet-400" />
          <span>🤖 AI Farm Check: {groqScore}%</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-white/40 border border-white/10">
          <Sparkles size={10} />
          <span>AI Farm Check: N/A</span>
        </span>
      )}
    </div>
  )
}
