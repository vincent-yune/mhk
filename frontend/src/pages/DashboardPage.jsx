import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuthStore, useHouseStore } from '../store/useStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const HOUSE_TYPE_KO = { APARTMENT: '아파트', HOUSE: '주택', VILLA: '빌라', OFFICETEL: '오피스텔', OTHER: '기타' }

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { selectedHouse } = useHouseStore()
  const [stats, setStats] = useState({ items: 0, iot: 0, posts: 0 })
  const [expiringItems, setExpiringItems] = useState([])
  const [reorderItems, setReorderItems] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)

  const feeData = [
    { month: '10월', amount: 142000 },
    { month: '11월', amount: 158000 },
    { month: '12월', amount: 175000 },
    { month: '1월',  amount: 165000 },
    { month: '2월',  amount: 148000 },
    { month: '3월',  amount: 152000 },
  ]

  useEffect(() => {
    if (!selectedHouse) { setLoading(false); return }
    loadData()
  }, [selectedHouse])

  const loadData = async () => {
    setLoading(true)
    try {
      const [itemsRes, iotRes, postsRes, expiringRes, reorderRes, zonesRes] = await Promise.allSettled([
        api.get(`/houses/${selectedHouse.id}/items`),
        api.get(`/houses/${selectedHouse.id}/iot`),
        api.get('/community?size=5'),
        api.get(`/houses/${selectedHouse.id}/items/expiring?days=7`),
        api.get(`/houses/${selectedHouse.id}/items/reorder`),
        api.get(`/houses/${selectedHouse.id}/zones`),
      ])
      setStats({
        items: itemsRes.value?.data?.data?.length || 0,
        iot:   iotRes.value?.data?.data?.length   || 0,
        posts: postsRes.value?.data?.data?.totalElements || 0,
      })
      setExpiringItems(expiringRes.value?.data?.data || [])
      setReorderItems(reorderRes.value?.data?.data   || [])
      setZones(zonesRes.value?.data?.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  /* ── No house selected ── */
  if (!selectedHouse) {
    return (
      <div>
        {/* Hero welcome */}
        <div className="page-hero" style={{ paddingTop: 32, paddingBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏠</div>
          <div className="page-hero-eyebrow">Welcome</div>
          <h1 className="page-hero-title">안녕하세요,<br />{user?.name || '홈오너'}님</h1>
          <p className="page-hero-subtitle" style={{ marginTop: 12 }}>
            첫 번째 집을 등록하고<br />스마트 홈 관리를 시작해 보세요.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 24 }}
            onClick={() => navigate('/house')}
          >
            🏡 첫 번째 집 등록하기
          </button>
        </div>

        {/* Feature cards */}
        <div className="page-section">
          <p className="section-title">주요 기능</p>
          <div className="space-sm" />
          <div className="grid-2">
            {[
              { icon: '📦', title: '물품 관리', desc: '유통기한·재고 스마트 관리', color: 'bg-blue-soft',  link: '/items' },
              { icon: '🔌', title: 'IoT 기기',  desc: '자동화 시나리오 설정',     color: 'bg-green-soft', link: '/iot' },
              { icon: '💬', title: '커뮤니티',  desc: '이웃과 중고 물품 거래',    color: 'bg-orange-soft', link: '/community' },
              { icon: '📊', title: '홈 인사이트', desc: '관리비 리포트 분석',    color: 'bg-purple-soft', link: '/dashboard' },
            ].map((f, i) => (
              <div
                key={i}
                className={`card card-hover ${f.color}`}
                style={{ padding: 18 }}
                onClick={() => navigate(f.link)}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--on-surface)' }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-xl" />
      </div>
    )
  }

  const alerts = [
    ...expiringItems.map(i => ({ type: 'warning', text: `${i.name} 유통기한 임박`, sub: i.expiryDate })),
    ...reorderItems.map(i => ({ type: 'danger',  text: `${i.name} 재주문 필요`,  sub: `${i.quantity}${i.unit}` })),
  ]

  return (
    <div>
      {/* ── Hero House Card ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <div className="card-hero">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
              {HOUSE_TYPE_KO[selectedHouse.houseType] || '주택'}
            </div>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 4 }}>
              {selectedHouse.name}
            </h2>
            <p style={{ fontSize: 13, opacity: 0.8 }}>{selectedHouse.address || '주소 미등록'}</p>

            {/* Mini stats row */}
            <div style={{ display: 'flex', gap: 20, marginTop: 18 }}>
              {[
                { value: stats.items, label: '물품' },
                { value: stats.iot,   label: 'IoT' },
                { value: zones.length, label: '구역' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>{s.value}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="page-section">
        <div className="section-header">
          <span className="section-title">빠른 실행</span>
        </div>
        <div className="scroll-row">
          {[
            { icon: '📦', label: '물품 추가',  color: '#cce8f4', link: '/items' },
            { icon: '🔌', label: 'IoT 제어',   color: '#b6f2be', link: '/iot' },
            { icon: '🛒', label: '재주문',      color: '#ffedd5', link: '/items' },
            { icon: '💬', label: '중고 거래',   color: '#fce7f3', link: '/community' },
            { icon: '🏡', label: '집 관리',     color: '#f3e8ff', link: '/house' },
          ].map((q, i) => (
            <button
              key={i}
              onClick={() => navigate(q.link)}
              style={{
                background: q.color,
                borderRadius: 16,
                padding: '14px 16px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                minWidth: 72,
                transition: 'transform 0.15s'
              }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.94)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: 24 }}>{q.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap' }}>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <div className="page-section">
          <div className="section-header">
            <span className="section-title">🔔 스마트 알림</span>
            <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{alerts.length}건</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.slice(0, 3).map((a, i) => (
              <div key={i} className={`alert alert-${a.type}`}>
                <span>{a.type === 'warning' ? '⚠️' : '📦'}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.text}</div>
                  {a.sub && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>{a.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Zone Overview ── */}
      {zones.length > 0 && (
        <div className="page-section">
          <div className="section-header">
            <span className="section-title">구역 현황</span>
            <button className="section-action" onClick={() => navigate('/items')}>전체 보기</button>
          </div>
          <div className="grid-2">
            {zones.slice(0, 6).map((z, i) => (
              <div
                key={z.id}
                className="card card-sm card-hover"
                onClick={() => navigate(`/items?zone=${z.id}`)}
                style={{ padding: '14px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="icon-rect bg-primary-soft" style={{ width: 38, height: 38, fontSize: 18, borderRadius: 12 }}>
                    {z.icon || '📍'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {z.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                      📦 {z.itemCount ?? 0}개
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Fee Chart ── */}
      <div className="page-section">
        <div className="section-header">
          <span className="section-title">관리비 추이</span>
          <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>최근 6개월</span>
        </div>
        <div className="card" style={{ padding: '16px 12px 12px' }}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={feeData} barSize={18} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--on-surface-variant)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--on-surface-variant)' }} tickFormatter={v => `${(v/10000).toFixed(0)}만`} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={v => [`${v.toLocaleString()}원`, '관리비']}
                contentStyle={{ background: 'var(--surface-container-lowest)', border: 'none', borderRadius: 12, fontSize: 12, boxShadow: 'var(--shadow-float)' }}
              />
              <Bar dataKey="amount" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Community posts ── */}
      <div className="page-section" style={{ paddingBottom: 0 }}>
        <div className="section-header">
          <span className="section-title">커뮤니티</span>
          <button className="section-action" onClick={() => navigate('/community')}>더 보기</button>
        </div>
      </div>

      <div className="space-xl" />
    </div>
  )
}
