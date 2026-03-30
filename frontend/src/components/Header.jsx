import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useStore'
import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'

const PAGE_TITLES = {
  '/dashboard':     null,
  '/house':         '내집 관리',
  '/items':         '물품 관리',
  '/iot':           '기기 제어',
  '/community':     '커뮤니티',
  '/notifications': '알림',
  '/profile':       '프로필',
}

function MSI({ name, fill = false, size = 20, color, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{
      fontSize: size,
      fontVariationSettings: fill
        ? `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`
        : `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      color: color || 'inherit',
      lineHeight: 1,
      display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle',
      ...style,
    }}>{name}</span>
  )
}

export default function Header() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { user, logout } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const menuRef = useRef(null)

  const isHome = location.pathname === '/dashboard'
  const title  = PAGE_TITLES[location.pathname]

  /* 알림 카운트 */
  useEffect(() => {
    api.get('/notifications/count').then(res => {
      if (res.data.success) setUnreadCount(res.data.count)
    }).catch(() => {})
  }, [location.pathname])

  /* 메뉴 외부 클릭 시 닫기 */
  useEffect(() => {
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [menuOpen])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  const handleProfile = () => {
    setMenuOpen(false)
    navigate('/profile')
  }

  /* 등급별 색상 */
  const gradeColor = {
    BRONZE:   { bg: '#fde8d0', color: '#b45309' },
    SILVER:   { bg: '#e8eaed', color: '#4b5563' },
    GOLD:     { bg: '#fef9c3', color: '#92400e' },
    PLATINUM: { bg: '#dbeafe', color: '#1d4ed8' },
  }[user?.grade] || { bg: '#f2f4f5', color: '#40493d' }

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

      {/* ── 좌측: 로고 또는 타이틀 ── */}
      {isHome ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined"
            style={{ color: '#005b87', fontSize: 26, fontVariationSettings: "'FILL' 1" }}>
            home_pin
          </span>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 800,
            color: '#003a58', letterSpacing: '-0.4px' }}>
            MyHouse
          </h1>
        </div>
      ) : (
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 17, fontWeight: 700,
          color: 'var(--on-surface)', letterSpacing: '-0.3px' }}>
          {title || 'MyHouse'}
        </div>
      )}

      {/* ── 우측: 알림 + 아바타 ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* 알림 버튼 */}
        <button
          onClick={() => navigate('/notifications')}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', transition: 'background 0.15s',
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

        {/* 아바타 + 드롭다운 */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: menuOpen
                ? 'linear-gradient(135deg, var(--primary-light), var(--primary))'
                : 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              border: menuOpen
                ? '2px solid rgba(0,91,135,0.5)'
                : '2px solid rgba(203,230,255,0.6)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 13, fontWeight: 800,
              flexShrink: 0,
              fontFamily: 'Manrope, sans-serif',
              transition: 'border 0.15s, box-shadow 0.15s',
              boxShadow: menuOpen ? '0 0 0 3px rgba(0,91,135,0.12)' : 'none',
            }}
          >
            {user?.profileImg ? (
              <img src={user.profileImg} alt="avatar"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              user?.name?.[0]?.toUpperCase() || 'U'
            )}
          </button>

          {/* ── 드롭다운 메뉴 ── */}
          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 220,
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,91,135,0.08)',
              overflow: 'hidden',
              zIndex: 200,
              animation: 'dropIn 0.18s ease',
            }}>
              <style>{`
                @keyframes dropIn {
                  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                  to   { opacity: 1; transform: translateY(0)     scale(1);    }
                }
              `}</style>

              {/* 사용자 정보 */}
              <div style={{
                padding: '16px 16px 12px',
                borderBottom: '1px solid var(--outline-variant)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 16, fontWeight: 800, fontFamily: 'Manrope, sans-serif',
                  }}>
                    {user?.profileImg ? (
                      <img src={user.profileImg} alt="avatar"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      user?.name?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 14,
                      color: 'var(--on-surface)', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {user?.name || '사용자'}
                    </div>
                    <div style={{
                      fontSize: 11, color: 'var(--on-surface-variant)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {user?.email || ''}
                    </div>
                  </div>
                </div>

                {/* 등급 뱃지 */}
                {user?.grade && (
                  <div style={{ marginTop: 10 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 10px', borderRadius: 20,
                      background: gradeColor.bg,
                      fontSize: 11, fontWeight: 700, color: gradeColor.color,
                    }}>
                      <MSI name="star" fill size={12} color={gradeColor.color} />
                      {user.grade}
                      {user?.trustScore !== undefined && (
                        <span style={{ opacity: 0.7, fontWeight: 600 }}>· {user.trustScore}점</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* 메뉴 항목 */}
              <div style={{ padding: '8px 8px' }}>
                <button
                  onClick={handleProfile}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 12,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    color: 'var(--on-surface)', textAlign: 'left',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 10,
                    background: 'rgba(0,91,135,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <MSI name="person" fill size={16} color="var(--primary)" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>프로필 설정</span>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); navigate('/notifications') }}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 12,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    color: 'var(--on-surface)', textAlign: 'left',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 10,
                    background: 'rgba(0,91,135,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, position: 'relative',
                  }}>
                    <MSI name="notifications" fill size={16} color="var(--primary)" />
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute', top: -2, right: -2,
                        width: 12, height: 12, borderRadius: '50%',
                        background: 'var(--error)', border: '1.5px solid white',
                        fontSize: 7, fontWeight: 800, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>알림</span>
                  {unreadCount > 0 && (
                    <span style={{
                      marginLeft: 'auto', padding: '1px 7px', borderRadius: 20,
                      background: 'var(--error)', color: 'white',
                      fontSize: 10, fontWeight: 700,
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* 구분선 + 로그아웃 */}
              <div style={{ padding: '0 8px 8px', borderTop: '1px solid var(--outline-variant)' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', padding: '10px 12px', marginTop: 8, borderRadius: 12,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    color: 'var(--error)', textAlign: 'left',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(186,26,26,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 10,
                    background: 'rgba(186,26,26,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <MSI name="logout" size={16} color="var(--error)" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>로그아웃</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
