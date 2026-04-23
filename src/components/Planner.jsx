import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Box, Map, RotateCcw, Eye, EyeOff, Palette, Check, MousePointerClick, Move, Hand, X as XIcon, Undo2, HelpCircle, SlidersHorizontal, ChevronDown, Sparkles, Layers, ShoppingBag, CheckCircle2 } from 'lucide-react'
import { useStore, WALL_META, FLOOR_TILES, WALL_TILES } from '../store/useStore'
import SidePanel from './SidePanel'
import Scene3D from './Scene3D'
import PlanView from './PlanView'
import CartSummary from './CartSummary'
import Tooltip from './Tooltip'

// Jedinstveni Pogled picker — bira i kameru i aktivan zid u istom kliku.
// 3D opcija je "slobodan pogled" — ne menja activeWall.
// Wall opcije (Zadnji/Desni/Prednji/Levi) = camera preset + activeWall istovremeno.
const VIEW_OPTIONS = [
  { id: 'perspective', label: '3D',      wall: null,    tip: 'Slobodan 3D pogled' },
  { id: 'back',        label: 'Zadnji',  wall: 'back',  tip: 'Pogled ka zadnjem zidu' },
  { id: 'right',       label: 'Desni',   wall: 'right', tip: 'Pogled ka desnom zidu' },
  { id: 'front',       label: 'Prednji', wall: 'front', tip: 'Pogled ka prednjem zidu' },
  { id: 'left',        label: 'Levi',    wall: 'left',  tip: 'Pogled ka levom zidu' },
]

// ─────────────────────────────────────────────────────────────
// TOOLBAR MENU — jedan dropdown sa svim sekundarnim podešavanjima:
//   • Linije visine (toggle)
//   • Pogled kamere (samo u 3D)
//   • Boje prostorije (pod + zidovi)
//   • Obriši sve (destruktivno, samo kad ima postavljenih)
//
// Panel je fiksno pozicioniran preko viewport-а (getBoundingClientRect)
// kako bi izbegao clipping iz toolbar-ovog overflow konteksta.
// ─────────────────────────────────────────────────────────────
const MENU_WIDTH = 300

function ToolbarMenu() {
  const room              = useStore(s => s.room)
  const setFloorColor     = useStore(s => s.setFloorColor)
  const setWallColor      = useStore(s => s.setWallColor)
  const showZoneGuides    = useStore(s => s.showZoneGuides)
  const setShowZoneGuides = useStore(s => s.setShowZoneGuides)
  const walls             = useStore(s => s.walls)
  const corners           = useStore(s => s.corners)
  const clearAll          = useStore(s => s.clearAll)

  const [open, setOpen]   = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef        = useRef(null)
  const panelRef          = useRef(null)

  const floorHex   = room.floorColor || '#e8e4dc'
  const wallHex    = room.wallColor  || '#dfdad3'
  const wallCount  = Object.values(walls).reduce((n, arr) => n + arr.length, 0)
  const cornerCount = Object.values(corners).filter(Boolean).length
  const placedCount = wallCount + cornerCount

  // Preračunaj poziciju — desno poravnanje, ispod trigger-a, sa gutter-om od ivice
  const reposition = () => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const gutter = 8
    let left = r.right - MENU_WIDTH
    if (left < gutter) left = gutter
    if (left + MENU_WIDTH > window.innerWidth - gutter) left = window.innerWidth - MENU_WIDTH - gutter
    setCoords({ top: r.bottom + 6, left })
  }

  useEffect(() => {
    if (!open) return
    reposition()
    const onDown = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target)) return
      if (triggerRef.current && triggerRef.current.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    const onResize = () => reposition()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [open])

  return (
    <>
      <Tooltip text="Podešavanja prikaza i akcije" placement="bottom" disabled={open}>
        <button
          ref={triggerRef}
          onClick={() => setOpen(o => !o)}
          className="btn btn-sm btn-ghost"
          data-active={open || undefined}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <SlidersHorizontal size={14} />
          Podešavanja
          <ChevronDown
            size={12}
            style={{
              opacity: 0.65,
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform var(--t-fast) var(--ease-out)',
            }}
          />
        </button>
      </Tooltip>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          className="menu-surface"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: MENU_WIDTH,
            maxHeight: 'calc(100vh - 90px)',
            overflowY: 'auto',
            zIndex: 9990,
          }}
        >
          {/* ─── LINIJE VISINE — toggle ─── */}
          <button
            onClick={() => setShowZoneGuides(!showZoneGuides)}
            className="menu-item"
            role="menuitemcheckbox"
            aria-checked={showZoneGuides}
          >
            {showZoneGuides
              ? <Eye    size={15} style={{ color: 'var(--brand)', flexShrink: 0 }} />
              : <EyeOff size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />}
            <span className="flex-1">Linije visine</span>
            <span
              className="num"
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                padding: '2px 7px', borderRadius: 100,
                background: showZoneGuides ? 'var(--brand-dim)' : 'var(--surface-1)',
                color:      showZoneGuides ? 'var(--brand)'     : 'var(--text-4)',
                border: `1px solid ${showZoneGuides ? 'var(--brand-border)' : 'var(--border)'}`,
              }}
            >
              {showZoneGuides ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* ─── BOJE PROSTORIJE ─── */}
          <div className="divider" style={{ margin: '4px 4px' }} />
          <div style={{ padding: '6px 10px 4px' }}>
            <div className="flex items-center gap-1.5" style={{ marginBottom: 10 }}>
              <Palette size={12} style={{ color: 'var(--text-3)' }} />
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Boje prostorije
              </p>
            </div>

            {/* POD */}
            <div style={{ marginBottom: 12 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 7 }}>
                <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>Pod</span>
                <span style={{ fontSize: 10, color: 'var(--text-4)' }}>
                  {FLOOR_TILES.find(t => t.hex === floorHex)?.name || 'Prilagođeno'}
                </span>
              </div>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                {FLOOR_TILES.map(t => {
                  const active = t.hex === floorHex
                  return (
                    <button
                      key={t.id}
                      onClick={() => setFloorColor(t.hex)}
                      title={t.name}
                      className="swatch"
                      data-active={active || undefined}
                      style={{ background: t.hex }}
                      aria-label={`Boja poda: ${t.name}`}
                    >
                      {active && (
                        <Check
                          size={10}
                          style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%,-50%)',
                            color: shouldUseDarkText(t.hex) ? '#0a0a0a' : '#ffffff',
                          }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ZIDOVI */}
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 7 }}>
                <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>Zidovi</span>
                <span style={{ fontSize: 10, color: 'var(--text-4)' }}>
                  {WALL_TILES.find(t => t.hex === wallHex)?.name || 'Prilagođeno'}
                </span>
              </div>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                {WALL_TILES.map(t => {
                  const active = t.hex === wallHex
                  return (
                    <button
                      key={t.id}
                      onClick={() => setWallColor(t.hex)}
                      title={t.name}
                      className="swatch"
                      data-active={active || undefined}
                      style={{ background: t.hex }}
                      aria-label={`Boja zidova: ${t.name}`}
                    >
                      {active && (
                        <Check
                          size={10}
                          style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%,-50%)',
                            color: shouldUseDarkText(t.hex) ? '#0a0a0a' : '#ffffff',
                          }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ─── OBRIŠI SVE — destruktivno, samo kad ima elemenata ─── */}
          {placedCount > 0 && (
            <>
              <div className="divider" style={{ margin: '4px 4px' }} />
              <button
                onClick={() => {
                  if (confirm('Obrisati sve elemente iz kuhinje? Ova akcija se ne može poništiti.')) {
                    clearAll()
                    setOpen(false)
                  }
                }}
                className="menu-item menu-item--danger"
                role="menuitem"
              >
                <RotateCcw size={14} style={{ flexShrink: 0 }} />
                <span className="flex-1">Obriši sve elemente</span>
                <span
                  className="num"
                  style={{
                    fontSize: 11, fontWeight: 600,
                    color: 'var(--text-3)',
                    padding: '1px 7px', borderRadius: 100,
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {placedCount}
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}

// Heuristika — koristi tamnu ikonu ako je swatch svetao
function shouldUseDarkText(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6
}

// ─────────────────────────────────────────────────────────────
// TOOLBAR
// ─────────────────────────────────────────────────────────────
function Toolbar() {
  const room             = useStore(s => s.room)
  const setSetupDone     = useStore(s => s.setSetupDone)
  const activeWall       = useStore(s => s.activeWall)
  const setActiveWall    = useStore(s => s.setActiveWall)
  const viewMode         = useStore(s => s.viewMode)
  const setViewMode      = useStore(s => s.setViewMode)
  const cameraPreset     = useStore(s => s.cameraPreset)
  const setCameraPreset  = useStore(s => s.setCameraPreset)
  const walls            = useStore(s => s.walls)          // brojač elemenata po zidu
  const exitProject      = useStore(s => s.exitProject)
  const currentProjectId = useStore(s => s.currentProjectId)
  const projects         = useStore(s => s.projects)
  const currentProject   = projects.find(p => p.id === currentProjectId)
  const history          = useStore(s => s.history)
  const undo             = useStore(s => s.undo)
  const canUndo          = history.length > 0

  // Koja opcija je aktivna u "Pogled" pickeru:
  //  • U 3D — prati cameraPreset (ako je wall preset → taj zid, inače → '3D')
  //  • U Tlocrt — prati activeWall (kamera je svakako top-down)
  const activeViewId = viewMode === '3d'
    ? (VIEW_OPTIONS.some(v => v.id === cameraPreset) ? cameraPreset : 'perspective')
    : activeWall

  // Jedinstven handler — bira i zid i kameru u istom kliku
  const selectView = (opt) => {
    if (opt.wall) setActiveWall(opt.wall)
    if (viewMode === '3d') setCameraPreset(opt.id)
  }

  return (
    <div className="flex items-center flex-shrink-0"
         style={{
           height: 64, background: 'var(--bg-panel)',
           borderBottom: '1px solid var(--border)',
           whiteSpace: 'nowrap',        // labele nikad ne wrapuju u dva reda
           overflowX: 'auto',           // ako baš ne može da stane → horizontalni scroll
           overflowY: 'visible',        // tooltips smeju da izlaze
         }}>

      {/* Levo — projekti + brand */}
      <div className="flex items-center gap-3 px-4 flex-shrink-0"
           style={{ borderRight: '1px solid var(--border)', height: '100%' }}>
        <button
          onClick={exitProject}
          className="btn btn-ghost"
          title="Nazad na moje projekte"
        >
          <ArrowLeft size={16} />
          Moji projekti
        </button>

        <div style={{ width: 1, height: 26, background: 'var(--border)' }} />

        <div className="flex items-center">
          <span className="brand-mark" style={{ fontSize: 14, color: 'var(--text-1)' }}>
            UNISTIL
          </span>
        </div>

        <div style={{ width: 1, height: 26, background: 'var(--border)' }} />

        {/* Project name + dimenzije */}
        <div className="flex items-center gap-2">
          <span style={{
            fontSize: 14, color: 'var(--text-1)', fontWeight: 600,
            maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {currentProject?.name || 'Projekat'}
          </span>
          <button
            onClick={() => setSetupDone(false)}
            title="Promeni dimenzije prostorije"
            className="btn btn-sm btn-outlined num"
          >
            {room.width}×{room.depth}×{room.height} cm
          </button>
        </div>
      </div>

      {/* Centar — view toggle + wall tabs */}
      <div className="flex items-center gap-4 flex-1 px-4 flex-shrink-0">

        {/* View toggle — segment */}
        <div className="seg flex-shrink-0">
          <Tooltip text="Pogled odozgo — kao tehnički crtež. Lakše je precizno rasporediti elemente po zidovima." placement="bottom">
            <button
              onClick={() => setViewMode('plan')}
              className="seg-toggle"
              data-active={viewMode === 'plan' || undefined}
            >
              <Map size={15} />
              Tlocrt
            </button>
          </Tooltip>
          <Tooltip text="Realističan 3D pogled — vidite kako će vaša kuhinja izgledati uživo." placement="bottom">
            <button
              onClick={() => setViewMode('3d')}
              className="seg-toggle"
              data-active={viewMode === '3d' || undefined}
            >
              <Box size={15} />
              3D pogled
            </button>
          </Tooltip>
        </div>

        <div style={{ width: 1, height: 26, background: 'var(--border)' }} />

        {/* Pogled — jedinstven picker (zid + kamera) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 8, fontWeight: 500, whiteSpace: 'nowrap' }}>
            Pogled:
          </span>
          {VIEW_OPTIONS
            // U Tlocrt modu 3D opcija nema smisla — skrivamo je
            .filter(opt => viewMode === '3d' || opt.wall !== null)
            .map(opt => {
              const isActive = activeViewId === opt.id
              const count = opt.wall ? (walls[opt.wall]?.length || 0) : 0
              const chipColor = opt.wall ? WALL_META[opt.wall].color : 'var(--border-strong)'
              return (
                <Tooltip key={opt.id} text={opt.tip} placement="bottom">
                  <button
                    onClick={() => selectView(opt)}
                    className="btn btn-sm btn-chip"
                    data-active={isActive || undefined}
                    style={{ '--chip-color': chipColor }}
                  >
                    {opt.label}
                    {count > 0 && (
                      <span
                        className="num"
                        style={{
                          minWidth: 20, height: 18, padding: '0 6px', fontSize: 11, fontWeight: 700,
                          background: isActive ? 'rgba(0,0,0,0.28)' : 'var(--surface-2)',
                          color:      isActive ? '#ffffff'          : 'var(--text-2)',
                          borderRadius: 100,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                </Tooltip>
              )
            })}
        </div>
      </div>

      {/* Desno — undo + settings dropdown */}
      <div className="flex items-center gap-2 px-4 flex-shrink-0"
           style={{ borderLeft: '1px solid var(--border)', height: '100%' }}>

        <Tooltip text="Poništi poslednju akciju" shortcut="Ctrl+Z" placement="bottom" disabled={!canUndo}>
          <button
            onClick={undo}
            disabled={!canUndo}
            className="btn btn-sm btn-ghost"
          >
            <Undo2 size={14} /> Poništi
          </button>
        </Tooltip>

        <div style={{ width: 1, height: 22, background: 'var(--border)' }} />

        {/* Jedinstveni dropdown sa svim sekundarnim podešavanjima */}
        <ToolbarMenu />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ONBOARDING WIZARD — 5 koraka, prikazuje se prvi put i svaki
// put kad korisnik klikne na ? dugme dole desno.
// Čuva se u localStorage da ne uznemirava korisnika pri povratku.
// ─────────────────────────────────────────────────────────────
const LS_ONBOARD = 'unistil_onboard_dismissed_v2'

const ONBOARD_STEPS = [
  {
    icon: Sparkles,
    eyebrow: 'Dobrodošli',
    title: 'Dizajnirajte svoju kuhinju u 3D',
    body: 'Brzo rasporedite elemente po zidovima, vidite ih u realnom 3D pogledu i pošaljite tačan nalog proizvođaču — sve u istom alatu.',
  },
  {
    icon: Layers,
    eyebrow: 'Korak 1 — Katalog',
    title: 'Izaberite elemente sa leve strane',
    body: 'U levom panelu birate kategoriju (Donji, Viseći, Radna ploča, Ugaoni...) pa kliknete ili prevučete element u kuhinju. Postavlja se na aktivan zid.',
    tip: 'Pretraga na vrhu kataloga — brzo pronađite tačno ono što tražite.',
  },
  {
    icon: Eye,
    eyebrow: 'Korak 2 — Pogled',
    title: 'Zid i kamera u jednom kliku',
    body: 'Gore u toolbar-u birate pogled: 3D, Zadnji, Desni, Prednji ili Levi. Kad kliknete na zid — kamera gleda ka njemu, a on postaje aktivan za dodavanje elemenata.',
  },
  {
    icon: ShoppingBag,
    eyebrow: 'Korak 3 — Korpa',
    title: 'Pratite cenu i popunjenost',
    body: 'Sa desne strane vidite sve postavljene elemente, ukupnu cenu i koliko je svaki zid popunjen — lakše ćete znati kad vam je dosta.',
    tip: 'Ctrl+Z poništava poslednju akciju u bilo kom trenutku.',
  },
  {
    icon: CheckCircle2,
    eyebrow: 'Spremni ste',
    title: 'Počnite da dizajnirate',
    body: 'Vaš rad se automatski čuva. U gornjem desnom uglu je dugme Podešavanja za boje i linije visine. Ovu pomoć uvek možete ponovo otvoriti klikom na ? dole desno.',
  },
]

function OnboardingCard() {
  const walls             = useStore(s => s.walls)
  const corners           = useStore(s => s.corners)
  const showOnboarding    = useStore(s => s.showOnboarding)
  const dismissOnboarding = useStore(s => s.dismissOnboarding)
  const [lsDismissed, setLsDismissed] = useState(() => {
    try { return localStorage.getItem(LS_ONBOARD) === '1' } catch { return false }
  })
  const [stepIdx, setStepIdx] = useState(0)

  const placedCount =
    Object.values(walls).reduce((n, arr) => n + arr.length, 0) +
    Object.values(corners).filter(Boolean).length

  // Prikaz logika:
  //   showOnboarding === true  → forsirano prikaži (Help dugme)
  //   showOnboarding === false → forsirano sakrij
  //   null → auto: prazna kuhinja i nije ranije zatvoreno
  const autoShow = placedCount === 0 && !lsDismissed
  const visible = showOnboarding === true
    ? true
    : showOnboarding === false ? false : autoShow

  // Reset na prvi korak svaki put kad se wizard otvori
  useEffect(() => {
    if (visible) setStepIdx(0)
  }, [visible])

  const total = ONBOARD_STEPS.length
  const isFirst = stepIdx === 0
  const isLast  = stepIdx === total - 1

  const next = () => { if (!isLast) setStepIdx(i => i + 1); else dismiss() }
  const prev = () => { if (!isFirst) setStepIdx(i => i - 1) }

  const dismiss = () => {
    try { localStorage.setItem(LS_ONBOARD, '1') } catch {}
    setLsDismissed(true)
    dismissOnboarding()
  }

  // Keyboard: ← →, Esc
  useEffect(() => {
    if (!visible) return
    const onKey = (e) => {
      if (e.key === 'Escape')     { e.preventDefault(); dismiss() }
      if (e.key === 'ArrowRight') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, stepIdx, isFirst, isLast])

  if (!visible) return null

  const step = ONBOARD_STEPS[stepIdx]
  const Icon = step.icon

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        padding: 24,
        background: 'rgba(4,4,6,0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 35,
        animation: 'fadeIn var(--t-slow) var(--ease-out)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
      role="dialog"
      aria-modal="true"
      aria-label="Uputstvo za korišćenje plannera"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'rgba(18,18,22,0.98)',
          border: '1px solid var(--border-strong)',
          borderRadius: 18,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          animation: 'menuIn var(--t-base) var(--ease-out)',
        }}
      >
        {/* ── Header — progress dots + skip ──────────────────── */}
        <div className="flex items-center justify-between" style={{ padding: '16px 20px 4px' }}>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Koraci">
            {ONBOARD_STEPS.map((_, i) => {
              const active = i === stepIdx
              const done   = i < stepIdx
              return (
                <button
                  key={i}
                  onClick={() => setStepIdx(i)}
                  aria-label={`Korak ${i + 1}`}
                  aria-selected={active}
                  role="tab"
                  style={{
                    width: active ? 22 : 7,
                    height: 7,
                    borderRadius: 100,
                    background: active ? 'var(--brand)' : done ? 'var(--text-3)' : 'var(--surface-2)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all var(--t-base) var(--ease-out)',
                  }}
                />
              )
            })}
          </div>

          <button
            onClick={dismiss}
            className="btn btn-sm btn-ghost"
            style={{ padding: '4px 10px', minHeight: 28, fontSize: 12, fontWeight: 500 }}
            title="Preskoči uputstvo"
          >
            {isLast ? 'Zatvori' : 'Preskoči'}
            {!isLast && <XIcon size={13} style={{ marginLeft: 2 }} />}
          </button>
        </div>

        {/* ── Sadržaj koraka (key ensure re-mount za fade) ───── */}
        <div
          key={stepIdx}
          className="flex flex-col items-center text-center"
          style={{
            padding: '18px 36px 8px',
            animation: 'fadeIn var(--t-slow) var(--ease-out)',
          }}
        >
          {/* Ikona */}
          <div
            className="flex items-center justify-center"
            style={{
              width: 68, height: 68,
              marginBottom: 18,
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(196,20,25,0.18), rgba(196,20,25,0.04))',
              border: '1px solid var(--brand-border)',
              color: 'var(--brand-light)',
              boxShadow: '0 8px 24px rgba(196,20,25,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <Icon size={30} strokeWidth={1.75} />
          </div>

          {/* Eyebrow */}
          <p
            style={{
              fontSize: 11, fontWeight: 700,
              color: 'var(--brand-light)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            {step.eyebrow}
          </p>

          {/* Naslov */}
          <h2
            style={{
              fontSize: 22, fontWeight: 700,
              color: 'var(--text-1)',
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
              marginBottom: 10,
              maxWidth: 420,
            }}
          >
            {step.title}
          </h2>

          {/* Telo */}
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-2)',
              lineHeight: 1.55,
              maxWidth: 440,
            }}
          >
            {step.body}
          </p>

          {/* Savet (opcionalno) */}
          {step.tip && (
            <div
              className="flex items-start gap-2"
              style={{
                marginTop: 16,
                padding: '10px 14px',
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                textAlign: 'left',
                maxWidth: 440,
                width: '100%',
              }}
            >
              <Sparkles size={14} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>Savet: </span>
                {step.tip}
              </p>
            </div>
          )}
        </div>

        {/* ── Footer — nav ──────────────────────────────────── */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '18px 20px 20px',
            marginTop: 14,
            borderTop: '1px solid var(--border)',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <button
            onClick={prev}
            disabled={isFirst}
            className="btn btn-sm btn-ghost"
            style={{ visibility: isFirst ? 'hidden' : 'visible' }}
          >
            <ArrowLeft size={14} /> Nazad
          </button>

          <span
            className="num"
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-3)',
              letterSpacing: '0.04em',
            }}
          >
            {stepIdx + 1} / {total}
          </span>

          <button
            onClick={next}
            className={isLast ? 'btn btn-primary' : 'btn btn-sm btn-ghost'}
            style={isLast ? { padding: '8px 16px', minHeight: 36 } : undefined}
          >
            {isLast ? 'Počni dizajniranje' : (<>Dalje <ArrowRight size={14} /></>)}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Canvas overlay — active wall badge + hint (jasniji)
// ─────────────────────────────────────────────────────────────
function CanvasOverlay() {
  const activeWall = useStore(s => s.activeWall)
  const viewMode   = useStore(s => s.viewMode)
  const cfg        = WALL_META[activeWall]

  const hints = viewMode === 'plan'
    ? [
        { icon: MousePointerClick, label: 'Kliknite na zid', sub: 'da ga izaberete' },
        { icon: Move,              label: 'Uhvatite i povucite element', sub: 'da ga pomerite' },
      ]
    : [
        { icon: Hand,              label: 'Povucite pozadinu', sub: 'da rotirate sobu' },
        { icon: MousePointerClick, label: 'Točak miša', sub: 'za zumiranje' },
        { icon: Move,              label: 'Uhvatite element', sub: 'i pomerite ga po zidu' },
      ]

  return (
    <>
      {/* Aktivan zid badge — jasniji, vidljiviji */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center gap-2.5 rounded-lg"
             style={{
               padding: '10px 14px',
               background: 'rgba(10,10,10,0.88)',
               border: `1px solid ${cfg.color}`,
               backdropFilter: 'blur(12px)',
             }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Radim na</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Hint traka — čita se kao rečenice, veći fontovi */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none" style={{ maxWidth: 'calc(100% - 32px)' }}>
        <div className="flex items-center rounded-xl"
             style={{
               padding: '10px 14px',
               background: 'rgba(11,11,14,0.92)',
               border: '1px solid var(--border-strong)',
               backdropFilter: 'blur(16px)',
               gap: 14,
             }}>
          {hints.map((h, i) => {
            const Icon = h.icon
            return (
              <div key={i} className="flex items-center gap-2.5">
                {i > 0 && <div style={{ width: 1, height: 24, background: 'var(--border)' }} />}
                <Icon size={16} style={{ color: 'var(--text-2)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 600, lineHeight: 1.2 }}>
                    {h.label}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, lineHeight: 1.2 }}>
                    {h.sub}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// FLOATING HELP — dugme bottom-right koje ponovo otvara onboarding
// ─────────────────────────────────────────────────────────────
function FloatingHelp() {
  const openOnboarding = useStore(s => s.openOnboarding)
  return (
    <Tooltip text="Kako da koristim planer?" placement="left">
      <button
        onClick={openOnboarding}
        aria-label="Pomoć — kako da koristim planer"
        className="btn btn-primary fab"
      >
        <HelpCircle size={24} />
      </button>
    </Tooltip>
  )
}

// ─────────────────────────────────────────────────────────────
// Globalni Ctrl+Z hook — poziva undo()
// ─────────────────────────────────────────────────────────────
function useKeyboardShortcuts() {
  const undo = useStore(s => s.undo)
  useEffect(() => {
    const onKey = (e) => {
      // Ignoriši kad je fokus u inputu — Ctrl+Z tamo je native undo
      const t = e.target
      const inInput = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if (inInput) return
      const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')
      if (isUndo) {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo])
}

// ─────────────────────────────────────────────────────────────
// FLOATING DRAG PREVIEW — mala kartica elementa koja prati kursor
// dok korisnik drag-uje iz kataloga (SidePanel) ka canvas-u.
// Prikazuje se SAMO van canvas-a (u canvas-u se prikazuje pravi 3D/2D ghost).
// Sluša globalni 'pointermove' dok god postoji dragSession.
// ─────────────────────────────────────────────────────────────
function FloatingDragPreview() {
  const dragSession = useStore(s => s.dragSession)
  const dragPreview = useStore(s => s.dragPreview)
  const [pt, setPt] = useState({ x: 0, y: 0, visible: false })

  useEffect(() => {
    if (!dragSession) { setPt(p => ({ ...p, visible: false })); return }
    const onMove = (e) => setPt({ x: e.clientX, y: e.clientY, visible: true })
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [dragSession])

  if (!dragSession || !pt.visible) return null
  const el = dragSession.element
  const hasGhost = !!dragPreview       // ako je pointer nad canvas-om, preview je već tu, floating nije potreban
  const overCanvas = hasGhost

  return (
    <div
      style={{
        position: 'fixed',
        left: pt.x + 14, top: pt.y + 14,
        zIndex: 9998,
        padding: '8px 10px',
        minWidth: 180,
        background: 'rgba(18,18,22,0.96)',
        border: `1px solid ${overCanvas ? (dragPreview.valid !== null ? 'var(--green)' : 'var(--red)') : 'var(--border-strong)'}`,
        borderRadius: 10,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        pointerEvents: 'none',
        opacity: overCanvas ? 0.6 : 1,    // kada je nad canvas-om floating se priguši (ghost preuzima)
        transition: 'opacity 120ms var(--ease), border-color 120ms var(--ease)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div style={{
          width: 36, height: 36,
          background: el.color,
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.12)',
          flexShrink: 0,
        }} />
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 600, lineHeight: 1.2 }}>
            {el.name}
          </p>
          <p className="num" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            {el.dimensions.width}×{el.dimensions.height}×{el.dimensions.depth} cm
          </p>
        </div>
      </div>
      {!overCanvas && (
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.3 }}>
          Prevucite u prostor →
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Autosave hook — snimi trenutni projekat na svaku promenu
// (debounce 500ms da ne gađamo localStorage na svakom pikselu drag-a)
// ─────────────────────────────────────────────────────────────
function useAutosave() {
  const currentProjectId = useStore(s => s.currentProjectId)
  const room     = useStore(s => s.room)
  const walls    = useStore(s => s.walls)
  const corners  = useStore(s => s.corners)
  const obstacles = useStore(s => s.obstacles)
  const saveCurrentProject = useStore(s => s.saveCurrentProject)
  const timer = useRef(null)

  useEffect(() => {
    if (!currentProjectId) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { saveCurrentProject() }, 500)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [currentProjectId, room, walls, corners, obstacles, saveCurrentProject])
}

// ─────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────
export default function Planner() {
  const viewMode = useStore(s => s.viewMode)
  useAutosave()
  useKeyboardShortcuts()

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-app)' }}>
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <SidePanel />
        <div className="flex-1 relative" style={{ background: '#0a0a0c' }}>
          {viewMode === 'plan' ? <PlanView /> : <Scene3D />}
          <CanvasOverlay />
          <OnboardingCard />
        </div>
        <CartSummary />
      </div>
      <FloatingHelp />
      <FloatingDragPreview />
    </div>
  )
}
