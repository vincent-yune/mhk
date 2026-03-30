import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useHouseStore } from '../store/useStore'
import toast from 'react-hot-toast'

const HOUSE_TYPES = { APARTMENT: '아파트', HOUSE: '주택', VILLA: '빌라', OFFICETEL: '오피스텔', OTHER: '기타' }
const HOUSE_TYPE_ICONS = { APARTMENT: 'apartment', HOUSE: 'home', VILLA: 'holiday_village', OFFICETEL: 'business', OTHER: 'cottage' }
const THEMES = { DEFAULT: '기본', MODERN: '모던', NATURAL: '자연', VINTAGE: '빈티지', MINIMAL: '미니멀' }

const ZONE_TYPE_MAP = {
  LIVING_ROOM: { icon: 'weekend', label: '거실', color: '#cce8f4', tc: '#005b87' },
  KITCHEN: { icon: 'restaurant', label: '주방', color: '#b6f2be', tc: '#006e1c' },
  BEDROOM: { icon: 'bed', label: '침실', color: '#ffd9e4', tc: '#923357' },
  BATHROOM: { icon: 'shower', label: '욕실', color: '#cce8f4', tc: '#005b87' },
  STUDY: { icon: 'menu_book', label: '서재', color: '#e8d5f0', tc: '#7b4fa6' },
  BALCONY: { icon: 'grass', label: '베란다', color: '#b6f2be', tc: '#006e1c' },
  GARAGE: { icon: 'garage', label: '차고', color: '#ffedd5', tc: '#b45309' },
  OTHER: { icon: 'inventory_2', label: '기타', color: '#f1f3f4', tc: '#40493d' }
}

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

// ─── 맵 마커 뷰어 컴포넌트 ───
function HouseMapView({ house, items, devices }) {
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'items' | 'devices'
  const [selectedMarker, setSelectedMarker] = useState(null)
  const mapRef = useRef(null)

  const itemMarkers = (items || []).filter(i => i.mapX != null && i.mapY != null)
  const deviceMarkers = (devices || []).filter(d => d.mapX != null && d.mapY != null)

  const allMarkers = [
    ...itemMarkers.map(i => ({ ...i, _type: 'item' })),
    ...deviceMarkers.map(d => ({ ...d, _type: 'device' })),
  ]
  const visibleMarkers = activeFilter === 'items' ? allMarkers.filter(m => m._type === 'item')
    : activeFilter === 'devices' ? allMarkers.filter(m => m._type === 'device')
    : allMarkers

  if (!house?.mapImageUrl) {
    return (
      <div style={{
        background: 'var(--surface-container-low)',
        borderRadius: 20, padding: '32px 20px',
        textAlign: 'center', color: 'var(--on-surface-variant)',
        border: '2px dashed var(--outline-variant)',
      }}>
        <MSI name="map" size={44} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 12px' }} />
        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>맵 이미지가 없습니다</div>
        <p style={{ fontSize: 12, lineHeight: 1.6 }}>집 도면이나 평면도 이미지를 업로드하면<br />물품과 기기의 위치를 맵에 표시할 수 있어요.</p>
      </div>
    )
  }

  return (
    <div>
      {/* 필터 탭 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          { key: 'all', label: `전체 (${allMarkers.length})`, icon: 'location_on' },
          { key: 'items', label: `물품 (${itemMarkers.length})`, icon: 'inventory_2' },
          { key: 'devices', label: `기기 (${deviceMarkers.length})`, icon: 'devices' },
        ].map(f => (
          <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 16, border: 'none', flexShrink: 0,
            background: activeFilter === f.key ? 'var(--primary-container)' : 'var(--surface-container-low)',
            color: activeFilter === f.key ? 'var(--primary)' : 'var(--on-surface-variant)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <MSI name={f.icon} fill={activeFilter === f.key} size={13} />{f.label}
          </button>
        ))}
      </div>

      {/* 맵 영역 */}
      <div ref={mapRef} style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--outline-variant)' }}>
        <img
          src={house.mapImageUrl}
          alt="집 맵"
          style={{ width: '100%', display: 'block', maxHeight: 400, objectFit: 'contain', background: '#f8f8f8' }}
          draggable={false}
        />
        {/* 마커들 */}
        {visibleMarkers.map(marker => (
          <div
            key={`${marker._type}-${marker.id}`}
            onClick={e => { e.stopPropagation(); setSelectedMarker(selectedMarker?.id === marker.id && selectedMarker?._type === marker._type ? null : marker) }}
            style={{
              position: 'absolute',
              left: `${marker.mapX}%`,
              top: `${marker.mapY}%`,
              transform: 'translate(-50%, -100%)',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            {/* 마커 핀 */}
            <div style={{
              width: 32, height: 32, borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              background: marker._type === 'item' ? 'var(--primary)' : '#e65100',
              boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid white',
              transition: 'transform 0.15s',
            }}>
              <span style={{ transform: 'rotate(45deg)', fontSize: 14 }}>
                {marker._type === 'item' ? '📦' : '💡'}
              </span>
            </div>
          </div>
        ))}
        {/* 선택된 마커 팝업 */}
        {selectedMarker && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(Math.max(selectedMarker.mapX, 15), 85)}%`,
              top: `${Math.max(selectedMarker.mapY - 5, 5)}%`,
              transform: 'translate(-50%, -100%)',
              background: 'white',
              borderRadius: 12,
              padding: '10px 14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              zIndex: 20,
              minWidth: 140,
              maxWidth: 200,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{selectedMarker.name}</div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                  {selectedMarker._type === 'item' ? '📦 물품' : '💡 기기'}
                  {selectedMarker.zoneName && ` · ${selectedMarker.zoneName}`}
                </div>
                {selectedMarker.locationDesc && (
                  <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 4, fontStyle: 'italic' }}>
                    📍 {selectedMarker.locationDesc}
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedMarker(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                <MSI name="close" size={14} color="var(--on-surface-variant)" />
              </button>
            </div>
          </div>
        )}
        {/* 맵 클릭 시 팝업 닫기 */}
        <div style={{ position: 'absolute', inset: 0 }} onClick={() => setSelectedMarker(null)} />
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--on-surface-variant)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} /> 물품
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e65100' }} /> 기기
        </div>
        <div style={{ marginLeft: 'auto' }}>마커 클릭 시 상세 정보</div>
      </div>
    </div>
  )
}

export default function HousePage() {
  const { houses, setHouses, selectedHouse, selectHouse, setPendingZoneFilter } = useHouseStore()
  const navigate = useNavigate()
  const [zones, setZones] = useState([])
  const [mapItems, setMapItems] = useState([])
  const [mapDevices, setMapDevices] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showMapSection, setShowMapSection] = useState(false)
  const [editHouse, setEditHouse] = useState(null)
  const [mapUploading, setMapUploading] = useState(false)
  const mapFileRef = useRef(null)
  const [form, setForm] = useState({ name: '우리집', houseType: 'APARTMENT', address: '', area: '', floor: '', rooms: 1, bathrooms: 1, theme: 'DEFAULT' })

  useEffect(() => { loadHouses() }, [])
  useEffect(() => {
    if (selectedHouse) {
      loadZones()
      loadMapData()
    }
  }, [selectedHouse])

  const loadHouses = async () => {
    try { const { data } = await api.get('/houses'); setHouses(data.data) }
    catch (e) { toast.error('집 정보를 불러오지 못했습니다.') }
  }

  const loadZones = async () => {
    try { const { data } = await api.get(`/houses/${selectedHouse.id}/zones`); setZones(data.data) }
    catch (e) {}
  }

  const loadMapData = async () => {
    try {
      const [itemsRes, devicesRes] = await Promise.all([
        api.get(`/houses/${selectedHouse.id}/items`),
        api.get(`/houses/${selectedHouse.id}/iot`),
      ])
      setMapItems(itemsRes.data.data || [])
      setMapDevices(devicesRes.data.data || [])
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

  // 맵 이미지 업로드
  const handleMapImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('이미지는 5MB 이하만 업로드 가능합니다.'); return }
    setMapUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await api.post(`/houses/${selectedHouse.id}/map-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('맵 이미지가 업로드되었습니다!')
      await loadHouses()
    } catch (e) {
      toast.error('이미지 업로드에 실패했습니다.')
    } finally {
      setMapUploading(false)
      e.target.value = ''
    }
  }

  // 맵 이미지 삭제
  const handleMapImageDelete = async () => {
    if (!confirm('맵 이미지를 삭제하시겠습니까?')) return
    try {
      await api.delete(`/houses/${selectedHouse.id}/map-image`)
      toast.success('맵 이미지가 삭제되었습니다.')
      await loadHouses()
    } catch (e) { toast.error('삭제에 실패했습니다.') }
  }

  const handleZoneClick = (zone) => {
    setPendingZoneFilter({ zoneId: zone.id, zoneName: zone.name })
    navigate('/items')
  }

  // selectedHouse 업데이트 (houses 목록 reload 후 동기화)
  useEffect(() => {
    if (selectedHouse && houses.length > 0) {
      const updated = houses.find(h => h.id === selectedHouse.id)
      if (updated && updated.mapImageUrl !== selectedHouse.mapImageUrl) {
        selectHouse(updated)
      }
    }
  }, [houses])

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

        {/* House info grid */}
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

      {/* ── 맵 관리 섹션 ── */}
      {selectedHouse && (
        <div style={{ padding: '20px 20px 0' }}>
          {/* 섹션 헤더 */}
          <div
            onClick={() => setShowMapSection(v => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showMapSection ? 16 : 0, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2196F3, #0D47A1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MSI name="map" fill size={16} color="white" />
              </div>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700 }}>집 맵 관리</div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                  {selectedHouse.mapImageUrl ? '맵 등록됨 · 클릭하여 보기' : '도면/평면도 이미지를 등록하세요'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {selectedHouse.mapImageUrl && (
                <span style={{ fontSize: 11, background: 'var(--primary-container)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 10, fontWeight: 600 }}>
                  맵 있음
                </span>
              )}
              <MSI name={showMapSection ? 'expand_less' : 'expand_more'} size={20} color="var(--on-surface-variant)" />
            </div>
          </div>

          {showMapSection && (
            <div>
              {/* 맵 이미지 컨트롤 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input
                  ref={mapFileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleMapImageUpload}
                />
                <button
                  onClick={() => mapFileRef.current?.click()}
                  disabled={mapUploading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #2196F3, #0D47A1)',
                    color: 'white', fontSize: 13, fontWeight: 600, cursor: mapUploading ? 'not-allowed' : 'pointer',
                    opacity: mapUploading ? 0.7 : 1,
                  }}
                >
                  <MSI name={mapUploading ? 'hourglass_empty' : 'upload'} size={15} />
                  {mapUploading ? '업로드 중...' : (selectedHouse.mapImageUrl ? '맵 교체' : '맵 업로드')}
                </button>
                {selectedHouse.mapImageUrl && (
                  <button
                    onClick={handleMapImageDelete}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 12,
                      border: '1px solid rgba(186,26,26,0.3)', background: 'rgba(186,26,26,0.06)',
                      color: 'var(--error)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <MSI name="delete" size={15} />맵 삭제
                  </button>
                )}
                <button
                  onClick={loadMapData}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 12,
                    border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)',
                    color: 'var(--on-surface-variant)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <MSI name="refresh" size={15} />새로고침
                </button>
              </div>

              {/* 맵 뷰어 */}
              <HouseMapView
                house={selectedHouse}
                items={mapItems}
                devices={mapDevices}
              />

              {/* 안내 */}
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(33,150,243,0.06)', borderRadius: 10, border: '1px solid rgba(33,150,243,0.15)' }}>
                <div style={{ fontSize: 11, color: '#1565C0', lineHeight: 1.7 }}>
                  💡 <strong>물품 · 기기 등록 시</strong> 맵에서 위치를 클릭하면 마커가 표시됩니다.<br />
                  물품 추가 시 "맵 위치 설정" 옵션을 이용하세요.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
                        {h.mapImageUrl && (
                          <span style={{ marginLeft: 6, background: 'rgba(33,150,243,0.1)', color: '#1565C0', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                            🗺️ 맵
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 19, top: 8, bottom: 8, width: 2, background: 'var(--surface-container-high)' }} />
            {zones.map((z) => {
              const zType = ZONE_TYPE_MAP[z.zoneType] || ZONE_TYPE_MAP.OTHER
              return (
                <div
                  key={z.id}
                  style={{ position: 'relative', paddingLeft: 48, paddingBottom: 16, cursor: 'pointer' }}
                  onClick={() => handleZoneClick(z)}
                >
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
