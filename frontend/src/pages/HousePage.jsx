import { useState, useEffect } from 'react'
import { Plus, Home, Edit2, Trash2, X } from 'lucide-react'
import api from '../api/axios'
import { useHouseStore } from '../store/useStore'
import toast from 'react-hot-toast'

const HOUSE_TYPES = { APARTMENT: '아파트', HOUSE: '주택', VILLA: '빌라', OFFICETEL: '오피스텔', OTHER: '기타' }
const THEMES = { DEFAULT: '기본', MODERN: '모던', NATURAL: '자연', VINTAGE: '빈티지', MINIMAL: '미니멀' }
const EMOJI = { APARTMENT: '🏢', HOUSE: '🏠', VILLA: '🏘️', OFFICETEL: '🏙️', OTHER: '🏡' }

export default function HousePage() {
  const { houses, setHouses, selectedHouse, selectHouse } = useHouseStore()
  const [zones, setZones] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editHouse, setEditHouse] = useState(null)
  const [form, setForm] = useState({ name: '우리집', houseType: 'APARTMENT', address: '', area: '', floor: '', rooms: 1, bathrooms: 1, theme: 'DEFAULT' })

  useEffect(() => {
    loadHouses()
  }, [])

  useEffect(() => {
    if (selectedHouse) loadZones()
  }, [selectedHouse])

  const loadHouses = async () => {
    try {
      const { data } = await api.get('/houses')
      setHouses(data.data)
    } catch (e) {
      toast.error('집 정보를 불러오지 못했습니다.')
    }
  }

  const loadZones = async () => {
    try {
      const { data } = await api.get(`/houses/${selectedHouse.id}/zones`)
      setZones(data.data)
    } catch (e) {}
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
      if (editHouse) {
        await api.put(`/houses/${editHouse.id}`, form)
        toast.success('집 정보가 수정되었습니다.')
      } else {
        await api.post('/houses', form)
        toast.success('집이 등록되었습니다!')
      }
      setShowModal(false)
      loadHouses()
    } catch (e) {
      toast.error(e.response?.data?.message || '오류가 발생했습니다.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('집을 삭제하시겠습니까? 관련 모든 데이터가 삭제됩니다.')) return
    try {
      await api.delete(`/houses/${id}`)
      toast.success('삭제되었습니다.')
      loadHouses()
    } catch (e) {
      toast.error('삭제에 실패했습니다.')
    }
  }

  const ZONE_ICONS = { LIVING_ROOM: '🛋️', KITCHEN: '🍳', BEDROOM: '🛏️', BATHROOM: '🚿', STUDY: '📚', BALCONY: '🌿', GARAGE: '🚗', OTHER: '📦' }
  const ZONE_LABELS = { LIVING_ROOM: '거실', KITCHEN: '주방', BEDROOM: '침실', BATHROOM: '욕실', STUDY: '서재', BALCONY: '베란다', GARAGE: '차고', OTHER: '기타' }

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>내집 관리</h2>
          <p style={{ color: '#64748B', fontSize: 14 }}>집 정보와 구역을 관리하세요</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> 집 추가
        </button>
      </div>

      {/* 집 목록 */}
      {houses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏠</div>
          <h3>등록된 집이 없습니다</h3>
          <p>첫 번째 집을 등록해보세요!</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}>집 등록하기</button>
        </div>
      ) : (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {houses.map(h => (
            <div key={h.id} className="card" style={{ cursor: 'pointer', border: selectedHouse?.id === h.id ? '2px solid #4F46E5' : '1px solid #E2E8F0' }}
              onClick={() => selectHouse(h)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 40 }}>{EMOJI[h.houseType]}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{h.name}</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}>{HOUSE_TYPES[h.houseType]} · {h.address || '주소 미등록'}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {h.area && <span className="badge badge-info">📐 {h.area}㎡</span>}
                      {h.rooms && <span className="badge badge-primary">🚪 {h.rooms}방</span>}
                      {h.isPrimary && <span className="badge badge-active">✅ 주거</span>}
                      <span className="badge badge-gray">🎨 {THEMES[h.theme]}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-icon" onClick={e => { e.stopPropagation(); openEdit(h) }}><Edit2 size={14} /></button>
                  <button className="btn-icon" style={{ color: '#EF4444' }} onClick={e => { e.stopPropagation(); handleDelete(h.id) }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 선택된 집의 구역 */}
      {selectedHouse && zones.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>🗺️ 구역 현황 — {selectedHouse.name}</div>
          <div className="grid-4">
            {zones.map(z => (
              <div key={z.id} style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{ZONE_ICONS[z.zoneType] || '📦'}</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{z.name}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{ZONE_LABELS[z.zoneType]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editHouse ? '집 정보 수정' : '새 집 등록'}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
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
                      <button key={k} type="button" style={{
                        padding: '6px 14px', borderRadius: 20, border: '2px solid',
                        borderColor: form.theme === k ? '#4F46E5' : '#E2E8F0',
                        background: form.theme === k ? '#EEF2FF' : 'white',
                        color: form.theme === k ? '#4F46E5' : '#64748B',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer'
                      }} onClick={() => setForm({ ...form, theme: k })}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
