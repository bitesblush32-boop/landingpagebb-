'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'

interface NotificationRow {
  id: string
  notification_type: string
  title: string
  body: string
  action_url: string | null
  is_read: boolean
  created_at: string
}

const TOAST_MS = 5000

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const seenIds = useRef<Set<string> | null>(null)
  const [toastQueue, setToastQueue] = useState<NotificationRow[]>([])
  const [activeToast, setActiveToast] = useState<NotificationRow | null>(null)

  async function load() {
    try {
      const r = await fetch('/api/companions/notifications')
      if (!r.ok) return
      const data = await r.json()
      const notifications: NotificationRow[] = data.notifications ?? []
      setItems(notifications)
      setUnreadCount(data.unreadCount ?? 0)

      if (seenIds.current === null) {
        // First load — record what already exists, don't toast for history.
        seenIds.current = new Set(notifications.map((n) => n.id))
      } else {
        const fresh = notifications.filter((n) => !n.is_read && !seenIds.current!.has(n.id))
        if (fresh.length > 0) {
          setToastQueue((prev) => [...prev, ...fresh])
          fresh.forEach((n) => seenIds.current!.add(n.id))
        }
        notifications.forEach((n) => seenIds.current!.add(n.id))
      }
    } finally {
      setLoaded(true)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)

    function onSwMessage(e: MessageEvent) {
      if (e.data?.type === 'bb-push-received') load()
    }
    navigator.serviceWorker?.addEventListener?.('message', onSwMessage)

    return () => {
      clearInterval(interval)
      navigator.serviceWorker?.removeEventListener?.('message', onSwMessage)
    }
  }, [])

  // Drain the toast queue one at a time, TOAST_MS apart.
  useEffect(() => {
    if (activeToast || toastQueue.length === 0) return
    const [next, ...rest] = toastQueue
    setActiveToast(next)
    setToastQueue(rest)
  }, [toastQueue, activeToast])

  useEffect(() => {
    if (!activeToast) return
    const t = setTimeout(() => setActiveToast(null), TOAST_MS)
    return () => clearTimeout(t)
  }, [activeToast])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    await fetch('/api/companions/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
  }

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
    await fetch('/api/companions/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
  }

  function dismissToast(id: string) {
    setActiveToast((cur) => (cur?.id === id ? null : cur))
  }

  return (
    <>
      <div ref={panelRef} style={{ position: 'fixed', top: 16, right: 16, zIndex: 250 }}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Notifications"
          style={{
            position: 'relative',
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#0d1117',
            border: '1px solid #1c2333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Bell size={18} color={unreadCount > 0 ? '#e8607a' : '#6b7280'} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 99,
                background: '#e8607a',
                color: '#fff',
                fontSize: 9,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              top: 48,
              right: 0,
              width: 320,
              maxHeight: 420,
              overflowY: 'auto',
              background: '#111620',
              border: '1px solid #1c2333',
              borderRadius: 12,
              boxShadow: '0 12px 32px rgba(0,0,0,.4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderBottom: '1px solid #1c2333',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: '#eeeef0' }}>Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ background: 'none', border: 'none', color: '#e8607a', fontSize: 11, cursor: 'pointer' }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {!loaded ? (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
                Nothing new — check back soon.
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid #1c2333',
                    cursor: n.is_read ? 'default' : 'pointer',
                    background: n.is_read ? 'transparent' : 'rgba(232,96,122,.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    {!n.is_read && (
                      <span
                        style={{
                          marginTop: 5,
                          width: 6,
                          height: 6,
                          borderRadius: 99,
                          background: '#e8607a',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: '#eeeef0', marginBottom: 2 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#9ca3af', lineHeight: 1.4, marginBottom: 4 }}>
                        {n.body}
                      </div>
                      <div style={{ fontSize: 10, color: '#4b5563' }}>{timeAgo(n.created_at)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Toast — one at a time, queued */}
      {activeToast && (
        <div
          key={activeToast.id}
          onClick={() => {
            markRead(activeToast.id)
            dismissToast(activeToast.id)
          }}
          style={{
            position: 'fixed',
            top: 64,
            right: 16,
            zIndex: 260,
            width: 300,
            background: '#111620',
            border: '1px solid #1c2333',
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,.45)',
            padding: '14px 16px',
            cursor: 'pointer',
            animation: 'bbToastIn .2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span
              style={{ marginTop: 5, width: 6, height: 6, borderRadius: 99, background: '#e8607a', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#eeeef0', marginBottom: 3 }}>
                {activeToast.title}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.4 }}>{activeToast.body}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                dismissToast(activeToast.id)
              }}
              aria-label="Dismiss"
              style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 14, padding: 0 }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bbToastIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
