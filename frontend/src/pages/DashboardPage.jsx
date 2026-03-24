import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Package, Cpu, Users, Bell, TrendingUp, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import { useHouseStore } from '../store/useStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { selectedHouse } = useHouseStore()
  const [stats, setStats] = useState({ items: 0, iot: 0, posts: 0 })
  const [expiringItems, setExpiringItems] = useState([])
  const [reorderItems, setReorderItems] = useState([])
  const [loading, setLoading] = useState(true)

  const feeData = [
    { month: '10월', amount: 142000 },
    { month: '11월', amount: 158000 },
    { month: '12월', amount: 175000 },
    { month: '1월', amount: 165000 },
    { month: '2월', amount: 148000 },
    { month: '3월', amount: 152000 },
  ]

  useEffect(() => {
    if (!selectedHouse) { setLoading(false); return }
    loadData()
  }, [selectedHouse])

  const loadData = async () => {
    setLoading(true)
    try {
      const [itemsRes, iotRes, postsRes, expiringRes, reorderRes] = await Promise.allSettled([
        api.get(`/houses/${selectedHouse.id}/items`),
        api.get(`/houses/${selectedHouse.id}/iot`),
        api.get('/community?size=5'),
        api.get(`/houses/${selectedHouse.id}/items/expiring?days=7`),
        api.get(`/houses/${selectedHouse.id}/items/reorder`),
      ])
      setStats({
        items: itemsRes.value?.data?.data?.length || 0,
        iot: iotRes.value?.data?.data?.length || 0,
        posts: postsRes.value?.data?.data?.totalElements || 0,
      })
      setExpiringItems(expiringRes.value?.data?.data || [])
      setReorderItems(reorderRes.value?.data?.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!selectedHouse) {
    return (
      <div>
        {/* 온보딩 카드 */}
        <div className="onboarding-card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏠</div>
          <h2>MyHouse에 오신 것을 환영합니다!</h2>
          <p>집을 등록하고 스마트한 홈 관리를 시작해보세요<br />집 정보, 물품 관리, IoT 제어, 커뮤니티까지 한 번에!</p>
          <button
            className="btn"
            style={{ background: 'white', color: '#4F46E5', fontWeight: 700, fontSize: 15, padding: '12px 32px', borderRadius: 12 }}
            onClick={() => navigate('/house')}
          >
            🏡 첫 번째 집 등록하기
          </button>
        </div>

        {/* 기능 소개 */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {[
            { icon: '📦', title: '물품 관리', desc: '구역별 물품을 등록하고\n유통기한, 재고를 스마트하게 관리해요', color: '#EEF2FF', link: '/items' },
            { icon: '🔌', title: 'IoT 기기 제어', desc: '스마트 기기를 연결하고\n자동화 시나리오를 설정해요', color: '#ECFDF5', link: '/iot' },
            { icon: '💬', title: '커뮤니티 거래', desc: '이웃과 중고 물품을 거래하고\n정보를 나눠요', color: '#FFF7ED', link: '/community' },
            { icon: '📊', title: '홈 인사이트', desc: '관리비, 물품 현황을\n분석하고 리포트로 확인해요', color: '#FDF4FF', link: '/dashboard' },
          ].map((f, i) => (
            <div key={i}
              className="card card-hover"
              style={{ background: f.color, border: 'none', cursor: 'pointer' }}
              onClick={() => navigate(f.link)}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#1E293B' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* 시작 안내 */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#1E293B' }}>🚀 시작하는 방법</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { step: '01', title: '집 등록', desc: '집 이름, 유형, 주소를 입력하고 첫 번째 집을 등록하세요', icon: '🏠', done: false },
              { step: '02', title: '구역 설정', desc: '거실, 주방, 침실 등 구역을 만들고 물품을 관리할 공간을 준비하세요', icon: '🗂️', done: false },
              { step: '03', title: '물품 추가', desc: '바코드 스캔이나 수동 입력으로 물품을 등록하세요', icon: '📦', done: false },
              { step: '04', title: 'IoT 연결', desc: '스마트 기기를 등록하고 자동화 시나리오를 설정하세요', icon: '🔌', done: false },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20
                }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '1px 6px', borderRadius: 6 }}>STEP {s.step}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{s.title}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const statItems = [
    { icon: '📦', label: '등록 물품', value: stats.items, color: '#EEF2FF', iconColor: '#4F46E5', change: '+3' },
    { icon: '🔌', label: 'IoT 기기', value: stats.iot, color: '#ECFDF5', iconColor: '#10B981', change: 'ONLINE' },
    { icon: '💬', label: '커뮤니티', value: stats.posts, color: '#FFF7ED', iconColor: '#F59E0B', change: '게시글' },
    { icon: '⭐', label: '등급', value: 'BRONZE', color: '#FDF4FF', iconColor: '#A855F7', change: '신뢰도 0점' },
  ]

  return (
    <div>
      {/* 집 정보 헤더 */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', border: 'none', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>우리집 현황</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>🏠 {selectedHouse.name}</h2>
            <p style={{ opacity: 0.8, fontSize: 13 }}>
              {selectedHouse.houseType === 'APARTMENT' ? '아파트' :
               selectedHouse.houseType === 'HOUSE' ? '주택' : '기타'} · {selectedHouse.address || '주소 미등록'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, opacity: 0.7 }}>입주일</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedHouse.moveInDate || '-'}</div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {statItems.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.color }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-change up">{s.change}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 알림 및 차트 */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* 관리비 차트 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div className="card-title">📊 관리비 추이</div>
              <div className="card-subtitle">최근 6개월</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={feeData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => `${(v/10000).toFixed(0)}만`} />
              <Tooltip formatter={v => [`${v.toLocaleString()}원`, '관리비']} />
              <Bar dataKey="amount" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 알림 목록 */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>🔔 스마트 알림</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {expiringItems.length > 0 ? (
              expiringItems.map(item => (
                <div key={item.id} className="alert alert-warning">
                  ⚠️ <span><b>{item.name}</b> 유통기한 임박 ({item.expiryDate})</span>
                </div>
              ))
            ) : (
              <div className="alert alert-success">✅ 유통기한 임박 물품 없음</div>
            )}
            {reorderItems.length > 0 ? (
              reorderItems.map(item => (
                <div key={item.id} className="alert alert-danger">
                  📦 <span><b>{item.name}</b> 재주문 필요 (재고 {item.quantity}{item.unit})</span>
                </div>
              ))
            ) : (
              <div className="alert alert-success">✅ 재주문 필요 물품 없음</div>
            )}
            <div className="alert" style={{ background: '#EEF2FF', color: '#3730A3', border: '1px solid #C7D2FE' }}>
              🏠 모든 IoT 기기 정상 작동 중
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 실행 메뉴 */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>⚡ 빠른 실행</div>
        <div className="grid-4">
          {[
            { icon: '📦', label: '물품 등록', desc: '바코드 스캔으로 쉽게', color: '#EEF2FF' },
            { icon: '🔌', label: 'IoT 제어', desc: '기기 상태 확인', color: '#ECFDF5' },
            { icon: '🛒', label: '스마트 구매', desc: '소모품 재주문', color: '#FFF7ED' },
            { icon: '💬', label: '중고 거래', desc: '이웃과 물품 교환', color: '#FDF4FF' },
          ].map((q, i) => (
            <div key={i} style={{ background: q.color, borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{q.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{q.label}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{q.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
