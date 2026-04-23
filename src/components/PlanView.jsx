import { useRef, useState, useMemo, useCallback } from 'react'
import {
  useStore, OBSTACLE_TYPES, WALL_META, wallLengthCm,
  ZONES, ZONE_ORDER, CORNER_META,
} from '../store/useStore'

// ─────────────────────────────────────────────────────────────
// 2D TOP-DOWN PLAN VIEW
// Konvencija:
//  - back  = gornji rub (y=0), xStart raste udesno
//  - right = desni rub,  xStart raste "ka napred"
//  - front = donji rub,  xStart raste "ka levo"
//  - left  = levi rub,   xStart raste "ka nazad"
// ─────────────────────────────────────────────────────────────

function elementRect(wallId, xStart, element, room) {
  const W = element.dimensions.width
  const D = element.dimensions.depth
  switch (wallId) {
    case 'back':  return { x: xStart,              y: 0,                        w: W, h: D, face: 'bottom' }
    case 'right': return { x: room.width - D,      y: xStart,                   w: D, h: W, face: 'left' }
    case 'front': return { x: room.width - xStart - W, y: room.depth - D,       w: W, h: D, face: 'top' }
    case 'left':  return { x: 0,                   y: room.depth - xStart - W,  w: D, h: W, face: 'right' }
    default: return { x: 0, y: 0, w: W, h: D, face: 'bottom' }
  }
}

function obstacleRect(wallId, obstacle, room) {
  const W = obstacle.width
  const T = 6
  switch (wallId) {
    case 'back':  return { x: obstacle.xStart,                     y: 0,                                w: W, h: T }
    case 'right': return { x: room.width - T,                      y: obstacle.xStart,                  w: T, h: W }
    case 'front': return { x: room.width - obstacle.xStart - W,    y: room.depth - T,                   w: W, h: T }
    case 'left':  return { x: 0,                                   y: room.depth - obstacle.xStart - W, w: T, h: W }
    default: return { x: obstacle.xStart, y: 0, w: W, h: T }
  }
}

// Ugaoni element — square footprint u uglu (W×D = isto)
function cornerRect(cornerId, element, room) {
  const W = element.dimensions.width
  const D = element.dimensions.depth
  switch (cornerId) {
    case 'bl': return { x: 0,                    y: 0,                    w: W, h: D }
    case 'br': return { x: room.width - W,       y: 0,                    w: W, h: D }
    case 'fr': return { x: room.width - W,       y: room.depth - D,       w: W, h: D }
    case 'fl': return { x: 0,                    y: room.depth - D,       w: W, h: D }
    default:   return { x: 0, y: 0, w: W, h: D }
  }
}

// ─────────────────────────────────────────────────────────────
// Dim ruler
// ─────────────────────────────────────────────────────────────
function Dim({ x1, y1, x2, y2, label, off = 28, axis = 'h' }) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = axis === 'h' ? 0 : off
  const dy = axis === 'h' ? off : 0
  const tx = mx + dx
  const ty = my + dy
  const cap = 5
  return (
    <g>
      <line x1={x1 + dx} y1={y1 + dy} x2={x2 + dx} y2={y2 + dy} stroke="#43413d" strokeWidth="0.6" />
      <line x1={x1 + dx - (axis === 'h' ? 0 : cap)} y1={y1 + dy - (axis === 'h' ? cap : 0)}
            x2={x1 + dx + (axis === 'h' ? 0 : cap)} y2={y1 + dy + (axis === 'h' ? cap : 0)}
            stroke="#43413d" strokeWidth="0.6" />
      <line x1={x2 + dx - (axis === 'h' ? 0 : cap)} y1={y2 + dy - (axis === 'h' ? cap : 0)}
            x2={x2 + dx + (axis === 'h' ? 0 : cap)} y2={y2 + dy + (axis === 'h' ? cap : 0)}
            stroke="#43413d" strokeWidth="0.6" />
      <text x={tx} y={ty + (axis === 'h' ? 3 : 1)}
            textAnchor="middle" dominantBaseline="middle"
            fill="#7a766f" fontSize="11" fontWeight="500"
            transform={axis === 'v' ? `rotate(-90, ${tx}, ${ty})` : undefined}
            style={{ paintOrder: 'stroke fill', stroke: '#0b0b0e', strokeWidth: 3.5, fontFamily: 'Inter, sans-serif' }}>
        {label}
      </text>
    </g>
  )
}

// ─────────────────────────────────────────────────────────────
// Zone layer toggle — filter po zoni (koji se crta na vrhu)
// ─────────────────────────────────────────────────────────────
function ZoneFilterPill() {
  const activeZone    = useStore(s => s.activeZone)
  const setActiveZone = useStore(s => s.setActiveZone)
  return (
    <div className="absolute top-4 right-4 flex items-center pointer-events-auto"
         style={{
           padding: 3,
           background: 'rgba(10,10,10,0.82)',
           border: '1px solid var(--border)',
           borderRadius: 8,
           backdropFilter: 'blur(12px)',
         }}>
      <span style={{ fontSize: 11, color: 'var(--text-4)', padding: '0 8px 0 8px' }}>
        Zona
      </span>
      {ZONE_ORDER.map(zId => {
        const z = ZONES[zId]
        const active = activeZone === zId
        return (
          <button
            key={zId}
            onClick={() => setActiveZone(zId)}
            className="press transition-colors"
            style={{
              padding: '4px 10px', fontSize: 11, fontWeight: 500,
              background: active ? 'var(--bg-panel)' : 'transparent',
              border: 'none',
              borderRadius: 5,
              color: active ? 'var(--text-1)' : 'var(--text-3)',
            }}
            title={z.hint}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-3)' }}
          >
            {z.label.replace(' zona', '')}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// GLAVNI PLAN VIEW
// ─────────────────────────────────────────────────────────────
export default function PlanView() {
  const room           = useStore(s => s.room)
  const walls          = useStore(s => s.walls)
  const corners        = useStore(s => s.corners)
  const obstacles      = useStore(s => s.obstacles)
  const activeWall     = useStore(s => s.activeWall)
  const setActiveWall  = useStore(s => s.setActiveWall)
  const activeZone     = useStore(s => s.activeZone)
  const selectedUid    = useStore(s => s.selectedUid)
  const setSelectedUid = useStore(s => s.setSelectedUid)
  const setElementPosition = useStore(s => s.setElementPosition)
  const dragElementToWall  = useStore(s => s.dragElementToWall)
  const updateObstacle = useStore(s => s.updateObstacle)
  const dragSession    = useStore(s => s.dragSession)
  const dragPreview    = useStore(s => s.dragPreview)
  const setDragPreview = useStore(s => s.setDragPreview)
  const validateDragPosition = useStore(s => s.validateDragPosition)

  const svgRef = useRef(null)
  const [drag, setDrag] = useState(null)

  const M = 70

  const toSvgPoint = useCallback((clientX, clientY) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX; pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    return pt.matrixTransform(ctm.inverse())
  }, [])

  const onElementDown = (e, placed, wallId) => {
    e.stopPropagation(); e.preventDefault()
    setSelectedUid(placed.uid)
    const { x, y } = toSvgPoint(e.clientX, e.clientY)
    let pointerAlong
    switch (wallId) {
      case 'back':  pointerAlong = x; break
      case 'right': pointerAlong = y; break
      case 'front': pointerAlong = room.width - x; break
      case 'left':  pointerAlong = room.depth - y; break
      default: pointerAlong = x
    }
    setDrag({ kind: 'element', uid: placed.uid, wallId, grabOffset: pointerAlong - placed.xStart, width: placed.element.dimensions.width })
  }

  const onObstacleDown = (e, obstacle, wallId) => {
    e.stopPropagation(); e.preventDefault()
    setSelectedUid(obstacle.uid)
    const { x, y } = toSvgPoint(e.clientX, e.clientY)
    let pointerAlong
    switch (wallId) {
      case 'back':  pointerAlong = x; break
      case 'right': pointerAlong = y; break
      case 'front': pointerAlong = room.width - x; break
      case 'left':  pointerAlong = room.depth - y; break
      default: pointerAlong = x
    }
    setDrag({ kind: 'obstacle', uid: obstacle.uid, wallId, grabOffset: pointerAlong - obstacle.xStart, width: obstacle.width })
  }

  // Projektuj pointer na koordinatni sistem datog zida (pointerAlong)
  const projectOnWall = (wallId, x, y) => {
    switch (wallId) {
      case 'back':  return x
      case 'right': return y
      case 'front': return room.width - x
      case 'left':  return room.depth - y
      default: return x
    }
  }

  // Nađi zid kome je pointer NAJBLIZI (perpendikularna distanca)
  const nearestWall = (x, y) => {
    const d = {
      back:  Math.abs(y),
      right: Math.abs(room.width - x),
      front: Math.abs(room.depth - y),
      left:  Math.abs(x),
    }
    return Object.keys(d).reduce((a, b) => (d[a] < d[b] ? a : b))
  }

  // ── Drag-and-drop iz kataloga: ako ima dragSession, projektuj
  // pointer na najbliži zid i postavi dragPreview sa validnim xStart-om.
  // Ovo slušamo na SVG-onPointerMove (ne globalno) jer treba SVG-coord transform.
  const onSvgPointerMove = (e) => {
    if (!dragSession?.element) return
    const { x, y } = toSvgPoint(e.clientX, e.clientY)
    // Ako je pointer van sobe (u margini), clamp u granice — najbliži zid će svakako biti identifikovan
    const targetWall = nearestWall(x, y)
    const pointerAlong = projectOnWall(targetWall, x, y)
    const el = dragSession.element
    if (el.placement === 'corner') {
      // Ugaoni — ne biramo mesto mišem; overlay ostaje prazan u prostoru,
      // ali označimo "valid" po standardnom addElement putu (prvi slobodan ugao).
      setDragPreview({ wallId: null, xStart: 0, valid: 0, isCorner: true })
      return
    }
    const desiredX = pointerAlong - el.dimensions.width / 2
    // Snap na grid 5
    const snapped = Math.round(desiredX / 5) * 5
    const validX = validateDragPosition(el, targetWall, snapped)
    // validX=null → nema mesta. Ipak prikaži ghost na clamped poziciji, crveno.
    setDragPreview({
      wallId: targetWall,
      xStart: validX !== null ? validX : snapped,
      valid:  validX,
    })
  }

  const onSvgPointerLeave = () => {
    if (dragSession) setDragPreview(null)   // floating card preuzima dok nismo nad canvas-om
  }

  const onMouseMove = (e) => {
    // Drag iz kataloga — odvojena putanja
    if (dragSession?.element) { onSvgPointerMove(e); /* i dalje dozvoli postojeći drag ispod */ }
    if (!drag) return
    const { x, y } = toSvgPoint(e.clientX, e.clientY)
    const snap = e.shiftKey ? 1 : 5

    // ── Element drag: sticky-wall sa automatskim prelazom preko ćoška ──
    if (drag.kind === 'element') {
      const target = nearestWall(x, y)

      // Ako je pointer bliži drugom zidu — pokušaj prelaz
      if (target !== drag.wallId) {
        const pointerAlongNew = projectOnWall(target, x, y)
        const centered = pointerAlongNew - drag.width / 2
        const snapped = Math.round(centered / snap) * snap
        const ok = dragElementToWall(drag.uid, target, snapped)
        if (ok) {
          // Reset grabOffset tako da element ostaje centriran ispod kursora
          setDrag({ ...drag, wallId: target, grabOffset: drag.width / 2 })
          return
        }
        // Ako transfer nije uspeo (nema mesta) — pusti stari zid da clampa dalje
      }

      // Same-wall slide
      const pointerAlong = projectOnWall(drag.wallId, x, y)
      const raw = pointerAlong - drag.grabOffset
      const snapped = Math.round(raw / snap) * snap
      setElementPosition(drag.uid, snapped)   // store sam clampa i blokira overlap
      return
    }

    // ── Obstacle drag: same-wall only, bez transfera ──
    const pointerAlong = projectOnWall(drag.wallId, x, y)
    const maxW = wallLengthCm(drag.wallId, room)
    const raw = pointerAlong - drag.grabOffset
    const snapped = Math.round(raw / snap) * snap
    const nextX = Math.max(0, Math.min(maxW - drag.width, snapped))
    updateObstacle(drag.uid, { xStart: nextX })
  }

  const onMouseUp = () => setDrag(null)

  const onWallClick = (wallId) => {
    setActiveWall(wallId)
    setSelectedUid(null)
  }

  const onFloorClick = () => setSelectedUid(null)

  const placedByWall = useMemo(() => walls, [walls])

  // Sort elements: non-active zone u pozadini, active zone na vrhu
  const allElements = useMemo(() => {
    const arr = []
    for (const [wallId, list] of Object.entries(placedByWall)) {
      for (const p of list) arr.push({ ...p, wallId })
    }
    return arr.sort((a, b) => {
      const aActive = a.element.zones?.includes(activeZone) ? 1 : 0
      const bActive = b.element.zones?.includes(activeZone) ? 1 : 0
      return aActive - bActive
    })
  }, [placedByWall, activeZone])

  return (
    <div className="plan-view w-full h-full flex flex-col relative">
      <svg
        ref={svgRef}
        viewBox={`${-M} ${-M} ${room.width + 2 * M} ${room.depth + 2 * M}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: '100%', height: '100%',
          userSelect: 'none', touchAction: 'none',
          background: '#0a0a0a',
        }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={(e) => { onMouseUp(e); onSvgPointerLeave() }}
      >
        <defs>
          <pattern id="pv-grid-25" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
          </pattern>
          <pattern id="pv-grid-100" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#pv-grid-25)" />
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#252525" strokeWidth="0.6" />
          </pattern>
        </defs>

        {/* Pod */}
        <g onClick={onFloorClick}>
          <rect x={0} y={0} width={room.width} height={room.depth} fill={room.floorColor || '#111111'} opacity="0.55" />
          <rect x={0} y={0} width={room.width} height={room.depth} fill="url(#pv-grid-100)" opacity="0.45" />
        </g>

        {/* Active wall tint — suptilan beli sloj, bez boje */}
        {activeWall && (() => {
          const tintW = 45
          switch (activeWall) {
            case 'back':
              return <rect x={0} y={0} width={room.width} height={tintW} fill="#ffffff" opacity={0.025} pointerEvents="none" />
            case 'right':
              return <rect x={room.width - tintW} y={0} width={tintW} height={room.depth} fill="#ffffff" opacity={0.025} pointerEvents="none" />
            case 'front':
              return <rect x={0} y={room.depth - tintW} width={room.width} height={tintW} fill="#ffffff" opacity={0.025} pointerEvents="none" />
            case 'left':
              return <rect x={0} y={0} width={tintW} height={room.depth} fill="#ffffff" opacity={0.025} pointerEvents="none" />
            default: return null
          }
        })()}

        {/* ZIDOVI — klikljivi, jedinstvena neutralna boja; aktivan u brand crvenoj */}
        {['back', 'right', 'front', 'left'].map(wallId => {
          const isActive = activeWall === wallId
          let x, y, w, h
          switch (wallId) {
            case 'back':  [x, y, w, h] = [-4, -4, room.width + 8, 4]; break
            case 'right': [x, y, w, h] = [room.width, -4, 4, room.depth + 8]; break
            case 'front': [x, y, w, h] = [-4, room.depth, room.width + 8, 4]; break
            case 'left':  [x, y, w, h] = [-4, -4, 4, room.depth + 8]; break
          }
          return (
            <rect key={wallId}
                  x={x} y={y} width={w} height={h}
                  fill={isActive ? '#c41419' : '#2e2e2e'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onWallClick(wallId)}>
              <title>{WALL_META[wallId].label} — klikni za aktivaciju</title>
            </rect>
          )
        })}

        {/* LABELE zidova — jedna neutralna boja, bez caps i bez letter-spacing drame */}
        <g style={{ pointerEvents: 'none' }}>
          {[
            { id: 'back',  x: room.width / 2, y: -16,                 rot: 0,   label: 'Zadnji zid' },
            { id: 'front', x: room.width / 2, y: room.depth + 22,     rot: 0,   label: 'Prednji zid' },
            { id: 'right', x: room.width + 16, y: room.depth / 2,     rot: 90,  label: 'Desni zid' },
            { id: 'left',  x: -16,             y: room.depth / 2,     rot: -90, label: 'Levi zid' },
          ].map(w => {
            const isActive = activeWall === w.id
            return (
              <text key={w.id} x={w.x} y={w.y}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={isActive ? '#d6d6d6' : '#5a5a5a'} fontSize="11" fontWeight="500"
                    transform={w.rot ? `rotate(${w.rot}, ${w.x}, ${w.y})` : undefined}
                    style={{ paintOrder: 'stroke fill', stroke: '#0a0a0a', strokeWidth: 3, fontFamily: 'Inter, sans-serif' }}>
                {w.label}
              </text>
            )
          })}
        </g>

        <Dim x1={0} y1={room.depth} x2={room.width} y2={room.depth} label={`${room.width} cm`} off={48} axis="h" />
        <Dim x1={0} y1={0} x2={0} y2={room.depth} label={`${room.depth} cm`} off={-48} axis="v" />

        {/* OBSTACLES */}
        {Object.entries(obstacles).flatMap(([wallId, list]) =>
          list.map(o => {
            const r = obstacleRect(wallId, o, room)
            const meta = OBSTACLE_TYPES[o.type]
            const isSel = selectedUid === o.uid
            return (
              <g key={o.uid}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h}
                      fill={meta.color} opacity={0.9}
                      stroke={isSel ? 'var(--brand)' : 'rgba(255,255,255,0.35)'} strokeWidth={isSel ? 2 : 0.5}
                      rx={1}
                      style={{ cursor: 'grab' }}
                      onMouseDown={e => onObstacleDown(e, o, wallId)}>
                  <title>{meta.label} ({o.width}×{o.height}cm, y={o.yStart})</title>
                </rect>
                {o.width > 40 && (
                  <text
                    x={r.x + r.w / 2}
                    y={wallId === 'back' ? r.y + 4.5 : wallId === 'front' ? r.y + 4.5 : r.y + r.h / 2}
                    transform={wallId === 'left' || wallId === 'right' ? `rotate(${wallId === 'right' ? 90 : -90}, ${r.x + r.w / 2}, ${r.y + r.h / 2})` : undefined}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="#fff" fontSize="6" fontWeight="600"
                    style={{ pointerEvents: 'none', fontFamily: 'Inter, sans-serif' }}>
                    {meta.label.toUpperCase()}
                  </text>
                )}
              </g>
            )
          })
        )}

        {/* UGAONI ELEMENTI */}
        {Object.entries(corners).flatMap(([cId, c]) => {
          if (!c) return []
          const r = cornerRect(cId, c.element, room)
          const isSel = selectedUid === c.uid
          return [(
            <g key={c.uid}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h}
                    fill={c.element.color}
                    stroke={isSel ? 'var(--brand)' : 'rgba(255,255,255,0.15)'}
                    strokeWidth={isSel ? 1.4 : 0.5}
                    opacity={c.element.zones?.includes(activeZone) ? 1 : 0.55}
                    style={{ cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); setSelectedUid(c.uid) }}>
                <title>{c.element.name} · {CORNER_META[cId].label}</title>
              </rect>
              {cId === 'bl' && <line x1={r.x} y1={r.y+r.h} x2={r.x+r.w} y2={r.y} stroke="#0a0a0a" strokeWidth="0.6" opacity="0.4" />}
              {cId === 'br' && <line x1={r.x} y1={r.y} x2={r.x+r.w} y2={r.y+r.h} stroke="#0a0a0a" strokeWidth="0.6" opacity="0.4" />}
              {cId === 'fr' && <line x1={r.x} y1={r.y+r.h} x2={r.x+r.w} y2={r.y} stroke="#0a0a0a" strokeWidth="0.6" opacity="0.4" />}
              {cId === 'fl' && <line x1={r.x} y1={r.y} x2={r.x+r.w} y2={r.y+r.h} stroke="#0a0a0a" strokeWidth="0.6" opacity="0.4" />}
            </g>
          )]
        })}

        {/* ELEMENTI */}
        {allElements.map(p => {
          const wallId = p.wallId
          const r = elementRect(wallId, p.xStart, p.element, room)
          const isSel = selectedUid === p.uid
          const el = p.element
          const isWall = el.placement === 'wall'
          const isCT   = el.placement === 'countertop'
          const inActiveZone = el.zones?.includes(activeZone)

          let handleLine
          const H_IN = 3
          switch (r.face) {
            case 'bottom': handleLine = <rect x={r.x + 4} y={r.y + r.h - H_IN} width={r.w - 8} height={H_IN - 0.5} fill="#0a0a0a" opacity={0.5} rx={0.8} />; break
            case 'top':    handleLine = <rect x={r.x + 4} y={r.y + 0.5}           width={r.w - 8} height={H_IN - 0.5} fill="#0a0a0a" opacity={0.5} rx={0.8} />; break
            case 'left':   handleLine = <rect x={r.x + 0.5} y={r.y + 4}           width={H_IN - 0.5} height={r.h - 8} fill="#0a0a0a" opacity={0.5} rx={0.8} />; break
            case 'right':  handleLine = <rect x={r.x + r.w - H_IN} y={r.y + 4}    width={H_IN - 0.5} height={r.h - 8} fill="#0a0a0a" opacity={0.5} rx={0.8} />; break
          }

          return (
            <g key={p.uid} opacity={inActiveZone ? 1 : 0.4}>
              {isSel && (
                <rect x={r.x - 3} y={r.y - 3} width={r.w + 6} height={r.h + 6}
                      fill="none" stroke="var(--brand)" strokeWidth="0.7" opacity="0.45" rx="2" />
              )}

              <rect x={r.x} y={r.y} width={r.w} height={r.h}
                    fill={el.color}
                    stroke={isSel ? 'var(--brand)' : 'rgba(255,255,255,0.14)'}
                    strokeWidth={isSel ? 1.2 : 0.5}
                    strokeDasharray={isWall ? '2 1.5' : undefined}
                    opacity={isCT ? 0.85 : 1}
                    rx={1}
                    style={{
                      cursor: drag?.uid === p.uid ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={e => onElementDown(e, p, wallId)}
                    onClick={e => { e.stopPropagation(); setSelectedUid(p.uid) }}>
                <title>{el.name} · {el.colorName} · {el.zones?.join(', ')}</title>
              </rect>

              {handleLine}

              {Math.min(r.w, r.h) > 20 && (
                <text
                  x={r.x + r.w / 2} y={r.y + r.h / 2 + 2}
                  textAnchor="middle"
                  fill={el.color === '#F5F5F0' || el.color === '#FFFFFF' || el.color === '#C0C0C0' ? '#3a3a3a' : 'rgba(255,255,255,0.75)'}
                  fontSize={Math.min(7, r.w / 6, r.h / 3)}
                  fontWeight="500"
                  style={{ pointerEvents: 'none', fontFamily: 'Inter, sans-serif' }}>
                  {el.dimensions.width}
                </text>
              )}
            </g>
          )
        })}

        {/* Empty hint */}
        {Object.values(walls).every(l => l.length === 0) && Object.values(corners).every(c => !c) && !dragSession && (
          <g style={{ pointerEvents: 'none' }}>
            <text x={room.width / 2} y={room.depth / 2 - 4} textAnchor="middle"
                  fill="#666" fontSize="9" fontWeight="400"
                  style={{ fontFamily: 'Inter, sans-serif' }}>
              Kliknite ili prevucite element iz leve palete
            </text>
            <text x={room.width / 2} y={room.depth / 2 + 10} textAnchor="middle"
                  fill="#3a3a3a" fontSize="7"
                  style={{ fontFamily: 'Inter, sans-serif' }}>
              prvo odaberi zid
            </text>
          </g>
        )}

        {/* ── GHOST PREVIEW — drag-and-drop iz kataloga ── */}
        {dragSession?.element && dragPreview && dragPreview.wallId && (() => {
          const el = dragSession.element
          const xStart = dragPreview.xStart
          const r = elementRect(dragPreview.wallId, xStart, el, room)
          const isValid = dragPreview.valid !== null
          const color = isValid ? '#4ade80' : '#f87171'
          return (
            <g style={{ pointerEvents: 'none' }}>
              {/* Senka ispod ghost-a */}
              <rect x={r.x - 1} y={r.y - 1} width={r.w + 2} height={r.h + 2}
                    fill="none" stroke={color} strokeWidth="1.5"
                    strokeDasharray="3 2"
                    opacity={0.9} rx={1.5} />
              {/* Poluprozirna boja elementa */}
              <rect x={r.x} y={r.y} width={r.w} height={r.h}
                    fill={el.color}
                    opacity={isValid ? 0.55 : 0.25}
                    rx={1} />
              {/* Kratak tekst-indikator (width cm) */}
              {Math.min(r.w, r.h) > 20 && (
                <text
                  x={r.x + r.w / 2} y={r.y + r.h / 2 + 2}
                  textAnchor="middle"
                  fill={color}
                  fontSize={Math.min(8, r.w / 6, r.h / 3)}
                  fontWeight="700"
                  style={{
                    paintOrder: 'stroke fill',
                    stroke: '#0a0a0a', strokeWidth: 2.5,
                    fontFamily: 'Inter, sans-serif',
                  }}>
                  {isValid ? `${el.dimensions.width} cm` : 'zauzeto'}
                </text>
              )}
            </g>
          )
        })()}
      </svg>

      {/* Zone filter overlay */}
      <ZoneFilterPill />
    </div>
  )
}
