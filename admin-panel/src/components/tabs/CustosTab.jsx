'use client'
import { useState } from 'react'
import { PlusCircle, ArrowDownRight } from 'lucide-react'
import AddModal, { FormField } from '../AddModal'

const CATEGORIAS = ['Infraestrutura', 'Deploy', 'Ferramentas', 'Design', 'Produtividade', 'Gestão', 'Marketing', 'Escritório', 'Outros']

const catColor = cat => {
  const map = {
    'Infraestrutura': { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
    'Deploy':         { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
    'Ferramentas':    { bg: 'rgba(0,242,255,0.08)',  color: '#22d3ee', border: 'rgba(0,242,255,0.2)'   },
    'Design':         { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
    'Produtividade':  { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
    'Gestão':         { bg: 'rgba(91,106,247,0.12)', color: '#818cf8', border: 'rgba(91,106,247,0.25)' },
  }
  return map[cat] || { bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.12)' }
}

export default function CustosTab({ custos, onAdd }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ item: '', categoria: 'Infraestrutura', valor: '', data: '' })

  const total = custos.reduce((s, c) => s + c.valor, 0)

  const handleSubmit = () => {
    if (!form.item || !form.valor) return alert('Preencha nome e valor da despesa.')
    onAdd({ ...form, valor: parseFloat(form.valor.replace(',', '.')) || 0, id: Date.now() })
    setForm({ item: '', categoria: 'Infraestrutura', valor: '', data: '' })
    setShowModal(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 className="font-syne text-3xl font-extrabold text-white mb-1">Custos</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Despesas operacionais mensais</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setShowModal(true)}>
          <PlusCircle size={16} /> Nova Despesa
        </button>
      </div>

      {/* Total Card */}
      <div className="glass-card p-8 mb-6" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Total de Custos Mensais
            </div>
            <div className="kpi-value" style={{ color: '#ef4444', fontSize: 40 }}>
              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
              {custos.length} itens de despesa
            </div>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 20 }}>
            <ArrowDownRight size={40} color="#ef4444" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="font-syne font-700 text-white" style={{ fontSize: 15 }}>Despesas Detalhadas</h3>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Categoria</th>
              <th>Data</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {custos.map((c, i) => {
              const cc = catColor(c.categoria)
              return (
                <tr key={i}>
                  <td style={{ color: 'white', fontWeight: 500 }}>{c.item}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 8, ...cc, border: `1px solid ${cc.border}` }}>
                      {c.categoria}
                    </span>
                  </td>
                  <td>{c.data ? new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                  <td style={{ textAlign: 'right', color: '#f87171', fontWeight: 700 }}>
                    R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddModal title="Adicionar Despesa" onClose={() => setShowModal(false)} onSubmit={handleSubmit}>
          <FormField label="Nome da Despesa *">
            <input className="glass-input" placeholder="Ex: AWS EC2 + RDS" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} />
          </FormField>
          <FormField label="Categoria">
            <select className="glass-input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Valor Mensal (R$) *">
            <input className="glass-input" type="number" placeholder="0,00" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
          </FormField>
          <FormField label="Data de Referência">
            <input className="glass-input" type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
          </FormField>
        </AddModal>
      )}
    </div>
  )
}
