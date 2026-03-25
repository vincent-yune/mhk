import { useState, useEffect, useRef } from 'react'
import { Plus, Search, X, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useHouseStore } from '../store/useStore'
import toast from 'react-hot-toast'

const STATUS_MAP = {
  ACTIVE: { label: '보유중', cls: 'badge-active' },
  BROKEN: { label: '고장', cls: 'badge-danger' },
  DISCARDED: { label: '폐기', cls: 'badge-gray' },
  SOLD: { label: '판매됨', cls: 'badge-warning' }
}
const CATEGORY_ICONS = { 1: '📺', 2: '🪑', 3: '🥕', 4: '🧴', 5: '👕', 6: '⚽', 7: '📦' }

// 커뮤니티 등록 버튼 (판매/나눔 선택 드롭다운)
function CommunityLinkButton({ item, onSelect, mini = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const options = [
    { type: 'SELL', icon: '💰', label: '판매 글 올리기' },
    { type: 'FREE', icon: '🎁', label: '나눔 글 올리기' },
    { type: 'RENT', icon: '🔄', label: '대여 글 올리기' },
  ]

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        title="커뮤니티에 올리기"
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        style={{
          display: 'flex', alignItems: 'center', gap: mini ? 0 : 4,
          padding: mini ? '5px 7px' : '5px 10px',
          borderRadius: 8, border: '1.5px solid #10B981',
          background: open ? '#ECFDF5' : 'white',
          color: '#10B981', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#ECFDF5'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'white' }}
      >
        <ShoppingBag size={13} />
        {!mini && <span>커뮤니티</span>}
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 100,
          background: 'white', border: '1px solid #E2E8F0', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 160, overflow: 'hidden'
        }}>
          <div style={{ padding: '8px 12px 6px', fontSize: 11, color: '#94A3B8', fontWeight: 700, borderBottom: '1px solid #F1F5F9' }}>
            📦 {item.name}
          </div>
          {options.map(opt => (
            <button key={opt.type}
              onClick={e => { e.stopPropagation(); setOpen(false); onSelect(item, opt.type) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '9px 14px', background: 'none', border: 'none',
                fontSize: 13, fontWeight: 600, color: '#1E293B', cursor: 'pointer',
                textAlign: 'left', transition: 'background 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ItemPage() {
  const { selectedHouse, pendingZoneFilter, clearPendingZoneFilter } = useHouseStore()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [zones, setZones] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [form, setForm] = useState({
    name: '', brand: '', model: '', barcode: '', quantity: 1, unit: 'EA',
    purchaseDate: '', purchasePrice: '', expiryDate: '', warrantyExpire: '',
    isConsumable: false, reorderLevel: '', status: 'ACTIVE',
    zone: null, category: null, description: ''
  })

  // HousePage에서 구역 필터가 넘어왔을 때 자동 적용
  useEffect(() => {
    if (pendingZoneFilter) {
      setSelectedZone(pendingZoneFilter.zoneId)
      setActiveTab('all')
      clearPendingZoneFilter()
    }
  }, [pendingZoneFilter])

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
      setItems(itemsRes.data.data || [])
      setZones(zonesRes.data.data || [])
      setCategories(catRes.data.data || [])
    } catch (e) {}
  }

  // 커뮤니티 연계: 물품 정보를 가져가서 커뮤니티 페이지로 이동
  const handleCommunityLink = (item, postType) => {
    const typeLabel = { SELL: '판매', FREE: '나눔', RENT: '대여' }[postType] || postType
    // sessionStorage에 임시 저장 후 커뮤니티 페이지로 이동
    sessionStorage.setItem('communityDraft', JSON.stringify({
      postType,
      title: `${item.name} ${typeLabel}합니다`,
      content: `${item.name}${item.brand ? ` (${item.brand})` : ''} ${typeLabel}합니다.\n구역: ${item.zoneName || '-'}\n수량: ${item.quantity}${item.unit}\n상태: ${STATUS_MAP[item.status]?.label || item.status}`,
      price: postType === 'SELL' ? '' : '0',
      isNegotiable: postType === 'SELL',
      location: '',
      itemId: item.id
    }))
    navigate('/community')
    toast.success(`커뮤니티 ${typeLabel} 글 작성 화면으로 이동합니다.`)
  }

  const openCreate = () => {
    setEditItem(null)
    setForm({
      name: '', brand: '', model: '', barcode: '', quantity: 1, unit: 'EA',
      purchaseDate: '', purchasePrice: '', expiryDate: '', warrantyExpire: '',
      isConsumable: false, reorderLevel: '', status: 'ACTIVE', zone: null, category: null, description: ''
    })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setDetailItem(null)
    setShowDetailModal(false)
    setEditItem(item)
    setForm({
      name: item.name, brand: item.brand || '', model: item.model || '', barcode: item.barcode || '',
      quantity: item.quantity, unit: item.unit, purchaseDate: item.purchaseDate || '',
      purchasePrice: item.purchasePrice || '', expiryDate: item.expiryDate || '',
      warrantyExpire: item.warrantyExpire || '', isConsumable: item.isConsumable,
      reorderLevel: item.reorderLevel || '', status: item.status,
      zone: item.zoneId ? { id: item.zoneId } : null,
      category: item.categoryId ? { id: item.categoryId } : null,
      description: item.description || ''
    })
    setShowModal(true)
  }

  const openDetail = (item) => {
    setDetailItem(item)
    setShowDetailModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const payload = {
      ...form,
      zone: form.zone?.id ? { id: form.zone.id } : null,
      category: form.category?.id ? { id: form.category.id } : null
    }
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

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation()
    if (!confirm('물품을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/houses/${selectedHouse.id}/items/${id}`)
      toast.success('삭제되었습니다.')
      setShowDetailModal(false)
      loadAll()
    } catch (e) {
      toast.error('삭제에 실패했습니다.')
    }
  }

  const selectedZoneName = zones.find(z => z.id === selectedZone)?.name
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
          <p style={{ color: '#64748B', fontSize: 14 }}>
            총 {items.length}개 물품
            {selectedZoneName && <span style={{ marginLeft: 8, color: '#10B981', fontWeight: 700 }}>— {selectedZoneName} 필터 중</span>}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> 물품 등록</button>
      </div>

      {/* 탭 + 구역 필터 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { key: 'all', label: '전체', icon: '📦' },
          { key: 'expiring', label: '유통기한 임박', icon: '⏰' },
          { key: 'reorder', label: '재주문 필요', icon: '🛒' },
        ].map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setSelectedZone(null) }}
            style={{
              padding: '8px 16px', borderRadius: 20, border: '1.5px solid',
              borderColor: activeTab === t.key && !selectedZone ? '#4F46E5' : '#E2E8F0',
              background: activeTab === t.key && !selectedZone ? '#EEF2FF' : 'white',
              color: activeTab === t.key && !selectedZone ? '#4F46E5' : '#64748B',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
            }}>{t.icon} {t.label}</button>
        ))}
        <div style={{ width: 1, height: 32, background: '#E2E8F0', margin: '0 4px', alignSelf: 'center' }} />
        {zones.map(z => (
          <button key={z.id} onClick={() => { setSelectedZone(z.id); setActiveTab('all') }}
            style={{
              padding: '8px 16px', borderRadius: 20, border: '1.5px solid',
              borderColor: selectedZone === z.id ? '#10B981' : '#E2E8F0',
              background: selectedZone === z.id ? '#ECFDF5' : 'white',
              color: selectedZone === z.id ? '#10B981' : '#64748B',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
            {z.name}
            {selectedZone === z.id && <span style={{ marginLeft: 4, fontSize: 11 }}>✓</span>}
          </button>
        ))}
        {selectedZone && (
          <button onClick={() => setSelectedZone(null)}
            style={{
              padding: '8px 12px', borderRadius: 20, border: '1.5px solid #EF4444',
              background: 'white', color: '#EF4444', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap'
            }}>✕ 필터 해제</button>
        )}
      </div>

      {/* 검색 */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input className="form-input" style={{ paddingLeft: 40 }} placeholder="물품명, 브랜드 검색..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* 물품 목록 */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>등록된 물품이 없습니다</h3>
          <p>물품을 등록해보세요!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(item => {
            const isExpiring = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 14 * 86400000)
            return (
              <div key={item.id} className="item-card" onClick={() => openDetail(item)}
                style={{ cursor: 'pointer' }}>
                <div className="item-icon-box">
                  {CATEGORY_ICONS[item.categoryId] || '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</span>
                    {isExpiring && <span className="badge badge-warning">⏰ 유통기한 임박</span>}
                    {item.isConsumable && item.quantity <= (item.reorderLevel || 0) && (
                      <span className="badge badge-danger">🛒 재주문 필요</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#64748B', flexWrap: 'wrap' }}>
                    {item.brand && <span>🏷️ {item.brand}</span>}
                    {item.zoneName && <span>📍 {item.zoneName}</span>}
                    <span>수량: {item.quantity}{item.unit}</span>
                    {item.expiryDate && <span>유통기한: {item.expiryDate}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`badge ${STATUS_MAP[item.status]?.cls || 'badge-gray'}`}>
                    {STATUS_MAP[item.status]?.label || item.status}
                  </span>
                  {/* 커뮤니티 연계 버튼 */}
                  <CommunityLinkButton item={item} onSelect={handleCommunityLink} mini={true} />
                  <button className="btn-icon" style={{ color: '#EF4444' }}
                    onClick={e => handleDelete(item.id, e)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── 물품 상세 모달 ─── */}
      {showDetailModal && detailItem && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{CATEGORY_ICONS[detailItem.categoryId] || '📦'}</span>
                <div>
                  <div className="modal-title">{detailItem.name}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>물품 상세 정보</div>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowDetailModal(false)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              {/* 상태 + 구역 배지 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span className={`badge ${STATUS_MAP[detailItem.status]?.cls || 'badge-gray'}`} style={{ fontSize: 13, padding: '4px 12px' }}>
                  {STATUS_MAP[detailItem.status]?.label || detailItem.status}
                </span>
                {detailItem.zoneName && (
                  <span className="badge badge-info" style={{ fontSize: 13, padding: '4px 12px' }}>📍 {detailItem.zoneName}</span>
                )}
                {detailItem.isConsumable && (
                  <span className="badge badge-warning" style={{ fontSize: 13, padding: '4px 12px' }}>🔄 소모품</span>
                )}
              </div>

              {/* 정보 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', background: '#F8FAFC', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                {[
                  { label: '브랜드', value: detailItem.brand },
                  { label: '모델', value: detailItem.model },
                  { label: '수량', value: `${detailItem.quantity} ${detailItem.unit}` },
                  { label: '구매일', value: detailItem.purchaseDate },
                  { label: '구매가격', value: detailItem.purchasePrice ? `${Number(detailItem.purchasePrice).toLocaleString()}원` : null },
                  { label: '유통기한', value: detailItem.expiryDate },
                  { label: '보증만료', value: detailItem.warrantyExpire },
                  { label: '재주문 기준', value: detailItem.reorderLevel ? `${detailItem.reorderLevel}${detailItem.unit} 이하` : null },
                ].filter(r => r.value).map(row => (
                  <div key={row.label}>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginTop: 2 }}>{row.value}</div>
                  </div>
                ))}
              </div>

              {detailItem.description && (
                <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginBottom: 4 }}>메모</div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{detailItem.description}</div>
                </div>
              )}

              {/* 커뮤니티 연계 섹션 */}
              <div style={{ background: '#ECFDF5', borderRadius: 10, padding: 14, border: '1px solid #D1FAE5' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', marginBottom: 10 }}>
                  🏪 커뮤니티에서 이 물품 거래하기
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { type: 'SELL', icon: '💰', label: '판매 글 올리기', bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' },
                    { type: 'FREE', icon: '🎁', label: '나눔 글 올리기', bg: '#FFF7ED', color: '#F59E0B', border: '#FDE68A' },
                    { type: 'RENT', icon: '🔄', label: '대여 글 올리기', bg: '#FDF4FF', color: '#A855F7', border: '#E9D5FF' },
                  ].map(opt => (
                    <button key={opt.type}
                      onClick={() => { setShowDetailModal(false); handleCommunityLink(detailItem, opt.type) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 8,
                        border: `1.5px solid ${opt.border}`,
                        background: opt.bg, color: opt.color,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowDetailModal(false); handleDelete(detailItem.id) }}>🗑️ 삭제</button>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>닫기</button>
              <button className="btn btn-primary" onClick={() => openEdit(detailItem)}>✏️ 수정</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 물품 등록/수정 모달 ─── */}
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
                    <input className="form-input" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">브랜드</label>
                    <input className="form-input" value={form.brand} placeholder="삼성, LG..."
                      onChange={e => setForm({ ...form, brand: e.target.value })} />
                  </div>
                </div>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">수량</label>
                    <input type="number" className="form-input" value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: e.target.value })} min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">단위</label>
                    <select className="form-select" value={form.unit}
                      onChange={e => setForm({ ...form, unit: e.target.value })}>
                      {['EA', 'kg', 'g', 'L', 'mL', '개', '봉', '팩'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">상태</label>
                    <select className="form-select" value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}>
                      {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">구역</label>
                    <select className="form-select" value={form.zone?.id || ''}
                      onChange={e => setForm({ ...form, zone: e.target.value ? { id: Number(e.target.value) } : null })}>
                      <option value="">구역 선택</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">카테고리</label>
                    <select className="form-select" value={form.category?.id || ''}
                      onChange={e => setForm({ ...form, category: e.target.value ? { id: Number(e.target.value) } : null })}>
                      <option value="">카테고리 선택</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">구매일</label>
                    <input type="date" className="form-input" value={form.purchaseDate}
                      onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">유통기한</label>
                    <input type="date" className="form-input" value={form.expiryDate}
                      onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <input type="checkbox" id="consumable" checked={form.isConsumable}
                    onChange={e => setForm({ ...form, isConsumable: e.target.checked })} />
                  <label htmlFor="consumable" style={{ fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>
                    소모품 (재주문 알림 사용)
                  </label>
                </div>
                {form.isConsumable && (
                  <div className="form-group">
                    <label className="form-label">재주문 기준 수량</label>
                    <input type="number" className="form-input" value={form.reorderLevel}
                      onChange={e => setForm({ ...form, reorderLevel: e.target.value })}
                      placeholder="이 수량 이하면 알림" />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">메모</label>
                  <textarea className="form-textarea" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="물품에 대한 메모..." />
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
