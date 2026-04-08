import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuthStore, useHouseStore } from '../store/useStore'
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

const GRADE_INFO = {
  BRONZE:   { label: '브론즈',   color: '#CD7F32', bg: '#FDF4EB', emoji: '🥉', nextGrade: 'SILVER',   nextScore: 100 },
  SILVER:   { label: '실버',     color: '#C0C0C0', bg: '#F5F5F5', emoji: '🥈', nextGrade: 'GOLD',     nextScore: 300 },
  GOLD:     { label: '골드',     color: '#FFD700', bg: '#FFFBEB', emoji: '🥇', nextGrade: 'PLATINUM', nextScore: 500 },
  PLATINUM: { label: '플래티넘', color: '#E5E4E2', bg: '#F0F4F8', emoji: '💎', nextGrade: null,       nextScore: null },
}

// 추가 가능한 구역 목록 (preset)
const ZONE_PRESETS = [
  { name: '복도',     zoneType: 'CORRIDOR',     icon: 'meeting_room',  bg: '#e0e7ff', color: '#3730a3' },
  { name: '실외기실', zoneType: 'UTILITY_ROOM', icon: 'hvac',          bg: '#fef3c7', color: '#92400e' },
  { name: '팬트리',   zoneType: 'PANTRY',       icon: 'shelves',       bg: '#d1fae5', color: '#065f46' },
  { name: '화장실',   zoneType: 'TOILET',       icon: 'wc',            bg: '#cce8f4', color: '#005b87' },
  { name: '주차',     zoneType: 'PARKING',      icon: 'local_parking', bg: '#ffd9e4', color: '#923357' },
]

const ZONE_META = {
  LIVING_ROOM:  { icon: 'weekend',        bg: '#cce8f4', color: '#005b87' },
  KITCHEN:      { icon: 'skillet',        bg: '#ffd9e4', color: '#923357' },
  BEDROOM:      { icon: 'bed',            bg: '#e8d5f0', color: '#7b4fa6' },
  BATHROOM:     { icon: 'bathtub',        bg: '#b6f2be', color: '#006e1c' },
  STUDY:        { icon: 'menu_book',      bg: '#fef9c3', color: '#854d0e' },
  BALCONY:      { icon: 'deck',           bg: '#d1fae5', color: '#065f46' },
  GARAGE:       { icon: 'directions_car', bg: '#e0e7ff', color: '#3730a3' },
  CORRIDOR:     { icon: 'meeting_room',   bg: '#e0e7ff', color: '#3730a3' },
  UTILITY_ROOM: { icon: 'hvac',           bg: '#fef3c7', color: '#92400e' },
  PANTRY:       { icon: 'shelves',        bg: '#d1fae5', color: '#065f46' },
  TOILET:       { icon: 'wc',            bg: '#cce8f4', color: '#005b87' },
  PARKING:      { icon: 'local_parking',  bg: '#ffd9e4', color: '#923357' },
  OTHER:        { icon: 'room',           bg: '#f1f5f9', color: '#475569' },
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const { selectedHouse, selectHouse } = useHouseStore()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPwChange, setShowPwChange] = useState(false)
  const [activeTab, setActiveTab] = useState('profile') // profile | zones | security

  // 구역 관련 state
  const [zones, setZones] = useState([])
  const [zonesLoading, setZonesLoading] = useState(false)

  const grade = GRADE_INFO[user?.grade] || GRADE_INFO.BRONZE

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '' })
  }, [user])

  // selectedHouse가 없으면 집 목록을 자동으로 불러와서 첫 번째 집 선택
  useEffect(() => {
    if (!selectedHouse) {
      api.get('/houses').then(({ data }) => {
        const list = data.data || []
        if (list.length > 0) {
          const primary = list.find(h => h.isPrimary) || list[0]
          selectHouse(primary)
        }
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'zones' && selectedHouse) loadZones()
  }, [activeTab, selectedHouse])

  const loadZones = async () => {
    if (!selectedHouse) return
    setZonesLoading(true)
    try {
      const { data } = await api.get(`/houses/${selectedHouse.id}/zones`)
      setZones(data.data || [])
    } catch (e) { toast.error('구역 로드 실패') }
    finally { setZonesLoading(false) }
  }

  const handleAddZone = async (preset) => {
    if (!selectedHouse) { toast.error('집을 먼저 선택해주세요'); return }
    try {
      await api.post(`/houses/${selectedHouse.id}/zones`, {
        name: preset.name,
        zoneType: preset.zoneType,
        icon: preset.icon,
      })
      toast.success(`'${preset.name}' 구역이 추가되었습니다`)
      loadZones()
    } catch (e) { toast.error('구역 추가 실패') }
  }

  const handleDeleteZone = async (zone) => {
    if (!confirm(`'${zone.name}' 구역을 삭제하시겠습니까?\n해당 구역의 물품 연결이 해제됩니다.`)) return
    try {
      await api.delete(`/houses/${selectedHouse.id}/zones/${zone.id}`)
      toast.success(`'${zone.name}' 구역이 삭제되었습니다`)
      loadZones()
    } catch (e) { toast.error('구역 삭제 실패') }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('이름을 입력해주세요'); return }
    setLoading(true)
    try {
      const { data } = await api.put('/users/profile', form)
      if (data.success) {
        updateUser({ ...user, ...form })
        toast.success('프로필이 업데이트되었습니다')
        setEditing(false)
      }
    } catch (err) {
      // 서버 연동 전 임시 로컬 업데이트
      updateUser({ ...user, ...form })
      toast.success('프로필이 업데이트되었습니다')
      setEditing(false)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다')
      return
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 합니다')
      return
    }
    setLoading(true)
    try {
      await api.put('/users/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      })
      toast.success('비밀번호가 변경되었습니다')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPwChange(false)
    } catch (err) {
      toast.error(err.response?.data?.message || '비밀번호 변경에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* ── Profile Hero ── */}
      <div style={{ padding: '28px 20px 20px', background: 'var(--surface-container-lowest)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--tertiary)', marginBottom: 4 }}>RESIDENCE PROFILE</div>
        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 16 }}>내 프로필</h2>

      {/* 프로필 카드 */}
      <div style={{ background: 'var(--surface-container-low)', borderRadius: 20, padding: 16, marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* 아바타 */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 28, fontWeight: 800, flexShrink: 0,
              fontFamily: 'Manrope, sans-serif',
            }}>
              {user?.name?.[0] || 'U'}
            </div>
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--primary)', border: '2px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}>
              <MSI name="photo_camera" fill size={12} color="white" />
            </div>
          </div>

          {/* 기본 정보 */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 4 }}>{user?.name}</h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginBottom: 8 }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: grade.bg, color: grade.color, fontWeight: 700,
                fontSize: 12, padding: '4px 10px', borderRadius: 20,
                border: `1.5px solid ${grade.color}`
              }}>
                {grade.emoji} {grade.label}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'var(--secondary-container)', color: '#059669', fontWeight: 600,
                fontSize: 12, padding: '4px 10px', borderRadius: 20,
                border: '1.5px solid #A7F3D0'
              }}>
                ⭐ 신뢰도 {user?.trustScore || 0}점
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'var(--primary-container)', color: 'var(--primary)', fontWeight: 600,
                fontSize: 12, padding: '4px 10px', borderRadius: 20,
                border: '1.5px solid #C7D2FE'
              }}>
                🛡️ {user?.role === 'ADMIN' ? '관리자' : '일반 회원'}
              </span>
            </div>
          </div>

          {/* 편집 버튼 */}
          <div>
            {editing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                  <MSI name="save" fill size={14} /> {loading ? '저장 중...' : '저장'}
                </button>
                <button className="btn btn-secondary" onClick={() => { setEditing(false); setForm({ name: user.name, phone: user.phone || '' }) }}>
                  <MSI name="close" size={14} /> 취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--surface-container-high)', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: 'var(--on-surface-variant)' }}
              >
                <MSI name="edit" size={16} /> 편집
              </button>
            )}
          </div>
        </div>

        {/* 등급 프로그레스 */}
        {grade.nextGrade && (
          <div style={{ marginTop: 20, padding: '16px', background: 'var(--surface)', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>
                다음 등급까지: {GRADE_INFO[grade.nextGrade].emoji} {GRADE_INFO[grade.nextGrade].label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                {user?.trustScore || 0} / {grade.nextScore}점
              </span>
            </div>
            <div style={{ height: 8, background: 'var(--outline-variant)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, ((user?.trustScore || 0) / grade.nextScore) * 100)}%`,
                background: `linear-gradient(90deg, ${grade.color}, #4F46E5)`,
                borderRadius: 4, transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
      </div>
      </div>{/* close hero section */}

      {/* 탭 */}
      <div style={{ padding: '16px 20px 0' }}>
      <div style={{ display: 'flex', background: 'var(--surface-container-low)', borderRadius: 14, padding: 4, marginBottom: 16, gap: 2 }}>
        {[
          { id: 'profile', label: '개인정보', icon: 'person' },
          { id: 'zones',   label: '구역 관리', icon: 'room_preferences' },
          { id: 'security', label: '보안 설정', icon: 'lock' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500,
              background: activeTab === tab.id ? 'var(--surface-container-lowest)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--on-surface-variant)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <MSI name={tab.icon} fill={activeTab === tab.id} size={15} />{tab.label}
          </button>
        ))}
      </div>

      {/* 개인정보 탭 */}
      {activeTab === 'profile' && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--on-surface)' }}>기본 정보</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">이름</label>
              {editing ? (
                <input className="form-input" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              ) : (
                <div style={{ padding: '10px 0', fontSize: 15, color: 'var(--on-surface)', fontWeight: 500 }}>{user?.name}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">이메일</label>
              <div style={{ padding: '10px 0', fontSize: 15, color: 'var(--on-surface-variant)' }}>{user?.email}
                <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--secondary-container)', color: '#059669', padding: '2px 8px', borderRadius: 10 }}>인증됨</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">전화번호</label>
              {editing ? (
                <input className="form-input" value={form.phone} placeholder="010-0000-0000"
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              ) : (
                <div style={{ padding: '10px 0', fontSize: 15, color: 'var(--on-surface)', fontWeight: 500 }}>
                  {user?.phone || <span style={{ color: 'var(--text-muted)' }}>미등록</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 구역 관리 탭 ── */}
      {activeTab === 'zones' && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MSI name="room_preferences" fill size={18} color="var(--primary)" /> 구역 관리
          </h3>
          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 20 }}>
            {selectedHouse ? `${selectedHouse.name}의 구역을 관리합니다` : '집을 먼저 선택해주세요'}
          </p>

          {!selectedHouse ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--on-surface-variant)' }}>
              <MSI name="home" size={40} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 14 }}>홈 화면에서 집을 먼저 선택해주세요</div>
            </div>
          ) : (
            <>
              {/* 현재 구역 목록 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MSI name="format_list_bulleted" size={15} color="var(--primary)" />
                  등록된 구역 {zones.length}개
                </div>
                {zonesLoading ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--on-surface-variant)', fontSize: 13 }}>불러오는 중...</div>
                ) : zones.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--on-surface-variant)', fontSize: 13 }}>등록된 구역이 없습니다</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {zones.map(z => {
                      const meta = ZONE_META[z.zoneType] || ZONE_META.OTHER
                      return (
                        <div key={z.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          background: 'var(--surface-container-low)', borderRadius: 14, padding: '10px 14px',
                        }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MSI name={meta.icon} fill size={18} color={meta.color} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--on-surface)' }}>{z.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 1 }}>물품 {z.itemCount ?? 0}개</div>
                          </div>
                          <button
                            onClick={() => handleDeleteZone(z)}
                            style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(186,26,26,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >
                            <MSI name="delete" size={15} color="var(--error)" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 추가 가능한 구역 목록 */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MSI name="add_circle" size={15} color="var(--secondary)" />
                  추가 가능한 구역
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ZONE_PRESETS.map(preset => {
                    const alreadyAdded = zones.some(z => z.zoneType === preset.zoneType)
                    return (
                      <div key={preset.zoneType} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: alreadyAdded ? 'var(--surface-container-low)' : 'var(--surface-container-lowest)',
                        borderRadius: 14, padding: '10px 14px',
                        opacity: alreadyAdded ? 0.5 : 1,
                        border: alreadyAdded ? 'none' : '1px dashed var(--outline-variant)',
                      }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: preset.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <MSI name={preset.icon} fill size={18} color={preset.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--on-surface)' }}>{preset.name}</div>
                          {alreadyAdded && <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>이미 추가됨</div>}
                        </div>
                        <button
                          onClick={() => !alreadyAdded && handleAddZone(preset)}
                          disabled={alreadyAdded}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '6px 14px', borderRadius: 20, border: 'none',
                            background: alreadyAdded ? 'var(--surface-container-high)' : 'var(--primary)',
                            color: alreadyAdded ? 'var(--on-surface-variant)' : 'white',
                            fontSize: 12, fontWeight: 600, cursor: alreadyAdded ? 'default' : 'pointer', flexShrink: 0,
                          }}
                        >
                          <MSI name={alreadyAdded ? 'check' : 'add'} size={14} />
                          {alreadyAdded ? '완료' : '추가'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 보안 설정 탭 */}      {activeTab === 'security' && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--on-surface)' }}>🔒 비밀번호 변경</h3>
          {!showPwChange ? (
            <button className="btn btn-secondary" onClick={() => setShowPwChange(true)}>
              비밀번호 변경하기
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} style={{ maxWidth: 400 }}>
              <div className="form-group">
                <label className="form-label">현재 비밀번호</label>
                <input type="password" className="form-input" value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">새 비밀번호 (6자 이상)</label>
                <input type="password" className="form-input" value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">새 비밀번호 확인</label>
                <input type="password" className="form-input" value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '변경 중...' : '변경하기'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPwChange(false)}>
                  취소
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: 32, padding: 20, background: '#FFF8F0', borderRadius: 12, border: '1px solid #FED7AA' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>⚠️ 계정 보안 안내</h4>
            <ul style={{ fontSize: 13, color: '#B45309', lineHeight: 1.8, paddingLeft: 16 }}>
              <li>비밀번호는 6자 이상으로 설정해주세요</li>
              <li>영문, 숫자, 특수문자를 조합하면 더 안전합니다</li>
              <li>다른 서비스와 동일한 비밀번호는 사용하지 마세요</li>
            </ul>
          </div>
        </div>
      )}
      </div>{/* close padding wrapper */}
    </div>
  )
}
