// ═══════════════════════════════════════════════════════════════
// BRAND LOGO — Unistil circular mark + wordmark lockup
// Koristi se na LoginScreen / ProjectsScreen / SetupScreen / Planner.
//
// Props:
//   size       = visina loga u px (mark skalira proporcionalno)
//   showWord   = true/false — da li crta tekst "UNISTIL" pored
//   wordSize   = font-size za wordmark (default derived from size)
//   subtitle   = opcioni red ispod wordmark-a (npr. "Planer kuhinja")
//   onClick    = optional; pravi ceo lockup klikabilnim
// ═══════════════════════════════════════════════════════════════
import logoUrl from '../assets/unistil-logo.png'

export default function BrandLogo({
  size = 28,
  showWord = true,
  wordSize,
  subtitle,
  onClick,
  style,
}) {
  const fontSize = wordSize ?? Math.round(size * 0.52)
  const gap = Math.round(size * 0.32)

  const Wrapper = onClick ? 'button' : 'div'
  const wrapperProps = onClick
    ? { onClick, className: 'press', type: 'button' }
    : {}

  return (
    <Wrapper
      {...wrapperProps}
      className={`flex items-center ${onClick ? 'press' : ''}`}
      style={{
        gap,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      <img
        src={logoUrl}
        alt="Unistil"
        width={size}
        height={size}
        draggable={false}
        style={{
          width: size,
          height: size,
          display: 'block',
          flexShrink: 0,
          // Tanki prsten oko kruga — logo je crn pa se utopi u tamnu pozadinu
          // na nekim surface-ima; 1px granica ga stabilno izdvaja.
          borderRadius: '50%',
          boxShadow: '0 0 0 1px var(--border)',
          userSelect: 'none',
          WebkitUserDrag: 'none',
        }}
      />

      {showWord && (
        <div className="flex flex-col" style={{ lineHeight: 1 }}>
          <span
            className="brand-mark"
            style={{
              fontSize,
              color: 'var(--text-1)',
              letterSpacing: '0.04em',
              fontWeight: 700,
            }}
          >
            UNISTIL
          </span>
          {subtitle && (
            <span
              style={{
                fontSize: Math.max(9, Math.round(fontSize * 0.62)),
                color: 'var(--text-3)',
                marginTop: 4,
                letterSpacing: '0.02em',
                fontWeight: 400,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </Wrapper>
  )
}
