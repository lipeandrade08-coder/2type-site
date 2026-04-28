'use client'
import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import AddModal, { FormField } from '../AddModal'

const STATUS_OPTS = ['Concluído', 'Em Dev', 'Planejamento', 'Pausado']

const statusStyle = s => {
  if (s === 'Concluído')   return { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)' }
  if (s === 'Em Dev')      return { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'rgba(139,92,246,0.25)' }
  if (s === 'Planejamento')return { bg: 'rgba(0,242,255,0.08)',  color: '#22d3ee', border: 'rgba(0,242,255,0.2)'   }
  return { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', border: 'rgba(107,114,128,0.2)' }
}

export default function ProjetosTab({ projetos, equipe, onAdd }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nome: '', cliente: '', data: '', dev: '', status: 'Em Dev', valor: '' })

  const handleSubmit = () => {
    if (!form.nome || !form.cliente) return alert('Preencha nome e cliente do projeto.')
    onAdd({ ...form, valor: parseFloat(form.valor) || 0, id: Date.now() })
    setForm({ nome: '', cliente: '', data: '', dev: '', status: 'Em Dev', valor: '' })
    setShowModal(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 className="font-syne text-3xl font-extrabold text-white mb-1">Projetos Realizados</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>{projetos.length} projetos no histórico</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setShowModal(true)}>
          <PlusCircle size={16} /> Novo Projeto
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {STATUS_OPTS.map(s => {
          const count = projetos.filter(p => p.status === s).length
          const ss = statusStyle(s)
          return (
            <div key={s} className="glass-card p-4 text-center" style={{ borderColor: ss.border }}>
              <div className="font-syne" style={{ fontSize: 24, fontWeight: 800, color: ss.color }}>{count}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{s}</div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Projeto</th>
              <th>Cliente</th>
              <th>Dev Responsável</th>
              <th>Data</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {projetos.map((p, i) => {
              const ss = statusStyle(p.status)
              return (
                <tr key={i}>
                  <td style={{ color: 'white', fontWeight: 500 }}>{p.nome}</td>
                  <td>{p.cliente}</td>
                  <td>{p.dev || '—'}</td>
                  <td>{p.data ? new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 8, ...ss, border: `1px solid ${ss.border}` }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>
                    {p.valor ? `R$ ${p.valor.toLocaleString('pt-BR')}` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddModal title="Adicionar Projeto" onClose={() => setShowModal(false)} onSubmit={handleSubmit}>
          <FormField label="Nome do Projeto *">
            <input className="glass-input" placeholder="Ex: CRM Web Corporativo" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </FormField>
          <FormField label="Cliente *">
            <input className="glass-input" placeholder="Nome da empresa/cliente" value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} />
          </FormField>
          <FormField label="Dev Responsável">
            <select className="glass-input" value={form.dev} onChange={e => setForm({ ...form, dev: e.target.value })}>
              <option value="">Selecionar dev...</option>
              {equipe.map(m => <option key={m.nome} value={m.nome}>{m.nome} — {m.cargo}</option>)}
            </select>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Status">
              <select className="glass-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Valor (R$)">
              <input className="glass-input" type="number" placeholder="0" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Data de Entrega">
            <input className="glass-input" type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
          </FormField>
        </AddModal>
      )}
    </div>
  )
}
