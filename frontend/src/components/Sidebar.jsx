import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Package, Cpu, Users, Bell, LogOut, ChevronDown, User } from 'lucide-react'
import { useAuthStore, useHouseStore } from '../store/useStore'
import { useState } from 'react'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard', icon: '🏠', label: '대시보드' },
  { to: '/house', icon: '🏡', label: '내집 관리' },
  { to: '/items', icon: '📦', label: '물품 관리' },
  { to: '/iot', icon: '🔌', label: 'IoT 기기' },
  { to: '/community', icon: '💬', label: '커뮤니티' },
]

const COMING_SOON = [
  { icon: '🏢', label: '부동산 연계' },
  { icon: '🛒', label: '스마트 구매' },
  { icon: '🎨', label: '인테리어' },
]

const GRADE_COLORS = {
  BRONZE: '#CD7F32',
  SILVER: '#888',
  GOLD: '#DAA520',
  PLATINUM: '#6B7280',
}

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { houses, selectedHouse, selectHouse } = useHouseStore()
  const navigate = useNavigate()
  const [showHouseList, setShowHouseList] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('로그아웃되었습니다.')
    navigate('/login')
  }

  const gradeColor = GRADE_COLORS[user?.grade] || GRADE_COLORS.BRONZE
  const gradeEmoji = { BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇', PLATINUM: '💎' }[user?.grade] || '🥉'

  return (
    <div className="sidebar">
      {/* 로고 */}
      <div className="sidebar-logo">
        <div className="logo-icon">🏠</div>
        <div>
          <h1>MyHouse</h1>
          <p>토탈 홈 어시스턴트</p>
        </div>
      </div>

      {/* 집 선택 */}
      {selectedHouse && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>
          <button
            onClick={() => setShowHouseList(!showHouseList)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              background: '#F8FAFC', border: '1.5px solid #E2E8F0',
              borderRadius: 10, padding: '8px 12px', cursor: 'pointer'
            }}>
            <span style={{ fontSize: 18 }}>🏢</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{selectedHouse.name}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>{houses.length}개 집 등록됨</div>
            </div>
            <ChevronDown size={14} color="#94A3B8"
              style={{ transform: showHouseList ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>
          {showHouseList && (
            <div style={{ marginTop: 6, borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              {houses.map(h => (
                <button key={h.id}
                  onClick={() => { selectHouse(h); setShowHouseList(false) }}
                  style={{
                    width: '100%', padding: '8px 12px',
                    background: selectedHouse.id === h.id ? '#EEF2FF' : 'white',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13,
                    color: selectedHouse.id === h.id ? '#4F46E5' : '#1E293B',
                    fontWeight: selectedHouse.id === h.id ? 700 : 400
                  }}>
                  🏠 {h.name}
                  {h.isPrimary && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, background: '#EEF2FF', color: '#4F46E5', padding: '1px 6px', borderRadius: 8 }}>주거</span>
                  )}
                </button>
              ))}
              <button
                onClick={() => { navigate('/house'); setShowHouseList(false) }}
                style={{
                  width: '100%', padding: '8px 12px',
                  background: 'none', border: 'none', borderTop: '1px solid #E2E8F0',
                  cursor: 'pointer', fontSize: 12, color: '#4F46E5', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                }}>
                + 집 추가
              </button>
            </div>
          )}
        </div>
      )}

      {/* 메인 메뉴 */}
      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="nav-section">
          <div className="nav-section-label">홈 관리</div>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-label">내 계정</div>
          <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span style={{ fontSize: 16 }}>🔔</span>
            알림
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span style={{ fontSize: 16 }}>👤</span>
            내 프로필
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-label">확장 기능 (준비중)</div>
          {COMING_SOON.map((item, i) => (
            <button key={i} className="nav-item"
              style={{ opacity: 0.5, cursor: 'not-allowed', width: '100%', textAlign: 'left' }}
              onClick={() => toast('준비 중인 기능입니다!', { icon: '🚧' })}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              <span className="badge" style={{ background: '#F1F5F9', color: '#94A3B8', marginLeft: 'auto', fontSize: 10 }}>Soon</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 사용자 정보 */}
      <div className="sidebar-user">
        <div
          className="user-avatar"
          style={{ cursor: 'pointer', border: `2px solid ${gradeColor}` }}
          onClick={() => navigate('/profile')}
          title="프로필 보기"
        >
          {user?.name?.[0] || 'U'}
        </div>
        <div className="user-info" style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate('/profile')}>
          <div className="user-name">{user?.name}</div>
          <div className="user-grade" style={{ color: gradeColor }}>
            {gradeEmoji} {user?.grade} · {user?.trustScore || 0}점
          </div>
        </div>
        <button className="btn-icon" onClick={handleLogout} title="로그아웃">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )
}
