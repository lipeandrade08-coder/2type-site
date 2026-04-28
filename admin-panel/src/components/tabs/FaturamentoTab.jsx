'use client'
import { useState } from 'react'
import { PlusCircle, ArrowUpRight } from 'lucide-react'
import AddModal, { FormField } from '../AddModal'

export default function FaturamentoTab({ faturamento, onAdd }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ descricao: '', valor: '', data: '', cliente: '' })

  const total = faturamento.entradas.reduce((s, e) => s + e.valor, 0)

  const handleSubmit = () => {
    if (!form.descricao || !form.valor || !form.cliente) return alert('Preencha todos os campos obrigatórios.')
    onAdd({ ...form, valor: parseFloat(form.valor.replace(',', '.')) || 0, id: Date.now() })
    setForm({ descricao: '', valor: '', data: '', cliente: '' })
    setShowModal(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 className="font-syne text-3xl font-extrabold text-white mb-1">Faturamento</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Receitas e entradas financeiras</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setShowModal(true)}>
          <PlusCircle size={16} /> Nova Entrada
        </button>
      </div>

      {/* Total Card */}
      <div className="glass-card p-8 mb-6 glow-green" style={{ borderColor: 'rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Faturamento Total do Mês
            </div>
            <div className="kpi-value" style={{ color: '#10b981', fontSize: 40 }}>
              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
              {faturamento.entradas.length} transações registradas
            </div>
          </div>
          <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 16, padding: 20 }}>
            <ArrowUpRight size={40} color="#10b981" />
          </div>
        </div>
      </div>

      {/* Entries list */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="font-syne font-700 text-white" style={{ fontSize: 15 }}>Histórico de Entradas</h3>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Cliente</th>
              <th>Data</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {faturamento.entradas.map((e, i) => (
              <tr key={i}>
                <td style={{ color: 'white', fontWeight: 500 }}>{e.descricao}</td>
                <td>{e.cliente}</td>
                <td>{e.data ? new Date(e.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>
                  R$ {e.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddModal title="Adicionar Entrada de Faturamento" onClose={() => setShowModal(false)} onSubmit={handleSubmit}>
          <FormField label="Descrição do Serviço *">
            <input className="glass-input" placeholder="Ex: App Mobile Delivery V2.0" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          </FormField>
          <FormField label="Cliente *">
            <input className="glass-input" placeholder="Nome da empresa ou cliente" value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} />
          </FormField>
          <FormField label="Valor (R$) *">
            <input className="glass-input" type="number" placeholder="0,00" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
          </FormField>
          <FormField label="Data">
            <input className="glass-input" type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
          </FormField>
        </AddModal>
      )}
    </div>
  )
}
