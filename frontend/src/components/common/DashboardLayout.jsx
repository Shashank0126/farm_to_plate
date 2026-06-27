import { useState } from 'react'
import Sidebar from './Sidebar'
import { Menu, Bell, X } from 'lucide-react'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import { fmtAgo } from '../../utils/formatDate'
import clsx from 'clsx'

export default function DashboardLayout({ children, title, actions }) {
  const [collapsed,      setCollapsed]      = useState(false)
  const [showNotifs,     setShowNotifs]     = useState(false)
  const { notifications, clearNotifications } = useSocket()
  const { user } = useAuth()

  return (
    <div className="flex h-screen bg-farm-gradient bg-pattern overflow-hidden">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-5 border-b border-white/5 bg-black/20 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(c => !c)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
            {title && (
              <h1 className="page-title text-lg">{title}</h1>
            )}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            {/* Notifications bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(v => !v)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl glass text-white/50 hover:text-white transition-colors"
              >
                <Bell size={17} />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {showNotifs && (
                <div className="absolute right-0 top-11 w-72 glass-strong rounded-2xl shadow-card border border-white/10 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Notifications</span>
                    <button onClick={clearNotifications} className="text-xs text-white/30 hover:text-white">Clear all</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-white/30 text-center py-6">No notifications</p>
                    ) : notifications.map((n, i) => (
                      <div key={i} className="px-4 py-3 border-b border-white/5 hover:bg-white/4">
                        <p className="text-xs text-white/70">{n.message}</p>
                        <p className="text-[10px] text-white/30 mt-1">{fmtAgo(n.time?.toISOString?.() || new Date().toISOString())}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-semibold text-white">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
