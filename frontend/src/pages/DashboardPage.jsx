import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuthStore, useHouseStore } from '../store/useStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const HOUSE_TYPE_KO = { APARTMENT: '아파트', HOUSE: '주택', VILLA: '빌라', OFFICETEL: '오피스텔', OTHER: '기타' }

/* ── Material Symbol helper ── */
function MSI({ name, fill = false, size = 24, color, style = {} }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size,
        fontVariationSettings: fill
          ? `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`
          : `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        color: color || 'inherit',
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        ...style,
      }}
    >
      {name}
    </span>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { selectedHouse } = useHouseStore()
  const [stats, setStats] = useState({ items: 0, iot: 0, posts: 0 })
  const [expiringItems, setExpiringItems] = useState([])
  const [reorderItems, setReorderItems] = useState([])
  const [zones, setZones] = useState([])
  const [iotDevices, setIotDevices] = useState([])
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
      setIotDevices(iotRes.value?.data?.data?.slice(0, 5) || [])
      setExpiringItems(expiringRes.value?.data?.data || [])
      setReorderItems(reorderRes.value?.data?.data   || [])
      setZones(zonesRes.value?.data?.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  /* ── No house selected ── */
  if (!selectedHouse) {
    return (
      <div style={{ padding: '0 0 24px' }}>
        {/* Welcome Hero */}
        <div style={{ padding: '32px 20px 28px', background: 'var(--surface-container-lowest)' }}>
          {/* Asymmetric layout */}
          <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--primary)' }}>
            WELCOME
          </div>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--on-surface)', marginBottom: 6, lineHeight: 1.2 }}>
            안녕하세요,<br />{user?.name || '홈오너'}님
          </h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>
            첫 번째 집을 등록하고 스마트 홈 관리를 시작해 보세요.
          </p>

          {/* Status Card - Bento style */}
          <div style={{
            marginTop: 20,
            background: 'var(--surface-container-low)',
            borderRadius: 16,
            padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(0,110,28,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MSI name="verified_user" fill size={22} color="var(--secondary)" />
            </div>
            <div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--on-surface)' }}>
                준비 완료
              </div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                집을 등록하면 스마트 관리가 시작됩니다
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/house')}
            style={{
              marginTop: 20,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              color: 'white',
              border: 'none', borderRadius: 24,
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,91,135,0.3)',
            }}
          >
            <MSI name="add_home" size={18} />
            첫 번째 집 등록하기
          </button>
        </div>

        {/* Feature Cards - 2x2 grid */}
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 14 }}>
            주요 기능
          </div>
          <div className="grid-2">
            {[
              { icon: 'inventory_2',  title: '물품 관리',   desc: '유통기한·재고 스마트 관리', bg: '#cce8f4', color: '#005b87', link: '/items' },
              { icon: 'smart_toy',    title: 'IoT 기기',    desc: '자동화 시나리오 설정',     bg: '#b6f2be', color: '#006e1c', link: '/iot' },
              { icon: 'storefront',   title: '커뮤니티',    desc: '이웃과 중고 물품 거래',    bg: '#ffd9e4', color: '#923357', link: '/community' },
              { icon: 'bar_chart',    title: '홈 인사이트', desc: '관리비 리포트 분석',       bg: '#e8d5f0', color: '#7b4fa6', link: '/dashboard' },
            ].map((f, i) => (
              <div
                key={i}
                onClick={() => navigate(f.link)}
                style={{
                  background: 'var(--surface-container-lowest)',
                  borderRadius: 16, padding: 18, cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-float)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onTouchEnd={e => e.currentTarget.style.transform = ''}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: f.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <MSI name={f.icon} fill size={20} color={f.color} />
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--on-surface)', marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 48 }} />
      </div>
    )
  }

  const alerts = [
    ...expiringItems.map(i => ({ type: 'warning', icon: 'schedule', text: `${i.name} 유통기한 임박`, sub: i.expiryDate })),
    ...reorderItems.map(i => ({ type: 'danger', icon: 'shopping_cart', text: `${i.name} 재주문 필요`, sub: `${i.quantity}${i.unit}` })),
  ]

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* ── Welcome Hero Section (Asymmetrical) ── */}
      <div style={{ padding: '28px 20px 20px', background: 'var(--surface-container-lowest)' }}>
        <div style={{ marginBottom: 4 }}>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--on-surface)', lineHeight: 1.2 }}>
            안녕하세요, {user?.name || '홈오너'}님
          </h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginTop: 4 }}>
            {selectedHouse.name}이 준비되어 있습니다.
          </p>
        </div>

        {/* Status badge */}
        <div style={{
          marginTop: 16,
          background: 'var(--surface-container-low)',
          borderRadius: 14,
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(0,110,28,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MSI name="verified_user" fill size={20} color="var(--secondary)" />
          </div>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--on-surface)' }}>
              시스템 상태 정상
            </div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 1 }}>
              {alerts.length > 0 ? `${alerts.length}건 주의 필요` : '모든 항목이 정상입니다'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Climate Card (Featured Glassmorphism) ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          borderRadius: 20,
          padding: '22px 20px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background icon */}
          <div style={{ position: 'absolute', top: 8, right: 8, opacity: 0.08 }}>
            <MSI name="home_work" size={100} color="white" />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.8, marginBottom: 8 }}>
              {HOUSE_TYPE_KO[selectedHouse.houseType] || '주택'} • {selectedHouse.address || '주소 미등록'}
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 24, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 4 }}>
              {selectedHouse.name}
            </div>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
              {[
                { value: stats.items, label: '물품', icon: 'inventory_2' },
                { value: stats.iot,   label: 'IoT',  icon: 'smart_toy' },
                { value: zones.length, label: '구역', icon: 'room' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MSI name={s.icon} size={16} color="rgba(255,255,255,0.7)" />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Manrope, sans-serif', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, lineHeight: 1.2 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--on-surface)' }}>빠른 실행</span>
        </div>
        <div className="scroll-row">
          {[
            { icon: 'inventory_2', label: '물품 추가',  bg: '#cce8f4', color: '#005b87', link: '/items' },
            { icon: 'smart_toy',   label: 'IoT 제어',   bg: '#b6f2be', color: '#006e1c', link: '/iot' },
            { icon: 'shopping_cart', label: '재주문',   bg: '#ffedd5', color: '#b45309', link: '/items' },
            { icon: 'storefront',  label: '거래',       bg: '#ffd9e4', color: '#923357', link: '/community' },
            { icon: 'home_work',   label: '집 관리',    bg: '#e8d5f0', color: '#7b4fa6', link: '/house' },
          ].map((q, i) => (
            <button
              key={i}
              onClick={() => navigate(q.link)}
              style={{
                background: q.bg, borderRadius: 16, padding: '14px 12px',
                border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6, minWidth: 70,
                transition: 'transform 0.15s',
              }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.93)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <MSI name={q.icon} fill size={22} color={q.color} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap' }}>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Connected Devices Carousel ── */}
      {iotDevices.length > 0 && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700 }}>연결된 기기</span>
            <button
              onClick={() => navigate('/iot')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              전체 <MSI name="arrow_forward" size={14} color="var(--primary)" />
            </button>
          </div>
          <div className="scroll-row">
            {iotDevices.map((d, i) => (
              <div
                key={i}
                style={{
                  flexShrink: 0, width: 130,
                  background: 'var(--surface-container-lowest)',
                  borderRadius: 16, padding: '14px 14px 12px',
                }}
              >
                <MSI
                  name={d.deviceType === 'THERMOSTAT' ? 'thermostat' : d.deviceType === 'LIGHT' ? 'lightbulb' : d.deviceType === 'CAMERA' ? 'nest_cam_wired_stand' : 'smart_toy'}
                  fill size={24}
                  color={d.status === 'ONLINE' ? 'var(--secondary)' : 'var(--on-surface-variant)'}
                  style={{ marginBottom: 8, display: 'block' }}
                />
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--on-surface)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.name}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: d.status === 'ONLINE' ? 'var(--secondary)' : 'var(--on-surface-variant)' }}>
                  {d.status === 'ONLINE' ? '● 온라인' : '○ 오프라인'}
                </div>
              </div>
            ))}
            {/* Add device */}
            <div
              onClick={() => navigate('/iot')}
              style={{
                flexShrink: 0, width: 130,
                background: 'var(--surface-container-lowest)',
                borderRadius: 16, padding: '14px 14px 12px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 8, cursor: 'pointer', minHeight: 80,
              }}
            >
              <MSI name="add_circle" size={24} color="var(--on-surface-variant)" />
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--on-surface)' }}>기기 추가</div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>페어링</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700 }}>스마트 알림</span>
            <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{alerts.length}건</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.slice(0, 3).map((a, i) => (
              <div key={i} className={`alert alert-${a.type}`}>
                <MSI name={a.icon} fill size={18} />
                <div>
                  <div style={{ fontWeight: 600 }}>{a.text}</div>
                  {a.sub && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>{a.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Zone Grid (Lighting Scenes style) ── */}
      {zones.length > 0 && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700 }}>구역 현황</span>
            <button
              className="section-action"
              onClick={() => navigate('/items')}
              style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}
            >
              전체 <MSI name="arrow_forward" size={14} color="var(--primary)" />
            </button>
          </div>
          <div className="grid-2">
            {zones.slice(0, 6).map((z, i) => {
              const ZONE_META = {
                LIVING_ROOM:  { icon: 'weekend',        bg: '#cce8f4', color: '#005b87' },
                KITCHEN:      { icon: 'skillet',        bg: '#ffd9e4', color: '#923357' },
                BEDROOM:      { icon: 'bed',            bg: '#e8d5f0', color: '#7b4fa6' },
                BATHROOM:     { icon: 'bathtub',        bg: '#b6f2be', color: '#006e1c' },
                STUDY:        { icon: 'menu_book',      bg: '#fef9c3', color: '#854d0e' },
                BALCONY:      { icon: 'deck',           bg: '#d1fae5', color: '#065f46' },
                GARAGE:       { icon: 'directions_car', bg: '#e0e7ff', color: '#3730a3' },
                CORRIDOR:     { icon: 'meeting_room',   bg: '#e0e7ff', color: '#3730a3' },
                UTILITY_ROOM: { icon: 'hvac',           bg: '#fef3c7', color: '#92400e' },
                PANTRY:       { icon: 'shelves',        bg: '#d1fae5', color: '#065f46' },
                TOILET:       { icon: 'wc',             bg: '#cce8f4', color: '#005b87' },
                PARKING:      { icon: 'local_parking',  bg: '#ffd9e4', color: '#923357' },
                OTHER:        { icon: 'room',           bg: '#f1f5f9', color: '#475569' },
              }
              const meta = ZONE_META[z.zoneType] || ZONE_META.OTHER
              const itemCount = z.itemCount ?? 0
              return (
                <div
                  key={z.id}
                  onClick={() => navigate(`/items?zone=${z.id}`)}
                  style={{
                    background: 'var(--surface-container-lowest)',
                    borderRadius: 16, padding: '14px 16px',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10,
                    transition: 'transform 0.15s',
                  }}
                  onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
                  onTouchEnd={e => e.currentTarget.style.transform = ''}
                >
                  {/* 아이콘 + 물품 수 뱃지 */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: meta.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <MSI name={meta.icon} fill size={22} color={meta.color} />
                    </div>
                    {/* 물품 수 뱃지 */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      background: meta.bg,
                      borderRadius: 20, padding: '3px 8px',
                    }}>
                      <MSI name="inventory_2" size={12} color={meta.color} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{itemCount}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {z.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                      물품 {itemCount}개
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent Activity ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>최근 활동</div>
        <div style={{ background: 'var(--surface-container-low)', borderRadius: 16, padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: 'inventory_2', color: '#91f78e',    bg: 'rgba(145,247,142,0.3)', text: '물품 관리', sub: '항목 관리 바로가기', link: '/items' },
              { icon: 'smart_toy',   color: '#2374a5',    bg: 'rgba(35,116,165,0.1)',  text: 'IoT 기기 제어', sub: '기기 제어 바로가기', link: '/iot' },
              { icon: 'storefront',  color: '#b14b6f',    bg: 'rgba(177,75,111,0.1)',  text: '마켓플레이스', sub: '이웃과 거래', link: '/community' },
            ].map((a, i) => (
              <div
                key={i}
                onClick={() => navigate(a.link)}
                style={{ display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer' }}
              >
                <div style={{
                  flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
                  background: a.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MSI name={a.icon} fill size={16} color={a.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>{a.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>{a.sub}</div>
                </div>
                <MSI name="arrow_forward_ios" size={14} color="var(--on-surface-variant)" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fee Chart ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700 }}>관리비 추이</span>
          <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>최근 6개월</span>
        </div>
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 16, padding: '16px 12px 12px' }}>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={feeData} barSize={16} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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

      <div style={{ height: 48 }} />
    </div>
  )
}
