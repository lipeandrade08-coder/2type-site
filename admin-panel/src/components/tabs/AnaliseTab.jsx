'use client'
import { useState } from 'react'
import { ClipboardCheck, CheckCircle, XCircle, ChevronRight, MessageSquare, AlertTriangle } from 'lucide-react'

export default function AnaliseTab({ solicitacoes, onApproveDelivery, onRejectDelivery, role }) {
  const isAdmin = role !== 'colaborador'
  const [selected, setSelected] = useState(null)
  const [rejectComment, setRejectComment] = useState('')

  const emAnalise = solicitacoes.filter(s => s.status === 'pendente_aprovacao')

  const handleApprove = (e, id) => {
    e.stopPropagation()
    if (!confirm('Deseja realmente aprovar este projeto como concluído?')) return
    onApproveDelivery(id)
    setSelected(null)
  }

  const handleReject = (e, id) => {
    e.stopPropagation()
    if (!rejectComment) return alert('Por favor, descreva o que precisa ser ajustado.')
    onRejectDelivery(id, rejectComment)
    setRejectComment('')
    setSelected(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 className="font-syne text-3xl font-extrabold text-white mb-1">Análise de Entregas</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
            {emAnalise.length > 0 ? (
              <span style={{ color: '#00f2ff' }}>{emAnalise.length} projeto{emAnalise.length > 1 ? 's' : ''} aguardando sua revisão</span>
            ) : (
              'Nenhum projeto aguardando análise no momento'
            )}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {emAnalise.map((s, i) => (
          <div key={i} className="glass-card p-6" style={{ borderColor: 'rgba(34, 211, 238, 0.2)', cursor: 'pointer' }} onClick={() => setSelected(selected?.id === s.id ? null : s)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: selected?.id === s.id ? 20 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34, 211, 238, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
                  <ClipboardCheck size={20} style={{ color: '#22d3ee', margin: 'auto' }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{s.serviceType}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Solicitado por: {s.name} · Dev: {s.assignedTo || 'Colaborador'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8, background: 'rgba(34, 211, 238, 0.1)', color: '#22d3ee', border: '1px solid rgba(34, 211, 238, 0.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                   AGUARDANDO REVISÃO
                </span>
                <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.3)', transform: selected?.id === s.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
            </div>

            {selected?.id === s.id && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginTop: 4 }} onClick={e => e.stopPropagation()}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  <div>
                    <h4 style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>Resumo do Projeto</h4>
                    <div className="glass-card" style={{ padding: 16, background: 'rgba(255,255,255,0.02)' }}>
                       <div style={{ marginBottom: 10, fontSize: 13 }}><strong style={{ color: 'rgba(255,255,255,0.3)' }}>Cliente:</strong> {s.name}</div>
                       <div style={{ marginBottom: 10, fontSize: 13 }}><strong style={{ color: 'rgba(255,255,255,0.3)' }}>Empresa:</strong> {s.company || '—'}</div>
                       <div style={{ fontSize: 13 }}><strong style={{ color: 'rgba(255,255,255,0.3)' }}>Valor do Repasse:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>R$ {s.paymentValue || '0,00'}</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>Detalhes Técnicos Acordados</h4>
                    <div className="glass-card" style={{ padding: 16, background: 'rgba(255,255,255,0.02)', fontSize: 13, color: 'rgba(255,255,255,0.7)', minHeight: 80 }}>
                       {s.techDetails || 'Nenhum detalhe técnico registrado.'}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>Ações de Revisão</h4>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <textarea 
                        className="glass-input" 
                        rows={3} 
                        placeholder="Caso precise reprovar, descreva aqui o que precisa ser ajustado..." 
                        value={rejectComment}
                        onChange={e => setRejectComment(e.target.value)}
                        style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button 
                    className="btn-ghost" 
                    style={{ border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}
                    onClick={e => handleReject(e, s.id)}
                  >
                    <XCircle size={16} style={{ marginRight: 8 }} /> Solicitar Ajustes
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                    onClick={e => handleApprove(e, s.id)}
                  >
                    <CheckCircle size={16} style={{ marginRight: 8 }} /> Aprovar e Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {emAnalise.length === 0 && (
          <div className="glass-card p-20 text-center" style={{ borderStyle: 'dashed', background: 'none' }}>
             <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <ClipboardCheck size={32} style={{ color: 'rgba(255,255,255,0.1)' }} />
             </div>
             <h3 style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Tudo em ordem!</h3>
             <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>Não há entregas pendentes de análise no momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
