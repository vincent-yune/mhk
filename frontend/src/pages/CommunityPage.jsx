import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const POST_TYPES = {
  SELL:  { label: '판매', color: '#cce8f4', text: '#005b87', icon: 'sell' },
  BUY:   { label: '구매', color: '#b6f2be', text: '#006e1c', icon: 'shopping_cart' },
  SHARE: { label: '나눔', color: '#ffedd5', text: '#b45309', icon: 'volunteer_activism' },
  RENT:  { label: '대여', color: '#e8d5f0', text: '#7b4fa6', icon: 'sync_alt' },
  FREE:  { label: '무료', color: '#ffd9e4', text: '#923357', icon: 'redeem' },
}
const STATUS_MAP = {
  ACTIVE:    { label: '거래중', bg: '#b6f2be', color: '#006e1c' },
  RESERVED:  { label: '예약중', bg: '#fef3c7', color: '#92400e' },
  COMPLETED: { label: '완료',   bg: '#e6e8e9', color: '#40493d' },
  CLOSED:    { label: '마감',   bg: '#e6e8e9', color: '#40493d' },
}

function MSI({ name, fill = false, size = 24, color, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{
      fontSize: size,
      fontVariationSettings: fill ? `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' ${size}` : `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      color: color || 'inherit', lineHeight: 1, display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', ...style,
    }}>{name}</span>
  )
}

export default function CommunityPage() {
  const [posts, setPosts] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [postType, setPostType] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', postType: 'SELL', price: '', isNegotiable: false, location: '' })

  // 물품관리에서 커뮤니티 연계로 넘어왔을 때 자동으로 모달 열기
  useEffect(() => {
    const draft = sessionStorage.getItem('communityDraft')
    if (draft) {
      try {
        const d = JSON.parse(draft)
        setForm({ title: d.title || '', content: d.content || '', postType: d.postType || 'SELL', price: d.price || '', isNegotiable: d.isNegotiable || false, location: d.location || '' })
        setShowModal(true)
        sessionStorage.removeItem('communityDraft')
      } catch (e) {}
    }
  }, [])

  useEffect(() => { loadPosts() }, [page, postType])

  const loadPosts = async () => {
    try {
      let url = `/community?page=${page}&size=12`
      if (postType) url += `&type=${postType}`
      const { data } = await api.get(url)
      setPosts(data.data.content)
      setTotalPages(data.data.totalPages)
    } catch (e) {}
  }

  const handleCreatePost = async e => {
    e.preventDefault()
    try {
      await api.post('/community', form)
      toast.success('게시글이 등록되었습니다!')
      setShowModal(false)
      setForm({ title: '', content: '', postType: 'SELL', price: '', isNegotiable: false, location: '' })
      loadPosts()
    } catch (e) { toast.error(e.response?.data?.message || '게시글 등록 실패') }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('게시글을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/community/${id}`)
      toast.success('삭제되었습니다.')
      loadPosts()
      if (selectedPost?.id === id) setSelectedPost(null)
    } catch (e) { toast.error('삭제에 실패했습니다.') }
  }

  const filtered = posts.filter(p => p.title.includes(search) || p.content.includes(search))

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* ── Hero ── */}
      <div style={{ padding: '28px 20px 20px', background: 'var(--surface-container-lowest)' }}>
        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--on-surface)', marginBottom: 4 }}>
          Discover & Connect
        </h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>이웃과 신뢰 기반 로컬 거래를 시작하세요</p>

        {/* Search */}
        <div style={{ position: 'relative', marginTop: 14 }}>
          <MSI name="search" size={18} color="var(--on-surface-variant)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
          <input
            className="form-input"
            style={{ paddingLeft: 44, borderRadius: 16 }}
            placeholder="가구, 도구, 소식 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--surface-container-low)', borderRadius: 14, padding: 4, marginTop: 12, gap: 2 }}>
          <button
            onClick={() => { setPostType(''); setPage(0) }}
            style={{
              flex: 1, padding: '9px', borderRadius: 10, border: 'none',
              background: !postType ? 'var(--surface-container-lowest)' : 'transparent',
              color: !postType ? 'var(--primary)' : 'var(--on-surface-variant)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              boxShadow: !postType ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >마켓플레이스</button>
          <button
            onClick={() => { setPostType('SHARE'); setPage(0) }}
            style={{
              flex: 1, padding: '9px', borderRadius: 10, border: 'none',
              background: postType === 'SHARE' ? 'var(--surface-container-lowest)' : 'transparent',
              color: postType === 'SHARE' ? 'var(--primary)' : 'var(--on-surface-variant)',
              fontWeight: 500, fontSize: 13, cursor: 'pointer',
              boxShadow: postType === 'SHARE' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >커뮤니티</button>
        </div>
      </div>

      {/* ── Filter Type Chips ── */}
      <div style={{ padding: '12px 20px 0' }}>
        <div className="scroll-row" style={{ paddingBottom: 4 }}>
          {Object.entries(POST_TYPES).map(([k, v]) => (
            <button
              key={k}
              onClick={() => { setPostType(postType === k ? '' : k); setPage(0) }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 20, border: 'none', flexShrink: 0,
                background: postType === k ? v.color : 'var(--surface-container-lowest)',
                color: postType === k ? v.text : 'var(--on-surface-variant)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <MSI name={v.icon} fill={postType === k} size={14} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Featured Section (Bento) ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700 }}>최근 게시글</div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>이웃의 물품 거래</div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 16px',
              background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
              color: 'white', border: 'none', borderRadius: 20,
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            <MSI name="add" size={16} />글 등록
          </button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--on-surface-variant)' }}>
            <MSI name="storefront" size={52} color="var(--outline-variant)" style={{ display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>게시글이 없습니다</div>
            <button onClick={() => setShowModal(true)} style={{ marginTop: 8, padding: '12px 24px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: 'white', border: 'none', borderRadius: 24, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              첫 게시글 쓰기
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(post => {
              const pt = POST_TYPES[post.postType] || POST_TYPES.SELL
              const st = STATUS_MAP[post.status] || STATUS_MAP.ACTIVE
              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                  style={{
                    background: 'var(--surface-container-lowest)',
                    borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                    transition: 'transform 0.15s',
                    outline: selectedPost?.id === post.id ? '2px solid rgba(0,91,135,0.25)' : 'none',
                  }}
                  onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
                  onTouchEnd={e => e.currentTarget.style.transform = ''}
                >
                  <div style={{ padding: '14px 16px' }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: pt.color, color: pt.text, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          <MSI name={pt.icon} fill size={12} color={pt.text} />{pt.label}
                        </span>
                        <span style={{ background: st.bg, color: st.color, padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600 }}>
                          {st.label}
                        </span>
                      </div>
                      <button
                        onClick={e => handleDelete(post.id, e)}
                        style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(186,26,26,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <MSI name="delete" size={13} color="var(--error)" />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.title}
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.content}
                    </p>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>
                        {post.price ? `${Number(post.price).toLocaleString()}원` : '가격문의'}
                        {post.isNegotiable && <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--on-surface-variant)', marginLeft: 4 }}>협의가능</span>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MSI name="visibility" size={13} color="var(--on-surface-variant)" />
                        <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{post.viewCount}</span>
                        {post.location && (
                          <>
                            <MSI name="location_on" size={13} color="var(--on-surface-variant)" />
                            <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {selectedPost?.id === post.id && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <div style={{ background: 'var(--surface-container-low)', borderRadius: 14, padding: 14 }}>
                        <p style={{ fontSize: 13, color: 'var(--on-surface)', lineHeight: 1.7, marginBottom: 12 }}>{post.content}</p>
                        <button
                          onClick={() => toast('채팅 기능 준비 중!', { icon: '💬' })}
                          style={{
                            width: '100%', padding: '12px', borderRadius: 14,
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                            color: 'white', border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}
                        >
                          <MSI name="chat" fill size={18} />채팅으로 문의하기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                style={{
                  width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13,
                  background: page === i ? 'var(--primary-container)' : 'var(--surface-container-lowest)',
                  color: page === i ? 'var(--primary)' : 'var(--on-surface-variant)',
                }}
              >{i + 1}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── Community Stat Banner ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{
          background: 'rgba(0,110,28,0.06)',
          borderRadius: 20, padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <MSI name="eco" fill size={36} color="var(--secondary)" />
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--on-surface)' }}>Eco-Impact</div>
            <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2, lineHeight: 1.5 }}>
              이웃 간 물품 거래로 폐기물을 줄이고 지속가능한 공동체를 만들어요!
            </p>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fab"
      >
        <MSI name="add" size={26} />
      </button>

      {/* ── Create Post Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <div className="modal-title">게시글 등록</div>
              <button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-container-low)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MSI name="close" size={18} color="var(--on-surface-variant)" />
              </button>
            </div>
            <form onSubmit={handleCreatePost}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">거래 유형</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Object.entries(POST_TYPES).map(([k, v]) => (
                      <button
                        key={k} type="button"
                        onClick={() => setForm({ ...form, postType: k })}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                          fontSize: 12, fontWeight: 600,
                          background: form.postType === k ? v.color : 'var(--surface-container-low)',
                          color: form.postType === k ? v.text : 'var(--on-surface-variant)',
                        }}
                      >
                        <MSI name={v.icon} fill={form.postType === k} size={14} />{v.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">제목 *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="물품명 및 상태를 간략히 적어주세요" />
                </div>
                <div className="form-group">
                  <label className="form-label">내용 *</label>
                  <textarea className="form-textarea" style={{ minHeight: 100 }} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required placeholder="물품 상태, 거래 방법 등을 자세히 적어주세요" />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">희망가격 (원)</label>
                    <input type="number" className="form-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">거래 장소</label>
                    <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="강남역 2번 출구" />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="negotiable" checked={form.isNegotiable} onChange={e => setForm({ ...form, isNegotiable: e.target.checked })} />
                  <label htmlFor="negotiable" style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface-variant)', cursor: 'pointer' }}>가격 협의 가능</label>
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
