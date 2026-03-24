import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuthStore } from '../store/useStore'

const PAGE_TITLES = {
  '/dashboard': { title: '대시보드', subtitle: '오늘의 집 현황' },
  '/house': { title: '내집 관리', subtitle: '집 정보 및 구역 관리' },
  '/items': { title: '물품 관리', subtitle: '구역별 물품 인벤토리' },
  '/iot': { title: 'IoT 기기 관리', subtitle: '스마트홈 기기 제어' },
  '/community': { title: '커뮤니티', subtitle: '이웃과 물품 거래' },
}

export default function Header() {
  const location = useLocation()
  const { user } = useAuthStore()
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'MyHouse', subtitle: '' }

  return (
    <div className="header">
      <div>
        <div className="header-title">{pageInfo.title}</div>
        <div style={{ fontSize: 12, color: '#94A3B8' }}>{pageInfo.subtitle}</div>
      </div>
      <div className="header-actions">
        <button className="btn-icon" title="알림">
          <Bell size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: '#F8FAFC', borderRadius: 20, border: '1px solid #E2E8F0' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 800 }}>
            {user?.name?.[0] || 'U'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</span>
        </div>
      </div>
    </div>
  )
}
