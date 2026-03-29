import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useStore'
import { useState, useEffect } from 'react'
import api from '../api/axios'

const PAGE_TITLES = {
  '/dashboard':     null,  // shows logo
  '/house':         '내집 관리',
  '/items':         '물품 관리',
  '/iot':           '기기 제어',
  '/community':     '커뮤니티',
  '/notifications': '알림',
  '/profile':       '프로필',
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)

  const isHome = location.pathname === '/dashboard'
  const title = PAGE_TITLES[location.pathname]

  useEffect(() => {
    api.get('/notifications/count').then(res => {
      if (res.data.success) setUnreadCount(res.data.count)
    }).catch(() => {})
  }, [location.pathname])

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'rgba(248, 250, 251, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      flexShrink: 0,
      position: 'relative',
      zIndex: 50,
      borderBottom: 'none',
    }}>
      {/* Left: logo or title */}
      {isHome ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: '#005b87', fontSize: 26, fontVariationSettings: "'FILL' 1" }}>
            home_pin
          </span>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 800, color: '#003a58', letterSpacing: '-0.4px' }}>
            MyHouse
          </h1>
        </div>
      ) : (
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.3px' }}>
          {title || 'MyHouse'}
        </div>
      )}

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Notification bell */}
        <button
          onClick={() => navigate('/notifications')}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'transparent',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,91,135,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span className="material-symbols-outlined" style={{ color: '#40493d', fontSize: 22 }}>
            notifications
          </span>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              minWidth: 14, height: 14, borderRadius: 7,
              background: 'var(--error)', color: 'white',
              fontSize: 8, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px', border: '1.5px solid white',
            }}>
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
            border: '2px solid rgba(203,230,255,0.6)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 13, fontWeight: 800,
            flexShrink: 0,
            fontFamily: 'Manrope, sans-serif',
          }}
        >
          {user?.name?.[0] || 'U'}
        </button>
      </div>
    </header>
  )
}
