import { useState, useEffect } from 'react'
import { Plus, Search, X, Eye, Heart } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const POST_TYPES = { SELL: { label: '판매', color: '#EEF2FF', text: '#4F46E5', icon: '💰' }, BUY: { label: '구매', color: '#ECFDF5', text: '#10B981', icon: '🛒' }, SHARE: { label: '나눔', color: '#FFF7ED', text: '#F59E0B', icon: '🎁' }, RENT: { label: '대여', color: '#FDF4FF', text: '#A855F7', icon: '🔄' }, FREE: { label: '무료', color: '#FEF2F2', text: '#EF4444', icon: '🆓' } }
const STATUS_MAP = { ACTIVE: { label: '거래중', cls: 'badge-active' }, RESERVED: { label: '예약중', cls: 'badge-warning' }, COMPLETED: { label: '완료', cls: 'badge-gray' }, CLOSED: { label: '마감', cls: 'badge-gray' } }

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
        setForm({
          title: d.title || '',
          content: d.content || '',
          postType: d.postType || 'SELL',
          price: d.price || '',
          isNegotiable: d.isNegotiable || false,
          location: d.location || ''
        })
        setShowModal(true)
        sessionStorage.removeItem('communityDraft')
      } catch (e) {}
    }
  }, [])

  useEffect(() => {
    loadPosts()
  }, [page, postType])

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
    } catch (e) {
      toast.error(e.response?.data?.message || '게시글 등록 실패')
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('게시글을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/community/${id}`)
      toast.success('삭제되었습니다.')
      loadPosts()
      if (selectedPost?.id === id) setSelectedPost(null)
    } catch (e) {
      toast.error('삭제에 실패했습니다.')
    }
  }

  const filtered = posts.filter(p => p.title.includes(search) || p.content.includes(search))

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>이웃과 물품 거래</h2>
          <p style={{ color: '#64748B', fontSize: 14 }}>신뢰 기반 로컬 커뮤니티</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> 게시글 등록</button>
      </div>

      {/* 필터 탭 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => { setPostType(''); setPage(0) }}
          style={{ padding: '6px 16px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            borderColor: !postType ? '#4F46E5' : '#E2E8F0', background: !postType ? '#EEF2FF' : 'white', color: !postType ? '#4F46E5' : '#64748B' }}>
          전체
        </button>
        {Object.entries(POST_TYPES).map(([k, v]) => (
          <button key={k} onClick={() => { setPostType(k); setPage(0) }}
            style={{ padding: '6px 16px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              borderColor: postType === k ? v.text : '#E2E8F0', background: postType === k ? v.color : 'white', color: postType === k ? v.text : '#64748B' }}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input className="form-input" style={{ paddingLeft: 40 }} placeholder="게시글 검색..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* 게시글 목록 */}
        <div style={{ flex: 1 }}>
          {filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">💬</div><h3>게시글이 없습니다</h3>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>첫 게시글 쓰기</button></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.map(post => {
                const pt = POST_TYPES[post.postType]
                return (
                  <div key={post.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedPost(post)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ background: pt.color, color: pt.text, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        {pt.icon} {pt.label}
                      </span>
                      <span className={`badge ${STATUS_MAP[post.status]?.cls}`}>{STATUS_MAP[post.status]?.label}</span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</h3>
                    <p style={{ fontSize: 13, color: '#64748B', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.content}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#4F46E5' }}>
                        {post.price ? `${Number(post.price).toLocaleString()}원` : '가격문의'}
                        {post.isNegotiable && <span style={{ fontSize: 11, fontWeight: 500, color: '#94A3B8', marginLeft: 6 }}>협의가능</span>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={13} /> {post.viewCount}</span>
                        <button style={{ fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}
                          onClick={e => handleDelete(post.id, e)}>🗑️</button>
                      </div>
                    </div>
                    {post.location && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>📍 {post.location}</div>}
                  </div>
                )
              })}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    borderColor: page === i ? '#4F46E5' : '#E2E8F0', background: page === i ? '#EEF2FF' : 'white', color: page === i ? '#4F46E5' : '#64748B' }}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 게시글 상세 패널 */}
        {selectedPost && (
          <div className="card" style={{ width: 320, flexShrink: 0, alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ background: POST_TYPES[selectedPost.postType].color, color: POST_TYPES[selectedPost.postType].text, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                {POST_TYPES[selectedPost.postType].icon} {POST_TYPES[selectedPost.postType].label}
              </span>
              <button className="btn-icon" onClick={() => setSelectedPost(null)}><X size={16} /></button>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{selectedPost.title}</h3>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, marginBottom: 16 }}>{selectedPost.content}</p>
            <div className="divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>가격</span>
                <span style={{ fontWeight: 700, color: '#4F46E5' }}>
                  {selectedPost.price ? `${Number(selectedPost.price).toLocaleString()}원` : '가격문의'}
                </span>
              </div>
              {selectedPost.location && <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>거래장소</span>
                <span style={{ fontWeight: 600 }}>📍 {selectedPost.location}</span>
              </div>}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>조회수</span>
                <span>{selectedPost.viewCount}</span>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
              onClick={() => toast('채팅 기능 준비 중!', { icon: '💬' })}>
              💬 채팅으로 문의하기
            </button>
          </div>
        )}
      </div>

      {/* 게시글 등록 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">게시글 등록</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreatePost}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">거래 유형</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Object.entries(POST_TYPES).map(([k, v]) => (
                      <button key={k} type="button" style={{
                        padding: '6px 14px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        borderColor: form.postType === k ? v.text : '#E2E8F0',
                        background: form.postType === k ? v.color : 'white', color: form.postType === k ? v.text : '#64748B'
                      }} onClick={() => setForm({ ...form, postType: k })}>{v.icon} {v.label}</button>
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
                  <label htmlFor="negotiable" style={{ fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>가격 협의 가능</label>
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
