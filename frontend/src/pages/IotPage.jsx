import { useState, useEffect, useCallback } from 'react'
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

const PLATFORM_LABELS = {
  SMARTTHINGS: 'SmartThings',
  GOOGLE_HOME: 'Google Home',
  APPLE_HOME: 'Apple Home',
  TUYA: 'Tuya',
  OTHER: '기타'
}

function MSI({ name, fill = false, size = 24, color, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{
      fontSize: size,
      fontVariationSettings: fill
        ? `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`
        : `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      color: color || 'inherit', lineHeight: 1,
      display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', ...style,
    }}>{name}</span>
  )
}

// ── SmartThings 연결 모달 ──────────────────────────────────────────────────────
function SmartThingsConnectModal({ onClose, onConnected }) {
  const [pat, setPat] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: 안내, 2: 토큰입력

  const handleConnect = async (e) => {
    e.preventDefault()
    if (!pat.trim()) return toast.error('PAT 토큰을 입력해주세요.')
    setLoading(true)
    try {
      const res = await api.post('/smartthings/connect', { token: pat.trim() })
      toast.success(res.data.message || 'SmartThings 연결 완료!')
      onConnected()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'SmartThings 연결 실패. 토큰을 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Samsung Logo */}
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #1428A0, #1e3a8a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 13, fontFamily: 'Manrope, sans-serif' }}>S</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 16 }}>
                Samsung SmartThings
              </div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>삼성 가전 연동</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--surface-container-low)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MSI name="close" size={18} color="var(--on-surface-variant)" />
          </button>
        </div>

        {step === 1 ? (
          /* 안내 화면 */
          <div style={{ padding: 20 }}>
            <div style={{
              background: 'linear-gradient(135deg, #1428A0 0%, #1e3a8a 100%)',
              borderRadius: 20, padding: 20, marginBottom: 20,
              color: 'white', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, fontSize: 80 }}>🏠</div>
              <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6 }}>
                Samsung SmartThings
              </div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
                삼성 스마트홈을<br />MyHouse와 연결하세요
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.7 }}>
                냉장고, 세탁기, 에어컨, TV 등<br />
                삼성 가전을 한 곳에서 제어하세요
              </div>
            </div>

            {/* 지원 기기 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
                지원 삼성 가전
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { icon: 'kitchen', label: '냉장고', desc: 'Family Hub' },
                  { icon: 'local_laundry_service', label: '세탁기', desc: 'AI 세탁기' },
                  { icon: 'air', label: '에어컨', desc: '비스포크 AI' },
                  { icon: 'tv', label: 'TV', desc: 'QLED / OLED' },
                  { icon: 'whatshot', label: '오븐', desc: '비스포크 큐커' },
                  { icon: 'cleaning_services', label: '청소기', label2: '제트봇 AI' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    background: 'var(--surface-container-low)',
                    borderRadius: 12,
                  }}>
                    <MSI name={item.icon} fill size={20} color="#1428A0" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>{item.desc || item.label2}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 연결 방법 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                연결 방법
              </div>
              {[
                { step: '1', text: 'Samsung 계정으로 SmartThings 앱 로그인' },
                { step: '2', text: 'SmartThings 개발자 콘솔에서 Personal Access Token 발급' },
                { step: '3', text: '발급받은 PAT를 MyHouse에 등록' },
              ].map((s) => (
                <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#1428A0', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>{s.step}</div>
                  <div style={{ fontSize: 13, color: 'var(--on-surface)', paddingTop: 3 }}>{s.text}</div>
                </div>
              ))}
            </div>

            <a
              href="https://account.smartthings.com/tokens"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '12px', marginBottom: 12,
                background: 'var(--surface-container-low)',
                borderRadius: 12, textDecoration: 'none',
                color: '#1428A0', fontWeight: 700, fontSize: 13,
                border: '1px solid rgba(20,40,160,0.2)',
              }}
            >
              <MSI name="open_in_new" size={16} color="#1428A0" />
              SmartThings PAT 발급하기
            </a>

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%', padding: 14,
                background: 'linear-gradient(135deg, #1428A0, #1e3a8a)',
                color: 'white', border: 'none', borderRadius: 14,
                fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              PAT 토큰으로 연결하기 →
            </button>
          </div>
        ) : (
          /* 토큰 입력 화면 */
          <form onSubmit={handleConnect} style={{ padding: 20 }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--on-surface-variant)', fontSize: 13, marginBottom: 16, padding: 0,
              }}
            >
              <MSI name="arrow_back" size={16} /> 뒤로
            </button>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
                PAT 토큰 입력
              </div>
              <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                SmartThings 개발자 콘솔에서 발급받은<br />
                Personal Access Token을 입력해주세요.
              </div>
            </div>

            {/* PAT 발급 링크 */}
            <div style={{
              background: '#eff6ff', borderRadius: 12, padding: 14,
              marginBottom: 20, border: '1px solid rgba(20,40,160,0.15)',
            }}>
              <div style={{ fontSize: 11, color: '#1428A0', fontWeight: 700, marginBottom: 6 }}>
                📋 PAT 발급 방법
              </div>
              <div style={{ fontSize: 12, color: '#1e3a8a', lineHeight: 1.7 }}>
                1. <a href="https://account.smartthings.com/tokens" target="_blank" rel="noopener noreferrer" style={{ color: '#1428A0', fontWeight: 700 }}>account.smartthings.com/tokens</a> 접속<br />
                2. "Generate new token" 클릭<br />
                3. 모든 권한 체크 후 토큰 생성<br />
                4. 생성된 토큰 복사 후 아래에 붙여넣기
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                Personal Access Token *
              </label>
              <textarea
                value={pat}
                onChange={e => setPat(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid var(--outline-variant)',
                  borderRadius: 12, fontSize: 13,
                  fontFamily: 'monospace',
                  resize: 'none', outline: 'none',
                  background: 'var(--surface-container-low)',
                  boxSizing: 'border-box',
                }}
                required
              />
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 6 }}>
                ⚠️ 토큰은 암호화되어 안전하게 저장됩니다.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !pat.trim()}
              style={{
                width: '100%', padding: 14,
                background: loading || !pat.trim() ? 'var(--surface-container-high)' : 'linear-gradient(135deg, #1428A0, #1e3a8a)',
                color: loading || !pat.trim() ? 'var(--on-surface-variant)' : 'white',
                border: 'none', borderRadius: 14,
                fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14,
                cursor: loading || !pat.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    display: 'inline-block', animation: 'spin 0.8s linear infinite',
                  }} />
                  연결 중...
                </>
              ) : (
                <>
                  <MSI name="link" size={18} />
                  SmartThings 연결
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── SmartThings 기기 선택 모달 ────────────────────────────────────────────────
function SmartThingsImportModal({ onClose, onImported, houseId }) {
  const [stDevices, setStDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { loadStDevices() }, [])

  const loadStDevices = async () => {
    setLoading(true)
    try {
      const res = await api.get('/smartthings/devices')
      setStDevices(res.data.data || [])
    } catch (err) {
      toast.error('SmartThings 기기 목록 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (device) => {
    setImporting(device.deviceId)
    try {
      await api.post(`/smartthings/devices/${device.deviceId}/import`, { houseId })
      toast.success(`'${device.label || device.name}' 연결 완료!`)
      onImported()
    } catch (err) {
      toast.error(err.response?.data?.message || '기기 연결 실패')
    } finally {
      setImporting(null)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await api.post(`/smartthings/sync/${houseId}`)
      toast.success(res.data.message || '동기화 완료!')
      onImported()
      onClose()
    } catch (err) {
      toast.error('동기화 실패')
    } finally {
      setSyncing(false)
    }
  }

  const dType = (typeIcon) => DEVICE_TYPE_MAP[typeIcon] || DEVICE_TYPE_MAP.OTHER

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
        <div className="modal-handle" />
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #1428A0, #1e3a8a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 11, fontFamily: 'Manrope, sans-serif' }}>S</span>
            </div>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 16 }}>
              SmartThings 기기 가져오기
            </span>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-container-low)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MSI name="close" size={18} color="var(--on-surface-variant)" />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
              <div style={{
                width: 32, height: 32, border: '3px solid var(--surface-container-high)',
                borderTopColor: '#1428A0', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }} />
              <div style={{ fontSize: 14 }}>Samsung SmartThings에서<br />기기 목록 불러오는 중...</div>
            </div>
          ) : stDevices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
              <MSI name="devices_other" size={48} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 15 }}>
                연결된 삼성 기기 없음
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                SmartThings 앱에서 기기를 먼저 등록해주세요.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 4 }}>
                SmartThings에서 {stDevices.length}개 기기 발견
              </div>
              {stDevices.map(device => {
                const dt = dType(device.deviceTypeIcon)
                const isImporting = importing === device.deviceId
                return (
                  <div key={device.deviceId} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    background: 'var(--surface-container-low)',
                    borderRadius: 16,
                    border: '1px solid rgba(20,40,160,0.08)',
                  }}>
                    {/* Device icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: dt.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <MSI name={dt.icon} fill size={22} color={dt.tc} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13,
                        marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {device.label || device.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                        {dt.label}
                        {device.manufacturer && ` · ${device.manufacturer}`}
                        {device.model && ` · ${device.model}`}
                      </div>
                      {/* SmartThings badge */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        marginTop: 4, padding: '2px 8px',
                        background: 'rgba(20,40,160,0.08)', borderRadius: 20,
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1428A0' }} />
                        <span style={{ fontSize: 9, color: '#1428A0', fontWeight: 700 }}>SmartThings</span>
                      </div>
                    </div>

                    {/* Connect button */}
                    <button
                      onClick={() => handleImport(device)}
                      disabled={isImporting}
                      style={{
                        flexShrink: 0,
                        padding: '8px 14px',
                        background: isImporting ? 'var(--surface-container-high)' : 'linear-gradient(135deg, #1428A0, #1e3a8a)',
                        color: isImporting ? 'var(--on-surface-variant)' : 'white',
                        border: 'none', borderRadius: 12,
                        fontWeight: 700, fontSize: 12, cursor: isImporting ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      {isImporting ? (
                        <span style={{
                          width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white', borderRadius: '50%',
                          display: 'inline-block', animation: 'spin 0.8s linear infinite',
                        }} />
                      ) : (
                        <>
                          <MSI name="add_link" size={14} />
                          연결
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              flex: 1, padding: 12,
              background: syncing ? 'var(--surface-container-high)' : 'linear-gradient(135deg, #1428A0, #1e3a8a)',
              color: syncing ? 'var(--on-surface-variant)' : 'white',
              border: 'none', borderRadius: 12,
              fontWeight: 700, fontSize: 13, cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {syncing ? '동기화 중...' : (
              <><MSI name="sync" size={16} />상태 동기화</>
            )}
          </button>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 기기 제어 모달 ─────────────────────────────────────────────────────────────
function DeviceControlModal({ device, onClose, onUpdated }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [commanding, setCommanding] = useState(false)

  useEffect(() => {
    if (device.smartThingsDeviceId) loadStatus()
  }, [device])

  const loadStatus = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/smartthings/devices/${device.smartThingsDeviceId}/status`)
      setStatus(res.data.data)
    } catch (e) {
      console.warn('상태 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  const sendCommand = async (capability, command, args = []) => {
    setCommanding(true)
    try {
      await api.post(`/smartthings/devices/${device.smartThingsDeviceId}/command`, {
        capability, command, arguments: args,
      })
      toast.success('명령 전송 완료!')
      setTimeout(() => { loadStatus(); onUpdated() }, 1000)
    } catch (err) {
      toast.error(err.response?.data?.message || '명령 전송 실패')
    } finally {
      setCommanding(false)
    }
  }

  const dType = DEVICE_TYPE_MAP[device.deviceType] || DEVICE_TYPE_MAP.OTHER
  const isConnected = !!device.smartThingsDeviceId

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: dType.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MSI name={dType.icon} fill size={22} color={dType.tc} />
              </div>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 16 }}>{device.name}</div>
                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  {dType.label} · {device.manufacturer || 'Samsung'}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-container-low)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MSI name="close" size={18} color="var(--on-surface-variant)" />
            </button>
          </div>

          {/* SmartThings 연결 상태 뱃지 */}
          {isConnected && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 12, padding: '5px 12px',
              background: 'rgba(20,40,160,0.08)', borderRadius: 20,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1428A0', boxShadow: '0 0 4px #1428A0' }} />
              <span style={{ fontSize: 11, color: '#1428A0', fontWeight: 700 }}>Samsung SmartThings 연결됨</span>
            </div>
          )}
        </div>

        <div className="modal-body">
          {!isConnected ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <MSI name="link_off" size={48} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                SmartThings 미연결 기기
              </div>
              <div style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
                수동으로 등록된 기기입니다.<br />
                SmartThings와 연결하면 실제 제어가 가능합니다.
              </div>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--on-surface-variant)' }}>
              <div style={{
                width: 28, height: 28, border: '3px solid var(--surface-container-high)',
                borderTopColor: '#1428A0', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
              }} />
              SmartThings에서 상태 불러오는 중...
            </div>
          ) : (
            <div>
              {/* 실시간 상태 */}
              {status && Object.keys(status).length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                    실시간 상태
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {status.switch !== undefined && (
                      <div style={{ padding: 12, background: status.switch === 'on' ? 'rgba(0,110,28,0.08)' : 'var(--surface-container-low)', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>전원</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 18, color: status.switch === 'on' ? '#006e1c' : 'var(--on-surface-variant)' }}>
                          {status.switch === 'on' ? '켜짐' : '꺼짐'}
                        </div>
                      </div>
                    )}
                    {status.temperature !== undefined && (
                      <div style={{ padding: 12, background: 'rgba(0,91,135,0.08)', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>현재 온도</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 18, color: '#005b87' }}>
                          {status.temperature}°{status.temperatureUnit || 'C'}
                        </div>
                      </div>
                    )}
                    {status.humidity !== undefined && (
                      <div style={{ padding: 12, background: 'rgba(0,91,135,0.06)', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>습도</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 18, color: '#005b87' }}>
                          {status.humidity}%
                        </div>
                      </div>
                    )}
                    {status.brightness !== undefined && (
                      <div style={{ padding: 12, background: '#fff8e1', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>밝기</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 18, color: '#f59e0b' }}>
                          {status.brightness}%
                        </div>
                      </div>
                    )}
                    {status.lock !== undefined && (
                      <div style={{ padding: 12, background: '#ffd9e4', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>잠금 상태</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 16, color: '#923357' }}>
                          {status.lock === 'locked' ? '🔒 잠김' : '🔓 열림'}
                        </div>
                      </div>
                    )}
                    {status.power !== undefined && (
                      <div style={{ padding: 12, background: 'var(--surface-container-low)', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>소비 전력</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 18 }}>
                          {status.power}W
                        </div>
                      </div>
                    )}
                    {status.washerState !== undefined && (
                      <div style={{ padding: 12, background: '#b6f2be', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>세탁 상태</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, color: '#006e1c' }}>
                          {status.washerState}
                        </div>
                      </div>
                    )}
                    {status.fridgeTemp !== undefined && (
                      <div style={{ padding: 12, background: '#cce8f4', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>냉장 설정온도</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 18, color: '#005b87' }}>
                          {status.fridgeTemp}°C
                        </div>
                      </div>
                    )}
                    {status.acMode !== undefined && (
                      <div style={{ padding: 12, background: '#cce8f4', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>에어컨 모드</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, color: '#005b87' }}>
                          {status.acMode}
                        </div>
                      </div>
                    )}
                    {status.battery !== undefined && (
                      <div style={{ padding: 12, background: 'var(--surface-container-low)', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>배터리</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 18 }}>
                          {status.battery}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 제어 버튼 */}
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                  기기 제어
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                  {/* 전원 제어 (switch 지원 기기) */}
                  {(device.deviceType !== 'OTHER') && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => sendCommand('switch', 'on')}
                        disabled={commanding || status?.switch === 'on'}
                        style={{
                          flex: 1, padding: '12px 0',
                          background: status?.switch === 'on' ? 'var(--secondary)' : 'var(--surface-container-low)',
                          color: status?.switch === 'on' ? 'white' : 'var(--on-surface)',
                          border: 'none', borderRadius: 12,
                          fontWeight: 700, fontSize: 13, cursor: commanding ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <MSI name="power_settings_new" fill={status?.switch === 'on'} size={18} />
                        켜기
                      </button>
                      <button
                        onClick={() => sendCommand('switch', 'off')}
                        disabled={commanding || status?.switch === 'off'}
                        style={{
                          flex: 1, padding: '12px 0',
                          background: status?.switch === 'off' ? 'var(--error)' : 'var(--surface-container-low)',
                          color: status?.switch === 'off' ? 'white' : 'var(--on-surface)',
                          border: 'none', borderRadius: 12,
                          fontWeight: 700, fontSize: 13, cursor: commanding ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <MSI name="power_off" size={18} />
                        끄기
                      </button>
                    </div>
                  )}

                  {/* 잠금 제어 */}
                  {device.deviceType === 'LOCK' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => sendCommand('lock', 'lock')}
                        disabled={commanding}
                        style={{
                          flex: 1, padding: 12,
                          background: '#923357', color: 'white',
                          border: 'none', borderRadius: 12,
                          fontWeight: 700, fontSize: 13, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <MSI name="lock" fill size={16} /> 잠금
                      </button>
                      <button
                        onClick={() => sendCommand('lock', 'unlock')}
                        disabled={commanding}
                        style={{
                          flex: 1, padding: 12,
                          background: 'var(--surface-container-low)', color: 'var(--on-surface)',
                          border: 'none', borderRadius: 12,
                          fontWeight: 700, fontSize: 13, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <MSI name="lock_open" size={16} /> 해제
                      </button>
                    </div>
                  )}

                  {/* 에어컨 모드 */}
                  {device.deviceType === 'AC' && (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 6 }}>에어컨 모드</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['cool', 'heat', 'auto', 'dry', 'fanOnly'].map(mode => (
                          <button
                            key={mode}
                            onClick={() => sendCommand('airConditionerMode', 'setAirConditionerMode', [mode])}
                            disabled={commanding}
                            style={{
                              padding: '8px 14px',
                              background: status?.acMode === mode ? '#005b87' : 'var(--surface-container-low)',
                              color: status?.acMode === mode ? 'white' : 'var(--on-surface)',
                              border: 'none', borderRadius: 20,
                              fontWeight: 600, fontSize: 12, cursor: 'pointer',
                            }}
                          >
                            {mode === 'cool' ? '냉방' : mode === 'heat' ? '난방' : mode === 'auto' ? '자동' : mode === 'dry' ? '제습' : '송풍'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 상태 새로고침 */}
                  <button
                    onClick={loadStatus}
                    disabled={loading}
                    style={{
                      padding: 12, marginTop: 4,
                      background: 'var(--surface-container-low)',
                      border: 'none', borderRadius: 12,
                      fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      color: 'var(--on-surface-variant)',
                    }}
                  >
                    <MSI name="refresh" size={16} />
                    상태 새로고침
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 메인 IoT 페이지 ──────────────────────────────────────────────────────────
export default function IotPage() {
  const { selectedHouse } = useHouseStore()
  const [devices, setDevices] = useState([])
  const [zones, setZones] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showSTConnect, setShowSTConnect] = useState(false)
  const [showSTImport, setShowSTImport] = useState(false)
  const [controlDevice, setControlDevice] = useState(null)
  const [stConnected, setStConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [form, setForm] = useState({
    name: '', deviceType: 'LIGHT', manufacturer: '', model: '',
    platform: 'OTHER', zone: null,
  })

  useEffect(() => {
    if (selectedHouse) {
      loadAll()
      checkSTStatus()
    }
  }, [selectedHouse])

  const checkSTStatus = async () => {
    try {
      const res = await api.get('/smartthings/status')
      setStConnected(res.data.data?.connected || false)
    } catch (e) {}
  }

  const loadAll = async () => {
    try {
      const [devRes, zoneRes] = await Promise.all([
        api.get(`/houses/${selectedHouse.id}/iot`),
        api.get(`/houses/${selectedHouse.id}/zones`),
      ])
      setDevices(devRes.data.data || [])
      setZones(zoneRes.data.data || [])
    } catch (e) {}
  }

  const handleToggle = async (device) => {
    // SmartThings 연결 기기면 실제 명령 전송
    if (device.smartThingsDeviceId && stConnected) {
      const newSwitch = device.status === 'ONLINE' ? 'off' : 'on'
      try {
        await api.post(`/smartthings/devices/${device.smartThingsDeviceId}/command`, {
          capability: 'switch',
          command: newSwitch,
          arguments: [],
        })
        // DB 상태도 업데이트
        const newStatus = device.status === 'ONLINE' ? 'STANDBY' : 'ONLINE'
        await api.patch(`/houses/${selectedHouse.id}/iot/${device.id}/status`, { status: newStatus })
        loadAll()
        toast.success(`${device.name} ${newSwitch === 'on' ? '켜짐' : '꺼짐'}`)
      } catch (e) {
        toast.error('SmartThings 명령 실패')
      }
    } else {
      // 일반 토글
      const newStatus = device.status === 'ONLINE' ? 'STANDBY' : 'ONLINE'
      try {
        await api.patch(`/houses/${selectedHouse.id}/iot/${device.id}/status`, { status: newStatus })
        loadAll()
      } catch (e) { toast.error('상태 변경 실패') }
    }
  }

  const handleAdd = async e => {
    e.preventDefault()
    try {
      await api.post(`/houses/${selectedHouse.id}/iot`, form)
      toast.success('기기가 등록되었습니다!')
      setShowModal(false)
      loadAll()
    } catch (e) { toast.error('기기 등록 실패') }
  }

  const handleDelete = async (id) => {
    if (!confirm('기기를 삭제하시겠습니까?')) return
    try {
      await api.delete(`/houses/${selectedHouse.id}/iot/${id}`)
      toast.success('삭제되었습니다.')
      loadAll()
    } catch (e) {}
  }

  const handleSTDisconnect = async () => {
    if (!confirm('Samsung SmartThings 연결을 해제하시겠습니까?')) return
    try {
      await api.delete('/smartthings/connect')
      setStConnected(false)
      toast.success('SmartThings 연결이 해제되었습니다.')
    } catch (e) { toast.error('해제 실패') }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await api.post(`/smartthings/sync/${selectedHouse.id}`)
      toast.success(res.data.message || '동기화 완료!')
      loadAll()
    } catch (e) {
      toast.error(e.response?.data?.message || '동기화 실패')
    } finally {
      setSyncing(false)
    }
  }

  const online = devices.filter(d => d.status === 'ONLINE').length
  const stDevices = devices.filter(d => d.platform === 'SMARTTHINGS')

  if (!selectedHouse) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--on-surface-variant)' }}>
      <MSI name="smart_toy" size={52} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 12px' }} />
      <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 700 }}>집을 먼저 선택해주세요</h3>
    </div>
  )

  return (
    <div style={{ paddingBottom: 24 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

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
            { icon: 'wifi_off', label: '오프라인', value: devices.filter(d => d.status === 'OFFLINE').length, color: 'var(--on-surface-variant)', bg: 'var(--surface-container-low)' },
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

      {/* ── Samsung SmartThings 연동 배너 ── */}
      <div style={{ padding: '20px 20px 0' }}>
        {stConnected ? (
          /* 연결된 상태 */
          <div style={{
            background: 'linear-gradient(135deg, #1428A0 0%, #1e3a8a 100%)',
            borderRadius: 20, padding: '18px 20px',
            color: 'white', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.08, fontSize: 120 }}>📱</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80', animation: 'pulse 2s ease-in-out infinite' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, letterSpacing: '0.5px' }}>
                    SAMSUNG SMARTTHINGS
                  </span>
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 17, marginBottom: 4 }}>
                  삼성 스마트홈 연결됨
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {stDevices.length}개 삼성 기기 연결 중
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 12, color: 'white',
                    fontWeight: 700, fontSize: 12, cursor: syncing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <MSI name="sync" size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                  {syncing ? '동기화...' : '동기화'}
                </button>
                <button
                  onClick={() => setShowSTImport(true)}
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: 12, color: 'white',
                    fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <MSI name="add_link" size={14} />
                  기기 추가
                </button>
              </div>
            </div>

            {/* 삼성 가전 아이콘 줄 */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              {['kitchen', 'local_laundry_service', 'air', 'tv', 'whatshot'].map((icon, i) => (
                <div key={i} style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MSI name={icon} fill size={18} color="white" />
                </div>
              ))}
              <button
                onClick={handleSTDisconnect}
                style={{
                  marginLeft: 'auto', padding: '4px 10px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8, color: 'rgba(255,255,255,0.7)',
                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                }}
              >
                연결 해제
              </button>
            </div>
          </div>
        ) : (
          /* 미연결 상태 */
          <div
            onClick={() => setShowSTConnect(true)}
            style={{
              background: 'var(--surface-container-lowest)',
              borderRadius: 20, padding: '18px 20px', cursor: 'pointer',
              border: '2px dashed rgba(20,40,160,0.3)',
              display: 'flex', alignItems: 'center', gap: 16,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(20,40,160,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container-lowest)'}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg, #1428A0, #1e3a8a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 20, fontFamily: 'Manrope, sans-serif' }}>S</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 15, marginBottom: 3, color: '#1428A0' }}>
                Samsung SmartThings 연결
              </div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                냉장고, 세탁기, 에어컨 등 삼성 가전을<br />
                MyHouse에서 실시간 제어하세요
              </div>
            </div>
            <MSI name="chevron_right" size={24} color="#1428A0" />
          </div>
        )}
      </div>

      {/* ── 자동화 시나리오 ── */}
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

      {/* ── 기기 목록 ── */}
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
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>
              등록된 기기가 없습니다
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {stConnected ? (
                <button
                  onClick={() => setShowSTImport(true)}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #1428A0, #1e3a8a)',
                    color: 'white', border: 'none', borderRadius: 24,
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    margin: '0 auto',
                  }}
                >
                  <MSI name="add_link" size={18} />Samsung 기기 가져오기
                </button>
              ) : (
                <button
                  onClick={() => setShowSTConnect(true)}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #1428A0, #1e3a8a)',
                    color: 'white', border: 'none', borderRadius: 24,
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    margin: '0 auto',
                  }}
                >
                  SmartThings 연결하기
                </button>
              )}
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '12px 24px',
                  background: 'var(--surface-container-low)',
                  color: 'var(--on-surface)', border: 'none', borderRadius: 24,
                  fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  margin: '0 auto',
                }}
              >
                수동으로 기기 등록
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {devices.map(d => {
              const dType = DEVICE_TYPE_MAP[d.deviceType] || DEVICE_TYPE_MAP.OTHER
              const isOnline = d.status === 'ONLINE'
              const isSmartThings = d.platform === 'SMARTTHINGS'

              return (
                <div
                  key={d.id}
                  style={{
                    background: 'var(--surface-container-lowest)',
                    borderRadius: 20, padding: '16px 18px',
                    border: isSmartThings ? '1.5px solid rgba(20,40,160,0.12)' : 'none',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s',
                  }}
                  onClick={() => setControlDevice(d)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: dType.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                      }}>
                        <MSI name={dType.icon} fill size={22} color={dType.tc} />
                        {/* SmartThings 뱃지 */}
                        {isSmartThings && (
                          <div style={{
                            position: 'absolute', bottom: -4, right: -4,
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#1428A0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid white',
                          }}>
                            <span style={{ color: 'white', fontSize: 8, fontWeight: 900 }}>S</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                          {dType.label} {d.manufacturer && `· ${d.manufacturer}`}
                          {d.zone && ` · ${d.zone.name}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isSmartThings ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 20,
                          background: 'rgba(20,40,160,0.08)', fontSize: 10,
                        }}>
                          <span style={{ color: '#1428A0', fontWeight: 700 }}>SmartThings</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                          {PLATFORM_LABELS[d.platform] || d.platform}
                        </span>
                      )}
                    </div>
                    {/* Toggle switch */}
                    <button
                      onClick={() => handleToggle(d)}
                      style={{
                        width: 44, height: 24, borderRadius: 12,
                        background: isOnline ? (isSmartThings ? '#1428A0' : 'var(--secondary)') : 'var(--surface-container-high)',
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

      {/* ── 수동 기기 추가 Modal ── */}
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
                {/* Samsung SmartThings 연결 안내 */}
                {!stConnected && (
                  <div
                    onClick={() => { setShowModal(false); setShowSTConnect(true) }}
                    style={{
                      padding: '12px 14px', marginBottom: 16,
                      background: 'rgba(20,40,160,0.06)',
                      borderRadius: 12, cursor: 'pointer',
                      border: '1px solid rgba(20,40,160,0.15)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'linear-gradient(135deg, #1428A0, #1e3a8a)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ color: 'white', fontWeight: 900, fontSize: 11 }}>S</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1428A0' }}>
                        Samsung SmartThings 연결하기
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                        삼성 가전을 자동으로 가져와 제어하세요
                      </div>
                    </div>
                    <MSI name="chevron_right" size={18} color="#1428A0" />
                  </div>
                )}

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

      {/* ── SmartThings 연결 모달 ── */}
      {showSTConnect && (
        <SmartThingsConnectModal
          onClose={() => setShowSTConnect(false)}
          onConnected={() => { setStConnected(true); setShowSTImport(true) }}
        />
      )}

      {/* ── SmartThings 기기 가져오기 모달 ── */}
      {showSTImport && (
        <SmartThingsImportModal
          onClose={() => setShowSTImport(false)}
          onImported={loadAll}
          houseId={selectedHouse.id}
        />
      )}

      {/* ── 기기 제어 모달 ── */}
      {controlDevice && (
        <DeviceControlModal
          device={controlDevice}
          onClose={() => setControlDevice(null)}
          onUpdated={loadAll}
        />
      )}
    </div>
  )
}
