import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useHouseStore } from '../store/useStore'
import toast from 'react-hot-toast'

const HOUSE_TYPES = { APARTMENT: '아파트', HOUSE: '주택', VILLA: '빌라', OFFICETEL: '오피스텔', OTHER: '기타' }
const HOUSE_TYPE_ICONS = { APARTMENT: 'apartment', HOUSE: 'home', VILLA: 'holiday_village', OFFICETEL: 'business', OTHER: 'cottage' }
const THEMES = { DEFAULT: '기본', MODERN: '모던', NATURAL: '자연', VINTAGE: '빈티지', MINIMAL: '미니멀' }

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
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {name}
    </span>
  )
}

export default function HousePage() {
  const { houses, setHouses, selectedHouse, selectHouse, setPendingZoneFilter } = useHouseStore()
  const navigate = useNavigate()
  const [zones, setZones] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editHouse, setEditHouse] = useState(null)
  const [form, setForm] = useState({ name: '우리집', houseType: 'APARTMENT', address: '', area: '', floor: '', rooms: 1, bathrooms: 1, theme: 'DEFAULT' })

  useEffect(() => { loadHouses() }, [])
  useEffect(() => { if (selectedHouse) loadZones() }, [selectedHouse])

  const loadHouses = async () => {
    try { const { data } = await api.get('/houses'); setHouses(data.data) }
    catch (e) { toast.error('집 정보를 불러오지 못했습니다.') }
  }
  const loadZones = async () => {
    try { const { data } = await api.get(`/houses/${selectedHouse.id}/zones`); setZones(data.data) }
    catch (e) {}
  }

  const openCreate = () => {
    setEditHouse(null)
    setForm({ name: '우리집', houseType: 'APARTMENT', address: '', area: '', floor: '', rooms: 1, bathrooms: 1, theme: 'DEFAULT' })
    setShowModal(true)
  }

  const openEdit = (h) => {
    setEditHouse(h)
    setForm({ name: h.name, houseType: h.houseType, address: h.address || '', area: h.area || '', floor: h.floor || '', rooms: h.rooms, bathrooms: h.bathrooms, theme: h.theme })
    setShowModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editHouse) { await api.put(`/houses/${editHouse.id}`, form); toast.success('집 정보가 수정되었습니다.') }
      else { await api.post('/houses', form); toast.success('집이 등록되었습니다!') }
      setShowModal(false); loadHouses()
    } catch (e) { toast.error(e.response?.data?.message || '오류가 발생했습니다.') }
  }

  const handleDelete = async (id) => {
    if (!confirm('집을 삭제하시겠습니까? 관련 모든 데이터가 삭제됩니다.')) return
    try { await api.delete(`/houses/${id}`); toast.success('삭제되었습니다.'); loadHouses() }
    catch (e) { toast.error('삭제에 실패했습니다.') }
  }

  const ZONE_TYPE_MAP = { LIVING_ROOM: { icon: 'weekend', label: '거실', color: '#cce8f4', tc: '#005b87' }, KITCHEN: { icon: 'restaurant', label: '주방', color: '#b6f2be', tc: '#006e1c' }, BEDROOM: { icon: 'bed', label: '침실', color: '#ffd9e4', tc: '#923357' }, BATHROOM: { icon: 'shower', label: '욕실', color: '#cce8f4', tc: '#005b87' }, STUDY: { icon: 'menu_book', label: '서재', color: '#e8d5f0', tc: '#7b4fa6' }, BALCONY: { icon: 'grass', label: '베란다', color: '#b6f2be', tc: '#006e1c' }, GARAGE: { icon: 'garage', label: '차고', color: '#ffedd5', tc: '#b45309' }, OTHER: { icon: 'inventory_2', label: '기타', color: '#f1f3f4', tc: '#40493d' } }

  const handleZoneClick = (zone) => {
    setPendingZoneFilter({ zoneId: zone.id, zoneName: zone.name })
    navigate('/items')
  }

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* ── Hero Section ── */}
      <div style={{ padding: '28px 20px 20px', background: 'var(--surface-container-lowest)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--tertiary)', marginBottom: 4 }}>
              RESIDENCE PROFILE
            </div>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--on-surface)', lineHeight: 1.2 }}>
              {selectedHouse?.name || '내집 관리'}
            </h2>
            {selectedHouse && (
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 4 }}>
                {HOUSE_TYPES[selectedHouse.houseType]} · {selectedHouse.address || '주소 미등록'}
              </p>
            )}
          </div>
          <button
            onClick={openCreate}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 16px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              color: 'white', border: 'none', borderRadius: 20,
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <MSI name="add" size={16} />집 추가
          </button>
        </div>

        {/* House info grid — bento style */}
        {selectedHouse && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            {[
              { icon: HOUSE_TYPE_ICONS[selectedHouse.houseType] || 'home', label: '유형', value: HOUSE_TYPES[selectedHouse.houseType] },
              { icon: 'square_foot', label: '면적', value: selectedHouse.area ? `${selectedHouse.area}㎡` : '-' },
              { icon: 'meeting_room', label: '방 수', value: `${selectedHouse.rooms || 1}개` },
              { icon: 'shower', label: '화장실', value: `${selectedHouse.bathrooms || 1}개` },
            ].map((item, i) => (
              <div key={i} style={{
                background: 'var(--surface-container-low)',
                borderRadius: 14, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <MSI name={item.icon} fill size={20} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</div>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── House List ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>등록된 집</div>

        {houses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--on-surface-variant)' }}>
            <MSI name="home" size={52} color="var(--outline-variant)" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>등록된 집이 없습니다</div>
            <p style={{ fontSize: 13 }}>첫 번째 집을 등록해보세요!</p>
            <button
              onClick={openCreate}
              style={{ marginTop: 16, padding: '12px 24px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: 'white', border: 'none', borderRadius: 24, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              집 등록하기
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {houses.map(h => (
              <div
                key={h.id}
                onClick={() => selectHouse(h)}
                style={{
                  background: selectedHouse?.id === h.id ? 'rgba(0,91,135,0.05)' : 'var(--surface-container-lowest)',
                  borderRadius: 18, padding: '16px 18px', cursor: 'pointer',
                  outline: selectedHouse?.id === h.id ? '2px solid rgba(0,91,135,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: selectedHouse?.id === h.id ? 'rgba(0,91,135,0.12)' : 'var(--surface-container-low)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <MSI name={HOUSE_TYPE_ICONS[h.houseType] || 'home'} fill size={24} color="var(--primary)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 15, marginBottom: 3 }}>
                        {h.name}
                        {h.isPrimary && (
                          <span style={{ marginLeft: 6, background: 'var(--secondary-container)', color: 'var(--secondary)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                            주거
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 6 }}>
                        {HOUSE_TYPES[h.houseType]} · {h.address || '주소 미등록'}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {h.area && <span style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 10 }}>📐 {h.area}㎡</span>}
                        {h.rooms && <span style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 10 }}>{h.rooms}방</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(h) }}
                      style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-container-low)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <MSI name="edit" size={16} color="var(--on-surface-variant)" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(h.id) }}
                      style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(186,26,26,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <MSI name="delete" size={16} color="var(--error)" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Zone Grid ── */}
      {selectedHouse && zones.length > 0 && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700 }}>구역 현황</div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>클릭 시 물품으로 이동</div>
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary)', marginBottom: 14, marginTop: 4 }}>
            {selectedHouse.name}
          </div>

          {/* Timeline style zones list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute', left: 19, top: 8, bottom: 8,
              width: 2, background: 'var(--surface-container-high)',
            }} />
            {zones.map((z, i) => {
              const zType = ZONE_TYPE_MAP[z.zoneType] || ZONE_TYPE_MAP.OTHER
              return (
                <div
                  key={z.id}
                  style={{ position: 'relative', paddingLeft: 48, paddingBottom: 16, cursor: 'pointer' }}
                  onClick={() => handleZoneClick(z)}
                >
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute', left: 0, top: 4,
                    width: 38, height: 38, borderRadius: '50%',
                    background: zType.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}>
                    <MSI name={zType.icon} fill size={18} color={zType.tc} />
                  </div>
                  <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 16, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{z.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                          {zType.label} · 물품 {z.itemCount ?? 0}개
                        </div>
                      </div>
                      <MSI name="arrow_forward_ios" size={14} color="var(--on-surface-variant)" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <div className="modal-title">{editHouse ? '집 정보 수정' : '새 집 등록'}</div>
              <button
                onClick={() => setShowModal(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-container-low)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <MSI name="close" size={18} color="var(--on-surface-variant)" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">집 이름</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">유형</label>
                    <select className="form-select" value={form.houseType} onChange={e => setForm({ ...form, houseType: e.target.value })}>
                      {Object.entries(HOUSE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">주소</label>
                  <input className="form-input" value={form.address} placeholder="서울시 강남구..." onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">면적(㎡)</label>
                    <input type="number" className="form-input" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="84" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">방 수</label>
                    <input type="number" className="form-input" value={form.rooms} onChange={e => setForm({ ...form, rooms: e.target.value })} min={1} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">화장실</label>
                    <input type="number" className="form-input" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} min={1} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">테마</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Object.entries(THEMES).map(([k, v]) => (
                      <button
                        key={k} type="button"
                        onClick={() => setForm({ ...form, theme: k })}
                        style={{
                          padding: '6px 14px', borderRadius: 20, border: 'none',
                          background: form.theme === k ? 'var(--primary-container)' : 'var(--surface-container-low)',
                          color: form.theme === k ? 'var(--primary)' : 'var(--on-surface-variant)',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                      >{v}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary btn-block">저장</button>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
