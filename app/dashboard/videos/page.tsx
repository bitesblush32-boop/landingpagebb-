'use client'

import { useState, useEffect, useRef } from 'react'

interface Video {
  id: string
  url: string
  thumbnail_url: string | null
  duration_seconds: number | null
  title: string | null
  moderation_status: string
  created_at: string
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
  uploadBtn: {
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 16,
    marginTop: 24,
  },
  card: {
    background: '#0d1117',
    border: '1px solid #1c2333',
    borderRadius: 14,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: 160,
    background: '#111620',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  playIcon: { fontSize: 36, color: 'rgba(255,255,255,.4)' },
  cardBody: { padding: '14px' },
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
  deleteBtn: {
    marginTop: 10,
    width: '100%',
    fontSize: 12,
    padding: '7px',
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
  shimmer: {
    background: 'linear-gradient(90deg,#111620 25%,#1c2333 50%,#111620 75%)',
    backgroundSize: '200% 100%',
    borderRadius: 14,
    animation: 'shimmer 1.5s infinite',
    height: 220,
  },
  progressBar: {
    height: 4,
    background: '#1c2333',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 12,
  },
}

export default function VideosPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [error, setError] = useState('')

  async function load() {
    const r = await fetch('/api/companions/videos')
    if (r.ok) setVideos(await r.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (videos.length >= 3) {
      setError('Maximum 3 videos allowed.')
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('Video must be under 100 MB.')
      return
    }
    setError('')
    setUploading(true)
    setUploadPct(0)

    try {
      const form = new FormData()
      form.append('file', file)

      const d = await new Promise<{ error?: string; id?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadPct(Math.round((ev.loaded / ev.total) * 95))
        }
        xhr.onload = () => {
          setUploadPct(100)
          try {
            resolve(JSON.parse(xhr.responseText))
          } catch {
            resolve({})
          }
        }
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('POST', '/api/companions/videos/upload')
        xhr.send(form)
      })
      if (d.error) {
        setError(d.error)
        return
      }
      await load()
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setUploadPct(0)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function deleteVideo(id: string) {
    if (!confirm('Delete this video?')) return
    await fetch('/api/companions/videos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setVideos((prev) => prev.filter((v) => v.id !== id))
  }

  function fmt(sec: number | null) {
    if (!sec) return ''
    const m = Math.floor(sec / 60),
      s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
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
          <p style={S.eyebrow}>Media</p>
          <h1 style={S.title}>Videos</h1>
          <p style={S.sub}>{videos.length}/3 videos</p>
        </div>
        <button
          style={{ ...S.uploadBtn, opacity: uploading || videos.length >= 3 ? 0.6 : 1 }}
          onClick={() => fileRef.current?.click()}
          disabled={uploading || videos.length >= 3}
        >
          {uploading ? `Uploading ${uploadPct}%…` : '+ Add video'}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        style={{ display: 'none' }}
        onChange={onFileSelect}
      />

      {error && <div style={S.err}>{error}</div>}

      {uploading && (
        <div style={{ ...S.progressBar, marginBottom: 24 }}>
          <div
            style={{
              width: `${uploadPct}%`,
              height: '100%',
              background: '#e8607a',
              borderRadius: 99,
              transition: 'width .3s',
            }}
          />
        </div>
      )}

      {loading ? (
        <div style={S.grid}>
          {[...Array(2)].map((_, i) => (
            <div key={i} style={S.shimmer} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>▷</div>
          <p>No videos yet. Add up to 3 short video clips.</p>
          <button
            style={{ ...S.uploadBtn, marginTop: 16 }}
            onClick={() => fileRef.current?.click()}
          >
            + Add first video
          </button>
        </div>
      ) : (
        <div style={S.grid}>
          {videos.map((v) => (
            <div key={v.id} style={S.card}>
              <div style={S.thumb}>
                {v.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnail_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={S.playIcon}>▷</span>
                )}
                {v.duration_seconds && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      fontSize: 11,
                      background: 'rgba(7,9,15,.8)',
                      color: '#eeeef0',
                      padding: '2px 6px',
                      borderRadius: 6,
                    }}
                  >
                    {fmt(v.duration_seconds)}
                  </span>
                )}
              </div>
              <div style={S.cardBody}>
                <span style={S.badge(v.moderation_status)}>
                  {v.moderation_status === 'approved' ? '✦ Approved' : '⏳ Pending review'}
                </span>
                {v.title && (
                  <p style={{ fontSize: 13, color: '#eeeef0', marginTop: 8, marginBottom: 0 }}>
                    {v.title}
                  </p>
                )}
                <button style={S.deleteBtn} onClick={() => deleteVideo(v.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: '#4b5563', marginTop: 24 }}>
        Videos are reviewed before appearing publicly. Max 3 videos, 100 MB each. MP4, MOV, or WebM.
      </p>
    </div>
  )
}
