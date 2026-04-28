'use client'
import { useState, useEffect } from 'react'
import ParticlesCanvas from '@/components/ParticlesCanvas'
import Sidebar from '@/components/Sidebar'
import DashboardTab    from '@/components/tabs/DashboardTab'
import EquipeTab       from '@/components/tabs/EquipeTab'
import FaturamentoTab  from '@/components/tabs/FaturamentoTab'
import CustosTab       from '@/components/tabs/CustosTab'
import LucroTab        from '@/components/tabs/LucroTab'
import ProjetosTab     from '@/components/tabs/ProjetosTab'
import SolicitacoesTab from '@/components/tabs/SolicitacoesTab'
import SuporteTab      from '@/components/tabs/SuporteTab'

// ── MOCK DATA ──────────────────────────────────────────────────────────────────
const INITIAL_DATA = {
  equipe: [
    { id: 1, nome: 'Marcos Rodrigues', cargo: 'Engenharia & Arquitetura',  foto: '/admin/team/marcos.jpg',   status: 'em projeto',  habilidades: ['Python', '.NET', 'AWS', 'IoT', 'Arduino'] },
    { id: 2, nome: 'Filipe Andrade',   cargo: 'Fullstack & UI/UX',         foto: '/admin/team/filipe.jpg',   status: 'em projeto',  habilidades: ['React', 'Next.js', 'Node.js', 'Figma']    },
    { id: 3, nome: 'Henrique Sampaio', cargo: 'UI/UX & Marketing Digital', foto: '/admin/team/henrique.jpg', status: 'disponível',  habilidades: ['UI/UX', 'Figma', 'Google Ads', 'SEO']     },
    { id: 4, nome: 'Davi Borges',      cargo: 'Fullstack & Automação',     foto: '/admin/team/davi.jpg',     status: 'em projeto',  habilidades: ['Fullstack', '.NET', 'N8N', 'Power Apps']  },
  ],
  faturamento: {
    entradas: [
      { id: 1, descricao: 'App Mobile Delivery — V2.0',    valor: 18000, data: '2025-04-15', cliente: 'Logística Express' },
      { id: 2, descricao: 'CRM Web Corporativo',           valor: 12500, data: '2025-04-10', cliente: 'Grupo MedCorp'    },
      { id: 3, descricao: 'Core Banking API Integration',  valor: 9500,  data: '2025-04-05', cliente: 'Fintech Alpha'    },
      { id: 4, descricao: 'Dashboard BI Metabase',         valor: 8500,  data: '2025-03-28', cliente: 'B2B SaaS Co.'    },
    ],
  },
  custos: [
    { id: 1, item: 'AWS EC2 + RDS',      categoria: 'Infraestrutura', valor: 1200, data: '2025-04-01' },
    { id: 2, item: 'Vercel Pro',          categoria: 'Deploy',         valor: 200,  data: '2025-04-01' },
    { id: 3, item: 'GitHub Team',         categoria: 'Ferramentas',    valor: 120,  data: '2025-04-01' },
    { id: 4, item: 'Figma Organization', categoria: 'Design',         valor: 360,  data: '2025-04-01' },
    { id: 5, item: 'Google Workspace',   categoria: 'Produtividade',  valor: 180,  data: '2025-04-01' },
    { id: 6, item: 'Jira + Confluence',  categoria: 'Gestão',         valor: 240,  data: '2025-04-01' },
  ],
  projetos: [
    { id: 1, nome: 'App Mobile Delivery V2.0',    cliente: 'Logística Express', data: '2025-04-15', dev: 'Davi Borges',      status: 'Concluído',   valor: 18000 },
    { id: 2, nome: 'CRM Web Corporativo',         cliente: 'Grupo MedCorp',    data: '2025-04-10', dev: 'Filipe Andrade',   status: 'Em Dev',      valor: 12500 },
    { id: 3, nome: 'Core Banking API',            cliente: 'Fintech Alpha',    data: '2025-04-05', dev: 'Marcos Rodrigues', status: 'Concluído',   valor: 9500  },
    { id: 4, nome: 'Dashboard BI Metabase',       cliente: 'B2B SaaS Co.',    data: '2025-03-28', dev: 'Davi Borges',      status: 'Concluído',   valor: 8500  },
    { id: 5, nome: 'Sistema de Agendamento IA',   cliente: 'Grupo MedCorp',   data: '2025-05-10', dev: 'Filipe Andrade',   status: 'Planejamento',valor: 14000 },
  ],
  solicitacoes: [],
}
// ──────────────────────────────────────────────────────────────────────────────

const LS_KEY_REQUESTS = 'nexcore_requests'

export default function AdminPage() {
  const [authed,     setAuthed]     = useState(false)
  const [role,       setRole]       = useState(null)
  const [loginForm,  setLoginForm]  = useState({ user: '', pass: '', error: '' })
  const [activeTab,  setActiveTab]  = useState('dashboard')
  const [data,       setData]       = useState(INITIAL_DATA)
  const [supportCount, setSupportCount] = useState(0)

  // Count open support tickets
  const refreshSupportCount = () => {
    try {
      const tickets = JSON.parse(localStorage.getItem('nexcore_support_tickets') || '[]')
      setSupportCount(tickets.filter(t => t.status === 'aberto').length)
    } catch {}
  }

  // ── Lê do localStorage do site principal na montagem ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_REQUESTS)
      if (raw) {
        const requests = JSON.parse(raw)
        if (Array.isArray(requests) && requests.length > 0) {
          setData(prev => ({ ...prev, solicitacoes: requests }))
        }
      }
    } catch (_) { /* ignora erros de parse */ }

    refreshSupportCount()

    // Escuta atualizações em tempo real
    const onStorage = e => {
      if (e.key === LS_KEY_REQUESTS) {
        try {
          const requests = JSON.parse(e.newValue || '[]')
          setData(prev => ({ ...prev, solicitacoes: requests }))
        } catch (_) {}
      }
      if (e.key === 'nexcore_support_tickets' || e.key === 'nexcore_support_ping') {
        refreshSupportCount()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ── Salva solicitações no localStorage sempre que mudarem ──
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY_REQUESTS, JSON.stringify(data.solicitacoes))
    } catch (_) {}
  }, [data.solicitacoes])

  // ── LOGIN ──
  const handleLogin = e => {
    e?.preventDefault()
    if (loginForm.user === 'admin@twotype.com' && loginForm.pass === 'admin123') {
      setAuthed(true)
      setRole('admin')
    } else if (loginForm.user === 'colaborador@twotype.com' && loginForm.pass === 'colab123') {
      setAuthed(true)
      setRole('colaborador')
    } else {
      setLoginForm(f => ({ ...f, error: 'Credenciais inválidas. Tente admin@twotype.com / admin123 ou colaborador@twotype.com / colab123' }))
    }
  }

  // ── DATA MUTATIONS ──
  const addEquipe = member =>
    setData(d => ({ ...d, equipe: [...d.equipe, { ...member, id: Date.now() }] }))

  const addFaturamento = entry =>
    setData(d => ({ ...d, faturamento: { ...d.faturamento, entradas: [entry, ...d.faturamento.entradas] } }))

  const addCusto = custo =>
    setData(d => ({ ...d, custos: [custo, ...d.custos] }))

  const addProjeto = projeto =>
    setData(d => ({ ...d, projetos: [projeto, ...d.projetos] }))

  const addSolicitacao = sol =>
    setData(d => ({ ...d, solicitacoes: [sol, ...d.solicitacoes] }))

  const approveSolicitacao = (id, updates) => {
    setData(d => ({
      ...d,
      solicitacoes: d.solicitacoes.map(s =>
        s.id === id ? { ...s, status: 'execucao', ...updates } : s
      ),
    }))
  }

  const pendingCount = role === 'colaborador' ? 0 : data.solicitacoes.filter(s => s.status === 'novo').length

  // ── RENDER: LOGIN ──
  if (!authed) {
    return (
      <>
        <ParticlesCanvas />
        <div style={{ position: 'relative', zIndex: 10, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-strong" style={{ borderRadius: 24, padding: 48, width: '100%', maxWidth: 420, border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <img src="/admin/logo-icon.png" alt="2Type" style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'contain', margin: '0 auto 16px' }} onError={e => { e.target.style.display = 'none' }} />
              <div className="font-syne" style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>2Type</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Painel Administrativo</div>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>E-mail</label>
                <input
                  className="glass-input"
                  type="email"
                  placeholder="admin@twotype.com"
                  value={loginForm.user}
                  onChange={e => setLoginForm(f => ({ ...f, user: e.target.value, error: '' }))}
                  autoComplete="username"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Senha</label>
                <input
                  className="glass-input"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.pass}
                  onChange={e => setLoginForm(f => ({ ...f, pass: e.target.value, error: '' }))}
                  autoComplete="current-password"
                />
              </div>
              {loginForm.error && (
                <div style={{ fontSize: 12, color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px' }}>
                  {loginForm.error}
                </div>
              )}
              <button type="submit" className="btn-primary" style={{ marginTop: 8, padding: '14px', fontSize: 15 }}>
                Entrar no Painel
              </button>
            </form>

            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
              Demo: admin@twotype.com / admin123<br />
              Colab: colaborador@twotype.com / colab123
            </div>

            <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              ← Voltar ao site principal
            </a>
          </div>
        </div>
      </>
    )
  }

  // ── RENDER: DASHBOARD ──
  const tabProps = {
    dashboard:    { component: DashboardTab,    props: { data, role } },
    equipe:       { component: EquipeTab,       props: { equipe: data.equipe, onAdd: addEquipe, role } },
    faturamento:  { component: FaturamentoTab,  props: { faturamento: data.faturamento, onAdd: addFaturamento, role } },
    custos:       { component: CustosTab,       props: { custos: data.custos, onAdd: addCusto, role } },
    lucro:        { component: LucroTab,        props: { faturamento: data.faturamento, custos: data.custos, role } },
    projetos:     { component: ProjetosTab,     props: { projetos: data.projetos, equipe: data.equipe, onAdd: addProjeto, role } },
    solicitacoes: { component: SolicitacoesTab, props: { solicitacoes: data.solicitacoes, onAdd: addSolicitacao, onApprove: approveSolicitacao, role, currentColab: loginForm.user.split('@')[0] } },
    suporte:      { component: SuporteTab,      props: {} },
  }

  const { component: TabComponent, props: tabSpecificProps } = tabProps[activeTab]

  return (
    <>
      <ParticlesCanvas />
      <div style={{ position: 'relative', zIndex: 10, height: '100vh', display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={pendingCount}
          supportCount={supportCount}
          onLogout={() => { setAuthed(false); setRole(null); setLoginForm({ user: '', pass: '', error: '' }) }}
          role={role}
          userEmail={loginForm.user}
        />

        {/* Main Content */}
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="content-scroll">
            <TabComponent {...tabSpecificProps} />
          </div>
        </main>
      </div>
    </>
  )
}
