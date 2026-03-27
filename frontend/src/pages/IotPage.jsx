import { useState, useEffect } from 'react'
import { Plus, Wifi, WifiOff, X } from 'lucide-react'
import api from '../api/axios'
import { useHouseStore } from '../store/useStore'
import toast from 'react-hot-toast'

const DEVICE_ICONS = { LIGHT: '💡', THERMOSTAT: '🌡️', LOCK: '🔒', CAMERA: '📹', TV: '📺', AC: '❄️', WASHER: '🫧', REFRIGERATOR: '🧊', OTHER: '🔌' }
const DEVICE_LABELS = { LIGHT: '조명', THERMOSTAT: '온도조절', LOCK: '잠금장치', CAMERA: '카메라', TV: 'TV', AC: '에어컨', WASHER: '세탁기', REFRIGERATOR: '냉장고', OTHER: '기타' }
const PLATFORM_ICONS = { SMARTTHINGS: '🌐', GOOGLE_HOME: '🏠', APPLE_HOME: '🍎', TUYA: '💡', OTHER: '🔌' }

export default function IotPage() {
  const { selectedHouse } = useHouseStore()
  const [devices, setDevices] = useState([])
  const [zones, setZones] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', deviceType: 'LIGHT', manufacturer: '', model: '', platform: 'OTHER', zone: null })

  useEffect(() => {
    if (!selectedHouse) return
    loadAll()
  }, [selectedHouse])

  const loadAll = async () => {
    try {
      const [devRes, zoneRes] = await Promise.all([
        api.get(`/houses/${selectedHouse.id}/iot`),
        api.get(`/houses/${selectedHouse.id}/zones`)
      ])
      setDevices(devRes.data.data)
      setZones(zoneRes.data.data)
    } catch (e) {}
  }

  const handleToggle = async (device) => {
    const newStatus = device.status === 'ONLINE' ? 'STANDBY' : 'ONLINE'
    try {
      await api.patch(`/houses/${selectedHouse.id}/iot/${device.id}/status`, { status: newStatus })
      loadAll()
    } catch (e) {
      toast.error('상태 변경 실패')
    }
  }

  const handleAdd = async e => {
    e.preventDefault()
    try {
      await api.post(`/houses/${selectedHouse.id}/iot`, form)
      toast.success('기기가 등록되었습니다!')
      setShowModal(false)
      loadAll()
    } catch (e) {
      toast.error('기기 등록 실패')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('기기를 삭제하시겠습니까?')) return
    try {
      await api.delete(`/houses/${selectedHouse.id}/iot/${id}`)
      toast.success('삭제되었습니다.')
      loadAll()
    } catch (e) {}
  }

  const online = devices.filter(d => d.status === 'ONLINE').length
  const offline = devices.filter(d => d.status === 'OFFLINE').length
  const standby = devices.filter(d => d.status === 'STANDBY').length

  if (!selectedHouse) return <div className="empty-state"><div className="empty-state-icon">🔌</div><h3>집을 먼저 선택해주세요</h3></div>

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>IoT 기기 관리</h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>총 {devices.length}개 기기</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> 기기 추가</button>
      </div>

      {/* 요약 통계 */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#DCFCE7' }}><Wifi size={22} color="var(--secondary)" /></div>
          <div><div className="stat-value" style={{ color: 'var(--secondary)' }}>{online}</div><div className="stat-label">온라인</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#F1F5F9' }}><WifiOff size={22} color="var(--text-muted)" /></div>
          <div><div className="stat-value" style={{ color: 'var(--text-muted)' }}>{offline}</div><div className="stat-label">오프라인</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEF3C7' }}>💤</div>
          <div><div className="stat-value" style={{ color: '#F59E0B' }}>{standby}</div><div className="stat-label">대기중</div></div>
        </div>
      </div>

      {/* 시나리오 카드 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>⚡ 자동화 시나리오</div>
        <div className="grid-4">
          {[
            { icon: '🏠', label: '귀가 모드', desc: '조명 켜기 + 에어컨 ON', color: 'var(--primary-container)' },
            { icon: '🌙', label: '취침 모드', desc: '전체 조명 OFF + 잠금', color: '#F5F3FF' },
            { icon: '🚪', label: '외출 모드', desc: '전원 차단 + 보안 ON', color: '#FFF7ED' },
            { icon: '☀️', label: '기상 모드', desc: '조명 서서히 켜기', color: 'var(--secondary-container)' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.color, borderRadius: 12, padding: 16, cursor: 'pointer' }}
              onClick={() => toast('시나리오 실행 기능 준비 중!', { icon: '🚧' })}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 기기 목록 */}
      {devices.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🔌</div><h3>등록된 기기가 없습니다</h3>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>기기 등록하기</button></div>
      ) : (
        <div className="grid-3">
          {devices.map(d => (
            <div key={d.id} className={`iot-card ${d.status === 'ONLINE' ? 'online' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ fontSize: 36 }}>{DEVICE_ICONS[d.deviceType]}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${d.status === 'ONLINE' ? 'badge-active' : d.status === 'STANDBY' ? 'badge-warning' : 'badge-gray'}`}>
                    {d.status === 'ONLINE' ? '온라인' : d.status === 'STANDBY' ? '대기' : '오프라인'}
                  </span>
                  <button className="btn-icon" style={{ color: '#EF4444', fontSize: 12 }}
                    onClick={() => handleDelete(d.id)}>×</button>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 4 }}>{DEVICE_LABELS[d.deviceType]} {d.manufacturer && `· ${d.manufacturer}`}</div>
              {d.zone && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>📍 {d.zone.name}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{PLATFORM_ICONS[d.platform]} {d.platform}</span>
                <button className={`iot-toggle ${d.status === 'ONLINE' ? 'on' : ''}`}
                  onClick={() => handleToggle(d)}
                  title={d.status === 'ONLINE' ? '끄기' : '켜기'} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 기기 등록 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">IoT 기기 등록</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">기기 이름 *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="거실 조명" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">기기 유형</label>
                    <select className="form-select" value={form.deviceType} onChange={e => setForm({ ...form, deviceType: e.target.value })}>
                      {Object.entries(DEVICE_LABELS).map(([k, v]) => <option key={k} value={k}>{DEVICE_ICONS[k]} {v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">제조사</label>
                    <input className="form-input" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} placeholder="삼성, LG..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">플랫폼</label>
                    <select className="form-select" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                      {[['SMARTTHINGS', 'SmartThings'], ['GOOGLE_HOME', 'Google Home'], ['APPLE_HOME', 'Apple Home'], ['TUYA', 'Tuya'], ['OTHER', '기타']].map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">구역</label>
                  <select className="form-select" value={form.zone?.id || ''} onChange={e => setForm({ ...form, zone: e.target.value ? { id: parseInt(e.target.value) } : null })}>
                    <option value="">구역 선택</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
