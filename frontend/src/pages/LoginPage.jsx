import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuthStore } from '../store/useStore'
import toast from 'react-hot-toast'

// ── 아이콘 컴포넌트 ────────────────────────────────────────────────────────────
function MSI({ name, fill = false, size = 24, color, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{
      fontSize: size,
      fontVariationSettings: fill
        ? `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`
        : `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      color: color || 'inherit', lineHeight: 1,
      display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', ...style,
    }}>{name}</span>
  )
}

// ── 이메일 찾기 모달 ───────────────────────────────────────────────────────────
function FindEmailModal({ onClose }) {
  const [form, setForm] = useState({ name: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/find-email', form)
      setResult(data.data.email)
    } catch (err) {
      toast.error(err.response?.data?.message || '일치하는 계정을 찾을 수 없습니다.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: '24px 24px 0 0',
        padding: '8px 24px 40px', width: '100%', maxWidth: 480,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--outline-variant)', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MSI name="search" size={20} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 17 }}>이메일 찾기</div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>가입 시 등록한 이름과 전화번호를 입력하세요</div>
          </div>
        </div>

        {result ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MSI name="mark_email_read" fill size={28} color="var(--secondary)" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 8 }}>찾은 이메일</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--primary)', marginBottom: 24 }}>{result}</div>
            <button onClick={onClose} className="btn btn-primary btn-block">확인</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">이름</label>
              <input className="form-input" placeholder="홍길동"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">전화번호</label>
              <input className="form-input" placeholder="010-0000-0000"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div style={{ height: 8 }} />
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? '조회 중...' : '이메일 찾기'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── 비밀번호 찾기 모달 ─────────────────────────────────────────────────────────
function FindPasswordModal({ onClose }) {
  const [form, setForm] = useState({ email: '', name: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/reset-password', form)
      setResult(data.data.tempPassword)
      toast.success('임시 비밀번호가 발급되었습니다!')
    } catch (err) {
      toast.error(err.response?.data?.message || '계정 정보를 확인해주세요.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: '24px 24px 0 0',
        padding: '8px 24px 40px', width: '100%', maxWidth: 480,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--outline-variant)', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#ffd9e4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MSI name="lock_reset" size={20} color="#923357" />
          </div>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 17 }}>비밀번호 찾기</div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>이메일과 이름으로 임시 비밀번호를 발급합니다</div>
          </div>
        </div>

        {result ? (
          <div>
            <div style={{ background: '#fff8e1', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#b45309', fontWeight: 600, marginBottom: 6 }}>
                <MSI name="warning" fill size={14} color="#b45309" style={{ marginRight: 4 }} />
                임시 비밀번호 (로그인 후 즉시 변경하세요)
              </div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: 4, color: 'var(--on-surface)', textAlign: 'center', padding: '8px 0' }}>
                {result}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', textAlign: 'center', marginBottom: 16, lineHeight: 1.6 }}>
              위 임시 비밀번호로 로그인 후<br />프로필에서 비밀번호를 변경해주세요.
            </div>
            <button onClick={onClose} className="btn btn-primary btn-block">로그인하러 가기</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">이메일</label>
              <input className="form-input" type="email" placeholder="가입한 이메일"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">이름</label>
              <input className="form-input" placeholder="홍길동"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div style={{ height: 8 }} />
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? '확인 중...' : '임시 비밀번호 발급'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── SNS 로그인 버튼 ────────────────────────────────────────────────────────────
const SNS_PROVIDERS = [
  {
    key: 'KAKAO',
    label: '카카오로 계속하기',
    bg: '#FEE500', color: '#191919',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919">
        <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.725 1.714 5.117 4.31 6.565L5.25 21l4.683-2.493A11.7 11.7 0 0012 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/>
      </svg>
    ),
  },
  {
    key: 'NAVER',
    label: '네이버로 계속하기',
    bg: '#03C75A', color: '#ffffff',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
      </svg>
    ),
  },
  {
    key: 'GOOGLE',
    label: 'Google로 계속하기',
    bg: '#ffffff', color: '#3c4043',
    border: '1px solid #dadce0',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
        <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/>
        <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/>
        <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
      </svg>
    ),
  },
]

// ── 메인 LoginPage ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [snsLoading, setSnsLoading] = useState(null)
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })
  const [showFindEmail, setShowFindEmail] = useState(false)
  const [showFindPw, setShowFindPw] = useState(false)
  const [showPw, setShowPw] = useState(false)

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

  // SNS 로그인 — 실제 OAuth 팝업 없이 Mock 처리 (데모용)
  const handleSnsLogin = async (provider) => {
    setSnsLoading(provider)
    try {
      // 실제 서비스: window.location.href = `/oauth2/authorize/${provider.toLowerCase()}`
      // 데모: 가상 SNS 정보로 바로 로그인
      const mockData = {
        KAKAO:  { providerId: 'kakao_123456', name: '카카오 사용자', email: `kakao_123456@kakao.sns` },
        NAVER:  { providerId: 'naver_789012', name: '네이버 사용자', email: `naver_789012@naver.sns` },
        GOOGLE: { providerId: 'google_345678', name: 'Google User', email: `google_345678@gmail.sns` },
      }
      const mock = mockData[provider]
      const { data } = await api.post('/auth/social', {
        provider,
        providerId: mock.providerId,
        name: mock.name,
        email: mock.email,
      })
      login(data.data.user, data.data.accessToken)
      toast.success(`${provider === 'KAKAO' ? '카카오' : provider === 'NAVER' ? '네이버' : 'Google'} 로그인 성공!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'SNS 로그인에 실패했습니다.')
    } finally { setSnsLoading(null) }
  }

  return (
    <div className="auth-page">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .sns-btn { transition: transform 0.15s, box-shadow 0.15s; }
        .sns-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
        .sns-btn:active { transform: scale(0.97); }
      `}</style>

      <div className="auth-card" style={{ animation: 'fadeIn 0.3s ease' }}>

        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-circle">🏠</div>
          <h1>MyHouse</h1>
          <p>집의 모든 것을 한눈에 관리</p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'var(--surface-container-low)',
          borderRadius: 14, padding: 4,
        }}>
          {['login', 'signup'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '9px', border: 'none', borderRadius: 10, cursor: 'pointer',
              background: tab === t ? 'var(--surface-container-lowest)' : 'transparent',
              fontWeight: 700, fontSize: 14, fontFamily: 'Manrope, sans-serif',
              color: tab === t ? 'var(--primary)' : 'var(--on-surface-variant)',
              boxShadow: tab === t ? 'var(--shadow-ambient)' : 'none',
              transition: 'all 0.2s',
            }}>
              {t === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* ── SNS 로그인 버튼들 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {SNS_PROVIDERS.map(p => (
            <button
              key={p.key}
              className="sns-btn"
              onClick={() => handleSnsLogin(p.key)}
              disabled={snsLoading !== null}
              style={{
                width: '100%', padding: '12px 16px',
                background: p.bg, color: p.color,
                border: p.border || 'none',
                borderRadius: 14, cursor: snsLoading ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                opacity: snsLoading && snsLoading !== p.key ? 0.6 : 1,
              }}
            >
              {snsLoading === p.key ? (
                <MSI name="sync" size={20} color={p.color} style={{ animation: 'spin 1s linear infinite' }} />
              ) : p.icon}
              {snsLoading === p.key ? '로그인 중...' : p.label}
            </button>
          ))}
        </div>

        {/* 구분선 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--outline-variant)' }} />
          <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', whiteSpace: 'nowrap' }}>
            또는 이메일로 {tab === 'login' ? '로그인' : '회원가입'}
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--outline-variant)' }} />
        </div>

        {/* ── 로그인 폼 ── */}
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
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPw ? 'text' : 'password'} className="form-input"
                  placeholder="••••••••" style={{ paddingRight: 44 }}
                  value={form.password} onChange={handleChange} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <MSI name={showPw ? 'visibility_off' : 'visibility'} size={18} color="var(--on-surface-variant)" />
                </button>
              </div>
            </div>

            {/* ID찾기 / PW찾기 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 16 }}>
              <button type="button" onClick={() => setShowFindEmail(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--on-surface-variant)', padding: 0, fontWeight: 600 }}>
                이메일 찾기
              </button>
              <span style={{ fontSize: 12, color: 'var(--outline-variant)' }}>|</span>
              <button type="button" onClick={() => setShowFindPw(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--on-surface-variant)', padding: 0, fontWeight: 600 }}>
                비밀번호 찾기
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading
                ? <><MSI name="sync" size={18} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />로그인 중...</>
                : <><MSI name="login" size={18} style={{ marginRight: 6 }} />로그인</>}
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 16, lineHeight: 1.6 }}>
              테스트: test@myhouse.com / test1234
            </p>
          </form>
        ) : (
          /* ── 회원가입 폼 ── */
          <form onSubmit={handleSignup}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">이름 *</label>
                <input name="name" type="text" className="form-input" placeholder="홍길동"
                  value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">전화번호</label>
                <input name="phone" type="tel" className="form-input" placeholder="010-0000-0000"
                  value={form.phone} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">이메일 *</label>
              <input name="email" type="email" className="form-input" placeholder="example@myhouse.com"
                value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">비밀번호 *</label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPw ? 'text' : 'password'} className="form-input"
                  placeholder="6자 이상" style={{ paddingRight: 44 }}
                  value={form.password} onChange={handleChange} required minLength={6} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <MSI name={showPw ? 'visibility_off' : 'visibility'} size={18} color="var(--on-surface-variant)" />
                </button>
              </div>
            </div>

            {/* SNS 회원가입 안내 */}
            <div style={{ background: 'var(--surface-container-low)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--on-surface-variant)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <MSI name="info" size={14} color="var(--primary)" style={{ marginTop: 1, flexShrink: 0 }} />
              <span>SNS로 가입하려면 위의 카카오·네이버·Google 버튼을 이용하세요.</span>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading
                ? <><MSI name="sync" size={18} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />가입 중...</>
                : <><MSI name="person_add" size={18} style={{ marginRight: 6 }} />회원가입</>}
            </button>
          </form>
        )}
      </div>

      {/* ── 이메일 찾기 모달 ── */}
      {showFindEmail && <FindEmailModal onClose={() => setShowFindEmail(false)} />}

      {/* ── 비밀번호 찾기 모달 ── */}
      {showFindPw && <FindPasswordModal onClose={() => setShowFindPw(false)} />}
    </div>
  )
}
