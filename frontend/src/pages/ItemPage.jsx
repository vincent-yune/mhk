import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useHouseStore } from '../store/useStore'
import toast from 'react-hot-toast'

function MSI({ name, fill = false, size = 24, color, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{
      fontSize: size,
      fontVariationSettings: fill ? `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' ${size}` : `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      color: color || 'inherit', lineHeight: 1, display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', ...style,
    }}>{name}</span>
  )
}

const STATUS_MAP = {
  ACTIVE: { label: '보유중', cls: 'badge-active' },
  BROKEN: { label: '고장', cls: 'badge-danger' },
  DISCARDED: { label: '폐기', cls: 'badge-gray' },
  SOLD: { label: '판매됨', cls: 'badge-warning' }
}
const CATEGORY_ICONS = { 1: '📺', 2: '🪑', 3: '🥕', 4: '🧴', 5: '👕', 6: '⚽', 7: '📦' }

// 커뮤니티 등록 버튼
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
          borderRadius: 10, border: 'none',
          background: open ? 'var(--secondary-container)' : 'var(--surface-container-low)',
          color: 'var(--secondary)', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
        }}
      >
        <MSI name="storefront" fill size={14} color="var(--secondary)" />
        {!mini && <span>커뮤니티</span>}
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 100,
          background: 'white', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 160, overflow: 'hidden'
        }}>
          <div style={{ padding: '8px 12px 6px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid #F1F5F9' }}>
            📦 {item.name}
          </div>
          {options.map(opt => (
            <button key={opt.type}
              onClick={e => { e.stopPropagation(); setOpen(false); onSelect(item, opt.type) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '9px 14px', background: 'none', border: 'none',
                fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', cursor: 'pointer',
                textAlign: 'left', transition: 'background 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
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

// ─── 맵 마커 선택 컴포넌트 ───
function MapMarkerSelector({ mapImageUrl, mapX, mapY, onChange }) {
  const imgRef = useRef(null)
  const containerRef = useRef(null)

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    onChange({ mapX: parseFloat(x.toFixed(2)), mapY: parseFloat(y.toFixed(2)) })
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange({ mapX: null, mapY: null })
  }

  if (!mapImageUrl) {
    return (
      <div style={{
        padding: '16px', background: 'var(--surface-container-low)', borderRadius: 12,
        textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 12,
        border: '1px dashed var(--outline-variant)',
      }}>
        <MSI name="map" size={28} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 8px' }} />
        맵 이미지가 없습니다.<br />
        <span style={{ fontSize: 11 }}>내집 관리 화면에서 집 도면을 먼저 등록하세요.</span>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 8 }}>
        📍 맵을 클릭하여 위치를 설정하세요
        {mapX != null && (
          <button onClick={handleClear} style={{
            marginLeft: 8, padding: '2px 8px', borderRadius: 8, border: 'none',
            background: 'rgba(186,26,26,0.1)', color: 'var(--error)', fontSize: 11, fontWeight: 600, cursor: 'pointer'
          }}>✕ 초기화</button>
        )}
      </div>
      <div
        ref={containerRef}
        onClick={handleMapClick}
        style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', cursor: 'crosshair', border: '2px solid var(--primary-light)' }}
      >
        <img
          ref={imgRef}
          src={mapImageUrl}
          alt="집 맵"
          style={{ width: '100%', display: 'block', maxHeight: 260, objectFit: 'contain', background: '#f8f8f8' }}
          draggable={false}
        />
        {mapX != null && mapY != null && (
          <div
            style={{
              position: 'absolute',
              left: `${mapX}%`,
              top: `${mapY}%`,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              width: 28, height: 28,
              borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
              background: 'var(--primary)', boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
              border: '2px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ transform: 'rotate(45deg)', fontSize: 12 }}>📦</span>
            </div>
          </div>
        )}
      </div>
      {mapX != null && (
        <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 6 }}>
          위치 설정됨: ({mapX.toFixed(1)}%, {mapY.toFixed(1)}%)
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
  const [houseData, setHouseData] = useState(null) // 맵 이미지 포함 집 정보
  const [selectedZone, setSelectedZone] = useState(null)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showMapView, setShowMapView] = useState(false) // 맵 뷰 토글
  const [editItem, setEditItem] = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [mapMarkerSaving, setMapMarkerSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', brand: '', model: '', barcode: '', quantity: 1, unit: 'EA',
    purchaseDate: '', purchasePrice: '', expiryDate: '', warrantyExpire: '',
    isConsumable: false, reorderLevel: '', status: 'ACTIVE',
    zone: null, category: null, description: '',
    mapX: null, mapY: null, locationDesc: ''
  })

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
    loadHouseData()
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

  const loadHouseData = async () => {
    try {
      const { data } = await api.get(`/houses/${selectedHouse.id}`)
      setHouseData(data.data)
    } catch (e) {}
  }

  const handleCommunityLink = (item, postType) => {
    const typeLabel = { SELL: '판매', FREE: '나눔', RENT: '대여' }[postType] || postType
    sessionStorage.setItem('communityDraft', JSON.stringify({
      postType, title: `${item.name} ${typeLabel}합니다`,
      content: `${item.name}${item.brand ? ` (${item.brand})` : ''} ${typeLabel}합니다.\n구역: ${item.zoneName || '-'}\n수량: ${item.quantity}${item.unit}\n상태: ${STATUS_MAP[item.status]?.label || item.status}`,
      price: postType === 'SELL' ? '' : '0', isNegotiable: postType === 'SELL', location: '', itemId: item.id
    }))
    navigate('/community')
    toast.success(`커뮤니티 ${typeLabel} 글 작성 화면으로 이동합니다.`)
  }

  const openCreate = () => {
    setEditItem(null)
    setForm({
      name: '', brand: '', model: '', barcode: '', quantity: 1, unit: 'EA',
      purchaseDate: '', purchasePrice: '', expiryDate: '', warrantyExpire: '',
      isConsumable: false, reorderLevel: '', status: 'ACTIVE', zone: null, category: null, description: '',
      mapX: null, mapY: null, locationDesc: ''
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
      description: item.description || '',
      mapX: item.mapX ?? null, mapY: item.mapY ?? null, locationDesc: item.locationDesc || ''
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
    } catch (e) { toast.error('삭제에 실패했습니다.') }
  }

  // 맵에서 직접 마커 저장 (상세 모달에서)
  const handleSaveMarkerFromDetail = async (item, newMapX, newMapY, newLocationDesc) => {
    setMapMarkerSaving(true)
    try {
      await api.patch(`/houses/${selectedHouse.id}/items/${item.id}/map`, {
        mapX: newMapX, mapY: newMapY, locationDesc: newLocationDesc
      })
      toast.success('위치가 저장되었습니다.')
      await loadAll()
      // 상세 모달 데이터 업데이트
      const updated = { ...item, mapX: newMapX, mapY: newMapY, locationDesc: newLocationDesc }
      setDetailItem(updated)
    } catch (e) { toast.error('위치 저장에 실패했습니다.') }
    finally { setMapMarkerSaving(false) }
  }

  const selectedZoneName = zones.find(z => z.id === selectedZone)?.name
  const filtered = items.filter(i => i.name.includes(search) || (i.brand || '').includes(search))
  const itemsWithMarker = items.filter(i => i.mapX != null && i.mapY != null)

  if (!selectedHouse) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--on-surface-variant)' }}>
        <MSI name="inventory_2" size={52} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 12px' }} />
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 700 }}>집을 먼저 선택해주세요</h3>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* ── Hero ── */}
      <div style={{ padding: '28px 20px 20px', background: 'var(--surface-container-lowest)' }}>
        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--on-surface)', marginBottom: 4 }}>
          Inventory Sanctuary
        </h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, lineHeight: 1.5 }}>
          집의 모든 물품을 스마트하게 관리하세요.
          {selectedZoneName && <span style={{ marginLeft: 6, color: 'var(--secondary)', fontWeight: 700 }}>— {selectedZoneName}</span>}
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <MSI name="search" size={18} color="var(--on-surface-variant)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
            <input
              className="form-input"
              style={{ paddingLeft: 40, borderRadius: 16 }}
              placeholder="물품명, 브랜드 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowMapView(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 14px',
              background: showMapView ? 'linear-gradient(135deg, #2196F3, #0D47A1)' : 'var(--surface-container-low)',
              color: showMapView ? 'white' : 'var(--on-surface-variant)',
              border: 'none', borderRadius: 16,
              fontWeight: 600, fontSize: 13, cursor: 'pointer', flexShrink: 0,
            }}
            title="맵 뷰"
          >
            <MSI name="map" size={16} />
          </button>
          <button
            onClick={openCreate}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 16px',
              background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
              color: 'white', border: 'none', borderRadius: 16,
              fontWeight: 600, fontSize: 13, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <MSI name="add_circle" size={16} />추가
          </button>
        </div>
      </div>

      {/* ── 맵 뷰 (토글) ── */}
      {showMapView && (
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 20, padding: '16px',
            border: '1px solid rgba(33,150,243,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #2196F3, #0D47A1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MSI name="map" fill size={14} color="white" />
              </div>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14 }}>물품 맵</div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                  위치 등록된 물품 {itemsWithMarker.length}개
                </div>
              </div>
            </div>
            {!houseData?.mapImageUrl ? (
              <div style={{ textAlign: 'center', padding: '24px', background: 'var(--surface-container-low)', borderRadius: 12, border: '2px dashed var(--outline-variant)' }}>
                <MSI name="map" size={36} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4 }}>맵 이미지 없음</div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>내집 관리에서 집 도면을 등록하세요</div>
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--outline-variant)' }}>
                  <img src={houseData.mapImageUrl} alt="집 맵" style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'contain', background: '#f8f8f8' }} draggable={false} />
                  {itemsWithMarker.map(item => (
                    <div
                      key={item.id}
                      onClick={() => openDetail(item)}
                      style={{
                        position: 'absolute',
                        left: `${item.mapX}%`, top: `${item.mapY}%`,
                        transform: 'translate(-50%, -100%)',
                        cursor: 'pointer', zIndex: 10,
                      }}
                      title={item.name}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
                        background: 'var(--primary)', boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
                        border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ transform: 'rotate(45deg)', fontSize: 12 }}>📦</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 8 }}>마커 클릭 시 물품 상세 정보를 볼 수 있어요</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Filter Chips ── */}
      <div style={{ padding: '12px 20px 0' }}>
        <div className="scroll-row" style={{ paddingBottom: 4 }}>
          {[
            { key: 'all', label: '전체', icon: 'inventory_2' },
            { key: 'expiring', label: '유통기한 임박', icon: 'schedule' },
            { key: 'reorder', label: '재주문 필요', icon: 'shopping_cart' },
          ].map(t => {
            const active = activeTab === t.key && !selectedZone
            return (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setSelectedZone(null) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 20, border: 'none', flexShrink: 0,
                  background: active ? 'var(--primary-container)' : 'var(--surface-container-lowest)',
                  color: active ? 'var(--primary)' : 'var(--on-surface-variant)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <MSI name={t.icon} fill={active} size={14} />{t.label}
              </button>
            )
          })}
          <div style={{ width: 1, height: 20, background: 'var(--outline-variant)', alignSelf: 'center', flexShrink: 0 }} />
          {zones.map(z => (
            <button
              key={z.id}
              onClick={() => { setSelectedZone(z.id); setActiveTab('all') }}
              style={{
                padding: '7px 14px', borderRadius: 20, border: 'none', flexShrink: 0,
                background: selectedZone === z.id ? 'var(--secondary-container)' : 'var(--surface-container-lowest)',
                color: selectedZone === z.id ? 'var(--secondary)' : 'var(--on-surface-variant)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >{z.name}{selectedZone === z.id ? ' ✓' : ''}</button>
          ))}
          {selectedZone && (
            <button
              onClick={() => setSelectedZone(null)}
              style={{ padding: '7px 12px', borderRadius: 20, border: 'none', flexShrink: 0, background: 'rgba(186,26,26,0.08)', color: 'var(--error)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >✕ 필터 해제</button>
          )}
        </div>
      </div>

      {/* ── Item List ── */}
      <div style={{ padding: '16px 20px 0' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--on-surface-variant)' }}>
            <MSI name="inventory_2" size={52} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>등록된 물품이 없습니다</div>
            <p style={{ fontSize: 13 }}>물품을 등록해보세요!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(item => {
              const isExpiring = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 14 * 86400000)
              const needsReorder = item.isConsumable && item.quantity <= (item.reorderLevel || 0)
              const hasMarker = item.mapX != null && item.mapY != null
              return (
                <div
                  key={item.id}
                  onClick={() => openDetail(item)}
                  style={{
                    background: 'var(--surface-container-lowest)',
                    borderRadius: 18, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer', transition: 'transform 0.15s',
                  }}
                  onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
                  onTouchEnd={e => e.currentTarget.style.transform = ''}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: 'var(--surface-container-low)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>
                    {CATEGORY_ICONS[item.categoryId] || '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                      {isExpiring && (
                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8, flexShrink: 0 }}>임박</span>
                      )}
                      {needsReorder && (
                        <span style={{ background: 'var(--error-container)', color: 'var(--error)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8, flexShrink: 0 }}>재주문</span>
                      )}
                      {hasMarker && (
                        <span style={{ background: 'rgba(33,150,243,0.1)', color: '#1565C0', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8, flexShrink: 0 }}>📍맵</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--on-surface-variant)', flexWrap: 'wrap' }}>
                      {item.brand && <span>{item.brand}</span>}
                      {item.zoneName && <span>· {item.zoneName}</span>}
                      <span>· {item.quantity}{item.unit}</span>
                      {item.locationDesc && <span>· 📍{item.locationDesc}</span>}
                    </div>
                    {item.purchaseDate && (() => {
                      const days = Math.floor((new Date() - new Date(item.purchaseDate)) / (1000 * 60 * 60 * 24))
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--on-surface-variant)' }}>
                            <MSI name="calendar_today" size={11} color="var(--on-surface-variant)" />
                            구매일 {item.purchaseDate}
                          </span>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            fontSize: 11, fontWeight: 600,
                            background: days > 365 ? '#fef3c7' : 'var(--surface-container-low)',
                            color: days > 365 ? '#92400e' : 'var(--on-surface-variant)',
                            padding: '2px 7px', borderRadius: 8,
                          }}>
                            <MSI name="timelapse" size={11} />
                            경과 {days.toLocaleString()}일
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                      background: item.status === 'ACTIVE' ? 'var(--secondary-container)' : item.status === 'BROKEN' ? 'var(--error-container)' : 'var(--surface-container-high)',
                      color: item.status === 'ACTIVE' ? 'var(--secondary)' : item.status === 'BROKEN' ? 'var(--error)' : 'var(--on-surface-variant)',
                    }}>{STATUS_MAP[item.status]?.label || item.status}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <CommunityLinkButton item={item} onSelect={handleCommunityLink} mini={true} />
                      <button
                        onClick={e => handleDelete(item.id, e)}
                        style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(186,26,26,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <MSI name="delete" size={13} color="var(--error)" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── 물품 상세 모달 ─── */}
      {showDetailModal && detailItem && (
        <DetailModal
          item={detailItem}
          houseData={houseData}
          mapMarkerSaving={mapMarkerSaving}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => openEdit(detailItem)}
          onDelete={() => { setShowDetailModal(false); handleDelete(detailItem.id) }}
          onCommunityLink={(type) => { setShowDetailModal(false); handleCommunityLink(detailItem, type) }}
          onSaveMarker={(x, y, desc) => handleSaveMarkerFromDetail(detailItem, x, y, desc)}
        />
      )}

      {/* ─── 물품 등록/수정 모달 ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editItem ? '물품 수정' : '새 물품 등록'}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><MSI name="close" size={18} color="var(--on-surface-variant)" /></button>
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
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">구매금액 (원)</label>
                    <input type="number" className="form-input" value={form.purchasePrice}
                      onChange={e => setForm({ ...form, purchasePrice: e.target.value })}
                      placeholder="0" min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">보증기간 만료일</label>
                    <input type="date" className="form-input" value={form.warrantyExpire}
                      onChange={e => setForm({ ...form, warrantyExpire: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <input type="checkbox" id="consumable" checked={form.isConsumable}
                    onChange={e => setForm({ ...form, isConsumable: e.target.checked })} />
                  <label htmlFor="consumable" style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
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

                {/* ── 맵 위치 설정 ── */}
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MSI name="map" size={16} color="var(--primary)" />
                    맵 위치 설정
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--on-surface-variant)' }}>(선택)</span>
                  </div>
                  <MapMarkerSelector
                    mapImageUrl={houseData?.mapImageUrl}
                    mapX={form.mapX}
                    mapY={form.mapY}
                    onChange={({ mapX, mapY }) => setForm(f => ({ ...f, mapX, mapY }))}
                  />
                  {houseData?.mapImageUrl && (
                    <div className="form-group" style={{ marginTop: 10 }}>
                      <label className="form-label">위치 설명</label>
                      <input
                        className="form-input"
                        value={form.locationDesc}
                        onChange={e => setForm({ ...form, locationDesc: e.target.value })}
                        placeholder="예: 거실 소파 옆, 주방 찬장 위..."
                      />
                    </div>
                  )}
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

// ─── 물품 상세 모달 (분리) ───
function DetailModal({ item, houseData, mapMarkerSaving, onClose, onEdit, onDelete, onCommunityLink, onSaveMarker }) {
  const [markerX, setMarkerX] = useState(item.mapX ?? null)
  const [markerY, setMarkerY] = useState(item.mapY ?? null)
  const [locationDesc, setLocationDesc] = useState(item.locationDesc || '')
  const [editingMarker, setEditingMarker] = useState(false)

  useEffect(() => {
    setMarkerX(item.mapX ?? null)
    setMarkerY(item.mapY ?? null)
    setLocationDesc(item.locationDesc || '')
  }, [item])

  const handleMapClick = (e) => {
    if (!editingMarker) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = parseFloat(((e.clientX - rect.left) / rect.width * 100).toFixed(2))
    const y = parseFloat(((e.clientY - rect.top) / rect.height * 100).toFixed(2))
    setMarkerX(x)
    setMarkerY(y)
  }

  const handleSave = () => {
    onSaveMarker(markerX, markerY, locationDesc)
    setEditingMarker(false)
  }

  const handleClear = () => {
    setMarkerX(null)
    setMarkerY(null)
    setLocationDesc('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{({ 1: '📺', 2: '🪑', 3: '🥕', 4: '🧴', 5: '👕', 6: '⚽', 7: '📦' })[item.categoryId] || '📦'}</span>
            <div>
              <div className="modal-title">{item.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>물품 상세 정보</div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><MSI name="close" size={18} color="var(--on-surface-variant)" /></button>
        </div>

        <div className="modal-body">
          {/* 상태 배지 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className={`badge ${{ ACTIVE: 'badge-active', BROKEN: 'badge-danger', DISCARDED: 'badge-gray', SOLD: 'badge-warning' }[item.status] || 'badge-gray'}`} style={{ fontSize: 13, padding: '4px 12px' }}>
              {{ ACTIVE: '보유중', BROKEN: '고장', DISCARDED: '폐기', SOLD: '판매됨' }[item.status] || item.status}
            </span>
            {item.zoneName && <span className="badge badge-info" style={{ fontSize: 13, padding: '4px 12px' }}>📍 {item.zoneName}</span>}
            {item.isConsumable && <span className="badge badge-warning" style={{ fontSize: 13, padding: '4px 12px' }}>🔄 소모품</span>}
            {(item.mapX != null || markerX != null) && <span style={{ fontSize: 13, padding: '4px 12px', background: 'rgba(33,150,243,0.1)', color: '#1565C0', borderRadius: 10, fontWeight: 600 }}>🗺️ 맵 위치 있음</span>}
          </div>

          {/* 정보 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', background: 'var(--surface)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            {[
              { label: '브랜드', value: item.brand },
              { label: '모델', value: item.model },
              { label: '수량', value: `${item.quantity} ${item.unit}` },
              { label: '구매일', value: item.purchaseDate },
              { label: '구매가격', value: item.purchasePrice ? `${Number(item.purchasePrice).toLocaleString()}원` : null },
              { label: '유통기한', value: item.expiryDate },
              { label: '보증만료', value: item.warrantyExpire },
              { label: '재주문 기준', value: item.reorderLevel ? `${item.reorderLevel}${item.unit} 이하` : null },
            ].filter(r => r.value).map(row => (
              <div key={row.label}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface)', marginTop: 2 }}>{row.value}</div>
              </div>
            ))}
          </div>

          {item.description && (
            <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>메모</div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{item.description}</div>
            </div>
          )}

          {/* ── 맵 위치 섹션 ── */}
          {houseData?.mapImageUrl && (
            <div style={{ background: 'rgba(33,150,243,0.05)', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid rgba(33,150,243,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1565C0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MSI name="map" fill size={16} color="#1565C0" />맵 위치
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!editingMarker ? (
                    <button onClick={() => setEditingMarker(true)} style={{
                      padding: '5px 12px', borderRadius: 8, border: 'none',
                      background: '#2196F3', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}>
                      {markerX != null ? '위치 수정' : '위치 등록'}
                    </button>
                  ) : (
                    <>
                      <button onClick={() => { setEditingMarker(false); setMarkerX(item.mapX ?? null); setMarkerY(item.mapY ?? null); setLocationDesc(item.locationDesc || '') }} style={{
                        padding: '5px 10px', borderRadius: 8, border: 'none',
                        background: 'var(--surface-container)', color: 'var(--on-surface-variant)', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                      }}>취소</button>
                      <button onClick={handleClear} style={{
                        padding: '5px 10px', borderRadius: 8, border: 'none',
                        background: 'rgba(186,26,26,0.1)', color: 'var(--error)', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                      }}>초기화</button>
                      <button onClick={handleSave} disabled={mapMarkerSaving} style={{
                        padding: '5px 12px', borderRadius: 8, border: 'none',
                        background: 'linear-gradient(135deg, #2196F3, #0D47A1)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        opacity: mapMarkerSaving ? 0.7 : 1
                      }}>
                        {mapMarkerSaving ? '저장중...' : '저장'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 맵 이미지 */}
              <div
                style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', cursor: editingMarker ? 'crosshair' : 'default', border: editingMarker ? '2px solid #2196F3' : '1px solid var(--outline-variant)' }}
                onClick={handleMapClick}
              >
                <img src={houseData.mapImageUrl} alt="집 맵" style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'contain', background: '#f8f8f8' }} draggable={false} />
                {markerX != null && markerY != null && (
                  <div style={{ position: 'absolute', left: `${markerX}%`, top: `${markerY}%`, transform: 'translate(-50%, -100%)', pointerEvents: 'none' }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
                      background: 'var(--primary)', boxShadow: '0 3px 8px rgba(0,0,0,0.3)', border: '2px solid white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ transform: 'rotate(45deg)', fontSize: 11 }}>📦</span>
                    </div>
                  </div>
                )}
                {editingMarker && (
                  <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 11, padding: '4px 10px', borderRadius: 20, pointerEvents: 'none' }}>
                    클릭하여 위치 설정
                  </div>
                )}
              </div>

              {/* 위치 설명 */}
              {editingMarker ? (
                <input
                  className="form-input"
                  style={{ marginTop: 10, fontSize: 13 }}
                  value={locationDesc}
                  onChange={e => setLocationDesc(e.target.value)}
                  placeholder="위치 설명 (예: 거실 소파 옆, 주방 찬장 위...)"
                />
              ) : (
                locationDesc && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--on-surface-variant)' }}>
                    📍 {locationDesc}
                  </div>
                )
              )}
            </div>
          )}

          {/* 커뮤니티 연계 */}
          <div style={{ background: 'var(--secondary-container)', borderRadius: 10, padding: 14, border: '1px solid #D1FAE5' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', marginBottom: 10 }}>🏪 커뮤니티에서 이 물품 거래하기</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { type: 'SELL', icon: '💰', label: '판매 글 올리기', bg: 'var(--primary-container)', color: 'var(--primary)', border: '#C7D2FE' },
                { type: 'FREE', icon: '🎁', label: '나눔 글 올리기', bg: '#FFF7ED', color: '#F59E0B', border: '#FDE68A' },
                { type: 'RENT', icon: '🔄', label: '대여 글 올리기', bg: '#FDF4FF', color: '#A855F7', border: '#E9D5FF' },
              ].map(opt => (
                <button key={opt.type}
                  onClick={() => onCommunityLink(opt.type)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                    border: `1.5px solid ${opt.border}`, background: opt.bg, color: opt.color,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
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
          <button className="btn btn-secondary" onClick={onDelete}>🗑️ 삭제</button>
          <button className="btn btn-secondary" onClick={onClose}>닫기</button>
          <button className="btn btn-primary" onClick={onEdit}>✏️ 수정</button>
        </div>
      </div>
    </div>
  )
}
