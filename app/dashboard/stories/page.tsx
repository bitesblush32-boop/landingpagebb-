'use client'

import { useState, useEffect } from 'react'

interface Story {
  id: string
  title: string
  excerpt: string | null
  body?: string | null
  moderation_status: string
  created_at: string
  updated_at: string
}

const S = {
  page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: '#6b7280',
    marginBottom: 6,
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: 28,
    color: '#eeeef0',
    lineHeight: 1.2,
    marginBottom: 6,
  },
  sub: { fontSize: 14, color: '#6b7280' },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: '#e8607a',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    minHeight: 44,
  },
  card: {
    background: '#0d1117',
    border: '1px solid #1c2333',
    borderRadius: 14,
    padding: '20px 22px',
    marginBottom: 14,
  },
  storyTitle: { fontSize: 16, fontWeight: 500, color: '#eeeef0', marginBottom: 6 },
  excerpt: { fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 12 },
  badge: (status: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 10,
    padding: '3px 8px',
    borderRadius: 20,
    border: `1px solid ${status === 'approved' ? 'rgba(201,169,110,.3)' : 'rgba(251,191,36,.3)'}`,
    background: status === 'approved' ? 'rgba(201,169,110,.1)' : 'rgba(251,191,36,.1)',
    color: status === 'approved' ? '#c9a96e' : '#fbbf24',
  }),
  actions: { display: 'flex', gap: 8, marginTop: 12 },
  ghostBtn: {
    fontSize: 12,
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    border: '1px solid #1c2333',
    background: 'transparent',
    color: '#9ca3af',
    minHeight: 32,
  },
  deleteBtn: {
    fontSize: 12,
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    border: '1px solid rgba(248,113,113,.25)',
    background: 'transparent',
    color: '#f87171',
    minHeight: 32,
  },
  err: {
    background: 'rgba(248,113,113,.08)',
    border: '1px solid rgba(248,113,113,.25)',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#f87171',
    marginBottom: 16,
  },
  empty: { textAlign: 'center' as const, padding: '60px 20px', color: '#4b5563', fontSize: 14 },
  modal: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'rgba(7,9,15,.85)',
    backdropFilter: 'blur(8px)',
  },
  modalCard: {
    background: '#0d1117',
    border: '1px solid #1c2333',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 560,
  },
  label: { fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' },
  input: {
    width: '100%',
    background: '#111620',
    border: '1px solid #1c2333',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 15,
    color: '#eeeef0',
    outline: 'none',
    marginBottom: 16,
  },
  textarea: {
    width: '100%',
    background: '#111620',
    border: '1px solid #1c2333',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 15,
    color: '#eeeef0',
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: 120,
    marginBottom: 16,
  },
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Story | null>(null)
  const [stTitle, setStTitle] = useState('')
  const [stExcerpt, setStExcerpt] = useState('')
  const [stContent, setStContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const r = await fetch('/api/companions/stories')
    if (r.ok) setStories(await r.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditing(null)
    setStTitle('')
    setStExcerpt('')
    setStContent('')
    setError('')
    setShowModal(true)
  }

  async function openEdit(s: Story) {
    setEditing(s)
    setStTitle(s.title)
    setStExcerpt(s.excerpt ?? '')
    setStContent('')
    setError('')
    setShowModal(true)
    // Fetch full story content for editing
    try {
      const r = await fetch(`/api/companions/stories/${s.id}`)
      if (r.ok) {
        const full = await r.json()
        setStContent(full.body ?? '')
      }
    } catch {
      // Non-fatal — companion can still retype content
    }
  }

  async function save() {
    if (!stTitle.trim()) {
      setError('Title is required.')
      return
    }
    if (!stContent.trim()) {
      setError('Content is required.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const url = editing ? `/api/companions/stories/${editing.id}` : '/api/companions/stories'
      const method = editing ? 'PATCH' : 'POST'
      const body = editing
        ? { title: stTitle, excerpt: stExcerpt || undefined, content: stContent || undefined }
        : { title: stTitle, excerpt: stExcerpt || undefined, content: stContent }
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) {
        setError(d.error ?? 'Failed to save.')
        return
      }
      setShowModal(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function deleteStory(id: string) {
    if (!confirm('Delete this story?')) return
    await fetch(`/api/companions/stories/${id}`, { method: 'DELETE' })
    setStories((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div style={S.page}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 28,
        }}
      >
        <div>
          <p style={S.eyebrow}>Content</p>
          <h1 style={S.title}>Stories</h1>
          <p style={S.sub}>
            {stories.length} {stories.length === 1 ? 'story' : 'stories'}
          </p>
        </div>
        <button style={S.primaryBtn} onClick={openCreate}>
          + Write story
        </button>
      </div>

      {error && <div style={S.err}>{error}</div>}

      {loading ? (
        [...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              background: 'linear-gradient(90deg,#111620 25%,#1c2333 50%,#111620 75%)',
              backgroundSize: '200% 100%',
              borderRadius: 14,
              height: 100,
              marginBottom: 14,
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ))
      ) : stories.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
          <p>No stories yet. Write your first story to keep dreamers coming back.</p>
          <button style={{ ...S.primaryBtn, marginTop: 16 }} onClick={openCreate}>
            + Write first story
          </button>
        </div>
      ) : (
        stories.map((s) => (
          <div key={s.id} style={S.card}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div>
                <div style={S.storyTitle}>{s.title}</div>
                {s.excerpt && <p style={S.excerpt}>{s.excerpt}</p>}
              </div>
              <span style={S.badge(s.moderation_status)}>
                {s.moderation_status === 'approved' ? '✦ Live' : '⏳ Pending'}
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#4b5563' }}>
              {new Date(s.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
            <div style={S.actions}>
              <button style={S.ghostBtn} onClick={() => openEdit(s)}>
                Edit
              </button>
              <button style={S.deleteBtn} onClick={() => deleteStory(s.id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* Create/edit modal */}
      {showModal && (
        <div
          style={S.modal}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false)
          }}
        >
          <div style={S.modalCard}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: '#eeeef0' }}>
                {editing ? 'Edit story' : 'New story'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                ✕
              </button>
            </div>
            {error && <div style={S.err}>{error}</div>}
            <label style={S.label}>Title</label>
            <input
              style={S.input}
              value={stTitle}
              onChange={(e) => setStTitle(e.target.value)}
              placeholder="Give your story a title…"
              maxLength={200}
            />
            <label style={S.label}>Excerpt (optional)</label>
            <input
              style={S.input}
              value={stExcerpt}
              onChange={(e) => setStExcerpt(e.target.value)}
              placeholder="A teasing one-line preview…"
              maxLength={500}
            />
            <label style={S.label}>Content</label>
            <textarea
              style={{ ...S.textarea, minHeight: 200 }}
              value={stContent}
              onChange={(e) => setStContent(e.target.value)}
              placeholder="Write your story here…"
              maxLength={20000}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid #1c2333',
                  color: '#6b7280',
                  borderRadius: 12,
                  padding: 12,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 2,
                  background: '#e8607a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: 12,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  opacity: saving ? 0.6 : 1,
                }}
                onClick={save}
                disabled={saving}
              >
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish story'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
