import { NavLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useStore'

const NAV_ITEMS = [
  { to: '/dashboard', emoji: '🏠', label: '홈' },
  { to: '/items',     emoji: '📦', label: '물품' },
  { to: '/iot',       emoji: '🔌', label: 'IoT' },
  { to: '/community', emoji: '💬', label: '커뮤니티' },
  { to: '/house',     emoji: '🏡', label: '내집' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, emoji, label }) => {
        const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
        return (
          <NavLink
            key={to}
            to={to}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-wrap">
              <span style={{ fontSize: 20 }}>{emoji}</span>
            </div>
            <span className="nav-label">{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
