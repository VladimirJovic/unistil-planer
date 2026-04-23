import { useState } from 'react'
import { Plus, FolderOpen, Trash2, LogOut, Pencil, Check, X, ArrowRight, Clock } from 'lucide-react'
import { useStore } from '../store/useStore'

// ─────────────────────────────────────────────────────────────
// Datum (sr-RS)
// ─────────────────────────────────────────────────────────────
function fmt(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

function countElements(p) {
  const walls = p.walls || {}
  const corners = p.corners || {}
  const wallCount = Object.values(walls).reduce((s, l) => s + (l?.length || 0), 0)
  const cornerCount = Object.values(corners).filter(Boolean).length
  return wallCount + cornerCount
}

// ─────────────────────────────────────────────────────────────
// PROJECTS — minimal, clean
// ─────────────────────────────────────────────────────────────
export default function ProjectsScreen() {
  const user           = useStore(s => s.user)
  const projects       = useStore(s => s.projects)
  const createProject  = useStore(s => s.createProject)
  const openProject    = useStore(s => s.openProject)
  const deleteProject  = useStore(s => s.deleteProject)
  const renameProject  = useStore(s => s.renameProject)
  const logout         = useStore(s => s.logout)

  const [newName, setNewName]     = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  function handleCreate() {
    const name = newName.trim() || `Kuhinja ${new Date().toLocaleDateString('sr-RS')}`
    createProject(name)
    setNewName('')
  }

  function startRename(p) {
    setEditingId(p.id)
    setEditValue(p.name)
  }
  function commitRename() {
    if (editingId && editValue.trim()) renameProject(editingId, editValue.trim())
    setEditingId(null); setEditValue('')
  }
  function cancelRename() {
    setEditingId(null); setEditValue('')
  }

  function handleDelete(p) {
    if (confirm(`Obriši projekat "${p.name}"?`)) {
      deleteProject(p.id)
    }
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-app)' }}>

      {/* Header — minimalan, 1px border */}
      <header className="flex items-center justify-between"
              style={{ padding: '16px 32px', borderBottom: '1px solid var(--border)' }}>
        <span className="brand-mark" style={{ fontSize: 13, color: 'var(--text-1)' }}>UNISTIL</span>

        <div className="flex items-center gap-4">
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {user?.email}
          </span>
          <button
            onClick={logout}
            className="press flex items-center gap-1.5 transition-colors"
            style={{
              padding: '6px 10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-3)',
              fontSize: 12,
              borderRadius: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)' }}
            title="Odjava"
          >
            <LogOut size={13} />
            Odjava
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center" style={{ padding: '64px 24px 48px' }}>
        <div className="w-full" style={{ maxWidth: 720 }}>

          {/* Title */}
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 28, fontWeight: 500, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Projekti
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 6 }}>
              {projects.length === 0
                ? 'Kreiraj prvi projekat da počneš.'
                : `${projects.length} ${projects.length === 1 ? 'projekat' : 'projekata'}`}
            </p>
          </div>

          {/* Kreiranje projekta — ujednačen red sa input + CTA */}
          <div className="flex items-center gap-2" style={{ marginBottom: 28 }}>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
              placeholder="Naziv projekta"
              className="flex-1 transition-colors"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                height: 40,
                padding: '0 14px',
                color: 'var(--text-1)',
                fontSize: 14,
                outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
            <button
              onClick={handleCreate}
              className="press flex items-center gap-1.5 rounded-lg transition-colors"
              style={{
                padding: '0 16px',
                height: 40,
                background: 'var(--brand)',
                color: '#ffffff',
                fontSize: 13, fontWeight: 500,
                border: 'none',
              }}
            >
              <Plus size={15} />
              Novi projekat
            </button>
          </div>

          {/* Lista */}
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center"
                 style={{ padding: '72px 20px', border: '1px dashed var(--border)', borderRadius: 12 }}>
              <FolderOpen size={32} style={{ color: 'var(--text-4)' }} />
              <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 14, textAlign: 'center' }}>
                Još nema projekata.
              </p>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid var(--border)' }}>
              {projects.map(p => {
                const items = countElements(p)
                const isEditing = editingId === p.id
                return (
                  <div key={p.id}
                       className="flex items-center gap-4 transition-colors group"
                       style={{
                         padding: '16px 4px',
                         borderBottom: '1px solid var(--border)',
                       }}
                       onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                       onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          value={editValue}
                          autoFocus
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') cancelRename() }}
                          style={{
                            width: '100%',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: 6,
                            color: 'var(--text-1)',
                            fontSize: 14, fontWeight: 500,
                            padding: '6px 10px',
                            outline: 'none',
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => openProject(p.id)}
                          style={{
                            background: 'transparent', border: 'none', padding: 0,
                            fontSize: 14, fontWeight: 500, color: 'var(--text-1)',
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          {p.name}
                        </button>
                      )}
                      <div className="flex items-center gap-2" style={{ marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {fmt(p.updatedAt)}
                        </span>
                        <span style={{ color: 'var(--text-4)' }}>·</span>
                        <span className="num">{p.room?.width}×{p.room?.depth}×{p.room?.height} cm</span>
                        <span style={{ color: 'var(--text-4)' }}>·</span>
                        <span>{items} {items === 1 ? 'element' : 'elemenata'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <IconBtn onClick={commitRename} title="Sačuvaj">
                            <Check size={14} />
                          </IconBtn>
                          <IconBtn onClick={cancelRename} title="Otkaži">
                            <X size={14} />
                          </IconBtn>
                        </>
                      ) : (
                        <>
                          <IconBtn onClick={() => startRename(p)} title="Preimenuj">
                            <Pencil size={13} />
                          </IconBtn>
                          <IconBtn onClick={() => handleDelete(p)} title="Obriši" danger>
                            <Trash2 size={13} />
                          </IconBtn>
                          <button
                            onClick={() => openProject(p.id)}
                            className="press flex items-center gap-1.5 transition-colors"
                            style={{
                              padding: '7px 14px',
                              background: 'transparent',
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              color: 'var(--text-2)',
                              fontSize: 12, fontWeight: 500,
                              marginLeft: 4,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-1)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
                          >
                            Otvori
                            <ArrowRight size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// IconBtn — 32×32, ghost stil
// ─────────────────────────────────────────────────────────────
function IconBtn({ children, onClick, title, danger }) {
  const hoverColor = danger ? 'var(--red)' : 'var(--text-1)'
  return (
    <button
      onClick={onClick}
      title={title}
      className="press flex items-center justify-center transition-colors"
      style={{
        width: 30, height: 30,
        background: 'transparent',
        border: 'none',
        borderRadius: 6,
        color: 'var(--text-3)',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = hoverColor; e.currentTarget.style.background = 'var(--bg-active)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}
