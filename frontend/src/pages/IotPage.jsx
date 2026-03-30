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
  LG_THINQ: 'LG ThinQ',
  PHILIPS_HUE: 'Philips Hue',
  GOOGLE_HOME: 'Google Home',
  APPLE_HOME: 'Apple Home',
  TUYA: 'Tuya',
  OTHER: '기타'
}

// LG ThinQ 기기 타입 한글 매핑
const LG_DEVICE_TYPE_KO = {
  DEVICE_AIR_CONDITIONER: '에어컨',
  DEVICE_AIR_PURIFIER: '공기청정기',
  DEVICE_AIR_PURIFIER_FAN: '공기청정 선풍기',
  DEVICE_REFRIGERATOR: '냉장고',
  DEVICE_KIMCHI_REFRIGERATOR: '김치냉장고',
  DEVICE_WASHER: '세탁기',
  DEVICE_DRYER: '건조기',
  DEVICE_STYLER: '스타일러',
  DEVICE_DISHWASHER: '식기세척기',
  DEVICE_DISH_WASHER: '식기세척기',
  DEVICE_ROBOT_CLEANER: '로봇청소기',
  DEVICE_STICK_CLEANER: '스틱청소기',
  DEVICE_OVEN: '오븐',
  DEVICE_MICROWAVE_OVEN: '전자레인지',
  DEVICE_HUMIDIFIER: '가습기',
  DEVICE_DEHUMIDIFIER: '제습기',
  DEVICE_SYSTEM_BOILER: '시스템 보일러',
  DEVICE_WATER_HEATER: '온수기',
  DEVICE_VENTILATOR: '환기장치',
  DEVICE_COOKTOP: '쿡탑',
  DEVICE_HOOD: '후드',
  DEVICE_WINE_CELLAR: '와인셀러',
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

// ── Philips Hue 연결 모달 ────────────────────────────────────────────────────────
function PhilipsHueConnectModal({ onClose, onConnected }) {
  const [step, setStep] = useState(1)         // 1=방법선택, 2=Bridge버튼, 3=직접입력
  const [bridgeIp, setBridgeIp] = useState('')
  const [hueUsername, setHueUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [bridges, setBridges] = useState([])
  const [discovering, setDiscovering] = useState(false)
  const [pairStatus, setPairStatus] = useState(null)  // null | 'waiting' | 'success' | 'error'
  const [pairMsg, setPairMsg] = useState('')

  // Bridge 자동 탐색
  const handleDiscover = async () => {
    setDiscovering(true)
    try {
      const res = await api.get('/philipshue/discover')
      const list = res.data.data || []
      setBridges(list)
      if (list.length > 0) setBridgeIp(list[0].internalipaddress || '')
    } catch (e) {
      toast.error('Bridge 탐색 실패')
    } finally {
      setDiscovering(false)
    }
  }

  // 버튼 누르기 방식으로 페어링
  const handlePair = async () => {
    if (!bridgeIp.trim()) { toast.error('Bridge IP를 입력해주세요.'); return }
    setLoading(true)
    setPairStatus('waiting')
    setPairMsg('Bridge 버튼을 누른 뒤 30초 이내에 이 버튼을 눌러주세요.')
    try {
      const res = await api.post('/philipshue/pair', { bridgeIp: bridgeIp.trim() })
      if (res.data.success) {
        setPairStatus('success')
        setPairMsg(res.data.message || 'Philips Hue 연결 완료!')
        toast.success(res.data.message || 'Philips Hue 연결 완료!')
        setTimeout(() => { onConnected(); onClose() }, 1200)
      } else {
        setPairStatus('error')
        setPairMsg(res.data.message || '연결 실패')
      }
    } catch (e) {
      setPairStatus('error')
      setPairMsg(e.response?.data?.message || 'Bridge 연결 실패. Bridge 버튼을 먼저 누르셨나요?')
    } finally {
      setLoading(false)
    }
  }

  // 직접 입력 방식으로 연결
  const handleDirectConnect = async () => {
    if (!bridgeIp.trim()) { toast.error('Bridge IP를 입력해주세요.'); return }
    if (!hueUsername.trim()) { toast.error('Hue Username을 입력해주세요.'); return }
    setLoading(true)
    try {
      const res = await api.post('/philipshue/connect', {
        bridgeIp: bridgeIp.trim(),
        hueUsername: hueUsername.trim(),
      })
      if (res.data.success) {
        toast.success(res.data.message || 'Philips Hue 연결 완료!')
        onConnected()
        onClose()
      } else {
        toast.error(res.data.message || '연결 실패')
      }
    } catch (e) {
      toast.error(e.response?.data?.message || '연결 실패: IP 또는 Username을 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MSI name="lightbulb" fill size={18} color="white" />
            </div>
            <div>
              <div className="modal-title">Philips Hue 연결</div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Hue Bridge를 통해 조명 제어</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-container-low)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MSI name="close" size={18} color="var(--on-surface-variant)" />
          </button>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <>
              {/* 안내 */}
              <div style={{ background: 'rgba(249,115,22,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
                <strong style={{ color: '#ea580c' }}>Philips Hue Bridge</strong>가 같은 Wi-Fi 네트워크에 연결되어 있어야 합니다.<br />
                연결 방법을 선택해주세요.
              </div>

              {/* 방법 선택 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  onClick={() => { handleDiscover(); setStep(2) }}
                  style={{ padding: '16px', background: 'var(--surface-container-lowest)', borderRadius: 14, cursor: 'pointer', border: '1.5px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', gap: 14 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container-lowest)'}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MSI name="sensors" size={20} color="#ea580c" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--on-surface)', marginBottom: 2 }}>Bridge 버튼으로 연결 (권장)</div>
                    <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Bridge의 링크 버튼을 눌러 자동 인증</div>
                  </div>
                  <MSI name="chevron_right" size={18} color="var(--on-surface-variant)" />
                </div>
                <div
                  onClick={() => setStep(3)}
                  style={{ padding: '16px', background: 'var(--surface-container-lowest)', borderRadius: 14, cursor: 'pointer', border: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', gap: 14 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container-lowest)'}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MSI name="edit" size={20} color="var(--on-surface-variant)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--on-surface)', marginBottom: 2 }}>직접 입력</div>
                    <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Bridge IP와 Username을 직접 입력</div>
                  </div>
                  <MSI name="chevron_right" size={18} color="var(--on-surface-variant)" />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <button onClick={() => setStep(1)} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-container-low)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MSI name="arrow_back" size={16} color="var(--on-surface-variant)" />
                </button>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Bridge 버튼으로 연결</span>
              </div>

              {/* Bridge 탐색 결과 */}
              <div className="form-group">
                <label className="form-label">Bridge IP 주소</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" value={bridgeIp} onChange={e => setBridgeIp(e.target.value)} placeholder="192.168.1.100" style={{ flex: 1 }} />
                  <button
                    type="button"
                    onClick={handleDiscover}
                    disabled={discovering}
                    style={{ padding: '0 12px', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    {discovering ? '탐색...' : '자동 탐색'}
                  </button>
                </div>
                {bridges.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {bridges.map((b, i) => (
                      <div key={i} onClick={() => setBridgeIp(b.internalipaddress || '')}
                        style={{ padding: '8px 10px', background: bridgeIp === b.internalipaddress ? 'rgba(249,115,22,0.1)' : 'var(--surface-container-lowest)', borderRadius: 8, cursor: 'pointer', fontSize: 12, border: '1px solid', borderColor: bridgeIp === b.internalipaddress ? '#ea580c' : 'var(--outline-variant)', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <MSI name="router" size={14} color="#ea580c" />
                        <span style={{ fontWeight: 600 }}>{b.internalipaddress}</span>
                        <span style={{ color: 'var(--on-surface-variant)', fontSize: 10 }}>ID: {b.id?.substring(0, 8)}...</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 연결 안내 */}
              <div style={{ background: '#fff7ed', borderRadius: 12, padding: '12px 14px', marginBottom: 12, fontSize: 12, color: '#7c2d12', lineHeight: 1.7 }}>
                <strong>연결 방법:</strong><br />
                1. Hue Bridge의 <strong>링크 버튼(큰 원형 버튼)</strong>을 누르세요<br />
                2. 버튼을 누른 후 <strong>30초 이내</strong>에 아래 "연결하기" 버튼을 클릭하세요
              </div>

              {/* 상태 메시지 */}
              {pairStatus && (
                <div style={{ padding: '10px 12px', borderRadius: 10, marginBottom: 12, fontSize: 12, fontWeight: 600,
                  background: pairStatus === 'success' ? '#dcfce7' : pairStatus === 'error' ? '#fee2e2' : '#fef9c3',
                  color: pairStatus === 'success' ? '#166534' : pairStatus === 'error' ? '#991b1b' : '#713f12',
                }}>
                  <MSI name={pairStatus === 'success' ? 'check_circle' : pairStatus === 'error' ? 'error' : 'info'} size={14} style={{ marginRight: 6 }} />
                  {pairMsg}
                </div>
              )}

              <button
                onClick={handlePair}
                disabled={loading || !bridgeIp.trim()}
                style={{
                  width: '100%', padding: '13px', borderRadius: 14,
                  background: loading || !bridgeIp.trim() ? 'var(--surface-container-high)' : 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: loading || !bridgeIp.trim() ? 'var(--on-surface-variant)' : 'white',
                  border: 'none', fontWeight: 700, fontSize: 14, cursor: loading || !bridgeIp.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? <><MSI name="sync" size={16} style={{ animation: 'spin 1s linear infinite' }} />연결 중...</> : <><MSI name="link" size={16} />연결하기</>}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <button onClick={() => setStep(1)} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-container-low)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MSI name="arrow_back" size={16} color="var(--on-surface-variant)" />
                </button>
                <span style={{ fontWeight: 700, fontSize: 13 }}>직접 입력으로 연결</span>
              </div>

              <div style={{ background: 'rgba(249,115,22,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 14, fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
                Hue 앱 → 설정 → Hue Bridge → 정보에서 IP 주소를 확인할 수 있습니다.<br />
                Username은 이전에 발급받은 API 키입니다.
              </div>

              <div className="form-group">
                <label className="form-label">Bridge IP 주소 *</label>
                <input className="form-input" value={bridgeIp} onChange={e => setBridgeIp(e.target.value)} placeholder="예: 192.168.1.100" />
              </div>
              <div className="form-group">
                <label className="form-label">Hue Username (API Key) *</label>
                <input className="form-input" value={hueUsername} onChange={e => setHueUsername(e.target.value)} placeholder="발급받은 Username을 입력하세요" />
              </div>

              <button
                onClick={handleDirectConnect}
                disabled={loading || !bridgeIp.trim() || !hueUsername.trim()}
                style={{
                  width: '100%', padding: '13px', borderRadius: 14,
                  background: (loading || !bridgeIp.trim() || !hueUsername.trim()) ? 'var(--surface-container-high)' : 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: (loading || !bridgeIp.trim() || !hueUsername.trim()) ? 'var(--on-surface-variant)' : 'white',
                  border: 'none', fontWeight: 700, fontSize: 14, cursor: (loading || !bridgeIp.trim() || !hueUsername.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? <><MSI name="sync" size={16} style={{ animation: 'spin 1s linear infinite' }} />연결 중...</> : <><MSI name="link" size={16} />연결하기</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Philips Hue 조명 가져오기 모달 ──────────────────────────────────────────────
function PhilipsHueImportModal({ onClose, onImported, houseId }) {
  const [lights, setLights] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState({})

  useEffect(() => {
    fetchLights()
  }, [])

  const fetchLights = async () => {
    setLoading(true)
    try {
      const res = await api.get('/philipshue/lights', { params: { houseId } })
      setLights(res.data.data || [])
    } catch (e) {
      toast.error('조명 목록 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (lightId) => {
    setImporting(prev => ({ ...prev, [lightId]: true }))
    try {
      const res = await api.post(`/philipshue/lights/${lightId}/import`, { houseId })
      toast.success(res.data.message || '조명이 등록되었습니다!')
      onImported()
      setLights(prev => prev.map(l => l.lightId === lightId ? { ...l, alreadyLinked: true } : l))
    } catch (e) {
      toast.error(e.response?.data?.message || '등록 실패')
    } finally {
      setImporting(prev => ({ ...prev, [lightId]: false }))
    }
  }

  const handleImportAll = async () => {
    const unlinked = lights.filter(l => !l.alreadyLinked)
    for (const l of unlinked) {
      await handleImport(l.lightId)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MSI name="lightbulb" fill size={18} color="white" />
            </div>
            <div>
              <div className="modal-title">Hue 조명 가져오기</div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Bridge에서 조명을 불러와 등록합니다</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-container-low)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MSI name="close" size={18} color="var(--on-surface-variant)" />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
              <MSI name="sync" size={32} style={{ display: 'block', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
              Bridge에서 조명을 불러오는 중...
            </div>
          ) : lights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
              <MSI name="lightbulb_outline" size={40} style={{ display: 'block', margin: '0 auto 12px' }} />
              연결된 조명이 없습니다
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
                  총 {lights.length}개 조명 / 미등록 {lights.filter(l => !l.alreadyLinked).length}개
                </span>
                {lights.some(l => !l.alreadyLinked) && (
                  <button
                    onClick={handleImportAll}
                    style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <MSI name="add_link" size={13} />전체 등록
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lights.map(light => (
                  <div key={light.lightId} style={{ padding: '12px 14px', background: 'var(--surface-container-lowest)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12, border: light.alreadyLinked ? '1px solid rgba(249,115,22,0.3)' : '1px solid var(--outline-variant)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: light.on ? '#fff7ed' : 'var(--surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MSI name="lightbulb" fill={light.on} size={20} color={light.on ? '#f97316' : 'var(--on-surface-variant)'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--on-surface)' }}>{light.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginTop: 1 }}>
                        {light.productname || light.type}
                        {light.reachable ? <span style={{ color: '#16a34a', marginLeft: 6 }}>● 응답 중</span> : <span style={{ color: 'var(--on-surface-variant)', marginLeft: 6 }}>● 응답 없음</span>}
                      </div>
                    </div>
                    {light.alreadyLinked ? (
                      <span style={{ padding: '4px 10px', background: 'rgba(249,115,22,0.1)', color: '#ea580c', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        등록됨
                      </span>
                    ) : (
                      <button
                        onClick={() => handleImport(light.lightId)}
                        disabled={importing[light.lightId]}
                        style={{ padding: '6px 12px', background: importing[light.lightId] ? 'var(--surface-container-high)' : 'linear-gradient(135deg, #f97316, #ea580c)', color: importing[light.lightId] ? 'var(--on-surface-variant)' : 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 11, cursor: importing[light.lightId] ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        {importing[light.lightId] ? '등록 중...' : <><MSI name="add" size={13} />등록</>}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── LG ThinQ 연결 모달 ──────────────────────────────────────────────────────────
function LgThinqConnectModal({ onClose, onConnected }) {
  const [pat, setPat] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const handleConnect = async (e) => {
    e.preventDefault()
    if (!pat.trim()) return toast.error('PAT 토큰을 입력해주세요.')
    setLoading(true)
    try {
      const res = await api.post('/lgthinq/connect', { token: pat.trim() })
      toast.success(res.data.message || 'LG ThinQ 연결 완료!')
      onConnected()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'LG ThinQ 연결 실패. 토큰을 확인해주세요.')
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
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #C0392B, #a93226)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 13, fontFamily: 'Manrope, sans-serif' }}>LG</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 16 }}>LG ThinQ</div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>LG 가전 연동</div>
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
          <div style={{ padding: 20 }}>
            {/* 안내 카드 */}
            <div style={{
              background: 'linear-gradient(135deg, #C0392B 0%, #922B21 100%)',
              borderRadius: 20, padding: 20, marginBottom: 20,
              color: 'white', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 80, opacity: 0.1 }}>🏠</div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>LG ThinQ PAT 연동</div>
              <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.6 }}>
                LG ThinQ Developer 사이트에서<br />
                Personal Access Token을 발급받아<br />
                LG 가전을 MyHouse에서 제어하세요.
              </div>
            </div>

            {/* 지원 기기 목록 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>지원 LG 기기</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { icon: 'kitchen', label: '냉장고/김치냉장고', color: '#cce8f4' },
                  { icon: 'local_laundry_service', label: '세탁기/건조기', color: '#b6f2be' },
                  { icon: 'air', label: '에어컨/공기청정기', color: '#e3f2fd' },
                  { icon: 'wash', label: '식기세척기/스타일러', color: '#e8d5f0' },
                  { icon: 'cleaning_services', label: '로봇청소기', color: '#ffedd5' },
                  { icon: 'thermostat', label: '보일러/온수기', color: '#ffd9e4' },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: 12,
                    background: item.color, display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <MSI name={item.icon} fill size={18} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PAT 발급 안내 */}
            <div style={{
              padding: 16, borderRadius: 16,
              background: 'var(--surface-container-low)',
              marginBottom: 20,
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>PAT 발급 방법</div>
              {[
                { step: '1', text: 'connect-pat.lgthinq.com 방문' },
                { step: '2', text: 'LG 계정으로 로그인' },
                { step: '3', text: 'Create Token 클릭 후 토큰 복사' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < 2 ? 8 : 0 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#C0392B', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                  }}>{s.step}</div>
                  <span style={{ fontSize: 13, lineHeight: 1.5, paddingTop: 2 }}>{s.text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href="https://connect-pat.lgthinq.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, padding: '14px', borderRadius: 16,
                  background: 'var(--surface-container-low)',
                  border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 14, textAlign: 'center',
                  color: 'var(--on-surface)', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <MSI name="open_in_new" size={16} />
                PAT 발급하기
              </a>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1, padding: '14px', borderRadius: 16,
                  background: 'linear-gradient(135deg, #C0392B, #922B21)',
                  border: 'none', cursor: 'pointer',
                  color: 'white', fontWeight: 700, fontSize: 14,
                }}
              >
                토큰 입력하기
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnect} style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                LG ThinQ Personal Access Token
              </div>
              <textarea
                value={pat}
                onChange={e => setPat(e.target.value)}
                placeholder="connect-pat.lgthinq.com에서 발급받은 PAT 토큰"
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 14,
                  border: '1.5px solid var(--outline-variant)',
                  background: 'var(--surface-container-low)',
                  fontSize: 13, resize: 'none', boxSizing: 'border-box',
                  fontFamily: 'monospace',
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 4 }}>
                토큰은 암호화되어 안전하게 저장됩니다.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setStep(1)} style={{
                flex: 1, padding: 14, borderRadius: 16,
                background: 'var(--surface-container-low)', border: 'none',
                fontWeight: 700, fontSize: 14, cursor: 'pointer', color: 'var(--on-surface)',
              }}>뒤로</button>
              <button type="submit" disabled={loading} style={{
                flex: 2, padding: 14, borderRadius: 16,
                background: loading ? 'var(--surface-container-high)' : 'linear-gradient(135deg, #C0392B, #922B21)',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                color: loading ? 'var(--on-surface-variant)' : 'white',
                fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {loading && <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                {loading ? '연결 중...' : 'LG ThinQ 연결'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── LG ThinQ 기기 가져오기 모달 ──────────────────────────────────────────────────
function LgThinqImportModal({ onClose, onImported, houseId }) {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState({})

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    setLoading(true)
    try {
      const res = await api.get('/lgthinq/devices', { params: { houseId } })
      setDevices(res.data.data || [])
    } catch (e) {
      toast.error('LG ThinQ 기기 목록을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (device) => {
    if (device.alreadyLinked) return
    setImporting(prev => ({ ...prev, [device.deviceId]: true }))
    try {
      await api.post(`/lgthinq/devices/${device.deviceId}/import`, { houseId })
      toast.success(`${device.name} 등록 완료!`)
      setDevices(prev => prev.map(d =>
        d.deviceId === device.deviceId ? { ...d, alreadyLinked: true } : d
      ))
      onImported()
    } catch (e) {
      toast.error(e.response?.data?.message || '기기 등록 실패')
    } finally {
      setImporting(prev => ({ ...prev, [device.deviceId]: false }))
    }
  }

  const handleImportAll = async () => {
    const notLinked = devices.filter(d => !d.alreadyLinked)
    for (const d of notLinked) {
      await handleImport(d)
    }
  }

  const getDeviceIcon = (typeIcon) => {
    const iconMap = {
      AC: 'air', REFRIGERATOR: 'kitchen', WASHER: 'local_laundry_service',
      THERMOSTAT: 'thermostat', TV: 'tv', LIGHT: 'lightbulb',
      LOCK: 'lock', CAMERA: 'nest_cam_wired_stand', OTHER: 'smart_toy',
    }
    return iconMap[typeIcon] || 'smart_toy'
  }

  const getDeviceTypeName = (lgType, typeIcon) => {
    if (lgType && LG_DEVICE_TYPE_KO[lgType]) return LG_DEVICE_TYPE_KO[lgType]
    const nameMap = { AC: '에어컨', REFRIGERATOR: '냉장고', WASHER: '세탁/건조', THERMOSTAT: '온도조절', TV: 'TV', LIGHT: '조명', OTHER: '기타' }
    return nameMap[typeIcon] || '기타'
  }

  const notLinkedCount = devices.filter(d => !d.alreadyLinked).length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #C0392B, #922B21)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 13 }}>LG</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 16 }}>LG ThinQ 기기 가져오기</div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                {loading ? '불러오는 중...' : `${devices.length}개 발견 · ${devices.filter(d => d.alreadyLinked).length}개 등록됨`}
              </div>
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

        <div style={{ padding: '0 20px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
              <div style={{
                width: 32, height: 32, border: '3px solid var(--surface-container-high)',
                borderTopColor: '#C0392B', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
              }} />
              LG ThinQ에서 기기 목록 불러오는 중...
            </div>
          ) : devices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--on-surface-variant)' }}>
              <MSI name="devices_fold" size={40} style={{ display: 'block', margin: '0 auto 10px' }} />
              <div style={{ fontSize: 14 }}>연결된 LG ThinQ 기기가 없습니다.</div>
            </div>
          ) : (
            <>
              {/* 전체 가져오기 버튼 */}
              {notLinkedCount > 0 && (
                <button
                  onClick={handleImportAll}
                  style={{
                    width: '100%', padding: '12px', marginBottom: 16,
                    background: 'linear-gradient(135deg, #C0392B, #922B21)',
                    border: 'none', borderRadius: 14, color: 'white',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <MSI name="download" size={18} />
                  전체 가져오기 ({notLinkedCount}개)
                </button>
              )}

              {/* 기기 목록 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {devices.map(device => {
                  const icon = getDeviceIcon(device.deviceTypeIcon)
                  const typeName = getDeviceTypeName(device.lgDeviceType, device.deviceTypeIcon)
                  const isImporting = importing[device.deviceId]
                  return (
                    <div key={device.deviceId} style={{
                      padding: '14px 16px', borderRadius: 16,
                      background: device.alreadyLinked ? 'rgba(0,110,28,0.06)' : 'var(--surface-container-low)',
                      border: device.alreadyLinked ? '1.5px solid rgba(0,110,28,0.2)' : '1.5px solid transparent',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: device.alreadyLinked ? '#b6f2be' : '#fde8e8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <MSI name={icon} fill size={22} color={device.alreadyLinked ? '#006e1c' : '#C0392B'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {device.name || device.label}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            padding: '2px 8px', borderRadius: 20,
                            background: '#fde8e8', color: '#C0392B',
                          }}>{typeName}</span>
                          {device.modelName && (
                            <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{device.modelName}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {device.alreadyLinked ? (
                          <div style={{
                            padding: '6px 12px', borderRadius: 12,
                            background: '#b6f2be', color: '#006e1c',
                            fontSize: 12, fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            <MSI name="check_circle" fill size={14} color="#006e1c" />
                            등록됨
                          </div>
                        ) : (
                          <button
                            onClick={() => handleImport(device)}
                            disabled={isImporting}
                            style={{
                              padding: '8px 14px', borderRadius: 12,
                              background: isImporting ? 'var(--surface-container-high)' : 'linear-gradient(135deg, #C0392B, #922B21)',
                              border: 'none', cursor: isImporting ? 'not-allowed' : 'pointer',
                              color: isImporting ? 'var(--on-surface-variant)' : 'white',
                              fontSize: 13, fontWeight: 700,
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            {isImporting
                              ? <div style={{ width: 14, height: 14, border: '2px solid var(--outline-variant)', borderTopColor: 'var(--on-surface-variant)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                              : <MSI name="add_link" size={14} />}
                            {isImporting ? '등록 중' : '등록'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
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
  const [importing, setImporting] = useState(new Set())  // 여러 기기 동시 처리
  const [imported, setImported] = useState(new Set())    // import 완료된 기기 추적
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { loadStDevices() }, [])

  const loadStDevices = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/smartthings/devices?houseId=${houseId}`)
      setStDevices(res.data.data || [])
      // 이미 연결된 기기 초기화
      const linked = new Set(
        (res.data.data || [])
          .filter(d => d.alreadyLinked)
          .map(d => d.deviceId)
      )
      setImported(linked)
    } catch (err) {
      toast.error('SmartThings 기기 목록 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (device) => {
    if (importing.has(device.deviceId) || imported.has(device.deviceId)) return

    setImporting(prev => new Set([...prev, device.deviceId]))
    try {
      await api.post(`/smartthings/devices/${device.deviceId}/import`, { houseId })
      toast.success(`'${device.label || device.name}' 등록 완료!`)
      setImported(prev => new Set([...prev, device.deviceId]))
      onImported()   // 부모 목록 즉시 갱신
    } catch (err) {
      toast.error(err.response?.data?.message || '기기 연결 실패')
    } finally {
      setImporting(prev => { const s = new Set(prev); s.delete(device.deviceId); return s })
    }
  }

  const handleImportAll = async () => {
    const notLinked = stDevices.filter(d => !imported.has(d.deviceId) && !importing.has(d.deviceId))
    if (notLinked.length === 0) { toast('모든 기기가 이미 등록되었습니다.', { icon: '✅' }); return }
    for (const device of notLinked) {
      await handleImport(device)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await api.post(`/smartthings/sync/${houseId}`)
      toast.success(res.data.message || '동기화 완료!')
      onImported()
    } catch (err) {
      toast.error('동기화 실패')
    } finally {
      setSyncing(false)
    }
  }

  const dType = (typeIcon) => DEVICE_TYPE_MAP[typeIcon] || DEVICE_TYPE_MAP.OTHER
  const linkedCount = stDevices.filter(d => imported.has(d.deviceId)).length
  const totalCount = stDevices.length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--outline-variant)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #1428A0, #1e3a8a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: 'white', fontWeight: 900, fontSize: 14, fontFamily: 'Manrope, sans-serif' }}>S</span>
              </div>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 16 }}>
                  삼성 기기 가져오기
                </div>
                {!loading && (
                  <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 1 }}>
                    {totalCount}개 발견 · {linkedCount}개 등록됨
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-container-low)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MSI name="close" size={18} color="var(--on-surface-variant)" />
            </button>
          </div>

          {/* 전체 등록 버튼 */}
          {!loading && totalCount > 0 && (
            <button
              onClick={handleImportAll}
              disabled={linkedCount === totalCount}
              style={{
                width: '100%', padding: '10px 0',
                background: linkedCount === totalCount
                  ? 'var(--surface-container-high)'
                  : 'linear-gradient(135deg, #1428A0, #1e3a8a)',
                color: linkedCount === totalCount ? 'var(--on-surface-variant)' : 'white',
                border: 'none', borderRadius: 12,
                fontWeight: 700, fontSize: 13, cursor: linkedCount === totalCount ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {linkedCount === totalCount ? (
                <><MSI name="check_circle" size={16} />모든 기기 등록 완료</>
              ) : (
                <><MSI name="add_link" size={16} />전체 등록 ({totalCount - linkedCount}개)</>
              )}
            </button>
          )}
        </div>

        {/* 기기 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--on-surface-variant)' }}>
              <div style={{
                width: 36, height: 36, border: '3px solid var(--surface-container-high)',
                borderTopColor: '#1428A0', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>Samsung SmartThings에서</div>
              <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 4 }}>기기 목록 불러오는 중...</div>
            </div>
          ) : stDevices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--on-surface-variant)' }}>
              <MSI name="devices_other" size={52} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 16px' }} />
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 16 }}>
                연결된 삼성 기기 없음
              </div>
              <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
                SmartThings 앱에서 기기를 먼저<br />등록해주세요.
              </div>
              <a
                href="https://www.samsung.com/global/galaxy/apps/smartthings/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  marginTop: 16, padding: '10px 20px',
                  background: 'rgba(20,40,160,0.08)',
                  borderRadius: 20, color: '#1428A0',
                  fontWeight: 700, fontSize: 13, textDecoration: 'none',
                }}
              >
                <MSI name="open_in_new" size={14} color="#1428A0" />
                SmartThings 앱 열기
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stDevices.map(device => {
                const dt = dType(device.deviceTypeIcon)
                const isImporting = importing.has(device.deviceId)
                const isLinked = imported.has(device.deviceId)

                return (
                  <div key={device.deviceId} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    background: isLinked ? 'rgba(0,110,28,0.05)' : 'var(--surface-container-low)',
                    borderRadius: 16,
                    border: isLinked
                      ? '1.5px solid rgba(0,110,28,0.2)'
                      : '1px solid rgba(20,40,160,0.08)',
                    transition: 'all 0.2s',
                  }}>
                    {/* 기기 아이콘 */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: isLinked ? '#b6f2be' : dt.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, position: 'relative',
                    }}>
                      <MSI name={isLinked ? 'check' : dt.icon} fill size={24} color={isLinked ? '#006e1c' : dt.tc} />
                    </div>

                    {/* 기기 정보 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14,
                        color: isLinked ? '#006e1c' : 'var(--on-surface)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        marginBottom: 2,
                      }}>
                        {device.label || device.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                        {dt.label}
                        {device.manufacturer && ` · ${device.manufacturer}`}
                        {device.model && ` · ${device.model}`}
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        marginTop: 4, padding: '2px 8px',
                        background: isLinked ? 'rgba(0,110,28,0.1)' : 'rgba(20,40,160,0.08)',
                        borderRadius: 20,
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: isLinked ? '#006e1c' : '#1428A0' }} />
                        <span style={{ fontSize: 9, color: isLinked ? '#006e1c' : '#1428A0', fontWeight: 700 }}>
                          {isLinked ? '등록됨' : 'SmartThings'}
                        </span>
                      </div>
                    </div>

                    {/* 연결/등록 버튼 */}
                    {isLinked ? (
                      <div style={{
                        flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(0,110,28,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <MSI name="check" size={18} color="#006e1c" />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleImport(device)}
                        disabled={isImporting}
                        style={{
                          flexShrink: 0,
                          padding: '9px 16px',
                          background: isImporting
                            ? 'var(--surface-container-high)'
                            : 'linear-gradient(135deg, #1428A0, #1e3a8a)',
                          color: isImporting ? 'var(--on-surface-variant)' : 'white',
                          border: 'none', borderRadius: 12,
                          fontWeight: 700, fontSize: 12,
                          cursor: isImporting ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 5,
                          minWidth: 60,
                          justifyContent: 'center',
                        }}
                      >
                        {isImporting ? (
                          <span style={{
                            width: 14, height: 14,
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: 'white', borderRadius: '50%',
                            display: 'inline-block',
                            animation: 'spin 0.8s linear infinite',
                          }} />
                        ) : (
                          <>
                            <MSI name="add" size={15} />
                            등록
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--outline-variant)', flexShrink: 0, display: 'flex', gap: 8 }}>
          <button
            onClick={handleSync}
            disabled={syncing || linkedCount === 0}
            style={{
              flex: 1, padding: 12,
              background: syncing || linkedCount === 0 ? 'var(--surface-container-high)' : 'var(--surface-container-low)',
              color: syncing || linkedCount === 0 ? 'var(--on-surface-variant)' : 'var(--on-surface)',
              border: 'none', borderRadius: 12,
              fontWeight: 700, fontSize: 13,
              cursor: syncing || linkedCount === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <MSI name="sync" size={16} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? '동기화 중...' : '상태 동기화'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 12,
              background: 'linear-gradient(135deg, #1428A0, #1e3a8a)',
              color: 'white', border: 'none', borderRadius: 12,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            완료
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

  const isLgDevice = device.platform === 'LG_THINQ' && !!device.lgThinqDeviceId
  const isSTDevice = device.platform === 'SMARTTHINGS' && !!device.smartThingsDeviceId

  useEffect(() => {
    if (isSTDevice) loadSTStatus()
    else if (isLgDevice) loadLGStatus()
  }, [device])

  const loadSTStatus = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/smartthings/devices/${device.smartThingsDeviceId}/status`)
      setStatus(res.data.data)
    } catch (e) {
      console.warn('SmartThings 상태 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  const loadLGStatus = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/lgthinq/devices/${device.lgThinqDeviceId}/state`)
      setStatus(res.data.data)
    } catch (e) {
      console.warn('LG ThinQ 상태 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  const loadStatus = isLgDevice ? loadLGStatus : loadSTStatus

  const sendCommand = async (capability, command, args = []) => {
    setCommanding(true)
    try {
      if (isLgDevice) {
        // LG ThinQ 제어: capability → resource, command → property, args[0] → value
        await api.post(`/lgthinq/devices/${device.lgThinqDeviceId}/control`, {
          resource: capability,
          property: command,
          value: args[0] !== undefined ? args[0] : command,
        })
      } else {
        await api.post(`/smartthings/devices/${device.smartThingsDeviceId}/command`, {
          capability, command, arguments: args,
        })
      }
      toast.success('명령 전송 완료!')
      setTimeout(() => { loadStatus(); onUpdated() }, 1000)
    } catch (err) {
      toast.error(err.response?.data?.message || '명령 전송 실패')
    } finally {
      setCommanding(false)
    }
  }

  const dType = DEVICE_TYPE_MAP[device.deviceType] || DEVICE_TYPE_MAP.OTHER
  const isConnected = isSTDevice || isLgDevice

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
                  {dType.label} · {device.manufacturer || (isLgDevice ? 'LG' : 'Samsung')}
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

          {/* 플랫폼 연결 상태 뱃지 */}
          {isConnected && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 12, padding: '5px 12px',
              background: isLgDevice ? 'rgba(192,57,43,0.08)' : 'rgba(20,40,160,0.08)', borderRadius: 20,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: isLgDevice ? '#C0392B' : '#1428A0', boxShadow: `0 0 4px ${isLgDevice ? '#C0392B' : '#1428A0'}` }} />
              <span style={{ fontSize: 11, color: isLgDevice ? '#C0392B' : '#1428A0', fontWeight: 700 }}>
                {isLgDevice ? 'LG ThinQ 연결됨' : 'Samsung SmartThings 연결됨'}
              </span>
            </div>
          )}
        </div>

        <div className="modal-body">
          {!isConnected ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <MSI name="link_off" size={48} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                클라우드 미연결 기기
              </div>
              <div style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
                수동으로 등록된 기기입니다.<br />
                SmartThings 또는 LG ThinQ 연결 후 실제 제어가 가능합니다.
              </div>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--on-surface-variant)' }}>
              <div style={{
                width: 28, height: 28, border: '3px solid var(--surface-container-high)',
                borderTopColor: isLgDevice ? '#C0392B' : '#1428A0', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
              }} />
              {isLgDevice ? 'LG ThinQ에서 상태 불러오는 중...' : 'SmartThings에서 상태 불러오는 중...'}
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
                    {/* LG ThinQ 전용 상태 */}
                    {status.power !== undefined && typeof status.power === 'string' && !['W', 'w'].some(u => String(status.power).includes(u)) && (
                      <div style={{ padding: 12, background: status.power === 'on' ? 'rgba(0,110,28,0.08)' : 'rgba(192,57,43,0.06)', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>전원</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 18, color: status.power === 'on' ? '#006e1c' : '#C0392B' }}>
                          {status.power === 'on' ? '켜짐' : '꺼짐'}
                        </div>
                      </div>
                    )}
                    {status.runState !== undefined && (
                      <div style={{ padding: 12, background: '#b6f2be', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>동작 상태</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, color: '#006e1c' }}>
                          {status.runState}
                        </div>
                      </div>
                    )}
                    {status.temperature !== undefined && (
                      <div style={{ padding: 12, background: 'rgba(0,91,135,0.08)', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>현재 온도</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 18, color: '#005b87' }}>
                          {status.temperature}°C
                        </div>
                      </div>
                    )}
                    {status.targetTemperature !== undefined && (
                      <div style={{ padding: 12, background: '#cce8f4', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 4 }}>설정 온도</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 18, color: '#005b87' }}>
                          {status.targetTemperature}°C
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

                  {/* 전원 제어 */}
                  {(device.deviceType !== 'OTHER') && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => {
                          if (isLgDevice) {
                            // LG ThinQ: 에어컨은 COOL 모드, 나머지는 POWER_ON
                            const resource = device.deviceType === 'AC' ? 'airConditionerJobMode' : 'operation'
                            const prop = device.deviceType === 'AC' ? 'airConOperationMode' : 'washerOperationMode'
                            const val = device.deviceType === 'AC' ? 'COOL' : 'POWER_ON'
                            sendCommand(resource, prop, [val])
                          } else {
                            sendCommand('switch', 'on')
                          }
                        }}
                        disabled={commanding || status?.switch === 'on' || status?.power === 'on'}
                        style={{
                          flex: 1, padding: '12px 0',
                          background: (status?.switch === 'on' || status?.power === 'on') ? (isLgDevice ? '#C0392B' : 'var(--secondary)') : 'var(--surface-container-low)',
                          color: (status?.switch === 'on' || status?.power === 'on') ? 'white' : 'var(--on-surface)',
                          border: 'none', borderRadius: 12,
                          fontWeight: 700, fontSize: 13, cursor: commanding ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <MSI name="power_settings_new" fill={status?.switch === 'on' || status?.power === 'on'} size={18} />
                        켜기
                      </button>
                      <button
                        onClick={() => {
                          if (isLgDevice) {
                            const resource = device.deviceType === 'AC' ? 'airConditionerJobMode' : 'operation'
                            const prop = device.deviceType === 'AC' ? 'airConOperationMode' : 'washerOperationMode'
                            sendCommand(resource, prop, ['POWER_OFF'])
                          } else {
                            sendCommand('switch', 'off')
                          }
                        }}
                        disabled={commanding || status?.switch === 'off' || status?.power === 'off'}
                        style={{
                          flex: 1, padding: '12px 0',
                          background: (status?.switch === 'off' || status?.power === 'off') ? 'var(--error)' : 'var(--surface-container-low)',
                          color: (status?.switch === 'off' || status?.power === 'off') ? 'white' : 'var(--on-surface)',
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
  const [lgConnected, setLgConnected] = useState(false)
  const [showLGConnect, setShowLGConnect] = useState(false)
  const [showLGImport, setShowLGImport] = useState(false)
  const [lgSyncing, setLgSyncing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [hueConnected, setHueConnected] = useState(false)
  const [showHueConnect, setShowHueConnect] = useState(false)
  const [showHueImport, setShowHueImport] = useState(false)
  const [hueSyncing, setHueSyncing] = useState(false)
  const [form, setForm] = useState({
    name: '', deviceType: 'LIGHT', manufacturer: '', model: '',
    platform: 'OTHER', zone: null,
  })

  useEffect(() => {
    if (selectedHouse) {
      loadAll()
      checkSTStatus()
      checkLGStatus()
      checkHueStatus()
    }
  }, [selectedHouse])

  const checkSTStatus = async () => {
    try {
      const res = await api.get('/smartthings/status')
      setStConnected(res.data.data?.connected || false)
    } catch (e) {}
  }

  const checkLGStatus = async () => {
    try {
      const res = await api.get('/lgthinq/status')
      setLgConnected(res.data.data?.connected || false)
    } catch (e) {}
  }

  const checkHueStatus = async () => {
    try {
      const res = await api.get('/philipshue/status')
      setHueConnected(res.data.data?.connected || false)
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
        const newStatus = device.status === 'ONLINE' ? 'STANDBY' : 'ONLINE'
        await api.patch(`/houses/${selectedHouse.id}/iot/${device.id}/status`, { status: newStatus })
        loadAll()
        toast.success(`${device.name} ${newSwitch === 'on' ? '켜짐' : '꺼짐'}`)
      } catch (e) {
        toast.error('SmartThings 명령 실패')
      }
    } else if (device.lgThinqDeviceId && lgConnected) {
      // LG ThinQ 연결 기기 제어
      const isPowerOn = device.status === 'ONLINE'
      try {
        // LG ThinQ 기기 타입별 전원 명령
        const resource = device.deviceType === 'AC' ? 'airConditionerJobMode' : 'operation'
        const property = device.deviceType === 'AC' ? 'airConOperationMode'
          : device.deviceType === 'WASHER' ? 'washerOperationMode'
          : 'operation'
        const offValue = device.deviceType === 'AC' ? 'POWER_OFF' : 'POWER_OFF'
        const onValue = device.deviceType === 'AC' ? 'COOL' : 'POWER_ON'
        await api.post(`/lgthinq/devices/${device.lgThinqDeviceId}/control`, {
          resource, property, value: isPowerOn ? offValue : onValue,
        })
        const newStatus = isPowerOn ? 'STANDBY' : 'ONLINE'
        await api.patch(`/houses/${selectedHouse.id}/iot/${device.id}/status`, { status: newStatus })
        loadAll()
        toast.success(`${device.name} ${isPowerOn ? '꺼짐' : '켜짐'}`)
      } catch (e) {
        toast.error('LG ThinQ 명령 실패')
      }
    } else if (device.hueLightId && hueConnected) {
      // Philips Hue 조명 제어
      const isOn = device.status === 'ONLINE'
      try {
        await api.put(`/philipshue/lights/${device.hueLightId}/state`, { on: !isOn })
        const newStatus = isOn ? 'STANDBY' : 'ONLINE'
        await api.patch(`/houses/${selectedHouse.id}/iot/${device.id}/status`, { status: newStatus })
        loadAll()
        toast.success(`${device.name} ${isOn ? '꺼짐' : '켜짐'}`)
      } catch (e) {
        toast.error('Hue 조명 제어 실패')
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

  const handleLGDisconnect = async () => {
    if (!confirm('LG ThinQ 연결을 해제하시겠습니까?')) return
    try {
      await api.delete('/lgthinq/connect')
      setLgConnected(false)
      toast.success('LG ThinQ 연결이 해제되었습니다.')
    } catch (e) { toast.error('해제 실패') }
  }

  const handleHueDisconnect = async () => {
    if (!confirm('Philips Hue 연결을 해제하시겠습니까?')) return
    try {
      await api.delete('/philipshue/connect')
      setHueConnected(false)
      toast.success('Philips Hue 연결이 해제되었습니다.')
    } catch (e) { toast.error('해제 실패') }
  }

  const handleHueSync = async () => {
    setHueSyncing(true)
    try {
      const res = await api.post(`/philipshue/sync/${selectedHouse.id}`)
      toast.success(res.data.message || 'Philips Hue 동기화 완료!')
      loadAll()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Philips Hue 동기화 실패')
    } finally {
      setHueSyncing(false)
    }
  }

  const handleLGSync = async () => {
    setLgSyncing(true)
    try {
      const res = await api.post(`/lgthinq/sync/${selectedHouse.id}`)
      toast.success(res.data.message || 'LG ThinQ 동기화 완료!')
      loadAll()
    } catch (e) {
      toast.error(e.response?.data?.message || 'LG ThinQ 동기화 실패')
    } finally {
      setLgSyncing(false)
    }
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
  const lgDevices = devices.filter(d => d.platform === 'LG_THINQ')
  const hueDevices = devices.filter(d => d.platform === 'PHILIPS_HUE')

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

      {/* ── LG ThinQ 연동 배너 ── */}
      <div style={{ padding: '12px 20px 0' }}>
        {lgConnected ? (
          /* LG 연결된 상태 */
          <div style={{
            background: 'linear-gradient(135deg, #C0392B 0%, #922B21 100%)',
            borderRadius: 20, padding: '18px 20px',
            color: 'white', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.08, fontSize: 120 }}>🏠</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80', animation: 'pulse 2s ease-in-out infinite' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, letterSpacing: '0.5px' }}>LG THINQ</span>
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 17, marginBottom: 4 }}>
                  LG 스마트홈 연결됨
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {lgDevices.length}개 LG 기기 연결 중
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleLGSync}
                  disabled={lgSyncing}
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 12, color: 'white',
                    fontWeight: 700, fontSize: 12, cursor: lgSyncing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <MSI name="sync" size={14} style={{ animation: lgSyncing ? 'spin 1s linear infinite' : 'none' }} />
                  {lgSyncing ? '동기화...' : '동기화'}
                </button>
                <button
                  onClick={() => setShowLGImport(true)}
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

            {/* LG 가전 아이콘 줄 */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              {['kitchen', 'local_laundry_service', 'air', 'cleaning_services', 'wash'].map((icon, i) => (
                <div key={i} style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MSI name={icon} fill size={18} color="white" />
                </div>
              ))}
              <button
                onClick={handleLGDisconnect}
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
          /* LG 미연결 상태 */
          <div
            onClick={() => setShowLGConnect(true)}
            style={{
              background: 'var(--surface-container-lowest)',
              borderRadius: 20, padding: '18px 20px', cursor: 'pointer',
              border: '2px dashed rgba(192,57,43,0.3)',
              display: 'flex', alignItems: 'center', gap: 16,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container-lowest)'}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg, #C0392B, #922B21)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: 18, fontFamily: 'Manrope, sans-serif', letterSpacing: '-1px' }}>LG</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 15, marginBottom: 3, color: '#C0392B' }}>
                LG ThinQ 연결
              </div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                냉장고, 세탁기, 에어컨 등 LG 가전을<br />
                MyHouse에서 실시간 제어하세요
              </div>
            </div>
            <MSI name="chevron_right" size={24} color="#C0392B" />
          </div>
        )}
      </div>

      {/* ── Philips Hue 연동 배너 ── */}
      <div style={{ padding: '12px 20px 0' }}>
        {hueConnected ? (
          /* Hue 연결된 상태 */
          <div style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            borderRadius: 20, padding: '18px 20px',
            color: 'white', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.08, fontSize: 120 }}>💡</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80', animation: 'pulse 2s ease-in-out infinite' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, letterSpacing: '0.5px' }}>PHILIPS HUE</span>
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 17, marginBottom: 4 }}>
                  Hue 조명 연결됨
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {hueDevices.length}개 조명 연결 중
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleHueSync}
                  disabled={hueSyncing}
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 12, color: 'white',
                    fontWeight: 700, fontSize: 12, cursor: hueSyncing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <MSI name="sync" size={14} style={{ animation: hueSyncing ? 'spin 1s linear infinite' : 'none' }} />
                  {hueSyncing ? '동기화...' : '동기화'}
                </button>
                <button
                  onClick={() => setShowHueImport(true)}
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
                  조명 추가
                </button>
              </div>
            </div>

            {/* Hue 조명 아이콘 줄 */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              {['lightbulb', 'light_group', 'lamp', 'light', 'bedtime'].map((icon, i) => (
                <div key={i} style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MSI name={icon} fill size={18} color="white" />
                </div>
              ))}
              <button
                onClick={handleHueDisconnect}
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
          /* Hue 미연결 상태 */
          <div
            onClick={() => setShowHueConnect(true)}
            style={{
              background: 'var(--surface-container-lowest)',
              borderRadius: 20, padding: '18px 20px', cursor: 'pointer',
              border: '2px dashed rgba(234,88,12,0.3)',
              display: 'flex', alignItems: 'center', gap: 16,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(234,88,12,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container-lowest)'}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MSI name="lightbulb" fill size={26} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 15, marginBottom: 3, color: '#ea580c' }}>
                Philips Hue 연결
              </div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                스마트 조명을 Bridge를 통해<br />
                MyHouse에서 실시간 제어하세요
              </div>
            </div>
            <MSI name="chevron_right" size={24} color="#ea580c" />
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
              const isLgThinq = d.platform === 'LG_THINQ'
              const isHue = d.platform === 'PHILIPS_HUE'

              return (
                <div
                  key={d.id}
                  style={{
                    background: 'var(--surface-container-lowest)',
                    borderRadius: 20, padding: '16px 18px',
                    border: isSmartThings ? '1.5px solid rgba(20,40,160,0.12)'
                      : isLgThinq ? '1.5px solid rgba(192,57,43,0.15)'
                      : isHue ? '1.5px solid rgba(234,88,12,0.2)' : 'none',
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
                        {/* LG ThinQ 뱃지 */}
                        {isLgThinq && (
                          <div style={{
                            position: 'absolute', bottom: -4, right: -4,
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#C0392B',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid white',
                          }}>
                            <span style={{ color: 'white', fontSize: 6, fontWeight: 900, letterSpacing: '-0.5px' }}>LG</span>
                          </div>
                        )}
                        {/* Philips Hue 뱃지 */}
                        {isHue && (
                          <div style={{
                            position: 'absolute', bottom: -4, right: -4,
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#ea580c',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid white',
                          }}>
                            <MSI name="lightbulb" fill size={8} color="white" />
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
                      ) : isLgThinq ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 20,
                          background: 'rgba(192,57,43,0.08)', fontSize: 10,
                        }}>
                          <span style={{ color: '#C0392B', fontWeight: 700 }}>LG ThinQ</span>
                        </span>
                      ) : isHue ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 20,
                          background: 'rgba(234,88,12,0.08)', fontSize: 10,
                        }}>
                          <MSI name="lightbulb" fill size={10} color="#ea580c" />
                          <span style={{ color: '#ea580c', fontWeight: 700 }}>Philips Hue</span>
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
                        background: isOnline ? (isSmartThings ? '#1428A0' : isLgThinq ? '#C0392B' : isHue ? '#ea580c' : 'var(--secondary)') : 'var(--surface-container-high)',
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
                {/* 플랫폼 연결 안내 배너 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {/* Samsung SmartThings */}
                  {!stConnected && (
                    <div
                      onClick={() => { setShowModal(false); setShowSTConnect(true) }}
                      style={{
                        padding: '12px 14px',
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
                  {/* LG ThinQ */}
                  {!lgConnected && (
                    <div
                      onClick={() => { setShowModal(false); setShowLGConnect(true) }}
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(192,57,43,0.06)',
                        borderRadius: 12, cursor: 'pointer',
                        border: '1px solid rgba(192,57,43,0.15)',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #C0392B, #922B21)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ color: 'white', fontWeight: 900, fontSize: 10, letterSpacing: '-0.5px' }}>LG</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#C0392B' }}>
                          LG ThinQ 연결하기
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                          LG 가전을 자동으로 가져와 제어하세요
                        </div>
                      </div>
                      <MSI name="chevron_right" size={18} color="#C0392B" />
                    </div>
                  )}
                  {/* Philips Hue */}
                  {!hueConnected && (
                    <div
                      onClick={() => { setShowModal(false); setShowHueConnect(true) }}
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(234,88,12,0.06)',
                        borderRadius: 12, cursor: 'pointer',
                        border: '1px solid rgba(234,88,12,0.15)',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #f97316, #ea580c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <MSI name="lightbulb" fill size={16} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#ea580c' }}>
                          Philips Hue 연결하기
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                          스마트 조명을 Bridge를 통해 제어하세요
                        </div>
                      </div>
                      <MSI name="chevron_right" size={18} color="#ea580c" />
                    </div>
                  )}
                </div>

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

      {/* ── Philips Hue 연결 모달 ── */}
      {showHueConnect && (
        <PhilipsHueConnectModal
          onClose={() => setShowHueConnect(false)}
          onConnected={() => { setHueConnected(true); setShowHueImport(true) }}
        />
      )}

      {/* ── Philips Hue 조명 가져오기 모달 ── */}
      {showHueImport && (
        <PhilipsHueImportModal
          onClose={() => setShowHueImport(false)}
          onImported={loadAll}
          houseId={selectedHouse.id}
        />
      )}

      {/* ── LG ThinQ 연결 모달 ── */}
      {showLGConnect && (
        <LgThinqConnectModal
          onClose={() => setShowLGConnect(false)}
          onConnected={() => { setLgConnected(true); setShowLGImport(true) }}
        />
      )}

      {/* ── LG ThinQ 기기 가져오기 모달 ── */}
      {showLGImport && (
        <LgThinqImportModal
          onClose={() => setShowLGImport(false)}
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
