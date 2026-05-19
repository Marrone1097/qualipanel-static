// ==========================================
// SUPABASE DIRECT CONNECTION
// ==========================================
const SUPABASE_URL = 'https://ygdihknianukzjcdrduu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZGloa25pYW51a3pqY2RyZHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNDMzNzAsImV4cCI6MjA5NDcxOTM3MH0.4w2PpVU3glCQH6bR95vrZ7qEdfwOEZcYocuA0LnLJJo';
const API_BASE = 'https://qualipanel.vercel.app/api';

let currentProjectId = null;
let currentUser = null;
let projectsCache = [];

// ==========================================
// SUPABASE FETCH HELPER
// ==========================================
async function supabaseFetch(path, options = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...options.headers
        },
        ...options
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// ==========================================
// JOURNEY FLOW LOGIC
// ==========================================
const SVG_NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById('journey-line');
const board = document.getElementById('board');
const stations = ['st-1', 'st-2', 'st-3', 'st-4', 'st-5', 'st-6', 'st-7', 'st-8'];

// ==========================================
// CUSTOM CONFIRM DIALOG
// ==========================================
function showConfirm(title, message, onConfirm) {
    const overlay = document.getElementById('custom-confirm-overlay');
    if (!overlay) return;
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerHTML = message.replace(/\n/g, '<br>');
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('active'), 10);

    const close = () => {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.style.display = 'none'; }, 400);
        document.getElementById('btn-confirm-ok').onclick = null;
        document.getElementById('btn-confirm-cancel').onclick = null;
    };
    document.getElementById('btn-confirm-cancel').onclick = close;
    document.getElementById('btn-confirm-ok').onclick = () => { close(); if (typeof onConfirm === 'function') onConfirm(); };
}

// ==========================================
// STATE MANAGEMENT
// ==========================================
let uploadsState = [];

// ==========================================
// REAL DATA FROM SUPABASE
// ==========================================
async function syncRealData() {
    try {
        // Busca contatos do projeto selecionado ou todos
        let query = 'projeto_clientes?select=status';
        if (currentProjectId) query += `&projeto_id=eq.${currentProjectId}`;

        const contatos = await supabaseFetch(query).catch(() => []);

        const counts = {
            novo: 0, contatado: 0, respondeu: 0, aceitou: 0,
            tcle_assinado: 0, agendado: 0, realizado: 0
        };
        contatos.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

        const total = contatos.length;

        // Busca incentivos pagos
        let incentQuery = 'incentivos?select=status';
        if (currentProjectId) incentQuery += `&projeto_id=eq.${currentProjectId}`;
        const incentivos = await supabaseFetch(incentQuery).catch(() => []);
        const pagos = incentivos.filter(i => i.status === 'pago').length;
        const pendentesInc = incentivos.filter(i => i.status !== 'pago').length;

        // Busca agendamentos
        let agendQuery = 'agendamentos?select=status';
        if (currentProjectId) agendQuery += `&projeto_id=eq.${currentProjectId}`;
        const agendamentos = await supabaseFetch(agendQuery).catch(() => []);
        const agendados = agendamentos.length;

        const updateMetric = (sel, val) => {
            const el = document.querySelector(sel);
            if (el) el.textContent = val;
        };

        updateMetric('#st-1 .metric-box:nth-child(1) .metric-value', total || 0);
        updateMetric('#st-1 .metric-box:nth-child(2) .metric-value', total > 0 ? '100%' : '0%');
        updateMetric('#st-2 .metric-box:nth-child(1) .metric-value', counts.contatado || 0);
        updateMetric('#st-2 .metric-box:nth-child(2) .metric-value', 0);
        updateMetric('#st-3 .metric-box:nth-child(1) .metric-value', counts.respondeu > 0 && counts.contatado > 0 ? Math.round((counts.respondeu / counts.contatado) * 100) + '%' : '0%');
        updateMetric('#st-3 .metric-box:nth-child(2) .metric-value', counts.respondeu || 0);
        updateMetric('#st-4 .metric-box:nth-child(1) .metric-value', counts.aceitou || 0);
        updateMetric('#st-4 .metric-box:nth-child(2) .metric-value', 0);
        updateMetric('#st-5 .metric-box:nth-child(1) .metric-value', counts.tcle_assinado || 0);
        updateMetric('#st-5 .metric-box:nth-child(2) .metric-value', Math.max(0, counts.aceitou - counts.tcle_assinado));
        updateMetric('#st-6 .metric-box:nth-child(1) .metric-value', agendados || 0);
        updateMetric('#st-6 .metric-box:nth-child(2) .metric-value', Math.ceil(agendados / 8) || 0);
        updateMetric('#st-7 .metric-box:nth-child(1) .metric-value', counts.realizado || 0);
        updateMetric('#st-7 .metric-box:nth-child(2) .metric-value', agendados > 0 ? Math.round(((agendados - counts.realizado) / agendados) * 100) + '%' : '0%');
        updateMetric('#st-8 .metric-box:nth-child(1) .metric-value', pagos || 0);
        updateMetric('#st-8 .metric-box:nth-child(2) .metric-value', pendentesInc || 0);

    } catch (err) {
        console.warn('Usando dados simulados:', err.message);
        syncSimulatedData();
    }
}

function syncSimulatedData() {
    const total = uploadsState.reduce((s, u) => s + u.qtd, 0) || 150;
    const data = {
        st1: [total, '98%'],
        st2: [Math.floor(total * 0.9), Math.floor(total * 0.07)],
        st3: ['45%', Math.floor(total * 0.05)],
        st4: [Math.floor(total * 0.2), Math.floor(total * 0.05)],
        st5: [Math.floor(total * 0.17), Math.floor(total * 0.03)],
        st6: [Math.floor(total * 0.14), 2],
        st7: [Math.floor(total * 0.1), '10%'],
        st8: [Math.floor(total * 0.08), Math.floor(total * 0.02)]
    };
    const u = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
    u('#st-1 .metric-box:nth-child(1) .metric-value', data.st1[0]);
    u('#st-1 .metric-box:nth-child(2) .metric-value', data.st1[1]);
    u('#st-2 .metric-box:nth-child(1) .metric-value', data.st2[0]);
    u('#st-2 .metric-box:nth-child(2) .metric-value', data.st2[1]);
    u('#st-3 .metric-box:nth-child(1) .metric-value', data.st3[0]);
    u('#st-3 .metric-box:nth-child(2) .metric-value', data.st3[1]);
    u('#st-4 .metric-box:nth-child(1) .metric-value', data.st4[0]);
    u('#st-4 .metric-box:nth-child(2) .metric-value', data.st4[1]);
    u('#st-5 .metric-box:nth-child(1) .metric-value', data.st5[0]);
    u('#st-5 .metric-box:nth-child(2) .metric-value', data.st5[1]);
    u('#st-6 .metric-box:nth-child(1) .metric-value', data.st6[0]);
    u('#st-6 .metric-box:nth-child(2) .metric-value', data.st6[1]);
    u('#st-7 .metric-box:nth-child(1) .metric-value', data.st7[0]);
    u('#st-7 .metric-box:nth-child(2) .metric-value', data.st7[1]);
    u('#st-8 .metric-box:nth-child(1) .metric-value', data.st8[0]);
    u('#st-8 .metric-box:nth-child(2) .metric-value', data.st8[1]);
}

syncRealData();
setInterval(syncRealData, 60000);

// ==========================================
// LOAD PROJECTS INTO SELECTOR
// ==========================================
async function loadProjects() {
    try {
        const projetos = await supabaseFetch('projetos?select=id,nome,tipo&order=created_at.desc');
        projectsCache = projetos;

        const selector = document.getElementById('project-selector');
        if (!selector) return;

        selector.innerHTML = '<option value="">Todos os Projetos</option>';
        projetos.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.nome;
            selector.appendChild(opt);
        });

        selector.addEventListener('change', () => {
            currentProjectId = selector.value || null;
            const nome = selector.options[selector.selectedIndex].text;
            showToast(`Projeto: ${nome}`, 'info');
            syncRealData();
        });
    } catch (e) {
        console.warn('Projetos não carregados (modo demo)');
    }
}

// ==========================================
// SVG JOURNEY BELT
// ==========================================
function getElementCenter(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const card = el.querySelector('.station-card');
    if (!card) return null;
    const rect = card.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    return {
        x: rect.left - boardRect.left + rect.width / 2,
        y: rect.top - boardRect.top + rect.height / 2
    };
}

function drawBelt() {
    svg.innerHTML = '';
    const points = stations.map(id => getElementCenter(id)).filter(p => p !== null);
    if (points.length < 2) return;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1], curr = points[i];
        if (Math.abs(curr.y - prev.y) < 50) {
            d += ` L ${curr.x} ${curr.y}`;
        } else {
            const co = prev.x > window.innerWidth / 2 ? 200 : -200;
            d += ` C ${prev.x + co} ${prev.y}, ${curr.x + co} ${curr.y}, ${curr.x} ${curr.y}`;
        }
    }

    const unlockedStations = stations.filter(id => {
        const el = document.getElementById(id);
        return el && !el.querySelector('.station-card')?.classList.contains('station-locked');
    });
    const up = unlockedStations.map(id => getElementCenter(id)).filter(p => p !== null);
    let dU = '';
    if (up.length > 0) {
        dU = `M ${up[0].x} ${up[0].y}`;
        for (let i = 1; i < up.length; i++) {
            const prev = up[i - 1], curr = up[i];
            if (Math.abs(curr.y - prev.y) < 50) {
                dU += ` L ${curr.x} ${curr.y}`;
            } else {
                const co = prev.x > window.innerWidth / 2 ? 200 : -200;
                dU += ` C ${prev.x + co} ${prev.y}, ${curr.x + co} ${curr.y}, ${curr.x} ${curr.y}`;
            }
        }
    }

    const belt = document.createElementNS(SVG_NS, 'path');
    belt.setAttribute('d', d);
    belt.setAttribute('class', 'belt-path');
    svg.appendChild(belt);

    if (dU) {
        ['belt-glow', 'belt-core', 'belt-pulse'].forEach(cls => {
            const p = document.createElementNS(SVG_NS, 'path');
            p.setAttribute('d', dU);
            p.setAttribute('class', cls);
            svg.appendChild(p);
        });
    }
}

// ==========================================
// PARALLAX
// ==========================================
window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    document.getElementById('parallax-bg-1').style.transform = `translateY(${sy * -0.2}px)`;
    document.getElementById('parallax-bg-2').style.transform = `translateY(${sy * -0.1}px)`;
    document.getElementById('parallax-bg-3').style.transform = `translateY(${sy * -0.05}px)`;
});

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'fa-check-circle', warning: 'fa-exclamation-triangle', error: 'fa-times-circle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info} toast-icon"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 4000);
}

// ==========================================
// MODAL ENGINE
// ==========================================
const modal = document.getElementById('interactive-modal');
const modalClose = document.getElementById('modal-close');
const modalIcon = document.getElementById('modal-icon');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalTitle = document.getElementById('modal-title');
const modalLoader = document.getElementById('modal-loader');
const modalData = document.getElementById('modal-data');

function openModal(stepNum, title, iconHtml, iconClass) {
    modalSubtitle.textContent = `ETAPA ${stepNum} — TEMPO REAL`;
    modalTitle.textContent = title;
    modalIcon.innerHTML = iconHtml;
    modalIcon.className = `modal-icon ${iconClass}`;
    modalLoader.style.display = 'flex';
    modalData.style.display = 'none';
    modalData.innerHTML = '';
    modal.classList.add('active');

    setTimeout(() => {
        modalLoader.style.display = 'none';
        modalData.innerHTML = getStageContent(stepNum);
        modalData.style.display = 'block';
        bindModalEvents(stepNum);
    }, 600);
}

function openGenericModal(title, subtitle, iconHtml, iconClass, contentHtml, onBind) {
    modalSubtitle.textContent = subtitle;
    modalTitle.textContent = title;
    modalIcon.innerHTML = iconHtml;
    modalIcon.className = `modal-icon ${iconClass}`;
    modalLoader.style.display = 'none';
    modalData.innerHTML = contentHtml;
    modalData.style.display = 'block';
    modal.classList.add('active');
    if (typeof onBind === 'function') setTimeout(onBind, 50);
}

modalClose.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

// ==========================================
// STAGE CONTENT TEMPLATES
// ==========================================
function getStageContent(stepNum) {
    switch (stepNum) {
        case '01': {
            let rowsHtml = uploadsState.length === 0
                ? '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:20px;">Nenhum arquivo processado. Importe um mailing para começar.</td></tr>'
                : uploadsState.map(u => `
                    <tr data-upload-id="${u.id}">
                        <td>${u.fileName}</td>
                        <td>${u.time}</td>
                        <td class="qtd-cell">${u.qtd.toLocaleString('pt-BR')}</td>
                        <td><span class="mock-badge green">${u.status}</span></td>
                        <td style="display:flex;gap:5px;">
                            <button class="btn-action btn-process" style="padding:5px 10px;font-size:0.7rem;">Processar</button>
                            <button class="btn-action btn-view-list" style="padding:5px 10px;font-size:0.7rem;color:#38bdf8;" title="Ver Contatos"><i class="fas fa-eye"></i></button>
                            <button class="btn-action btn-delete-upload" style="padding:5px 10px;font-size:0.7rem;color:#ef4444;" title="Apagar Lote"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`).join('');

            return `<div class="modal-dashboard-view">
                <div class="upload-zone" style="border:2px dashed rgba(255,255,255,0.2);border-radius:12px;padding:30px;text-align:center;margin-bottom:20px;background:rgba(0,0,0,0.2);">
                    <i class="fas fa-cloud-upload-alt" style="font-size:2.5rem;color:var(--color-blue);margin-bottom:10px;"></i>
                    <h4 style="color:#fff;margin-bottom:5px;">Arraste sua planilha (.xlsx, .csv)</h4>
                    <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:15px;">Mapeamento automático de Colunas (Nome, Telefone, Email)</p>
                    <div style="display:flex;gap:10px;justify-content:center;">
                        <button id="btn-download-template" class="btn-action btn-outline-green" style="width:auto;padding:8px 15px;font-size:0.8rem;"><i class="fas fa-file-excel"></i> Baixar Modelo</button>
                        <input type="file" id="real-file-upload" accept=".csv,.xlsx,.xls" style="display:none;">
                        <button id="btn-select-file" class="btn-action btn-blue" style="width:auto;padding:8px 20px;"><i class="fas fa-upload"></i> Selecionar Arquivo</button>
                    </div>
                </div>
                <table class="mock-table" id="upload-table">
                    <thead><tr><th>Lote de Importação</th><th>Data</th><th>Qtd</th><th>Status</th><th>Ação</th></tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>`;
        }
        case '02':
            return `<div class="modal-dashboard-view">
                <div style="display:flex;gap:15px;margin-bottom:20px;">
                    <button class="btn-action btn-green btn-disparar" data-canal="WhatsApp" style="flex:1;"><i class="fab fa-whatsapp"></i> Disparar Régua WhatsApp</button>
                    <button class="btn-action btn-blue btn-disparar" data-canal="E-mail" style="flex:1;"><i class="fas fa-envelope"></i> Disparar E-mail Marketing</button>
                </div>
                <table class="mock-table">
                    <thead><tr><th>Campanha / Régua</th><th>Canal</th><th>Entrega</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td>Convite Inicial (Dia 1)</td><td><i class="fab fa-whatsapp text-green"></i> WhatsApp</td><td>98.5%</td><td><span class="mock-badge green">Concluído</span></td></tr>
                        <tr><td>Lembrete (Dia 3)</td><td><i class="fas fa-envelope text-blue"></i> E-mail</td><td>45.0%</td><td><span class="mock-badge orange">Enviando...</span></td></tr>
                    </tbody>
                </table>
            </div>`;
        case '03':
            return `<div class="modal-dashboard-view">
                <div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:15px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <h4 style="color:#fff;">Caixa de Entrada (Triagem Manual)</h4>
                        <p style="color:var(--text-secondary);font-size:0.8rem;">Contatos que responderam e exigem qualificação humana.</p>
                    </div>
                    <button id="btn-softphone" class="btn-action btn-blue" style="width:auto;padding:10px 20px;"><i class="fas fa-headset"></i> Abrir Softphone</button>
                </div>
                <table class="mock-table">
                    <thead><tr><th>Candidato</th><th>Última Mensagem</th><th>Espera</th><th>Ação</th></tr></thead>
                    <tbody>
                        <tr><td>Aline Ferreira</td><td style="color:#94a3b8;font-size:0.8rem;">"Sim, tenho interesse!"</td><td><span class="mock-badge orange">5 min</span></td><td><button class="btn-action btn-green btn-responder" style="padding:5px 10px;font-size:0.7rem;"><i class="fab fa-whatsapp"></i> Responder</button></td></tr>
                        <tr><td>Carlos Silva</td><td style="color:#94a3b8;font-size:0.8rem;">"Como funciona?"</td><td><span class="mock-badge red">2 horas</span></td><td><button class="btn-action btn-green btn-responder" style="padding:5px 10px;font-size:0.7rem;"><i class="fab fa-whatsapp"></i> Responder</button></td></tr>
                        <tr><td>Fernanda Lopes</td><td style="color:#94a3b8;font-size:0.8rem;">"Qual o valor?"</td><td><span class="mock-badge red">4 horas</span></td><td><button class="btn-action btn-green btn-responder" style="padding:5px 10px;font-size:0.7rem;"><i class="fab fa-whatsapp"></i> Responder</button></td></tr>
                    </tbody>
                </table>
            </div>`;
        case '04':
            return `<div class="modal-dashboard-view">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h4 style="color:#fff;">Envio em Lote de TCLE</h4>
                    <button id="btn-disparar-lote" class="btn-action btn-green" style="width:auto;padding:8px 15px;">Disparar Pendentes</button>
                </div>
                <table class="mock-table" id="tcle-table">
                    <thead><tr><th>Candidato</th><th>Qualificação</th><th>Status TCLE</th><th>Ação</th></tr></thead>
                    <tbody>
                        <tr><td>Mariana Costa</td><td><span class="mock-badge blue">9.5/10</span></td><td><span class="mock-badge orange">Pendente</span></td><td><button class="btn-action btn-send-tcle" style="padding:5px 10px;font-size:0.7rem;">Enviar Link</button></td></tr>
                        <tr><td>Roberto Almeida</td><td><span class="mock-badge blue">8.0/10</span></td><td><span class="mock-badge orange">Pendente</span></td><td><button class="btn-action btn-send-tcle" style="padding:5px 10px;font-size:0.7rem;">Enviar Link</button></td></tr>
                        <tr><td>Amanda Ramos</td><td><span class="mock-badge blue">7.5/10</span></td><td><span class="mock-badge green">Assinado ✓</span></td><td><button class="btn-action" style="padding:5px 10px;font-size:0.7rem;" disabled>Concluído</button></td></tr>
                    </tbody>
                </table>
            </div>`;
        case '05':
            return `<div class="modal-dashboard-view">
                <p style="color:var(--text-secondary);margin-bottom:15px;">Documentos de consentimento assinados digitalmente. Prontos para agendamento.</p>
                <table class="mock-table">
                    <thead><tr><th>Candidato</th><th>Data Assinatura</th><th>Documento</th><th>Próximo Passo</th></tr></thead>
                    <tbody>
                        <tr><td>João Pedro</td><td>Hoje, 10:15</td><td><i class="fas fa-file-pdf" style="color:var(--color-red)"></i> Termo_JP.pdf</td><td><button class="btn-action btn-blue btn-liberar-calendario" style="padding:5px 10px;font-size:0.7rem;">Liberar Calendário</button></td></tr>
                        <tr><td>Fernanda Lima</td><td>Ontem, 18:30</td><td><i class="fas fa-file-pdf" style="color:var(--color-red)"></i> Termo_FL.pdf</td><td><button class="btn-action btn-blue btn-liberar-calendario" style="padding:5px 10px;font-size:0.7rem;">Liberar Calendário</button></td></tr>
                        <tr><td>Amanda Ramos</td><td>Hoje, 09:00</td><td><i class="fas fa-file-pdf" style="color:var(--color-red)"></i> Termo_AR.pdf</td><td><button class="btn-action btn-blue btn-liberar-calendario" style="padding:5px 10px;font-size:0.7rem;">Liberar Calendário</button></td></tr>
                    </tbody>
                </table>
            </div>`;
        case '06':
            return `<div class="modal-dashboard-view">
                <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:15px;margin-bottom:20px;">
                    <h4 style="color:#c4b5fd;margin-bottom:10px;"><i class="fas fa-link"></i> Link Self-Service</h4>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <code style="background:rgba(0,0,0,0.3);padding:5px 10px;border-radius:5px;color:#fff;flex:1;">qualipanel.vercel.app/cliente/[token]</code>
                        <button id="btn-copiar-link" class="btn-action" style="width:auto;padding:6px 15px;"><i class="fas fa-copy"></i> Copiar</button>
                    </div>
                </div>
                <table class="mock-table">
                    <thead><tr><th>Entrevistado</th><th>Data Agendada</th><th>Plataforma</th><th>Ação</th></tr></thead>
                    <tbody>
                        <tr><td>João Pedro</td><td>20/05 às 14:00</td><td><span class="mock-badge blue"><i class="fas fa-video"></i> Zoom</span></td><td><button class="btn-action btn-entrar-sala" style="padding:5px 10px;font-size:0.7rem;"><i class="fas fa-video"></i> Entrar</button></td></tr>
                        <tr><td>Fernanda Lima</td><td>21/05 às 09:30</td><td><span class="mock-badge purple"><i class="fas fa-users"></i> Presencial</span></td><td><span style="color:#94a3b8;font-size:0.8rem;">Sala 02 - SP</span></td></tr>
                        <tr><td>Amanda Ramos</td><td>22/05 às 15:00</td><td><span class="mock-badge blue"><i class="fas fa-video"></i> Meet</span></td><td><button class="btn-action btn-entrar-sala" style="padding:5px 10px;font-size:0.7rem;"><i class="fas fa-video"></i> Entrar</button></td></tr>
                    </tbody>
                </table>
            </div>`;
        case '07':
            return `<div class="modal-dashboard-view">
                <div style="display:flex;gap:10px;margin-bottom:15px;">
                    <button id="btn-exportar-relatorio" class="btn-action btn-blue" style="flex:1;"><i class="fas fa-download"></i> Exportar Relatório</button>
                    <button id="btn-agendar-reposicao" class="btn-action btn-orange" style="flex:1;"><i class="fas fa-calendar-plus"></i> Agendar Reposição</button>
                </div>
                <table class="mock-table">
                    <thead><tr><th>Entrevistado</th><th>Status</th><th>Gravação</th><th>Fechamento</th></tr></thead>
                    <tbody>
                        <tr><td>João Pedro</td><td><span class="mock-badge green">Concluído ✓</span></td><td><button class="btn-action btn-ver-gravacao" style="padding:5px 10px;font-size:0.7rem;color:#ef4444;"><i class="fab fa-youtube"></i> Ver</button></td><td><button id="btn-solicitar-pgto" class="btn-action btn-orange" style="padding:5px 10px;font-size:0.7rem;">Solicitar Pag.</button></td></tr>
                        <tr><td>Márcio Dias</td><td><span class="mock-badge red">Falta (No-show)</span></td><td>—</td><td><button class="btn-action btn-reagendar" style="padding:5px 10px;font-size:0.7rem;"><i class="fas fa-redo"></i> Reagendar</button></td></tr>
                        <tr><td>Fernanda Lima</td><td><span class="mock-badge green">Concluído ✓</span></td><td><button class="btn-action btn-ver-gravacao" style="padding:5px 10px;font-size:0.7rem;color:#ef4444;"><i class="fab fa-youtube"></i> Ver</button></td><td><button class="btn-action btn-orange btn-solicitar-pgto-row" style="padding:5px 10px;font-size:0.7rem;">Solicitar Pag.</button></td></tr>
                    </tbody>
                </table>
            </div>`;
        case '08':
            return `<div class="modal-dashboard-view">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h4 style="color:#fff;">Contas a Pagar (Incentivos)</h4>
                    <div style="display:flex;gap:10px;">
                        <button id="btn-exportar-planilha" class="btn-action btn-blue" style="width:auto;padding:8px 15px;"><i class="fas fa-file-excel"></i> Exportar Planilha</button>
                        <button id="btn-gerar-pix" class="btn-action btn-green" style="width:auto;padding:8px 15px;"><i class="fas fa-money-bill-wave"></i> Gerar Remessa Pix</button>
                    </div>
                </div>
                <table class="mock-table" id="incentivos-table">
                    <thead><tr><th>Entrevistado</th><th>Valor</th><th>Chave Pix</th><th>Status</th><th>Ação</th></tr></thead>
                    <tbody>
                        <tr><td>João Pedro</td><td style="color:#34d399;font-weight:bold;">R$ 150,00</td><td style="color:#94a3b8;font-size:0.8rem;">***.456.789-**</td><td><span class="mock-badge orange">Aguardando</span></td><td><button class="btn-action btn-pagar-individual" style="padding:5px 10px;font-size:0.7rem;"><i class="fas fa-pix"></i> Pagar</button></td></tr>
                        <tr><td>Fernanda Lima</td><td style="color:#34d399;font-weight:bold;">R$ 150,00</td><td style="color:#94a3b8;font-size:0.8rem;">***.321.654-**</td><td><span class="mock-badge orange">Aguardando</span></td><td><button class="btn-action btn-pagar-individual" style="padding:5px 10px;font-size:0.7rem;"><i class="fas fa-pix"></i> Pagar</button></td></tr>
                        <tr><td>Luciana Souza</td><td style="color:#34d399;font-weight:bold;">R$ 200,00</td><td style="color:#94a3b8;font-size:0.8rem;">***.123.456-**</td><td><span class="mock-badge green">Pago ✓</span></td><td><button class="btn-action" style="padding:5px 10px;font-size:0.7rem;" disabled>Concluído</button></td></tr>
                    </tbody>
                </table>
            </div>`;
        default:
            return `<p style="color:#fff;">Interface não configurada.</p>`;
    }
}

// ==========================================
// BIND MODAL EVENTS — PER STAGE
// ==========================================
function bindModalEvents(stepNum) {
    if (stepNum === '01') {
        // File upload
        const fileInput = document.getElementById('real-file-upload');
        const uploadBtn = document.getElementById('btn-select-file');
        if (uploadBtn && fileInput) {
            uploadBtn.onclick = () => fileInput.click();
            fileInput.onchange = e => {
                if (!e.target.files.length) return;
                const file = e.target.files[0];
                const orig = uploadBtn.innerHTML;
                uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
                uploadBtn.disabled = true;
                setTimeout(() => {
                    const now = new Date();
                    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
                    const qtd = Math.floor(Math.random() * 800) + 200;
                    uploadsState.push({ id: 'u' + Date.now(), fileName: file.name, time: 'Agora, ' + time, qtd, status: '100% OK' });
                    showToast(`"${file.name}" carregado! ${qtd.toLocaleString('pt-BR')} contatos validados.`, 'success');
                    uploadBtn.innerHTML = orig;
                    uploadBtn.disabled = false;
                    modalData.innerHTML = getStageContent('01');
                    syncRealData();
                    fileInput.value = '';
                    bindModalEvents('01');
                }, 1200);
            };
        }

        // Download template
        const dlBtn = document.getElementById('btn-download-template');
        if (dlBtn) {
            dlBtn.onclick = async () => {
                showToast('Gerando template Excel...', 'info');
                const orig = dlBtn.innerHTML;
                dlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                try {
                    const wb = new ExcelJS.Workbook();
                    wb.creator = 'QualiPanel';
                    const sheet = wb.addWorksheet('Importação', { properties: { tabColor: { argb: 'FF10B981' } } });
                    sheet.columns = [
                        { header: 'NOME COMPLETO', key: 'nome', width: 35 },
                        { header: 'EMAIL', key: 'email', width: 35 },
                        { header: 'TELEFONE (WhatsApp)', key: 'telefone', width: 25 },
                        { header: 'CARGO / PERFIL', key: 'cargo', width: 30 }
                    ];
                    const hRow = sheet.getRow(1);
                    hRow.height = 30;
                    hRow.eachCell(cell => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
                        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    });
                    sheet.addRow({ nome: 'João da Silva', email: 'joao.silva@exemplo.com', telefone: '+55 11 99999-9999', cargo: 'Gerente de Projetos' });
                    sheet.addRow({ nome: 'Mariana Costa', email: 'mariana.costa@exemplo.com', telefone: '+55 11 98888-8888', cargo: 'UX Designer' });
                    const buf = await wb.xlsx.writeBuffer();
                    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'Template_QualiPanel.xlsx';
                    a.click();
                    URL.revokeObjectURL(a.href);
                    showToast('Template baixado com sucesso!', 'success');
                    dlBtn.innerHTML = '<i class="fas fa-check"></i> Baixado';
                    setTimeout(() => { dlBtn.innerHTML = orig; }, 3000);
                } catch (err) {
                    showToast('Erro ao gerar Excel.', 'error');
                    dlBtn.innerHTML = orig;
                }
            };
        }

        // Table events
        document.querySelectorAll('.btn-delete-upload').forEach(btn => {
            btn.onclick = function () {
                const row = this.closest('tr');
                const fn = row.querySelector('td').innerText;
                showConfirm('Apagar Lote', `Remover o lote "${fn}"?\n\nIsso recalculará as estatísticas do funil.`, () => {
                    const id = row.getAttribute('data-upload-id');
                    uploadsState = uploadsState.filter(u => u.id !== id);
                    row.style.transition = 'all 0.4s';
                    row.style.opacity = '0';
                    row.style.transform = 'translateX(-20px)';
                    setTimeout(() => {
                        row.remove();
                        if (uploadsState.length === 0) {
                            document.querySelector('#upload-table tbody').innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:20px;">Nenhum arquivo processado.</td></tr>';
                        }
                        showToast(`Lote "${fn}" removido.`, 'warning');
                        syncRealData();
                    }, 400);
                });
            };
        });

        document.querySelectorAll('.btn-process').forEach(btn => {
            btn.onclick = function () {
                this.innerHTML = '<i class="fas fa-check"></i> Processado';
                this.disabled = true;
                this.className = 'btn-action btn-green';
                showToast('Lote processado! Contatos entraram na régua de comunicação.', 'success');
            };
        });

        document.querySelectorAll('.btn-view-list').forEach(btn => {
            btn.onclick = function () {
                const row = this.closest('tr');
                const fn = row.querySelector('td').innerText;
                const qtd = parseInt(row.querySelector('.qtd-cell').innerText.replace(/\D/g, '')) || 10;
                const prev = modalData.innerHTML;

                const nomes = ['Carlos','Ana','Felipe','Mariana','João','Beatriz','Lucas','Julia','Pedro','Larissa'];
                const snomes = ['Silva','Souza','Costa','Dias','Alves','Lima','Oliveira','Mendes','Gomes','Ferreira'];
                let rows = '';
                for (let i = 1; i <= Math.min(qtd, 20); i++) {
                    const n = nomes[Math.floor(Math.random() * nomes.length)] + ' ' + snomes[Math.floor(Math.random() * snomes.length)];
                    const invalid = Math.random() < 0.05;
                    rows += `<tr>
                        <td><span style="color:var(--text-secondary);font-family:monospace;">#${String(i).padStart(4,'0')}</span> ${n}</td>
                        <td style="color:#94a3b8;font-size:0.8rem;">${n.split(' ')[0].toLowerCase()}.${i}@empresa.com</td>
                        <td>${invalid ? '—' : `(11) 9${Math.floor(Math.random()*9000)+1000}-${Math.floor(Math.random()*9000)+1000}`}</td>
                        <td>${invalid ? '<span class="mock-badge red">Inválido</span>' : '<span class="mock-badge green">Válido</span>'}</td>
                    </tr>`;
                }

                modalData.innerHTML = `<div style="animation:slideUpFade 0.4s forwards;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                        <button id="btn-back" class="btn-action" style="width:auto;padding:8px 15px;"><i class="fas fa-arrow-left"></i> Voltar</button>
                        <h4 style="color:#fff;margin:0;">📋 ${fn}</h4>
                        <div class="search-bar" style="width:250px;"><i class="fas fa-search"></i><input type="text" id="search-ct" placeholder="Buscar..."></div>
                    </div>
                    <div style="max-height:380px;overflow-y:auto;">
                        <table class="mock-table" id="ct-table">
                            <thead style="position:sticky;top:0;background:#0f172a;z-index:10;"><tr><th>#/Nome</th><th>Email</th><th>WhatsApp</th><th>Status</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                    <div style="margin-top:15px;display:flex;justify-content:space-between;align-items:center;">
                        <span id="ct-count" style="color:var(--text-secondary);font-size:0.8rem;">Mostrando ${Math.min(qtd,20)} de ${qtd.toLocaleString('pt-BR')} contatos</span>
                        <button id="btn-process-all" class="btn-action btn-blue" style="width:auto;padding:8px 20px;"><i class="fas fa-paper-plane"></i> Processar Tudo</button>
                    </div>
                </div>`;

                document.getElementById('btn-back').onclick = () => { modalData.innerHTML = prev; bindModalEvents('01'); };
                const si = document.getElementById('search-ct');
                si.oninput = () => {
                    const t = si.value.toLowerCase();
                    let c = 0;
                    document.querySelectorAll('#ct-table tbody tr').forEach(r => {
                        const show = r.innerText.toLowerCase().includes(t);
                        r.style.display = show ? '' : 'none';
                        if (show) c++;
                    });
                    document.getElementById('ct-count').innerText = `Mostrando ${c} contatos`;
                };
                const bpa = document.getElementById('btn-process-all');
                bpa.onclick = () => {
                    bpa.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
                    bpa.disabled = true;
                    setTimeout(() => {
                        showToast(`${qtd.toLocaleString('pt-BR')} contatos de "${fn}" processados!`, 'success');
                        bpa.innerHTML = '<i class="fas fa-check"></i> Concluído';
                        bpa.className = 'btn-action btn-green';
                        setTimeout(() => { document.getElementById('btn-back').click(); }, 1500);
                    }, 2000);
                };
            };
        });
    }

    else if (stepNum === '02') {
        document.querySelectorAll('.btn-disparar').forEach(btn => {
            btn.onclick = function () {
                const canal = this.dataset.canal;
                const orig = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Disparando...';
                this.disabled = true;
                setTimeout(() => {
                    showToast(`Campanha de ${canal} enviada para a fila! (Evolution API)`, 'success');
                    this.innerHTML = `<i class="fas fa-check"></i> Disparado (${canal})`;
                }, 1500);
            };
        });
    }

    else if (stepNum === '03') {
        const sp = document.getElementById('btn-softphone');
        if (sp) sp.onclick = () => {
            showToast('Conectando ao Softphone VoIP...', 'info');
            setTimeout(() => showToast('Ramal conectado! Discando...', 'success'), 1500);
        };
        document.querySelectorAll('.btn-responder').forEach(btn => {
            btn.onclick = function () {
                const nome = this.closest('tr').querySelector('td').innerText;
                showToast(`Abrindo WhatsApp para ${nome}...`, 'info');
                this.innerHTML = '<i class="fab fa-whatsapp"></i> Em Atendimento';
                this.style.background = '#ea580c';
                this.style.borderColor = '#ea580c';
            };
        });
    }

    else if (stepNum === '04') {
        const loteBtn = document.getElementById('btn-disparar-lote');
        if (loteBtn) loteBtn.onclick = () => {
            loteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Disparando TCLEs...';
            loteBtn.disabled = true;
            setTimeout(() => {
                showToast('TCLEs enviados via e-mail com sucesso!', 'success');
                loteBtn.innerHTML = '<i class="fas fa-check"></i> Enviados';
                document.querySelectorAll('#tcle-table .mock-badge.orange').forEach(b => { b.className = 'mock-badge green'; b.innerText = 'Enviado ✓'; });
                document.querySelectorAll('#tcle-table .btn-send-tcle').forEach(b => { b.innerHTML = 'Enviado'; b.disabled = true; });
            }, 2000);
        };
        document.querySelectorAll('.btn-send-tcle').forEach(btn => {
            btn.onclick = function () {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                setTimeout(() => {
                    showToast('Link do TCLE enviado!', 'success');
                    this.innerHTML = 'Enviado ✓';
                    this.disabled = true;
                    const badge = this.closest('tr').querySelector('.mock-badge.orange');
                    if (badge) { badge.className = 'mock-badge green'; badge.innerText = 'Enviado ✓'; }
                }, 1000);
            };
        });
    }

    else if (stepNum === '05') {
        document.querySelectorAll('.btn-liberar-calendario').forEach(btn => {
            btn.onclick = function () {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                setTimeout(() => {
                    showToast('Candidato liberado! Link de agendamento enviado.', 'success');
                    this.innerHTML = '<i class="fas fa-check"></i> Liberado';
                    this.classList.replace('btn-blue', 'btn-green');
                    this.disabled = true;
                }, 1000);
            };
        });
    }

    else if (stepNum === '06') {
        const copiar = document.getElementById('btn-copiar-link');
        if (copiar) copiar.onclick = () => {
            navigator.clipboard.writeText('qualipanel.vercel.app/cliente/[token]').catch(() => {});
            showToast('Link copiado para a área de transferência!', 'success');
            copiar.innerHTML = '<i class="fas fa-check"></i> Copiado';
            setTimeout(() => { copiar.innerHTML = '<i class="fas fa-copy"></i> Copiar'; }, 2000);
        };
        document.querySelectorAll('.btn-entrar-sala').forEach(btn => {
            btn.onclick = () => showToast('Abrindo sala de videoconferência...', 'info');
        });
    }

    else if (stepNum === '07') {
        const expBtn = document.getElementById('btn-exportar-relatorio');
        if (expBtn) expBtn.onclick = () => {
            expBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';
            setTimeout(() => {
                showToast('Relatório exportado com sucesso!', 'success');
                expBtn.innerHTML = '<i class="fas fa-check"></i> Exportado';
                expBtn.className = 'btn-action btn-green';
            }, 1500);
        };
        const repBtn = document.getElementById('btn-agendar-reposicao');
        if (repBtn) repBtn.onclick = () => showToast('Abrindo agenda para reposição de no-show...', 'info');
        document.querySelectorAll('.btn-ver-gravacao').forEach(btn => {
            btn.onclick = () => showToast('Carregando gravação na nuvem...', 'info');
        });
        const pgBtn = document.getElementById('btn-solicitar-pgto');
        if (pgBtn) pgBtn.onclick = () => {
            pgBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            setTimeout(() => { showToast('Solicitação de pagamento enviada ao financeiro!', 'success'); pgBtn.innerHTML = 'Solicitado ✓'; pgBtn.disabled = true; }, 1500);
        };
        document.querySelectorAll('.btn-solicitar-pgto-row').forEach(btn => {
            btn.onclick = function () {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                setTimeout(() => { showToast('Solicitação enviada!', 'success'); this.innerHTML = 'Solicitado ✓'; this.disabled = true; }, 1500);
            };
        });
        document.querySelectorAll('.btn-reagendar').forEach(btn => {
            btn.onclick = function () {
                showToast('Abrindo formulário de reagendamento...', 'info');
                this.innerHTML = '<i class="fas fa-calendar"></i> Reagendando...';
            };
        });
    }

    else if (stepNum === '08') {
        const pixBtn = document.getElementById('btn-gerar-pix');
        if (pixBtn) pixBtn.onclick = () => {
            pixBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando lote...';
            pixBtn.disabled = true;
            setTimeout(() => {
                showToast('Remessa Pix gerada! Integração bancária concluída.', 'success');
                pixBtn.innerHTML = '<i class="fas fa-check"></i> Remessa Gerada';
                document.querySelectorAll('#incentivos-table .mock-badge.orange').forEach(b => { b.className = 'mock-badge green'; b.innerText = 'Pago ✓'; });
                document.querySelectorAll('.btn-pagar-individual').forEach(b => { b.innerHTML = 'Pago ✓'; b.disabled = true; b.className = 'btn-action btn-green'; });
            }, 2000);
        };

        const expBtn = document.getElementById('btn-exportar-planilha');
        if (expBtn) expBtn.onclick = async () => {
            expBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            expBtn.disabled = true;
            try {
                const wb = new ExcelJS.Workbook();
                const sheet = wb.addWorksheet('Incentivos');
                sheet.columns = [
                    { header: 'ENTREVISTADO', key: 'nome', width: 30 },
                    { header: 'VALOR', key: 'valor', width: 15 },
                    { header: 'CHAVE PIX', key: 'pix', width: 25 },
                    { header: 'STATUS', key: 'status', width: 15 }
                ];
                sheet.addRow({ nome: 'João Pedro', valor: 'R$ 150,00', pix: '***.456.789-**', status: 'Aguardando' });
                sheet.addRow({ nome: 'Fernanda Lima', valor: 'R$ 150,00', pix: '***.321.654-**', status: 'Aguardando' });
                sheet.addRow({ nome: 'Luciana Souza', valor: 'R$ 200,00', pix: '***.123.456-**', status: 'Pago' });
                const buf = await wb.xlsx.writeBuffer();
                const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'Incentivos_QualiPanel.xlsx';
                a.click();
                URL.revokeObjectURL(a.href);
                showToast('Planilha de incentivos exportada!', 'success');
                expBtn.innerHTML = '<i class="fas fa-check"></i> Exportado';
                expBtn.className = 'btn-action btn-green';
            } catch (e) {
                showToast('Erro ao exportar planilha.', 'error');
                expBtn.innerHTML = '<i class="fas fa-file-excel"></i> Exportar Planilha';
                expBtn.disabled = false;
            }
        };

        document.querySelectorAll('.btn-pagar-individual').forEach(btn => {
            btn.onclick = function () {
                const nome = this.closest('tr').querySelector('td').innerText;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                setTimeout(() => {
                    showToast(`Pagamento Pix enviado para ${nome}!`, 'success');
                    this.innerHTML = 'Pago ✓';
                    this.disabled = true;
                    this.className = 'btn-action btn-green';
                    const badge = this.closest('tr').querySelector('.mock-badge');
                    if (badge) { badge.className = 'mock-badge green'; badge.innerText = 'Pago ✓'; }
                }, 1500);
            };
        });
    }
}

// ==========================================
// EQUIPE VIEW — FUNCIONAL
// ==========================================
function bindEquipeEvents() {
    const equipeView = document.getElementById('view-equipe');
    if (!equipeView) return;

    // Editar Perfil
    equipeView.querySelectorAll('button').forEach(btn => {
        if (btn.innerText.includes('Editar Perfil')) {
            btn.onclick = () => {
                const card = btn.closest('.station-card, div[style*="text-align: center"]') || btn.closest('div');
                const nome = card.querySelector('h3')?.innerText || 'Membro';
                const cargo = card.querySelector('p')?.innerText || '';
                openGenericModal(
                    'Editar Perfil',
                    `MEMBRO — ${nome.toUpperCase()}`,
                    '<i class="fas fa-user-edit"></i>',
                    'icon-blue',
                    `<div style="animation:slideUpFade 0.4s forwards;">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px;">
                            <div>
                                <label style="color:var(--text-secondary);font-size:0.8rem;display:block;margin-bottom:5px;">Nome Completo</label>
                                <input type="text" value="${nome}" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:#fff;font-size:0.9rem;">
                            </div>
                            <div>
                                <label style="color:var(--text-secondary);font-size:0.8rem;display:block;margin-bottom:5px;">Cargo / Função</label>
                                <input type="text" value="${cargo}" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:#fff;font-size:0.9rem;">
                            </div>
                            <div>
                                <label style="color:var(--text-secondary);font-size:0.8rem;display:block;margin-bottom:5px;">E-mail</label>
                                <input type="email" placeholder="${nome.toLowerCase().replace(' ', '.')}@ligapesquisa.com.br" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:#fff;font-size:0.9rem;">
                            </div>
                            <div>
                                <label style="color:var(--text-secondary);font-size:0.8rem;display:block;margin-bottom:5px;">Telefone</label>
                                <input type="tel" placeholder="(11) 99999-9999" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:#fff;font-size:0.9rem;">
                            </div>
                        </div>
                        <div style="margin-bottom:20px;">
                            <label style="color:var(--text-secondary);font-size:0.8rem;display:block;margin-bottom:5px;">Nível de Acesso</label>
                            <select style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:#fff;font-size:0.9rem;">
                                <option>Admin</option>
                                <option>Gestor</option>
                                <option selected>Recrutador</option>
                                <option>Visualizador</option>
                            </select>
                        </div>
                        <div style="display:flex;gap:10px;justify-content:flex-end;">
                            <button id="btn-cancel-edit" class="btn-action" style="width:auto;padding:10px 20px;background:transparent;border:1px solid rgba(255,255,255,0.15);">Cancelar</button>
                            <button id="btn-save-edit" class="btn-action btn-blue" style="width:auto;padding:10px 25px;">Salvar Alterações</button>
                        </div>
                    </div>`,
                    () => {
                        document.getElementById('btn-cancel-edit').onclick = () => modal.classList.remove('active');
                        document.getElementById('btn-save-edit').onclick = function () {
                            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                            setTimeout(() => {
                                showToast(`Perfil de ${nome} atualizado com sucesso!`, 'success');
                                modal.classList.remove('active');
                            }, 1000);
                        };
                    }
                );
            };
        }

        if (btn.innerText.includes('Convidar Membro')) {
            btn.onclick = () => {
                openGenericModal(
                    'Convidar Novo Membro',
                    'EQUIPE — CONVITE',
                    '<i class="fas fa-user-plus"></i>',
                    'icon-purple',
                    `<div style="animation:slideUpFade 0.4s forwards;">
                        <p style="color:var(--text-secondary);margin-bottom:20px;">Um e-mail de convite será enviado para o novo membro acessar o QualiPanel.</p>
                        <div style="display:grid;gap:15px;margin-bottom:20px;">
                            <div>
                                <label style="color:var(--text-secondary);font-size:0.8rem;display:block;margin-bottom:5px;">E-mail do Convidado *</label>
                                <input type="email" id="invite-email" placeholder="colega@empresa.com" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:#fff;font-size:0.9rem;">
                            </div>
                            <div>
                                <label style="color:var(--text-secondary);font-size:0.8rem;display:block;margin-bottom:5px;">Cargo / Função</label>
                                <input type="text" id="invite-cargo" placeholder="Ex: Recrutador, Gestor de Tráfego..." style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:#fff;font-size:0.9rem;">
                            </div>
                            <div>
                                <label style="color:var(--text-secondary);font-size:0.8rem;display:block;margin-bottom:5px;">Nível de Acesso</label>
                                <select id="invite-role" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:#fff;font-size:0.9rem;">
                                    <option>Recrutador</option>
                                    <option>Gestor</option>
                                    <option>Admin</option>
                                </select>
                            </div>
                        </div>
                        <div style="display:flex;gap:10px;justify-content:flex-end;">
                            <button id="btn-cancel-invite" class="btn-action" style="width:auto;padding:10px 20px;background:transparent;border:1px solid rgba(255,255,255,0.15);">Cancelar</button>
                            <button id="btn-send-invite" class="btn-action btn-purple" style="width:auto;padding:10px 25px;"><i class="fas fa-envelope"></i> Enviar Convite</button>
                        </div>
                    </div>`,
                    () => {
                        document.getElementById('btn-cancel-invite').onclick = () => modal.classList.remove('active');
                        document.getElementById('btn-send-invite').onclick = function () {
                            const email = document.getElementById('invite-email').value;
                            if (!email) { showToast('Informe o e-mail do convidado.', 'warning'); return; }
                            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
                            this.disabled = true;
                            setTimeout(() => {
                                showToast(`Convite enviado para ${email}!`, 'success');
                                modal.classList.remove('active');
                            }, 1500);
                        };
                    }
                );
            };
        }
    });
}

// ==========================================
// CONFIGURAÇÕES VIEW — FUNCIONAL
// ==========================================
function bindConfigEvents() {
    const cfgView = document.getElementById('view-configuracoes');
    if (!cfgView) return;

    cfgView.querySelectorAll('button').forEach(btn => {
        if (btn.innerText.includes('Gerenciar Chaves')) {
            btn.onclick = () => {
                openGenericModal(
                    'Integrações e Chaves de API',
                    'CONFIGURAÇÕES — INTEGRAÇÕES',
                    '<i class="fas fa-plug"></i>',
                    'icon-blue',
                    `<div style="animation:slideUpFade 0.4s forwards;display:grid;gap:15px;">
                        ${[
                            { label: 'Evolution API URL', placeholder: 'https://evolution.suaapi.com', icon: 'fab fa-whatsapp', color: '#25D366' },
                            { label: 'Evolution API Key', placeholder: 'evo_xxxxxxxxxxxxxxxxxxxx', icon: 'fas fa-key', color: '#94a3b8' },
                            { label: 'Resend API Key', placeholder: 're_xxxxxxxxxxxxxxxxxxxx', icon: 'fas fa-envelope', color: '#38bdf8' },
                            { label: 'Supabase URL', placeholder: 'https://xxx.supabase.co', icon: 'fas fa-database', color: '#3ECF8E' },
                        ].map(f => `<div>
                            <label style="color:var(--text-secondary);font-size:0.8rem;display:flex;align-items:center;gap:8px;margin-bottom:5px;">
                                <i class="${f.icon}" style="color:${f.color}"></i> ${f.label}
                            </label>
                            <input type="text" placeholder="${f.placeholder}" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:#fff;font-size:0.85rem;font-family:monospace;">
                        </div>`).join('')}
                        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:5px;">
                            <button id="btn-test-api" class="btn-action btn-blue" style="width:auto;padding:10px 20px;"><i class="fas fa-plug"></i> Testar Conexão</button>
                            <button id="btn-save-api" class="btn-action btn-green" style="width:auto;padding:10px 20px;"><i class="fas fa-save"></i> Salvar Chaves</button>
                        </div>
                    </div>`,
                    () => {
                        document.getElementById('btn-test-api').onclick = function () {
                            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testando...';
                            setTimeout(() => { showToast('Conexão com Evolution API: OK ✓', 'success'); this.innerHTML = '<i class="fas fa-plug"></i> Testar Conexão'; }, 1500);
                        };
                        document.getElementById('btn-save-api').onclick = function () {
                            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                            setTimeout(() => { showToast('Configurações de API salvas!', 'success'); modal.classList.remove('active'); }, 1000);
                        };
                    }
                );
            };
        }

        if (btn.innerText.includes('Configurar')) {
            btn.onclick = () => {
                openGenericModal(
                    'Configurar Alertas do Funil',
                    'CONFIGURAÇÕES — ALERTAS',
                    '<i class="fas fa-bell"></i>',
                    'icon-orange',
                    `<div style="animation:slideUpFade 0.4s forwards;display:grid;gap:15px;">
                        ${[
                            { label: 'Alerta: Taxa de resposta abaixo de', value: '20', suffix: '%' },
                            { label: 'Alerta: No-show acima de', value: '15', suffix: '%' },
                            { label: 'Alerta: TCLEs pendentes há mais de', value: '48', suffix: 'horas' },
                            { label: 'Alerta: Incentivos pendentes há mais de', value: '7', suffix: 'dias' },
                        ].map(f => `<div style="display:flex;align-items:center;gap:10px;background:rgba(0,0,0,0.2);border-radius:8px;padding:12px;">
                            <label style="color:var(--text-secondary);font-size:0.85rem;flex:1;">${f.label}</label>
                            <input type="number" value="${f.value}" style="width:70px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px;color:#fff;text-align:center;">
                            <span style="color:var(--text-secondary);">${f.suffix}</span>
                        </div>`).join('')}
                        <div style="display:flex;align-items:center;gap:10px;background:rgba(0,0,0,0.2);border-radius:8px;padding:12px;">
                            <label style="color:var(--text-secondary);font-size:0.85rem;flex:1;">Enviar alertas para (e-mail)</label>
                            <input type="email" placeholder="gestor@empresa.com" style="width:220px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px;color:#fff;">
                        </div>
                        <div style="display:flex;gap:10px;justify-content:flex-end;">
                            <button id="btn-save-alerts" class="btn-action btn-orange" style="width:auto;padding:10px 25px;"><i class="fas fa-save"></i> Salvar Alertas</button>
                        </div>
                    </div>`,
                    () => {
                        document.getElementById('btn-save-alerts').onclick = function () {
                            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                            setTimeout(() => { showToast('Alertas configurados com sucesso!', 'success'); modal.classList.remove('active'); }, 1000);
                        };
                    }
                );
            };
        }
    });
}

// ==========================================
// TOPBAR SEARCH
// ==========================================
function bindSearchBar() {
    const searchInput = document.querySelector('.topbar .search-bar input');
    if (!searchInput) return;

    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const term = searchInput.value.trim();
            if (!term) return;
            showToast(`Buscando por "${term}"...`, 'info');
            // Highlight visible station cards
            document.querySelectorAll('.station-card h3').forEach(h => {
                if (h.innerText.toLowerCase().includes(term.toLowerCase())) {
                    h.closest('.journey-step')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
    });
}

// ==========================================
// INITIALIZATION
// ==========================================
window.addEventListener('load', () => {
    gsap.registerPlugin(ScrollTrigger);

    // Animate nodes
    document.querySelectorAll('.journey-step').forEach(step => {
        gsap.to(step, {
            scrollTrigger: { trigger: step, start: 'top 85%', toggleActions: 'play none none reverse' },
            opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
        });
    });

    // Spotlight effect
    document.querySelectorAll('.station-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });

    setTimeout(() => { drawBelt(); loadProjects(); }, 100);

    bindSearchBar();
});

let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawBelt, 100); });

// ==========================================
// LOCK TOGGLE + CARD CLICKS
// ==========================================
document.querySelectorAll('.station-card').forEach((card, index) => {
    // Lock toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'lock-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-lock-open"></i>';
    toggleBtn.setAttribute('title', 'Bloquear Etapa');
    Object.assign(toggleBtn.style, {
        position: 'absolute', top: '15px', right: '15px',
        background: 'transparent', border: 'none',
        color: '#34d399', cursor: 'pointer',
        fontSize: '1.2rem', zIndex: '10', transition: 'all 0.3s'
    });
    card.appendChild(toggleBtn);

    toggleBtn.addEventListener('click', e => {
        e.stopPropagation();
        const isLocked = card.classList.toggle('station-locked');
        const actionBtn = card.querySelector('.btn-action:not(.lock-toggle)');

        if (isLocked) {
            toggleBtn.innerHTML = '<i class="fas fa-lock"></i>';
            toggleBtn.style.color = 'var(--color-red)';
            toggleBtn.setAttribute('title', 'Desbloquear Etapa');
            if (actionBtn) {
                actionBtn.dataset.originalHtml = actionBtn.innerHTML;
                actionBtn.dataset.originalClass = actionBtn.className;
                actionBtn.innerHTML = '<i class="fas fa-lock"></i> Bloqueado';
                actionBtn.className = 'btn-action btn-locked';
            }
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-lock-open"></i>';
            toggleBtn.style.color = '#34d399';
            toggleBtn.setAttribute('title', 'Bloquear Etapa');
            if (actionBtn && actionBtn.dataset.originalHtml) {
                actionBtn.innerHTML = actionBtn.dataset.originalHtml;
                actionBtn.className = actionBtn.dataset.originalClass;
            }
            gsap.fromTo(card, { scale: 1.05, boxShadow: '0 0 30px rgba(56,189,248,0.4)' }, { scale: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', duration: 1 });
        }
        drawBelt();
    });

    // FIX: Nenhuma etapa começa bloqueada — todas acessíveis
    // (removed the initial lock for stages 4-8)

    // Card click → open modal
    card.addEventListener('click', e => {
        if (card.classList.contains('station-locked')) return;
        if (e.target.closest('.lock-toggle')) return;

        const titleEl = card.querySelector('h3');
        const numEl = card.querySelector('.step-num');
        const iconEl = card.querySelector('.station-icon');

        if (titleEl && numEl && iconEl) {
            const iconClass = Array.from(iconEl.classList).find(c => c.startsWith('icon-')) || 'icon-blue';
            openModal(numEl.textContent, titleEl.textContent, iconEl.innerHTML, iconClass);
        }
    });
});

// ==========================================
// SIDEBAR + NAVIGATION — FIXED
// ==========================================
const btnOpenSidebar = document.getElementById('btn-open-sidebar');
const btnCloseSidebar = document.getElementById('btn-close-sidebar');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const btnNotification = document.getElementById('btn-notification');
const notificationDropdown = document.getElementById('notification-dropdown');

const views = {
    'Projetos': document.getElementById('board'),
    'Equipe': document.getElementById('view-equipe'),
    'Relatórios': document.getElementById('view-relatorios'),
    'Configurações': document.getElementById('view-configuracoes')
};

function closeSidebar() {
    sidebar?.classList.remove('active');
    sidebarOverlay?.classList.remove('active');
}

function switchView(name) {
    Object.values(views).forEach(v => { if (v) v.style.display = 'none'; });
    const target = views[name];
    if (target) {
        target.style.display = 'block';
        target.style.opacity = '0';
        gsap.to(target, { opacity: 1, duration: 0.5 });
    }

    // Bind specific views after switch
    if (name === 'Equipe') setTimeout(bindEquipeEvents, 100);
    if (name === 'Configurações') setTimeout(bindConfigEvents, 100);
}

if (btnOpenSidebar) {
    btnOpenSidebar.addEventListener('click', () => {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
    });
}
if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

// Sidebar nav items
document.querySelectorAll('.sidebar-nav li:not(.nav-divider)').forEach(item => {
    item.addEventListener('click', function () {

        // Logout
        if (this.classList.contains('logout')) {
            showConfirm('Sair do Sistema', 'Tem certeza que deseja sair do QualiPanel?', () => {
                showToast('Saindo...', 'info');
                setTimeout(() => { window.location.href = 'https://qualipanel.vercel.app/login'; }, 800);
            });
            closeSidebar();
            return;
        }

        // Update active state
        document.querySelectorAll('.sidebar-nav li').forEach(l => l.classList.remove('active'));
        this.classList.add('active');

        const name = this.innerText.trim();

        // FIX: Relatórios agora troca de view corretamente (não abre modal)
        if (name === 'Relatórios') {
            switchView('Relatórios');
            showToast('Relatórios de Desempenho', 'info');
            setTimeout(closeSidebar, 600);
            return;
        }

        if (views[name]) {
            switchView(name);
            showToast(`Acessando ${name}...`, 'success');
            setTimeout(closeSidebar, 600);
        }
    });
});

// Notification dropdown
if (btnNotification && notificationDropdown) {
    btnNotification.addEventListener('click', e => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('active');
    });
    document.addEventListener('click', e => {
        if (!notificationDropdown.contains(e.target) && e.target !== btnNotification) {
            notificationDropdown.classList.remove('active');
        }
    });
}
