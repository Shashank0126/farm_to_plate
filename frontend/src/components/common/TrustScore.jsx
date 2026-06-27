import { Star } from 'lucide-react'
import { trustColor } from '../../utils/organicScore'
import clsx from 'clsx'

export default function TrustScore({ score = 0, reviews = 0, size = 'md' }) {
  const stars  = Math.round(score)
  const color  = trustColor(score)
  const sizes  = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }
  const starSz = { sm: 12, md: 14, lg: 18 }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={starSz[size]}
            className={i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
          />
        ))}
      </div>
      <span className={clsx('font-semibold', color, sizes[size])}>
        {score.toFixed(1)}
      </span>
      {reviews > 0 && (
        <span className="text-xs text-white/30">({reviews})</span>
      )}
    </div>
  )
}
