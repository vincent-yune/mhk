import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const NOTI_ICONS = {
  EXPIRY_WARN: '⏰',
  REORDER: '🛒',
  IOT_ALERT: '🔌',
  COMMUNITY: '💬',
  TRADE: '🤝',
  SYSTEM: '🔔',
}

const NOTI_COLORS = {
  EXPIRY_WARN: { bg: '#FFF7ED', border: '#FED7AA', color: '#92400E' },
  REORDER: { bg: '#EEF2FF', border: '#C7D2FE', color: '#3730A3' },
  IOT_ALERT: { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46' },
  COMMUNITY: { bg: '#F0F9FF', border: '#BAE6FD', color: '#0C4A6E' },
  TRADE: { bg: '#FDF4FF', border: '#E9D5FF', color: '#6B21A8' },
  SYSTEM: { bg: '#F8FAFC', border: '#E2E8F0', color: '#475569' },
}

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | unread

  useEffect(() => { loadNotifications() }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications')
      if (data.success) {
        setNotifications(data.data)
      }
    } catch (err) {
      // 데이터 없을 경우 샘플 데이터
      setNotifications([
        { id: 1, type: 'EXPIRY_WARN', title: '유통기한 임박 알림', message: '우유의 유통기한이 3일 후 만료됩니다.', isRead: false, createdAt: new Date().toISOString() },
        { id: 2, type: 'REORDER', title: '재주문 필요', message: '세제 재고가 부족합니다. (현재 재고: 1개)', isRead: false, createdAt: new Date().toISOString() },
        { id: 3, type: 'IOT_ALERT', title: 'IoT 기기 알림', message: '거실 에어컨이 3시간째 가동 중입니다.', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: 4, type: 'COMMUNITY', title: '커뮤니티 알림', message: '내가 올린 중고 물품에 관심을 표시한 사람이 있습니다.', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: 5, type: 'SYSTEM', title: '서비스 안내', message: 'MyHouse에 오신 것을 환영합니다! 집 관리를 스마트하게 시작해보세요.', isRead: true, createdAt: new Date(Date.now() - 259200000).toISOString() },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('전체 읽음 처리되었습니다')
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('전체 읽음 처리되었습니다')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('알림이 삭제되었습니다')
    } catch {
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('알림이 삭제되었습니다')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)
    if (diffMin < 1) return '방금 전'
    if (diffMin < 60) return `${diffMin}분 전`
    if (diffHour < 24) return `${diffHour}시간 전`
    if (diffDay < 7) return `${diffDay}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="page-title">🔔 알림</h2>
          <p className="page-subtitle">
            전체 {notifications.length}개
            {unreadCount > 0 && <span style={{ color: '#4F46E5', fontWeight: 600 }}> · 읽지 않음 {unreadCount}개</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={handleMarkAllRead}>
              <Check size={14} /> 전체 읽음
            </button>
          )}
          <button className="btn btn-secondary" onClick={loadNotifications}>
            <RefreshCw size={14} /> 새로고침
          </button>
        </div>
      </div>

      {/* 필터 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#F8FAFC', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {[
          { id: 'all', label: `전체 (${notifications.length})` },
          { id: 'unread', label: `읽지 않음 (${unreadCount})` }
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '6px 16px', border: 'none', cursor: 'pointer',
            background: filter === f.id ? 'white' : 'transparent',
            borderRadius: 8, fontSize: 13, fontWeight: filter === f.id ? 700 : 500,
            color: filter === f.id ? '#4F46E5' : '#64748B',
            boxShadow: filter === f.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s'
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* 알림 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <p>로딩 중...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔔</div>
          <h3>{filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}</h3>
          <p>새로운 알림이 오면 이곳에 표시됩니다</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(n => {
            const colors = NOTI_COLORS[n.type] || NOTI_COLORS.SYSTEM
            const icon = NOTI_ICONS[n.type] || '🔔'
            return (
              <div key={n.id} style={{
                background: n.isRead ? 'white' : colors.bg,
                border: `1.5px solid ${n.isRead ? '#E2E8F0' : colors.border}`,
                borderRadius: 12, padding: 16,
                display: 'flex', gap: 14, alignItems: 'flex-start',
                transition: 'all 0.2s',
                cursor: !n.isRead ? 'pointer' : 'default'
              }}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
              >
                {/* 아이콘 */}
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: n.isRead ? '#F1F5F9' : colors.bg,
                  border: `2px solid ${n.isRead ? '#E2E8F0' : colors.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0
                }}>
                  {icon}
                </div>

                {/* 내용 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <h4 style={{
                      fontSize: 14, fontWeight: n.isRead ? 600 : 700,
                      color: n.isRead ? '#475569' : '#1E293B', marginBottom: 4
                    }}>
                      {!n.isRead && (
                        <span style={{
                          display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                          background: '#4F46E5', marginRight: 6, verticalAlign: 'middle'
                        }} />
                      )}
                      {n.title}
                    </h4>
                    <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0 }}>
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: n.isRead ? '#94A3B8' : '#475569', lineHeight: 1.5 }}>
                    {n.message}
                  </p>
                </div>

                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {!n.isRead && (
                    <button
                      style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#EEF2FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={e => { e.stopPropagation(); handleMarkRead(n.id) }}
                      title="읽음 표시"
                    >
                      <Check size={13} color="#4F46E5" />
                    </button>
                  )}
                  <button
                    style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#FEE2E2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => { e.stopPropagation(); handleDelete(n.id) }}
                    title="삭제"
                  >
                    <Trash2 size={13} color="#EF4444" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
