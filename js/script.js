// Navigation and Section Management
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        s.style.opacity = ''; // Clear any inline opacity
    });

    setTimeout(() => {
        const target = document.getElementById(id);
        if (target) {
            target.classList.add('active');

            // Allow display change to take effect before animating opacity
            requestAnimationFrame(() => {
                target.style.opacity = '1';
                // Retrigger intersection observer or manual skip for animations on new section
                triggerAnimations(target);
            });
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
}

// Request Form Options
function selectOption(el) {
    document.querySelectorAll('.svc-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}

// Emulate Submission Validation
function submitRequest() {
    const name = document.getElementById('req_name').value || 'visitante';
    const email = document.getElementById('req_email').value || 'seu e-mail';

    document.getElementById('requestForm').style.display = 'none';
    const s = document.getElementById('formSuccess');

    s.classList.add('visible');
    document.getElementById('successName').textContent = name;
    document.getElementById('successEmail').textContent = email;
}

// Client Portal Logic
function doLogin() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    if ((email === 'cliente@twotype.com' && pass === 'demo123') || email !== '') {
        document.getElementById('portalLogin').style.display = 'none';
        document.getElementById('portalInfo').style.display = 'none';
        document.getElementById('clientDash').classList.add('visible');
        document.querySelector('.portal-layout').style.gridTemplateColumns = '1fr';
    } else {
        alert('Faça login ou use a conta demo: cliente@twotype.com / demo123');
    }
}

function doLogout() {
    document.getElementById('portalLogin').style.display = '';
    document.getElementById('portalInfo').style.display = '';
    document.getElementById('clientDash').classList.remove('visible');
    document.querySelector('.portal-layout').style.gridTemplateColumns = '380px 1fr';

    // Clear fields
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPass').value = '';
}

// Admin Portal Logic
function doAdminLogin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    if ((user === 'admin@twotype.com' && pass === 'admin123') || user !== '') {
        document.getElementById('adminLoginWrap').style.display = 'none';
        document.getElementById('adminDash').classList.add('visible');
    } else {
        alert('Faça login ou use a conta demo: admin@twotype.com / admin123');
    }
}

function doAdminLogout() {
    document.getElementById('adminLoginWrap').style.display = '';
    document.getElementById('adminDash').classList.remove('visible');

    // Clear fields
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
}

// Intersection Observer for Scroll Animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-show');
            // Optional: stop observing once animated
            // observer.unobserve(entry.target);
        }
    });
}, observerOptions);

function initAnimations() {
    document.querySelectorAll('.animate-hidden').forEach(el => {
        observer.observe(el);
    });
}

// Trigger initial animations for active section manually if needed
function triggerAnimations(context) {
    context.querySelectorAll('.animate-hidden').forEach(el => {
        el.classList.remove('animate-show'); // Reset for re-animation if needed
        // Force a reflow to ensure the removal is noticed
        void el.offsetWidth;
        el.classList.add('animate-show');
    });
}

// Initialization on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    initAnimations();
    initParticles();
    initServiceTilt();

    // Process and animate icons after they are created by Lucide
    setTimeout(() => {
        initDrawnIcons();
    }, 100);

    // Pre-show home section content if it's already active
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
        activeSection.style.opacity = '1';
        setTimeout(() => {
            triggerAnimations(activeSection);
        }, 200);
    }
});

// ── PARTICLE SYSTEM ──
function initParticles() {
    const canvas = document.getElementById('bg-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    let w, h;

    const resize = () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 1.5 + 0.5;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > w) this.vx *= -1;
            if (this.y < 0 || this.y > h) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(139, 92, 246, 0.4)';
            ctx.fill();
        }
    }

    class Beam {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.length = Math.random() * 150 + 50;
            this.speed = Math.random() * 2 + 1;
            this.color = Math.random() > 0.5 ? 'rgba(139, 92, 246, 0.3)' : 'rgba(91, 106, 247, 0.3)';
        }
        update() {
            this.x += this.speed;
            if (this.x > w + this.length) {
                this.x = -this.length;
                this.y = Math.random() * h;
            }
        }
        draw() {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.length, this.y);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    let beams = [];
    const init = () => {
        const count = Math.min(Math.floor(w / 10), 100);
        for (let i = 0; i < count; i++) particles.push(new Particle());
        for (let i = 0; i < 15; i++) beams.push(new Beam());
    };
    init();

    const animate = () => {
        ctx.clearRect(0, 0, w, h);

        particles.forEach((p, i) => {
            p.update();
            p.draw();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - dist / 150)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        });

        beams.forEach(b => {
            b.update();
            b.draw();
        });
        requestAnimationFrame(animate);
    };
    animate();
}

// ── SERVICE 3D TILT ──
function initServiceTilt() {
    const cards = document.querySelectorAll('.service-card, .member-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Set CSS variables for the glow effect
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            // Calculate tilt angle (max 10 degrees)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });
}

// ── DRAWN ICONS LOGIC ──
function initDrawnIcons() {
    const targets = document.querySelectorAll('.feature-icon, .service-icon, [data-lucide], .success-icon');

    targets.forEach(el => {
        const svgs = el.tagName === 'SVG' ? [el] : el.querySelectorAll('svg');

        svgs.forEach(svg => {
            const paths = svg.querySelectorAll('path, circle, line, polyline, polygon');
            let totalMax = 0;

            paths.forEach(path => {
                const length = path.getTotalLength();
                totalMax = Math.max(totalMax, length);
                path.style.setProperty('--length', length);
            });

            el.style.setProperty('--length', totalMax);
        });

        // Trigger initial animation if visible
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('animate');
        }
    });
}

// Update triggerAnimations to also handle icons
const originalTriggerAnimations = triggerAnimations;
triggerAnimations = function (context) {
    if (typeof originalTriggerAnimations === 'function') {
        originalTriggerAnimations(context);
    }

    context.querySelectorAll('.feature-icon, .service-icon, [data-lucide]').forEach(icon => {
        icon.classList.remove('animate');
        void icon.offsetWidth;
        icon.classList.add('animate');
    });
};

const iconObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-icon, .service-icon, [data-lucide]').forEach(icon => {
    iconObserver.observe(icon);
});

// ── ROULETTE COUNTER LOGIC ──
function initRoulette() {
    const counters = document.querySelectorAll('.roulette');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                const suffix = el.dataset.suffix || '';
                animateRoulette(el, target, suffix);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.1 });

    counters.forEach(c => observer.observe(c));
}

function animateRoulette(el, target, suffix) {
    const height = el.offsetHeight || 50;

    // Fix centering conflict: align container to top
    el.style.alignItems = 'flex-start';
    el.style.justifyContent = 'flex-start';

    // Create a stack of numbers for the "spin" effect
    let numbers = [];
    const steps = 20;
    for (let i = 0; i < steps; i++) {
        numbers.push(Math.floor(Math.random() * (target * 1.5 || 100)));
    }
    numbers.push(target);

    el.innerHTML = '';
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.transition = 'transform 2.5s cubic-bezier(0.12, 0, 0, 1)';

    numbers.forEach((num, i) => {
        const div = document.createElement('div');
        div.style.height = height + 'px';
        div.style.minHeight = height + 'px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.textContent = num + (i === numbers.length - 1 ? suffix : '');
        container.appendChild(div);
    });

    el.appendChild(container);

    // Trigger animation
    requestAnimationFrame(() => {
        setTimeout(() => {
            const offset = (numbers.length - 1) * height;
            container.style.transform = `translateY(-${offset}px)`;
        }, 50);
    });
}

// ── SUPPORT ASSISTANT LOGIC (TWOZINHO) ──
function toggleSupport() {
    const panel = document.getElementById('supportPanel');
    panel.classList.toggle('visible');
}

function showTyping() {
    const body = document.getElementById('supportBody');
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.id = 'twozinhoTyping';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
}

function removeTyping() {
    const typing = document.getElementById('twozinhoTyping');
    if (typing) typing.remove();
}

function supportAsk(option) {
    const body = document.getElementById('supportBody');

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'support-msg user';
    userMsg.textContent = option;
    body.appendChild(userMsg);
    body.scrollTop = body.scrollHeight;

    // Simulate "thinking"
    setTimeout(() => {
        showTyping();

        setTimeout(() => {
            removeTyping();
            const botMsg = document.createElement('div');
            botMsg.className = 'support-msg bot';

            let response = "";
            if (option.includes('Software')) {
                response = "Show! 🚀 Projetar softwares do zero é a minha especialidade. Para te dar o melhor caminho, você já tem um escopo definido ou quer que eu te ajude a estruturar a ideia?";
            } else if (option.includes('Evoluir')) {
                response = "Entendi perfeitamente. Evoluir sistemas legados exige precisão cirúrgica. 🛠️ Podemos agendar um rápido diagnóstico técnico para eu avaliar sua arquitetura atual?";
            } else {
                response = "Automação é o futuro! 🤖 Posso te mostrar como a IA pode eliminar tarefas repetitivas e escalar sua operação sem aumentar o time. Quer ver alguns exemplos?";
            }

            botMsg.textContent = response;
            body.appendChild(botMsg);

            // Add CTA Button
            const ctaWrap = document.createElement('div');
            ctaWrap.style.marginTop = '8px';
            const cta = document.createElement('button');
            cta.className = 'btn-hero';
            cta.style.fontSize = '12px';
            cta.style.padding = '8px 16px';
            cta.textContent = 'Agendar Consultoria Grátis';
            cta.onclick = () => window.open('https://wa.me/5524999562535', '_blank');
            ctaWrap.appendChild(cta);
            body.appendChild(ctaWrap);

            body.scrollTop = body.scrollHeight;
        }, 1800); // Wait 1.8s for a humanized feel
    }, 400);
}

// Initialize roulette on load
document.addEventListener("DOMContentLoaded", () => {
    initRoulette();
});
