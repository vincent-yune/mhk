import { useState, useEffect } from 'react'
import { Plus, Search, Filter, X, AlertTriangle } from 'lucide-react'
import api from '../api/axios'
import { useHouseStore } from '../store/useStore'
import toast from 'react-hot-toast'

const STATUS_MAP = { ACTIVE: { label: '보유중', cls: 'badge-active' }, BROKEN: { label: '고장', cls: 'badge-danger' }, DISCARDED: { label: '폐기', cls: 'badge-gray' }, SOLD: { label: '판매됨', cls: 'badge-warning' } }
const CATEGORY_ICONS = { 1: '📺', 2: '🪑', 3: '🥕', 4: '🧴', 5: '👕', 6: '⚽', 7: '📦' }

export default function ItemPage() {
  const { selectedHouse } = useHouseStore()
  const [items, setItems] = useState([])
  const [zones, setZones] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // all | expiring | reorder
  const [form, setForm] = useState({
    name: '', brand: '', model: '', barcode: '', quantity: 1, unit: 'EA',
    purchaseDate: '', purchasePrice: '', expiryDate: '', warrantyExpire: '',
    isConsumable: false, reorderLevel: '', status: 'ACTIVE',
    zone: null, category: null, description: ''
  })

  useEffect(() => {
    if (!selectedHouse) return
    loadAll()
  }, [selectedHouse, selectedZone, activeTab])

  const loadAll = async () => {
    try {
      let url = `/houses/${selectedHouse.id}/items`
      if (activeTab === 'expiring') url += '/expiring?days=14'
      else if (activeTab === 'reorder') url += '/reorder'
      else if (selectedZone) url += `?zoneId=${selectedZone}`

      const [itemsRes, zonesRes, catRes] = await Promise.all([
        api.get(url),
        api.get(`/houses/${selectedHouse.id}/zones`),
        api.get('/categories')
      ])
      setItems(itemsRes.data.data)
      setZones(zonesRes.data.data)
      setCategories(catRes.data.data)
    } catch (e) {}
  }

  const openCreate = () => {
    setEditItem(null)
    setForm({ name: '', brand: '', model: '', barcode: '', quantity: 1, unit: 'EA', purchaseDate: '', purchasePrice: '', expiryDate: '', warrantyExpire: '', isConsumable: false, reorderLevel: '', status: 'ACTIVE', zone: null, category: null, description: '' })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      name: item.name, brand: item.brand || '', model: item.model || '', barcode: item.barcode || '',
      quantity: item.quantity, unit: item.unit, purchaseDate: item.purchaseDate || '',
      purchasePrice: item.purchasePrice || '', expiryDate: item.expiryDate || '',
      warrantyExpire: item.warrantyExpire || '', isConsumable: item.isConsumable,
      reorderLevel: item.reorderLevel || '', status: item.status,
      zone: item.zone ? { id: item.zone.id } : null,
      category: item.category ? { id: item.category.id } : null,
      description: item.description || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const payload = { ...form, zone: form.zone?.id ? { id: form.zone.id } : null, category: form.category?.id ? { id: form.category.id } : null }
    try {
      if (editItem) {
        await api.put(`/houses/${selectedHouse.id}/items/${editItem.id}`, payload)
        toast.success('물품이 수정되었습니다.')
      } else {
        await api.post(`/houses/${selectedHouse.id}/items`, payload)
        toast.success('물품이 등록되었습니다!')
      }
      setShowModal(false)
      loadAll()
    } catch (e) {
      toast.error(e.response?.data?.message || '오류가 발생했습니다.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('물품을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/houses/${selectedHouse.id}/items/${id}`)
      toast.success('삭제되었습니다.')
      loadAll()
    } catch (e) {
      toast.error('삭제에 실패했습니다.')
    }
  }

  const filtered = items.filter(i => i.name.includes(search) || (i.brand || '').includes(search))

  if (!selectedHouse) {
    return <div className="empty-state"><div className="empty-state-icon">📦</div><h3>집을 먼저 선택해주세요</h3></div>
  }

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>구역별 물품 관리</h2>
          <p style={{ color: '#64748B', fontSize: 14 }}>총 {items.length}개 물품</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> 물품 등록</button>
      </div>

      {/* 탭 필터 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { key: 'all', label: '전체', icon: '📦' },
          { key: 'expiring', label: '유통기한 임박', icon: '⏰' },
          { key: 'reorder', label: '재주문 필요', icon: '🛒' },
        ].map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setSelectedZone(null) }}
            style={{
              padding: '8px 16px', borderRadius: 20, border: '1.5px solid',
              borderColor: activeTab === t.key ? '#4F46E5' : '#E2E8F0',
              background: activeTab === t.key ? '#EEF2FF' : 'white',
              color: activeTab === t.key ? '#4F46E5' : '#64748B',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
            }}>{t.icon} {t.label}</button>
        ))}
        <div className="divider" style={{ width: 1, height: 32, margin: '0 4px' }} />
        {zones.map(z => (
          <button key={z.id} onClick={() => { setSelectedZone(z.id); setActiveTab('all') }}
            style={{
              padding: '8px 16px', borderRadius: 20, border: '1.5px solid',
              borderColor: selectedZone === z.id ? '#10B981' : '#E2E8F0',
              background: selectedZone === z.id ? '#ECFDF5' : 'white',
              color: selectedZone === z.id ? '#10B981' : '#64748B',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
            }}>{z.name}</button>
        ))}
      </div>

      {/* 검색 */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input className="form-input" style={{ paddingLeft: 40 }} placeholder="물품명, 브랜드 검색..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* 물품 목록 */}
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📦</div><h3>등록된 물품이 없습니다</h3><p>물품을 등록해보세요!</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(item => {
            const isExpiring = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 14 * 86400000)
            return (
              <div key={item.id} className="item-card" onClick={() => openEdit(item)}>
                <div className="item-icon-box">
                  {CATEGORY_ICONS[item.category?.id] || '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</span>
                    {isExpiring && <span className="badge badge-warning">⏰ 유통기한 임박</span>}
                    {item.isConsumable && item.quantity <= (item.reorderLevel || 0) && <span className="badge badge-danger">📦 재주문 필요</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#64748B', flexWrap: 'wrap' }}>
                    {item.brand && <span>🏷️ {item.brand}</span>}
                    {item.zone && <span>📍 {item.zone.name}</span>}
                    <span>수량: {item.quantity}{item.unit}</span>
                    {item.expiryDate && <span>유통기한: {item.expiryDate}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${STATUS_MAP[item.status]?.cls}`}>{STATUS_MAP[item.status]?.label}</span>
                  <button className="btn-icon" style={{ color: '#EF4444' }}
                    onClick={e => { e.stopPropagation(); handleDelete(item.id) }}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 물품 등록/수정 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editItem ? '물품 수정' : '새 물품 등록'}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">물품명 *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">브랜드</label>
                    <input className="form-input" value={form.brand} placeholder="삼성, LG..." onChange={e => setForm({ ...form, brand: e.target.value })} />
                  </div>
                </div>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">수량</label>
                    <input type="number" className="form-input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">단위</label>
                    <select className="form-select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                      {['EA', 'kg', 'g', 'L', 'mL', '개', '봉', '팩'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">상태</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">구역</label>
                    <select className="form-select" value={form.zone?.id || ''} onChange={e => setForm({ ...form, zone: e.target.value ? { id: parseInt(e.target.value) } : null })}>
                      <option value="">구역 선택</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">카테고리</label>
                    <select className="form-select" value={form.category?.id || ''} onChange={e => setForm({ ...form, category: e.target.value ? { id: parseInt(e.target.value) } : null })}>
                      <option value="">카테고리 선택</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">구매일</label>
                    <input type="date" className="form-input" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">유통기한</label>
                    <input type="date" className="form-input" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <input type="checkbox" id="consumable" checked={form.isConsumable} onChange={e => setForm({ ...form, isConsumable: e.target.checked })} />
                  <label htmlFor="consumable" style={{ fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>소모품 (재주문 알림 사용)</label>
                </div>
                {form.isConsumable && (
                  <div className="form-group">
                    <label className="form-label">재주문 기준 수량</label>
                    <input type="number" className="form-input" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: e.target.value })} placeholder="이 수량 이하면 알림" />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">메모</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="물품에 대한 메모..." />
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
