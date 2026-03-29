import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useHouseStore } from '../store/useStore'
import toast from 'react-hot-toast'

const DEVICE_TYPE_MAP = {
  LIGHT:        { icon: 'lightbulb',    label: '조명',     color: '#fff8e1', tc: '#f59e0b' },
  THERMOSTAT:   { icon: 'thermostat',   label: '온도조절', color: '#e3f2fd', tc: '#005b87' },
  LOCK:         { icon: 'lock',         label: '잠금장치', color: '#ffd9e4', tc: '#923357' },
  CAMERA:       { icon: 'nest_cam_wired_stand', label: '카메라', color: '#e8d5f0', tc: '#7b4fa6' },
  TV:           { icon: 'tv',           label: 'TV',       color: '#eceeef', tc: '#40493d' },
  AC:           { icon: 'air',          label: '에어컨',   color: '#cce8f4', tc: '#005b87' },
  WASHER:       { icon: 'local_laundry_service', label: '세탁기', color: '#b6f2be', tc: '#006e1c' },
  REFRIGERATOR: { icon: 'kitchen',      label: '냉장고',   color: '#cce8f4', tc: '#005b87' },
  OTHER:        { icon: 'smart_toy',    label: '기타',     color: '#f2f4f5', tc: '#40493d' },
}

const PLATFORM_LABELS = { SMARTTHINGS: 'SmartThings', GOOGLE_HOME: 'Google Home', APPLE_HOME: 'Apple Home', TUYA: 'Tuya', OTHER: '기타' }

function MSI({ name, fill = false, size = 24, color, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{
      fontSize: size,
      fontVariationSettings: fill ? `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' ${size}` : `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      color: color || 'inherit', lineHeight: 1, display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', ...style,
    }}>{name}</span>
  )
}

export default function IotPage() {
  const { selectedHouse } = useHouseStore()
  const [devices, setDevices] = useState([])
  const [zones, setZones] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', deviceType: 'LIGHT', manufacturer: '', model: '', platform: 'OTHER', zone: null })

  useEffect(() => { if (selectedHouse) loadAll() }, [selectedHouse])

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
    } catch (e) { toast.error('상태 변경 실패') }
  }

  const handleAdd = async e => {
    e.preventDefault()
    try {
      await api.post(`/houses/${selectedHouse.id}/iot`, form)
      toast.success('기기가 등록되었습니다!')
      setShowModal(false); loadAll()
    } catch (e) { toast.error('기기 등록 실패') }
  }

  const handleDelete = async (id) => {
    if (!confirm('기기를 삭제하시겠습니까?')) return
    try { await api.delete(`/houses/${selectedHouse.id}/iot/${id}`); toast.success('삭제되었습니다.'); loadAll() }
    catch (e) {}
  }

  const online = devices.filter(d => d.status === 'ONLINE').length

  if (!selectedHouse) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--on-surface-variant)' }}>
      <MSI name="smart_toy" size={52} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 12px' }} />
      <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 700 }}>집을 먼저 선택해주세요</h3>
    </div>
  )

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* ── Hero ── */}
      <div style={{ padding: '28px 20px 20px', background: 'var(--surface-container-lowest)' }}>
        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--on-surface)', marginBottom: 4 }}>
          Connected Devices
        </h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>
          스마트 생태계를 한 곳에서 관리하세요.
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {[
            { icon: 'wifi', label: '온라인', value: online, color: '#006e1c', bg: '#b6f2be' },
            { icon: 'wifi_off', label: '오프라인', value: devices.filter(d => d.status !== 'ONLINE' && d.status !== 'STANDBY').length, color: 'var(--on-surface-variant)', bg: 'var(--surface-container-low)' },
            { icon: 'bedtime', label: '대기', value: devices.filter(d => d.status === 'STANDBY').length, color: '#b45309', bg: '#ffedd5' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, background: 'var(--surface-container-low)', borderRadius: 14,
              padding: '12px 10px', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MSI name={s.icon} fill size={16} color={s.color} />
              </div>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 18, lineHeight: 1, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginTop: 1 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Automation Scenes ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>자동화 시나리오</div>
        <div className="grid-2">
          {[
            { icon: 'home_work', label: '귀가 모드', desc: '조명 켜기 + 에어컨', bg: '#cce8f4', color: '#005b87' },
            { icon: 'nightlight', label: '취침 모드', desc: '전체 조명 OFF + 잠금', bg: '#e8d5f0', color: '#7b4fa6' },
            { icon: 'directions_walk', label: '외출 모드', desc: '전원 차단 + 보안 ON', bg: '#ffedd5', color: '#b45309' },
            { icon: 'wb_sunny', label: '기상 모드', desc: '조명 서서히 켜기', bg: '#ffd9e4', color: '#923357' },
          ].map((s, i) => (
            <div
              key={i}
              onClick={() => toast('시나리오 실행 기능 준비 중!', { icon: '🚧' })}
              style={{
                background: 'var(--surface-container-lowest)',
                borderRadius: 16, padding: '16px', cursor: 'pointer',
                transition: 'transform 0.15s',
              }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
              onTouchEnd={e => e.currentTarget.style.transform = ''}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <MSI name={s.icon} fill size={20} color={s.color} />
              </div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Devices Bento Grid ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700 }}>기기 목록</span>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '8px 14px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              color: 'white', border: 'none', borderRadius: 20,
              fontWeight: 600, fontSize: 12, cursor: 'pointer',
            }}
          >
            <MSI name="add" size={16} />기기 추가
          </button>
        </div>

        {devices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--on-surface-variant)' }}>
            <MSI name="smart_toy" size={52} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>등록된 기기가 없습니다</div>
            <button onClick={() => setShowModal(true)} style={{ marginTop: 8, padding: '12px 24px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: 'white', border: 'none', borderRadius: 24, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              기기 등록하기
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {devices.map(d => {
              const dType = DEVICE_TYPE_MAP[d.deviceType] || DEVICE_TYPE_MAP.OTHER
              const isOnline = d.status === 'ONLINE'
              return (
                <div
                  key={d.id}
                  style={{
                    background: 'var(--surface-container-lowest)',
                    borderRadius: 20, padding: '16px 18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: dType.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <MSI name={dType.icon} fill size={22} color={dType.tc} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                          {dType.label} {d.manufacturer && `· ${d.manufacturer}`}
                          {d.zone && ` · ${d.zone.name}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Status badge */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: isOnline ? 'var(--secondary-container)' : 'var(--surface-container-high)',
                        color: isOnline ? 'var(--secondary)' : 'var(--on-surface-variant)',
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', boxShadow: isOnline ? '0 0 4px currentColor' : 'none' }} />
                        {isOnline ? '온라인' : d.status === 'STANDBY' ? '대기' : '오프라인'}
                      </span>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(d.id)}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(186,26,26,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <MSI name="close" size={14} color="var(--error)" />
                      </button>
                    </div>
                  </div>

                  {/* Toggle row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                      {PLATFORM_LABELS[d.platform] || d.platform}
                    </div>
                    {/* Toggle switch */}
                    <button
                      onClick={() => handleToggle(d)}
                      style={{
                        width: 44, height: 24, borderRadius: 12,
                        background: isOnline ? 'var(--secondary)' : 'var(--surface-container-high)',
                        border: 'none', cursor: 'pointer',
                        position: 'relative', transition: 'background 0.2s',
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        width: 18, height: 18, borderRadius: '50%',
                        background: 'white',
                        top: 3, left: isOnline ? 23 : 3,
                        transition: 'left 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      }} />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Add device card */}
            <div
              onClick={() => setShowModal(true)}
              style={{
                border: '2px dashed rgba(64,73,61,0.2)',
                borderRadius: 20, padding: '20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              <MSI name="add_circle" size={28} color="var(--on-surface-variant)" />
              <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--on-surface)' }}>기기 추가</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Automation Banner ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
          borderRadius: 24, padding: '20px 20px',
          position: 'relative', overflow: 'hidden',
          color: 'white',
        }}>
          <div style={{ position: 'absolute', top: -10, right: -20, opacity: 0.1 }}>
            <MSI name="auto_awesome" size={100} color="white" />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.8, marginBottom: 6 }}>
              Recommended Automation
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              "Good Night" Scene
            </div>
            <p style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.6, marginBottom: 14 }}>
              온도 낮추기, 문 잠금, 조명 10%로 한 번에 설정하세요.
            </p>
            <button
              onClick={() => toast('씬 활성화 기능 준비 중!', { icon: '🚧' })}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 16, color: 'white',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              Scene 활성화
            </button>
          </div>
        </div>
      </div>

      {/* ── Add Device Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <div className="modal-title">IoT 기기 등록</div>
              <button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-container-low)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MSI name="close" size={18} color="var(--on-surface-variant)" />
              </button>
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
                      {Object.entries(DEVICE_TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
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
                      {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
                <button type="submit" className="btn btn-primary btn-block">등록</button>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
