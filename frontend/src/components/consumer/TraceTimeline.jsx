import { Sprout, ShoppingCart, CheckCircle2, Clock, XCircle, Truck } from 'lucide-react'
import { fmtDate } from '../../utils/formatDate'
import clsx from 'clsx'

const stepConfig = {
  created:   { icon: Sprout,        label: 'Batch Created',      color: 'text-brand-400',  line: 'bg-brand-700/40'  },
  pending:   { icon: Clock,         label: 'Pending Verification', color: 'text-yellow-400', line: 'bg-yellow-700/40'},
  verified:  { icon: CheckCircle2,  label: 'Admin Verified',     color: 'text-brand-400',  line: 'bg-brand-700/40'  },
  rejected:  { icon: XCircle,       label: 'Rejected',           color: 'text-red-400',    line: 'bg-red-700/40'    },
  purchased: { icon: ShoppingCart,  label: 'Purchased',          color: 'text-blue-400',   line: 'bg-blue-700/40'   },
  shipped:   { icon: Truck,         label: 'Shipped',            color: 'text-purple-400', line: 'bg-purple-700/40' },
}

export default function TraceTimeline({ events = [] }) {
  return (
    <div className="relative space-y-0">
      {events.map((evt, i) => {
        const cfg  = stepConfig[evt.type] || stepConfig.created
        const Icon = cfg.icon
        const last = i === events.length - 1

        return (
          <div key={i} className="flex gap-4">
            {/* Icon column */}
            <div className="flex flex-col items-center">
              <div className={clsx(
                'w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center flex-shrink-0',
                cfg.color
              )}>
                <Icon size={16} />
              </div>
              {!last && <div className={clsx('w-0.5 flex-1 mt-1 mb-1 min-h-[28px]', cfg.line)} />}
            </div>

            {/* Content */}
            <div className={clsx('pb-6 flex-1', last && 'pb-0')}>
              <div className="glass-card p-3 animate-slide-up">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={clsx('text-sm font-medium', cfg.color)}>{cfg.label}</p>
                    {evt.description && (
                      <p className="text-xs text-white/50 mt-0.5">{evt.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-white/30 flex-shrink-0 mt-0.5">{fmtDate(evt.date)}</span>
                </div>

                {/* Extra metadata */}
                {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(evt.metadata).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-[10px] text-white/30 uppercase tracking-wider">{k}: </span>
                        <span className="text-[10px] text-white/60">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
