import * as THREE from 'three'
import { useStore, getObstacleTransform, OBSTACLE_TYPES, WALL_META, ZONES, ZONE_ORDER } from '../store/useStore'

// ─────────────────────────────────────────────────────────────
// Hex shade helper — osvetli/zatamni hex za `amt` (-1..1)
// Koristi se za derivisane tonove (bočni zid, linije poda)
// ─────────────────────────────────────────────────────────────
function shade(hex, amt) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const adj = (c) => {
    const v = amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)
    return Math.max(0, Math.min(255, Math.round(v)))
  }
  const toHex = (n) => n.toString(16).padStart(2, '0')
  return `#${toHex(adj(r))}${toHex(adj(g))}${toHex(adj(b))}`
}

// ─────────────────────────────────────────────────────────────
// 3D soba + zone guides (suptilne horizontalne linije)
// ─────────────────────────────────────────────────────────────
export default function KitchenRoom() {
  const room           = useStore(s => s.room)
  const obstacles      = useStore(s => s.obstacles)
  const cameraPreset   = useStore(s => s.cameraPreset)
  const showZoneGuides = useStore(s => s.showZoneGuides)
  const activeZone     = useStore(s => s.activeZone)

  const W = room.width  * 0.01
  const D = room.depth  * 0.01
  const H = room.height * 0.01

  const floorColor = room.floorColor || '#e8e4dc'
  const wallColor  = room.wallColor  || '#dfdad3'

  // Derivisano — sekundarna (malo tamnija) nijansa za boc zid,
  // tanka kontura poda (obim) i pod-fill: varijacije istog tona
  const wallSide = shade(wallColor, -0.04)
  const floorTile = floorColor
  const floorGridDark  = shade(floorColor, -0.45)
  const floorGridLight = shade(floorColor, -0.3)

  const showFrontWall = cameraPreset === 'back' || cameraPreset === 'top'

  return (
    <group>

      {/* ═══ POD ══════════════════════════════════════════ */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[W/2, 0, D/2]} receiveShadow>
        <planeGeometry args={[W * 2.8, D * 2.8]} />
        <meshStandardMaterial color={floorTile} roughness={0.55} metalness={0.05} envMapIntensity={0.6} />
      </mesh>

      <gridHelper
        args={[Math.max(W,D)*4, Math.max(W,D)*4*10, floorGridLight, floorGridDark]}
        position={[W/2, 0.001, D/2]}
      />

      {/* ═══ ZIDOVI ═══════════════════════════════════════ */}
      <mesh position={[W/2, H/2, 0]} receiveShadow>
        <planeGeometry args={[W + 0.6, H + 0.3]} />
        <meshStandardMaterial color={wallColor} roughness={0.88} metalness={0} envMapIntensity={0.05} />
      </mesh>

      <mesh rotation={[0, Math.PI/2, 0]} position={[0, H/2, D/2]} receiveShadow>
        <planeGeometry args={[D + 0.4, H + 0.3]} />
        <meshStandardMaterial color={wallSide} roughness={0.9} metalness={0} />
      </mesh>

      <mesh rotation={[0, -Math.PI/2, 0]} position={[W, H/2, D/2]} receiveShadow>
        <planeGeometry args={[D + 0.4, H + 0.3]} />
        <meshStandardMaterial color={wallSide} roughness={0.9} metalness={0} />
      </mesh>

      {showFrontWall && (
        <mesh rotation={[0, Math.PI, 0]} position={[W/2, H/2, D]} receiveShadow>
          <planeGeometry args={[W + 0.6, H + 0.3]} />
          <meshStandardMaterial color={wallSide} roughness={0.9} metalness={0} />
        </mesh>
      )}

      {/* ═══ PLAFON ═══════════════════════════════════════ */}
      <mesh rotation={[Math.PI/2, 0, 0]} position={[W/2, H, D/2]}>
        <planeGeometry args={[W + 0.6, D + 0.4]} />
        <meshStandardMaterial color="#f0ece8" roughness={1} transparent opacity={0.12} />
      </mesh>

      {/* ═══ ARHITEKTONSKE LAJSNE ═════════════════════════ */}
      <mesh position={[W/2, 0.04, 0.04]}>
        <boxGeometry args={[W, 0.08, 0.04]} />
        <meshStandardMaterial color="#0d0b09" roughness={0.5} metalness={0.15} />
      </mesh>
      <mesh position={[W/2, H - 0.025, 0.02]}>
        <boxGeometry args={[W, 0.04, 0.025]} />
        <meshStandardMaterial color="#ccc6bc" roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[0.04, 0.04, D/2]}>
        <boxGeometry args={[0.04, 0.08, D]} />
        <meshStandardMaterial color="#0d0b09" roughness={0.5} metalness={0.15} />
      </mesh>
      <mesh position={[W - 0.04, 0.04, D/2]}>
        <boxGeometry args={[0.04, 0.08, D]} />
        <meshStandardMaterial color="#0d0b09" roughness={0.5} metalness={0.15} />
      </mesh>
      <mesh position={[W/2, 0.04, D - 0.04]}>
        <boxGeometry args={[W, 0.08, 0.04]} />
        <meshStandardMaterial color="#0d0b09" roughness={0.5} metalness={0.15} />
      </mesh>

      {/* ═══ ZONE GUIDES — suptilne horizontalne crte na zidovima ═══ */}
      {showZoneGuides && ZONE_ORDER.map(zId => {
        const z = ZONES[zId]
        const y = z.yStart * 0.01
        const isActive = activeZone === zId
        const opacity = isActive ? 0.8 : 0.22
        return (
          <group key={zId}>
            {/* Back wall line */}
            <mesh position={[W/2, y, 0.02]}>
              <boxGeometry args={[W, 0.003, 0.002]} />
              <meshBasicMaterial color={z.color} transparent opacity={opacity} />
            </mesh>
            {/* Left wall line */}
            <mesh rotation={[0, Math.PI/2, 0]} position={[0.02, y, D/2]}>
              <boxGeometry args={[D, 0.003, 0.002]} />
              <meshBasicMaterial color={z.color} transparent opacity={opacity} />
            </mesh>
            {/* Right wall line */}
            <mesh rotation={[0, -Math.PI/2, 0]} position={[W - 0.02, y, D/2]}>
              <boxGeometry args={[D, 0.003, 0.002]} />
              <meshBasicMaterial color={z.color} transparent opacity={opacity} />
            </mesh>
          </group>
        )
      })}

      {/* ═══ PREPREKE ═════════════════════════════════════ */}
      {Object.entries(obstacles).flatMap(([wallId, list]) =>
        list.map(o => <Obstacle key={o.uid} wallId={wallId} obstacle={o} room={room} />)
      )}

      {/* ═══ AKTIVAN ZID highlight ════════════════════════ */}
      <ActiveWallIndicator />

    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// Obstacle
// ─────────────────────────────────────────────────────────────
function Obstacle({ wallId, obstacle, room }) {
  const { type, width, height } = obstacle
  const meta = OBSTACLE_TYPES[type]
  const { position, rotation } = getObstacleTransform(wallId, obstacle, room)
  const W = width  * 0.01
  const H = height * 0.01

  if (type === 'door') {
    return (
      <group position={position} rotation={rotation}>
        <mesh>
          <planeGeometry args={[W, H]} />
          <meshStandardMaterial color={meta.color} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(W, H)]} />
          <lineBasicMaterial color="#0a0a0c" />
        </lineSegments>
        <mesh position={[W / 2 - 0.08, 0, 0.005]}>
          <sphereGeometry args={[0.013, 16, 10]} />
          <meshStandardMaterial color="#c6c6c6" metalness={0.85} roughness={0.18} envMapIntensity={1.2} />
        </mesh>
      </group>
    )
  }

  if (type === 'window') {
    return (
      <group position={position} rotation={rotation}>
        <mesh>
          <planeGeometry args={[W, H]} />
          <meshStandardMaterial
            color={meta.color}
            transparent opacity={0.42}
            roughness={0.08} metalness={0.25}
            emissive={meta.color} emissiveIntensity={0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(W, H)]} />
          <lineBasicMaterial color="#3a3a3a" />
        </lineSegments>
        <mesh position={[0, 0, 0.003]}>
          <boxGeometry args={[W, 0.028, 0.012]} />
          <meshStandardMaterial color="#eee8e0" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.003]}>
          <boxGeometry args={[0.028, H, 0.012]} />
          <meshStandardMaterial color="#eee8e0" roughness={0.7} />
        </mesh>
      </group>
    )
  }

  if (type === 'radiator') {
    return (
      <group position={position} rotation={rotation}>
        <mesh>
          <boxGeometry args={[W, H, 0.06]} />
          <meshStandardMaterial color="#e8e4dc" roughness={0.38} metalness={0.25} />
        </mesh>
        {Array.from({ length: Math.floor(width / 8) }).map((_, i) => (
          <mesh key={i} position={[-W / 2 + 0.04 + i * 0.08, 0, 0.035]}>
            <boxGeometry args={[0.004, H * 0.9, 0.015]} />
            <meshStandardMaterial color="#aaa7a0" />
          </mesh>
        ))}
      </group>
    )
  }

  // socket
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[W, H, 0.015]} />
        <meshStandardMaterial color={meta.color} roughness={0.4} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// Highlight aktivnog zida
// ─────────────────────────────────────────────────────────────
function ActiveWallIndicator() {
  const activeWall = useStore(s => s.activeWall)
  const room       = useStore(s => s.room)
  const W = room.width  * 0.01
  const D = room.depth  * 0.01
  const H = room.height * 0.01

  const color = WALL_META[activeWall]?.color || '#ffffff'
  const opacity = 0.075

  return (
    <>
      {activeWall === 'back' && (
        <mesh position={[W/2, H/2, 0.005]}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
        </mesh>
      )}
      {activeWall === 'left' && (
        <mesh rotation={[0, Math.PI/2, 0]} position={[0.005, H/2, D/2]}>
          <planeGeometry args={[D, H]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
        </mesh>
      )}
      {activeWall === 'right' && (
        <mesh rotation={[0, -Math.PI/2, 0]} position={[W - 0.005, H/2, D/2]}>
          <planeGeometry args={[D, H]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
        </mesh>
      )}
      {activeWall === 'front' && (
        <mesh rotation={[0, Math.PI, 0]} position={[W/2, H/2, D - 0.005]}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  )
}
