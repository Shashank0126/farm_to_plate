import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, Sprout, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '', role: 'farmer', phone: '' })
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 8)       { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const { confirm, ...payload } = form
      const user = await register(payload)
      toast.success(`Account created! Welcome, ${user.name}`)
      navigate(`/${user.role}`, { replace: true })
    } catch {
      // handled in api.js
    } finally {
      setLoading(false)
    }
  }

  const roles = [
    { value: 'farmer',    label: '👨‍🌾 Farmer',    desc: 'Register and manage crop batches'    },
    { value: 'purchaser', label: '🛒 Purchaser',  desc: 'Browse and purchase verified crops'  },
  ]

  return (
    <div className="min-h-screen bg-farm-gradient bg-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Sprout size={22} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Create Account</h1>
          <p className="text-sm text-white/40 mt-1">Join the blockchain supply chain</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6 space-y-4">
          {/* Role */}
          <div>
            <label className="label">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: value }))}
                  className={`p-3 rounded-xl text-left transition-all border ${
                    form.role === value
                      ? 'bg-brand-900/40 border-brand-600/50'
                      : 'glass border-white/10'
                  }`}
                >
                  <p className={`text-xs font-medium ${form.role === value ? 'text-brand-300' : 'text-white/60'}`}>{label}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label">Full Name</label>
            <input name="name" required className="input" placeholder="Ravi Kumar" value={form.name} onChange={handleChange} />
          </div>

          {/* Email */}
          <div>
            <label className="label">Email Address</label>
            <input name="email" type="email" required className="input" placeholder="you@example.com" value={form.email} onChange={handleChange} />
          </div>

          {/* Phone */}
          <div>
            <label className="label">Phone Number</label>
            <input name="phone" type="tel" className="input" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} />
          </div>

          {/* Password */}
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                name="password" type={showPw ? 'text' : 'password'} required
                className="input pr-10" placeholder="Min 8 characters"
                value={form.password} onChange={handleChange}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label className="label">Confirm Password</label>
            <input name="confirm" type="password" required className="input" placeholder="Repeat password" value={form.confirm} onChange={handleChange} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              : <><UserPlus size={15} /> Create Account</>
            }
          </button>
        </form>

        <p className="text-center text-xs text-white/30 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
