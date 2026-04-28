'use client'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export default function LucroTab({ faturamento, custos }) {
  const totalFat = faturamento.entradas.reduce((s, e) => s + e.valor, 0)
  const totalCust = custos.reduce((s, c) => s + c.valor, 0)
  const lucro = totalFat - totalCust
  const margem = totalFat > 0 ? (lucro / totalFat) * 100 : 0
  const isPositive = lucro >= 0

  const faturamentoPorCliente = faturamento.entradas.reduce((acc, e) => {
    acc[e.cliente] = (acc[e.cliente] || 0) + e.valor
    return acc
  }, {})

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="font-syne text-3xl font-extrabold text-white mb-1">Lucro</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Resultado líquido: Faturamento − Custos</p>
      </div>

      {/* Main Lucro Card */}
      <div className="glass-card p-10 mb-6 text-center glow-purple" style={{
        borderColor: isPositive ? 'rgba(139,92,246,0.35)' : 'rgba(239,68,68,0.35)',
        background: isPositive ? 'rgba(139,92,246,0.06)' : 'rgba(239,68,68,0.06)',
      }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
          Lucro Líquido do Mês
        </div>
        <div className="font-syne" style={{ fontSize: 64, fontWeight: 800, color: isPositive ? '#8b5cf6' : '#ef4444', lineHeight: 1 }}>
          R$ {Math.abs(lucro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>
          {isPositive ? '📈 Resultado positivo' : '📉 Resultado negativo'}
          {' · '}Margem: <strong style={{ color: isPositive ? '#8b5cf6' : '#ef4444' }}>{margem.toFixed(1)}%</strong>
        </div>

        {/* Progress bar */}
        <div style={{ margin: '24px auto 0', maxWidth: 400 }}>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(margem, 100)}%`, background: isPositive ? 'linear-gradient(90deg, #8b5cf6, #6366f1)' : '#ef4444', borderRadius: 8, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            <span>0%</span><span>Margem atual: {margem.toFixed(1)}%</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* Breakdown Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="glass-card p-6" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ background: 'rgba(16,185,129,0.12)', borderRadius: 10, padding: 8 }}>
              <TrendingUp size={20} color="#10b981" />
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Faturamento</span>
          </div>
          <div className="kpi-value" style={{ color: '#10b981' }}>
            R$ {totalFat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-card p-6" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ background: 'rgba(239,68,68,0.12)', borderRadius: 10, padding: 8 }}>
              <TrendingDown size={20} color="#ef4444" />
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Custos Totais</span>
          </div>
          <div className="kpi-value" style={{ color: '#ef4444' }}>
            R$ {totalCust.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Revenue by Client */}
      <div className="glass-card p-6">
        <h3 className="font-syne font-700 text-white mb-4" style={{ fontSize: 15 }}>Faturamento por Cliente</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(faturamentoPorCliente)
            .sort((a, b) => b[1] - a[1])
            .map(([cliente, valor], i) => {
              const pct = totalFat > 0 ? (valor / totalFat) * 100 : 0
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>{cliente}</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>R$ {valor.toLocaleString('pt-BR')} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#10b981,#059669)', borderRadius: 4 }} />
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
