import { create } from 'zustand'
import { ZONES, zonesYStart } from '../data/elements'

// 1 Three.js unit = 1 meter. Sve dimenzije u cm → / 100
const CM = 0.01

// ─────────────────────────────────────────────────────────────
// LocalStorage helpers za auth + projekte
// ─────────────────────────────────────────────────────────────
const LS_USER = 'unistil_user_v1'
const LS_PROJECTS_PREFIX = 'unistil_projects_v1_'

function lsUser() {
  try {
    const raw = localStorage.getItem(LS_USER)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function lsSetUser(u) {
  try { u ? localStorage.setItem(LS_USER, JSON.stringify(u)) : localStorage.removeItem(LS_USER) } catch {}
}
function projectsKey(email) {
  return LS_PROJECTS_PREFIX + (email || 'anon').toLowerCase()
}
function lsProjects(email) {
  try {
    const raw = localStorage.getItem(projectsKey(email))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
function lsSetProjects(email, list) {
  try { localStorage.setItem(projectsKey(email), JSON.stringify(list)) } catch {}
}

function newProjectId() {
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
}

// Re-export zone constants for use u komponentama
export { ZONES, ZONE_ORDER, zonesYStart } from '../data/elements'

// ─────────────────────────────────────────────────────────────
// PLOČICE — kuratirana paleta (boja poda i zidova odvojeno)
// Minimalističan izbor: 8 swatcha po svakoj kategoriji
// ─────────────────────────────────────────────────────────────
export const FLOOR_TILES = [
  { id: 'ceramic-light', name: 'Svetla keramika',  hex: '#e8e4dc' },
  { id: 'ceramic-warm',  name: 'Krem keramika',    hex: '#d9cfbc' },
  { id: 'wood-light',    name: 'Svetlo drvo',      hex: '#c4a07a' },
  { id: 'wood-dark',     name: 'Tamno drvo',       hex: '#6b4a30' },
  { id: 'concrete',      name: 'Beton',            hex: '#9a968e' },
  { id: 'stone-grey',    name: 'Kamen sivi',       hex: '#6e6c68' },
  { id: 'graphite',      name: 'Grafit',           hex: '#3a3a38' },
  { id: 'slate',         name: 'Škriljac',         hex: '#1f1f1e' },
]

export const WALL_TILES = [
  { id: 'white',         name: 'Bela',             hex: '#efece6' },
  { id: 'cream',         name: 'Krem',             hex: '#e5dcc8' },
  { id: 'ivory',         name: 'Slonovača',        hex: '#dfdad3' },
  { id: 'warm-grey',     name: 'Topla siva',       hex: '#c4bfb6' },
  { id: 'cool-grey',     name: 'Hladna siva',      hex: '#b8b8b4' },
  { id: 'mid-grey',      name: 'Srednja siva',     hex: '#8a8a86' },
  { id: 'charcoal',      name: 'Antracit',         hex: '#4a4a48' },
  { id: 'black',         name: 'Crna',             hex: '#1e1e1d' },
]

export const DEFAULT_FLOOR_COLOR = '#e8e4dc'
export const DEFAULT_WALL_COLOR  = '#dfdad3'

// ─────────────────────────────────────────────────────────────
// OBSTACLES (vrata, prozor, radiator, utičnica)
// ─────────────────────────────────────────────────────────────
export const OBSTACLE_TYPES = {
  door:     { id: 'door',     label: 'Vrata',    defaultW: 80,  defaultH: 210, defaultY: 0,   color: '#3a3a42' },
  window:   { id: 'window',   label: 'Prozor',   defaultW: 120, defaultH: 120, defaultY: 90,  color: '#7ab0e8' },
  radiator: { id: 'radiator', label: 'Radiator', defaultW: 80,  defaultH: 60,  defaultY: 15,  color: '#c8c4ba' },
  socket:   { id: 'socket',   label: 'Utičnica', defaultW: 10,  defaultH: 8,   defaultY: 25,  color: '#e0ddd6' },
}

export const WALL_META = {
  back:  { id: 'back',  label: 'Zadnji zid',   short: 'Zadnji', color: '#d4a853', accent: '#e0bc72' },
  left:  { id: 'left',  label: 'Levi zid',     short: 'Levi',   color: '#64a0ff', accent: '#8cb6ff' },
  right: { id: 'right', label: 'Desni zid',    short: 'Desni',  color: '#a064ff', accent: '#b68cff' },
  front: { id: 'front', label: 'Prednji zid',  short: 'Prednji',color: '#4adeaa', accent: '#72e5bb' },
}

export const WALL_IDS = ['back', 'right', 'front', 'left']

// Uglovi: bl = back-left, br = back-right, fr = front-right, fl = front-left
export const CORNER_META = {
  bl: { id: 'bl', label: 'Zadnji-Levi ugao',   walls: ['back', 'left']  },
  br: { id: 'br', label: 'Zadnji-Desni ugao',  walls: ['back', 'right'] },
  fr: { id: 'fr', label: 'Prednji-Desni ugao', walls: ['front', 'right']},
  fl: { id: 'fl', label: 'Prednji-Levi ugao',  walls: ['front', 'left'] },
}

// ─────────────────────────────────────────────────────────────
// Y pozicija elementa — derivisan iz zona
// ─────────────────────────────────────────────────────────────
export function elementYStart(element) {
  return zonesYStart(element.zones) // cm
}

// ─────────────────────────────────────────────────────────────
// Pronalaženje slobodnog X duž zida — po visinskoj zoni
// Dva elementa ne kolidiraju ako se ZONE NE POKLAPAJU čak i
// ako dele isti X opseg (npr. donji 60cm ispod visećeg 60cm).
// Ugaoni elementi blokiraju deo ZIDA koji zauzimaju svojim otiskom.
// ─────────────────────────────────────────────────────────────
function zonesOverlap(a, b) {
  const sa = new Set(a || []); const sb = new Set(b || [])
  for (const z of sa) if (sb.has(z)) return true
  return false
}

// Sticky snap prag (cm) — kad se moving element nalazi na <=STICKY od edge-a,
// automatski se spaja uz njega
const STICKY_CM = 10

// Ugaoni element (axis-aligned) — koji opseg [xStart, xStart+width] blokira na datom zidu
// Vraća null ako ugao ne dodiruje dati zid.
export function cornerFootprintOnWall(cornerId, wallId, cW, cD, room) {
  const RW = room.width
  const RD = room.depth
  switch (cornerId) {
    case 'bl':
      if (wallId === 'back') return { xStart: 0,           width: cW }
      if (wallId === 'left') return { xStart: RD - cD,     width: cD }
      return null
    case 'br':
      if (wallId === 'back')  return { xStart: RW - cW,    width: cW }
      if (wallId === 'right') return { xStart: 0,          width: cD }
      return null
    case 'fr':
      if (wallId === 'front') return { xStart: 0,          width: cW }
      if (wallId === 'right') return { xStart: RD - cD,    width: cD }
      return null
    case 'fl':
      if (wallId === 'front') return { xStart: RW - cW,    width: cW }
      if (wallId === 'left')  return { xStart: 0,          width: cD }
      return null
  }
  return null
}

// ─────────────────────────────────────────────────────────────
// CROSS-WALL AABB collision — svaki kabinet ima svoj world-space
// AABB u cm (x1,x2,z1,z2). Kabineti sa SUSEDNIH zidova se
// projektuju kao "phantom" blokatori na osu xStart moving-zida,
// pod uslovom da moving-element sa svojom dubinom ulazi u njihovu
// zonu u uglu.
// ─────────────────────────────────────────────────────────────

// World AABB zidnog kabineta (cm)
function cabAABB(wallId, xStart, W, D, room) {
  const RW = room.width, RD = room.depth
  switch (wallId) {
    case 'back':  return { x1: xStart,            x2: xStart + W,      z1: 0,               z2: D }
    case 'front': return { x1: RW - xStart - W,   x2: RW - xStart,     z1: RD - D,          z2: RD }
    case 'right': return { x1: RW - D,            x2: RW,              z1: xStart,          z2: xStart + W }
    case 'left':  return { x1: 0,                 x2: D,               z1: RD - xStart - W, z2: RD - xStart }
    default:      return { x1: 0, x2: 0, z1: 0, z2: 0 }
  }
}

// Axis-aligned AABB ugaonog elementa (cm)
function cornerAABB(cornerId, element, room) {
  const W = element.dimensions.width
  const D = element.dimensions.depth
  const RW = room.width, RD = room.depth
  switch (cornerId) {
    case 'bl': return { x1: 0,       x2: W,       z1: 0,       z2: D }
    case 'br': return { x1: RW - W,  x2: RW,      z1: 0,       z2: D }
    case 'fr': return { x1: RW - W,  x2: RW,      z1: RD - D,  z2: RD }
    case 'fl': return { x1: 0,       x2: W,       z1: RD - D,  z2: RD }
    default:   return { x1: 0, x2: 0, z1: 0, z2: 0 }
  }
}

function aabbOverlap(a, b) {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.z1 < b.z2 && a.z2 > b.z1
}

// Projektuj tuđi AABB u phantom blokator na MOJ zid (po xStart osi).
// myDepth = dubina moving elementa (determiniše koliko "ulazi" u ugao).
// Vraća null ako tuđi AABB ne pada u zonu koju moj element zauzima.
function phantomOnMyWall(myWallId, myDepth, otherAabb, room) {
  const RW = room.width, RD = room.depth
  let xStart, width

  switch (myWallId) {
    case 'back': {
      // moj element pokriva z ∈ [0, myDepth]; tuđi mora imati z1 < myDepth
      if (!(otherAabb.z1 < myDepth && otherAabb.z2 > 0)) return null
      xStart = otherAabb.x1
      width  = otherAabb.x2 - otherAabb.x1
      break
    }
    case 'front': {
      // moj element pokriva z ∈ [RD - myDepth, RD]; tuđi mora imati z2 > RD - myDepth
      if (!(otherAabb.z2 > RD - myDepth && otherAabb.z1 < RD)) return null
      // xStart osa front zida ide zdesna ulevo: xStart=0 ↔ X=RW, xStart=RW ↔ X=0
      xStart = RW - otherAabb.x2
      width  = otherAabb.x2 - otherAabb.x1
      break
    }
    case 'right': {
      // moj element pokriva x ∈ [RW - myDepth, RW]; tuđi mora imati x2 > RW - myDepth
      if (!(otherAabb.x2 > RW - myDepth && otherAabb.x1 < RW)) return null
      // xStart osa right zida ide od back (Z=0) ka front (Z=RD)
      xStart = otherAabb.z1
      width  = otherAabb.z2 - otherAabb.z1
      break
    }
    case 'left': {
      // moj element pokriva x ∈ [0, myDepth]; tuđi mora imati x1 < myDepth
      if (!(otherAabb.x1 < myDepth && otherAabb.x2 > 0)) return null
      // xStart osa left zida ide od front (Z=RD) ka back (Z=0): xStart=0 ↔ Z=RD
      xStart = RD - otherAabb.z2
      width  = otherAabb.z2 - otherAabb.z1
      break
    }
    default: return null
  }

  // Klampuj u granice zida — kabinet iz ugla može da "viri" van AABB-a sa druge strane
  const maxLen = (myWallId === 'back' || myWallId === 'front') ? RW : RD
  const lo = Math.max(0, xStart)
  const hi = Math.min(maxLen, xStart + width)
  if (hi <= lo) return null
  return { xStart: lo, width: hi - lo }
}

// Normalizovana lista blokatora za ZID — same-wall peers + phantoms iz
// susednih zidova + ugaoni AABB-ovi, sve u koordinati xStart datog zida.
// [{ xStart, width, uid }] — sortirano po xStart.
function wallBlockers(walls, corners, room, wallId, movingUid, movingZones, myDepth) {
  const out = []

  // 1) Peers na istom zidu
  for (const e of walls[wallId] || []) {
    if (e.uid === movingUid) continue
    if (!zonesOverlap(e.element.zones, movingZones)) continue
    out.push({ xStart: e.xStart, width: e.element.dimensions.width, uid: e.uid })
  }

  // 2) Phantoms iz susednih zidova (ako je myDepth poznat)
  if (typeof myDepth === 'number' && myDepth > 0) {
    for (const [otherWallId, cabs] of Object.entries(walls || {})) {
      if (otherWallId === wallId) continue
      for (const cab of cabs || []) {
        if (cab.uid === movingUid) continue
        if (!zonesOverlap(cab.element.zones, movingZones)) continue
        const aabb = cabAABB(
          otherWallId,
          cab.xStart,
          cab.element.dimensions.width,
          cab.element.dimensions.depth,
          room,
        )
        const p = phantomOnMyWall(wallId, myDepth, aabb, room)
        if (p) out.push({ ...p, uid: cab.uid })
      }
    }
  }

  // 3) Ugaoni elementi — unified AABB projekcija
  for (const [cId, c] of Object.entries(corners || {})) {
    if (!c) continue
    if (c.uid === movingUid) continue
    if (!zonesOverlap(c.element.zones, movingZones)) continue
    const aabb = cornerAABB(cId, c.element, room)
    // Ako moja dubina nije poznata, padaj na along-wall fp (ne zna za dubinu)
    if (typeof myDepth === 'number' && myDepth > 0) {
      const p = phantomOnMyWall(wallId, myDepth, aabb, room)
      if (p) out.push({ ...p, uid: c.uid })
    } else {
      const fp = cornerFootprintOnWall(cId, wallId, c.element.dimensions.width, c.element.dimensions.depth, room)
      if (fp) out.push({ ...fp, uid: c.uid })
    }
  }

  return out.sort((a, b) => a.xStart - b.xStart)
}

// Slobodni intervali (gde element širine W može da startuje) uz date blokatore
function freeIntervals(blockers, W, maxWidth) {
  const sorted = [...blockers].sort((a, b) => a.xStart - b.xStart)
  const intervals = []
  let cursor = 0
  for (const b of sorted) {
    if (b.xStart - cursor >= W) intervals.push([cursor, b.xStart])
    cursor = Math.max(cursor, b.xStart + b.width)
  }
  if (maxWidth - cursor >= W) intervals.push([cursor, maxWidth])
  return intervals
}

// Pronađi PRVI slobodan xStart za dodavanje novog elementa
function findFirstFree(blockers, W, maxWidth) {
  const ivs = freeIntervals(blockers, W, maxWidth)
  return ivs.length > 0 ? ivs[0][0] : null
}

// Clamp + sticky snap
//   • Uvek vraća validno xStart (bez preklapanja) ili null ako nema mesta.
//   • Ako se trenutno poravnanje nalazi u okviru STICKY_CM od ivice blokatora
//     ili zida, automatski spaja.
function clampAndSnap(blockers, W, desiredX, maxWidth, snap = STICKY_CM) {
  const ivs = freeIntervals(blockers, W, maxWidth)
  if (ivs.length === 0) return null

  // Odaberi interval — prvo onaj koji sadrži desiredX; inače najbliži
  let best = null
  let bestX = null
  let bestDist = Infinity
  for (const iv of ivs) {
    const [lo, hi] = iv
    const maxStart = hi - W
    if (desiredX >= lo && desiredX <= maxStart) {
      best = iv; bestX = desiredX; bestDist = 0
      break
    }
    const clamped = Math.max(lo, Math.min(maxStart, desiredX))
    const d = Math.abs(clamped - desiredX)
    if (d < bestDist) { best = iv; bestX = clamped; bestDist = d }
  }
  if (bestX === null) return null

  // Sticky — dopingovanje ka najbližoj ivici u tom intervalu
  const [lo, hi] = best
  const myLeft  = bestX
  const myRight = bestX + W
  const cand = []

  // Leva ivica zida (xStart=0)
  if (lo === 0 && myLeft > 0 && myLeft <= snap) {
    cand.push({ x: 0, dist: myLeft })
  }
  // Desna ivica zida (xStart = maxWidth - W)
  if (hi === maxWidth && (maxWidth - myRight) > 0 && (maxWidth - myRight) <= snap) {
    cand.push({ x: maxWidth - W, dist: maxWidth - myRight })
  }
  // Leva ivica intervala (desna strana prethodnog blokatora)
  if (lo > 0) {
    const gap = myLeft - lo
    if (gap > 0 && gap <= snap) cand.push({ x: lo, dist: gap })
  }
  // Desna ivica intervala (leva strana sledećeg blokatora)
  if (hi < maxWidth) {
    const gap = hi - myRight
    if (gap > 0 && gap <= snap) cand.push({ x: hi - W, dist: gap })
  }

  if (cand.length > 0) {
    cand.sort((a, b) => a.dist - b.dist)
    return cand[0].x
  }
  return bestX
}

// Proveri da li bi postavljanje ugaonog elementa gazilo BILO KOJI postojeći
// wall element u 3D prostoru (world AABB check — pokriva i susedne zidove).
function cornerFootprintBlocked(cornerId, cornerElement, walls, room) {
  const cAabb = cornerAABB(cornerId, cornerElement, room)
  for (const [wallId, cabs] of Object.entries(walls || {})) {
    for (const e of cabs || []) {
      if (!zonesOverlap(e.element.zones, cornerElement.zones)) continue
      const eAabb = cabAABB(
        wallId,
        e.xStart,
        e.element.dimensions.width,
        e.element.dimensions.depth,
        room,
      )
      if (aabbOverlap(cAabb, eAabb)) return true
    }
  }
  return false
}

// Dužina zida po id-u (cm)
export function wallLengthCm(wallId, room) {
  return (wallId === 'back' || wallId === 'front') ? room.width : room.depth
}

// ─────────────────────────────────────────────────────────────
// 3D transform — Y se uzima iz zones, ne iz placement-a
// ─────────────────────────────────────────────────────────────
export function getElementTransform(wallId, xStart, element, room) {
  const W  = element.dimensions.width  * CM
  const H  = element.dimensions.height * CM
  const D  = element.dimensions.depth  * CM
  const RW = room.width  * CM
  const RD = room.depth  * CM
  const t  = xStart * CM + W / 2

  const yBase = elementYStart(element) * CM
  const y = yBase + H / 2

  switch (wallId) {
    case 'back':
      return { position: [t,        y, D / 2],      rotation: [0, 0,            0] }
    case 'right':
      return { position: [RW - D/2, y, t],          rotation: [0, -Math.PI / 2, 0] }
    case 'front':
      return { position: [RW - t,   y, RD - D/2],   rotation: [0, Math.PI,      0] }
    case 'left':
      return { position: [D / 2,    y, RD - t],     rotation: [0, Math.PI / 2,  0] }
    default:
      return { position: [t, y, D / 2], rotation: [0, 0, 0] }
  }
}

// Corner transform: prost axis-aligned filler blok u uglu.
// Box je flush sa oba zida — bez rotacije. W i D obično jednaki (npr. 90×90).
// Rotacija po Y zavisi od ugla tako da "izložene" interior strane gledaju ka prostoriji.
export function getCornerTransform(cornerId, element, room) {
  const W = element.dimensions.width  * CM
  const H = element.dimensions.height * CM
  const D = element.dimensions.depth  * CM
  const RW = room.width  * CM
  const RD = room.depth  * CM
  const yBase = elementYStart(element) * CM
  const y = yBase + H / 2

  switch (cornerId) {
    case 'bl': // back-left: box od (0,0) do (W,D); flush sa back i left
      return { position: [W / 2, y, D / 2],            rotation: [0, 0, 0] }
    case 'br': // back-right: flush sa back i right
      return { position: [RW - W / 2, y, D / 2],       rotation: [0, 0, 0] }
    case 'fr': // front-right: flush sa front i right
      return { position: [RW - W / 2, y, RD - D / 2],  rotation: [0, 0, 0] }
    case 'fl': // front-left: flush sa front i left
      return { position: [W / 2, y, RD - D / 2],       rotation: [0, 0, 0] }
    default:
      return { position: [W / 2, y, D / 2], rotation: [0, 0, 0] }
  }
}

// 3D pozicija prepreke na zidu
export function getObstacleTransform(wallId, obstacle, room) {
  const W  = obstacle.width  * CM
  const H  = obstacle.height * CM
  const RW = room.width  * CM
  const RD = room.depth  * CM
  const cx = obstacle.xStart * CM + W / 2
  const cy = obstacle.yStart * CM + H / 2

  switch (wallId) {
    case 'back':
      return { position: [cx,          cy, 0.012],      rotation: [0, 0, 0] }
    case 'right':
      return { position: [RW - 0.012,  cy, cx],         rotation: [0, -Math.PI / 2, 0] }
    case 'front':
      return { position: [RW - cx,     cy, RD - 0.012], rotation: [0, Math.PI, 0] }
    case 'left':
      return { position: [0.012,       cy, RD - cx],    rotation: [0, Math.PI / 2, 0] }
    default:
      return { position: [cx, cy, 0.012], rotation: [0, 0, 0] }
  }
}

// ─────────────────────────────────────────────────────────────
// Rekompaktiraj (samo same-zone grupa)
// ─────────────────────────────────────────────────────────────
function compactSorted(list) {
  // Grupiši po zonama (canonical key = zones.sort().join('|')) pa kompaktiraj u okviru grupe
  const groups = {}
  for (const e of list) {
    const key = [...(e.element.zones || [])].sort().join('|') || '_none'
    ;(groups[key] ||= []).push(e)
  }
  const out = []
  for (const key of Object.keys(groups)) {
    let cursor = 0
    const sorted = groups[key].sort((a, b) => a.xStart - b.xStart)
    for (const e of sorted) {
      out.push({ ...e, xStart: cursor })
      cursor += e.element.dimensions.width
    }
  }
  return out
}

// ─────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────
// Inicijalni state za auth
const initialUser = lsUser()
const initialProjects = initialUser ? lsProjects(initialUser.email) : []

export const useStore = create((set, get) => ({

  // ── AUTH & PROJEKTI ────────────────────────────────────────
  user: initialUser,                          // { email, name, phone?, company? } | null
  projects: initialProjects,                  // hidrirano iz localStorage na boot-u
  currentProjectId: null,

  // ── Soba ───────────────────────────────────────────────────
  setupDone:  false,
  room: {
    width: 300, depth: 250, height: 240,
    floorColor: '#e8e4dc',
    wallColor:  '#dfdad3',
  },

  setRoom: (r) => set(state => ({
    room: {
      floorColor: state.room?.floorColor || '#e8e4dc',
      wallColor:  state.room?.wallColor  || '#dfdad3',
      ...r,
    },
  })),
  setSetupDone: (v)  => set({ setupDone: v }),
  setFloorColor: (hex) => set(state => ({ room: { ...state.room, floorColor: hex } })),
  setWallColor:  (hex) => set(state => ({ room: { ...state.room, wallColor:  hex } })),

  // ── Zidovi (4) + ugaoni (4) ─────────────────────────────
  walls:   { back: [], right: [], front: [], left: [] },
  corners: { bl: null, br: null, fr: null, fl: null },

  // ── Prepreke (4 zida) ──────────────────────────────────────
  obstacles: { back: [], right: [], front: [], left: [] },

  // ── UI state ───────────────────────────────────────────────
  activeWall:     'back',
  activeCategory: 'DONJI',
  activeZone:     'donja',           // istaknuta zona (filtrira katalog po predlog-u)
  selectedUid:    null,
  cameraPreset:   'perspective',
  viewMode:       'plan',            // 'plan' | '3d'
  sideTab:        'elements',        // 'elements' | 'obstacles'
  showZoneGuides: true,              // prikaz horizontalnih crta zona u 3D/2D
  dragLock:       false,             // TRUE dok korisnik prevlači element u 3D (OrbitControls OFF)

  // ── UNDO history (do 50 koraka) ────────────────────────────
  history: [],                       // stack snapshotova { walls, corners, obstacles }

  // ── DRAG-AND-DROP iz kataloga ──────────────────────────────
  dragSession:   null,               // { element } — element se trenutno prevlači iz panela
  dragPreview:   null,               // { wallId, xStart, valid } — gde bi element bio postavljen

  // ── Onboarding ─────────────────────────────────────────────
  //   null → auto (prikaz zavisi od LS + prazne kuhinje)
  //   true → forsiran prikaz (Help dugme)
  //   false→ forsirano skriveno (Dismiss)
  showOnboarding: null,

  setActiveWall: (w) => {
    const presetMap = { back: 'front', right: 'right', front: 'back', left: 'left' }
    set({ activeWall: w, cameraPreset: presetMap[w] || 'perspective' })
  },
  setActiveCategory: (c) => set({ activeCategory: c }),
  setActiveZone:     (z) => set({ activeZone: z }),
  setSelectedUid:    (u) => set({ selectedUid: u }),
  setCameraPreset:   (p) => set({ cameraPreset: p }),
  setViewMode:       (m) => set({ viewMode: m }),
  setSideTab:        (t) => set({ sideTab: t }),
  setShowZoneGuides: (v) => set({ showZoneGuides: v }),
  setDragLock:       (v) => set({ dragLock: v }),

  // ── UNDO ────────────────────────────────────────────────────
  // Snimi trenutno stanje elemenata/uglova/prepreka pre mutacije.
  // Kapira do 50 koraka — dalji ulazi potiskuju najstariji.
  pushHistory: () => set(state => {
    const snap = {
      walls:     JSON.parse(JSON.stringify(state.walls)),
      corners:   JSON.parse(JSON.stringify(state.corners)),
      obstacles: JSON.parse(JSON.stringify(state.obstacles)),
    }
    const next = [...state.history, snap]
    if (next.length > 50) next.shift()
    return { history: next }
  }),

  undo: () => {
    const state = get()
    if (state.history.length === 0) return false
    const last = state.history[state.history.length - 1]
    set({
      walls:     last.walls,
      corners:   last.corners,
      obstacles: last.obstacles,
      history:   state.history.slice(0, -1),
      selectedUid: null,
    })
    return true
  },

  clearHistory: () => set({ history: [] }),

  // ── DRAG-AND-DROP iz kataloga ──────────────────────────────
  startDragSession: (element) => set({ dragSession: { element }, dragPreview: null }),
  setDragPreview:   (p)       => set({ dragPreview: p }),
  endDragSession:   ()        => set({ dragSession: null, dragPreview: null }),

  // ── Onboarding visibility ──────────────────────────────────
  openOnboarding:    () => set({ showOnboarding: true }),
  dismissOnboarding: () => set({ showOnboarding: false }),

  // ── Obstacles API ──────────────────────────────────────────
  addObstacle: (wallId, type, opts = {}) => {
    const meta = OBSTACLE_TYPES[type]
    if (!meta) return null
    const { room } = get()
    const maxWidth = wallLengthCm(wallId, room)

    const width  = opts.width  ?? meta.defaultW
    const height = opts.height ?? meta.defaultH
    const yStart = opts.yStart ?? meta.defaultY
    const xStart = Math.max(0, Math.min(opts.xStart ?? Math.floor((maxWidth - width) / 2), maxWidth - width))

    get().pushHistory()
    const uid = `obs_${wallId}_${type}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
    set(state => ({
      obstacles: {
        ...state.obstacles,
        [wallId]: [...(state.obstacles[wallId] || []), { uid, type, xStart, yStart, width, height }],
      },
    }))
    return uid
  },

  removeObstacle: (uid) => {
    get().pushHistory()
    set(state => {
      const obstacles = {}
      for (const [wallId, list] of Object.entries(state.obstacles)) {
        obstacles[wallId] = list.filter(o => o.uid !== uid)
      }
      return { obstacles, selectedUid: state.selectedUid === uid ? null : state.selectedUid }
    })
  },

  updateObstacle: (uid, patch) => set(state => {
    const obstacles = {}
    for (const [wallId, list] of Object.entries(state.obstacles)) {
      obstacles[wallId] = list.map(o => o.uid === uid ? { ...o, ...patch } : o)
    }
    return { obstacles }
  }),

  clearObstacles: () => {
    get().pushHistory()
    set({ obstacles: { back: [], right: [], front: [], left: [] } })
  },

  getObstacleWall: (uid) => {
    const { obstacles } = get()
    for (const [wallId, list] of Object.entries(obstacles)) {
      if (list.find(o => o.uid === uid)) return wallId
    }
    return null
  },

  // ── Elementi API ───────────────────────────────────────────
  addElement: (element, wallId) => {
    const { walls, corners, activeWall, room } = get()

    // Ugaoni — posebno rukovanje (prvi prazan ugao čiji otisak ne gazi postojeće)
    if (element.placement === 'corner') {
      const freeCorner = Object.keys(corners).find(k =>
        !corners[k] && !cornerFootprintBlocked(k, element, walls, room)
      )
      if (!freeCorner) return false
      get().pushHistory()
      const uid = `corner_${freeCorner}_${element.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
      set({
        corners: { ...corners, [freeCorner]: { uid, element, cornerId: freeCorner } },
        selectedUid: uid,
      })
      return true
    }

    const target   = wallId || activeWall
    const maxWidth = wallLengthCm(target, room)
    const blockers = wallBlockers(walls, corners, room, target, null, element.zones, element.dimensions.depth)

    const xStart = findFirstFree(blockers, element.dimensions.width, maxWidth)
    if (xStart === null) return false

    get().pushHistory()
    const uid = `${target}_${element.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
    set(state => ({
      walls: {
        ...state.walls,
        [target]: [...(state.walls[target] || []), { uid, element, xStart }],
      },
      selectedUid: uid,
    }))
    return true
  },

  // ─────────────────────────────────────────────────────────────
  // addElementAtPosition — postavi element na specifični (wallId, desiredX)
  // sa collision snap. Koristi se za drag-and-drop commit.
  // Za corner elemente — padaj na standard addElement (prvi slobodan ugao).
  // ─────────────────────────────────────────────────────────────
  addElementAtPosition: (element, wallId, desiredX) => {
    if (element.placement === 'corner') return get().addElement(element)
    const { walls, corners, room } = get()
    const maxW = wallLengthCm(wallId, room)
    const blockers = wallBlockers(walls, corners, room, wallId, null, element.zones, element.dimensions.depth)
    const x = clampAndSnap(blockers, element.dimensions.width, desiredX, maxW)
    if (x === null) return false

    get().pushHistory()
    const uid = `${wallId}_${element.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
    set(state => ({
      walls: {
        ...state.walls,
        [wallId]: [...(state.walls[wallId] || []), { uid, element, xStart: x }],
      },
      selectedUid: uid,
      activeWall: wallId,
    }))
    return true
  },

  // Preview-only: vraća validan xStart nakon snap-a, ili null ako nema mesta.
  // Ne mutira state — koristi se tokom drag-a da renderujemo ghost u pravom
  // snap-ovanom položaju i označimo valid/invalid bez ikakvih side-efekata.
  validateDragPosition: (element, wallId, desiredX) => {
    if (element.placement === 'corner') return null
    const { walls, corners, room } = get()
    const maxW = wallLengthCm(wallId, room)
    const blockers = wallBlockers(walls, corners, room, wallId, null, element.zones, element.dimensions.depth)
    return clampAndSnap(blockers, element.dimensions.width, desiredX, maxW)
  },

  // Eksplicitno na ugao
  addCornerElement: (element, cornerId) => {
    const { corners, walls, room } = get()
    if (corners[cornerId]) return false
    if (cornerFootprintBlocked(cornerId, element, walls, room)) return false
    get().pushHistory()
    const uid = `corner_${cornerId}_${element.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
    set({
      corners: { ...corners, [cornerId]: { uid, element, cornerId } },
      selectedUid: uid,
    })
    return true
  },

  removeElement: (uid) => {
    get().pushHistory()
    set(state => {
      const walls = {}
      for (const [wallId, els] of Object.entries(state.walls)) {
        walls[wallId] = els.filter(e => e.uid !== uid)
      }
      const corners = { ...state.corners }
      for (const k of Object.keys(corners)) {
        if (corners[k]?.uid === uid) corners[k] = null
      }
      return {
        walls, corners,
        selectedUid: state.selectedUid === uid ? null : state.selectedUid,
      }
    })
  },

  // Swap susednih (levo/desno) unutar iste zone-grupe na istom zidu
  moveElement: (uid, direction) => {
    const state = get()
    // Pre-proveri da li swap uopšte ima smisla (ima suseda u tom smeru)
    let hasSwap = false
    for (const wallId of Object.keys(state.walls)) {
      const wallEls = state.walls[wallId]
      const targetEl = wallEls.find(e => e.uid === uid)
      if (!targetEl) continue
      const peers = wallEls.filter(e => zonesOverlap(e.element.zones, targetEl.element.zones))
                           .sort((a, b) => a.xStart - b.xStart)
      const idx = peers.findIndex(e => e.uid === uid)
      const swap = direction === 'left' ? idx - 1 : idx + 1
      if (swap >= 0 && swap < peers.length) hasSwap = true
      break
    }
    if (!hasSwap) return
    get().pushHistory()
    set(state => {
      const walls = { ...state.walls }
      for (const wallId of Object.keys(walls)) {
        const wallEls = walls[wallId]
        const targetEl = wallEls.find(e => e.uid === uid)
        if (!targetEl) continue

        const peers = wallEls.filter(e => zonesOverlap(e.element.zones, targetEl.element.zones))
                             .sort((a, b) => a.xStart - b.xStart)
        const idx = peers.findIndex(e => e.uid === uid)
        const swap = direction === 'left' ? idx - 1 : idx + 1
        if (swap < 0 || swap >= peers.length) return {}

        const a = peers[idx], b = peers[swap]
        peers[idx] = b; peers[swap] = a
        const others = wallEls.filter(e => !peers.find(p => p.uid === e.uid))
        let cursor = 0
        const repacked = peers.map(e => {
          const next = { ...e, xStart: cursor }
          cursor += e.element.dimensions.width
          return next
        })
        walls[wallId] = [...others, ...repacked]
        return { walls }
      }
      return {}
    })
  },

  // Eksplicitno postavi xStart (za drag u 2D i 3D) — sa COLLISION CHECK + STICKY SNAP
  // Nikad ne dozvoljava preklapanje sa zonskim susedima ni sa ugaonim otiskom.
  // Ako je trenutna pozicija unutar 10cm od suseda ili zida — automatski se spaja.
  setElementPosition: (uid, xStart) => set(state => {
    const walls = { ...state.walls }
    for (const wallId of Object.keys(walls)) {
      const target = walls[wallId].find(e => e.uid === uid)
      if (!target) continue
      const maxW = wallLengthCm(wallId, state.room)
      const blockers = wallBlockers(state.walls, state.corners, state.room, wallId, uid, target.element.zones, target.element.dimensions.depth)
      const validX = clampAndSnap(blockers, target.element.dimensions.width, xStart, maxW)
      if (validX === null) return {}                    // nema mesta, ne pomeraj
      walls[wallId] = walls[wallId].map(e =>
        e.uid === uid ? { ...e, xStart: validX } : e
      )
      break
    }
    return { walls }
  }),

  // ─────────────────────────────────────────────────────────────
  // STICKY DRAG helper: pokušaj da postaviš element na NOVI zid
  // (npr. korisnik drag-uje preko ćoška). Vraća TRUE ako je uspelo.
  // ─────────────────────────────────────────────────────────────
  dragElementToWall: (uid, newWallId, desiredX) => {
    const state = get()
    let found = null
    let prevWallId = null
    for (const [wallId, els] of Object.entries(state.walls)) {
      const m = els.find(e => e.uid === uid)
      if (m) { found = m; prevWallId = wallId; break }
    }
    if (!found) return false
    if (prevWallId === newWallId) return false

    const wallsNext = {
      ...state.walls,
      [prevWallId]: state.walls[prevWallId].filter(e => e.uid !== uid),
    }
    const maxW = wallLengthCm(newWallId, state.room)
    const blockers = wallBlockers(wallsNext, state.corners, state.room, newWallId, uid, found.element.zones, found.element.dimensions.depth)
    const validX = clampAndSnap(blockers, found.element.dimensions.width, desiredX, maxW)
    if (validX === null) return false

    wallsNext[newWallId] = [...wallsNext[newWallId], { ...found, xStart: validX }]
    set({ walls: wallsNext, activeWall: newWallId })
    return true
  },

  // Premesti na drugi zid (za drag preko ćoška)
  moveElementToWall: (uid, newWallId, xStart) => set(state => {
    let found = null
    const walls = {}
    for (const [wallId, els] of Object.entries(state.walls)) {
      if (found) { walls[wallId] = els; continue }
      const target = els.find(e => e.uid === uid)
      if (target) {
        found = target
        walls[wallId] = els.filter(e => e.uid !== uid)
      } else {
        walls[wallId] = els
      }
    }
    if (!found) return {}
    const maxW = wallLengthCm(newWallId, state.room)
    const blockers = wallBlockers(walls, state.corners, state.room, newWallId, uid, found.element.zones, found.element.dimensions.depth)
    let x
    if (typeof xStart === 'number') {
      x = clampAndSnap(blockers, found.element.dimensions.width, xStart, maxW)
      if (x === null) return { walls: state.walls }
    } else {
      x = findFirstFree(blockers, found.element.dimensions.width, maxW)
      if (x === null) return { walls: state.walls }
    }
    walls[newWallId] = [...walls[newWallId], { ...found, xStart: x }]
    return { walls, activeWall: newWallId }
  }),

  clearAll: () => {
    const state = get()
    const anyPlaced =
      Object.values(state.walls).some(arr => arr.length > 0) ||
      Object.values(state.corners).some(Boolean)
    if (!anyPlaced) return
    get().pushHistory()
    set({
      walls:   { back: [], right: [], front: [], left: [] },
      corners: { bl: null, br: null, fr: null, fl: null },
      selectedUid: null,
    })
  },

  // ── Helpers ────────────────────────────────────────────────
  getElementWall: (uid) => {
    const { walls, corners } = get()
    for (const [wallId, els] of Object.entries(walls)) {
      if (els.find(e => e.uid === uid)) return wallId
    }
    for (const [cId, c] of Object.entries(corners)) {
      if (c?.uid === uid) return `corner_${cId}`
    }
    return null
  },

  getAllPlaced: () => {
    const { walls, corners } = get()
    const fromWalls = Object.entries(walls).flatMap(([wallId, els]) =>
      els.map(e => ({ ...e, wallId, isCorner: false }))
    )
    const fromCorners = Object.entries(corners)
      .filter(([, c]) => c)
      .map(([cId, c]) => ({ ...c, wallId: `corner_${cId}`, isCorner: true, cornerId: cId }))
    return [...fromWalls, ...fromCorners]
  },

  // ── Korpa ─────────────────────────────────────────────────
  getCartItems: () => {
    const placed = get().getAllPlaced()
    const map = {}
    placed.forEach(({ element }) => {
      if (!map[element.id]) map[element.id] = {
        wcId: element.wcId, name: element.name,
        colorName: element.colorName, color: element.color,
        price: element.price, quantity: 0,
      }
      map[element.id].quantity++
    })
    return Object.values(map)
  },

  getTotalPrice: () =>
    get().getAllPlaced().reduce((s, { element }) => s + element.price, 0),

  getTotalCount: () => get().getAllPlaced().length,

  // ── WooCommerce ────────────────────────────────────────────
  wcSiteUrl: 'https://unistil.rs',

  sendToWooCart: async () => {
    const { getAllPlaced, wcSiteUrl } = get()
    const map = {}
    getAllPlaced().forEach(({ element }) => {
      map[element.wcId] = (map[element.wcId] || 0) + 1
    })
    try {
      for (const [wcId, qty] of Object.entries(map)) {
        await fetch(`${wcSiteUrl}/wp-json/wc/store/v1/cart/add-item`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: parseInt(wcId), quantity: qty }),
        })
      }
      window.location.href = `${wcSiteUrl}/checkout`
    } catch (err) {
      console.error('WooCommerce greška:', err)
      alert('Greška pri dodavanju u korpu.')
    }
  },

  // ─────────────────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────────────────
  login: (userInfo) => {
    const u = {
      email: (userInfo.email || '').trim().toLowerCase(),
      name: (userInfo.name || '').trim(),
      phone: (userInfo.phone || '').trim(),
      company: (userInfo.company || '').trim(),
      newsletter: !!userInfo.newsletter,
      loggedInAt: new Date().toISOString(),
    }
    if (!u.email || !u.name) return false
    lsSetUser(u)
    const projects = lsProjects(u.email)
    set({ user: u, projects, currentProjectId: null })
    return true
  },

  logout: () => {
    lsSetUser(null)
    set({
      user: null, projects: [], currentProjectId: null,
      setupDone: false,
      walls:   { back: [], right: [], front: [], left: [] },
      corners: { bl: null, br: null, fr: null, fl: null },
      obstacles: { back: [], right: [], front: [], left: [] },
      selectedUid: null,
    })
  },

  refreshProjects: () => {
    const { user } = get()
    if (!user) return
    set({ projects: lsProjects(user.email) })
  },

  // ─────────────────────────────────────────────────────────
  // PROJEKTI
  // ─────────────────────────────────────────────────────────
  createProject: (name) => {
    const { user } = get()
    if (!user) return null
    const project = {
      id: newProjectId(),
      name: (name || 'Novi projekat').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      room: {
        width: 300, depth: 250, height: 240,
        floorColor: '#e8e4dc',
        wallColor:  '#dfdad3',
      },
      walls:   { back: [], right: [], front: [], left: [] },
      corners: { bl: null, br: null, fr: null, fl: null },
      obstacles: { back: [], right: [], front: [], left: [] },
    }
    const projects = [project, ...lsProjects(user.email)]
    lsSetProjects(user.email, projects)
    set({
      projects,
      currentProjectId: project.id,
      setupDone: false,                  // nov projekat ide na SetupScreen
      room: project.room,
      walls: project.walls,
      corners: project.corners,
      obstacles: project.obstacles,
      selectedUid: null,
      history: [],
      dragSession: null,
      dragPreview: null,
    })
    return project.id
  },

  openProject: (id) => {
    const { user } = get()
    if (!user) return false
    const projects = lsProjects(user.email)
    const p = projects.find(x => x.id === id)
    if (!p) return false
    set({
      currentProjectId: p.id,
      setupDone: true,                   // postojeći projekat ide direktno u planner
      room: {
        width:  p.room?.width  ?? 300,
        depth:  p.room?.depth  ?? 250,
        height: p.room?.height ?? 240,
        floorColor: p.room?.floorColor || '#e8e4dc',
        wallColor:  p.room?.wallColor  || '#dfdad3',
      },
      walls: p.walls || { back: [], right: [], front: [], left: [] },
      corners: p.corners || { bl: null, br: null, fr: null, fl: null },
      obstacles: p.obstacles || { back: [], right: [], front: [], left: [] },
      selectedUid: null,
      history: [],
      dragSession: null,
      dragPreview: null,
    })
    return true
  },

  saveCurrentProject: () => {
    const { user, currentProjectId, room, walls, corners, obstacles } = get()
    if (!user || !currentProjectId) return false
    const projects = lsProjects(user.email)
    const idx = projects.findIndex(p => p.id === currentProjectId)
    if (idx < 0) return false
    projects[idx] = {
      ...projects[idx],
      updatedAt: new Date().toISOString(),
      room, walls, corners, obstacles,
    }
    lsSetProjects(user.email, projects)
    set({ projects })
    return true
  },

  renameProject: (id, newName) => {
    const { user } = get()
    if (!user) return false
    const projects = lsProjects(user.email)
    const idx = projects.findIndex(p => p.id === id)
    if (idx < 0) return false
    projects[idx] = { ...projects[idx], name: newName.trim() || projects[idx].name, updatedAt: new Date().toISOString() }
    lsSetProjects(user.email, projects)
    set({ projects })
    return true
  },

  deleteProject: (id) => {
    const { user, currentProjectId } = get()
    if (!user) return false
    const projects = lsProjects(user.email).filter(p => p.id !== id)
    lsSetProjects(user.email, projects)
    set({
      projects,
      ...(currentProjectId === id ? {
        currentProjectId: null,
        setupDone: false,
        walls:   { back: [], right: [], front: [], left: [] },
        corners: { bl: null, br: null, fr: null, fl: null },
        obstacles: { back: [], right: [], front: [], left: [] },
      } : {}),
    })
    return true
  },

  exitProject: () => {
    // vraća korisnika na ProjectsScreen — zadrži projekte i user
    set({
      currentProjectId: null,
      setupDone: false,
      selectedUid: null,
      history: [],
      dragSession: null,
      dragPreview: null,
    })
  },
}))
