import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import BrandLogo from './BrandLogo'

// ─────────────────────────────────────────────────────────────
// LOGIN — minimal, neutral. Email + ime obavezno; telefon/firma opcionalno.
// ─────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const login = useStore(s => s.login)

  const [email, setEmail]       = useState('')
  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [company, setCompany]   = useState('')
  const [agree, setAgree]       = useState(true)
  const [touched, setTouched]   = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const validName  = name.trim().length >= 2
  const canSubmit  = validEmail && validName

  function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    setSubmitting(true)
    const ok = login({ email, name, phone, company, newsletter: agree })
    setSubmitting(false)
    if (!ok) alert('Problem sa prijavom. Pokušaj ponovo.')
  }

  return (
    <div className="flex items-center justify-center min-h-screen"
         style={{ background: 'var(--bg-app)' }}>

      <div className="w-full px-6" style={{ maxWidth: 380 }}>

        {/* Brand lockup — veci mark za landing stranicu */}
        <div className="flex flex-col items-center mb-10" style={{ gap: 12 }}>
          <img
            src={new URL('../assets/unistil-logo.png', import.meta.url).href}
            alt="Unistil"
            width={68}
            height={68}
            draggable={false}
            style={{
              width: 68, height: 68,
              display: 'block',
              borderRadius: '50%',
              boxShadow: '0 0 0 1px var(--border), 0 8px 24px rgba(0,0,0,0.35)',
              userSelect: 'none',
            }}
          />
          <div className="flex flex-col items-center" style={{ gap: 4 }}>
            <span className="brand-mark" style={{ fontSize: 16, color: 'var(--text-1)', letterSpacing: '0.06em', fontWeight: 700 }}>
              UNISTIL
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Planer kuhinja
            </span>
          </div>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div style={{ marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              Prijavi se
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
              Sačuvaj svoje projekte i nastavi gde si stao.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Field
              label="Email"
              required
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="ime@primer.rs"
              error={touched && !validEmail ? 'Unesi validan email' : null}
            />

            <Field
              label="Ime i prezime"
              required
              value={name}
              onChange={setName}
              placeholder="Petar Petrović"
              error={touched && !validName ? 'Najmanje 2 znaka' : null}
            />

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Telefon"
                value={phone}
                onChange={setPhone}
                placeholder="+381"
                optional
              />
              <Field
                label="Firma"
                value={company}
                onChange={setCompany}
                placeholder="—"
                optional
              />
            </div>
          </div>

          {/* Newsletter */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none" style={{ marginTop: 2 }}>
            <input
              type="checkbox"
              checked={agree}
              onChange={e => setAgree(e.target.checked)}
              style={{ accentColor: 'var(--brand)', marginTop: 3, width: 14, height: 14 }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
              Želim da dobijam novosti o ponudama.
            </span>
          </label>

          {/* CTA */}
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="press w-full flex items-center justify-center gap-2 rounded-lg transition-colors"
            style={{
              padding: '12px 20px',
              fontSize: 14, fontWeight: 500,
              background: canSubmit ? 'var(--brand)' : 'var(--surface-1)',
              color: canSubmit ? '#ffffff' : 'var(--text-4)',
              border: 'none',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.7,
              marginTop: 4,
            }}
          >
            Nastavi
            <ArrowRight size={15} />
          </button>

          <p className="text-center" style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>
            Podaci se čuvaju lokalno na ovom uređaju.
          </p>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Field — minimalni text input
// ─────────────────────────────────────────────────────────────
function Field({ label, required, optional, value, onChange, type = 'text', placeholder, error }) {
  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <label style={{ color: 'var(--text-2)', fontSize: 12, fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: 'var(--brand)', marginLeft: 3 }}>*</span>}
          {optional && <span style={{ color: 'var(--text-4)', marginLeft: 6, fontWeight: 400 }}>opciono</span>}
        </label>
      </div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={type === 'email' ? 'email' : 'off'}
        className="w-full transition-colors"
        style={{
          background: 'var(--bg-input)',
          border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 8,
          height: 40,
          padding: '0 12px',
          color: 'var(--text-1)',
          fontSize: 14,
          outline: 'none',
        }}
        onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'var(--border-strong)' }}
        onBlur={e => { if (!error) e.currentTarget.style.borderColor = 'var(--border)' }}
      />
      {error && (
        <p style={{ color: 'var(--red)', fontSize: 11, marginTop: 4 }}>{error}</p>
      )}
    </div>
  )
}
