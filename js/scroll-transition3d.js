/**
 * 2Type — Mapa de Serviços Interativo
 * Ícones Lucide · Tooltip nuvem · 60fps Canvas 2D · GSAP
 */
(function () {
  'use strict';

  /* ── Serviços ──────────────────────────────────────────── */
  const SERVICES = [
    {
      id: 'web', angle: -90,
      lucide: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
      title: 'Sistemas Web & Plataformas',
      tags: 'React · Next.js · Node.js',
      desc: 'Aplicações web robustas e escaláveis com as tecnologias mais modernas do mercado.',
    },
    {
      id: 'cloud', angle: -30,
      lucide: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>',
      title: 'Arquitetura Cloud',
      tags: 'AWS · Docker · Kubernetes',
      desc: 'Infraestrutura escalável na nuvem com CI/CD, alta disponibilidade e monitoramento 24/7.',
    },
    {
      id: 'mobile', angle: 30,
      lucide: '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/>',
      title: 'Aplicativos Mobile',
      tags: 'React Native · Flutter',
      desc: 'Apps nativos e híbridos para iOS e Android com experiências imersivas e alta performance.',
    },
    {
      id: 'erp', angle: 90,
      lucide: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
      title: 'ERPs & Dashboards B2B',
      tags: 'CRM · ERP · BI',
      desc: 'Sistemas de gestão customizados: financeiro, estoque, RH e dashboards analíticos completos.',
    },
    {
      id: 'ai', angle: 150,
      lucide: '<path d="M12 8V4H8"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M10.5 20.5 12 22l1.5-1.5"/><path d="M12 16v-4"/><path d="M4.929 7.929 3.515 6.515"/><path d="M19.071 7.929l1.414-1.414"/><circle cx="12" cy="14" r="2"/><path d="M5 14H3"/><path d="M19 14h2"/>',
      title: 'Automações & IA',
      tags: 'LLMs · n8n · Python',
      desc: 'Chatbots inteligentes, automações de processos e integrações com IA generativa.',
    },
    {
      id: 'api', angle: 210,
      lucide: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
      title: 'APIs & Integrações',
      tags: 'REST · GraphQL · Webhooks',
      desc: 'APIs de alta performance e integrações com ERPs, CRMs e sistemas legados.',
    },
  ];

  /* ── Estado ────────────────────────────────────────────── */
  let canvas, ctx, particles = [], rafId = null, running = false;
  let gsapTl = null, activeTooltip = null;
  let lastTime = 0;
  const FPS60 = 1000 / 60;

  /* ── Init ──────────────────────────────────────────────── */
  function init() {
    if (running) return;
    if (!window.gsap) { setTimeout(init, 100); return; }
    const wrap = document.getElementById('st3d-canvas-wrap');
    if (!wrap || wrap.clientWidth === 0) { setTimeout(init, 80); return; }
    running = true;
    _buildCanvas(wrap);
    _spawnParticles();
    _buildNodes();
    _startLoop();
    setTimeout(playEntrance, 150);
  }

  /* ── Canvas ────────────────────────────────────────────── */
  function _buildCanvas(wrap) {
    canvas = document.createElement('canvas');
    canvas.id = 'st3d-particle-canvas';
    Object.assign(canvas.style, {
      position: 'absolute', inset: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '1',
      willChange: 'transform',
    });
    wrap.appendChild(canvas);
    _resize();
    ctx = canvas.getContext('2d', { alpha: false });
    window.addEventListener('resize', _resize);
  }

  function _resize() {
    if (!canvas) return;
    canvas.width  = canvas.offsetWidth  || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;
  }

  /* ── Partículas ────────────────────────────────────────── */
  const COLORS = ['#8b5cf6','#6366f1','#4f8ef7','#22d3ee','#c084fc','#e879f9'];

  function _spawnParticles() {
    const N = window.innerWidth < 768 ? 100 : 200;
    particles = Array.from({ length: N }, (_, i) => _mkParticle(true));
  }

  function _mkParticle(random) {
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const angle = Math.random() * Math.PI * 2;
    const orbitR = 60 + Math.random() * Math.min(cx, cy) * 0.9;
    return {
      x: cx + (random ? (Math.random() - 0.5) * W * 0.8 : 0),
      y: cy + (random ? (Math.random() - 0.5) * H * 0.8 : 0),
      angle,
      orbitR,
      orbitSpeed: (0.0015 + Math.random() * 0.004) * (Math.random() > 0.5 ? 1 : -1),
      r: 0.8 + Math.random() * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 0.2 + Math.random() * 0.65,
      alphaDir: (Math.random() > 0.5 ? 1 : -1) * 0.006,
    };
  }

  /* ── Render loop 60fps ─────────────────────────────────── */
  function _startLoop() {
    function loop(ts) {
      if (!running) return;
      rafId = requestAnimationFrame(loop);
      const dt = ts - lastTime;
      if (dt < FPS60 - 1) return; // cap to 60fps
      lastTime = ts;
      _drawFrame();
      _tickLineDash(ts);
    }
    rafId = requestAnimationFrame(loop);
  }

  function _drawFrame() {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    // Clear with slight trail effect
    ctx.fillStyle = 'rgba(2,2,7,0.55)';
    ctx.fillRect(0, 0, W, H);

    // Central glow
    const burst = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(cx,cy)*0.38);
    burst.addColorStop(0, 'rgba(139,92,246,0.22)');
    burst.addColorStop(0.5,'rgba(79,142,247,0.08)');
    burst.addColorStop(1, 'transparent');
    ctx.fillStyle = burst;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(cx,cy)*0.38, 0, Math.PI*2);
    ctx.fill();

    // Particles
    ctx.save();
    particles.forEach(p => {
      p.angle += p.orbitSpeed;
      p.x = cx + Math.cos(p.angle) * p.orbitR;
      p.y = cy + Math.sin(p.angle) * p.orbitR;
      p.alpha += p.alphaDir;
      if (p.alpha > 0.9) p.alphaDir = -Math.abs(p.alphaDir);
      if (p.alpha < 0.1) p.alphaDir =  Math.abs(p.alphaDir);

      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grd.addColorStop(0, p.color);
      grd.addColorStop(1, 'transparent');

      ctx.globalAlpha = p.alpha * 0.9;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI*2);
      ctx.fill();

      ctx.globalAlpha = Math.min(p.alpha * 1.5, 1);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 0.45, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.restore();
  }

  let _dashOffset = 0;
  function _tickLineDash(ts) {
    _dashOffset = -(ts * 0.018) % 20;
    document.querySelectorAll('.st3d-line').forEach(l => {
      l.setAttribute('stroke-dashoffset', _dashOffset);
    });
  }

  /* ── Nós do mapa — zonas percentuais fixas ───────────── */
  function _buildNodes() {
    const map = document.getElementById('st3d-map');
    if (!map) return;
    map.innerHTML = '';

    const W = window.innerWidth;
    const H = window.innerHeight;

    /*
     * Layout dividido em 3 zonas fixas (% do viewport):
     *   ┌─────────────────────────────┐
     *   │  TOPO: 22%  (tagline)       │ ← navbar + eyebrow + título
     *   ├─────────────────────────────┤
     *   │  MAPA: 70%  (logo + nós)    │ ← centro e órbita aqui
     *   ├─────────────────────────────┤
     *   │  RODAPÉ: 8% (scroll cue)    │ ← indicador de scroll
     *   └─────────────────────────────┘
     * Garantia: nenhum nó pode cruzar para zona do tagline ou rodapé.
     */
    const ZONE_TOP = 0.22;  // 22% para tagline
    const ZONE_BOT = 0.08;  // 8% para scroll cue
    const ZONE_MAP = 1 - ZONE_TOP - ZONE_BOT;  // 70% para o mapa

    // Centro vertical do mapa: meio exato da zona de mapa
    const cy_px = (ZONE_TOP + ZONE_MAP * 0.50) * H;
    const cy    = cy_px / H * 100;  // em %

    // Raio vertical: metade da zona de mapa, com 10% de margem
    const ryMax_px = (ZONE_MAP / 2) * H * 0.82;
    const ryPx     = Math.max(ryMax_px, 50);
    const ry        = ryPx / H * 100;

    // Raio horizontal: proporcional, limitado pela largura
    const rxPx = Math.min(W * 0.27, ryPx * 1.6, 260);
    const rx    = rxPx / W * 100;

    // Sincroniza o logo com o centro calculado
    const logoEl = document.getElementById('st3d-logo-two');
    if (logoEl) logoEl.style.top = cy.toFixed(1) + '%';

    /* SVG layer */
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'st3d-svg-lines';
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    Object.assign(svg.style, {
      position: 'absolute', inset: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '2', overflow: 'visible',
    });

    // Gradient definition
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const lg = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    lg.id = 'st3d-lg1';
    [['0%', '#8b5cf6', '0.65'], ['100%', '#22d3ee', '0.12']].forEach(([offset, color, opacity]) => {
      const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop.setAttribute('offset', offset);
      stop.setAttribute('stop-color', color);
      stop.setAttribute('stop-opacity', opacity);
      lg.appendChild(stop);
    });
    defs.appendChild(lg);
    svg.appendChild(defs);
    map.appendChild(svg);

    const cx = 50; // horizontal: sempre centrado

    SERVICES.forEach(svc => {
      const rad = (svc.angle * Math.PI) / 180;
      const px  = cx + Math.cos(rad) * rx;
      const py  = cy + Math.sin(rad) * ry;

      /* Linha SVG */
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', cx.toFixed(2));
      line.setAttribute('y1', cy.toFixed(2));
      line.setAttribute('x2', px.toFixed(2));
      line.setAttribute('y2', py.toFixed(2));
      line.setAttribute('stroke', 'url(#st3d-lg1)');
      line.setAttribute('stroke-width', '0.4');
      line.setAttribute('stroke-dasharray', '1.4 1.6');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      line.classList.add('st3d-line');
      line.style.opacity = '0';
      svg.appendChild(line);

      /* Nó HTML */
      const node = document.createElement('div');
      node.className = 'st3d-node';
      node.dataset.id = svc.id;
      node.style.cssText = `
        left: ${px.toFixed(2)}%;
        top:  ${py.toFixed(2)}%;
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5);
        will-change: transform, opacity;
      `;

      node.innerHTML = `
        <div class="st3d-node-btn" aria-label="${svc.title}">
          <svg class="st3d-node-svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round">
            ${svc.lucide}
          </svg>
        </div>
        <span class="st3d-node-label">${svc.title.replace('&', '&amp;')}</span>
      `;

      const btn = node.querySelector('.st3d-node-btn');
      
      btn.addEventListener('click', e => {
        e.stopPropagation();
        _toggleTooltip(node, svc, px, py);
      });

      btn.addEventListener('mouseenter', () => {
        line.classList.add('active-hover');
      });

      btn.addEventListener('mouseleave', () => {
        line.classList.add('fade-out'); // Ensure opacity animates smoothly 
        line.classList.remove('active-hover');
        setTimeout(() => line.classList.remove('fade-out'), 400);
      });

      map.appendChild(node);
    });

    /* Fechar tooltip ao clicar fora */
    document.addEventListener('click', _closeTooltip);
  }

  /* ── Tooltip nuvem ─────────────────────────────────────── */
  function _toggleTooltip(node, svc, px, py) {
    if (activeTooltip && activeTooltip.svcId === svc.id) {
      _closeTooltip();
      return;
    }
    _closeTooltip();
    _openTooltip(node, svc, px, py);
  }

  function _openTooltip(node, svc, px, py) {
    const map = document.getElementById('st3d-map');
    if (!map) return;

    // Determinar lado para exibir (left/right baseado no ângulo)
    const onLeft = px < 46;

    const tip = document.createElement('div');
    tip.id = 'st3d-tooltip';
    tip.className = `st3d-tooltip ${onLeft ? 'st3d-tip-right' : 'st3d-tip-left'}`;
    tip.style.cssText = `
      left:${px}%;top:${py}%;
      transform:translate(${onLeft ? '10px' : 'calc(-100% - 10px)'},-50%);
      will-change:transform,opacity;
    `;

    tip.innerHTML = `
      <div class="st3d-tip-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          ${svc.lucide}
        </svg>
      </div>
      <div class="st3d-tip-body">
        <div class="st3d-tip-title">${svc.title.replace('&','&amp;')}</div>
        <div class="st3d-tip-tags">${svc.tags}</div>
        <p class="st3d-tip-desc">${svc.desc}</p>
      </div>
      <button class="st3d-tip-close" aria-label="Fechar">✕</button>
    `;

    tip.querySelector('.st3d-tip-close').addEventListener('click', e => {
      e.stopPropagation();
      _closeTooltip();
    });

    map.appendChild(tip);
    activeTooltip = { el: tip, svcId: svc.id };

    // Mark node active
    document.querySelectorAll('.st3d-node').forEach(n => n.classList.remove('active'));
    node.classList.add('active');

    // GSAP entrance
    const xFrom = onLeft ? -16 : 16;
    gsap.fromTo(tip,
      { opacity: 0, x: xFrom, scale: 0.9 },
      { opacity: 1, x: 0,     scale: 1,   duration: 0.3, ease: 'back.out(1.6)', clearProps:'scale' }
    );
  }

  function _closeTooltip() {
    if (!activeTooltip) return;
    const el = activeTooltip.el;
    activeTooltip = null;
    document.querySelectorAll('.st3d-node').forEach(n => n.classList.remove('active'));
    gsap.to(el, {
      opacity: 0, scale: 0.88, duration: 0.22, ease:'power2.in',
      onComplete: () => el.parentNode && el.parentNode.removeChild(el),
    });
  }

  /* ── Entrada GSAP ──────────────────────────────────────── */
  function playEntrance() {
    const logo   = document.getElementById('st3d-logo-two');
    const nodes  = document.querySelectorAll('.st3d-node');
    const lines  = document.querySelectorAll('.st3d-line');
    const tagline= document.querySelector('.st3d-tagline');
    if (!logo) return;

    const tl = gsap.timeline({ defaults: { ease:'power3.out' } });
    gsapTl = tl;

    tl.fromTo(tagline, { opacity:0, y:-18 }, { opacity:1, y:0, duration:0.55 }, 0);
    tl.fromTo(logo,
      { opacity:0, scale:0.2, filter:'blur(18px)' },
      { opacity:1, scale:1,   filter:'blur(0px)', duration:0.9, ease:'back.out(1.5)' },
      0.15
    );
    tl.to(lines, { opacity:0.65, duration:0.45, stagger:0.06 }, 0.8);
    nodes.forEach((n, i) => {
      tl.to(n, { opacity:1, scale:1, duration:0.45, ease:'back.out(1.6)' }, 0.85 + i * 0.1);
    });
  }

  /* ── Destroy ───────────────────────────────────────────── */
  function destroy() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (gsapTl) { gsapTl.kill(); gsapTl = null; }
    document.removeEventListener('click', _closeTooltip);
    window.removeEventListener('resize', _resize);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null; ctx = null; particles = [];
    const map = document.getElementById('st3d-map');
    if (map) map.innerHTML = '';
    activeTooltip = null;
    lastTime = 0;
  }

  window.ST3D = { init, destroy };
})();
