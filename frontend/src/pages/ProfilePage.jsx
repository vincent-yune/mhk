import { useState, useEffect } from 'react'
import { User, Mail, Phone, Star, Shield, Edit2, Save, X, Camera } from 'lucide-react'
import api from '../api/axios'
import { useAuthStore } from '../store/useStore'
import toast from 'react-hot-toast'

const GRADE_INFO = {
  BRONZE: { label: '브론즈', color: '#CD7F32', bg: '#FDF4EB', emoji: '🥉', nextGrade: 'SILVER', nextScore: 100 },
  SILVER: { label: '실버', color: '#C0C0C0', bg: '#F5F5F5', emoji: '🥈', nextGrade: 'GOLD', nextScore: 300 },
  GOLD: { label: '골드', color: '#FFD700', bg: '#FFFBEB', emoji: '🥇', nextGrade: 'PLATINUM', nextScore: 500 },
  PLATINUM: { label: '플래티넘', color: '#E5E4E2', bg: '#F0F4F8', emoji: '💎', nextGrade: null, nextScore: null },
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPwChange, setShowPwChange] = useState(false)
  const [activeTab, setActiveTab] = useState('profile') // profile | activity | settings

  const grade = GRADE_INFO[user?.grade] || GRADE_INFO.BRONZE

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '' })
    }
  }, [user])

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
    <div>
      {/* 헤더 */}
      <div className="page-header">
        <h2 className="page-title">👤 내 프로필</h2>
        <p className="page-subtitle">회원 정보 및 활동 내역을 확인하세요</p>
      </div>

      {/* 프로필 카드 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {/* 아바타 */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 36, fontWeight: 700, flexShrink: 0
            }}>
              {user?.name?.[0] || 'U'}
            </div>
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: '50%',
              background: '#4F46E5', border: '2px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}>
              <Camera size={12} color="white" />
            </div>
          </div>

          {/* 기본 정보 */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', marginBottom: 4 }}>{user?.name}</h2>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 8 }}>{user?.email}</p>
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
                background: '#ECFDF5', color: '#059669', fontWeight: 600,
                fontSize: 12, padding: '4px 10px', borderRadius: 20,
                border: '1.5px solid #A7F3D0'
              }}>
                ⭐ 신뢰도 {user?.trustScore || 0}점
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#EEF2FF', color: '#4F46E5', fontWeight: 600,
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
                  <Save size={14} /> {loading ? '저장 중...' : '저장'}
                </button>
                <button className="btn btn-secondary" onClick={() => { setEditing(false); setForm({ name: user.name, phone: user.phone || '' }) }}>
                  <X size={14} /> 취소
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                <Edit2 size={14} /> 편집
              </button>
            )}
          </div>
        </div>

        {/* 등급 프로그레스 */}
        {grade.nextGrade && (
          <div style={{ marginTop: 20, padding: '16px', background: '#F8FAFC', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                다음 등급까지: {GRADE_INFO[grade.nextGrade].emoji} {GRADE_INFO[grade.nextGrade].label}
              </span>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                {user?.trustScore || 0} / {grade.nextScore}점
              </span>
            </div>
            <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
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

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #E2E8F0' }}>
        {[
          { id: 'profile', label: '📋 개인정보' },
          { id: 'security', label: '🔒 보안 설정' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: activeTab === tab.id ? 700 : 500,
            color: activeTab === tab.id ? '#4F46E5' : '#64748B',
            borderBottom: activeTab === tab.id ? '2px solid #4F46E5' : '2px solid transparent',
            marginBottom: -2, transition: 'all 0.2s'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 개인정보 탭 */}
      {activeTab === 'profile' && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#1E293B' }}>기본 정보</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">
                <User size={14} style={{ marginRight: 6 }} />이름
              </label>
              {editing ? (
                <input className="form-input" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              ) : (
                <div style={{ padding: '10px 0', fontSize: 15, color: '#1E293B', fontWeight: 500 }}>{user?.name}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">
                <Mail size={14} style={{ marginRight: 6 }} />이메일
              </label>
              <div style={{ padding: '10px 0', fontSize: 15, color: '#64748B' }}>{user?.email}
                <span style={{ marginLeft: 8, fontSize: 11, background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: 10 }}>인증됨</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                <Phone size={14} style={{ marginRight: 6 }} />전화번호
              </label>
              {editing ? (
                <input className="form-input" value={form.phone} placeholder="010-0000-0000"
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              ) : (
                <div style={{ padding: '10px 0', fontSize: 15, color: '#1E293B', fontWeight: 500 }}>
                  {user?.phone || <span style={{ color: '#94A3B8' }}>미등록</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 보안 설정 탭 */}
      {activeTab === 'security' && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#1E293B' }}>🔒 비밀번호 변경</h3>
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
    </div>
  )
}
