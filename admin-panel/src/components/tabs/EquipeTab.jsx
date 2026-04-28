'use client'
import { useState, useEffect } from 'react'
import { UserPlus, CheckCircle, Clock, MessageCircle } from 'lucide-react'
import AddModal, { FormField } from '../AddModal'
import ColabChatModal from '../ColabChatModal'

const CARGOS = ['Fullstack', 'Frontend', 'Backend', 'UI/UX', 'Mobile', 'DevOps', 'IA / Machine Learning', 'Engenharia de Software']

const AVATAR_MAP = {
  'Marcos Rodrigues': '👨‍💻',
  'Filipe Andrade':   '🧑‍💻',
  'Henrique Sampaio': '🎨',
  'Davi Borges':      '⚙️',
}

// Map nome → email for chat key
function colabEmail(nome) {
  const map = {
    'Marcos Rodrigues': 'marcos@twotype.com',
    'Filipe Andrade':   'filipe@twotype.com',
    'Henrique Sampaio': 'henrique@twotype.com',
    'Davi Borges':      'davi@twotype.com',
    'Colaborador':      'colaborador@twotype.com',
  }
  return map[nome] || (nome.toLowerCase().replace(/\s+/g, '') + '@twotype.com')
}

function getUnreadCount(email) {
  try {
    const all = JSON.parse(localStorage.getItem('nexcore_colab_chats') || '{}')
    return (all[email] || []).filter(m => m.sender === 'colab' && !m.readByAdmin).length
  } catch { return 0 }
}

export default function EquipeTab({ equipe, onAdd, role }) {
  const isAdmin = role !== 'colaborador'
  const [showModal, setShowModal]   = useState(false)
  const [chatColab, setChatColab]   = useState(null)   // colab object being chatted
  const [unreadMap, setUnreadMap]   = useState({})
  const [form, setForm] = useState({ nome: '', cargo: '', foto: '', status: 'disponível', habilidades: '' })

  // Refresh unread counts
  const refreshUnread = () => {
    const map = {}
    equipe.forEach(m => {
      const email = colabEmail(m.nome)
      map[email] = getUnreadCount(email)
    })
    setUnreadMap(map)
  }

  useEffect(() => {
    refreshUnread()
    const onStorage = e => {
      if (e.key === 'nexcore_colab_chats' || e.key === 'nexcore_colab_chat_ping') refreshUnread()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [equipe])

  const handleSubmit = () => {
    if (!form.nome || !form.cargo) return alert('Preencha nome e cargo.')
    onAdd({
      ...form,
      foto: form.foto || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(form.nome)}&backgroundColor=8b5cf6`,
      habilidades: form.habilidades.split(',').map(h => h.trim()).filter(Boolean),
    })
    setForm({ nome: '', cargo: '', foto: '', status: 'disponível', habilidades: '' })
    setShowModal(false)
  }

  const statusColor = s => s === 'disponível' ? { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)' }
                          : s === 'em projeto'  ? { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.25)'  }
                          :                       { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', border: 'rgba(107,114,128,0.25)' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 className="font-syne text-3xl font-extrabold text-white mb-1">Equipe</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>{equipe.length} membros cadastrados</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setShowModal(true)}>
            <UserPlus size={16} /> Adicionar Membro
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {equipe.map((m, i) => {
          const sc = statusColor(m.status)
          const email = colabEmail(m.nome)
          const unread = unreadMap[email] || 0
          return (
            <div key={i} className="glass-card p-6 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <img
                  src={m.foto}
                  alt={m.nome}
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(139,92,246,0.3)' }}
                  onError={e => { e.target.src = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(m.nome)}&backgroundColor=8b5cf6` }}
                />
                <span style={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 14, height: 14, borderRadius: '50%',
                  background: sc.color, border: '2px solid #050505',
                  boxShadow: `0 0 6px ${sc.color}`,
                }} />
              </div>

              <h3 className="font-syne font-700 text-white" style={{ fontSize: 15, marginBottom: 4 }}>{m.nome}</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>{m.cargo}</p>

              <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, marginBottom: 16, ...sc, border: `1px solid ${sc.border}` }}>
                {m.status === 'disponível' ? <><CheckCircle size={11} style={{ display: 'inline', marginRight: 4 }} />Disponível</>
                  : m.status === 'em projeto' ? <><Clock size={11} style={{ display: 'inline', marginRight: 4 }} />Em Projeto</>
                  : 'Offline'}
              </span>

              {Array.isArray(m.habilidades) && m.habilidades.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
                  {m.habilidades.map((h, j) => (
                    <span key={j} style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 8, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                      {h}
                    </span>
                  ))}
                </div>
              )}

              {/* Chat button — admin only */}
              {isAdmin && (
                <button
                  onClick={() => setChatColab({ ...m, email, avatar: AVATAR_MAP[m.nome] || '👤' })}
                  style={{
                    width: '100%', padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, rgba(91,106,247,0.85), rgba(139,92,246,0.85))',
                    color: '#fff', fontWeight: 600, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    transition: 'all 0.25s', position: 'relative',
                    boxShadow: '0 4px 14px rgba(91,106,247,0.25)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(91,106,247,0.45)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(91,106,247,0.25)' }}
                >
                  <MessageCircle size={15} />
                  Chat Privado
                  {unread > 0 && (
                    <span style={{
                      position: 'absolute', top: -6, right: -6,
                      background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700,
                      width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid #050505', animation: 'badge-pulse 1.5s infinite',
                    }}>
                      {unread}
                    </span>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <AddModal title="Adicionar Membro da Equipe" onClose={() => setShowModal(false)} onSubmit={handleSubmit}>
          <FormField label="Nome Completo">
            <input className="glass-input" placeholder="Ex: João Silva" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </FormField>
          <FormField label="Cargo / Especialidade">
            <select className="glass-input" value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })}>
              <option value="">Selecione...</option>
              {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="URL da Foto (opcional)">
            <input className="glass-input" placeholder="https://..." value={form.foto} onChange={e => setForm({ ...form, foto: e.target.value })} />
          </FormField>
          <FormField label="Status">
            <select className="glass-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="disponível">Disponível</option>
              <option value="em projeto">Em Projeto</option>
              <option value="offline">Offline</option>
            </select>
          </FormField>
          <FormField label="Habilidades (separadas por vírgula)">
            <input className="glass-input" placeholder="React, Node.js, AWS" value={form.habilidades} onChange={e => setForm({ ...form, habilidades: e.target.value })} />
          </FormField>
        </AddModal>
      )}

      {/* Private Chat Modal */}
      {chatColab && (
        <ColabChatModal
          colab={chatColab}
          onClose={() => { setChatColab(null); refreshUnread() }}
        />
      )}
    </div>
  )
}
