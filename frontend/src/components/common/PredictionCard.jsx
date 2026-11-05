import clsx from 'clsx'
import { Cpu, Sparkles, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function PredictionCard({
  mlPrediction,
  groqScore,
  groqConfidence,
  groqReasoning,
  organicScore,
  fraudRisk,
  title = "Organic Authenticity Predictions"
}) {
  const getConfidenceBadge = (conf) => {
    const c = (conf || '').toLowerCase()
    if (c === 'high') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">High Confidence</span>
    }
    if (c === 'medium') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Medium Confidence</span>
    }
    if (c === 'low') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">Low Confidence</span>
    }
    return null
  }

  return (
    <div className="glass-card p-5 border border-white/10 space-y-4">
      {title && (
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-brand-400" size={18} />
            <h4 className="text-sm font-semibold text-white">{title}</h4>
          </div>
          {organicScore != null && (
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <span>Rule Baseline:</span>
              <span className="font-semibold text-white/80">{organicScore}%</span>
            </div>
          )}
        </div>
      )}

      {/* Dual Prediction Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ML Model Prediction Card */}
        <div className="glass rounded-xl p-4 border border-cyan-500/20 bg-cyan-950/20 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
                <Cpu size={14} className="text-cyan-400" />
                <span>🌱 Farm Check</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Random Forest
              </span>
            </div>
            <p className="text-[11px] text-white/50 leading-tight">
              Microservice prediction model trained on agricultural field inputs.
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-bold text-white">
                {mlPrediction != null ? `${mlPrediction}%` : 'N/A'}
              </span>
              <span className="text-xs text-cyan-300 font-medium">
                {mlPrediction >= 70 ? 'High Organic' : mlPrediction >= 40 ? 'Moderate' : 'Low Organic'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-700',
                  (mlPrediction ?? 0) >= 70 ? 'bg-cyan-400' : (mlPrediction ?? 0) >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                )}
                style={{ width: `${mlPrediction ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Groq AI Prediction Card */}
        <div className="glass rounded-xl p-4 border border-violet-500/20 bg-violet-950/20 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-violet-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles size={14} className="text-violet-400" />
                <span>🤖 AI Farm Check</span>
              </div>
              {getConfidenceBadge(groqConfidence)}
            </div>
            <p className="text-[11px] text-white/50 leading-tight">
              Llama-3.3 LLM expert verification analysis of practices & soil.
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-bold text-white">
                {groqScore != null ? `${groqScore}%` : 'N/A'}
              </span>
              <span className="text-xs text-violet-300 font-medium">
                {groqScore >= 70 ? 'Authentic Organic' : groqScore >= 40 ? 'Partial Organic' : 'Non-Organic'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-700',
                  (groqScore ?? 0) >= 70 ? 'bg-violet-400' : (groqScore ?? 0) >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                )}
                style={{ width: `${groqScore ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Groq AI Detailed Reasoning */}
      {groqReasoning && (
        <div className="glass rounded-xl p-3.5 border border-violet-500/20 bg-violet-900/10">
          <div className="flex items-center gap-2 mb-1 text-violet-300 text-xs font-medium">
            <Sparkles size={12} />
            <span>🤖 AI Farm Check Reasoning</span>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            {groqReasoning}
          </p>
        </div>
      )}

      {/* Fraud Risk Indicator if available */}
      {fraudRisk != null && (
        <div className={clsx(
          'flex items-center justify-between p-3 rounded-xl border text-xs',
          fraudRisk > 40 ? 'bg-red-950/30 border-red-500/30 text-red-300' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
        )}>
          <div className="flex items-center gap-2">
            {fraudRisk > 40 ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
            <span>Fraud Risk Assessment (ML Service):</span>
          </div>
          <span className="font-bold">{fraudRisk}%</span>
        </div>
      )}
    </div>
  )
}
