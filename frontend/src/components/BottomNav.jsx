import { NavLink, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'home',       iconFill: true,  label: '홈' },
  { to: '/iot',       icon: 'smart_toy',  iconFill: true,  label: 'Devices' },
  { to: '/items',     icon: 'inventory_2',iconFill: false, label: 'Items' },
  { to: '/community', icon: 'storefront', iconFill: true,  label: 'community' },
  { to: '/house',     icon: 'person',     iconFill: true,  label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, icon, iconFill, label }) => {
        const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
        return (
          <NavLink
            key={to}
            to={to}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-wrap">
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings: isActive && iconFill
                    ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
                    : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                  fontSize: 22,
                }}
              >
                {icon}
              </span>
            </div>
            <span className="nav-label">{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
