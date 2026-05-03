// ── GLOBALS ──
let serviceRequests = [];
try { 
    serviceRequests = JSON.parse(localStorage.getItem('nexcore_requests') || '[]'); 
    if (!Array.isArray(serviceRequests)) serviceRequests = []; 
} catch (e) { 
    serviceRequests = []; 
}

// Initial demo data if empty
if (serviceRequests.length === 0) {
    serviceRequests = [
        {
            id: Date.now() - 100000,
            name: 'Mariana Torres',
            email: 'mariana@agro.com.br',
            company: 'AgroTech Sul',
            phone: '(51) 98888-8888',
            serviceType: '📊 ERP / Gestão',
            deadline: 'Médio prazo (3 a 6 meses)',
            budget: 'Acima de R$ 100.000',
            details: 'Sistema de gestão de insumos on-premise com sincronização em nuvem e painel gerencial.',
            status: 'novo',
            progress: 0,
            date: new Date().toLocaleDateString('pt-BR'),
            history: [],
            techStack: '',
            edital: '',
            messages: [],
            assignedTo: null
        }
    ];
    saveToStorage('nexcore_requests', serviceRequests);
}


let currentColab = null;
try { currentColab = JSON.parse(localStorage.getItem('nexcore_colab') || 'null'); } catch (e) { currentColab = null; }

let currentApproveId = null;
let currentChatId = null;
let currentUpdateId = null;
let currentDetailsId = null;

// COLAB GLOBALS
let colabSessionInterval = null;
let currentActiveSession = null; // { reqId, startTime }
let approveTasksTemp = [];

// ── HELPERS ──

/**
 * Sanitiza uma string para inserção segura em HTML (previne XSS).
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

/**
 * Salva dados no localStorage com tratamento de QuotaExceededError.
 */
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            alert('⚠️ Armazenamento local cheio. Remova arquivos anexados ou limpe dados antigos para continuar.');
        }
        return false;
    }
}

/**
 * Lê as solicitações de serviço do localStorage com segurança.
 */
function getRequests() {
    try {
        const data = JSON.parse(localStorage.getItem('nexcore_requests') || '[]');
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

/**
 * Mapeia um status para um label de exibição.
 */
function getDisplayStatus(status) {
    const map = { novo: 'Análise', aprovado: 'Aguardando Dev', execucao: 'Em Dev', pendente_aprovacao: 'Revisão Final', concluido: 'Concluído' };
    return map[status] || status;
}

/**
 * Mapeia um status para uma classe CSS de badge.
 */
function getStatusClass(status) {
    const map = { novo: 'badge-pending', aprovado: 'badge-review', execucao: 'badge-active', pendente_aprovacao: 'badge-active', concluido: 'badge-active' };
    return map[status] || 'badge-pending';
}

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

                // FAB Contextual Update
                const assistantFab = document.querySelector('.assistant-fab');
                if (assistantFab) {
                    if (id === 'colabPortal') {
                        assistantFab.setAttribute('onclick', 'openColabChatDirect()');
                        assistantFab.innerHTML = '<i data-lucide="message-square"></i>';
                        assistantFab.title = 'Falar com Administrativo';
                    } else {
                        assistantFab.setAttribute('onclick', 'toggleSupport()');
                        assistantFab.innerHTML = '<i data-lucide="sparkles"></i>';
                        assistantFab.title = 'Assistente de Suporte';
                    }
                    if (typeof lucide !== 'undefined') lucide.createIcons({ portal: assistantFab });
                }

                // Refresh dashboards if entering a portal
                if (id === 'portal' || id === 'admin' || id === 'colabPortal') {
                    updateDashboards();
                }
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
let isSubmitting = false;
function submitRequest() {
    if (isSubmitting) return;
    isSubmitting = true;
    setTimeout(() => { isSubmitting = false; }, 3000);
    const name = document.getElementById('req_name').value || 'Visitante';
    const email = document.getElementById('req_email').value || 'seu e-mail';
    const company = document.getElementById('req_company').value || '-';
    const phone = document.getElementById('req_phone').value || '-';
    const deadline = document.getElementById('req_deadline').value || 'Não informado';
    const budget = document.getElementById('req_budget').value || 'Não informado';
    const details = document.getElementById('req_details').value || '-';

    // Get selected service
    const selectedSvc = document.querySelector('.svc-option.selected');
    const serviceType = selectedSvc ? selectedSvc.querySelector('.svc-option-title').textContent : 'Consultoria';

    // Create Request Object
    const newRequest = {
        id: Date.now(),
        name,
        email,
        company,
        phone,
        serviceType,
        deadline,
        budget,
        details,
        status: 'novo', // status: novo, aprovado, execucao, concluido
        progress: 0,
        date: new Date().toLocaleDateString('pt-BR'),
        techStack: '',
        edital: '',
        serviceDeadline: '', // Service deadline set by admin
        lastUpdate: '', // Last dev update message
        messages: [], // Chat messages
        assignedTo: null
    };

    // Save to state and localStorage
    serviceRequests.push(newRequest);
    saveToStorage('nexcore_requests', serviceRequests);

    // Update UI
    updateDashboards();

    // Show Success
    document.getElementById('requestForm').style.display = 'none';
    const s = document.getElementById('formSuccess');

    s.classList.add('visible');
    document.getElementById('successName').textContent = name;
    document.getElementById('successEmail').textContent = email;
}

// Reset Request Form
function resetRequestForm() {
    const form = document.getElementById('requestForm');
    const success = document.getElementById('formSuccess');

    if (form && success) {
        form.style.display = '';
        success.classList.remove('visible');

        // Optionally clear fields
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.tagName === 'SELECT') input.selectedIndex = 0;
            else input.value = '';
        });

        // Deselect options
        form.querySelectorAll('.svc-option').forEach(o => o.classList.remove('selected'));
    }
}

// ── DASHBOARD SUB-FUNCTIONS ──

function updateClientTable(requests, clientList) {
    if (clientList) clientList.innerHTML = '';
    requests.forEach(req => {
        const clientRow = document.createElement('tr');
        clientRow.className = 'simulated-row';
        const displayStatus = getDisplayStatus(req.status);
        const statusClass = getStatusClass(req.status);
        const lastUpdateHtml = req.lastUpdate
            ? `<div class="update-badge" style="margin-top:4px">Ultima att: ${escapeHtml(req.lastUpdate)}</div>`
            : '';
        clientRow.innerHTML = `
            <td>
                ${escapeHtml(req.serviceType)} — ${req.company !== '-' ? escapeHtml(req.company) : 'Projeto Pessoal'}
                ${lastUpdateHtml}
            </td>
            <td><span class="status-badge ${statusClass}"><span class="status-dot"></span>${displayStatus}</span></td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${req.progress}%"></div>
                </div>
                <div style="font-size:10px; color:var(--text3); margin-top:4px">${req.progress}% concluído</div>
            </td>
            <td>${escapeHtml(req.deadlineCliente || req.deadline)}</td>
            <td><button class="action-btn" onclick="openDetailsModal(${req.id})">Ver Detalhes</button></td>
        `;
        clientList.prepend(clientRow);
    });
}

function updateAdminRoadmap(requests, adminRoadmapList) {
    if (adminRoadmapList) adminRoadmapList.innerHTML = '';
    requests.forEach(req => {
        if (req.status === 'novo') return;
        const adminRow = document.createElement('tr');
        adminRow.className = 'simulated-row';
        const displayStatus = getDisplayStatus(req.status);
        const statusClass = getStatusClass(req.status);
        
        // SLA Logic
        let slaBadge = '';
        let showCobrar = false;
        if (req.status === 'execucao' && req.deadlineColab) {
            const parts = req.deadlineColab.split('/');
            if (parts.length === 3) {
                const dlDate = new Date(parts[2], parts[1] - 1, parts[0]);
                const now = new Date();
                const diffDays = Math.ceil((dlDate - now) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) {
                    slaBadge = `<span class="pill" style="background:var(--red); color:#fff; font-size:9px; margin-left:6px">ATRASADO</span>`;
                    showCobrar = true;
                } else if (diffDays <= 2) {
                    slaBadge = `<span class="pill" style="background:var(--amber); color:#000; font-size:9px; margin-left:6px">URGENTE</span>`;
                }
            }
        }

        const chatBtn = (req.assignedTo || req.status === 'execucao')
            ? `<button class="action-btn" style="background:var(--accent2); color:#fff; border-color:var(--accent2)" onclick="openChat(${req.id})">Chat Dev</button>`
            : '';
        
        const cobrarBtn = showCobrar 
            ? `<button class="action-btn" style="background:var(--red); color:#fff; border-color:var(--red)" onclick="nudgeCollaborator(${req.id})"><i data-lucide="bell" style="width:12px; vertical-align:-2px"></i> Cobrar</button>`
            : '';

        const lastUpdateAdmin = req.lastUpdate
            ? `<div class="update-badge" style="font-size:9px; margin-top:4px">Att: ${escapeHtml(req.lastUpdate)}</div>`
            : '';

        const paymentHtml = req.paymentValue 
            ? `<div style="font-weight:700; color:var(--green); font-size:11px">R$ ${parseFloat(req.paymentValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>`
            : '<span style="color:var(--text3); font-size:10px">Pendente</span>';

        adminRow.innerHTML = `
            <td>
                ${escapeHtml(req.name)} (${escapeHtml(req.company)})
                ${lastUpdateAdmin}
            </td>
            <td>${escapeHtml(req.serviceType)}</td>
            <td>${paymentHtml}</td>
            <td>
                <span class="status-badge ${statusClass}" style="font-size:10px"><span class="status-dot"></span>${displayStatus}</span>
                ${slaBadge}
            </td>
            <td style="color:var(--text3)">${escapeHtml(req.assignedTo || 'Pendente')}</td>
            <td style="display:flex; gap:6px">
                ${chatBtn} 
                ${cobrarBtn}
                <button class="action-btn" onclick="openDetailsModal(${req.id})">Detalhes</button>
            </td>
        `;
        adminRoadmapList.prepend(adminRow);
    });
}

function nudgeCollaborator(id) {
    const req = serviceRequests.find(r => r.id === id);
    if (!req) return;
    
    // Add automated message to chat
    const msg = {
        sender: 'Admin',
        text: `⚠️ ALERTA DE SLA: O prazo para o projeto "${req.serviceType}" (${req.name}) expirou. Por favor, envie uma atualização de status agora.`,
        date: new Date().toISOString()
    };
    
    req.chat = req.chat || [];
    req.chat.push(msg);
    saveToStorage('nexcore_requests', serviceRequests);
    alert(`Cobrança enviada para o chat do projeto #${id}.`);
    updateDashboards();
}

function updateAdminInbox(requests, adminInboxList) {
    if (adminInboxList) adminInboxList.innerHTML = '';
    requests.forEach(req => {
        if (req.status !== 'novo') return;
        const inboxItem = document.createElement('div');
        inboxItem.className = 'inbox-item simulated-row';
        inboxItem.setAttribute('onclick', `openApproveModal(${req.id})`);
        inboxItem.style.cursor = 'pointer';
        inboxItem.innerHTML = `
            <div class="unread-dot"></div>
            <div class="inbox-item-name">${escapeHtml(req.name)}</div>
            <div class="inbox-item-msg">${escapeHtml(req.serviceType)}: ${escapeHtml(req.details.substring(0, 40))}...</div>
            <div class="inbox-item-time">Aprovar →</div>
        `;
        adminInboxList.prepend(inboxItem);
    });
}

function updateAdminReviewList(requests) {
    const reviewList = document.getElementById('adminReviewList');
    const reviewCount = document.getElementById('adminReviewCount');
    if(!reviewList) return;
    
    reviewList.innerHTML = '';
    let count = 0;
    
    requests.forEach(req => {
        if(req.status === 'pendente_aprovacao') {
            count++;
            reviewList.innerHTML += `
                <div class="simulated-row" style="background:rgba(255,255,255,0.02); padding:12px; border-radius:8px; border-left:3px solid var(--accent2); display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:600; font-size:13px; color:#fff;">${escapeHtml(req.name)} - ${escapeHtml(req.serviceType)}</div>
                        <div style="font-size:11px; color:var(--text3); margin-top:2px;">Entregue por: ${escapeHtml(req.assignedTo || 'Colaborador')}</div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn-primary btn-sm" style="background:var(--green); padding:6px 12px;" onclick="approveDelivery(${req.id})"><i data-lucide="check" style="width:14px; margin-right:4px;"></i> Aprovar</button>
                        <button class="btn-primary btn-sm" style="background:var(--red); padding:6px 12px;" onclick="openRejectModal(${req.id})"><i data-lucide="x" style="width:14px; margin-right:4px;"></i> Reprovar</button>
                    </div>
                </div>
            `;
        }
    });
    
    if(count === 0) {
        reviewList.innerHTML = '<div class="empty-state" style="padding:16px;text-align:center;color:var(--text3);font-size:13px;">Nenhuma entrega pendente de revisão.</div>';
    }
    if(reviewCount) reviewCount.textContent = count;
    if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 0);
}

function updateColabStatus(val) {
    if(!currentColab) return;
    localStorage.setItem(`nexcore_colab_status_${currentColab.email}`, val);
    logColabActivity(`Alterou status de disponibilidade para: ${val}`);
    if(typeof updateDashboards === 'function') updateDashboards();
}

function editColabMeta() {
    if(!currentColab) return;
    const current = localStorage.getItem(`nexcore_colab_meta_${currentColab.email}`) || '5000';
    const newVal = prompt("Defina sua meta de faturamento mensal (R$):", current);
    if(newVal !== null) {
        const parsed = parseFloat(newVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if(!isNaN(parsed)) {
            localStorage.setItem(`nexcore_colab_meta_${currentColab.email}`, parsed);
            updateColabMetrics();
            alert("Meta atualizada com sucesso!");
        } else {
            alert("Valor inválido.");
        }
    }
}

function calculatePerformanceScore(colabEmail, colabName) {
    const reqs = getRequests();
    const feedbacks = JSON.parse(localStorage.getItem('nexcore_feedbacks') || '[]');
    const myFeedbacks = feedbacks.filter(f => f.colabEmail === colabEmail);
    
    // Feedback Avg
    let avgStars = 5;
    if (myFeedbacks.length > 0) {
        avgStars = myFeedbacks.reduce((sum, f) => sum + f.stars, 0) / myFeedbacks.length;
    }

    let deliveriesTotal = 0;
    let approvedWithoutRejection = 0;
    let deliveriesOnTime = 0;
    const now = new Date();

    reqs.forEach(req => {
        const isAssigned = req.assignedTo === colabName || 
                           (colabEmail === 'colaborador@twotype.com' && req.assignedTo === 'colaborador');
        
        if(isAssigned) {
            if (req.status === 'concluido' || req.status === 'pendente_aprovacao') {
                deliveriesTotal++;
                
                // On time check
                if (req.deadlineColab) {
                    const parts = req.deadlineColab.split('/');
                    if (parts.length === 3) {
                        const dl = new Date(parts[2], parts[1]-1, parts[0]);
                        const historyDelivery = req.history?.find(h => h.text.includes('enviado para revisão'));
                        const deliveryDate = historyDelivery ? new Date(historyDelivery.date) : now;
                        if (deliveryDate <= dl) deliveriesOnTime++;
                    } else deliveriesOnTime++;
                } else deliveriesOnTime++;

                // No rejection check
                const hasRejection = req.history?.some(h => h.text.includes('Entrega REPROVADA'));
                if (!hasRejection) approvedWithoutRejection++;
            }
        }
    });

    const feedbackScore = (avgStars / 5) * 40;
    const approvalScore = deliveriesTotal > 0 ? (approvedWithoutRejection / deliveriesTotal) * 40 : 40;
    const timeScore = deliveriesTotal > 0 ? (deliveriesOnTime / deliveriesTotal) * 20 : 20;
    
    return Math.round(feedbackScore + approvalScore + timeScore);
}

function updateColabMetrics() {
    if (!currentColab) return;
    const reqs = getRequests();
    const feedbacks = JSON.parse(localStorage.getItem('nexcore_feedbacks') || '[]');
    const myFeedbacks = feedbacks.filter(f => f.colabEmail === currentColab.email);
    
    let totalFat = 0;
    let monthFat = 0;
    let totalHoursMs = 0;
    
    // Performance Score components
    let avgFeedbackStars = 5;
    if (myFeedbacks.length > 0) {
        avgFeedbackStars = myFeedbacks.reduce((sum, f) => sum + f.stars, 0) / myFeedbacks.length;
    }

    let deliveriesTotal = 0;
    let approvedWithoutRejection = 0;
    let deliveriesOnTime = 0;
    
    const now = new Date();
    
    reqs.forEach(req => {
        if(req.assignedTo === currentColab.name) {
            // faturamento (count completed projects)
            if (req.status === 'concluido' && req.paymentValue) {
                totalFat += parseFloat(req.paymentValue);
                // Check if concluded this month
                const historyConcluded = req.history?.find(h => h.text.includes('Projeto aprovado pelo Admin'));
                if (historyConcluded) {
                    const d = new Date(historyConcluded.date);
                    if(d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                        monthFat += parseFloat(req.paymentValue);
                    }
                }
            }

            // hours
            if(req.timeLog && req.timeLog[currentColab.email]) {
                totalHoursMs += req.timeLog[currentColab.email].reduce((a,b)=>a+b.duration, 0);
            }

            // score components
            if (req.status === 'concluido' || req.status === 'pendente_aprovacao') {
                deliveriesTotal++;
                
                // On time check
                if (req.deadlineColab) {
                    const parts = req.deadlineColab.split('/');
                    if (parts.length === 3) {
                        const dl = new Date(parts[2], parts[1]-1, parts[0]);
                        const historyDelivery = req.history?.find(h => h.text.includes('enviado para revisão'));
                        const deliveryDate = historyDelivery ? new Date(historyDelivery.date) : now;
                        if (deliveryDate <= dl) deliveriesOnTime++;
                    } else {
                        deliveriesOnTime++;
                    }
                } else {
                    deliveriesOnTime++;
                }

                // Without rejection check
                const hasRejection = req.history?.some(h => h.text.includes('Entrega REPROVADA'));
                if (!hasRejection) approvedWithoutRejection++;
            }
        }
    });

    const hours = Math.floor(totalHoursMs / (1000*60*60));
    
    // Final score calculation (40/40/20 weight)
    const feedbackScore = (avgFeedbackStars / 5) * 40;
    const approvalScore = deliveriesTotal > 0 ? (approvedWithoutRejection / deliveriesTotal) * 40 : 40;
    const timeScore = deliveriesTotal > 0 ? (deliveriesOnTime / deliveriesTotal) * 20 : 20;
    
    const finalScore = Math.round(feedbackScore + approvalScore + timeScore);

    const meta = parseFloat(localStorage.getItem(`nexcore_colab_meta_${currentColab.email}`) || '5000');
    
    if(document.getElementById('colabMetricTotal')) {
        document.getElementById('colabMetricTotal').textContent = `R$ ${totalFat.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
        document.getElementById('colabMetricMonth').textContent = `R$ ${monthFat.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
        document.getElementById('colabMetricHours').textContent = `${hours}h`;
        document.getElementById('colabMetricScore').textContent = finalScore;
        
        let scoreDesc = "Status Excelente";
        let statusClass = "up";
        if (finalScore < 60) {
            scoreDesc = "Atenção Necessária";
            statusClass = "down";
        } else if (finalScore < 85) {
            scoreDesc = "Bom Desempenho";
            statusClass = "up";
        }
        
        const scoreDescEl = document.getElementById('colabMetricScoreDesc');
        if (scoreDescEl) {
            scoreDescEl.textContent = scoreDesc;
            scoreDescEl.className = `am-delta ${statusClass}`;
        }

        let metaProg = Math.min(100, (monthFat / meta)*100);
        document.getElementById('colabMetaTarget').textContent = `R$ ${meta.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
        document.getElementById('colabMetaProgress').style.width = `${metaProg}%`;
    }
}

function toggleSessionTimer(reqId) {
    if (currentActiveSession && currentActiveSession.reqId === reqId) {
        // Stop
        const dur = Date.now() - currentActiveSession.startTime;
        let reqs = getRequests();
        let r = reqs.find(x => x.id === reqId);
        if (r) {
            r.timeLog = r.timeLog || {};
            r.timeLog[currentColab.email] = r.timeLog[currentColab.email] || [];
            r.timeLog[currentColab.email].push({
                start: currentActiveSession.startTime,
                end: Date.now(),
                duration: dur
            });
            saveToStorage('nexcore_requests', reqs);
        }
        currentActiveSession = null;
        clearInterval(colabSessionInterval);
    } else {
        // if another is running, stop it first
        if (currentActiveSession) toggleSessionTimer(currentActiveSession.reqId);
        currentActiveSession = { reqId: reqId, startTime: Date.now() };
        colabSessionInterval = setInterval(colabSessionTick, 1000); // just update timer text
    }
    updateDashboards();
}

function colabSessionTick() {
    if (!currentActiveSession || !currentColab) return;
    const reqId = currentActiveSession.reqId;
    const el = document.getElementById(`timerDisplay_${reqId}`);
    if (el) {
        let totalMs = Date.now() - currentActiveSession.startTime;
        const reqs = getRequests();
        const req = reqs.find(r => r.id === reqId);
        if(req && req.timeLog && req.timeLog[currentColab.email]) {
            totalMs += req.timeLog[currentColab.email].reduce((acc, log) => acc + log.duration, 0);
        }
        let totalSecs = Math.floor(totalMs / 1000);
        let h = Math.floor(totalSecs / 3600);
        let m = Math.floor((totalSecs % 3600) / 60);
        let s = totalSecs % 60;
        el.textContent = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }
}

function toggleTaskDone(reqId, taskIdx, isDone) {
    let reqs = getRequests();
    let r = reqs.find(x => x.id === reqId);
    if(r && r.tasks && r.tasks[taskIdx]) {
        r.tasks[taskIdx].done = isDone;
        
        // Auto update progress based on tasks
        let total = r.tasks.length;
        let doneCnt = r.tasks.filter(t => t.done).length;
        r.progress = Math.round((doneCnt / total) * 100);
        
        // Log history
        r.history = r.history || [];
        r.history.push({
            date: new Date().toISOString(),
            type: 'task',
            text: `Tarefa "${r.tasks[taskIdx].title}" marcada como ${isDone ? 'concluída' : 'pendente'}.`,
            user: currentColab ? currentColab.name : 'Colaborador'
        });
        
        logColabActivity(`Checklist atualizado no projeto #${r.id} (${r.progress}% concluído)`);
        
        saveToStorage('nexcore_requests', reqs);
        updateDashboards();
    }
}

function logColabActivity(text) {
    if(!currentColab) return;
    let k = `nexcore_colab_activity_${currentColab.email}`;
    let act = JSON.parse(localStorage.getItem(k) || '[]');
    act.unshift({ date: new Date().toISOString(), text });
    if(act.length > 20) act = act.slice(0, 20);
    localStorage.setItem(k, JSON.stringify(act));
    renderColabActivity();
}

function renderColabActivity() {
    let list = document.getElementById('colabActivityList');
    if(!list || !currentColab) return;
    let act = JSON.parse(localStorage.getItem(`nexcore_colab_activity_${currentColab.email}`) || '[]');
    if(act.length === 0) {
        list.innerHTML = `<div style="color:var(--text3);font-size:13px;">Nenhuma atividade recente.</div>`;
        return;
    }
    list.innerHTML = act.map(a => `
        <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; border-left:3px solid var(--accent2);">
            <div style="font-size:11px; color:var(--text3); margin-bottom:4px;">${new Date(a.date).toLocaleString('pt-BR')}</div>
            <div style="font-size:13px; color:var(--text2);">${escapeHtml(a.text)}</div>
        </div>
    `).join('');
}

function switchColabTab(tab) {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('colabViewKanban').style.display = 'none';
    document.getElementById('colabViewHistorico').style.display = 'none';
    const feedbacksView = document.getElementById('colabViewFeedbacks');
    if(feedbacksView) feedbacksView.style.display = 'none';
    
    if (tab === 'kanban') {
        document.getElementById('colabTabKanbanBtn').classList.add('active');
        document.getElementById('colabViewKanban').style.display = 'block';
    } else if (tab === 'historico') {
        document.getElementById('colabTabHistoricoBtn').classList.add('active');
        document.getElementById('colabViewHistorico').style.display = 'block';
        renderColabActivity();
    } else if (tab === 'feedbacks') {
        document.getElementById('colabTabFeedbacksBtn').classList.add('active');
        if(feedbacksView) feedbacksView.style.display = 'block';
        renderMyFeedbacks();
    }
}

function changeColabStatus(status) {
    if(!currentColab) return;
    localStorage.setItem(`nexcore_colab_status_${currentColab.email}`, status);
    // UI update logic here...
    document.getElementById('colabStatusDisplay').textContent = status === 'disponivel' ? 'Disponível' : status === 'ocupado' ? 'Ocupado' : 'Férias';
    // Colors
    let color = status === 'disponivel' ? 'var(--green)' : status === 'ocupado' ? 'var(--amber)' : 'var(--text3)';
    document.getElementById('colabStatusIndicator').style.background = color;
}

function editColabMeta() {
    if(!currentColab) return;
    let meta = prompt("Defina sua meta de faturamento para o mês (R$):", localStorage.getItem(`nexcore_colab_meta_${currentColab.email}`) || '5000');
    if (meta && !isNaN(parseFloat(meta))) {
        localStorage.setItem(`nexcore_colab_meta_${currentColab.email}`, parseFloat(meta).toString());
        updateDashboards();
    }
}

function updateColabKanban(requests) {
    const listProposals = document.getElementById('listProposals');
    const listAvailable = document.getElementById('listAvailable');
    const listInProgress = document.getElementById('listInProgress');
    const listReviewing = document.getElementById('listReviewing');
    const listDone = document.getElementById('listDone');
    if (!listAvailable || !listInProgress || !listDone) return;

    if(listProposals) listProposals.innerHTML = '';
    listAvailable.innerHTML = '';
    listInProgress.innerHTML = '';
    if(listReviewing) listReviewing.innerHTML = '';
    listDone.innerHTML = '';

    let counts = { proposals: 0, available: 0, inProgress: 0, reviewing: 0, done: 0 };
    requests.forEach(req => {
        if (req.status === 'aprovado') {
            if (req.financialProposal && req.financialProposal.status === 'aguardando_confirmacao') {
                counts.proposals++;
                if(listProposals) listProposals.appendChild(createTaskCard(req, 'proposal'));
            } else {
                counts.available++;
                listAvailable.appendChild(createTaskCard(req, 'accept'));
            }
        } else if (req.status === 'execucao') {
            counts.inProgress++;
            const isMine = req.assignedToEmail === currentColab?.email || req.assignedTo === currentColab?.name;
            listInProgress.appendChild(createTaskCard(req, isMine ? 'manage' : 'none'));
        } else if (req.status === 'pendente_aprovacao') {
            counts.reviewing++;
            if(listReviewing) listReviewing.appendChild(createTaskCard(req, 'none'));
        } else if (req.status === 'concluido') {
            counts.done++;
            listDone.appendChild(createTaskCard(req, 'none'));
        }
    });

    if (document.getElementById('countAvailable')) {
        const countProp = document.getElementById('countProposals');
        if(countProp) countProp.textContent = counts.proposals;
        document.getElementById('countAvailable').textContent = counts.available;
        document.getElementById('countInProgress').textContent = counts.inProgress;
        const countRev = document.getElementById('countReviewing');
        if(countRev) countRev.textContent = counts.reviewing;
        document.getElementById('countDone').textContent = counts.done;
    }
}

// Update Dashboards UI
function updateDashboards() {
    serviceRequests = getRequests();
    currentColab = JSON.parse(localStorage.getItem('nexcore_colab') || 'null');

    // Version UI Marker to confirm changes are live
    const welcomeNameEl = document.getElementById('colabWelcomeName');
    if (welcomeNameEl && currentColab) {
        welcomeNameEl.innerHTML = `Bem-vindo, ${escapeHtml(currentColab.name)} <span style="font-size:10px; background:var(--accent2); padding:2px 6px; border-radius:4px; margin-left:8px; vertical-align:middle">V2.1 LIVE</span>`;
    }

    const clientList = document.getElementById('clientProjectsList');
    const adminRoadmapList = document.getElementById('adminRoadmapList');
    const adminInboxList = document.getElementById('adminInboxList');
    if (!clientList || !adminRoadmapList || !adminInboxList) return;

    // Clear all previously added dynamic rows
    document.querySelectorAll('.simulated-row').forEach(row => row.remove());

    updateClientTable(serviceRequests, clientList);
    updateAdminRoadmap(serviceRequests, adminRoadmapList);
    updateAdminInbox(serviceRequests, adminInboxList);
    updateAdminReviewList(serviceRequests);
    updateColabKanban(serviceRequests);
    updateColabMetrics();

    // Update admin leads counter
    const activeStats = document.querySelectorAll('.am-val');
    if (activeStats && activeStats.length >= 3) {
        activeStats[2].textContent = 15 + serviceRequests.length;
    }
}

function getColabSLAHtml(deadlineStr) {
    if (!deadlineStr) return '';
    try {
        const parts = deadlineStr.split('/');
        if(parts.length !== 3) return '';
        const dlDate = new Date(parts[2], parts[1]-1, parts[0]);
        const now = new Date();
        const diffMs = dlDate - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `<div style="background:var(--red); color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-top:4px; display:inline-block;">🔴 Atrasado</div>`;
        } else if (diffDays <= 3) {
            return `<div style="background:var(--amber); color:#000; font-size:10px; padding:2px 6px; border-radius:4px; margin-top:4px; display:inline-block;">⚠️ Prazo próximo</div>`;
        }
    } catch(e) {}
    return '';
}

function getColabSessionTimerHtml(reqId) {
    let isRunning = currentActiveSession && currentActiveSession.reqId === reqId;
    let label = isRunning ? 'Pausar' : 'Iniciar';
    let icon = isRunning ? 'pause-circle' : 'play-circle';
    let btnColor = isRunning ? 'var(--amber)' : 'var(--green)';
    
    let totalMs = 0;
    const req = serviceRequests.find(r => r.id === reqId);
    if(req && req.timeLog && req.timeLog[currentColab.email]) {
        totalMs = req.timeLog[currentColab.email].reduce((acc, log) => acc + log.duration, 0);
    }
    if (isRunning) {
        totalMs += (Date.now() - currentActiveSession.startTime);
    }
    
    let totalSecs = Math.floor(totalMs / 1000);
    let h = Math.floor(totalSecs / 3600);
    let m = Math.floor((totalSecs % 3600) / 60);
    let s = totalSecs % 60;
    let timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    
    return `
        <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div style="font-size:13px; font-weight:600; font-variant-numeric:tabular-nums;" id="timerDisplay_${reqId}">${timeStr}</div>
            <button class="btn-primary btn-sm" style="background:${btnColor}; padding:4px 8px; font-size:11px;" onclick="toggleSessionTimer(${reqId})">
                <i data-lucide="${icon}" style="width:14px; margin-right:4px;"></i> ${label}
            </button>
        </div>
    `;
}

function getColabTasksHtml(req, isMine) {
    if (!req.tasks || req.tasks.length === 0) return '';
    let tasksHtml = req.tasks.map((t, idx) => `
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <input type="checkbox" id="task_${req.id}_${idx}" ${t.done ? 'checked' : ''} ${!isMine ? 'disabled' : ''} onchange="toggleTaskDone(${req.id}, ${idx}, this.checked)" style="accent-color:var(--accent2); width:14px; height:14px;">
            <label for="task_${req.id}_${idx}" style="font-size:12px; color:var(--text2); ${t.done ? 'text-decoration:line-through;opacity:0.6;' : ''}">${escapeHtml(t.title)}</label>
        </div>
    `).join('');
    return `<div style="margin-top:10px; margin-bottom:10px; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px;">
                <div style="font-size:11px; color:var(--text3); margin-bottom:8px; text-transform:uppercase; font-weight:600;">Checklist</div>
                ${tasksHtml}
            </div>`;
}

function createTaskCard(req, actionType) {
    const card = document.createElement('div');
    card.className = 'task-card';

    let actionBtn = '';
    let timerHtml = '';
    let isMine = req.assignedToEmail === currentColab?.email || req.assignedTo === currentColab?.name;
    
    if (actionType === 'accept') {
        actionBtn = `<button class="btn-primary btn-sm" onclick="acceptTask(${req.id})">Aceitar Demanda</button>`;
    } else if (actionType === 'proposal') {
        actionBtn = `<button class="btn-primary btn-sm" style="background:var(--accent2); margin-bottom:8px; width:100%" onclick="confirmProposal(${req.id})">✅ Confirmar Proposta</button>`;
    } else if (actionType === 'manage') {
        timerHtml = getColabSessionTimerHtml(req.id);
        actionBtn = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px">
                <button class="btn-primary btn-sm" style="background:var(--accent2)" onclick="openChat(${req.id})">Chat Admin</button>
                <button class="btn-primary btn-sm" style="background:var(--green)" onclick="openUpdateModal(${req.id})">Atualizar</button>
            </div>
            <button class="btn-hero btn-sm" style="background:#10b981; margin-top:10px; width:100%" onclick="finishTask(${req.id})">Concluir Projeto</button>
        `;
    }

    const deadlineInfo = req.deadlineColab
        ? `<span><i data-lucide="clock" style="width:12px"></i> Prazo: ${escapeHtml(req.deadlineColab)}</span>`
        : `<span><i data-lucide="calendar" style="width:12px"></i> ${escapeHtml(req.deadline)}</span>`;
        
    const slaBadge = getColabSLAHtml(req.deadlineColab);
    
    const lastUpdateHtml = req.lastUpdate
        ? `<div class="update-badge">Status: ${escapeHtml(req.lastUpdate)}</div>`
        : '';
        
    const editalPreview = escapeHtml((req.edital || '').substring(0, 80));
    const stackTags = (req.techStack || '').split(',').map(s => `<span class="stack-tag">${escapeHtml(s.trim())}</span>`).join('');
    
    const tasksHtml = getColabTasksHtml(req, isMine);

    const assignedName = req.assignedTo || 'Pendente';
    const isActuallyMine = req.assignedToEmail === currentColab?.email || req.assignedTo === currentColab?.name;

    card.innerHTML = `
        <div class="task-card-title">${escapeHtml(req.serviceType)}</div>
        <div class="task-card-meta">
            <span><i data-lucide="user" style="width:12px"></i> ${escapeHtml(req.name)}</span>
            ${deadlineInfo}
        </div>
        <div style="font-size:11px; color:var(--text3); margin-top:4px;">
            <i data-lucide="user-check" style="width:12px; vertical-align:-2px"></i> Atribuído: ${escapeHtml(assignedName)}
        </div>
        ${slaBadge}
        ${req.paymentValue ? `
            <div style="margin-top:12px; padding:10px; background:rgba(16, 185, 129, 0.1); border-radius:8px; border:1px solid rgba(16, 185, 129, 0.2); display:flex; align-items:center; gap:8px">
                <i data-lucide="banknote" style="width:16px; color:var(--green)"></i>
                <div>
                    <div style="font-size:10px; color:var(--text3); text-transform:uppercase; font-weight:700">Seu Repasse</div>
                    <div style="font-size:18px; color:var(--green); font-weight:800; font-family:'Syne', sans-serif">R$ ${parseFloat(req.paymentValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
            </div>
        ` : ''}
        ${lastUpdateHtml}
        <div class="task-card-edital">${editalPreview}...</div>
        ${tasksHtml}
        <div class="task-card-stack">${stackTags}</div>
        ${timerHtml}
        <div class="task-card-actions">
            ${actionBtn}
            ${!isActuallyMine && req.status === 'execucao' ? `<button class="btn-primary btn-sm" style="background:var(--amber); color:#000" onclick="acceptTask(${req.id})">Assumir este Projeto</button>` : ''}
            <button class="btn-ghost btn-sm" onclick="openDetailsModal(${req.id})">Ver Detalhes</button>
            <button class="btn-ghost btn-sm" onclick="openDescriptionModal(${req.id})">Descrição Técnica</button>
        </div>
    `;

    if (typeof lucide !== 'undefined') {
        setTimeout(() => lucide.createIcons({ props: { 'stroke-width': 2 }, portal: card }), 0);
    }
    applyTilt(card);
    return card;
}

// Admin Approval Logic
function openApproveModal(id) {
    currentApproveId = id;
    const req = serviceRequests.find(r => r.id === id);
    if (!req) return;

    document.getElementById('approveStack').value = '';
    document.getElementById('approveClientDeadline').value = '';
    document.getElementById('approveCollabDeadline').value = '';
    document.getElementById('approvePaymentValue').value = '';
    document.getElementById('approveFile').value = '';
    document.getElementById('fileNameLabel').textContent = 'Selecionar arquivo...';
    document.getElementById('approveEdital').value = req.details;
    approveTasksTemp = [];
    approveMilestonesTemp = [];
    document.getElementById('approvePaymentType').value = 'a_vista';
    document.getElementById('approvePaymentDeadline').value = '';
    document.getElementById('approvePaymentNotes').value = '';
    toggleMilestones();
    renderApproveTasks();
    renderApproveMilestones();
    document.getElementById('approvalModal').style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons({ portal: document.getElementById('approvalModal') });
}

let approveMilestonesTemp = [];

function toggleMilestones() {
    const type = document.getElementById('approvePaymentType').value;
    document.getElementById('milestonesContainer').style.display = type === 'milestones' ? 'block' : 'none';
}

function addApproveMilestone() {
    const valInput = document.getElementById('milestoneValue');
    const descInput = document.getElementById('milestoneDesc');
    const val = parseCurrency(valInput.value);
    const desc = descInput.value.trim();
    if (val && desc) {
        approveMilestonesTemp.push({ value: val, trigger: desc });
        valInput.value = '';
        descInput.value = '';
        renderApproveMilestones();
    }
}

function renderApproveMilestones() {
    const list = document.getElementById('approveMilestonesList');
    if (!list) return;
    if (approveMilestonesTemp.length === 0) {
        list.innerHTML = `<div style="font-size:12px; color:var(--text3);">Nenhum milestone adicionado.</div>`;
        return;
    }
    list.innerHTML = approveMilestonesTemp.map((m, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); padding:8px 12px; border-radius:6px; font-size:13px; color:var(--text2);">
            <span>R$ ${m.value.toLocaleString('pt-BR', {minimumFractionDigits:2})} - ${escapeHtml(m.trigger)}</span>
            <button class="btn-ghost" style="padding:2px; color:var(--red);" onclick="removeApproveMilestone(${idx})"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>
        </div>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons({ portal: list });
}

function removeApproveMilestone(idx) {
    approveMilestonesTemp.splice(idx, 1);
    renderApproveMilestones();
}

function addApproveTask() {
    const input = document.getElementById('approveTaskInput');
    const val = input.value.trim();
    if (val) {
        approveTasksTemp.push({ title: val, done: false });
        input.value = '';
        renderApproveTasks();
    }
}

function renderApproveTasks() {
    const list = document.getElementById('approveTasksList');
    if (!list) return;
    if (approveTasksTemp.length === 0) {
        list.innerHTML = `<div style="font-size:12px; color:var(--text3);">Nenhuma tarefa adicionada.</div>`;
        return;
    }
    list.innerHTML = approveTasksTemp.map((t, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); padding:8px 12px; border-radius:6px; font-size:13px; color:var(--text2);">
            <span>${escapeHtml(t.title)}</span>
            <button class="btn-ghost" style="padding:2px; color:var(--red);" onclick="removeApproveTask(${idx})"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>
        </div>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons({ portal: list });
}

function removeApproveTask(idx) {
    approveTasksTemp.splice(idx, 1);
    renderApproveTasks();
}

function updateFileName(input) {
    const label = document.getElementById('fileNameLabel');
    if (input.files && input.files[0]) {
        label.textContent = input.files[0].name;
    } else {
        label.textContent = 'Selecionar arquivo...';
    }
}

function openRequestDetailsModal(id) {
    const req = serviceRequests.find(r => r.id === id);
    if (!req) return;

    const container = document.getElementById('clientFormData');
    const detailsContainer = document.getElementById('clientFormDetails');

    container.innerHTML = `
        <div><label style="font-size:11px; color:var(--text3)">Nome</label><div style="color:#fff">${req.name}</div></div>
        <div><label style="font-size:11px; color:var(--text3)">E-mail</label><div style="color:#fff">${req.email}</div></div>
        <div><label style="font-size:11px; color:var(--text3)">WhatsApp</label><div style="color:#fff">${req.phone}</div></div>
        <div><label style="font-size:11px; color:var(--text3)">Empresa</label><div style="color:#fff">${req.company}</div></div>
        <div><label style="font-size:11px; color:var(--text3)">Serviço</label><div style="color:#fff">${req.serviceType}</div></div>
        <div><label style="font-size:11px; color:var(--text3)">Orçamento</label><div style="color:var(--green)">${req.budget}</div></div>
        <div><label style="font-size:11px; color:var(--text3)">Prazo Desejado</label><div style="color:#fff">${req.deadline}</div></div>
        <div><label style="font-size:11px; color:var(--text3)">Data Solicitação</label><div style="color:#fff">${req.date}</div></div>
    `;

    detailsContainer.textContent = req.details;
    document.getElementById('requestDetailsModal').style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons({ portal: document.getElementById('requestDetailsModal') });
}

function closeRequestDetailsModal() {
    document.getElementById('requestDetailsModal').style.display = 'none';
}

function closeApproveModal() {
    document.getElementById('approvalModal').style.display = 'none';
    currentApproveId = null;
}

function confirmApproval() {
    const stack = document.getElementById('approveStack').value;
    const clientDeadline = document.getElementById('approveClientDeadline').value;
    const collabDeadline = document.getElementById('approveCollabDeadline').value;
    const paymentValueRaw = document.getElementById('approvePaymentValue').value;
    const paymentValue = parseCurrency(paymentValueRaw);
    const paymentType = document.getElementById('approvePaymentType').value;
    const paymentDeadline = document.getElementById('approvePaymentDeadline').value;
    const paymentNotes = document.getElementById('approvePaymentNotes').value;
    const edital = document.getElementById('approveEdital').value;

    if (!stack || !edital || !clientDeadline || !collabDeadline || !paymentValueRaw) {
        alert('Por favor, preencha todos os campos obrigatórios do edital, prazos e valor.');
        return;
    }
    
    if (paymentType === 'milestones' && approveMilestonesTemp.length === 0) {
        alert('Por favor, adicione pelo menos um milestone de pagamento.');
        return;
    }

    const reqIndex = serviceRequests.findIndex(r => r.id === currentApproveId);
    if (reqIndex !== -1) {
        serviceRequests[reqIndex].status = 'aprovado';
        serviceRequests[reqIndex].techStack = stack;
        serviceRequests[reqIndex].deadlineCliente = clientDeadline;
        serviceRequests[reqIndex].deadlineColab = collabDeadline;
        serviceRequests[reqIndex].paymentValue = paymentValue;
        serviceRequests[reqIndex].financialProposal = {
            totalValue: paymentValue,
            paymentType: paymentType,
            milestones: JSON.parse(JSON.stringify(approveMilestonesTemp)),
            paymentDeadline: paymentDeadline,
            notes: paymentNotes,
            status: 'aguardando_confirmacao'
        };
        serviceRequests[reqIndex].edital = edital;
        serviceRequests[reqIndex].tasks = JSON.parse(JSON.stringify(approveTasksTemp));
        serviceRequests[reqIndex].progress = 0;
        serviceRequests[reqIndex].history = [{
            date: new Date().toISOString(),
            type: 'status',
            text: 'Projeto aprovado e publicado no Workspace.',
            user: 'Admin'
        }];

        // Simulate file attachment
        const fileInput = document.getElementById('approveFile');
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                serviceRequests[reqIndex].attachment = {
                    name: file.name,
                    url: e.target.result
                };
                saveToStorage('nexcore_requests', serviceRequests);
                updateDashboards();
            };
            reader.readAsDataURL(file);
        } else {
            saveToStorage('nexcore_requests', serviceRequests);
            updateDashboards();
        }

        closeApproveModal();
        alert('Projeto aprovado! Agora disponível para os colaboradores.');
    }
}

// Colab Logic
function doColabLogin() {
    const email = document.getElementById('colabEmail').value.trim();
    const pass = document.getElementById('colabPass').value;

    if (email === 'colaborador@twotype.com' && pass === 'colab123') {
        currentColab = { name: email.split('@')[0], email: email };
        saveToStorage('nexcore_colab', currentColab);

        document.getElementById('colabLoginWrap').style.display = 'none';
        document.getElementById('colabDash').style.display = 'block';
        document.getElementById('colabWelcomeName').textContent = `Olá, ${currentColab.name}!`;
        
        let savedStatus = localStorage.getItem(`nexcore_colab_status_${currentColab.email}`) || 'disponivel';
        changeColabStatus(savedStatus);
        
        updateDashboards();
    } else {
        alert('Acesso negado. Use: colaborador@twotype.com / colab123');
    }
}

function doColabLogout() {
    if (currentActiveSession) toggleSessionTimer(currentActiveSession.reqId); // stop session on logout
    currentColab = null;
    localStorage.removeItem('nexcore_colab');
    document.getElementById('colabLoginWrap').style.display = 'block';
    document.getElementById('colabDash').style.display = 'none';

    document.getElementById('colabEmail').value = '';
    document.getElementById('colabPass').value = '';
}

function acceptTask(id) {
    const reqIndex = serviceRequests.findIndex(r => r.id === id);
    if (reqIndex !== -1) {
        serviceRequests[reqIndex].status = 'execucao';
        serviceRequests[reqIndex].assignedTo = currentColab.name;
        serviceRequests[reqIndex].assignedToEmail = currentColab.email;
        serviceRequests[reqIndex].progress = 15;
        serviceRequests[reqIndex].history = serviceRequests[reqIndex].history || [];
        serviceRequests[reqIndex].history.push({
            date: new Date().toISOString(),
            type: 'status',
            text: 'Projeto assumido pelo colaborador.',
            user: currentColab.name
        });
        logColabActivity(`Aceitou o projeto #${id}`);
        saveToStorage('nexcore_requests', serviceRequests);
        updateDashboards();
        alert('Demanda aceita! Olhe na sua coluna "Em Execução".');
    }
}

function confirmProposal(id) {
    const reqIndex = serviceRequests.findIndex(r => r.id === id);
    if (reqIndex !== -1) {
        if (!serviceRequests[reqIndex].financialProposal) return;
        serviceRequests[reqIndex].financialProposal.status = 'confirmada';
        serviceRequests[reqIndex].history = serviceRequests[reqIndex].history || [];
        serviceRequests[reqIndex].history.push({
            date: new Date().toISOString(),
            type: 'status',
            text: 'Proposta financeira confirmada pelo colaborador.',
            user: currentColab ? currentColab.name : 'Colaborador'
        });
        logColabActivity(`Confirmou a proposta do projeto #${id}`);
        
        // Move to execution and assign to me
        serviceRequests[reqIndex].status = 'execucao';
        serviceRequests[reqIndex].assignedTo = currentColab.name;
        serviceRequests[reqIndex].assignedToEmail = currentColab.email;
        serviceRequests[reqIndex].progress = 15;

        saveToStorage('nexcore_requests', serviceRequests);
        updateDashboards();
        alert('Proposta confirmada! O projeto foi movido para sua coluna "Em Execução".');
    }
}

function finishTask(id) {
    if (!currentColab) {
        alert('Erro: Colaborador não identificado. Faça login novamente.');
        return;
    }
    const reqIndex = serviceRequests.findIndex(r => r.id === id);
    if (reqIndex !== -1) {
        serviceRequests[reqIndex].status = 'pendente_aprovacao';
        serviceRequests[reqIndex].progress = 95;
        serviceRequests[reqIndex].lastUpdate = 'Aguardando aprovação final do Admin';
        serviceRequests[reqIndex].history = serviceRequests[reqIndex].history || [];
        serviceRequests[reqIndex].history.push({
            date: new Date().toISOString(),
            type: 'status',
            text: 'Projeto enviado para revisão do Admin.',
            user: currentColab.name
        });
        logColabActivity(`Enviou o projeto #${id} para revisão`);
        saveToStorage('nexcore_requests', serviceRequests);
        updateDashboards();
        alert('Projeto enviado para revisão! Aguarde a aprovação do Administrador.');
    }
}

let currentRejectId = null;

function approveDelivery(id) {
    const reqIndex = serviceRequests.findIndex(r => r.id === id);
    if (reqIndex !== -1) {
        serviceRequests[reqIndex].status = 'concluido';
        serviceRequests[reqIndex].progress = 100;
        serviceRequests[reqIndex].history = serviceRequests[reqIndex].history || [];
        serviceRequests[reqIndex].history.push({
            date: new Date().toISOString(),
            type: 'status',
            text: 'Projeto aprovado pelo Admin. Entrega finalizada.',
            user: 'Admin'
        });
        
        saveToStorage('nexcore_requests', serviceRequests);
        updateDashboards();
        alert('Entrega aprovada com sucesso! O projeto foi finalizado.');
        
        // Open feedback modal for client demo
        currentFeedbackReqId = id;
        document.getElementById('feedbackModal').style.display = 'flex';
        selectFeedbackStar(5);
    }
}

function openRejectModal(id) {
    currentRejectId = id;
    document.getElementById('adminRejectComment').value = '';
    document.getElementById('adminRejectModal').style.display = 'flex';
}

function closeRejectModal() {
    document.getElementById('adminRejectModal').style.display = 'none';
    currentRejectId = null;
}

function confirmRejectDelivery() {
    if(!currentRejectId) return;
    const comment = document.getElementById('adminRejectComment').value.trim();
    if(!comment) {
        alert("Descreva o motivo da reprovação.");
        return;
    }
    
    const reqIndex = serviceRequests.findIndex(r => r.id === currentRejectId);
    if(reqIndex !== -1) {
        serviceRequests[reqIndex].status = 'execucao';
        serviceRequests[reqIndex].history = serviceRequests[reqIndex].history || [];
        serviceRequests[reqIndex].history.push({
            date: new Date().toISOString(),
            type: 'status',
            text: `Entrega REPROVADA: ${comment}`,
            user: 'Admin'
        });
        saveToStorage('nexcore_requests', serviceRequests);
        updateDashboards();
        closeRejectModal();
        alert("Projeto devolvido para o colaborador com os comentários de ajuste.");
    }
}

let currentFeedbackReqId = null;
let currentFeedbackStar = 5;

function selectFeedbackStar(val) {
    currentFeedbackStar = val;
    document.querySelectorAll('.feedback-star').forEach(el => {
        if(parseInt(el.getAttribute('data-val')) <= val) {
            el.style.color = 'var(--accent2)';
            el.style.fill = 'var(--accent2)';
        } else {
            el.style.color = 'var(--text3)';
            el.style.fill = 'none';
        }
    });
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'none';
}

function submitFeedback() {
    if(!currentFeedbackReqId) return;
    const req = serviceRequests.find(r => r.id === currentFeedbackReqId);
    if(!req) return;
    
    const comment = document.getElementById('feedbackComment').value.trim();
    let feedbacks = JSON.parse(localStorage.getItem('nexcore_feedbacks') || '[]');
    feedbacks.push({
        reqId: currentFeedbackReqId,
        colabEmail: (req.assignedTo && req.assignedTo.includes('@')) ? req.assignedTo : 'colaborador@twotype.com',
        clientName: req.name,
        service: req.serviceType,
        stars: currentFeedbackStar,
        comment: comment,
        date: new Date().toISOString()
    });
    localStorage.setItem('nexcore_feedbacks', JSON.stringify(feedbacks));
    closeFeedbackModal();
    alert('Avaliação enviada com sucesso! Muito obrigado.');
    updateColabMetrics();
    if(typeof renderAdminFeedbacks === 'function') renderAdminFeedbacks();
    if(typeof renderMyFeedbacks === 'function') renderMyFeedbacks();
}
function doLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;

    if (email === 'cliente@twotype.com' && pass === 'demo123') {
        document.getElementById('portalLogin').style.display = 'none';
        document.getElementById('portalInfo').style.display = 'none';
        document.getElementById('clientDash').classList.add('visible');
        document.querySelector('.portal-layout').style.gridTemplateColumns = '1fr';
        switchClientTab('projetos'); // default tab
        if (typeof renderSupportTickets === 'function') renderSupportTickets();
    } else {
        alert('Acesso negado. Use a conta demo: cliente@twotype.com / demo123');
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

// ── CLIENT PORTAL: SUPORTE LOGIC ──
function switchClientTab(tabId) {
    // Buttons
    document.getElementById('tabProjetos').classList.remove('active');
    document.getElementById('tabSuporte').classList.remove('active');

    // Views
    document.getElementById('clientViewProjetos').style.display = 'none';
    document.getElementById('clientViewSuporte').style.display = 'none';

    if (tabId === 'projetos') {
        document.getElementById('tabProjetos').classList.add('active');
        document.getElementById('clientViewProjetos').style.display = 'block';
    } else if (tabId === 'suporte') {
        document.getElementById('tabSuporte').classList.add('active');
        document.getElementById('clientViewSuporte').style.display = 'block';
        if (typeof renderSupportTickets === 'function') renderSupportTickets();
    }
}

function submitSupportTicket() {
    const subjectEl = document.getElementById('ticketSubject');
    const categoryEl = document.getElementById('ticketCategory');
    const messageEl = document.getElementById('ticketMessage');

    if (!subjectEl || !categoryEl || !messageEl) {
        console.error('Formulário de suporte incompleto no DOM');
        return;
    }

    const subject = subjectEl.value.trim();
    const category = categoryEl.value;
    const message = messageEl.value.trim();

    if (!subject || !category || !message) {
        alert('Por favor, preencha todos os campos do chamado.');
        return;
    }

    const tickets = getAdminTickets();
    const newTicket = {
        id: Date.now(),
        subject,
        category,
        message,
        status: 'aberto',
        date: new Date().toISOString(),
        clientName: 'Cliente',
        chat: []
    };

    tickets.push(newTicket);
    const saved = saveToStorage('nexcore_support_tickets', tickets);
    if (!saved) return;

    // Ping admin panel
    localStorage.setItem('nexcore_support_ping', Date.now().toString());

    // Clear form
    subjectEl.value = '';
    categoryEl.value = '';
    messageEl.value = '';

    alert('Chamado aberto com sucesso! Nossa equipe entrará em contato em breve.');

    if (typeof renderSupportTickets === 'function') renderSupportTickets();
}


// Admin Portal Logic
function doAdminLogin() {
    const user = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPass').value;

    if (user === 'admin@twotype.com' && pass === 'admin123') {
        const adminName = user.split('@')[0];
        const formattedName = adminName.charAt(0).toUpperCase() + adminName.slice(1);

        document.getElementById('adminLoginWrap').style.display = 'none';
        document.getElementById('adminDash').classList.add('visible');

        const navLogout = document.getElementById('adminLogoutNav');
        if (navLogout) navLogout.style.display = 'block';

        document.getElementById('adminGreeting').textContent = `Olá, ${formattedName}`;
        document.getElementById('adminSubGreeting').textContent = `Bem-vindo ao cockpit de gestão, ${formattedName}.`;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        updateDashboards();
    } else {
        alert('Acesso negado. Use: admin@twotype.com / admin123');
    }
}

function doAdminLogout() {
    document.getElementById('adminLoginWrap').style.display = '';
    document.getElementById('adminDash').classList.remove('visible');

    // Hide logout button in nav
    const navLogout = document.getElementById('adminLogoutNav');
    if (navLogout) navLogout.style.display = 'none';

    // Clear fields
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
}

// Demo Login Filler
function fillDemo(type) {
    if (type === 'client') {
        document.getElementById('loginEmail').value = 'cliente@twotype.com';
        document.getElementById('loginPass').value = 'demo123';
    } else if (type === 'admin') {
        document.getElementById('adminUser').value = 'admin@twotype.com';
        document.getElementById('adminPass').value = 'admin123';
    } else if (type === 'colab') {
        document.getElementById('colabEmail').value = 'colaborador@twotype.com';
        document.getElementById('colabPass').value = 'colab123';
    }
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
// Also handles icon animations — merged to avoid monkey-patch pattern
function triggerAnimations(context) {
    context.querySelectorAll('.animate-hidden').forEach(el => {
        el.classList.remove('animate-show');
        void el.offsetWidth; // force reflow
        el.classList.add('animate-show');
    });
    context.querySelectorAll('.feature-icon, .service-icon, [data-lucide]').forEach(icon => {
        icon.classList.remove('animate');
        void icon.offsetWidth;
        icon.classList.add('animate');
    });
}

// Mobile Menu Toggle
function toggleMenu(force) {
    const wrap = document.getElementById('navLinksWrap');
    const toggle = document.getElementById('menuToggle');
    const icon = toggle.querySelector('i');

    const isActive = force !== undefined ? force : !wrap.classList.contains('active');

    wrap.classList.toggle('active', isActive);

    // Update Icon
    if (isActive) {
        toggle.innerHTML = '<i data-lucide="x"></i>';
    } else {
        toggle.innerHTML = '<i data-lucide="menu"></i>';
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Initialization on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();

    document.getElementById('menuToggle').addEventListener('click', () => toggleMenu());

    initAnimations();
    initParticles();
    initServiceTilt();
    initRoulette();
    updateDashboards();

    setTimeout(() => initDrawnIcons(), 100);

    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
        activeSection.style.opacity = '1';
        setTimeout(() => triggerAnimations(activeSection), 200);
    }
});

// ── FUTURISTIC BACKGROUND ENGINE ──
function initParticles() {
    const canvas = document.getElementById('bg-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w, h, dpr;
    let particles = [];
    let waves = [];
    let bokeh = [];
    let mouse = { x: -1000, y: -1000, active: false };

    const resize = () => {
        dpr = window.devicePixelRatio || 1;
        w = canvas.width = window.innerWidth * dpr;
        h = canvas.height = window.innerHeight * dpr;
        ctx.resetTransform(); // Important when using ctx.scale on resize
        ctx.scale(dpr, dpr);
        initElements();
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    });

    // --- Element Classes ---

    class Node {
        constructor() {
            this.reset();
            this.x = Math.random() * window.innerWidth;
            this.y = Math.random() * window.innerHeight;
        }
        reset() {
            this.x = -50;
            this.y = Math.random() * window.innerHeight;
            this.vx = Math.random() * 0.4 + 0.1;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = Math.random() * 1.5 + 0.5;
            this.pulse = Math.random() * Math.PI;
            // Higher opacity on the left
            this.baseAlpha = (this.x < window.innerWidth * 0.5) ? 0.4 : 0.15;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.pulse += 0.03;

            // Updated density check: higher alpha on left
            this.alphaMul = (this.x < window.innerWidth * 0.4) ? 1 : 0.4;

            if (mouse.active) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    this.x -= dx * 0.015;
                    this.y -= dy * 0.015;
                }
            }

            if (this.x > window.innerWidth + 50) this.reset();
            if (this.y < -50 || this.y > window.innerHeight + 50) this.vy *= -1;
        }
        draw() {
            const pSize = this.radius * (1 + Math.sin(this.pulse) * 0.3);
            ctx.beginPath();
            ctx.arc(this.x, this.y, pSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(139, 92, 246, ${(this.baseAlpha + Math.sin(this.pulse) * 0.1) * this.alphaMul})`;
            ctx.fill();
        }
    }

    class waveLayer {
        constructor(offsetY, color, amplitude, frequency) {
            this.offsetY = offsetY;
            this.color = color;
            this.amplitude = amplitude;
            this.frequency = frequency;
            this.phase = Math.random() * Math.PI * 2;
        }
        draw(t) {
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.0;

            const startX = -50;
            for (let x = startX; x <= window.innerWidth + 50; x += (dpr > 1 ? 10 : 5)) {
                // Further reduced alpha for a softer look
                const normX = (x + 50) / (window.innerWidth + 100);
                const alpha = 0.05 + (normX * 0.15);

                const y = (window.innerHeight / 2) +
                    Math.sin(x * this.frequency + t * 0.0008 + this.phase) * this.amplitude +
                    this.offsetY;

                if (x === startX) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                ctx.globalAlpha = alpha;
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    class Spark {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * window.innerWidth;
            this.y = Math.random() * (window.innerHeight + 100);
            this.size = Math.random() * 2 + 0.5;
            this.speed = Math.random() * 0.3 + 0.1;
            this.alpha = Math.random() * 0.3 + 0.1;
        }
        update() {
            this.y -= this.speed;
            if (this.y < -20) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(167, 139, 250, ${this.alpha})`;
            ctx.fill();
        }
    }

    const initElements = () => {
        const isMobile = window.innerWidth < 768;
        particles = [];
        waves = [];
        bokeh = [];

        // Reduced density for mobile performance
        const particleCount = isMobile ? 30 : 60;
        const sparkCount = isMobile ? 20 : 40;

        for (let i = 0; i < particleCount; i++) particles.push(new Node());
        for (let i = 0; i < sparkCount; i++) bokeh.push(new Spark());

        // spread waves vertically a bit more
        const waveColors = ['#8b5cf6', '#5b6af7', '#d8b4fe', '#a78bfa', '#c084fc'];
        const waveCount = isMobile ? 5 : 8;
        const baseAmplitude = isMobile ? 25 : 40;

        for (let i = 0; i < waveCount; i++) {
            waves.push(new waveLayer(
                (i - (waveCount / 2)) * 40 + (Math.random() - 0.5) * 20,
                waveColors[i % waveColors.length],
                baseAmplitude + Math.random() * 20,
                0.003 + Math.random() * 0.003
            ));
        }
    };

    resize();

    const animate = (t) => {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        // 1. Background Sparks (Subtle)
        bokeh.forEach(s => {
            s.update();
            s.draw();
        });

        // 2. Waves (Move behind Plexus and make softer)
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        waves.forEach(w => {
            w.draw(t);
        });
        ctx.restore();

        // 3. Plexus (Draw on top for clarity)
        particles.forEach((p, i) => {
            p.update();
            p.draw();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const alpha = (p.x < window.innerWidth * 0.5) ? 0.15 : 0.08;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(139, 92, 246, ${alpha * (1 - dist / 150)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        });

        requestAnimationFrame(animate);
    };

    let animFrameId = requestAnimationFrame(animate);

    // Pause animation when tab is not visible to save resources
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        } else if (!animFrameId) {
            animFrameId = requestAnimationFrame(animate);
        }
    });
}

// ── SERVICE 3D TILT ──

/**
 * Applies 3D tilt and glow to a single card element.
 * Called at init time and also for dynamically created cards.
 */
function applyTilt(card) {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
}

function initServiceTilt() {
    document.querySelectorAll('.service-card, .member-card').forEach(applyTilt);
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

// ── CHAT SYSTEM ──

function openChat(id) {
    serviceRequests = JSON.parse(localStorage.getItem('nexcore_requests') || '[]');
    currentChatId = id;
    const req = serviceRequests.find(r => r.id === id);
    if (!req) return;

    if (!req.messages) req.messages = [];

    document.getElementById('chatModal').style.display = 'flex';
    renderMessages();
}

// ══════════════════════════════════════════════════════════════
// ── CLIENT SUPPORT CHAT ──
// ══════════════════════════════════════════════════════════════

let currentClientSupportTicketId = null;

function openClientSupportChat(ticketId) {
    const tickets = getAdminTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    currentClientSupportTicketId = ticketId;
    document.getElementById('clientSupportChatModal').style.display = 'flex';
    setTimeout(() => {
        document.querySelector('#clientSupportChatModal .modal-content').classList.add('visible');
    }, 10);
    renderClientSupportChatMessages();
}

function closeClientSupportChat() {
    currentClientSupportTicketId = null;
    const modalContent = document.querySelector('#clientSupportChatModal .modal-content');
    if (modalContent) modalContent.classList.remove('visible');
    setTimeout(() => {
        document.getElementById('clientSupportChatModal').style.display = 'none';
    }, 300);
}

function renderClientSupportChatMessages() {
    const listEl = document.getElementById('clientSupportChatMessages');
    if (!listEl || !currentClientSupportTicketId) return;

    const tickets = getAdminTickets();
    const ticket = tickets.find(t => t.id === currentClientSupportTicketId);
    if (!ticket) return;

    listEl.innerHTML = '';

    // Original Message Bubble
    const msgDate = new Date(ticket.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const originalMsg = `
        <div style="margin-bottom:12px; align-self:flex-start; max-width:85%;">
            <div style="background:var(--bg2); border:1px solid var(--border); padding:12px; border-radius:12px 12px 12px 0;">
                <div style="font-size:11px; color:var(--accent2); margin-bottom:4px; font-weight:600;">Você (Chamado Inicial)</div>
                <div style="font-size:13px; color:#fff; line-height:1.5;">${escapeHtml(ticket.message)}</div>
                <div style="font-size:10px; color:var(--text3); margin-top:6px; text-align:right;">${msgDate}</div>
            </div>
        </div>
    `;
    listEl.insertAdjacentHTML('beforeend', originalMsg);

    // Chat History
    (ticket.chat || []).forEach(msg => {
        const isClient = msg.sender === 'client';
        const align = isClient ? 'flex-end' : 'flex-start';
        const bg = isClient ? 'linear-gradient(135deg, var(--accent1), var(--accent2))' : 'var(--bg2)';
        const border = isClient ? 'none' : '1px solid var(--border)';
        const radius = isClient ? '12px 12px 0 12px' : '12px 12px 12px 0';
        const senderName = isClient ? 'Você' : (msg.senderName || 'Suporte NexCore');
        const nameColor = isClient ? '#fff' : 'var(--accent2)';

        const msgHtml = `
            <div style="margin-bottom:12px; align-self:${align}; max-width:85%; margin-left:${isClient ? 'auto' : '0'}; margin-right:${isClient ? '0' : 'auto'}; display:flex; flex-direction:column;">
                <div style="background:${bg}; border:${border}; padding:12px; border-radius:${radius};">
                    <div style="font-size:11px; color:${nameColor}; margin-bottom:4px; font-weight:600; opacity:0.9;">${senderName}</div>
                    <div style="font-size:13px; color:#fff; line-height:1.5;">${escapeHtml(msg.text)}</div>
                    <div style="font-size:10px; color:rgba(255,255,255,0.6); margin-top:6px; text-align:${isClient ? 'left' : 'right'};">${msg.time}</div>
                </div>
            </div>
        `;
        listEl.insertAdjacentHTML('beforeend', msgHtml);
    });

    listEl.scrollTop = listEl.scrollHeight;
}

function handleClientSupportSendMessage() {
    const input = document.getElementById('clientSupportChatInput');
    const text = input.value.trim();
    if (!text || !currentClientSupportTicketId) return;

    const tickets = getAdminTickets();
    const tIndex = tickets.findIndex(t => t.id === currentClientSupportTicketId);
    if (tIndex === -1) return;

    if (!tickets[tIndex].chat) tickets[tIndex].chat = [];
    tickets[tIndex].chat.push({
        sender: 'client',
        senderName: 'Cliente',
        text: text,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    saveToStorage('nexcore_support_tickets', tickets);
    localStorage.setItem('nexcore_support_ping', Date.now().toString());

    input.value = '';
    renderClientSupportChatMessages();
    renderSupportTickets();
}

function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
    currentChatId = null;
}

function handleSendMessage() {
    serviceRequests = JSON.parse(localStorage.getItem('nexcore_requests') || '[]');
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    const reqIndex = serviceRequests.findIndex(r => r.id === currentChatId);
    if (reqIndex !== -1) {
        // Determine sender based on current section
        const isAdmin = document.getElementById('admin').classList.contains('active');
        let senderName = 'Usuário';
        let senderType = 'colab';

        if (isAdmin) {
            senderName = 'Administrativo';
            senderType = 'admin';
        } else {
            senderName = currentColab ? currentColab.name : 'Desenvolvedor';
            senderType = 'colab';
        }

        serviceRequests[reqIndex].messages.push({
            sender: senderType,
            senderName: senderName,
            text: msg,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });

        saveToStorage('nexcore_requests', serviceRequests);
        input.value = '';
        renderMessages();
    }
}

function renderMessages() {
    serviceRequests = JSON.parse(localStorage.getItem('nexcore_requests') || '[]');
    const container = document.getElementById('chatMessages');
    const req = serviceRequests.find(r => r.id === currentChatId);
    if (!req || !container) return;

    container.innerHTML = req.messages.map(m => `
        <div class="chat-msg ${m.sender}">
            ${escapeHtml(m.text)}
            <span class="time">${escapeHtml(m.time)} - ${escapeHtml(m.senderName || (m.sender === 'admin' ? 'Administrativo' : 'Desenvolvedor'))}</span>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

// ── PROGRESS UPDATES ──

function openUpdateModal(id) {
    currentUpdateId = id;
    const req = serviceRequests.find(r => r.id === id);
    if (!req) return;

    document.getElementById('updateProgressRange').value = req.progress;
    document.getElementById('rangeVal').textContent = req.progress + '%';
    document.getElementById('updateText').value = req.lastUpdate || '';
    document.getElementById('updateModal').style.display = 'flex';
}

function closeUpdateModal() {
    document.getElementById('updateModal').style.display = 'none';
    currentUpdateId = null;
}

function updateRangeText(val) {
    document.getElementById('rangeVal').textContent = val + '%';
}

function confirmUpdate() {
    const progress = document.getElementById('updateProgressRange').value;
    const text = document.getElementById('updateText').value;

    const reqIndex = serviceRequests.findIndex(r => r.id === currentUpdateId);
    if (reqIndex !== -1) {
        serviceRequests[reqIndex].progress = parseInt(progress);
        serviceRequests[reqIndex].lastUpdate = text;
        serviceRequests[reqIndex].lastUpdateDate = new Date().toISOString();

        // Log history
        serviceRequests[reqIndex].history = serviceRequests[reqIndex].history || [];
        serviceRequests[reqIndex].history.push({
            date: new Date().toISOString(),
            type: 'update',
            text: `Progresso: ${progress}%. ` + (text || ''),
            user: currentColab ? currentColab.name : 'Colaborador'
        });

        if (currentColab) {
            logColabActivity(`Atualizou o projeto #${currentUpdateId} para ${progress}%`);
        }

        saveToStorage('nexcore_requests', serviceRequests);
        updateDashboards();
        closeUpdateModal();
        alert('Progresso atualizado com sucesso!');
    }
}

// ── DETAILS MODAL ──
function openDetailsModal(id) {
    const req = serviceRequests.find(r => r.id === id);
    if (!req) return;

    // Detect if we are in admin view
    const isAdmin = document.getElementById('admin').classList.contains('active');
    const isClient = document.getElementById('portal').classList.contains('active');

    // Fill Basic Info
    document.getElementById('detProjectName').textContent = req.serviceType;
    document.getElementById('detClientInfo').textContent = `${req.name} / ${req.company !== '-' ? req.company : 'Projeto Pessoal'}`;

    // Status Badge
    const displayStatus = getDisplayStatus(req.status);
    const statusClass = getStatusClass(req.status);
    document.getElementById('detStatusBadge').innerHTML = `<span class="status-badge ${statusClass}"><span class="status-dot"></span>${displayStatus}</span>`;

    // Progress
    document.getElementById('detProgressVal').textContent = req.progress + '%';
    document.getElementById('detProgressFill').style.width = req.progress + '%';

    // Deadlines
    document.getElementById('detClientDeadline').querySelector('span').textContent = req.deadlineCliente || req.deadline;
    const colabDeadlineEl = document.getElementById('detCollabDeadline');
    if (isAdmin) {
        colabDeadlineEl.style.display = 'block';
        colabDeadlineEl.querySelector('span').textContent = req.deadlineColab || 'Pendente';
    } else {
        colabDeadlineEl.style.display = 'none';
    }

    // Payment Value in details
    let paymentEl = document.getElementById('detPaymentValue');
    if (!paymentEl) {
        paymentEl = document.createElement('div');
        paymentEl.id = 'detPaymentValue';
        paymentEl.style.marginTop = '12px';
        paymentEl.style.padding = '12px';
        paymentEl.style.background = 'rgba(16,185,129,0.1)';
        paymentEl.style.border = '1px solid rgba(16,185,129,0.3)';
        paymentEl.style.borderRadius = '8px';
        paymentEl.style.color = 'var(--green)';
        paymentEl.style.fontWeight = '700';
        paymentEl.style.display = 'flex';
        paymentEl.style.justifyContent = 'space-between';
        document.getElementById('detClientDeadline').parentElement.appendChild(paymentEl);
    }

    if (req.paymentValue && !isClient) {
        paymentEl.style.display = 'flex';
        paymentEl.innerHTML = `<span>Valor:</span> <span>R$ ${parseFloat(req.paymentValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>`;
    } else {
        paymentEl.style.display = 'none';
    }

    // Financial Proposal details
    const finContainer = document.getElementById('detFinancialContainer');
    const finBody = document.getElementById('detFinancialBody');
    const milesArea = document.getElementById('detMilestonesArea');
    const milesList = document.getElementById('detMilestonesList');

    if (req.financialProposal && !isClient) {
        const fp = req.financialProposal;
        finContainer.style.display = 'block';
        
        const typeMap = { 'a_vista': 'À vista', '50_50': '50% / 50%', 'milestones': 'Milestones' };
        
        finBody.innerHTML = `
            <div>
                <div style="font-size:10px; color:var(--text3)">FORMA DE PAGAMENTO</div>
                <div style="font-size:13px; color:#fff">${typeMap[fp.paymentType] || fp.paymentType}</div>
            </div>
            <div>
                <div style="font-size:10px; color:var(--text3)">PRAZO DE PAGAMENTO</div>
                <div style="font-size:13px; color:#fff">${fp.paymentDeadline || '5 dias úteis'}</div>
            </div>
            <div style="grid-column: span 2">
                <div style="font-size:10px; color:var(--text3)">OBSERVAÇÕES</div>
                <div style="font-size:12px; color:var(--text2); font-style:italic">"${fp.notes || 'Nenhuma observação financeira'}"</div>
            </div>
        `;

        if (fp.paymentType === 'milestones' && fp.milestones && fp.milestones.length > 0) {
            milesArea.style.display = 'block';
            milesList.innerHTML = fp.milestones.map(m => `
                <div style="display:flex; justify-content:space-between; font-size:12px; background:rgba(0,0,0,0.2); padding:6px 10px; border-radius:6px">
                    <span style="color:var(--text2)">${escapeHtml(m.trigger)}</span>
                    <span style="color:var(--green); font-weight:600">R$ ${m.value.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                </div>
            `).join('');
        } else {
            milesArea.style.display = 'none';
        }
    } else {
        finContainer.style.display = 'none';
    }

    // Attachment
    const attachmentContainer = document.getElementById('detAttachmentContainer');
    const downloadBtn = document.getElementById('detDownloadBtn');
    if (req.attachment && !isClient) {
        attachmentContainer.style.display = 'block';
        document.getElementById('detFileName').textContent = req.attachment.name;
        if (downloadBtn) {
            downloadBtn.href = req.attachment.url || '#';
            downloadBtn.setAttribute('download', req.attachment.name || 'documento');
        }
    } else {
        attachmentContainer.style.display = 'none';
    }

    // Assigned
    document.getElementById('detAssigned').querySelector('span').textContent = req.assignedTo || 'Aguardando Alocação';

    // Tech Stack
    const stackContainer = document.getElementById('detStack');
    if (req.techStack) {
        stackContainer.innerHTML = req.techStack.split(',').map(s => `<span class="stack-tag">${escapeHtml(s.trim())}</span>`).join('');
    } else {
        stackContainer.innerHTML = '<span style="color:var(--text3); font-size:12px">Pendente de aprovação técnica</span>';
    }

    // Tasks
    const tasksContainer = document.getElementById('detTasksContainer');
    const tasksList = document.getElementById('detTasksList');
    if (tasksContainer && tasksList) {
        if (req.tasks && req.tasks.length > 0) {
            tasksContainer.style.display = 'block';
            tasksList.innerHTML = req.tasks.map((t, idx) => `
                <div style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" disabled ${t.done ? 'checked' : ''} style="accent-color:var(--accent2);">
                    <span style="font-size:13px; color:var(--text2); ${t.done ? 'text-decoration:line-through;opacity:0.6' : ''}">${escapeHtml(t.title)}</span>
                </div>
            `).join('');
        } else {
            tasksContainer.style.display = 'none';
        }
    }

    // Timeline
    const timelineContainer = document.getElementById('detTimelineContainer');
    const timelineList = document.getElementById('detTimelineList');
    if (timelineContainer && timelineList) {
        if (req.history && req.history.length > 0) {
            timelineContainer.style.display = 'block';
            timelineList.innerHTML = req.history.slice().reverse().map(h => `
                <div style="position:relative;">
                    <div style="position:absolute; left:-23px; top:4px; width:12px; height:12px; border-radius:50%; background:var(--accent2); border:2px solid var(--bg3);"></div>
                    <div style="font-size:11px; color:var(--text3);">${new Date(h.date).toLocaleString('pt-BR')} - ${escapeHtml(h.user)}</div>
                    <div style="font-size:13px; color:var(--text2); margin-top:2px;">${escapeHtml(h.text)}</div>
                </div>
            `).join('');
        } else {
            timelineContainer.style.display = 'none';
        }
    }

    // Last Update
    const lastUpdateEl = document.getElementById('detLastUpdate');
    if (req.lastUpdate) {
        lastUpdateEl.textContent = req.lastUpdate;
    } else {
        lastUpdateEl.textContent = 'Nenhuma atualização de desenvolvimento postada ainda.';
    }

    // Chat Visibility
    const chatContainer = document.getElementById('detChatContainer');
    const isColab = document.getElementById('colabPortal').classList.contains('active');
    const isMyProject = req.assignedTo === currentColab?.name;

    if (chatContainer) {
        if (isAdmin || (isColab && isMyProject)) {
            chatContainer.style.display = 'block';
            currentDetailsId = id; // Store current details id for chat
        } else {
            chatContainer.style.display = 'none';
        }
    }

    document.getElementById('detailsModal').style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons({ portal: document.getElementById('detailsModal') });
}

function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
    currentDetailsId = null;
}

function openChatFromDetails() {
    if (currentDetailsId) {
        closeDetailsModal();
        openChat(currentDetailsId);
    }
}

function openColabChatDirect() {
    serviceRequests = JSON.parse(localStorage.getItem('nexcore_requests') || '[]');
    if (!currentColab) return;

    // Find projects assigned to this colab
    const myProjects = serviceRequests.filter(r => r.assignedTo === currentColab.name && r.status !== 'concluido');

    if (myProjects.length === 0) {
        alert('Você não possui projetos ativos assinados para abrir o chat administrativo direto. Aceite uma demanda primeiro.');
    } else if (myProjects.length === 1) {
        openChat(myProjects[0].id);
    } else {
        // If multiple, open the chat of the most recently updated one
        openChat(myProjects[0].id);
    }
}

// ── DESCRIPTION MODAL ──
function openDescriptionModal(id) {
    const req = serviceRequests.find(r => r.id === id);
    if (!req) return;
    const container = document.getElementById('techDescriptionContent');
    if (container) {
        container.textContent = req.edital || 'Nenhuma descrição técnica informada.';
    }
    document.getElementById('descriptionModal').style.display = 'flex';
}

// ── REAL-TIME SYNC FOR SIMULATION ──
window.addEventListener('storage', (e) => {
    if (e.key === 'nexcore_requests') {
        updateDashboards();
        // If chat is open, refresh messages
        if (currentChatId) {
            renderMessages();
        }
    }
});

function closeDescriptionModal() {
    document.getElementById('descriptionModal').style.display = 'none';
}

// ── CURRENCY FORMATTING ──
function formatCurrency(input) {
    let value = input.value.replace(/\D/g, "");
    value = (value / 100).toFixed(2) + "";
    value = value.replace(".", ",");
    value = value.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
    value = value.replace(/(\d)(\d{3}),/g, "$1.$2,");
    input.value = value;
}

function parseCurrency(value) {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}

// ══════════════════════════════════════════════════════════════
// ── ADMIN TAB SYSTEM ──
// ══════════════════════════════════════════════════════════════

let currentAdminTab = 'roadmap';

function switchAdminTab(tab) {
    currentAdminTab = tab;

    // Update tab buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    const btnMap = { roadmap: 'adminTabRoadmap', suporte: 'adminTabSuporte', equipe: 'adminTabEquipe', feedbacks: 'adminTabFeedbacks' };
    const btnId = btnMap[tab];
    if (btnId) {
        const btn = document.getElementById(btnId);
        if(btn) btn.classList.add('active');
    }

    // Show/hide views
    const roadmapView = document.getElementById('adminViewRoadmap');
    const suporteView = document.getElementById('adminViewSuporte');
    const equipeView = document.getElementById('adminViewEquipe');
    const feedbacksView = document.getElementById('adminViewFeedbacks');
    
    if (roadmapView) roadmapView.style.display = tab === 'roadmap' ? '' : 'none';
    if (suporteView) suporteView.style.display = tab === 'suporte' ? '' : 'none';
    if (equipeView) equipeView.style.display = tab === 'equipe' ? '' : 'none';
    if (feedbacksView) feedbacksView.style.display = tab === 'feedbacks' ? '' : 'none';

    if (tab === 'suporte') {
        renderAdminSupportTickets();
    } else if (tab === 'equipe') {
        renderAdminEquipe();
    } else if (tab === 'feedbacks') {
        if(typeof renderAdminFeedbacks === 'function') renderAdminFeedbacks();
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function exportEquipeCSV() {
    const colabs = JSON.parse(localStorage.getItem('nexcore_colabs') || '[]');
    let csv = "Nome,Email,Status,Faturamento Total\n";
    colabs.forEach(c => {
        let status = localStorage.getItem(`nexcore_colab_status_${c.email}`) || 'indefinido';
        csv += `"${c.name}","${c.email}","${status}","N/A"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'equipe_nexcore.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function renderAdminFeedbacks() {
    const list = document.getElementById('adminFeedbacksList');
    if(!list) return;
    
    let feedbacks = JSON.parse(localStorage.getItem('nexcore_feedbacks') || '[]');
    const filterDev = document.getElementById('adminFeedbackFilterDev').value;
    const filterStars = document.getElementById('adminFeedbackFilterStars').value;
    
    if(filterDev !== 'todos') {
        feedbacks = feedbacks.filter(f => f.colabEmail === filterDev);
    }
    if(filterStars !== 'todos') {
        feedbacks = feedbacks.filter(f => f.stars === parseInt(filterStars));
    }
    
    if(feedbacks.length === 0) {
        list.innerHTML = '<div class="empty-state" style="padding:32px;text-align:center;color:var(--text3)">Nenhum feedback encontrado.</div>';
        return;
    }
    
    list.innerHTML = feedbacks.map(f => `
        <div style="background:rgba(255,255,255,0.02); padding:16px; border-radius:12px; border:1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <div style="font-weight:600; color:#fff;">${escapeHtml(f.clientName)} <span style="font-size:12px; color:var(--text3); font-weight:400; margin-left:8px;">${escapeHtml(f.service)}</span></div>
                <div style="display:flex; gap:2px;">
                    ${[1,2,3,4,5].map(s => `<i data-lucide="star" style="width:14px; color:${s <= f.stars ? 'var(--accent2)' : 'var(--text3)'}; fill:${s <= f.stars ? 'var(--accent2)' : 'none'};"></i>`).join('')}
                </div>
            </div>
            <div style="font-size:13px; color:var(--text2); margin-bottom:8px;">${escapeHtml(f.comment || 'Sem comentário')}</div>
            <div style="font-size:11px; color:var(--text3); display:flex; justify-content:space-between;">
                <span>Colaborador: ${escapeHtml(f.colabEmail)}</span>
                <span>${new Date(f.date).toLocaleDateString('pt-BR')}</span>
            </div>
        </div>
    `).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons({ portal: list });
}

function exportFeedbacksCSV() {
    const feedbacks = JSON.parse(localStorage.getItem('nexcore_feedbacks') || '[]');
    let csv = "Data,Cliente,Serviço,Nota,Comentário,Colaborador\n";
    feedbacks.forEach(f => {
        csv += `"${new Date(f.date).toLocaleDateString('pt-BR')}","${escapeHtml(f.clientName)}","${escapeHtml(f.service)}","${f.stars}","${escapeHtml(f.comment).replace(/"/g, '""')}","${escapeHtml(f.colabEmail)}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feedbacks_nexcore.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function renderMyFeedbacks() {
    if(!currentColab) return;
    const list = document.getElementById('colabFeedbacksList');
    const avgDisplay = document.getElementById('colabFeedbackAvg');
    if(!list) return;
    
    let feedbacks = JSON.parse(localStorage.getItem('nexcore_feedbacks') || '[]');
    feedbacks = feedbacks.filter(f => f.colabEmail === currentColab.email);
    
    if(feedbacks.length === 0) {
        list.innerHTML = '<div class="empty-state" style="padding:32px;text-align:center;color:var(--text3)">Você ainda não recebeu feedbacks.</div>';
        if(avgDisplay) avgDisplay.textContent = '0.0';
        return;
    }
    
    const sum = feedbacks.reduce((acc, f) => acc + f.stars, 0);
    const avg = (sum / feedbacks.length).toFixed(1);
    if(avgDisplay) avgDisplay.textContent = avg;
    
    list.innerHTML = feedbacks.map(f => `
        <div style="background:rgba(255,255,255,0.02); padding:16px; border-radius:12px; border:1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <div style="font-weight:600; color:#fff;">${escapeHtml(f.clientName)} <span style="font-size:12px; color:var(--text3); font-weight:400; margin-left:8px;">${escapeHtml(f.service)}</span></div>
                <div style="display:flex; gap:2px;">
                    ${[1,2,3,4,5].map(s => `<i data-lucide="star" style="width:14px; color:${s <= f.stars ? 'var(--accent2)' : 'var(--text3)'}; fill:${s <= f.stars ? 'var(--accent2)' : 'none'};"></i>`).join('')}
                </div>
            </div>
            <div style="font-size:13px; color:var(--text2); margin-bottom:8px;">${escapeHtml(f.comment || 'Sem comentário')}</div>
            <div style="font-size:11px; color:var(--text3); text-align:right;">${new Date(f.date).toLocaleDateString('pt-BR')}</div>
        </div>
    `).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons({ portal: list });
}

// ══════════════════════════════════════════════════════════════
// ── ADMIN SUPPORT SYSTEM ──
// ══════════════════════════════════════════════════════════════

let currentAdminTicketId = null;
let currentAdminTicketFilter = 'todos';

function getAdminTickets() {
    try {
        const data = JSON.parse(localStorage.getItem('nexcore_support_tickets') || '[]');
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function saveAdminTickets(tickets) {
    saveToStorage('nexcore_support_tickets', tickets);
}

function filterAdminTickets(filter, btnEl) {
    currentAdminTicketFilter = filter;
    document.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    renderAdminSupportTickets();
}

function renderAdminSupportTickets() {
    const listEl = document.getElementById('adminTicketList');
    const countEl = document.getElementById('adminSupportCount');
    const badgeEl = document.getElementById('adminSupportBadge');
    if (!listEl) return;

    let tickets = getAdminTickets();
    tickets.sort((a, b) => b.id - a.id);

    const openCount = tickets.filter(t => t.status === 'aberto').length;
    if (countEl) countEl.textContent = tickets.length;
    if (badgeEl) {
        badgeEl.textContent = openCount;
        badgeEl.style.display = openCount > 0 ? 'inline-flex' : 'none';
    }

    if (currentAdminTicketFilter !== 'todos') {
        tickets = tickets.filter(t => t.status === currentAdminTicketFilter);
    }

    listEl.innerHTML = '';
    if (tickets.length === 0) {
        listEl.innerHTML = '<div class="empty-state" style="padding:32px;text-align:center;color:var(--text3);font-size:13px">Nenhum chamado encontrado.</div>';
        return;
    }

    tickets.forEach(ticket => {
        const dateStr = new Date(ticket.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        const statusColors = { aberto: '#ef4444', analise: '#f59e0b', resolvido: '#10b981' };
        const statusLabels = { aberto: 'Aberto', analise: 'Em Análise', resolvido: 'Resolvido' };
        const color = statusColors[ticket.status] || '#9ca3af';
        const label = statusLabels[ticket.status] || ticket.status;
        const msgCount = (ticket.chat || []).length;
        const isActive = currentAdminTicketId === ticket.id;
        const chatCount = msgCount > 0 ? `<span class="admin-ticket-chat-count">${msgCount} msg</span>` : '';

        const item = document.createElement('div');
        item.className = `admin-ticket-item${isActive ? ' selected' : ''}`;
        item.setAttribute('onclick', `selectAdminTicket(${ticket.id})`);
        item.innerHTML = `
            <div class="admin-ticket-item-header">
                <div class="admin-ticket-subject">${escapeHtml(ticket.subject)}</div>
                <div style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;background:${color}22;color:${color};border:1px solid ${color}44;white-space:nowrap">${label}</div>
            </div>
            <div class="admin-ticket-item-meta">
                <span style="color:var(--text3);font-size:11px">${escapeHtml(ticket.category)}</span>
                <span style="color:var(--text3);font-size:11px">${dateStr}</span>
            </div>
            ${chatCount}
        `;
        listEl.appendChild(item);
    });
}

function selectAdminTicket(id) {
    currentAdminTicketId = id;
    renderAdminSupportTickets(); // re-render to update active state

    const tickets = getAdminTickets();
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;

    // Show chat panel
    const emptyEl = document.getElementById('adminSupportChatEmpty');
    const activeEl = document.getElementById('adminSupportChatActive');
    if (emptyEl) emptyEl.style.display = 'none';
    if (activeEl) { activeEl.style.display = 'flex'; activeEl.style.flexDirection = 'column'; }

    // Set header
    const subjectEl = document.getElementById('adminChatTicketSubject');
    const metaEl = document.getElementById('adminChatTicketMeta');
    if (subjectEl) subjectEl.textContent = ticket.subject;
    if (metaEl) metaEl.textContent = `${ticket.category} · ${ticket.clientName || 'Cliente'} · ${new Date(ticket.date).toLocaleDateString('pt-BR')}`;

    // Set status select
    const selectEl = document.getElementById('adminTicketStatusSelect');
    if (selectEl) selectEl.value = ticket.status;

    // Render messages
    renderAdminSupportMessages();

    if (typeof lucide !== 'undefined') lucide.createIcons({ portal: document.getElementById('adminSupportChatPanel') });
}

function renderAdminSupportMessages() {
    const container = document.getElementById('adminSupportMessages');
    if (!container || !currentAdminTicketId) return;

    const tickets = getAdminTickets();
    const ticket = tickets.find(t => t.id === currentAdminTicketId);
    if (!ticket) return;

    const chat = ticket.chat || [];
    const initialMsg = `
        <div class="support-chat-msg client">
            <div class="support-chat-bubble">${escapeHtml(ticket.message)}</div>
            <div class="support-chat-time">Mensagem original · ${ticket.clientName || 'Cliente'}</div>
        </div>
    `;

    const msgs = chat.map(m => `
        <div class="support-chat-msg ${m.sender}">
            <div class="support-chat-bubble">${escapeHtml(m.text)}</div>
            <div class="support-chat-time">${escapeHtml(m.time)} · ${escapeHtml(m.senderName)}</div>
        </div>
    `).join('');

    container.innerHTML = initialMsg + msgs;
    container.scrollTop = container.scrollHeight;
}

function adminSendSupportMessage() {
    const input = document.getElementById('adminSupportInput');
    if (!input || !currentAdminTicketId) return;
    const text = input.value.trim();
    if (!text) return;

    const tickets = getAdminTickets();
    const idx = tickets.findIndex(t => t.id === currentAdminTicketId);
    if (idx === -1) return;

    if (!tickets[idx].chat) tickets[idx].chat = [];
    tickets[idx].chat.push({
        sender: 'admin',
        senderName: 'Administrativo',
        text,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    // Auto move to analise if aberto
    if (tickets[idx].status === 'aberto') {
        tickets[idx].status = 'analise';
        const selectEl = document.getElementById('adminTicketStatusSelect');
        if (selectEl) selectEl.value = 'analise';
    }

    saveAdminTickets(tickets);
    input.value = '';
    renderAdminSupportMessages();
    renderAdminSupportTickets();

    // Trigger client side re-render via storage event (cross-tab)
    localStorage.setItem('nexcore_support_ping', Date.now().toString());
}

function adminUpdateTicketStatus() {
    const selectEl = document.getElementById('adminTicketStatusSelect');
    if (!selectEl || !currentAdminTicketId) return;
    const newStatus = selectEl.value;

    const tickets = getAdminTickets();
    const idx = tickets.findIndex(t => t.id === currentAdminTicketId);
    if (idx === -1) return;

    tickets[idx].status = newStatus;
    saveAdminTickets(tickets);

    // Ping client side
    localStorage.setItem('nexcore_support_ping', Date.now().toString());

    renderAdminSupportTickets();
}



// Override renderSupportTickets to show chat replies from admin
function renderSupportTickets() {
    const listEl = document.getElementById('clientSupportTickets');
    if (!listEl) return;

    const tickets = getAdminTickets();
    listEl.innerHTML = '';

    if (tickets.length === 0) {
        listEl.innerHTML = '<div class="empty-state" style="padding: 20px; text-align: center; color: var(--text3); font-size: 13px;">Você ainda não possui nenhum chamado em aberto.</div>';
        return;
    }

    tickets.sort((a, b) => b.id - a.id);

    tickets.forEach(ticket => {
        const dateStr = new Date(ticket.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        let statusColor = '#9ca3af';
        let statusLabel = 'Aberto';
        if (ticket.status === 'aberto') { statusColor = '#ef4444'; statusLabel = 'Aberto'; }
        else if (ticket.status === 'analise') { statusColor = '#f59e0b'; statusLabel = 'Em Análise'; }
        else if (ticket.status === 'resolvido') { statusColor = '#10b981'; statusLabel = 'Resolvido'; }

        const lastReply = (ticket.chat || []).filter(m => m.sender === 'admin').pop();
        const replyHtml = lastReply
            ? `<div class="ticket-admin-reply"><i data-lucide="message-square" style="width:12px;vertical-align:-2px;margin-right:4px;color:var(--accent2)"></i><strong>Admin:</strong> ${escapeHtml(lastReply.text)}</div>`
            : '';

        const html = `
            <div class="ticket-item fade-in" onclick="openClientSupportChat(${ticket.id})" style="cursor:pointer; transition:all 0.2s;">
                <div class="ticket-header">
                    <div class="ticket-subject">${escapeHtml(ticket.subject)}</div>
                    <div style="font-size:10px;font-weight:700;text-transform:uppercase;padding:3px 8px;border-radius:6px;background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;">${statusLabel}</div>
                </div>
                <div class="ticket-meta">
                    <span>${ticket.category}</span>
                    <span>${dateStr}</span>
                </div>
                ${replyHtml}
            </div>
        `;
        listEl.insertAdjacentHTML('beforeend', html);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons({ portal: listEl });
}

// ══════════════════════════════════════════════════════════════
// ── ADMIN EQUIPE (COLABORADOR PROFILES + PRIVATE CHAT) ──
// ══════════════════════════════════════════════════════════════

// Known collaborators (extend here if more are added)
const KNOWN_COLABS = [
    { name: 'Colaborador', email: 'colaborador@twotype.com', role: 'Desenvolvedor Fullstack', avatar: '👨‍💻' },
    { name: 'Henrique S.', email: 'henrique@twotype.com', role: 'UI/UX & Marketing', avatar: '🎨' },
    { name: 'Davi B.', email: 'davi@twotype.com', role: 'Fullstack & Automação', avatar: '⚙️' },
];

let currentAdminColabChatEmail = null;

function renderAdminEquipe() {
    const grid = document.getElementById('adminEquipeGrid');
    const countEl = document.getElementById('adminEquipeCount');
    if (!grid) return;

    let allChats = {};
    try { allChats = JSON.parse(localStorage.getItem('nexcore_colab_chats') || '{}'); } catch (e) { allChats = {}; }
    if (countEl) countEl.textContent = KNOWN_COLABS.length;

    grid.innerHTML = '';

    KNOWN_COLABS.forEach(colab => {
        const chatMsgs = allChats[colab.email] || [];
        const unread = chatMsgs.filter(m => m.sender === 'colab' && !m.readByAdmin).length;
        const lastMsg = chatMsgs[chatMsgs.length - 1];
        
        let status = localStorage.getItem(`nexcore_colab_status_${colab.email}`) || 'disponivel';
        let statusColor = status === 'disponivel' ? 'var(--green)' : status === 'ocupado' ? 'var(--amber)' : 'var(--text3)';
        let statusText = status === 'disponivel' ? 'Disponível' : status === 'ocupado' ? 'Ocupado' : 'Férias';
        
        let reqs = getRequests();
        let projCount = reqs.filter(r => r.status === 'execucao' && r.assignedTo === colab.name.split(' ')[0]).length; // name matching is a bit brittle, fallback below
        if(colab.email === 'colaborador@twotype.com') {
             projCount = reqs.filter(r => r.status === 'execucao' && r.assignedTo === 'colaborador').length;
        }

        const score = calculatePerformanceScore(colab.email, colab.name);
        
        const card = document.createElement('div');
        card.className = 'admin-equipe-card';
        card.style.position = 'relative';
        card.innerHTML = `
            <div style="position:absolute; top:12px; right:12px; display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text2); background:rgba(0,0,0,0.2); padding:4px 8px; border-radius:12px;">
                <div style="width:8px; height:8px; border-radius:50%; background:${statusColor}; box-shadow:0 0 5px ${statusColor};"></div>
                ${statusText}
            </div>
            <div class="admin-equipe-avatar">${colab.avatar}</div>
            <div class="admin-equipe-info">
                <div class="admin-equipe-name">${escapeHtml(colab.name)}</div>
                <div class="admin-equipe-role">${escapeHtml(colab.role)}</div>
                <div style="display:flex; gap:12px; margin-top:6px;">
                    <div style="font-size:11px; color:var(--accent2); background:rgba(100,255,218,0.05); padding:2px 8px; border-radius:4px;"><i data-lucide="layers" style="width:10px; margin-right:4px;"></i> ${projCount} projetos</div>
                    <div style="font-size:11px; color:var(--green); background:rgba(46,204,113,0.05); padding:2px 8px; border-radius:4px;"><i data-lucide="award" style="width:10px; margin-right:4px;"></i> Score: ${score}</div>
                </div>
                ${lastMsg ? `<div class="admin-equipe-last-msg" style="margin-top:8px;">${escapeHtml(lastMsg.text.substring(0, 40))}${lastMsg.text.length > 40 ? '...' : ''}</div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
                ${unread > 0 ? `<span class="admin-tab-badge" style="position:static;display:inline-flex">${unread}</span>` : ''}
                <button class="btn-primary" style="font-size:12px;padding:8px 16px" onclick="openAdminColabChat('${colab.email}', '${escapeHtml(colab.name)}')">
                    <i data-lucide="message-circle" style="width:14px;height:14px;margin-right:4px"></i>
                    Chat Privado
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons({ portal: grid });
}

function openAdminColabChat(email, name) {
    currentAdminColabChatEmail = email;

    const nameEl = document.getElementById('adminColabChatName');
    const emailEl = document.getElementById('adminColabChatEmail');
    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;

    document.getElementById('adminColabChatModal').style.display = 'flex';
    renderAdminColabMessages();

    // Mark messages as read
    markColabMessagesRead(email);

    if (typeof lucide !== 'undefined') lucide.createIcons({ portal: document.getElementById('adminColabChatModal') });
}

function closeAdminColabChat() {
    document.getElementById('adminColabChatModal').style.display = 'none';
    currentAdminColabChatEmail = null;
}

function renderAdminColabMessages() {
    const container = document.getElementById('adminColabChatMessages');
    if (!container || !currentAdminColabChatEmail) return;

    let allChats = {};
    try { allChats = JSON.parse(localStorage.getItem('nexcore_colab_chats') || '{}'); } catch (e) { allChats = {}; }
    const msgs = allChats[currentAdminColabChatEmail] || [];

    if (msgs.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:13px;padding:32px">Nenhuma mensagem ainda. Seja o primeiro a enviar!</div>';
        return;
    }

    container.innerHTML = msgs.map(m => `
        <div class="chat-msg ${m.sender === 'admin' ? 'admin' : 'colab'}">
            ${escapeHtml(m.text)}
            <span class="time">${escapeHtml(m.time)} — ${escapeHtml(m.senderName)}</span>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

function sendAdminColabMessage() {
    const input = document.getElementById('adminColabChatInput');
    if (!input || !currentAdminColabChatEmail) return;
    const text = input.value.trim();
    if (!text) return;

    let allChats = {};
    try { allChats = JSON.parse(localStorage.getItem('nexcore_colab_chats') || '{}'); } catch (e) { allChats = {}; }
    if (!allChats[currentAdminColabChatEmail]) allChats[currentAdminColabChatEmail] = [];
    allChats[currentAdminColabChatEmail].push({
        sender: 'admin',
        senderName: 'Administrativo',
        text,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        readByColab: false
    });

    saveToStorage('nexcore_colab_chats', allChats);
    input.value = '';
    renderAdminColabMessages();

    // Trigger colab panel (cross-tab)
    localStorage.setItem('nexcore_colab_chat_ping', Date.now().toString());
}

function markColabMessagesRead(email) {
    let allChats = {};
    try { allChats = JSON.parse(localStorage.getItem('nexcore_colab_chats') || '{}'); } catch (e) { allChats = {}; }
    if (!allChats[email]) return;
    allChats[email].forEach(m => { if (m.sender === 'colab') m.readByAdmin = true; });
    saveToStorage('nexcore_colab_chats', allChats);
    renderAdminEquipe();
}

// ══════════════════════════════════════════════════════════════
// ── COLLABORATOR → ADMIN CHAT ──
// ══════════════════════════════════════════════════════════════

function openColabAdminChat() {
    if (!currentColab) return;
    document.getElementById('colabAdminChatModal').style.display = 'flex';
    renderColabAdminMessages();
    markAdminMessagesRead();
    if (typeof lucide !== 'undefined') lucide.createIcons({ portal: document.getElementById('colabAdminChatModal') });
}

function closeColabAdminChat() {
    document.getElementById('colabAdminChatModal').style.display = 'none';
}

function renderColabAdminMessages() {
    const container = document.getElementById('colabAdminChatMessages');
    if (!container || !currentColab) return;

    let allChats = {};
    try { allChats = JSON.parse(localStorage.getItem('nexcore_colab_chats') || '{}'); } catch (e) { allChats = {}; }
    const msgs = allChats[currentColab.email] || [];

    if (msgs.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:13px;padding:32px">Nenhuma mensagem ainda. Escreva para o administrativo!</div>';
        return;
    }

    container.innerHTML = msgs.map(m => `
        <div class="chat-msg ${m.sender === 'colab' ? 'colab' : 'admin'}">
            ${escapeHtml(m.text)}
            <span class="time">${escapeHtml(m.time)} — ${escapeHtml(m.senderName)}</span>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

function sendColabMessage() {
    const input = document.getElementById('colabAdminChatInput');
    if (!input || !currentColab) return;
    const text = input.value.trim();
    if (!text) return;

    let allChats = {};
    try { allChats = JSON.parse(localStorage.getItem('nexcore_colab_chats') || '{}'); } catch (e) { allChats = {}; }
    if (!allChats[currentColab.email]) allChats[currentColab.email] = [];
    allChats[currentColab.email].push({
        sender: 'colab',
        senderName: currentColab.name,
        text,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        readByAdmin: false
    });

    saveToStorage('nexcore_colab_chats', allChats);
    input.value = '';
    renderColabAdminMessages();

    // Ping admin
    localStorage.setItem('nexcore_colab_chat_ping', Date.now().toString());
}

function markAdminMessagesRead() {
    if (!currentColab) return;
    let allChats = {};
    try { allChats = JSON.parse(localStorage.getItem('nexcore_colab_chats') || '{}'); } catch (e) { allChats = {}; }
    if (!allChats[currentColab.email]) return;
    allChats[currentColab.email].forEach(m => { if (m.sender === 'admin') m.readByColab = true; });
    saveToStorage('nexcore_colab_chats', allChats);
    updateColabUnreadBadge();
}

function updateColabUnreadBadge() {
    if (!currentColab) return;
    let allChats = {};
    try { allChats = JSON.parse(localStorage.getItem('nexcore_colab_chats') || '{}'); } catch (e) { allChats = {}; }
    const msgs = allChats[currentColab.email] || [];
    const unread = msgs.filter(m => m.sender === 'admin' && !m.readByColab).length;
    const badge = document.getElementById('colabUnreadBadge');
    if (badge) {
        badge.style.display = unread > 0 ? 'inline-flex' : 'none';
        badge.textContent = unread;
    }
}

// ══════════════════════════════════════════════════════════════
// ── STORAGE EVENT LISTENERS (real-time sync) ──
// ══════════════════════════════════════════════════════════════

window.addEventListener('storage', (e) => {
    if (e.key === 'nexcore_requests') {
        updateDashboards();
        if (currentChatId) renderMessages();
    }
    // Support ticket ping: client side re-renders tickets
    if (e.key === 'nexcore_support_ping') {
        renderSupportTickets();
        if (currentAdminTab === 'suporte') {
            renderAdminSupportTickets();
            if (currentAdminTicketId) renderAdminSupportMessages();
        }
    }
    // Colab chat ping
    if (e.key === 'nexcore_colab_chat_ping') {
        // Re-render colab chat if open
        if (document.getElementById('colabAdminChatModal')?.style.display !== 'none') {
            renderColabAdminMessages();
        }
        // Re-render admin colab chat if open
        if (document.getElementById('adminColabChatModal')?.style.display !== 'none') {
            renderAdminColabMessages();
        }
        // Update unread badge for colab
        updateColabUnreadBadge();
        // Refresh equipe list
        if (currentAdminTab === 'equipe') renderAdminEquipe();
    }
});
