import { useState, useMemo } from 'react'
import { ArrowRight, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react'
import { useStore } from '../store/useStore'

// ─────────────────────────────────────────────────────────────
// PRESETI
// ─────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Mala',    w: 240, d: 200, h: 240, note: '4.8 m²' },
  { label: 'Srednja', w: 320, d: 260, h: 240, note: '8.3 m²' },
  { label: 'Velika',  w: 420, d: 320, h: 260, note: '13.4 m²' },
]

// ─────────────────────────────────────────────────────────────
// Stepper — minimalno
// ─────────────────────────────────────────────────────────────
function Stepper({ label, hint, value, onChange, min, max, step = 5 }) {
  const bump = (d) => onChange(Math.max(min, Math.min(max, value + d * step)))
  const invalid = value < min || value > max

  return (
    <div>
      <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
        <label style={{ color: 'var(--text-1)', fontSize: 14, fontWeight: 600 }}>
          {label}
        </label>
        <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{hint}</span>
      </div>

      <div className="flex items-center"
           style={{
             background: 'var(--bg-input)',
             border: `1px solid ${invalid ? 'var(--red)' : 'var(--border)'}`,
             borderRadius: 10,
             height: 52,
             overflow: 'hidden',
           }}>
        <button
          type="button"
          onClick={() => bump(-1)}
          className="press flex items-center justify-center h-full transition-colors"
          style={{ width: 52, color: 'var(--text-2)', background: 'transparent', border: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'transparent' }}
          aria-label="Umanji"
          title="Smanji za 5 cm"
        >
          <ChevronDown size={20} />
        </button>

        <input
          type="number"
          min={min} max={max}
          value={value}
          onChange={e => onChange(parseInt(e.target.value) || 0)}
          className="flex-1 h-full text-center num"
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-1)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em',
          }}
        />

        <span style={{ color: 'var(--text-3)', fontSize: 13, paddingRight: 6, fontWeight: 500 }}>cm</span>

        <button
          type="button"
          onClick={() => bump(+1)}
          className="press flex items-center justify-center h-full transition-colors"
          style={{ width: 52, color: 'var(--text-2)', background: 'transparent', border: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'transparent' }}
          aria-label="Uvećaj"
          title="Povećaj za 5 cm"
        >
          <ChevronUp size={20} />
        </button>
      </div>

      {invalid && (
        <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>
          Vrednost mora biti između {min} i {max} cm
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RoomPreview — tiho, sivi tonovi + jedan akcent
// ─────────────────────────────────────────────────────────────
function RoomPreview({ width, depth, height }) {
  const M = 48

  return (
    <div className="relative"
         style={{
           background: 'var(--bg-panel)',
           border: '1px solid var(--border)',
           borderRadius: 12,
           aspectRatio: '4/3',
           overflow: 'hidden',
         }}>

      {/* Top label */}
      <div className="absolute flex items-center justify-between"
           style={{ top: 0, left: 0, right: 0, padding: '12px 16px', zIndex: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Pogled odozgo</span>
        <span className="num" style={{ fontSize: 11, color: 'var(--text-3)' }}>
          visina {height} cm
        </span>
      </div>

      <svg
        viewBox={`${-M} ${-M} ${width + 2 * M} ${depth + 2 * M}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <pattern id="floorgrid" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#202020" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Pod */}
        <rect x={0} y={0} width={width} height={depth} fill="#141414" />
        <rect x={0} y={0} width={width} height={depth} fill="url(#floorgrid)" />

        {/* Zidovi — jedna boja (neutralna), samo zadnji u akcentu */}
        <rect x={0} y={-3} width={width} height={3} fill="#c41419" />
        <rect x={width} y={0} width={3} height={depth} fill="#3a3a3a" />
        <rect x={0} y={depth} width={width} height={3} fill="#3a3a3a" />
        <rect x={-3} y={0} width={3} height={depth} fill="#3a3a3a" />

        {/* Dimenzije */}
        <g stroke="#3a3a3a" strokeWidth="0.8">
          <line x1={0} y1={depth + 28} x2={width} y2={depth + 28} />
          <line x1={0} y1={depth + 24} x2={0} y2={depth + 32} />
          <line x1={width} y1={depth + 24} x2={width} y2={depth + 32} />
        </g>
        <text x={width / 2} y={depth + 26} textAnchor="middle" fill="#7a7a7a" fontSize="10" fontWeight="500"
              style={{ paintOrder: 'stroke fill', stroke: '#111111', strokeWidth: 3 }}>
          {width} cm
        </text>

        <g stroke="#3a3a3a" strokeWidth="0.8">
          <line x1={-28} y1={0} x2={-28} y2={depth} />
          <line x1={-32} y1={0} x2={-24} y2={0} />
          <line x1={-32} y1={depth} x2={-24} y2={depth} />
        </g>
        <text x={-26} y={depth / 2} textAnchor="middle" dominantBaseline="middle" fill="#7a7a7a" fontSize="10" fontWeight="500"
              transform={`rotate(-90, -26, ${depth / 2})`}
              style={{ paintOrder: 'stroke fill', stroke: '#111111', strokeWidth: 3 }}>
          {depth} cm
        </text>

        {/* Centralni badge — površina */}
        <text x={width / 2} y={depth / 2 - 2} textAnchor="middle" fill="#d0d0d0" fontSize="18" fontWeight="500">
          {((width * depth) / 10000).toFixed(1)} m²
        </text>
        <text x={width / 2} y={depth / 2 + 14} textAnchor="middle" fill="#5a5a5a" fontSize="10"
              style={{ letterSpacing: '0.04em' }}>
          površina
        </text>
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SETUP — minimalan layout
// ─────────────────────────────────────────────────────────────
export default function SetupScreen() {
  const setRoom      = useStore(s => s.setRoom)
  const setSetupDone = useStore(s => s.setSetupDone)
  const savedRoom    = useStore(s => s.room)
  const exitProject  = useStore(s => s.exitProject)

  const [w, setW] = useState(savedRoom.width)
  const [d, setD] = useState(savedRoom.depth)
  const [h, setH] = useState(savedRoom.height)

  const valid = w >= 100 && w <= 800 && d >= 80 && d <= 400 && h >= 200 && h <= 320

  function applyPreset(p) {
    setW(p.w); setD(p.d); setH(p.h)
  }

  function start() {
    if (!valid) return
    setRoom({ width: w, depth: d, height: h })
    setSetupDone(true)
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-app)' }}>

      {/* Header */}
      <header className="flex items-center justify-between"
              style={{ padding: '16px 32px', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={exitProject}
            className="press flex items-center gap-1.5 transition-colors"
            style={{
              padding: '6px 10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-3)',
              fontSize: 12,
              borderRadius: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)' }}
            title="Nazad na projekte"
          >
            <ArrowLeft size={13} />
            Projekti
          </button>
          <span style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <span className="brand-mark" style={{ fontSize: 13, color: 'var(--text-1)' }}>UNISTIL</span>
        </div>

        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
          Novi projekat · korak 1 / 1
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center" style={{ padding: '48px 24px' }}>
        <div className="w-full" style={{ maxWidth: 960 }}>
          <div className="grid gap-10" style={{ gridTemplateColumns: '380px 1fr' }}>

            {/* Left — forma */}
            <div className="flex flex-col gap-7">
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  Izmerite svoju kuhinju
                </h1>
                <p style={{ color: 'var(--text-2)', fontSize: 15, marginTop: 10, lineHeight: 1.55 }}>
                  Unesite dimenzije prostorije u centimetrima. Možete da izaberete i jednu od tipičnih veličina ispod.
                </p>
              </div>

              {/* Preseti — veće, jasnije */}
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10, fontWeight: 500 }}>
                  Uobičajene veličine
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map(p => {
                    const active = w === p.w && d === p.d && h === p.h
                    return (
                      <button key={p.label}
                              onClick={() => applyPreset(p)}
                              className="press transition-colors text-left"
                              style={{
                                padding: '14px 14px',
                                background: active ? 'var(--bg-active)' : 'var(--bg-panel)',
                                border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
                                borderRadius: 10,
                                minHeight: 72,
                              }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{p.label}</p>
                        <p className="num" style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                          {p.w}×{p.d} cm
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 1 }}>
                          {p.note}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Steppers */}
              <div className="flex flex-col gap-4">
                <Stepper label="Širina (zadnji zid)"  hint="obično 100–800 cm"  value={w} onChange={setW} min={100} max={800} />
                <Stepper label="Dubina (bočni zidovi)" hint="obično 80–400 cm"   value={d} onChange={setD} min={80}  max={400} />
                <Stepper label="Visina prostorije"     hint="obično 200–320 cm"  value={h} onChange={setH} min={200} max={320} />
              </div>

              {/* CTA — velika, jasna */}
              <button
                onClick={start}
                disabled={!valid}
                className="press w-full flex items-center justify-center gap-2 rounded-xl transition-colors"
                style={{
                  padding: '16px 20px',
                  fontSize: 16, fontWeight: 600,
                  background: valid ? 'var(--brand)' : 'var(--surface-1)',
                  color: valid ? '#ffffff' : 'var(--text-4)',
                  border: 'none',
                  cursor: valid ? 'pointer' : 'not-allowed',
                  opacity: valid ? 1 : 0.7,
                  minHeight: 56,
                }}
              >
                Nastavi i počni uređenje
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Right — preview */}
            <div>
              <RoomPreview width={w} depth={d} height={h} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
