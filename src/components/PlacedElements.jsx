import { useState, useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useStore, getElementTransform, getCornerTransform, elementYStart, wallLengthCm } from '../store/useStore'

// ─────────────────────────────────────────────────────────────
// Wall tangent — world-space unit vector u smeru rastućeg xStart
// ─────────────────────────────────────────────────────────────
function wallTangent(wallId) {
  switch (wallId) {
    case 'back':  return new THREE.Vector3( 1, 0,  0)
    case 'right': return new THREE.Vector3( 0, 0,  1)
    case 'front': return new THREE.Vector3(-1, 0,  0)
    case 'left':  return new THREE.Vector3( 0, 0, -1)
    default:      return new THREE.Vector3( 1, 0,  0)
  }
}

// Projekcija world pointa (meters) na (xStart cm) datog zida
function worldPointToXStartCm(wallId, worldPt, room) {
  const RW = room.width  * 0.01
  const RD = room.depth  * 0.01
  switch (wallId) {
    case 'back':  return worldPt.x * 100
    case 'right': return worldPt.z * 100
    case 'front': return (RW - worldPt.x) * 100
    case 'left':  return (RD - worldPt.z) * 100
    default:      return worldPt.x * 100
  }
}

// Nearest wall po perpendikularnoj distanci u XZ ravni
function nearestWallXZ(worldPt, room) {
  const RW = room.width  * 0.01
  const RD = room.depth  * 0.01
  const d = {
    back:  Math.abs(worldPt.z),
    right: Math.abs(RW - worldPt.x),
    front: Math.abs(RD - worldPt.z),
    left:  Math.abs(worldPt.x),
  }
  return Object.keys(d).reduce((a, b) => (d[a] < d[b] ? a : b))
}

// ─────────────────────────────────────────────────────────────
// Material profil po boji
// ─────────────────────────────────────────────────────────────
function getMaterialProfile(element) {
  const c = element.color
  const isWhite   = c === '#F5F5F0' || c === '#FFFFFF'
  const isBlack   = c === '#1C1C1C'
  const isAntr    = c === '#3D3D3D' || c === '#555555'
  const isInox    = c === '#C0C0C0'
  const isHrast   = c === '#B8864E'
  const isOrah    = c === '#6B4423'
  const isMatte   = isBlack || isAntr
  const isMetal   = isInox

  return {
    bodyColor: c,
    bodyRoughness: isMetal ? 0.25 : isWhite ? 0.45 : isMatte ? 0.55 : isHrast || isOrah ? 0.68 : 0.5,
    bodyMetalness: isMetal ? 0.82 : isWhite ? 0.02 : 0.04,
    envIntensity: isMetal ? 1.3 : 0.3,
    ctColor: isWhite ? '#e8e2d6' : isBlack ? '#1a1a1a' : isHrast ? '#d4c8b0' : '#d8d3c7',
    ctRoughness: 0.22,
    handleColor: isMetal ? '#d2d2d2' : isBlack || isAntr ? '#cccccc' : '#9a9592',
    handleMetalness: 0.88,
    handleRoughness: 0.2,
  }
}

// ─────────────────────────────────────────────────────────────
// Ručica (cilindar)
// ─────────────────────────────────────────────────────────────
function Handle({ position, mat, length = 0.08 }) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, length, 12]} />
        <meshStandardMaterial
          color={mat.handleColor}
          metalness={mat.handleMetalness}
          roughness={mat.handleRoughness}
          envMapIntensity={1.2}
        />
      </mesh>
      <mesh position={[-length / 2, 0, -0.005]}>
        <cylinderGeometry args={[0.004, 0.004, 0.012, 10]} />
        <meshStandardMaterial color={mat.handleColor} metalness={mat.handleMetalness} roughness={mat.handleRoughness} />
      </mesh>
      <mesh position={[ length / 2, 0, -0.005]}>
        <cylinderGeometry args={[0.004, 0.004, 0.012, 10]} />
        <meshStandardMaterial color={mat.handleColor} metalness={mat.handleMetalness} roughness={mat.handleRoughness} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// Jedan 3D element — zona-aware + sticky-wall drag (window events)
// ─────────────────────────────────────────────────────────────
function KitchenBox({ placed }) {
  const { uid, element, xStart, wallId, isCorner, cornerId } = placed
  const room                = useStore(s => s.room)
  const selectedUid         = useStore(s => s.selectedUid)
  const setSelectedUid      = useStore(s => s.setSelectedUid)
  const setElementPosition  = useStore(s => s.setElementPosition)
  const dragElementToWall   = useStore(s => s.dragElementToWall)
  const setDragLock         = useStore(s => s.setDragLock)
  const [hov, setHov]       = useState(false)

  const { camera, gl } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  const isSelected = selectedUid === uid
  const transform  = isCorner
    ? getCornerTransform(cornerId, element, room)
    : getElementTransform(wallId, xStart, element, room)

  const W = element.dimensions.width  * 0.01
  const H = element.dimensions.height * 0.01
  const D = element.dimensions.depth  * 0.01

  const mat = getMaterialProfile(element)

  const emissive = isSelected
    ? new THREE.Color(0x6b0a0c)
    : hov ? new THREE.Color(0x2a0304) : new THREE.Color(0x000000)

  const placement = element.placement
  const zones     = element.zones || []
  const isFloor   = placement === 'floor' || zones[0] === 'donja'
  const isTall    = placement === 'tall'
  const isWall    = placement === 'wall'
  const isCT      = placement === 'countertop'
  const yBase     = elementYStart(element) * 0.01
  const yCenter   = yBase + H / 2

  const hasDoubleDoor = element.dimensions.width >= 60 && !isCT
  const doorInset     = 0.005
  const BRAND         = 0xc41419

  // ── Drag state (ref da izbegne re-render u toku drag-a) ─
  const dragRef = useRef({
    active: false, moved: false,
    startClientX: 0, startClientY: 0,
    startXStart: 0, startWallId: null,
    startWorld: new THREE.Vector3(),
    plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    tangent: new THREE.Vector3(),
    widthCm: 0,
  })

  // ── Koordinate preslikane sa client(px) u world(m) preko raycaster-a ─
  function clientToWorldOnPlane(clientX, clientY, plane) {
    const canvas = gl.domElement
    const rect = canvas.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    )
    raycaster.setFromCamera(ndc, camera)
    const out = new THREE.Vector3()
    return raycaster.ray.intersectPlane(plane, out) ? out : null
  }

  // ── Window handlers (postavljaju se iz onPointerDown, skidaju na up) ─
  const handlersRef = useRef({ move: null, up: null, cancel: null })

  function cleanupListeners() {
    const h = handlersRef.current
    if (h.move)   window.removeEventListener('pointermove', h.move)
    if (h.up)     window.removeEventListener('pointerup', h.up)
    if (h.cancel) window.removeEventListener('pointercancel', h.cancel)
    handlersRef.current = { move: null, up: null, cancel: null }
  }

  useEffect(() => () => cleanupListeners(), [])   // cleanup na unmount

  function onPointerDown(e) {
    e.stopPropagation()

    // Ugaoni element — samo select
    if (isCorner) {
      setSelectedUid(isSelected ? null : uid)
      return
    }

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -yCenter)
    const worldPt = clientToWorldOnPlane(e.clientX, e.clientY, plane) || new THREE.Vector3()

    dragRef.current = {
      active: true, moved: false,
      startClientX: e.clientX, startClientY: e.clientY,
      startXStart: xStart,
      startWallId: wallId,
      startWorld: worldPt.clone(),
      plane,
      tangent: wallTangent(wallId),
      widthCm: element.dimensions.width,
    }

    setDragLock(true)

    // Registruj window listenere — oni će hvatati pointer i kad izađe iz geometrije
    const onMove = (ev) => handleMove(ev)
    const onUp   = (ev) => handleUp(ev)
    const onCan  = (ev) => handleCancel(ev)
    handlersRef.current = { move: onMove, up: onUp, cancel: onCan }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCan)
  }

  function handleMove(ev) {
    const d = dragRef.current
    if (!d.active) return

    // Klik vs. drag prag
    if (!d.moved) {
      const dx = ev.clientX - d.startClientX
      const dy = ev.clientY - d.startClientY
      if (Math.hypot(dx, dy) < 5) return
      d.moved = true
      if (!isSelected) setSelectedUid(uid)
    }

    const hit = clientToWorldOnPlane(ev.clientX, ev.clientY, d.plane)
    if (!hit) return

    const snap = ev.shiftKey ? 1 : 5

    // Proveri da li je pointer bliži drugom zidu — ako jeste, probaj prelaz
    const nearestId = nearestWallXZ(hit, room)
    const currentWall = d.startWallId  // može se menjati tokom drag-a

    if (nearestId !== currentWall) {
      const xOnNewWall = worldPointToXStartCm(nearestId, hit, room)
      const centered = xOnNewWall - d.widthCm / 2
      const snapped = Math.round(centered / snap) * snap
      const ok = dragElementToWall(uid, nearestId, snapped)
      if (ok) {
        // Update drag ref za sledeći frame
        d.startWallId = nearestId
        d.tangent = wallTangent(nearestId)
        d.startXStart = snapped
        d.startWorld = hit.clone()
        return
      }
      // transfer blokiran — nastavi sliding na trenutnom zidu
    }

    // Same-wall slide
    const deltaWorld = hit.clone().sub(d.startWorld)
    const distM  = deltaWorld.dot(d.tangent)
    const distCm = distM * 100
    const raw = d.startXStart + distCm
    const snapped = Math.round(raw / snap) * snap
    setElementPosition(uid, snapped)
  }

  function handleUp(/* ev */) {
    const d = dragRef.current
    if (!d.active) return

    // Bez pomeranja → klik = toggle selekcija
    if (!d.moved) {
      setSelectedUid(isSelected ? null : uid)
    }
    d.active = false
    setDragLock(false)
    cleanupListeners()
  }

  function handleCancel(/* ev */) {
    const d = dragRef.current
    if (!d.active) return
    d.active = false
    setDragLock(false)
    cleanupListeners()
  }

  return (
    <group position={transform.position} rotation={transform.rotation}>
      {/* Telo — drag start handler */}
      <mesh
        castShadow receiveShadow
        onPointerDown={onPointerDown}
        onPointerEnter={() => setHov(true)}
        onPointerLeave={() => setHov(false)}
      >
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial
          color={mat.bodyColor}
          roughness={mat.bodyRoughness}
          metalness={mat.bodyMetalness}
          envMapIntensity={mat.envIntensity}
          emissive={emissive}
          emissiveIntensity={isSelected ? 0.22 : hov ? 0.1 : 0}
        />
      </mesh>

      {/* Vrata — ugaoni elementi NEMAJU vrata ni fioke (filler blok) */}
      {!isCT && !isCorner && (
        <group position={[0, 0, D / 2 - doorInset + 0.0005]}>
          {hasDoubleDoor ? (
            <>
              <mesh position={[-W / 4 + 0.003, 0, 0]}>
                <boxGeometry args={[W / 2 - 0.003, H - 0.004, 0.01]} />
                <meshStandardMaterial
                  color={mat.bodyColor}
                  roughness={mat.bodyRoughness * 0.85}
                  metalness={mat.bodyMetalness + 0.02}
                  envMapIntensity={mat.envIntensity}
                />
              </mesh>
              <mesh position={[W / 4 - 0.003 + 0.003, 0, 0]}>
                <boxGeometry args={[W / 2 - 0.003, H - 0.004, 0.01]} />
                <meshStandardMaterial
                  color={mat.bodyColor}
                  roughness={mat.bodyRoughness * 0.85}
                  metalness={mat.bodyMetalness + 0.02}
                  envMapIntensity={mat.envIntensity}
                />
              </mesh>
              <mesh position={[0, 0, 0.0051]}>
                <boxGeometry args={[0.002, H - 0.02, 0.001]} />
                <meshBasicMaterial color="#0a0a0c" />
              </mesh>
            </>
          ) : (
            <mesh castShadow>
              <boxGeometry args={[W - 0.004, H - 0.004, 0.01]} />
              <meshStandardMaterial
                color={mat.bodyColor}
                roughness={mat.bodyRoughness * 0.85}
                metalness={mat.bodyMetalness + 0.02}
                envMapIntensity={mat.envIntensity}
              />
            </mesh>
          )}
        </group>
      )}

      {/* Ručice — ugaoni nema */}
      {!isCT && !isCorner && hasDoubleDoor && (
        <>
          <Handle position={[-W / 4 - 0.04, isWall ? -H / 2 + 0.12 : H / 2 - 0.12, D / 2 + 0.015]}
                  mat={mat} length={0.09} />
          <Handle position={[ W / 4 + 0.04, isWall ? -H / 2 + 0.12 : H / 2 - 0.12, D / 2 + 0.015]}
                  mat={mat} length={0.09} />
        </>
      )}
      {!isCT && !isCorner && !hasDoubleDoor && (
        <Handle position={[W * 0.3, isWall ? -H / 2 + 0.1 : H / 2 - 0.1, D / 2 + 0.015]}
                mat={mat} length={Math.min(W * 0.35, 0.09)} />
      )}

      {/* Radna površ — za floor/tall elemente (yBase < 10cm) */}
      {(isFloor || isTall) && yBase < 0.1 && (
        <mesh position={[0, H / 2 + 0.019, 0]} castShadow>
          <boxGeometry args={[W + 0.006, 0.038, D + 0.05]} />
          <meshStandardMaterial
            color={mat.ctColor}
            roughness={mat.ctRoughness}
            metalness={0.06}
            envMapIntensity={0.5}
          />
        </mesh>
      )}

      {/* Sokla */}
      {(isFloor || isTall) && yBase < 0.1 && (
        <mesh position={[0, -H / 2 + 0.04, 0.002]}>
          <boxGeometry args={[W - 0.04, 0.08, D - 0.02]} />
          <meshStandardMaterial color="#0b0a08" roughness={0.75} metalness={0.1} />
        </mesh>
      )}

      {/* Selekcija (brand red edges + podni glow) */}
      {isSelected && (
        <>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(W + 0.014, H + 0.014, D + 0.014)]} />
            <lineBasicMaterial color={BRAND} linewidth={2} />
          </lineSegments>
          <mesh position={[0, -H / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[W * 1.5, D * 1.5]} />
            <meshBasicMaterial color={BRAND} transparent opacity={0.18} depthWrite={false} />
          </mesh>
        </>
      )}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// Svi postavljeni elementi (zidovi + uglovi)
// ─────────────────────────────────────────────────────────────
export default function PlacedElements() {
  const getAllPlaced = useStore(s => s.getAllPlaced)
  const placed = getAllPlaced()

  return (
    <group>
      {placed.map(p => <KitchenBox key={p.uid} placed={p} />)}
    </group>
  )
}
