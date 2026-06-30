'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface Photo {
  id: string
  url: string
  is_primary: boolean
  is_approved: boolean
  moderation_status: string | null
  sort_order: number
}

const S = {
  page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
  header: { marginBottom: 28 },
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 16,
    marginTop: 24,
  },
  card: {
    background: '#0d1117',
    border: '1px solid #1c2333',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  cardImg: { width: '100%', height: 220, objectFit: 'cover' as const, display: 'block' },
  cardBody: { padding: '12px 14px' },
  badge: (approved: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10,
    padding: '3px 8px',
    borderRadius: 20,
    border: `1px solid ${approved ? 'rgba(201,169,110,.3)' : 'rgba(251,191,36,.3)'}`,
    background: approved ? 'rgba(201,169,110,.1)' : 'rgba(251,191,36,.1)',
    color: approved ? '#c9a96e' : '#fbbf24',
  }),
  primaryBadge: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    fontSize: 10,
    padding: '3px 8px',
    borderRadius: 20,
    background: 'rgba(232,96,122,.85)',
    color: '#fff',
    backdropFilter: 'blur(4px)',
  },
  actions: { display: 'flex', gap: 6, marginTop: 10 },
  actionBtn: {
    flex: 1,
    fontSize: 11,
    padding: '6px 8px',
    borderRadius: 8,
    cursor: 'pointer',
    border: '1px solid #1c2333',
    background: 'transparent',
    color: '#9ca3af',
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
    height: 240,
  },
}

export default function PhotosPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const r = await fetch('/api/companions/photos')
    if (r.ok) setPhotos(await r.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB.')
      return
    }
    if (photos.length >= 8) {
      setError('Maximum 8 photos allowed.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const r = await fetch('/api/companions/upload-photo', { method: 'POST', body: form })
      const d = await r.json()
      if (!r.ok) {
        setError(d.error ?? 'Upload failed.')
        return
      }
      await load()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function setPrimary(id: string) {
    await fetch('/api/companions/photos/set-primary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setPhotos((prev) => prev.map((p) => ({ ...p, is_primary: p.id === id })))
  }

  async function deletePhoto(id: string) {
    if (!confirm('Delete this photo?')) return
    await fetch(`/api/companions/photos/${id}`, { method: 'DELETE' })
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div style={S.page}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          ...S.header,
        }}
      >
        <div>
          <p style={S.eyebrow}>Media</p>
          <h1 style={S.title}>Photos</h1>
          <p style={S.sub}>
            {photos.length}/8 photos · {photos.filter((p) => p.is_approved).length} approved
          </p>
        </div>
        <button
          style={{ ...S.uploadBtn, opacity: uploading ? 0.6 : 1 }}
          onClick={() => fileRef.current?.click()}
          disabled={uploading || photos.length >= 8}
        >
          {uploading ? 'Uploading…' : '+ Add photo'}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={onFileSelect}
      />

      {error && <div style={S.err}>{error}</div>}

      {loading ? (
        <div style={S.grid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={S.shimmer} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
          <p>No photos yet. Add up to 8 photos to build your profile.</p>
          <button
            style={{ ...S.uploadBtn, marginTop: 16 }}
            onClick={() => fileRef.current?.click()}
          >
            + Add first photo
          </button>
        </div>
      ) : (
        <div style={S.grid}>
          {photos.map((photo) => (
            <div key={photo.id} style={S.card}>
              <div style={{ position: 'relative', height: 220 }}>
                <Image src={photo.url} alt="" fill style={{ objectFit: 'cover' }} sizes="220px" />
                {photo.is_primary && <div style={S.primaryBadge}>✦ Primary</div>}
              </div>
              <div style={S.cardBody}>
                <span style={S.badge(photo.is_approved)}>
                  {photo.is_approved ? '✦ Approved' : '⏳ Pending'}
                </span>
                <div style={S.actions}>
                  {!photo.is_primary && (
                    <button style={S.actionBtn} onClick={() => setPrimary(photo.id)}>
                      Set primary
                    </button>
                  )}
                  <button
                    style={{
                      ...S.actionBtn,
                      color: '#f87171',
                      borderColor: 'rgba(248,113,113,.25)',
                    }}
                    onClick={() => deletePhoto(photo.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: '#4b5563', marginTop: 24 }}>
        Photos are reviewed by our team before appearing publicly. Primary photo appears first on
        your profile.
      </p>
    </div>
  )
}
