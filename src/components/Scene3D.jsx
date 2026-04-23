import { Suspense, useRef, useEffect, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useStore, getElementTransform, elementYStart } from '../store/useStore'
import KitchenRoom from './KitchenRoom'
import PlacedElements from './PlacedElements'

// ─────────────────────────────────────────────────────────────
// Camera preset pozicije — kalibrisano za dobar pogled iznutra
// ─────────────────────────────────────────────────────────────
function getCameraPreset(preset, room) {
  const W = room.width  * 0.01
  const D = room.depth  * 0.01
  const H = room.height * 0.01
  const cx = W / 2, cy = H * 0.4, cz = D * 0.45
  switch (preset) {
    case 'top':
      return { pos: [cx, H * 5.5, D / 2 + 0.01], tgt: [cx, 0, D / 2] }
    case 'front':
      return { pos: [cx, H * 0.55, D * 3.2], tgt: [cx, H * 0.45, D * 0.3] }
    case 'back':
      return { pos: [cx, H * 0.55, -D * 2.0], tgt: [cx, H * 0.45, D * 0.6] }
    case 'left':
      return { pos: [-D * 2.3, H * 0.55, D * 0.5],  tgt: [cx * 0.6, H * 0.4, D * 0.5] }
    case 'right':
      return { pos: [W + D * 2.3, H * 0.55, D * 0.5], tgt: [cx + (W - cx) * 0.4, H * 0.4, D * 0.5] }
    default: // perspective
      return { pos: [W * 0.6, H * 1.1, D * 2.6], tgt: [cx, cy, cz] }
  }
}

// ─────────────────────────────────────────────────────────────
// Smooth camera transition na preset promenu
// — otkazuje se čim korisnik dotakne OrbitControls (da ne
//   "vuče" kameru natrag ka zidu dok pokušava da rotira/pan-uje)
// ─────────────────────────────────────────────────────────────
function CameraController({ controlsRef }) {
  const { camera } = useThree()
  const room = useStore(s => s.room)
  const preset = useStore(s => s.cameraPreset)
  const targetPos = useRef(new THREE.Vector3())
  const targetLook = useRef(new THREE.Vector3())
  const isAnimating = useRef(false)

  // Okini novu animaciju na preset/room promenu
  useEffect(() => {
    const { pos, tgt } = getCameraPreset(preset, room)
    targetPos.current.set(...pos)
    targetLook.current.set(...tgt)
    isAnimating.current = true
  }, [preset, room])

  // Čim korisnik krene da rotira / pan-uje / zoom-uje, prekini animaciju.
  // OrbitControls emituju 'start' event na pointerdown / wheel / touch start.
  useEffect(() => {
    const ctrls = controlsRef.current
    if (!ctrls) return
    const cancel = () => { isAnimating.current = false }
    ctrls.addEventListener('start', cancel)
    return () => ctrls.removeEventListener('start', cancel)
  }, [controlsRef])

  useFrame(() => {
    if (!isAnimating.current) return
    camera.position.lerp(targetPos.current, 0.08)
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, 0.08)
      controlsRef.current.update()
    }
    if (camera.position.distanceTo(targetPos.current) < 0.005) {
      isAnimating.current = false
    }
  })

  return null
}

// ─────────────────────────────────────────────────────────────
// Klik van elementa = odselektuj (nevidljivi plane ispod poda)
// ─────────────────────────────────────────────────────────────
function DeselectPlane() {
  const setSelectedUid = useStore(s => s.setSelectedUid)
  return (
    <mesh position={[0, -100, 0]} onClick={() => setSelectedUid(null)} visible={false}>
      <boxGeometry args={[500, 1, 500]} />
      <meshBasicMaterial />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────
// DRAG GHOST — prikazuje se kad korisnik prevlači iz kataloga
// Raycast po podu → nađi najbliži zid + xStart → render polu-prozirni box
// ─────────────────────────────────────────────────────────────
function DragGhost3D() {
  const dragSession    = useStore(s => s.dragSession)
  const dragPreview    = useStore(s => s.dragPreview)
  const setDragPreview = useStore(s => s.setDragPreview)
  const validateDragPosition = useStore(s => s.validateDragPosition)
  const room           = useStore(s => s.room)
  const { camera, gl, scene } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])

  // Globalni pointermove dok god postoji dragSession — canvas listener je
  // ograničen na dispatched pointerenter/move, a mi želimo da reagujemo čim
  // pointer uđe u canvas.
  useEffect(() => {
    if (!dragSession?.element) return
    const canvas = gl.domElement
    const el = dragSession.element
    const RW = room.width  * 0.01
    const RD = room.depth  * 0.01

    const onMove = (ev) => {
      const rect = canvas.getBoundingClientRect()
      // Pointer izvan canvas-a → ne updatuj (floating preview preuzima)
      if (ev.clientX < rect.left || ev.clientX > rect.right ||
          ev.clientY < rect.top  || ev.clientY > rect.bottom) {
        if (dragPreview) setDragPreview(null)
        return
      }
      const ndc = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1
      )
      raycaster.setFromCamera(ndc, camera)
      const hit = new THREE.Vector3()
      if (!raycaster.ray.intersectPlane(floorPlane, hit)) return

      if (el.placement === 'corner') {
        setDragPreview({ wallId: null, xStart: 0, valid: 0, isCorner: true })
        return
      }

      // Nađi najbliži zid (XZ ravan)
      const d = {
        back:  Math.abs(hit.z),
        right: Math.abs(RW - hit.x),
        front: Math.abs(RD - hit.z),
        left:  Math.abs(hit.x),
      }
      const targetWall = Object.keys(d).reduce((a, b) => (d[a] < d[b] ? a : b))
      // Project na xStart osu tog zida (cm)
      let pointerAlongCm
      switch (targetWall) {
        case 'back':  pointerAlongCm = hit.x * 100; break
        case 'right': pointerAlongCm = hit.z * 100; break
        case 'front': pointerAlongCm = (RW - hit.x) * 100; break
        case 'left':  pointerAlongCm = (RD - hit.z) * 100; break
        default: pointerAlongCm = 0
      }
      const desiredX = pointerAlongCm - el.dimensions.width / 2
      const snapped = Math.round(desiredX / 5) * 5
      const validX = validateDragPosition(el, targetWall, snapped)
      setDragPreview({
        wallId: targetWall,
        xStart: validX !== null ? validX : snapped,
        valid:  validX,
      })
    }

    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [dragSession, dragPreview, camera, gl, raycaster, floorPlane, room, setDragPreview, validateDragPosition])

  if (!dragSession?.element || !dragPreview?.wallId) return null
  const el = dragSession.element
  const xStart = dragPreview.xStart
  const { position, rotation } = getElementTransform(dragPreview.wallId, xStart, el, room)

  const W = el.dimensions.width  * 0.01
  const H = el.dimensions.height * 0.01
  const D = el.dimensions.depth  * 0.01
  const isValid = dragPreview.valid !== null
  const edgeColor = isValid ? 0x4ade80 : 0xf87171

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial
          color={el.color}
          transparent
          opacity={isValid ? 0.42 : 0.22}
          depthWrite={false}
          emissive={edgeColor}
          emissiveIntensity={0.18}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(W + 0.006, H + 0.006, D + 0.006)]} />
        <lineBasicMaterial color={edgeColor} linewidth={2} />
      </lineSegments>
      {/* Podni glow — jasniji marker */}
      <mesh position={[0, -H / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W * 1.6, D * 1.8]} />
        <meshBasicMaterial color={edgeColor} transparent opacity={isValid ? 0.18 : 0.1} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// Glavna scena
// ─────────────────────────────────────────────────────────────
export default function Scene3D() {
  const room = useStore(s => s.room)
  const dragLock = useStore(s => s.dragLock)
  const controlsRef = useRef()
  const W = room.width  * 0.01
  const D = room.depth  * 0.01
  const H = room.height * 0.01
  const { pos } = getCameraPreset('perspective', room)

  return (
    <Canvas
      shadows="soft"
      camera={{ position: pos, fov: 40, near: 0.01, far: 100 }}
      style={{ background: '#0a0a0c' }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
    >
      {/* ── Svetla ─────────────────────────────────────── */}
      <ambientLight intensity={0.35} color="#fdf8f0" />
      <directionalLight
        position={[W * 0.3, H * 2.2, D * 2]}
        intensity={1.0}
        color="#fff6e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[W * 0.8, H * 1.5, D * 1.5]} intensity={0.3} color="#e8f0ff" />
      <pointLight position={[W / 2, H * 0.9, D * 0.15]} intensity={0.4} color="#ffe8b0" distance={6} />
      <pointLight position={[-1, H * 0.7, D * 0.5]} intensity={0.15} color="#d4c8a0" />
      <pointLight position={[W + 1, H * 0.7, D * 0.5]} intensity={0.15} color="#d4c8a0" />

      {/* ── Environment ────────────────────────────────── */}
      <Environment preset="studio" />

      {/* ── Scena ──────────────────────────────────────── */}
      <Suspense fallback={null}>
        <KitchenRoom />
        <PlacedElements />
      </Suspense>

      {/* ── Senke ──────────────────────────────────────── */}
      <ContactShadows
        position={[W / 2, 0.001, D * 0.4]}
        width={W * 1.6}
        height={D * 1.3}
        far={2.5}
        blur={3}
        opacity={0.55}
        color="#000"
      />

      <DeselectPlane />
      <DragGhost3D />

      {/* ── Camera controls — EKSPLICITNO omogućen PAN ──────
           LEFT  = rotate
           MIDDLE= zoom
           RIGHT = pan
           + touch: 1 prst rotate, 2 prsta pan/zoom
           + Shift+Left-drag = pan (alternativa)                  */}
      <OrbitControls
        ref={controlsRef}
        enabled={!dragLock}
        target={[W / 2, H * 0.3, D * 0.25]}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={0.5}
        maxDistance={Math.max(W, D) * 4}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.6}
        zoomSpeed={0.9}
        panSpeed={1.2}
        enablePan={true}
        screenSpacePanning={true}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
      <CameraController controlsRef={controlsRef} />

      <fog attach="fog" args={['#0a0a0c', 14, 40]} />
    </Canvas>
  )
}
