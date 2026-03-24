import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, User, Menu } from 'lucide-react'
import { useAuthStore } from '../store/useStore'
import { useState, useEffect } from 'react'
import api from '../api/axios'

const PAGE_TITLES = {
  '/dashboard': { title: '대시보드', subtitle: '오늘의 집 현황', emoji: '🏠' },
  '/house': { title: '내집 관리', subtitle: '집 정보 및 구역 관리', emoji: '🏡' },
  '/items': { title: '물품 관리', subtitle: '구역별 물품 인벤토리', emoji: '📦' },
  '/iot': { title: 'IoT 기기', subtitle: '스마트홈 기기 제어', emoji: '🔌' },
  '/community': { title: '커뮤니티', subtitle: '이웃과 물품 거래', emoji: '💬' },
  '/notifications': { title: '알림', subtitle: '읽지 않은 알림', emoji: '🔔' },
  '/profile': { title: '내 프로필', subtitle: '회원 정보 관리', emoji: '👤' },
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'MyHouse', subtitle: '', emoji: '🏠' }

  useEffect(() => {
    // 읽지 않은 알림 수 로드
    api.get('/notifications/count').then(res => {
      if (res.data.success) setUnreadCount(res.data.count)
    }).catch(() => {})
  }, [location.pathname])

  return (
    <div className="header">
      <div>
        <div className="header-title">
          <span style={{ marginRight: 8 }}>{pageInfo.emoji}</span>
          {pageInfo.title}
        </div>
        {pageInfo.subtitle && (
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{pageInfo.subtitle}</div>
        )}
      </div>
      <div className="header-actions">
        {/* 알림 버튼 */}
        <button
          className="btn-icon"
          title="알림"
          onClick={() => navigate('/notifications')}
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 16, height: 16, borderRadius: '50%',
              background: '#EF4444', color: 'white',
              fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid white'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* 프로필 버튼 */}
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 12px', background: '#F8FAFC',
            borderRadius: 20, border: '1px solid #E2E8F0',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onClick={() => navigate('/profile')}
          title="내 프로필"
        >
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 12, fontWeight: 800
          }}>
            {user?.name?.[0] || 'U'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{user?.name}</span>
        </button>
      </div>
    </div>
  )
}
