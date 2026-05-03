'use client'
import { LayoutDashboard, Users, DollarSign, TrendingDown, TrendingUp, FolderOpen, Inbox, Headphones, LogOut, ClipboardCheck } from 'lucide-react'

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'equipe',       label: 'Equipe',               icon: Users },
  { id: 'faturamento',  label: 'Faturamento',          icon: DollarSign },
  { id: 'custos',       label: 'Custos',               icon: TrendingDown },
  { id: 'lucro',        label: 'Lucro',                icon: TrendingUp },
  { id: 'projetos',     label: 'Projetos Realizados',  icon: FolderOpen },
  { id: 'solicitacoes', label: 'Solicitações',         icon: Inbox },
  { id: 'analise',      label: 'Análise de Entregas',  icon: ClipboardCheck },
  { id: 'suporte',      label: 'Suporte',              icon: Headphones },
]

export default function Sidebar({ activeTab, setActiveTab, pendingCount, supportCount, onLogout, role, userEmail }) {
  const visibleNav = NAV.filter(item => {
    if (role === 'colaborador') {
      return ['dashboard', 'equipe', 'projetos', 'solicitacoes'].includes(item.id)
    }
    return true
  })
  return (
    <aside className="sidebar" style={{ width: 240, minWidth: 240, height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/admin/logo-icon.png" alt="2Type" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
          <div>
            <div className="font-syne" style={{ fontSize: 18, fontWeight: 800, color: 'white', lineHeight: 1 }}>2Type</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin Panel</div>
          </div>
        </a>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>
          Menu
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {visibleNav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`nav-item ${activeTab === id ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Icon size={17} />
              <span style={{ flex: 1 }}>{label}</span>
              {id === 'solicitacoes' && pendingCount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, minWidth: 20, height: 20, borderRadius: 10,
                  background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 6px',
                }} className="badge-pulse">
                  {pendingCount}
                </span>
              )}
              {id === 'suporte' && supportCount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, minWidth: 20, height: 20, borderRadius: 10,
                  background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 6px',
                }} className="badge-pulse">
                  {supportCount}
                </span>
              )}
              {id === 'analise' && pendingCount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, minWidth: 20, height: 20, borderRadius: 10,
                  background: '#22d3ee', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 6px',
                }} className="badge-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize' }}>{role}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', wordBreak: 'break-all' }}>{userEmail}</div>
        </div>
        <button
          onClick={onLogout}
          className="nav-item"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.7)' }}
        >
          <LogOut size={16} />
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </aside>
  )
}
