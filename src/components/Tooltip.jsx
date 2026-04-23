import { useState, useRef, useEffect, cloneElement, Children } from 'react'

// ─────────────────────────────────────────────────────────────
// Tooltip — wrapper koji prikazuje opisni tekst iznad/ispod targetа
// nakon 400ms zadržavanja miša. Pristupačan (role=tooltip, aria-describedby).
// Primer:
//   <Tooltip text="Poništi poslednju akciju" shortcut="Ctrl+Z">
//     <button>…</button>
//   </Tooltip>
// ─────────────────────────────────────────────────────────────
export default function Tooltip({ children, text, shortcut, placement = 'bottom', delay = 400, disabled = false }) {
  const [open, setOpen]       = useState(false)
  const [coords, setCoords]   = useState({ x: 0, y: 0 })
  const timerRef  = useRef(null)
  const targetRef = useRef(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function show() {
    if (disabled || !text) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const el = targetRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      let x, y
      switch (placement) {
        case 'top':
          x = r.left + r.width / 2; y = r.top - 8; break
        case 'left':
          x = r.left - 8; y = r.top + r.height / 2; break
        case 'right':
          x = r.right + 8; y = r.top + r.height / 2; break
        case 'bottom':
        default:
          x = r.left + r.width / 2; y = r.bottom + 8
      }
      setCoords({ x, y })
      setOpen(true)
    }, delay)
  }

  function hide() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    setOpen(false)
  }

  const child = Children.only(children)
  const wrapped = cloneElement(child, {
    ref: (node) => {
      targetRef.current = node
      // Podrži ref-forwarding ako child ima svoj ref
      const { ref } = child
      if (typeof ref === 'function') ref(node)
      else if (ref && typeof ref === 'object') ref.current = node
    },
    onMouseEnter: (e) => { show();  child.props.onMouseEnter?.(e) },
    onMouseLeave: (e) => { hide();  child.props.onMouseLeave?.(e) },
    onFocus:      (e) => { show();  child.props.onFocus?.(e) },
    onBlur:       (e) => { hide();  child.props.onBlur?.(e) },
    onMouseDown:  (e) => { hide();  child.props.onMouseDown?.(e) },
  })

  // Transform po placement-u za centriranje
  let transform = 'translate(-50%, 0)'
  if (placement === 'top')    transform = 'translate(-50%, -100%)'
  if (placement === 'left')   transform = 'translate(-100%, -50%)'
  if (placement === 'right')  transform = 'translate(0, -50%)'
  if (placement === 'bottom') transform = 'translate(-50%, 0)'

  return (
    <>
      {wrapped}
      {open && text && (
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            left: coords.x, top: coords.y,
            transform,
            zIndex: 9999,
            padding: '7px 10px',
            background: 'rgba(18,18,22,0.96)',
            color: 'var(--text-1)',
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.3,
            border: '1px solid var(--border-strong)',
            borderRadius: 6,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
            pointerEvents: 'none',
            maxWidth: 260,
            whiteSpace: 'normal',
          }}
        >
          <span>{text}</span>
          {shortcut && (
            <span className="num" style={{
              marginLeft: 8, padding: '1px 6px',
              fontSize: 11,
              background: 'var(--surface-2)', color: 'var(--text-2)',
              borderRadius: 4, border: '1px solid var(--border)',
            }}>
              {shortcut}
            </span>
          )}
        </div>
      )}
    </>
  )
}
