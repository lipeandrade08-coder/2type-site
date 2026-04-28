'use client'
import { useState } from 'react'
import { Users, DollarSign, TrendingUp, TrendingDown, FolderOpen, Inbox, LayoutDashboard } from 'lucide-react'

export default function DashboardTab({ data }) {
  const totalFaturamento = data.faturamento.entradas.reduce((s, e) => s + e.valor, 0)
  const totalCustos = data.custos.reduce((s, c) => s + c.valor, 0)
  const lucro = totalFaturamento - totalCustos
  const pendentes = data.solicitacoes.filter(s => s.status === 'novo').length

  const kpis = [
    {
      label: 'Faturamento Mensal',
      value: `R$ ${totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.2)',
      sub: `${data.faturamento.entradas.length} entradas no mês`,
    },
    {
      label: 'Custos Operacionais',
      value: `R$ ${totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.2)',
      sub: `${data.custos.length} itens de despesa`,
    },
    {
      label: 'Lucro Líquido',
      value: `R$ ${lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
      border: 'rgba(139,92,246,0.2)',
      sub: `Margem: ${totalFaturamento > 0 ? ((lucro / totalFaturamento) * 100).toFixed(1) : 0}%`,
    },
    {
      label: 'Projetos Realizados',
      value: data.projetos.length,
      icon: FolderOpen,
      color: '#00f2ff',
      bg: 'rgba(0,242,255,0.08)',
      border: 'rgba(0,242,255,0.2)',
      sub: `${data.projetos.filter(p => p.status === 'Concluído').length} concluídos`,
    },
    {
      label: 'Equipe',
      value: data.equipe.length,
      icon: Users,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.2)',
      sub: `${data.equipe.filter(m => m.status === 'disponível').length} disponíveis`,
    },
    {
      label: 'Solicitações Pendentes',
      value: pendentes,
      icon: Inbox,
      color: pendentes > 0 ? '#ef4444' : '#6b7280',
      bg: pendentes > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.1)',
      border: pendentes > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(107,114,128,0.15)',
      sub: pendentes > 0 ? 'Aguardam aprovação' : 'Nenhuma pendente',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-syne text-3xl font-extrabold text-white mb-1">Dashboard</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
          Visão geral em tempo real do escritório 2Type
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
        {kpis.map((k, i) => {
          const Icon = k.icon
          return (
            <div key={i} className="glass-card p-6" style={{ borderColor: k.border }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{k.label}</span>
                <div style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 10, padding: '8px', display: 'flex' }}>
                  <Icon size={18} color={k.color} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: k.color, marginBottom: 6 }}>
                {k.value}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{k.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent entries */}
        <div className="glass-card p-6">
          <h3 className="font-syne font-700 text-white mb-4" style={{ fontSize: 15 }}>Últimas Entradas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.faturamento.entradas.slice(0, 4).map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{e.cliente}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{e.descricao.substring(0, 28)}...</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                  +R$ {e.valor.toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team availability */}
        <div className="glass-card p-6">
          <h3 className="font-syne font-700 text-white mb-4" style={{ fontSize: 15 }}>Status da Equipe</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.equipe.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={m.foto} alt={m.nome} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{m.nome}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{m.cargo}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  background: m.status === 'disponível' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  color: m.status === 'disponível' ? '#10b981' : '#f59e0b',
                  border: `1px solid ${m.status === 'disponível' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                }}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
