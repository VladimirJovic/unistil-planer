import { useState, useRef, useEffect } from 'react'
import {
  Search, X, LayoutGrid, Grid3x3, Layers, Settings2, Refrigerator,
  DoorOpen, AppWindow, Flame, Zap, Trash2, CornerDownLeft, Sandwich,
} from 'lucide-react'
import { useStore, OBSTACLE_TYPES, WALL_META, ZONES } from '../store/useStore'
import { CATEGORIES, getElementsByCategory } from '../data/elements'

const CAT_ICONS = {
  DONJI:   LayoutGrid,
  RADNA:   Sandwich,
  VISECI:  Grid3x3,
  VISOKI:  Layers,
  UGAONI:  CornerDownLeft,
  UGRADNI: Settings2,
  APARATI: Refrigerator,
}

const OBS_ICONS = { door: DoorOpen, window: AppWindow, radiator: Flame, socket: Zap }

// ─────────────────────────────────────────────────────────────
// ELEMENTI TAB
// ─────────────────────────────────────────────────────────────
function ElementsTab() {
  const activeCategory    = useStore(s => s.activeCategory)
  const setActiveCategory = useStore(s => s.setActiveCategory)
  const setActiveZone     = useStore(s => s.setActiveZone)
  const activeWall        = useStore(s => s.activeWall)
  const addElement        = useStore(s => s.addElement)
  const addElementAtPosition = useStore(s => s.addElementAtPosition)
  const startDragSession  = useStore(s => s.startDragSession)
  const endDragSession    = useStore(s => s.endDragSession)
  const [search, setSearch] = useState('')
  const [fbId, setFbId]     = useState(null)
  const [fbKind, setFbKind] = useState(null)

  const elements = getElementsByCategory(activeCategory).filter(el =>
    !search ||
    el.name.toLowerCase().includes(search.toLowerCase()) ||
    el.colorName.toLowerCase().includes(search.toLowerCase())
  )

  function handleAdd(el) {
    const ok = addElement(el)
    setFbId(el.id); setFbKind(ok ? 'ok' : 'full')
    setTimeout(() => { setFbId(null); setFbKind(null) }, 1200)
  }

  // ── DRAG-AND-DROP iz kataloga ──
  // onPointerDown → čeka 5px pokreta pa pokreće dragSession.
  // onPointerUp van 5px → commit preko dragPreview-a.
  // onPointerUp u okviru 5px → tretiraj kao klik (handleAdd).
  const dragRef = useRef({ active: false, element: null, startX: 0, startY: 0, moved: false })

  function onCardPointerDown(e, el) {
    // Samo primarni pointer (levi klik)
    if (e.button !== 0 && e.pointerType === 'mouse') return
    dragRef.current = {
      active: true, element: el, moved: false,
      startX: e.clientX, startY: e.clientY,
    }
    // Registruj globalne listenere — drag može da napusti panel
    const onMove = (ev) => {
      const d = dragRef.current
      if (!d.active) return
      if (!d.moved) {
        if (Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY) < 5) return
        d.moved = true
        startDragSession(d.element)
      }
    }
    const onUp = (ev) => {
      const d = dragRef.current
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      if (!d.active) return

      if (!d.moved) {
        // Bio je klik — standardni add
        d.active = false
        handleAdd(d.element)
        return
      }

      // Bio je drag — pokušaj commit preko trenutnog dragPreview-a
      const { dragPreview } = useStore.getState()
      d.active = false

      if (dragPreview && dragPreview.wallId && dragPreview.valid !== null) {
        const ok = addElementAtPosition(d.element, dragPreview.wallId, dragPreview.valid)
        setFbId(d.element.id); setFbKind(ok ? 'ok' : 'full')
        setTimeout(() => { setFbId(null); setFbKind(null) }, 1200)
      } else {
        // Drop van valjane pozicije ili van canvas-a — tiho odustani
        setFbId(d.element.id); setFbKind('full')
        setTimeout(() => { setFbId(null); setFbKind(null) }, 700)
      }
      endDragSession()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  function pickCategory(catId) {
    setActiveCategory(catId)
    const cat = CATEGORIES[catId]
    if (cat?.zone) setActiveZone(cat.zone)
  }

  const cfg = WALL_META[activeWall]
  const currentCat = CATEGORIES[activeCategory]
  const currentZone = currentCat?.zone ? ZONES[currentCat.zone] : null
  const isCornerCat = activeCategory === 'UGAONI'

  return (
    <div className="flex flex-col h-full">
      {/* Kategorije — kompaktne, jasne dugmad */}
      <div style={{ padding: '8px 8px 6px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {Object.values(CATEGORIES).map(cat => {
          const Icon = CAT_ICONS[cat.id]
          const active = activeCategory === cat.id
          const count = getElementsByCategory(cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => pickCategory(cat.id)}
              className="press w-full flex items-center gap-2.5 transition-colors"
              style={{
                padding: '7px 10px', marginBottom: 2,
                borderRadius: 7,
                background: active ? 'var(--bg-active)' : 'transparent',
                color: active ? 'var(--text-1)' : 'var(--text-2)',
                fontWeight: active ? 600 : 500, fontSize: 14,
                border: 'none',
                borderLeft: `3px solid ${active ? 'var(--brand)' : 'transparent'}`,
                paddingLeft: active ? 7 : 10,
                minHeight: 36,
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-1)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' } }}
            >
              <Icon size={16} style={{ opacity: 0.95, flexShrink: 0 }} />
              <span className="flex-1 text-left">{cat.label}</span>
              <span className="num" style={{ fontSize: 11, color: 'var(--text-4)' }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Zone indicator + Search — u jednom kompaktnom redu */}
      <div style={{ padding: '8px 10px 6px', flexShrink: 0 }}>
        {currentZone && (
          <div className="flex items-center gap-2" style={{ marginBottom: 6, paddingLeft: 2 }}>
            <span className="rounded-full" style={{ width: 7, height: 7, background: currentZone.color, opacity: 0.9 }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>
              {currentZone.label}
            </span>
            <span className="num" style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 'auto' }}>
              {currentZone.yStart}–{currentZone.yEnd} cm
            </span>
          </div>
        )}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Pretraži element…  (klik ili prevuci)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full transition-colors"
            style={{
              fontSize: 13, padding: '8px 28px 8px 32px',
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 7,
              color: 'var(--text-1)', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--border-strong)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-3)', padding: 4 }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Lista — glavno područje, dobija sve preostalo po visini */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ padding: '2px 10px 10px' }}>
        {elements.length === 0 ? (
          <p className="text-center" style={{ color: 'var(--text-3)', fontSize: 13, paddingTop: 32 }}>Nema rezultata</p>
        ) : elements.map(el => {
          const isFb = fbId === el.id
          const isWhiteish = el.color === '#F5F5F0' || el.color === '#FFFFFF'
          return (
            <button
              key={el.id}
              onPointerDown={(e) => onCardPointerDown(e, el)}
              title="Klikni da dodaš — ili prevuci u prostor"
              className="press w-full text-left relative overflow-hidden transition-colors"
              style={{
                padding: '9px 10px',
                marginBottom: 5,
                borderRadius: 9,
                minHeight: 56,
                cursor: 'grab',
                touchAction: 'none',
                userSelect: 'none',
                background: isFb && fbKind === 'ok'   ? 'var(--green-bg)'
                          : isFb && fbKind === 'full' ? 'var(--red-bg)'
                          : 'var(--bg-panel)',
                border: `1px solid ${
                  isFb && fbKind === 'ok'   ? 'rgba(74,222,128,0.35)'
                  : isFb && fbKind === 'full' ? 'rgba(248,113,113,0.35)'
                  : 'var(--border)'}`,
              }}
              onMouseEnter={e => { if (!isFb) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--border-strong)' } }}
              onMouseLeave={e => { if (!isFb) { e.currentTarget.style.background = 'var(--bg-panel)'; e.currentTarget.style.borderColor = 'var(--border)' } }}
            >
              <div className="flex items-center gap-2.5">
                <div
                     style={{
                       width: 38, height: 38,
                       background: el.color,
                       borderRadius: 7,
                       border: isWhiteish ? '1px solid var(--border-strong)' : '1px solid rgba(0,0,0,0.25)',
                       flexShrink: 0,
                     }} />
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ color: 'var(--text-1)', fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>
                    {el.name}
                  </p>
                  <p className="truncate num" style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 2 }}>
                    {el.dimensions.width}×{el.dimensions.height}×{el.dimensions.depth} cm
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="num" style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 600, lineHeight: 1.15 }}>
                    {el.price.toLocaleString('sr-RS')}
                  </p>
                  <p style={{ color: 'var(--text-3)', fontSize: 10, marginTop: 1 }}>RSD</p>
                </div>
              </div>
              {isFb && (
                <div className="absolute inset-0 flex items-center justify-center"
                     style={{
                       background: 'rgba(10,10,10,0.94)',
                       color: fbKind === 'ok' ? 'var(--green)' : 'var(--red)',
                       fontSize: 13, fontWeight: 600,
                       borderRadius: 9,
                     }}>
                  {fbKind === 'ok'
                    ? (isCornerCat ? '✓ Dodato u ugao' : '✓ Dodato')
                    : (isCornerCat ? 'Svi uglovi su zauzeti' : 'Nema više mesta u ovoj zoni')}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer — destinacija (kompaktan) */}
      <div className="flex items-center gap-2 flex-shrink-0"
           style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface-1)' }}>
        {isCornerCat ? (
          <>
            <CornerDownLeft size={14} style={{ color: 'var(--text-2)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Dodaje u prvi slobodan ugao</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Dodaje na</span>
            <span style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 600 }}>{cfg.label}</span>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// OBSTACLES TAB
// ─────────────────────────────────────────────────────────────
function ObstaclesTab() {
  const activeWall     = useStore(s => s.activeWall)
  const obstacles      = useStore(s => s.obstacles)
  const addObstacle    = useStore(s => s.addObstacle)
  const removeObstacle = useStore(s => s.removeObstacle)
  const updateObstacle = useStore(s => s.updateObstacle)
  const selectedUid    = useStore(s => s.selectedUid)
  const setSelectedUid = useStore(s => s.setSelectedUid)
  const room           = useStore(s => s.room)

  const cfg = WALL_META[activeWall]
  const maxX = activeWall === 'back' || activeWall === 'front' ? room.width : room.depth
  const currentObstacles = obstacles[activeWall] || []
  const selectedOnActive = currentObstacles.find(o => o.uid === selectedUid)

  return (
    <div className="flex flex-col h-full">
      {/* Dodaj */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
          Postavi na <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{cfg.label}</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(OBSTACLE_TYPES).map(t => {
            const Icon = OBS_ICONS[t.id]
            return (
              <button key={t.id}
                      onClick={() => {
                        const uid = addObstacle(activeWall, t.id)
                        if (uid) setSelectedUid(uid)
                      }}
                      className="press flex flex-col items-center gap-2 transition-colors"
                      style={{
                        padding: '16px 8px',
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        minHeight: 72,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-panel)' }}
              >
                <Icon size={22} style={{ color: 'var(--text-2)' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{t.label}</span>
              </button>
            )
          })}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12, lineHeight: 1.5 }}>
          Vrata i prozori pomažu vam da vidite kako će kuhinja izgledati u vašoj prostoriji. Ne blokiraju postavljanje elemenata.
        </p>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        <div style={{ padding: 16 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
              Postavljeno na: {cfg.label}
            </span>
            <span className="num" style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>
              {currentObstacles.length}
            </span>
          </div>
          {currentObstacles.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '24px 0' }}>
              Još nema dodanih elemenata
            </p>
          ) : currentObstacles.map(o => {
            const meta = OBSTACLE_TYPES[o.type]
            const isSel = selectedUid === o.uid
            return (
              <button key={o.uid}
                      onClick={() => setSelectedUid(isSel ? null : o.uid)}
                      className="w-full text-left transition-colors"
                      style={{
                        padding: '12px 12px', marginBottom: 4,
                        borderRadius: 8,
                        minHeight: 52,
                        background: isSel ? 'var(--bg-active)' : 'transparent',
                        border: `1px solid ${isSel ? 'var(--border-strong)' : 'transparent'}`,
                      }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--bg-hover)' }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
              >
                <div className="flex items-center gap-3">
                  <div style={{ width: 18, height: 18, background: meta.color, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'var(--text-1)', fontSize: 14, fontWeight: 600 }}>{meta.label}</p>
                    <p className="num" style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 2 }}>
                      {o.width}×{o.height} cm
                    </p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeObstacle(o.uid) }}
                          style={{ color: 'var(--text-3)', padding: 8, borderRadius: 6 }}
                          title="Ukloni"
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </button>
            )
          })}
        </div>

        {/* Inspector */}
        {selectedOnActive && (
          <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--surface-1)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, fontWeight: 600 }}>
              Podesi veličinu i poziciju
            </p>
            <Slider label="Pomeri levo-desno" value={selectedOnActive.xStart}
                    min={0} max={maxX - selectedOnActive.width}
                    onChange={v => updateObstacle(selectedOnActive.uid, { xStart: v })} />
            <Slider label="Visina od poda" value={selectedOnActive.yStart}
                    min={0} max={room.height - selectedOnActive.height}
                    onChange={v => updateObstacle(selectedOnActive.uid, { yStart: v })} />
            <Slider label="Širina" value={selectedOnActive.width}
                    min={10} max={Math.min(400, maxX - selectedOnActive.xStart)}
                    onChange={v => updateObstacle(selectedOnActive.uid, { width: v })} />
            <Slider label="Visina" value={selectedOnActive.height}
                    min={10} max={Math.min(300, room.height - selectedOnActive.yStart)}
                    onChange={v => updateObstacle(selectedOnActive.uid, { height: v })} />
          </div>
        )}
      </div>
    </div>
  )
}

function Slider({ label, value, min, max, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
        <span className="num" style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 600 }}>
          {value} cm
        </span>
      </div>
      <input type="range" min={min} max={max} value={value}
             onChange={e => onChange(parseInt(e.target.value))}
             className="w-full" style={{ accentColor: 'var(--brand)', height: 24 }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SIDE PANEL
// ─────────────────────────────────────────────────────────────
export default function SidePanel() {
  const sideTab    = useStore(s => s.sideTab)
  const setSideTab = useStore(s => s.setSideTab)

  return (
    <div className="flex flex-col h-full"
         style={{ width: 320, background: 'var(--bg-panel)', borderRight: '1px solid var(--border)' }}>

      {/* Tab header — jasan underline, veći touch */}
      <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'elements',  label: 'Elementi kuhinje' },
          { id: 'obstacles', label: 'Vrata i prozori' },
        ].map(t => {
          const active = sideTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setSideTab(t.id)}
              className="press flex-1 transition-colors relative"
              style={{
                padding: '12px 8px',
                fontSize: 13, fontWeight: 600,
                background: 'transparent',
                color: active ? 'var(--text-1)' : 'var(--text-3)',
                border: 'none',
                minHeight: 44,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-1)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-3)' }}
            >
              {t.label}
              {active && (
                <span style={{
                  position: 'absolute', left: 16, right: 16, bottom: -1,
                  height: 2, background: 'var(--brand)',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {sideTab === 'elements' ? <ElementsTab /> : <ObstaclesTab />}
      </div>
    </div>
  )
}
