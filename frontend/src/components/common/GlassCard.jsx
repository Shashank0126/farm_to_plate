import clsx from 'clsx'

export default function GlassCard({ children, className = '', hover = true, onClick }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'glass-card p-5',
        hover && 'cursor-default',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, sub, color = 'brand', trend }) {
  const colors = {
    brand:  'text-brand-400 bg-brand-900/30 border-brand-700/20',
    earth:  'text-earth-400 bg-earth-900/30 border-earth-700/20',
    blue:   'text-blue-400 bg-blue-900/30 border-blue-700/20',
    red:    'text-red-400 bg-red-900/30 border-red-700/20',
    yellow: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/20',
  }
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-start justify-between">
        <div className={clsx('w-10 h-10 rounded-xl border flex items-center justify-center', colors[color])}>
          {Icon && <Icon size={18} />}
        </div>
        {trend !== undefined && (
          <span className={clsx('text-xs font-medium', trend >= 0 ? 'text-brand-400' : 'text-red-400')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-semibold text-white font-display">{value}</p>
        <p className="text-xs text-white/50 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
