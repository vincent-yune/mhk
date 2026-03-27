import { useLocation, useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuthStore } from '../store/useStore'
import { useState, useEffect } from 'react'
import api from '../api/axios'

const PAGE_TITLES = {
  '/dashboard':     'MyHouse',
  '/house':         '내집 관리',
  '/items':         '물품 관리',
  '/iot':           'IoT 기기',
  '/community':     '커뮤니티',
  '/notifications': '알림',
  '/profile':       '내 프로필',
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)

  const isHome = location.pathname === '/dashboard'
  const title = PAGE_TITLES[location.pathname] || 'MyHouse'

  useEffect(() => {
    api.get('/notifications/count').then(res => {
      if (res.data.success) setUnreadCount(res.data.count)
    }).catch(() => {})
  }, [location.pathname])

  return (
    <div className="header" style={{ borderBottom: 'none' }}>
      {/* Left: logo or title */}
      {isHome ? (
        <div className="header-logo">
          <div className="header-logo-icon">🏠</div>
          <h1 className="header-logo" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px' }}>
            MyHouse
          </h1>
        </div>
      ) : (
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.3px' }}>
          {title}
        </div>
      )}

      {/* Right: actions */}
      <div className="header-actions">
        <button
          className="btn-icon"
          onClick={() => navigate('/notifications')}
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 13, fontWeight: 800,
            flexShrink: 0
          }}
        >
          {user?.name?.[0] || 'U'}
        </button>
      </div>
    </div>
  )
}
