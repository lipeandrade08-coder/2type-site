'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Send, Lock, MessageCircle } from 'lucide-react'

const LS_KEY = 'nexcore_colab_chats'

function getChats() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function saveChats(chats) {
  localStorage.setItem(LS_KEY, JSON.stringify(chats))
  localStorage.setItem('nexcore_colab_chat_ping', Date.now().toString())
}

export default function ColabChatModal({ colab, onClose }) {
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const endRef = useRef(null)

  const email = colab?.email || colab?.nome?.toLowerCase().replace(/\s+/g, '') + '@twotype.com'

  const load = () => {
    const all = getChats()
    setMsgs(all[email] || [])
  }

  useEffect(() => {
    load()
    // Mark colab msgs as read by admin
    const all = getChats()
    if (all[email]) {
      all[email].forEach(m => { if (m.sender === 'colab') m.readByAdmin = true })
      saveChats(all)
    }
    const onStorage = e => {
      if (e.key === LS_KEY || e.key === 'nexcore_colab_chat_ping') load()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [email])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const all = getChats()
    if (!all[email]) all[email] = []
    all[email].push({
      sender: 'admin',
      senderName: 'Administrativo',
      text: trimmed,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      readByColab: false,
    })
    saveChats(all)
    setText('')
    load()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 500, borderRadius: 20,
        background: 'rgba(12,12,20,0.98)',
        border: '1px solid rgba(139,92,246,0.3)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(91,106,247,0.12)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '85vh',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, #5b6af7, #8b5cf6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {colab.avatar || '👤'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', fontFamily: 'Syne, sans-serif' }}>{colab.nome}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{colab.cargo}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <X size={18} />
          </button>
        </div>

        {/* Info bar */}
        <div style={{ padding: '8px 20px', background: 'rgba(91,106,247,0.07)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
          <Lock size={11} style={{ color: '#8b5cf6' }} />
          Canal privado e seguro · {email}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          {msgs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '32px 0' }}>
              <MessageCircle size={36} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
              Nenhuma mensagem ainda. Inicie a conversa!
            </div>
          ) : (
            msgs.map((m, i) => {
              const isAdmin = m.sender === 'admin'
              return (
                <div key={i} style={{ alignSelf: isAdmin ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isAdmin ? 'linear-gradient(135deg, #5b6af7, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                    border: isAdmin ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    fontSize: 14, color: '#fff', lineHeight: 1.55,
                  }}>
                    {m.text}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3, textAlign: isAdmin ? 'right' : 'left', padding: '0 4px' }}>
                    {m.time} · {m.senderName}
                  </div>
                </div>
              )
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, flexShrink: 0, background: 'rgba(255,255,255,0.02)' }}>
          <input
            className="glass-input"
            style={{ flex: 1, margin: 0 }}
            placeholder={`Mensagem para ${colab.nome}...`}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
          />
          <button className="btn-primary" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={send}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
