/* ═══════════════════════════════════════════════════════
   2TYPE — CINEMATIC ENGINE v4.0
   GPU-first | 60fps | Holograms | Mockup Showcase
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const isMobile = () => window.innerWidth <= 768;
  const raf = requestAnimationFrame;

  /* ─────────────────────────────────────────────
     1. SCROLL PROGRESS BAR
  ───────────────────────────────────────────── */
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.prepend(bar);
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${total > 0 ? Math.min(window.scrollY / total, 1) : 0})`;
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────
     2. BLOBS
  ───────────────────────────────────────────── */
  function initBlobs() {
    if (document.querySelector('.blob-container')) return;
    const wrap = document.createElement('div');
    wrap.className = 'blob-container';
    wrap.innerHTML =
      '<div class="blob blob-1"></div>' +
      '<div class="blob blob-2"></div>' +
      '<div class="blob blob-3"></div>';
    document.body.appendChild(wrap);
  }

  /* ─────────────────────────────────────────────
     3. FLOATING ICONS (desktop)
  ───────────────────────────────────────────── */
  const FLOAT_ICONS = [
    { lucide: 'zap',              label: 'Performance',  color: '#5b6af7' },
    { lucide: 'bot',              label: 'IA & ML',      color: '#8b5cf6' },
    { lucide: 'smartphone',       label: 'Mobile',       color: '#06b6d4' },
    { lucide: 'waypoints',        label: 'APIs',         color: '#5b6af7' },
    { lucide: 'cloud',            label: 'Cloud',        color: '#8b5cf6' },
    { lucide: 'shield-check',     label: 'Segurança',    color: '#10b981' },
    { lucide: 'layout-dashboard', label: 'ERP',          color: '#5b6af7' },
    { lucide: 'palette',          label: 'UI/UX',        color: '#f59e0b' },
  ];
  const POSITIONS = [
    { top:'14%', left:'4%'  }, { top:'10%', left:'84%' },
    { top:'36%', left:'2%'  }, { top:'32%', left:'88%' },
    { top:'58%', left:'4%'  }, { top:'56%', left:'87%' },
    { top:'74%', left:'8%'  }, { top:'70%', left:'83%' },
  ];

  function initFloatingIcons() {
    const home = document.getElementById('home');
    if (!home || isMobile()) return;
    let wrap = home.querySelector('.hero-float-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'hero-float-wrap'; home.prepend(wrap); }
    else wrap.innerHTML = '';
    FLOAT_ICONS.forEach((icon, i) => {
      const pos = POSITIONS[i];
      const el = document.createElement('div');
      el.className = 'hero-float-icon';
      el.title = icon.label;
      el.style.cssText = `top:${pos.top};left:${pos.left};--dur:${5+i*0.6}s;--delay:${i*0.35}s;--icon-color:${icon.color};`;
      el.innerHTML = `<i data-lucide="${icon.lucide}" class="fi-icon"></i><span class="fi-label">${icon.label}</span>`;
      wrap.appendChild(el);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  /* ─────────────────────────────────────────────
     4. HERO MOCKUP SHOWCASE
     Full-width scroll bait section with real
     product screenshots
  ───────────────────────────────────────────── */
  const SHOWCASE_ITEMS = [
    {
      tag:   'ERP & Dashboards',
      title: 'Controle total do seu negócio',
      desc:  'Sistemas de gestão customizados com KPIs em tempo real, relatórios automatizados e painéis gerenciais que transformam dados em decisões.',
      img:   'assets/img/mockup_erp.png',
      accent: '#5b6af7',
      icon:  'layout-dashboard',
      badges: ['ERP', 'CRM', 'BI', 'Dashboards'],
    },
    {
      tag:   'Apps Mobile Premium',
      title: 'Apps nativos que encantam',
      desc:  'Aplicativos iOS e Android com performance nativa, design fluido e experiências que convertem usuários em clientes fiéis.',
      img:   'assets/img/mockup_mobile.png',
      accent: '#8b5cf6',
      icon:  'smartphone',
      badges: ['Flutter', 'React Native', 'iOS', 'Android'],
    },
    {
      tag:   'IA & Automação',
      title: 'Inteligência que trabalha por você',
      desc:  'Chatbots inteligentes, fluxos de automação e integrações com OpenAI que eliminam tarefas manuais e multiplicam a produtividade.',
      img:   'assets/img/mockup_ai.png',
      accent: '#06b6d4',
      icon:  'bot',
      badges: ['OpenAI', 'n8n', 'WhatsApp', 'Stripe'],
    },
    {
      tag:   'Plataformas Web & CRM',
      title: 'Sistemas que escalam com você',
      desc:  'Portais corporativos, CRMs e plataformas SaaS com arquitetura robusta, autenticação segura e interface que a sua equipe vai amar.',
      img:   'assets/img/mockup_web.png',
      accent: '#10b981',
      icon:  'globe',
      badges: ['React', 'Next.js', 'Node.js', 'PostgreSQL'],
    },
    {
      tag:   'APIs & Integrações',
      title: 'Conecte tudo ao seu ecossistema',
      desc:  'APIs REST e GraphQL de alta performance, monitoramento em tempo real e integração com qualquer serviço: Stripe, AWS, Google, Twilio e mais.',
      img:   'assets/img/mockup_api.png',
      accent: '#f59e0b',
      icon:  'waypoints',
      badges: ['REST', 'GraphQL', 'WebSocket', 'OAuth'],
    },
    {
      tag:   'Cloud & DevOps',
      title: 'Infraestrutura que não para',
      desc:  '99.9% de uptime garantido com arquitetura em nuvem, CI/CD automatizado, Kubernetes e monitoramento proativo 24 horas por dia.',
      img:   'assets/img/mockup_cloud.png',
      accent: '#5b6af7',
      icon:  'cloud',
      badges: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
    },
  ];

  function buildShowcaseItem(item, idx) {
    const isEven = idx % 2 === 1;
    return `
      <div class="showcase-item ${isEven ? 'showcase-item--reverse' : ''} reveal" style="--showcase-accent:${item.accent};">
        <!-- TEXT SIDE -->
        <div class="showcase-text ${isEven ? 'reveal-right' : 'reveal-left'}">
          <div class="showcase-tag">
            <i data-lucide="${item.icon}" class="showcase-tag-icon"></i>
            ${item.tag}
          </div>
          <h3 class="showcase-title">${item.title}</h3>
          <p class="showcase-desc">${item.desc}</p>
          <div class="showcase-badges">
            ${item.badges.map(b => `<span class="showcase-badge">${b}</span>`).join('')}
          </div>
          <button class="showcase-cta btn-hero" onclick="showSection('request')">
            Quero isso para meu negócio →
          </button>
        </div>

        <!-- IMAGE SIDE -->
        <div class="showcase-img-wrap reveal-scale">
          <!-- Hologram frame decorations -->
          <div class="holo-frame">
            <div class="holo-corner holo-corner--tl"></div>
            <div class="holo-corner holo-corner--tr"></div>
            <div class="holo-corner holo-corner--bl"></div>
            <div class="holo-corner holo-corner--br"></div>
            <div class="holo-scan-line"></div>
            <div class="holo-glow" style="background:radial-gradient(ellipse,${item.accent}44,transparent 70%);"></div>
          </div>
          <div class="showcase-img-inner">
            <img src="${item.img}" alt="${item.title}" class="showcase-img" loading="lazy">
            <!-- Reflection shimmer -->
            <div class="showcase-img-shimmer"></div>
          </div>
          <!-- Floating tech badge -->
          <div class="showcase-float-badge" style="--badge-color:${item.accent};">
            <i data-lucide="${item.icon}"></i>
            <span>${item.tag}</span>
          </div>
        </div>
      </div>
    `;
  }

  function injectShowcaseSection() {
    const home = document.getElementById('home');
    if (!home || home.querySelector('.showcase-section')) return;

    // Remove old simple cards if present
    const oldCards = home.querySelector('.hero-services-section');
    if (oldCards) oldCards.remove();

    const section = document.createElement('div');
    section.className = 'showcase-section';
    section.innerHTML = `
      <div class="showcase-header reveal">
        <div class="section-eyebrow">O que a 2Type constrói</div>
        <h2 class="showcase-header-title">
          Soluções que <em class="text-gradient-animate">impressionam</em>
        </h2>
        <p class="showcase-header-sub">
          Cada projeto é único. Veja o que já entregamos e imagine o que podemos criar para você.
        </p>
      </div>
      <div class="showcase-list">
        ${SHOWCASE_ITEMS.map((item, i) => buildShowcaseItem(item, i)).join('')}
      </div>
    `;

    const strip = home.querySelector('.features-strip');
    if (strip) home.insertBefore(section, strip);
    else home.appendChild(section);

    if (window.lucide) window.lucide.createIcons();
  }

  /* ─────────────────────────────────────────────
     5. TECH MARQUEE
  ───────────────────────────────────────────── */
  const TECH_STACK = [
    'React','Next.js','Node.js','Python','Flutter','React Native',
    'PostgreSQL','MongoDB','Docker','AWS','Kubernetes','OpenAI',
    'GraphQL','REST API','TypeScript','.NET','n8n','Vercel',
    'Redis','Stripe API','Power Apps','Firebase','Supabase','Figma'
  ];

  function injectTechMarquee() {
    const services = document.getElementById('services');
    if (!services || services.querySelector('.tech-marquee-section')) return;
    const doubled = [...TECH_STACK, ...TECH_STACK];
    const badges = doubled.map(t => `<span class="tech-badge"><span class="tech-dot"></span>${t}</span>`).join('');
    const section = document.createElement('div');
    section.className = 'tech-marquee-section reveal';
    section.innerHTML = `<div class="tech-marquee-label">Stack tecnológico utilizado</div><div class="tech-marquee-track">${badges}</div>`;
    const inner = services.querySelector('div');
    if (inner) inner.appendChild(section);
  }

  /* ─────────────────────────────────────────────
     6. SCROLL REVEAL
  ───────────────────────────────────────────── */
  function initScrollReveal() {
    const sel = '.animate-hidden,.service-card,.feature-card,.process-step,.member-card,.reveal,.reveal-left,.reveal-right,.reveal-scale';
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('visible');
        if (el.classList.contains('animate-hidden')) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }
        obs.unobserve(el);
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll(sel).forEach(el => obs.observe(el));
  }

  /* ─────────────────────────────────────────────
     7. 3D TILT
  ───────────────────────────────────────────── */
  function initCardTilt() {
    if (isMobile()) return;
    function applyTilt(card) {
      let tx = 0, ty = 0, cx = 0, cy = 0, rid = null;
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        tx = ((e.clientY - r.top) / r.height - 0.5) * -9;
        ty = ((e.clientX - r.left) / r.width - 0.5) * 9;
        card.style.setProperty('--mouse-x', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--mouse-y', ((e.clientY - r.top) / r.height * 100) + '%');
        if (!rid) anim();
      });
      card.addEventListener('mouseleave', () => { tx = 0; ty = 0; });
      function anim() {
        cx += (tx - cx) * 0.1;
        cy += (ty - cy) * 0.1;
        card.style.transform = `perspective(900px) rotateX(${cx}deg) rotateY(${cy}deg)`;
        const done = Math.abs(tx-cx) < 0.01 && Math.abs(ty-cy) < 0.01;
        rid = done ? (card.style.transform = '', null) : raf(anim);
      }
    }
    document.querySelectorAll('.service-card,.member-card,.hss-card').forEach(applyTilt);
  }

  /* ─────────────────────────────────────────────
     8. COUNTING NUMBERS
  ───────────────────────────────────────────── */
  function initCounters() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting || en.target.dataset.counted) return;
        en.target.dataset.counted = '1';
        const el = en.target;
        const target = +el.dataset.target;
        const inner = el.querySelector('span') || el;
        const t0 = performance.now(), dur = 1600;
        (function step(now) {
          const p = Math.min((now-t0)/dur, 1);
          const suffix = el.dataset.suffix || '';
          inner.textContent = Math.round((p===1?1:1-Math.pow(2,-10*p)) * target) + suffix;
          if (p < 1) raf(step);
        })(t0);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.roulette[data-target]').forEach(el => obs.observe(el));
  }

  /* ─────────────────────────────────────────────
     9. MAGNETIC BUTTONS
  ───────────────────────────────────────────── */
  function initMagneticButtons() {
    if (isMobile()) return;
    document.querySelectorAll('.btn-hero,.btn-primary').forEach(btn => {
      btn.classList.add('btn-magnetic');
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX-(r.left+r.width/2))*0.2}px,${(e.clientY-(r.top+r.height/2))*0.2}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ─────────────────────────────────────────────
     10. CANVAS PARTICLES
  ───────────────────────────────────────────── */
  function initHeroCanvas() {
    const home = document.getElementById('home');
    if (!home) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'hero-canvas';
    home.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], animId, active = true;
    const COUNT = isMobile() ? 35 : 90;
    const MAX_D = isMobile() ? 0 : 65;

    function resize() { W = canvas.width = home.offsetWidth; H = canvas.height = home.offsetHeight; }
    class P {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random()*W; this.y = Math.random()*H;
        this.r = Math.random()*1.2+0.3;
        this.vx = (Math.random()-.5)*.22; this.vy = (Math.random()-.5)*.22;
        this.a = Math.random()*.35+0.08;
        this.c = Math.random()>.5?'91,106,247':'139,92,246';
      }
      tick() { this.x+=this.vx; this.y+=this.vy; if(this.x<0||this.x>W||this.y<0||this.y>H) this.reset(); }
      draw() { ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,6.28); ctx.fillStyle=`rgba(${this.c},${this.a})`; ctx.fill(); }
    }

    function loop() {
      if (!active) return;
      ctx.clearRect(0,0,W,H);
      for (let i=0;i<particles.length;i++) {
        particles[i].tick(); particles[i].draw();
        if (MAX_D>0) for (let j=i+1;j<particles.length;j++) {
          const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y, d2=dx*dx+dy*dy;
          if (d2<MAX_D*MAX_D) {
            ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y);
            ctx.strokeStyle=`rgba(139,92,246,${(1-d2/(MAX_D*MAX_D))*0.09})`; ctx.lineWidth=.4; ctx.stroke();
          }
        }
      }
      animId = raf(loop);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { active=false; cancelAnimationFrame(animId); }
      else { active=true; loop(); }
    });
    new MutationObserver(() => {
      if (home.classList.contains('active')) { active=true; loop(); }
      else { active=false; cancelAnimationFrame(animId); }
    }).observe(home, { attributes:true, attributeFilter:['class'] });
    window.addEventListener('resize', resize, { passive:true });
    resize();
    particles = Array.from({ length: COUNT }, () => new P());
    loop();
  }

  /* ─────────────────────────────────────────────
     11. TYPEWRITER
  ───────────────────────────────────────────── */
  function initTypewriter() {
    const em = document.querySelector('.hero-title em');
    if (!em) return;
    const words = ['transforma','acelera','escala','evolui','conecta'];
    let wi=0, ci=0, del=false;
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    em.parentNode.insertBefore(cursor, em.nextSibling);
    function tick() {
      const w = words[wi];
      if (!del) { em.textContent=w.slice(0,++ci); if(ci===w.length){del=true;return setTimeout(tick,1900);} setTimeout(tick,95); }
      else { em.textContent=w.slice(0,--ci); if(ci===0){del=false;wi=(wi+1)%words.length;return setTimeout(tick,380);} setTimeout(tick,50); }
    }
    setTimeout(tick, 1800);
  }

  /* ─────────────────────────────────────────────
     12. HERO PARALLAX (desktop)
  ───────────────────────────────────────────── */
  function initHeroParallax() {
    if (isMobile()) return;
    const home = document.getElementById('home');
    if (!home) return;
    let mx=0, my=0, pending=false;
    home.addEventListener('mousemove', e => {
      mx = e.clientX/window.innerWidth-.5;
      my = e.clientY/window.innerHeight-.5;
      if (!pending) { pending=true; raf(() => {
        const orb = home.querySelector('.hero-orb');
        if(orb) orb.style.transform=`translateX(calc(-50% + ${mx*26}px)) translateY(${my*16}px)`;
        home.querySelectorAll('.hero-float-icon').forEach((el,i)=>{
          const d=.25+(i%3)*.15;
          el.style.translate=`${mx*18*d}px ${my*14*d}px`;
        });
        pending=false;
      }); }
    }, { passive:true });
  }

  /* ─────────────────────────────────────────────
     13. STAGGER GRIDS
  ───────────────────────────────────────────── */
  function applyStaggerReveal() {
    document.querySelectorAll('.services-grid,.features-strip').forEach(grid => {
      Array.from(grid.children).forEach((child,i) => child.classList.add('reveal',`stagger-${Math.min(i+1,6)}`));
    });
    document.querySelectorAll('.process-step').forEach((el,i) => el.classList.add('reveal',`stagger-${Math.min(i+1,6)}`));
  }

  /* ─────────────────────────────────────────────
     14. CTA BLOCK
  ───────────────────────────────────────────── */
  function injectCTASection() {
    const services = document.getElementById('services');
    if (!services || services.querySelector('.cta-block')) return;
    const cta = document.createElement('div');
    cta.className = 'cta-block reveal';
    cta.innerHTML = `
      <div class="cta-block-glow"></div>
      <div class="section-eyebrow">Próximo passo</div>
      <h2>Pronto para <em class="text-gradient-animate">transformar</em><br>sua operação?</h2>
      <p>Nossa equipe está pronta para transformar seu desafio em solução digital de alto impacto.</p>
      <div class="cta-actions">
        <button class="btn-hero" onclick="showSection('request')">Solicitar proposta gratuita →</button>
        <button class="btn-hero-outline" onclick="showSection('about')">Conhecer a equipe</button>
      </div>`;
    const inner = services.querySelector('div');
    if (inner) inner.appendChild(cta);
  }

  /* ─────────────────────────────────────────────
     BOOT
  ───────────────────────────────────────────── */
  function boot() {
    initScrollProgress();
    initBlobs();
    initHeroCanvas();
    initTypewriter();
    injectShowcaseSection();
    applyStaggerReveal();
    injectTechMarquee();
    injectCTASection();
    raf(() => {
      initFloatingIcons();
      initScrollReveal();
      initCardTilt();
      initCounters();
      initMagneticButtons();
      initHeroParallax();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
