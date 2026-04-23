// ═══════════════════════════════════════════════════════════════
// UNISTIL — Katalog elemenata (B2B kuhinjski planer)
// Dimenzije: cm (W × H × D). ID se poklapa s WooCommerce wcId.
//
// ZONE SISTEM
// ───────────
// Svaka kuhinja je podeljena po visini na 4 zone:
//   donja    (0–90 cm)    — stojeći ormari, mašine, VP frižideri
//   mid      (85–140 cm)  — radna površ, usekne sudopere/ploče, backsplash
//   visi     (140–215 cm) — standardni viseći ormari
//   najvisi  (215–ceiling) — gornji "bulkhead" viseći, dekor
//
// Element ima `zones: [...]` — koje sve zone zauzima (1 ili više).
// Prvi element niza je "mount zone": Y pozicija = ZONES[zones[0]].yStart.
// Visina elementa je dimensions.height (ne mora da ispuni ceo range zone).
//
// Tipovi mesta (`placement`) — hint za render/interakcije:
//   floor      — stoji na podu (donja)
//   countertop — usekne se u radnu površ (mid; npr. indukciona ploča, sudopera)
//   wall       — viseći na zidu (visi / najvisi)
//   tall       — kolona od poda do blizu plafona (donja + mid + visi)
//   corner     — ugaoni element (spaja 2 zida)
// ═══════════════════════════════════════════════════════════════

export const ZONES = {
  donja: {
    id: 'donja', label: 'Donja zona', short: 'D',
    yStart: 0, yEnd: 90,
    color: '#d67b55', accent: '#ed9072',
    hint: 'Stojeći ormari, frižideri, mašine',
  },
  mid: {
    id: 'mid', label: 'Radna zona', short: 'M',
    yStart: 85, yEnd: 140,
    color: '#d4a853', accent: '#e6c077',
    hint: 'Radna ploča, ugradne ploče, sudopere',
  },
  visi: {
    id: 'visi', label: 'Viseća zona', short: 'V',
    yStart: 140, yEnd: 215,
    color: '#5ca685', accent: '#7ec2a0',
    hint: 'Standardni viseći ormari',
  },
  najvisi: {
    id: 'najvisi', label: 'Gornja zona', short: 'G',
    yStart: 215, yEnd: 240,
    color: '#6482b8', accent: '#8aa3cf',
    hint: 'Gornji viseći, dekor, skrivanje ventilacije',
  },
}

export const ZONE_ORDER = ['donja', 'mid', 'visi', 'najvisi']

// Dohvati yStart za zadati skup zona (uzima najnižu)
export function zonesYStart(zoneIds) {
  if (!zoneIds || zoneIds.length === 0) return 0
  let min = Infinity
  for (const id of zoneIds) {
    const z = ZONES[id]
    if (z && z.yStart < min) min = z.yStart
  }
  return min === Infinity ? 0 : min
}

// Kategorije — grupisanje u paleti
// Terminologija usklađena sa Forma Ideale / IKEA Srbija / Emmezeta standardom.
export const CATEGORIES = {
  DONJI:    { id: 'DONJI',    label: 'Donji elementi',      zone: 'donja'   },
  RADNA:    { id: 'RADNA',    label: 'Radna ploča',         zone: 'mid'     },
  VISECI:   { id: 'VISECI',   label: 'Viseći elementi',     zone: 'visi'    },
  VISOKI:   { id: 'VISOKI',   label: 'Visoki elementi',     zone: 'donja'   },  // spans donja+mid+visi
  UGAONI:   { id: 'UGAONI',   label: 'Ugaoni elementi',     zone: 'donja'   },
  UGRADNI:  { id: 'UGRADNI',  label: 'Ugradni uređaji',     zone: 'mid'     },
  APARATI:  { id: 'APARATI',  label: 'Samostojeći uređaji', zone: 'donja'   },
}

// Boja → hex mapa
export const COLORS = {
  bela:       { name: 'Bela',        hex: '#F5F5F0' },
  crna:       { name: 'Crna',        hex: '#1C1C1C' },
  siva:       { name: 'Siva',        hex: '#8A8A8A' },
  antracit:   { name: 'Antracit',    hex: '#3D3D3D' },
  tamnoSiva:  { name: 'Tamno siva',  hex: '#555555' },
  svetloSiva: { name: 'Svetlo siva', hex: '#C5C5C5' },
  hrast:      { name: 'Hrast',       hex: '#B8864E' },
  orah:       { name: 'Orah',        hex: '#6B4423' },
  inox:       { name: 'Inox',        hex: '#C0C0C0' },
}

// Helper: napravi element preseka (DRY za varijante po boji)
const mk = (base, overrides) => ({ ...base, ...overrides })

// ═══════════════════════════════════════════════════════════════
// KATALOG
// ═══════════════════════════════════════════════════════════════
export const elements = [

  // ─── DONJI ELEMENTI — zone: donja ───────────────────────────
  {
    id: 1001, wcId: 1001, name: 'Donji 60', category: 'DONJI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 60, height: 85, depth: 60 },
    price: 18990, placement: 'floor', zones: ['donja'],
    description: '2 police, mekan zatvarač',
  },
  { id: 1002, wcId: 1002, name: 'Donji 60', category: 'DONJI',
    color: COLORS.crna.hex, colorName: 'Crna',
    dimensions: { width: 60, height: 85, depth: 60 },
    price: 18990, placement: 'floor', zones: ['donja'],
    description: '2 police, mekan zatvarač',
  },
  { id: 1003, wcId: 1003, name: 'Donji 60', category: 'DONJI',
    color: COLORS.antracit.hex, colorName: 'Antracit',
    dimensions: { width: 60, height: 85, depth: 60 },
    price: 18990, placement: 'floor', zones: ['donja'],
    description: '2 police, mekan zatvarač',
  },
  { id: 1004, wcId: 1004, name: 'Donji 45', category: 'DONJI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 45, height: 85, depth: 60 },
    price: 15990, placement: 'floor', zones: ['donja'],
    description: '1 polica, mekan zatvarač',
  },
  { id: 1005, wcId: 1005, name: 'Donji 45', category: 'DONJI',
    color: COLORS.crna.hex, colorName: 'Crna',
    dimensions: { width: 45, height: 85, depth: 60 },
    price: 15990, placement: 'floor', zones: ['donja'],
    description: '1 polica, mekan zatvarač',
  },
  { id: 1006, wcId: 1006, name: 'Donji 30', category: 'DONJI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 30, height: 85, depth: 60 },
    price: 11990, placement: 'floor', zones: ['donja'],
    description: '1 polica, uzan, mekan zatvarač',
  },
  { id: 1007, wcId: 1007, name: 'Fioke 60', category: 'DONJI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 60, height: 85, depth: 60 },
    price: 22990, placement: 'floor', zones: ['donja'],
    description: '3 fioke, BLUM mekan zatvarač',
  },
  { id: 1008, wcId: 1008, name: 'Fioke 60', category: 'DONJI',
    color: COLORS.hrast.hex, colorName: 'Hrast',
    dimensions: { width: 60, height: 85, depth: 60 },
    price: 22990, placement: 'floor', zones: ['donja'],
    description: '3 fioke, BLUM mekan zatvarač',
  },
  { id: 1009, wcId: 1009, name: 'Fioke 90', category: 'DONJI',
    color: COLORS.antracit.hex, colorName: 'Antracit',
    dimensions: { width: 90, height: 85, depth: 60 },
    price: 32990, placement: 'floor', zones: ['donja'],
    description: '4 fioke, BLUM soft-close',
  },

  // ─── RADNA POVRŠ (sudopera se upušta) — zone: donja+mid ─────
  { id: 1101, wcId: 1101, name: 'Sudopera 80', category: 'RADNA',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 80, height: 85, depth: 60 },
    price: 24990, placement: 'floor', zones: ['donja', 'mid'],
    description: 'Inox kada, sifon uključen, usečena u radnu ploču',
  },
  { id: 1102, wcId: 1102, name: 'Sudopera 90', category: 'RADNA',
    color: COLORS.antracit.hex, colorName: 'Antracit',
    dimensions: { width: 90, height: 85, depth: 60 },
    price: 28990, placement: 'floor', zones: ['donja', 'mid'],
    description: 'Dvodelna inox kada, sifon, odcediš',
  },

  // ─── UGAONI — zone: donja ───────────────────────────────────
  { id: 1201, wcId: 1201, name: 'Ugaoni 90', category: 'UGAONI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 90, height: 85, depth: 60 },
    price: 28990, placement: 'corner', zones: ['donja'],
    description: 'Ugaoni filler blok (90 × 60), dubina kao donji elementi',
  },
  { id: 1202, wcId: 1202, name: 'Ugaoni 90', category: 'UGAONI',
    color: COLORS.antracit.hex, colorName: 'Antracit',
    dimensions: { width: 90, height: 85, depth: 60 },
    price: 28990, placement: 'corner', zones: ['donja'],
    description: 'Ugaoni filler blok (90 × 60), dubina kao donji elementi',
  },
  { id: 1203, wcId: 1203, name: 'Ugaoni viseći 60', category: 'UGAONI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 60, height: 72, depth: 35 },
    price: 19990, placement: 'corner', zones: ['visi'],
    description: 'Ugaoni viseći filler (60 × 35), dubina kao viseći elementi',
  },

  // ─── VISEĆI — zone: visi ─────────────────────────────────────
  { id: 2001, wcId: 2001, name: 'Viseći 60', category: 'VISECI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 60, height: 72, depth: 35 },
    price: 14990, placement: 'wall', zones: ['visi'],
    description: '2 police, mekan zatvarač',
  },
  { id: 2002, wcId: 2002, name: 'Viseći 60', category: 'VISECI',
    color: COLORS.crna.hex, colorName: 'Crna',
    dimensions: { width: 60, height: 72, depth: 35 },
    price: 14990, placement: 'wall', zones: ['visi'],
    description: '2 police, mekan zatvarač',
  },
  { id: 2003, wcId: 2003, name: 'Viseći 60', category: 'VISECI',
    color: COLORS.antracit.hex, colorName: 'Antracit',
    dimensions: { width: 60, height: 72, depth: 35 },
    price: 14990, placement: 'wall', zones: ['visi'],
    description: '2 police, mekan zatvarač',
  },
  { id: 2004, wcId: 2004, name: 'Viseći 45', category: 'VISECI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 45, height: 72, depth: 35 },
    price: 11990, placement: 'wall', zones: ['visi'],
    description: '2 police',
  },
  { id: 2005, wcId: 2005, name: 'Viseći 45', category: 'VISECI',
    color: COLORS.hrast.hex, colorName: 'Hrast',
    dimensions: { width: 45, height: 72, depth: 35 },
    price: 13990, placement: 'wall', zones: ['visi'],
    description: '2 police',
  },
  { id: 2006, wcId: 2006, name: 'Viseći 30', category: 'VISECI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 30, height: 72, depth: 35 },
    price: 9990, placement: 'wall', zones: ['visi'],
    description: '1 polica, uzan',
  },
  { id: 2007, wcId: 2007, name: 'Viseći staklo 60', category: 'VISECI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 60, height: 72, depth: 35 },
    price: 18990, placement: 'wall', zones: ['visi'],
    description: 'Staklena vrata, LED osvetljenje',
  },
  // ── Ekstra visoki viseći → zone: visi + najvisi ──
  { id: 2101, wcId: 2101, name: 'Viseći XL 60', category: 'VISECI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 60, height: 96, depth: 35 },
    price: 17990, placement: 'wall', zones: ['visi', 'najvisi'],
    description: 'Duboki viseći 96cm, ulazi u gornju zonu',
  },
  { id: 2102, wcId: 2102, name: 'Viseći XL 60', category: 'VISECI',
    color: COLORS.antracit.hex, colorName: 'Antracit',
    dimensions: { width: 60, height: 96, depth: 35 },
    price: 17990, placement: 'wall', zones: ['visi', 'najvisi'],
    description: 'Duboki viseći 96cm, ulazi u gornju zonu',
  },

  // ─── VISOKI ELEMENTI (kolone) — zone: donja+mid+visi ────────
  { id: 3001, wcId: 3001, name: 'Visoki ostava 60', category: 'VISOKI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 60, height: 216, depth: 60 },
    price: 38990, placement: 'tall', zones: ['donja', 'mid', 'visi'],
    description: 'Od poda do plafona, 6 polica',
  },
  { id: 3002, wcId: 3002, name: 'Visoki za rernu 60', category: 'VISOKI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 60, height: 216, depth: 60 },
    price: 42990, placement: 'tall', zones: ['donja', 'mid', 'visi'],
    description: 'Prostor za ugradnu rernu u sredini',
  },
  { id: 3003, wcId: 3003, name: 'Visoki za frižider 60', category: 'VISOKI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 60, height: 216, depth: 60 },
    price: 29990, placement: 'tall', zones: ['donja', 'mid', 'visi'],
    description: 'Niša za ugradni frižider',
  },
  { id: 3004, wcId: 3004, name: 'Visoki puni 60', category: 'VISOKI',
    color: COLORS.antracit.hex, colorName: 'Antracit',
    dimensions: { width: 60, height: 240, depth: 60 },
    price: 46990, placement: 'tall', zones: ['donja', 'mid', 'visi', 'najvisi'],
    description: 'Do plafona (240cm) — ceo paket zona',
  },

  // ─── UGRADNI UREĐAJI ─────────────────────────────────────────
  { id: 4001, wcId: 4001, name: 'Ugradna rerna', category: 'UGRADNI',
    color: COLORS.inox.hex, colorName: 'Inox',
    dimensions: { width: 60, height: 60, depth: 55 },
    price: 54990, placement: 'floor', zones: ['donja'],
    description: 'Multifunkcijska, pirolitička',
  },
  { id: 4002, wcId: 4002, name: 'Ugradna rerna', category: 'UGRADNI',
    color: COLORS.crna.hex, colorName: 'Crna',
    dimensions: { width: 60, height: 60, depth: 55 },
    price: 54990, placement: 'floor', zones: ['donja'],
    description: 'Multifunkcijska, pirolitička',
  },
  { id: 4003, wcId: 4003, name: 'Indukciona ploča 60', category: 'UGRADNI',
    color: COLORS.crna.hex, colorName: 'Crna',
    dimensions: { width: 60, height: 5, depth: 52 },
    price: 44990, placement: 'countertop', zones: ['mid'],
    description: '4 zone, touch, boost',
  },
  { id: 4004, wcId: 4004, name: 'Indukciona ploča 90', category: 'UGRADNI',
    color: COLORS.crna.hex, colorName: 'Crna',
    dimensions: { width: 90, height: 5, depth: 52 },
    price: 64990, placement: 'countertop', zones: ['mid'],
    description: '5 zona, FlexiInduction',
  },
  { id: 4005, wcId: 4005, name: 'Aspirator zidni 60', category: 'UGRADNI',
    color: COLORS.inox.hex, colorName: 'Inox',
    dimensions: { width: 60, height: 90, depth: 50 },
    price: 34990, placement: 'wall', zones: ['visi'],
    description: 'Max 750m³/h, LED, touch',
  },
  { id: 4006, wcId: 4006, name: 'Aspirator zidni 90', category: 'UGRADNI',
    color: COLORS.inox.hex, colorName: 'Inox',
    dimensions: { width: 90, height: 90, depth: 50 },
    price: 44990, placement: 'wall', zones: ['visi'],
    description: 'Max 1100m³/h, LED, touch',
  },
  { id: 4007, wcId: 4007, name: 'Sudo mašina 60', category: 'UGRADNI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 60, height: 82, depth: 55 },
    price: 49990, placement: 'floor', zones: ['donja'],
    description: 'A+++, 14 kompleta',
  },

  // ─── APARATI (SAMOSTOJEĆI) ───────────────────────────────────
  { id: 5001, wcId: 5001, name: 'Frižider side-by-side', category: 'APARATI',
    color: COLORS.inox.hex, colorName: 'Inox',
    dimensions: { width: 90, height: 180, depth: 70 },
    price: 129990, placement: 'floor', zones: ['donja', 'mid', 'visi'],
    description: 'French door, 480L, NoFrost, A++',
  },
  { id: 5002, wcId: 5002, name: 'Frižider visoki', category: 'APARATI',
    color: COLORS.inox.hex, colorName: 'Inox',
    dimensions: { width: 60, height: 200, depth: 65 },
    price: 89990, placement: 'floor', zones: ['donja', 'mid', 'visi'],
    description: 'Full size 200cm, 350L',
  },
  { id: 5003, wcId: 5003, name: 'Frižider srednji', category: 'APARATI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 60, height: 185, depth: 65 },
    price: 69990, placement: 'floor', zones: ['donja', 'mid', 'visi'],
    description: 'NoFrost, 320L, A++',
  },
  { id: 5004, wcId: 5004, name: 'Mini frižider pult', category: 'APARATI',
    color: COLORS.bela.hex, colorName: 'Bela',
    dimensions: { width: 55, height: 82, depth: 58 },
    price: 34990, placement: 'floor', zones: ['donja'],
    description: 'Pod-pultni, 120L',
  },
]

// Helpers
export const getElementById = (id) => elements.find(e => e.id === id)
export const getElementsByCategory = (c) => elements.filter(e => e.category === c)
export const getElementsByZone = (z) => elements.filter(e => e.zones?.includes(z))
