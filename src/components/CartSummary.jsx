import { Trash2, ShoppingBag, ChevronRight, ChevronLeft, X } from 'lucide-react'
import { useStore, WALL_META, ZONES, CORNER_META } from '../store/useStore'
import Tooltip from './Tooltip'

export default function CartSummary() {
  const selectedUid    = useStore(s => s.selectedUid)
  const removeElement  = useStore(s => s.removeElement)
  const moveElement    = useStore(s => s.moveElement)
  const clearAll       = useStore(s => s.clearAll)
  const sendToWooCart  = useStore(s => s.sendToWooCart)
  const getCartItems   = useStore(s => s.getCartItems)
  const getTotalPrice  = useStore(s => s.getTotalPrice)
  const getAllPlaced   = useStore(s => s.getAllPlaced)
  const getElementWall = useStore(s => s.getElementWall)
  const room           = useStore(s => s.room)
  const walls          = useStore(s => s.walls)
  const corners        = useStore(s => s.corners)

  const cartItems  = getCartItems()
  const total      = getTotalPrice()
  const allPlaced  = getAllPlaced()

  // Popunjenost po zidovima — samo donja zona (floor)
  const wallFill = (wallId, maxW) => {
    const floorUsed = (walls[wallId] || [])
      .filter(e => e.element.zones?.includes('donja'))
      .reduce((s, e) => s + e.element.dimensions.width, 0)
    return { used: floorUsed, pct: Math.min((floorUsed / maxW) * 100, 100), full: floorUsed >= maxW }
  }

  const wallBars = [
    { id: 'back',  label: WALL_META.back.label,  data: wallFill('back',  room.width), max: room.width  },
    { id: 'right', label: WALL_META.right.label, data: wallFill('right', room.depth), max: room.depth  },
    { id: 'front', label: WALL_META.front.label, data: wallFill('front', room.width), max: room.width  },
    { id: 'left',  label: WALL_META.left.label,  data: wallFill('left',  room.depth), max: room.depth  },
  ]

  const cornerCount = Object.values(corners).filter(Boolean).length

  const selectedEl   = allPlaced.find(p => p.uid === selectedUid)
  const selectedLoc  = selectedUid ? getElementWall(selectedUid) : null
  const isCornerSel  = selectedEl?.isCorner
  const cornerMeta   = isCornerSel ? CORNER_META[selectedEl.cornerId] : null

  const WALL_LABELS = {
    back:  WALL_META.back.label,
    left:  WALL_META.left.label,
    right: WALL_META.right.label,
    front: WALL_META.front.label,
  }

  return (
    <div className="flex flex-col h-full"
         style={{ width: 320, background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)' }}>

      {/* Header */}
      <div className="flex items-center justify-between"
           style={{ padding: '18px 18px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)' }}>
          Vaša kuhinja
        </span>
        <span className="num" style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>
          {allPlaced.length} {allPlaced.length === 1 ? 'element' : 'elemenata'}
        </span>
      </div>

      {/* Popunjenost zidova */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Popunjenost zidova (donji red)
        </p>
        {wallBars.map(w => (
          <div key={w.id} style={{ marginBottom: 12 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 5 }}>
              <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>{w.label}</span>
              <span className="num" style={{ fontSize: 12, color: w.data.full ? 'var(--brand)' : 'var(--text-3)', fontWeight: 500 }}>
                {w.data.used}/{w.max} cm
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--surface-1)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${w.data.pct}%`,
                height: '100%',
                background: w.data.full ? 'var(--brand)' : 'var(--text-2)',
                transition: 'width 300ms var(--ease)',
              }} />
            </div>
          </div>
        ))}
        {cornerCount > 0 && (
          <div className="flex items-center justify-between" style={{ marginTop: 12, fontSize: 13, color: 'var(--text-2)' }}>
            <span>Ugaoni elementi</span>
            <span className="num" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{cornerCount} / 4</span>
          </div>
        )}
      </div>

      {/* Selektovani inspector — jasan */}
      {selectedEl && (
        <div style={{ margin: 14, padding: 14, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}>
          <p style={{ fontSize: 11, color: 'var(--brand)', marginBottom: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Izabran element
          </p>
          <div className="flex items-start gap-3" style={{ marginBottom: 12 }}>
            <div
                 style={{
                   width: 44, height: 44,
                   background: selectedEl.element.color,
                   borderRadius: 8,
                   border: '1px solid rgba(255,255,255,0.12)',
                   flexShrink: 0,
                 }} />
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ color: 'var(--text-1)', fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>
                {selectedEl.element.name}
              </p>
              <p className="truncate num" style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 3 }}>
                {selectedEl.element.dimensions.width}×{selectedEl.element.dimensions.height}×{selectedEl.element.dimensions.depth} cm
              </p>
              <p className="truncate" style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 2 }}>
                📍 {isCornerSel ? cornerMeta?.label : WALL_LABELS[selectedLoc]}
              </p>
            </div>
          </div>

          {/* Zone pills */}
          {selectedEl.element.zones && selectedEl.element.zones.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap" style={{ marginBottom: 12 }}>
              {selectedEl.element.zones.map(z => {
                const zone = ZONES[z]
                if (!zone) return null
                return (
                  <span key={z} style={{
                    padding: '3px 9px',
                    fontSize: 11, fontWeight: 500,
                    background: 'var(--surface-1)',
                    color: 'var(--text-2)',
                    borderRadius: 100,
                  }}>
                    {zone.label}
                  </span>
                )
              })}
            </div>
          )}

          {/* Pomeranje */}
          {!isCornerSel && (
            <div className="flex gap-2" style={{ marginBottom: 8 }}>
              <Tooltip text="Zameni mesto sa susednim elementom levo" placement="top">
                <button
                  onClick={() => moveElement(selectedUid, 'left')}
                  className="press flex-1 flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    padding: '12px', fontSize: 13, fontWeight: 600,
                    background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text-1)',
                    minHeight: 44,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-1)'}
                >
                  <ChevronLeft size={16} /> Pomeri levo
                </button>
              </Tooltip>
              <Tooltip text="Zameni mesto sa susednim elementom desno" placement="top">
                <button
                  onClick={() => moveElement(selectedUid, 'right')}
                  className="press flex-1 flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    padding: '12px', fontSize: 13, fontWeight: 600,
                    background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text-1)',
                    minHeight: 44,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-1)'}
                >
                  Pomeri desno <ChevronRight size={16} />
                </button>
              </Tooltip>
            </div>
          )}

          <Tooltip text="Ukloni ovaj element iz kuhinje (možete da poništite sa Ctrl+Z)" placement="top">
            <button
              onClick={() => { if (confirm(`Ukloniti "${selectedEl.element.name}" iz kuhinje?`)) removeElement(selectedUid) }}
              className="press w-full flex items-center justify-center gap-2 transition-colors"
              style={{
                padding: '12px', fontSize: 13, fontWeight: 600,
                background: 'transparent', border: '1px solid var(--border)', borderRadius: 8,
                color: 'var(--text-2)',
                minHeight: 44,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'; e.currentTarget.style.background = 'var(--red-bg)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
            >
              <Trash2 size={15} /> Ukloni ovaj element
            </button>
          </Tooltip>
        </div>
      )}

      {/* Lista stavki */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '10px 16px' }}>
        {cartItems.length === 0 ? (
          <div className="text-center" style={{ paddingTop: 48 }}>
            <ShoppingBag size={28} style={{ color: 'var(--text-3)', margin: '0 auto 14px' }} />
            <p style={{ color: 'var(--text-1)', fontSize: 15, fontWeight: 600 }}>
              Kuhinja je prazna
            </p>
            <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 8, padding: '0 16px', lineHeight: 1.5 }}>
              Izaberite kategoriju sa leve strane i kliknite na element da ga dodate.
            </p>
          </div>
        ) : cartItems.map(item => (
          <div key={item.wcId}
               className="flex items-center gap-3"
               style={{ padding: '12px 2px', borderBottom: '1px solid var(--border)' }}>
            <div
                 style={{ width: 20, height: 20, background: item.color, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ color: 'var(--text-1)', fontSize: 14, fontWeight: 600 }}>{item.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>količina: {item.quantity}</p>
            </div>
            <p className="num flex-shrink-0" style={{ color: 'var(--text-1)', fontSize: 14, fontWeight: 600 }}>
              {(item.price * item.quantity).toLocaleString('sr-RS')}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 18px 18px', borderTop: '1px solid var(--border)', background: 'var(--surface-1)' }}>

        {total > 0 && (
          <div className="flex items-baseline justify-between" style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>Ukupna cena</span>
            <div className="text-right">
              <span className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                {total.toLocaleString('sr-RS')}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 4 }}>RSD</span>
            </div>
          </div>
        )}

        <button
          onClick={sendToWooCart}
          disabled={cartItems.length === 0}
          className="press w-full flex items-center justify-center gap-2 transition-colors"
          style={{
            padding: '14px 16px',
            fontSize: 15, fontWeight: 600,
            background: cartItems.length > 0 ? 'var(--brand)' : 'var(--surface-1)',
            color: cartItems.length > 0 ? '#ffffff' : 'var(--text-4)',
            border: cartItems.length > 0 ? 'none' : '1px solid var(--border)',
            borderRadius: 10,
            opacity: cartItems.length === 0 ? 0.7 : 1,
            cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
            minHeight: 52,
          }}
        >
          {cartItems.length === 0 ? 'Prvo dodajte elemente' : (<>Poruči kuhinju <ChevronRight size={16}/></>)}
        </button>

        {cartItems.length > 0 && (
          <button onClick={() => { if (confirm('Obrisati sve elemente iz kuhinje?')) clearAll() }}
                  className="press w-full flex items-center justify-center gap-1.5 transition-colors"
                  style={{ padding: '10px', fontSize: 13, color: 'var(--text-3)', marginTop: 6, background: 'transparent', border: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
            <X size={13} /> Obriši sve i počni ispočetka
          </button>
        )}
      </div>
    </div>
  )
}
