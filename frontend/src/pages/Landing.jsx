import { Link } from 'react-router-dom'
import { Sprout, Shield, QrCode, BarChart3, ArrowRight, Leaf, Link2, Brain } from 'lucide-react'

const features = [
  { icon: Link2,    title: 'Blockchain Records',      desc: 'Every crop batch is immutably recorded on a distributed ledger — tamper-proof and transparent.' },
  { icon: QrCode,   title: 'QR Traceability',         desc: 'Consumers scan a QR code to trace the full journey from farm to fork in seconds.' },
  { icon: Shield,   title: 'Admin Verification',      desc: 'Proof documents are verified by admins before any batch goes live on the chain.' },
  { icon: Brain,    title: 'AI Organic Scoring',      desc: 'A Random Forest model predicts organic probability based on fertilizer, soil, and irrigation data.' },
  { icon: Leaf,     title: 'Trust Score System',      desc: 'Farmers build reputation through verified records and purchaser feedback.' },
  { icon: BarChart3,title: 'Analytics Dashboard',    desc: 'Regional insights, crop statistics, complaint monitoring, and blockchain activity logs.' },
]

const roles = [
  { role: 'farmer',    emoji: '👨‍🌾', label: 'Farmer',    desc: 'Register batches, upload proofs, generate QR codes' },
  { role: 'purchaser', emoji: '🛒', label: 'Purchaser',  desc: 'Browse verified batches, purchase, submit feedback' },
  { role: 'admin',     emoji: '🛠',  label: 'Admin',     desc: 'Verify documents, manage users, monitor the chain' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-farm-gradient bg-pattern">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-glow">
            <Sprout size={16} className="text-white" />
          </div>
          <span className="font-display font-semibold text-white">Farm to Plate</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/scan" className="btn-secondary text-xs">Scan QR</Link>
          <Link to="/login" className="btn-primary text-xs">Login</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-24 pb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-brand-700/30 text-brand-300 text-xs mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          Blockchain-Powered Agriculture Transparency
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          From Farm<br />
          <span className="text-brand-400">to Your Plate</span>
        </h1>
        <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10">
          A blockchain-secured platform that ensures every crop's origin, organic status,
          and supply chain journey is transparent, verifiable, and trustworthy.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register" className="btn-primary px-7 py-3 text-sm">
            Get Started <ArrowRight size={15} />
          </Link>
          <Link to="/scan" className="btn-secondary px-7 py-3 text-sm">
            <QrCode size={15} /> Scan a Product
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card group">
              <div className="w-10 h-10 rounded-xl bg-brand-900/40 border border-brand-700/30 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform">
                <Icon size={18} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5">{title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role portals */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="font-display text-2xl text-white text-center mb-8">Choose Your Role</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map(({ role, emoji, label, desc }) => (
            <Link
              key={role}
              to="/login"
              state={{ role }}
              className="glass-card text-center group hover:border-brand-500/30 transition-all"
            >
              <div className="text-4xl mb-3">{emoji}</div>
              <h3 className="text-sm font-semibold text-white mb-1">{label}</h3>
              <p className="text-xs text-white/40">{desc}</p>
              <div className="mt-4 flex items-center justify-center gap-1 text-brand-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Login as {label} <ArrowRight size={11} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center">
        <p className="text-xs text-white/20">Farm to Plate — Blockchain Agriculture Supply Chain © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
