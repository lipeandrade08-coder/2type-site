'use client'
import { useState } from 'react'
import { PlusCircle, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react'
import AddModal, { FormField } from '../AddModal'

const statusStyle = s => {
  if (s === 'aprovado')  return { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)', label: 'Aprovado' }
  if (s === 'execucao')  return { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'rgba(139,92,246,0.25)', label: 'Em Dev' }
  if (s === 'concluido') return { bg: 'rgba(0,242,255,0.08)',  color: '#22d3ee', border: 'rgba(0,242,255,0.2)',   label: 'Concluído' }
  return { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)', label: 'Análise' }
}

export default function SolicitacoesTab({ solicitacoes, onAdd, onApprove, role, currentColab }) {
  const isAdmin = role !== 'colaborador'
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', company: '', serviceType: '', details: '', budget: '', deadline: '', phone: '' })
  const [approveForm, setApproveForm] = useState({ clientDeadline: '', devDeadline: '', attachment: null, techDetails: '' })

  const handleSubmit = () => {
    if (!form.name || !form.serviceType) return alert('Preencha nome e tipo de serviço.')
    onAdd({
      ...form,
      id: Date.now(),
      status: 'novo',
      progress: 0,
      date: new Date().toLocaleDateString('pt-BR'),
      techStack: '', edital: '', lastUpdate: '', messages: [], assignedTo: null,
      phone: form.phone || '-',
    })
    setForm({ name: '', email: '', company: '', serviceType: '', details: '', budget: '', deadline: '' })
    setShowModal(false)
  }

  const pendentes = isAdmin ? solicitacoes.filter(s => s.status === 'novo') : []
  const outros    = solicitacoes.filter(s => s.status !== 'novo')

  const IconStatus = ({ status }) => {
    if (status === 'aprovado' || status === 'execucao' || status === 'concluido') return <CheckCircle size={14} />
    return <Clock size={14} />
  }

  const handleApprove = (e, id) => {
    e.stopPropagation()
    if (!approveForm.clientDeadline || !approveForm.devDeadline) {
      return alert('Preencha os prazos para o cliente e para o dev antes de aprovar.')
    }
    onApprove(id, approveForm)
    setSelected(null)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setApproveForm(prev => ({
        ...prev,
        attachment: { name: file.name, url: event.target.result }
      }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 className="font-syne text-3xl font-extrabold text-white mb-1">Solicitações</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
            {pendentes.length > 0 ? <span style={{ color: '#fbbf24' }}>{pendentes.length} pendente{pendentes.length > 1 ? 's' : ''} de análise</span> : 'Nenhuma pendente'}
            {' · '}{solicitacoes.length} total
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setShowModal(true)}>
            <PlusCircle size={16} /> Nova Solicitação
          </button>
        )}
      </div>

      {/* Pending */}
      {pendentes.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            ● Aguardando Análise
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendentes.map((s, i) => (
              <div key={i} className="glass-card p-5" style={{ borderColor: 'rgba(245,158,11,0.2)', cursor: 'pointer' }} onClick={() => { setSelected(selected?.id === s.id ? null : s); setApproveForm({ clientDeadline: '', devDeadline: '', attachment: null, techDetails: '' }) }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: selected?.id === s.id ? 16 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24', flexShrink: 0 }} className="badge-pulse" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.serviceType} · {s.company || 'Sem empresa'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {s.budget && <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{s.budget}</span>}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.date}</span>
                    <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.3)', transform: selected?.id === s.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </div>
                </div>
                {selected?.id === s.id && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }} onClick={e => e.stopPropagation()}>
                    
                    {/* Full Client Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 13 }}>
                      <div><strong style={{ color: 'rgba(255,255,255,0.4)' }}>E-mail:</strong> <span style={{ color: 'white' }}>{s.email || '—'}</span></div>
                      <div><strong style={{ color: 'rgba(255,255,255,0.4)' }}>Telefone:</strong> <span style={{ color: 'white' }}>{s.phone || '—'}</span></div>
                      <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: 'rgba(255,255,255,0.4)' }}>Prazo Desejado pelo Cliente:</strong> <span style={{ color: 'white' }}>{s.deadline || 'Não informado'}</span></div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, marginBottom: 24 }}>
                      <strong style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Escopo / Detalhes</strong>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0 }}>{s.details || 'Nenhum detalhe fornecido.'}</p>
                    </div>

                    {/* Approval Form */}
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 12 }}>Configurações de Aprovação</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      <FormField label="Prazo Final (Portal do Cliente) *">
                        <input className="glass-input" type="date" value={approveForm.clientDeadline} onChange={e => setApproveForm(p => ({ ...p, clientDeadline: e.target.value }))} />
                      </FormField>
                      <FormField label="Prazo Interno (Portal do Dev) *">
                        <input className="glass-input" type="date" value={approveForm.devDeadline} onChange={e => setApproveForm(p => ({ ...p, devDeadline: e.target.value }))} />
                      </FormField>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <FormField label="Detalhes Técnicos para o Desenvolvedor (Opcional)">
                        <textarea className="glass-input" rows={3} placeholder="Instruções técnicas, arquitetura, dependências..." value={approveForm.techDetails} onChange={e => setApproveForm(p => ({ ...p, techDetails: e.target.value }))} style={{ resize: 'vertical' }} />
                      </FormField>
                    </div>
                    <div style={{ marginBottom: 24 }}>
                      <FormField label="Anexar Documento / Briefing (Opcional)">
                        <input className="glass-input" type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt" style={{ padding: '8px 14px' }} />
                        {approveForm.attachment && <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>✓ {approveForm.attachment.name} anexado</div>}
                      </FormField>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn-primary" style={{ fontSize: 13, padding: '10px 20px', background: 'linear-gradient(135deg, #10b981, #059669)' }} onClick={e => handleApprove(e, s.id)}>
                        ✓ Confirmar Aprovação
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Others */}
      {outros.length > 0 && (
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Histórico
          </h3>
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Empresa</th>
                  <th>Orçamento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {outros.map((s, i) => {
                  const ss = statusStyle(s.status)
                  return (
                    <tr key={i}>
                      <td style={{ color: 'white', fontWeight: 500 }}>{s.name}</td>
                      <td>{s.serviceType}</td>
                      <td>{s.company || '—'}</td>
                      <td style={{ color: '#10b981', fontWeight: 600 }}>{s.budget || '—'}</td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 8, ...ss, border: `1px solid ${ss.border}`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <IconStatus status={s.status} /> {ss.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {solicitacoes.length === 0 && (
        <div className="glass-card p-16 text-center">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div className="font-syne" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>Nenhuma solicitação ainda</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>As solicitações do portal do cliente aparecerão aqui.</div>
        </div>
      )}

      {showModal && (
        <AddModal title="Nova Solicitação Manual" onClose={() => setShowModal(false)} onSubmit={handleSubmit}>
          <FormField label="Nome do Cliente *">
            <input className="glass-input" placeholder="Nome completo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="E-mail">
              <input className="glass-input" type="email" placeholder="email@empresa.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </FormField>
            <FormField label="Empresa">
              <input className="glass-input" placeholder="Nome da empresa" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Tipo de Serviço *">
            <input className="glass-input" placeholder="Ex: App Mobile, CRM Web, API..." value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })} />
          </FormField>
          <FormField label="Escopo / Detalhes">
            <textarea className="glass-input" rows={3} placeholder="Descreva o projeto..." value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} style={{ resize: 'vertical' }} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Orçamento Estimado">
              <input className="glass-input" placeholder="Ex: R$ 15.000" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </FormField>
            <FormField label="Prazo Desejado">
              <input className="glass-input" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </FormField>
          </div>
        </AddModal>
      )}
    </div>
  )
}
