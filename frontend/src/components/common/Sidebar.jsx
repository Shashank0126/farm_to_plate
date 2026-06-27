import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import clsx from 'clsx'
import {
  LayoutDashboard, Sprout, ShoppingCart, Users, Shield,
  QrCode, BarChart3, FileCheck, MessageSquareWarning,
  Link2, LogOut, Bell, Wifi, WifiOff, ChevronRight,
  Package, ClipboardList, Eye,
} from 'lucide-react'

const roleNavs = {
  farmer: [
    { to: '/farmer',          icon: LayoutDashboard, label: 'Dashboard'    },
    { to: '/farmer/batches',  icon: Sprout,          label: 'My Batches'   },
    { to: '/farmer/batches/add', icon: Package,      label: 'Add Batch'    },
  ],
  purchaser: [
    { to: '/purchaser',         icon: LayoutDashboard, label: 'Dashboard'       },
    { to: '/purchaser/browse',  icon: Eye,             label: 'Browse Batches'  },
    { to: '/purchaser/history', icon: ClipboardList,   label: 'Purchase History'},
  ],
  admin: [
    { to: '/admin',             icon: LayoutDashboard,         label: 'Dashboard'       },
    { to: '/admin/verify',      icon: FileCheck,               label: 'Verify Batches'  },
    { to: '/admin/users',       icon: Users,                   label: 'Manage Users'    },
    { to: '/admin/complaints',  icon: MessageSquareWarning,    label: 'Complaints'      },
    { to: '/admin/blockchain',  icon: Link2,                   label: 'Blockchain Logs' },
  ],
}

export default function Sidebar({ collapsed = false }) {
  const { user, logout } = useAuth()
  const { connected, notifications } = useSocket()
  const navigate = useNavigate()
  const navItems = roleNavs[user?.role] || []
  const unread   = notifications.length

  const roleColors = {
    farmer:    'bg-brand-900/40 text-brand-300 border-brand-700/30',
    purchaser: 'bg-blue-900/40 text-blue-300 border-blue-700/30',
    admin:     'bg-purple-900/40 text-purple-300 border-purple-700/30',
  }

  return (
    <aside className={clsx(
      'h-full flex flex-col glass border-r border-white/5 transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-glow">
            <Sprout size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-white font-display">Farm to Plate</p>
              <p className="text-xs text-white/30">Blockchain Supply Chain</p>
            </div>
          )}
        </div>
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium', roleColors[user.role])}>
            <Shield size={12} />
            <span className="capitalize">{user.role}</span>
            <div className="ml-auto flex items-center gap-1">
              {connected
                ? <Wifi size={10} className="text-brand-400" />
                : <WifiOff size={10} className="text-red-400" />
              }
            </div>
          </div>
          <p className="text-sm font-medium text-white mt-2 truncate">{user.name}</p>
          <p className="text-xs text-white/30 truncate">{user.email}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length === 2}
            className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
          >
            <Icon size={17} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
            {!collapsed && <ChevronRight size={13} className="ml-auto opacity-30" />}
          </NavLink>
        ))}

        {/* QR Scanner (all roles) */}
        <NavLink to="/scan" className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}>
          <QrCode size={17} className="flex-shrink-0" />
          {!collapsed && <span>Scan QR</span>}
        </NavLink>
      </nav>

      {/* Notifications */}
      {!collapsed && unread > 0 && (
        <div className="px-4 py-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Bell size={13} />
            <span>{unread} notification{unread > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="px-2 py-3 border-t border-white/5">
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut size={17} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
