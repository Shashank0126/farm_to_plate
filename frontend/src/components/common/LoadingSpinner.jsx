import clsx from 'clsx'

export default function LoadingSpinner({ full = false, size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }

  const spinner = (
    <div className={clsx(
      'rounded-full border-2 border-white/10 border-t-brand-500 animate-spin',
      sizes[size], className
    )} />
  )

  if (full) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#071a0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-brand-500 animate-spin" />
        <p className="text-sm text-white/40 font-body">Loading…</p>
      </div>
    </div>
  )

  return spinner
}
