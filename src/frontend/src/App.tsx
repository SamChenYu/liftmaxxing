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

function fmt(sec: number): string {
  if (sec <= 0) return 'Due'
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtAgo(sec: number): string {
  const ago = Math.abs(sec)
  if (ago < 60) return `${ago}s ago`
  const m = Math.floor(ago / 60)
  const s = ago % 60
  return `${m}:${s.toString().padStart(2, '0')} ago`
}

function urg(sec: number) {
  if (sec <= 0) return 'due'
  if (sec < 60) return 'urgent'
  if (sec < 180) return 'soon'
  return ''
}

function groupByLine(entries: Record<string, TrainArrival>) {
  const g: Record<string, TrainArrival[]> = {}
  for (const t of Object.values(entries)) {
    ;(g[t.lineId] ??= []).push(t)
  }
  for (const a of Object.values(g)) a.sort((x, y) => x.timeToStation - y.timeToStation)
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

  const elapsed = Math.floor((now - fetchedAt) / 1000)
  const adj = (tts: number) => Math.max(0, tts - elapsed)

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
          const nextTrains = nextG[lineId]
          const lastTrains = lastG[lineId]
          if (!nextTrains?.length && !lastTrains?.length) return null
          const l = LINES[lineId]
          return (
            <div key={lineId} className="line-group">
              <div className="line-label" style={{ color: l.color }}>
                <span className="line-dot" style={{ background: l.color }} />
                {l.name}
              </div>
              <div className="line-columns">
                <div className="col">
                  <h3>Last</h3>
                  <div className="col-cards">
                    {lastTrains?.length ? (
                      lastTrains.map((t) => {
                        const raw = t.timeToStation - elapsed
                        const arrived = raw <= 0
                        const p = platformLabel(t.lineId, t.platformName)
                        return (
                          <div key={t.vehicleId} className="card" style={{ borderLeftColor: l.color }}>
                            <span className="plat">
                              {p.label}
                              {p.lift && <span className="lift-tag">Lift</span>}
                            </span>
                            <span className={`time ${arrived ? 'arrived' : urg(raw)}`}>
                              {arrived ? fmtAgo(raw) : fmt(raw)}
                            </span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="no-data">No recent arrivals</div>
                    )}
                  </div>
                </div>
                <div className="col">
                  <h3>Next</h3>
                  <div className="col-cards">
                    {nextTrains?.length ? (
                      nextTrains.map((t) => {
                        const r = adj(t.timeToStation)
                        const p = platformLabel(t.lineId, t.platformName)
                        return (
                          <div key={t.vehicleId} className="card" style={{ borderLeftColor: l.color }}>
                            <span className="plat">
                              {p.label}
                              {p.lift && <span className="lift-tag">Lift</span>}
                            </span>
                            <span className={`time ${urg(r)}`}>{fmt(r)}</span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="no-data">No upcoming trains</div>
                    )}
                  </div>
                </div>
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
