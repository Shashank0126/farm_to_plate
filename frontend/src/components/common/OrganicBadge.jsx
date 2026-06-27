import { organicLabel } from '../../utils/organicScore'
import clsx from 'clsx'

export default function OrganicBadge({ score, showBar = false }) {
  const { label, className } = organicLabel(score ?? 0)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className={clsx('text-sm font-semibold', className)}>
          {score ?? '—'}%
        </span>
        <span className={clsx('text-xs', className)}>{label}</span>
      </div>
      {showBar && (
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-700',
              score >= 70 ? 'bg-brand-500' :
              score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${score ?? 0}%` }}
          />
        </div>
      )}
    </div>
  )
}
