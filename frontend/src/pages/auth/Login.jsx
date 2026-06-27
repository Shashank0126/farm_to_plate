import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, Sprout, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_DEFAULTS = {
  farmer:    { email: 'farmer@demo.com',    password: 'demo1234' },
  purchaser: { email: 'purchaser@demo.com', password: 'demo1234' },
  admin:     { email: 'admin@demo.com',     password: 'demo1234' },
}

export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const hintRole   = location.state?.role

  const [form,    setForm]    = useState({ email: '', password: '', role: hintRole || 'farmer' })
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const fillDemo = () => {
    const d = ROLE_DEFAULTS[form.role]
    if (d) setForm(f => ({ ...f, ...d }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate(`/${user.role}`, { replace: true })
    } catch (err) {
      // toast handled in api.js
    } finally {
      setLoading(false)
    }
  }

  const roles = [
    { value: 'farmer',    label: '👨‍🌾 Farmer'    },
    { value: 'purchaser', label: '🛒 Purchaser'  },
    { value: 'admin',     label: '🛠 Admin'      },
  ]

  return (
    <div className="min-h-screen bg-farm-gradient bg-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Sprout size={22} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-sm text-white/40 mt-1">Sign in to Farm to Plate</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6 space-y-4">
          {/* Role selector */}
          <div>
            <label className="label">Login as</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: value }))}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all border ${
                    form.role === value
                      ? 'bg-brand-900/40 border-brand-600/50 text-brand-300'
                      : 'glass border-white/10 text-white/40 hover:text-white/70'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="label">Email Address</label>
            <input
              name="email" type="email" required
              className="input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          {/* Password */}
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPw ? 'text' : 'password'}
                required
                className="input pr-10"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Demo fill */}
          <button
            type="button"
            onClick={fillDemo}
            className="text-xs text-brand-400/70 hover:text-brand-300 transition-colors"
          >
            Fill demo credentials for {form.role}
          </button>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <><LogIn size={15} /> Sign In</>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-white/30 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300">Register here</Link>
        </p>
        <p className="text-center mt-3">
          <Link to="/" className="text-xs text-white/20 hover:text-white/40">← Back to Home</Link>
        </p>
      </div>
    </div>
  )
}
