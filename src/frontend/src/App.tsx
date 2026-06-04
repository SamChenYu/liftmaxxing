import { useState, useEffect, useCallback } from 'react'
import './App.css'

interface TrainArrival {
  vehicleId: number
  lineId: string
  platformName: string
  expectedArrival: string
  timeToLive: string
  timeToStation: number
}

interface LiftmaxData {
  next: Record<string, TrainArrival>
  last: Record<string, TrainArrival>
}

type Direction = 'district-to-elizabeth' | 'elizabeth-to-district'

const LINES: Record<string, { name: string; color: string }> = {
  elizabeth: { name: 'Elizabeth', color: 'var(--elizabeth)' },
  windrush: { name: 'Windrush', color: 'var(--overground)' },
  district: { name: 'District / Hammersmith', color: 'var(--district)' },
}

function platformLabel(lineId: string, name: string): { label: string; lift: boolean } {
  if (lineId === 'elizabeth') {
    if (name === 'A') return { label: 'Eastbound · Plat A', lift: false }
    if (name === 'B') return { label: 'Westbound · Plat B', lift: false }
  }
  if (lineId === 'windrush') {
    if (name === 'Platform 5') return { label: 'Northbound · Plat 5', lift: true }
    if (name === 'Platform 6') return { label: 'Southbound · Plat 6', lift: false }
  }
  if (lineId === 'district') {
    if (name.includes('1')) return { label: 'Eastbound · Plat 1', lift: false }
    if (name.includes('2')) return { label: 'Westbound · Plat 2', lift: false }
  }
  return { label: name, lift: false }
}

function fmtCountdown(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtDeparted(secAgo: number): string {
  const ago = Math.abs(secAgo)
  if (ago < 60) return `arrived ${ago}s ago`
  const m = Math.floor(ago / 60)
  const s = ago % 60
  return `arrived ${m}:${s.toString().padStart(2, '0')} ago`
}

function getOrCreateUserId(): string {
  let id = localStorage.getItem('liftmaxxing-uid')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('liftmaxxing-uid', id)
  }
  return id
}

function groupByLine(entries: Record<string, TrainArrival>) {
  const g: Record<string, TrainArrival[]> = {}
  for (const t of Object.values(entries)) {
    ;(g[t.lineId] ??= []).push(t)
  }
  for (const a of Object.values(g)) a.sort((x, y) => new Date(x.expectedArrival).getTime() - new Date(y.expectedArrival).getTime())
  return g
}

export default function App() {
  const [dir, setDir] = useState<Direction>('district-to-elizabeth')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  })
  const [data, setData] = useState<LiftmaxData | null>(null)
  const [fetchedAt, setFetchedAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const base = import.meta.env.VITE_BACKEND_URL || ''

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${base}/liftmax`)
      if (!r.ok) throw new Error(r.status === 400 ? 'Waiting for station data…' : `Error ${r.status}`)
      setData(await r.json())
      setFetchedAt(Date.now())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setLoading(false)
    }
  }, [base])

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const submitData = async (madeIt: boolean) => {
    setSubmitting(true)
    try {
      await fetch(`${base}/api/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          made_it: madeIt,
          direction: dir,
          user_id: getOrCreateUserId(),
        }),
      })
      setSubmitResult('success')
    } catch {
      setSubmitResult('error')
    } finally {
      setSubmitting(false)
      setTimeout(() => {
        setModalOpen(false)
        setSubmitResult(null)
      }, 1200)
    }
  }

  const order =
    dir === 'district-to-elizabeth'
      ? ['district', 'windrush', 'elizabeth']
      : ['elizabeth', 'windrush', 'district']

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="spinner" />
        <p>Connecting to station…</p>
      </div>
    )
  }

  const nextG = data ? groupByLine(data.next) : {}
  const lastG = data ? groupByLine(data.last) : {}

  return (
    <div className="app">
      <header>
        <button className="data-btn" onClick={() => setModalOpen(true)}>
          Data Collection
        </button>
        <h1>LiftMaxxing</h1>
        <p className="sub">Whitechapel Interchange</p>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <nav className="toggle">
        <button className={dir === 'district-to-elizabeth' ? 'on' : ''} onClick={() => setDir('district-to-elizabeth')}>
          <span className="dot" style={{ background: 'var(--district)' }} />
          District → Eliz.
          <span className="dot" style={{ background: 'var(--elizabeth)' }} />
        </button>
        <button className={dir === 'elizabeth-to-district' ? 'on' : ''} onClick={() => setDir('elizabeth-to-district')}>
          <span className="dot" style={{ background: 'var(--elizabeth)' }} />
          Eliz. → District
          <span className="dot" style={{ background: 'var(--district)' }} />
        </button>
      </nav>

      <div className="prediction">
        <span className="prediction-pct">50%</span>
        <span className="prediction-label">chance of making the lift</span>
        <span className="prediction-note">Placeholder — model not yet trained (collecting data)</span>
      </div>

      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}

      {data &&
        order.map((lineId) => {
          const nextTrains = nextG[lineId] || []
          const lastTrains = lastG[lineId] || []
          const lastByPlat: Record<string, TrainArrival> = {}
          const nextByPlat: Record<string, TrainArrival> = {}
          for (const t of lastTrains) lastByPlat[t.platformName] = t
          for (const t of nextTrains) nextByPlat[t.platformName] = t
          const platforms = [...new Set([...Object.keys(lastByPlat), ...Object.keys(nextByPlat)])]
          const l = LINES[lineId]
          return (
            <div key={lineId} className="line-group">
              <div className="line-label" style={{ color: l.color }}>
                <span className="line-dot" style={{ background: l.color }} />
                {l.name}
              </div>
              <div className="line-columns">
                {(['last', 'next'] as const).map((col) => {
                  const byPlat = col === 'last' ? lastByPlat : nextByPlat
                  return (
                    <div key={col} className="col">
                      <h3>{col === 'last' ? 'Last' : 'Next'}</h3>
                      <div className="col-cards">
                        {platforms.map((platName) => {
                          const t = byPlat[platName]
                          const p = platformLabel(lineId, platName)
                          if (!t) {
                            return (
                              <div key={platName} className="card" style={{ borderLeftColor: l.color }}>
                                <span className="plat">{p.label}</span>
                                <span className="time no-data-text">API data not available</span>
                              </div>
                            )
                          }
                          const diff = Math.floor((new Date(t.expectedArrival).getTime() - now) / 1000)
                          const departed = diff <= 0
                          return (
                            <div key={platName} className="card" style={{ borderLeftColor: l.color }}>
                              <span className="plat">
                                {p.label}
                                {p.lift && <span className="lift-tag">Lift</span>}
                              </span>
                              <span className={`time ${departed ? 'departed' : ''}`}>
                                {departed ? fmtDeparted(diff) : fmtCountdown(diff)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

      {data && <footer>Updated {new Date(fetchedAt).toLocaleTimeString()}</footer>}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => !submitting && setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {submitResult ? (
              <p className={`modal-result ${submitResult}`}>
                {submitResult === 'success' ? 'Recorded!' : 'Failed to submit'}
              </p>
            ) : (
              <>
                <h2>Did you make it to the lift?</h2>
                <p className="modal-context">
                  Direction: {dir === 'district-to-elizabeth' ? 'District → Elizabeth' : 'Elizabeth → District'}
                </p>
                <div className="modal-actions">
                  <button className="modal-btn yes" onClick={() => submitData(true)} disabled={submitting}>
                    Yes
                  </button>
                  <button className="modal-btn no" onClick={() => submitData(false)} disabled={submitting}>
                    No
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
