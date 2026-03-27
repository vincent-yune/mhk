import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuthStore } from '../store/useStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleLogin = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email: form.email, password: form.password })
      login(data.data.user, data.data.accessToken)
      toast.success(`환영합니다, ${data.data.user.name}님!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || '로그인에 실패했습니다.')
    } finally { setLoading(false) }
  }

  const handleSignup = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/signup', form)
      login(data.data.user, data.data.accessToken)
      toast.success('회원가입이 완료되었습니다!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || '회원가입에 실패했습니다.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-circle">🏠</div>
          <h1>MyHouse</h1>
          <p>집의 모든 것을 한눈에 관리</p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 28,
          background: 'var(--surface-container-low)',
          borderRadius: 14, padding: 4
        }}>
          {['login', 'signup'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '9px', border: 'none', borderRadius: 10, cursor: 'pointer',
              background: tab === t ? 'var(--surface-container-lowest)' : 'transparent',
              fontWeight: 700, fontSize: 14, fontFamily: 'Manrope, sans-serif',
              color: tab === t ? 'var(--primary)' : 'var(--on-surface-variant)',
              boxShadow: tab === t ? 'var(--shadow-ambient)' : 'none',
              transition: 'all 0.2s'
            }}>
              {t === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">이메일</label>
              <input name="email" type="email" className="form-input"
                placeholder="example@myhouse.com"
                value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input name="password" type="password" className="form-input"
                placeholder="••••••••"
                value={form.password} onChange={handleChange} required />
            </div>
            <div style={{ height: 8 }} />
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? '로그인 중...' : '🔑 로그인'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 20 }}>
              테스트 계정: demo@myhouse.com / demo1234
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label">이름</label>
              <input name="name" type="text" className="form-input" placeholder="홍길동"
                value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">이메일</label>
              <input name="email" type="email" className="form-input" placeholder="example@myhouse.com"
                value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input name="password" type="password" className="form-input" placeholder="6자 이상"
                value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">전화번호 (선택)</label>
              <input name="phone" type="tel" className="form-input" placeholder="010-0000-0000"
                value={form.phone} onChange={handleChange} />
            </div>
            <div style={{ height: 8 }} />
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? '가입 중...' : '🏠 회원가입'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
