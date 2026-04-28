'use client'
import { useState, useEffect, useRef } from 'react'
import { Headphones, MessageSquare, Send, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const LS_KEY = 'nexcore_support_tickets'

function getTickets() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function saveTickets(tickets) {
  localStorage.setItem(LS_KEY, JSON.stringify(tickets))
  // ping main site
  localStorage.setItem('nexcore_support_ping', Date.now().toString())
}

const STATUS_MAP = {
  aberto:    { color: '#ef4444', label: 'Aberto',      bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)'   },
  analise:   { color: '#f59e0b', label: 'Em Análise',  bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)'  },
  resolvido: { color: '#10b981', label: 'Resolvido',   bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)'  },
}

export default function SuporteTab() {
  const [tickets, setTickets]   = useState([])
  const [active, setActive]     = useState(null)   // ticket id
  const [filter, setFilter]     = useState('todos')
  const [msgText, setMsgText]   = useState('')
  const messagesEndRef = useRef(null)

  // Load and listen
  useEffect(() => {
    setTickets(getTickets())
    const onStorage = e => {
      if (e.key === LS_KEY || e.key === 'nexcore_support_ping') {
        setTickets(getTickets())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active, tickets])

  const filtered = filter === 'todos' ? tickets : tickets.filter(t => t.status === filter)
  const sorted   = [...filtered].sort((a, b) => b.id - a.id)
  const openCount = tickets.filter(t => t.status === 'aberto').length

  const activeTicket = tickets.find(t => t.id === active)

  const sendMessage = () => {
    const text = msgText.trim()
    if (!text || !active) return
    const updated = tickets.map(t => {
      if (t.id !== active) return t
      const newChat = [...(t.chat || []), {
        sender: 'admin',
        senderName: 'Administrativo',
        text,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }]
      // auto move to analise
      return { ...t, chat: newChat, status: t.status === 'aberto' ? 'analise' : t.status }
    })
    setTickets(updated)
    saveTickets(updated)
    setMsgText('')
  }

  const changeStatus = (ticketId, newStatus) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t)
    setTickets(updated)
    saveTickets(updated)
  }

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 100px)' }}>

      {/* ── LEFT PANEL: ticket list ── */}
      <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 className="font-syne text-3xl font-extrabold text-white mb-1" style={{ fontSize: 26 }}>Suporte</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            {openCount > 0
              ? <span style={{ color: '#fbbf24' }}>{openCount} aberto{openCount > 1 ? 's' : ''}</span>
              : 'Nenhum aberto'}
            {' · '}{tickets.length} total
          </p>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['todos','aberto','analise','resolvido'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: filter === f ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
              background: filter === f ? 'rgba(139,92,246,0.18)' : 'transparent',
              color: filter === f ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.2s',
            }}>
              {{todos:'Todos',aberto:'Abertos',analise:'Em Análise',resolvido:'Resolvidos'}[f]}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.length === 0 && (
            <div className="glass-card p-8 text-center" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              <Headphones size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              Nenhum chamado encontrado.
            </div>
          )}
          {sorted.map(ticket => {
            const st = STATUS_MAP[ticket.status] || STATUS_MAP.aberto
            const msgCount = (ticket.chat || []).length
            const isActive = active === ticket.id
            return (
              <div
                key={ticket.id}
                onClick={() => setActive(ticket.id)}
                style={{
                  padding: '14px 16px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
                  background: isActive ? 'rgba(91,106,247,0.12)' : 'rgba(255,255,255,0.025)',
                  border: isActive ? '1px solid rgba(91,106,247,0.45)' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: isActive ? '0 0 16px rgba(91,106,247,0.15)' : 'none',
                  transform: isActive ? 'translateX(4px)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', flex: 1, marginRight: 8 }}>{ticket.subject}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: st.bg, color: st.color, border: `1px solid ${st.border}`, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  <span>{ticket.category}</span>
                  <span>{new Date(ticket.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                </div>
                {msgCount > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a78bfa' }}>
                    <MessageSquare size={10} />
                    {msgCount} mensage{msgCount > 1 ? 'ns' : 'm'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL: chat ── */}
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {!activeTicket ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'rgba(255,255,255,0.3)' }}>
            <MessageSquare size={56} style={{ opacity: 0.25 }} />
            <div style={{ fontSize: 15 }}>Selecione um chamado para iniciar o atendimento</div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{activeTicket.subject}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                  {activeTicket.category} · {activeTicket.clientName || 'Cliente'} · {new Date(activeTicket.date).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <select
                value={activeTicket.status}
                onChange={e => changeStatus(activeTicket.id, e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="aberto">🔴 Aberto</option>
                <option value="analise">🟡 Em Análise</option>
                <option value="resolvido">🟢 Resolvido</option>
              </select>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Original message */}
              <div style={{ alignSelf: 'flex-start', maxWidth: '75%' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px 14px 14px 4px', padding: '12px 16px', fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                  {activeTicket.message}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, paddingLeft: 4 }}>
                  Mensagem original · {activeTicket.clientName || 'Cliente'}
                </div>
              </div>

              {/* Chat messages */}
              {(activeTicket.chat || []).map((m, i) => {
                const isAdminMsg = m.sender === 'admin'
                return (
                  <div key={i} style={{ alignSelf: isAdminMsg ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    <div style={{
                      background: isAdminMsg ? 'linear-gradient(135deg, #5b6af7, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                      border: isAdminMsg ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: isAdminMsg ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      padding: '12px 16px', fontSize: 14, color: '#fff', lineHeight: 1.6,
                    }}>
                      {m.text}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: isAdminMsg ? 'right' : 'left', paddingRight: isAdminMsg ? 4 : 0, paddingLeft: isAdminMsg ? 0 : 4 }}>
                      {m.time} · {m.senderName}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12, flexShrink: 0, background: 'rgba(255,255,255,0.02)' }}>
              <input
                className="glass-input"
                style={{ flex: 1, margin: 0 }}
                placeholder="Responder ao cliente..."
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              />
              <button className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }} onClick={sendMessage}>
                <Send size={16} /> Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
