// Journey Flow Logic

const SVG_NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById('journey-line');
const board = document.getElementById('board');

const stations = ['st-1', 'st-2', 'st-3', 'st-4', 'st-5', 'st-6', 'st-7', 'st-8'];

// Custom Confirm Dialog
function showConfirm(title, message, onConfirm) {
    const overlay = document.getElementById('custom-confirm-overlay');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const btnCancel = document.getElementById('btn-confirm-cancel');
    const btnOk = document.getElementById('btn-confirm-ok');
    
    if (!overlay) return;
    
    titleEl.innerText = title;
    // msg pode vir com \n, vamos substituir por <br>
    msgEl.innerHTML = message.replace(/\n/g, '<br>');
    
    overlay.style.display = 'flex';
    // Pequeno delay para a transição do CSS (opacity) aplicar sobre o display:flex
    setTimeout(() => overlay.classList.add('active'), 10);
    
    const close = () => {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.style.display = 'none'; }, 400); // aguarda a transição de fade-out
        btnOk.onclick = null;
        btnCancel.onclick = null;
    };
    
    btnCancel.onclick = close;
    btnOk.onclick = () => {
        close();
        if (typeof onConfirm === 'function') onConfirm();
    };
}

// ==========================================
// STATE MANAGEMENT
// ==========================================
let uploadsState = [
    { id: 'u1', fileName: 'Mailing_B2B_SP.csv', time: 'Hoje, 09:00', qtd: 2045, status: '100% OK' }
];

// ==========================================
// DATA SYNCHRONIZATION (API INTEGRATION)
// ==========================================
async function syncRealData() {
    try {
        /* 
         * TODO: CONEXÃO COM BANCO DE DADOS REAL
         * Quando a API estiver pronta, substitua a simulação abaixo por:
         * const response = await fetch('https://sua-api.com/api/funil');
         * const data = await response.json();
         */
         
        // Recalcular métricas baseado na tabela de upload (se ela existir)
        let totalImportados = 0;
        if (uploadsState && uploadsState.length > 0) {
            totalImportados = uploadsState.reduce((sum, upload) => sum + upload.qtd, 0);
        } else {
            totalImportados = 0;
        }

        // Simulação de dados proporcionais ao total importado
        const dia1 = Math.floor(totalImportados * 0.90);
        const dia3 = Math.floor(totalImportados * 0.07);
        const aceites = Math.floor(totalImportados * 0.15);
        const assinados = Math.floor(aceites * 0.90);
        const agendados = Math.floor(assinados * 0.85);
        const concluidas = Math.floor(agendados * 0.80);
        const pagos = Math.floor(concluidas * 0.90);

        const data = {
            st1_importados: totalImportados.toLocaleString('pt-BR'),
            st1_validados: "98%",
            st2_dia1: dia1.toLocaleString('pt-BR'),
            st2_dia3: dia3.toLocaleString('pt-BR'),
            st3_resposta: "18%",
            st3_pendentes: Math.floor(totalImportados * 0.01),
            st4_aceites: aceites.toLocaleString('pt-BR'),
            st4_recusas: Math.floor(totalImportados * 0.02),
            st5_assinados: assinados.toLocaleString('pt-BR'),
            st5_aguardando: aceites - assinados,
            st6_agendados: agendados.toLocaleString('pt-BR'),
            st6_salas: Math.floor(agendados / 20),
            st7_concluidas: concluidas.toLocaleString('pt-BR'),
            st7_faltas: "16%",
            st8_pagos: pagos.toLocaleString('pt-BR'),
            st8_pendentes_pg: concluidas - pagos
        };

        // Função auxiliar para atualizar valores no DOM
        const updateMetric = (selector, value) => {
            const el = document.querySelector(selector);
            if (el) el.textContent = value;
        };

        // Atualizando Etapa 1
        updateMetric('#st-1 .metric-box:nth-child(1) .metric-value', data.st1_importados);
        updateMetric('#st-1 .metric-box:nth-child(2) .metric-value', data.st1_validados);

        // Atualizando Etapa 2
        updateMetric('#st-2 .metric-box:nth-child(1) .metric-value', data.st2_dia1);
        updateMetric('#st-2 .metric-box:nth-child(2) .metric-value', data.st2_dia3);

        // Atualizando Etapa 3
        updateMetric('#st-3 .metric-box:nth-child(1) .metric-value', data.st3_resposta);
        updateMetric('#st-3 .metric-box:nth-child(2) .metric-value', data.st3_pendentes);

        // Atualizando Etapa 4
        updateMetric('#st-4 .metric-box:nth-child(1) .metric-value', data.st4_aceites);
        updateMetric('#st-4 .metric-box:nth-child(2) .metric-value', data.st4_recusas);

        // Atualizando Etapa 5
        updateMetric('#st-5 .metric-box:nth-child(1) .metric-value', data.st5_assinados);
        updateMetric('#st-5 .metric-box:nth-child(2) .metric-value', data.st5_aguardando);

        // Atualizando Etapa 6
        updateMetric('#st-6 .metric-box:nth-child(1) .metric-value', data.st6_agendados);
        updateMetric('#st-6 .metric-box:nth-child(2) .metric-value', data.st6_salas);
        
        // Atualizando Etapa 7
        updateMetric('#st-7 .metric-box:nth-child(1) .metric-value', data.st7_concluidas);
        updateMetric('#st-7 .metric-box:nth-child(2) .metric-value', data.st7_faltas);

        // Atualizando Etapa 8
        updateMetric('#st-8 .metric-box:nth-child(1) .metric-value', data.st8_pagos);
        updateMetric('#st-8 .metric-box:nth-child(2) .metric-value', data.st8_pendentes_pg);

    } catch (error) {
        console.error("Erro ao sincronizar dados reais:", error);
    }
}

// Iniciar Sincronização e atualizar a cada 60 segundos
syncRealData();
setInterval(syncRealData, 60000);

// Calculate element centers relative to the page
function getElementCenter(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    
    // We want the visual center of the main content inside the step
    const card = el.querySelector('.station-card');
    if (!card) return null;

    const rect = card.getBoundingClientRect();
    
    // Calculate relative to the board
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

    // Full path definition
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i-1];
        const curr = points[i];
        
        if (Math.abs(curr.y - prev.y) < 50) {
            d += ` L ${curr.x} ${curr.y}`;
        } else {
            const isRightEdge = prev.x > window.innerWidth / 2;
            const controlOffset = isRightEdge ? 200 : -200;
            d += ` C ${prev.x + controlOffset} ${prev.y}, ${curr.x + controlOffset} ${curr.y}, ${curr.x} ${curr.y}`;
        }
    }

    // Determine unlocked path
    const unlockedStations = stations.filter(id => {
        const el = document.getElementById(id);
        if (!el) return false;
        const card = el.querySelector('.station-card');
        return card && !card.classList.contains('station-locked');
    });
    
    const unlockedPoints = unlockedStations.map(id => getElementCenter(id)).filter(p => p !== null);
    let dUnlocked = '';
    if (unlockedPoints.length > 0) {
        dUnlocked = `M ${unlockedPoints[0].x} ${unlockedPoints[0].y}`;
        for (let i = 1; i < unlockedPoints.length; i++) {
            const prev = unlockedPoints[i-1];
            const curr = unlockedPoints[i];
            
            if (Math.abs(curr.y - prev.y) < 50) {
                dUnlocked += ` L ${curr.x} ${curr.y}`;
            } else {
                const isRightEdge = prev.x > window.innerWidth / 2;
                const controlOffset = isRightEdge ? 200 : -200;
                dUnlocked += ` C ${prev.x + controlOffset} ${prev.y}, ${curr.x + controlOffset} ${curr.y}, ${curr.x} ${curr.y}`;
            }
        }
    }

    // Inner track (Dimmed, Full Path)
    const beltPath = document.createElementNS(SVG_NS, 'path');
    beltPath.setAttribute('d', d);
    beltPath.setAttribute('class', 'belt-path');
    svg.appendChild(beltPath);

    // Outer glow & particles (Only Unlocked Path)
    if (dUnlocked) {
        const glowPath = document.createElementNS(SVG_NS, 'path');
        glowPath.setAttribute('d', dUnlocked);
        glowPath.setAttribute('class', 'belt-glow');
        svg.appendChild(glowPath);

        const corePath = document.createElementNS(SVG_NS, 'path');
        corePath.setAttribute('d', dUnlocked);
        corePath.setAttribute('class', 'belt-core');
        svg.appendChild(corePath);
        
        const pulsePath = document.createElementNS(SVG_NS, 'path');
        pulsePath.setAttribute('d', dUnlocked);
        pulsePath.setAttribute('class', 'belt-pulse');
        svg.appendChild(pulsePath);
    }
}

// Parallax Effect
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    // Move backgrounds at different speeds
    document.getElementById('parallax-bg-1').style.transform = `translateY(${scrollY * -0.2}px)`;
    document.getElementById('parallax-bg-2').style.transform = `translateY(${scrollY * -0.1}px)`;
    document.getElementById('parallax-bg-3').style.transform = `translateY(${scrollY * -0.05}px)`;
});

// Initialization
window.addEventListener('load', () => {
    
    // Animate nodes on scroll
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.journey-step').forEach((step, index) => {
        gsap.to(step, {
            scrollTrigger: {
                trigger: step,
                start: "top 85%", // When the top of the step hits 85% of the viewport height
                toggleActions: "play none none reverse"
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out"
        });
    });

    // Spotlight Effect for Station Cards
    document.querySelectorAll('.station-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // BI Dashboard (Relatórios)
    const navRelatorios = document.getElementById('nav-relatorios');
    if (navRelatorios) {
        navRelatorios.addEventListener('click', () => {
            // Close sidebar if open
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar) sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');

            // Open Dashboard Modal
            const modal = document.getElementById('interactive-modal');
            const modalTitle = document.getElementById('modal-title');
            const modalSubtitle = document.getElementById('modal-subtitle');
            const modalIcon = document.getElementById('modal-icon');
            const modalData = document.getElementById('modal-data');

            modalTitle.innerText = "Inteligência & Relatórios";
            modalSubtitle.innerText = "VISÃO GERAL — DASHBOARD BI";
            modalIcon.className = "fas fa-chart-line";
            modalIcon.parentElement.style.background = "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)";

            modalData.innerHTML = `
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; animation: slideUpFade 0.4s ease forwards;">
                    <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255,255,255,0.05); padding: 25px; border-radius: 20px; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);">
                        <h3 style="color: #fff; margin-bottom: 20px; font-size: 1.2rem; font-weight: 600;">Conversão de Qualificação (Últimos 7 dias)</h3>
                        <div style="height: 250px; position: relative;">
                            <canvas id="funnelChart"></canvas>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div style="background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(15, 23, 42, 0.5)); border: 1px solid rgba(56, 189, 248, 0.2); padding: 25px; border-radius: 20px; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 10px 30px -10px rgba(56, 189, 248, 0.2);">
                            <span style="color: var(--text-secondary); font-size: 0.95rem;">Taxa de Resposta Média</span>
                            <span style="color: #fff; font-size: 2.8rem; font-weight: 700; margin-top: 5px; text-shadow: 0 0 20px rgba(56, 189, 248, 0.5); letter-spacing: -1px;">24.8%</span>
                            <span style="color: #10b981; font-size: 0.85rem; margin-top: 8px;"><i class="fas fa-arrow-up"></i> +2.1% vs Semana passada</span>
                        </div>
                        <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(15, 23, 42, 0.5)); border: 1px solid rgba(168, 85, 247, 0.2); padding: 25px; border-radius: 20px; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 10px 30px -10px rgba(168, 85, 247, 0.2);">
                            <span style="color: var(--text-secondary); font-size: 0.95rem;">Agendamentos (Total)</span>
                            <span style="color: #fff; font-size: 2.8rem; font-weight: 700; margin-top: 5px; text-shadow: 0 0 20px rgba(168, 85, 247, 0.5); letter-spacing: -1px;">142</span>
                            <span style="color: var(--color-blue); font-size: 0.85rem; margin-top: 8px;"><i class="fas fa-calendar-check"></i> 18 agendados para hoje</span>
                        </div>
                    </div>
                </div>
            `;
            
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);

            // Update active state in sidebar
            document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
            navRelatorios.classList.add('active');

            // Render Chart.js
            setTimeout(() => {
                const canvas = document.getElementById('funnelChart');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                
                // Gradient for line
                const gradient = ctx.createLinearGradient(0, 0, 0, 250);
                gradient.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
                gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                        datasets: [{
                            label: 'Leads Qualificados',
                            data: [12, 19, 15, 25, 22, 30, 28],
                            borderColor: '#38bdf8',
                            borderWidth: 3,
                            backgroundColor: gradient,
                            fill: true,
                            tension: 0.4, // smooth curves
                            pointBackgroundColor: '#0f172a',
                            pointBorderColor: '#38bdf8',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            pointHoverBackgroundColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                titleColor: '#94a3b8',
                                bodyColor: '#fff',
                                bodyFont: { size: 14, weight: 'bold' },
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderWidth: 1,
                                padding: 12,
                                displayColors: false,
                                cornerRadius: 8
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                                ticks: { color: '#94a3b8', padding: 10 }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: '#94a3b8', padding: 10 }
                            }
                        },
                        interaction: {
                            intersect: false,
                            mode: 'index',
                        },
                    }
                });
            }, 300);
        });
    }

    // Make sure elements are laid out before drawing lines
    setTimeout(() => {
        drawBelt();
    }, 100);
});

// Redraw lines on window resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawBelt, 100);
});

// Modal Interactive Logic
const modal = document.getElementById('interactive-modal');
const modalClose = document.getElementById('modal-close');
const modalIcon = document.getElementById('modal-icon');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalTitle = document.getElementById('modal-title');
const modalLoader = document.getElementById('modal-loader');
const modalData = document.getElementById('modal-data');

function getStageContent(stepNum) {
    switch(stepNum) {
        case '01':
            let rowsHtml = '';
            if (uploadsState.length === 0) {
                rowsHtml = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum arquivo processado.</td></tr>';
            } else {
                uploadsState.forEach(upload => {
                    rowsHtml += `
                        <tr data-upload-id="${upload.id}">
                            <td>${upload.fileName}</td>
                            <td>${upload.time}</td>
                            <td class="qtd-cell">${upload.qtd}</td>
                            <td><span class="mock-badge green">${upload.status}</span></td>
                            <td style="display: flex; gap: 5px;">
                                <button class="btn-action btn-process" style="padding: 5px 10px; font-size:0.7rem;">Processar</button>
                                <button class="btn-action btn-view-list" style="padding: 5px 10px; font-size:0.7rem; color: #38bdf8;" data-tooltip="Ver Contatos"><i class="fas fa-eye"></i></button>
                                <button class="btn-action btn-delete-upload" style="padding: 5px 10px; font-size:0.7rem; color: #ef4444;" data-tooltip="Apagar Lote"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                });
            }

            return `
                <div class="modal-dashboard-view">
                    <div class="upload-zone" style="border: 2px dashed rgba(255,255,255,0.2); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 20px; background: rgba(0,0,0,0.2);">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 2.5rem; color: var(--color-blue); margin-bottom: 10px;"></i>
                        <h4 style="color: #fff; margin-bottom: 5px;">Arraste sua planilha (.xlsx, .csv)</h4>
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 15px;">Mapeamento automático de Colunas (Nome, Telefone, Email)</p>
                        
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button id="btn-download-template" class="btn-action btn-outline-green" style="width: auto; padding: 8px 15px; font-size: 0.8rem;">
                                <i class="fas fa-file-excel" style="color: inherit;"></i> Baixar Modelo Profissional
                            </button>
                            <input type="file" id="real-file-upload" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" style="display: none;">
                            <button id="btn-select-file" class="btn-action btn-blue" style="width: auto; padding: 8px 20px;">
                                <i class="fas fa-upload"></i> Selecionar Arquivo
                            </button>
                        </div>
                    </div>
                    <table class="mock-table" id="upload-table">
                        <thead><tr><th>Lote de Importação</th><th>Data</th><th>Qtd</th><th>Validados</th><th>Ação</th></tr></thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>`;
        case '02':
            return `
                <div class="modal-dashboard-view">
                    <div style="display:flex; gap: 15px; margin-bottom: 20px;">
                        <button class="btn-action btn-green" style="flex:1;"><i class="fab fa-whatsapp"></i> Disparar Régua WhatsApp</button>
                        <button class="btn-action btn-blue" style="flex:1;"><i class="fas fa-envelope"></i> Disparar E-mail Marketing</button>
                    </div>
                    <table class="mock-table">
                        <thead><tr><th>Campanha / Régua</th><th>Canal</th><th>Taxa de Entrega</th><th>Status</th></tr></thead>
                        <tbody>
                            <tr><td>Convite Inicial (Dia 1)</td><td><i class="fab fa-whatsapp text-green"></i> WhatsApp</td><td>98.5%</td><td><span class="mock-badge green">Concluído</span></td></tr>
                            <tr><td>Lembrete (Dia 3)</td><td><i class="fas fa-envelope text-blue"></i> E-mail</td><td>45.0%</td><td><span class="mock-badge orange">Enviando...</span></td></tr>
                        </tbody>
                    </table>
                </div>`;
        case '03':
            return `
                <div class="modal-dashboard-view">
                    <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 15px; margin-bottom: 20px; display:flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="color:#fff;">Caixa de Entrada (Triagem Manual)</h4>
                            <p style="color:var(--text-secondary); font-size:0.8rem;">Contatos que responderam e exigem qualificação por humano.</p>
                        </div>
                        <button class="btn-action btn-blue" style="width:auto; padding: 10px 20px;"><i class="fas fa-headset"></i> Abrir Softphone</button>
                    </div>
                    <table class="mock-table">
                        <thead><tr><th>Candidato</th><th>Última Mensagem</th><th>Tempo de Espera</th><th>Ação</th></tr></thead>
                        <tbody>
                            <tr><td>Aline Ferreira</td><td style="color:#94a3b8; font-size:0.8rem;">"Sim, tenho interesse!"</td><td><span class="mock-badge orange">5 min</span></td><td><button class="btn-action btn-green" style="padding: 5px 10px; font-size:0.7rem;"><i class="fab fa-whatsapp"></i> Responder</button></td></tr>
                            <tr><td>Carlos Silva</td><td style="color:#94a3b8; font-size:0.8rem;">"Como funciona?"</td><td><span class="mock-badge red">2 horas</span></td><td><button class="btn-action btn-green" style="padding: 5px 10px; font-size:0.7rem;"><i class="fab fa-whatsapp"></i> Responder</button></td></tr>
                        </tbody>
                    </table>
                </div>`;
        case '04':
            return `
                <div class="modal-dashboard-view">
                    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="color:#fff;">Envio em Lote de TCLE</h4>
                        <button class="btn-action btn-green" style="width:auto; padding: 8px 15px;">Disparar Pendentes (5)</button>
                    </div>
                    <table class="mock-table">
                        <thead><tr><th>Candidato Perfilado</th><th>Nota Qualificação</th><th>Status TCLE</th><th>Ação</th></tr></thead>
                        <tbody>
                            <tr><td>Mariana Costa (UX Lead)</td><td><span class="mock-badge blue">9.5/10</span></td><td><span class="mock-badge orange">Pendente de Envio</span></td><td><button class="btn-action" style="padding: 5px 10px; font-size:0.7rem;">Enviar Link</button></td></tr>
                            <tr><td>Roberto Almeida</td><td><span class="mock-badge blue">8.0/10</span></td><td><span class="mock-badge orange">Pendente de Envio</span></td><td><button class="btn-action" style="padding: 5px 10px; font-size:0.7rem;">Enviar Link</button></td></tr>
                        </tbody>
                    </table>
                </div>`;
        case '05':
            return `
                <div class="modal-dashboard-view">
                    <p style="color:var(--text-secondary); margin-bottom: 15px;">Documentos legais assinados via DocuSign/Clicksign. Prontos para marcar agenda.</p>
                    <table class="mock-table">
                        <thead><tr><th>Candidato</th><th>Data Assinatura</th><th>Documento</th><th>Próximo Passo</th></tr></thead>
                        <tbody>
                            <tr><td>João Pedro</td><td>Hoje, 10:15</td><td><i class="fas fa-file-pdf" style="color:var(--color-red)"></i> Termo_JP.pdf</td><td><button class="btn-action btn-blue" style="padding: 5px 10px; font-size:0.7rem;">Liberar Calendário</button></td></tr>
                            <tr><td>Fernanda Lima</td><td>Ontem, 18:30</td><td><i class="fas fa-file-pdf" style="color:var(--color-red)"></i> Termo_FL.pdf</td><td><button class="btn-action btn-blue" style="padding: 5px 10px; font-size:0.7rem;">Liberar Calendário</button></td></tr>
                        </tbody>
                    </table>
                </div>`;
        case '06':
            return `
                <div class="modal-dashboard-view">
                    <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
                        <h4 style="color:#c4b5fd; margin-bottom: 10px;"><i class="fas fa-link"></i> Link Self-Service (Cal.com)</h4>
                        <code style="background:rgba(0,0,0,0.3); padding: 5px 10px; border-radius: 5px; color:#fff;">cal.com/qualipanel/focus-group-sp</code>
                    </div>
                    <table class="mock-table">
                        <thead><tr><th>Entrevistado</th><th>Data Agendada</th><th>Plataforma</th><th>Link da Sala</th></tr></thead>
                        <tbody>
                            <tr><td>João Pedro</td><td>20/05 às 14:00</td><td><span class="mock-badge blue"><i class="fas fa-video"></i> Zoom</span></td><td><button class="btn-action" style="padding: 5px 10px; font-size:0.7rem;">Entrar</button></td></tr>
                            <tr><td>Fernanda Lima</td><td>21/05 às 09:30</td><td><span class="mock-badge purple"><i class="fas fa-users"></i> Presencial</span></td><td><span style="color:#94a3b8; font-size:0.8rem;">Sala 02 - SP</span></td></tr>
                        </tbody>
                    </table>
                </div>`;
        case '07':
            return `
                <div class="modal-dashboard-view">
                    <table class="mock-table">
                        <thead><tr><th>Entrevistado</th><th>Status Realização</th><th>Gravação</th><th>Fechamento</th></tr></thead>
                        <tbody>
                            <tr><td>João Pedro</td><td><span class="mock-badge green">Concluído</span></td><td><button class="btn-action" style="padding: 5px 10px; font-size:0.7rem; color:#ef4444;"><i class="fab fa-youtube"></i> Ver Vídeo</button></td><td><button class="btn-action btn-orange" style="padding: 5px 10px; font-size:0.7rem;">Solicitar Pagamento</button></td></tr>
                            <tr><td>Márcio Dias</td><td><span class="mock-badge red">Falta (No-show)</span></td><td>-</td><td><button class="btn-action" style="padding: 5px 10px; font-size:0.7rem;">Reagendar</button></td></tr>
                        </tbody>
                    </table>
                </div>`;
        case '08':
            return `
                <div class="modal-dashboard-view">
                    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="color:#fff;">Contas a Pagar (Incentivos)</h4>
                        <button class="btn-action btn-green" style="width:auto; padding: 8px 15px;"><i class="fas fa-money-bill-wave"></i> Gerar Remessa Pix</button>
                    </div>
                    <table class="mock-table">
                        <thead><tr><th>Entrevistado</th><th>Valor (Incentivo)</th><th>Chave Pix</th><th>Status Pgto</th></tr></thead>
                        <tbody>
                            <tr><td>João Pedro</td><td style="color:#34d399; font-weight:bold;">R$ 150,00</td><td style="color:#94a3b8; font-size:0.8rem;">***.456.789-**</td><td><span class="mock-badge orange">Aguardando</span></td></tr>
                            <tr><td>Luciana Souza</td><td style="color:#34d399; font-weight:bold;">R$ 200,00</td><td style="color:#94a3b8; font-size:0.8rem;">***.123.456-**</td><td><span class="mock-badge green">Pago</span></td></tr>
                        </tbody>
                    </table>
                </div>`;
        default:
            return `<p style="color:#fff;">Interface não configurada.</p>`;
    }
}

function openModal(stepNum, title, iconHtml, iconClass) {
    // Set Header
    modalSubtitle.textContent = `ETAPA ${stepNum} — SINCRONIZADO`;
    modalTitle.textContent = title;
    modalIcon.innerHTML = iconHtml;
    modalIcon.className = `modal-icon ${iconClass}`;
    
    // Reset State
    modalLoader.style.display = 'flex';
    modalData.style.display = 'none';
    modalData.innerHTML = '';
    
    // Open Modal
    modal.classList.add('active');
    
    // Simulate API fetch delay
    setTimeout(() => {
        modalLoader.style.display = 'none';
        
        // Render specific UI for the clicked stage
        modalData.innerHTML = getStageContent(stepNum);
        modalData.style.display = 'block';
        
        // Bind dynamic events to the newly generated HTML
        bindModalEvents(stepNum);
    }, 800);
}

// ==========================================
// TOAST & MODAL FUNCTIONALITIES SIMULATION
// ==========================================
function showToast(msg, type='info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-info-circle';
    if(type === 'success') icon = 'fa-check-circle';
    if(type === 'warning') icon = 'fa-exclamation-triangle';
    if(type === 'error') icon = 'fa-times-circle';
    
    toast.innerHTML = `<i class="fas ${icon} toast-icon"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function bindModalEvents(stepNum) {
    if (stepNum === '01') {
        const fileInput = document.getElementById('real-file-upload');
        const uploadBtn = document.getElementById('btn-select-file');
        const tbody = document.querySelector('#upload-table tbody');

        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                if(e.target.files.length > 0) {
                    const file = e.target.files[0];
                    const fileName = file.name;
                    const originalHtml = uploadBtn.innerHTML;
                    
                    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
                    uploadBtn.disabled = true;

                    setTimeout(() => {
                        showToast(`Arquivo "${fileName}" carregado e validado com sucesso!`, 'success');
                        uploadBtn.innerHTML = originalHtml;
                        uploadBtn.disabled = false;
                        
                        // Formatar hora
                        const now = new Date();
                        const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                        const randomCount = Math.floor(Math.random() * 800) + 200; // random count between 200 and 1000
                        const newId = 'u' + Date.now();
                        
                        uploadsState.push({
                            id: newId,
                            fileName: fileName,
                            time: 'Agora, ' + timeString,
                            qtd: randomCount,
                            status: '100% OK'
                        });

                        // Re-render the modal content to apply new state
                        const modalData = document.getElementById('modal-data');
                        modalData.innerHTML = getStageContent('01');
                        
                        syncRealData(); // Update dashboard with new totals
                        
                        // Reset input para permitir selecionar o mesmo arquivo novamente
                        fileInput.value = '';
                        bindModalEvents('01'); // Re-liga eventos para os novos botões
                    }, 1200);
                }
            });
        }
        
        function bindTableEvents() {
            const deleteBtns = document.querySelectorAll('.btn-delete-upload');
            deleteBtns.forEach(btn => {
                // Clonar e substituir para evitar duplicação de eventos
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                newBtn.addEventListener('click', function() {
                    const row = this.closest('tr');
                    const fileName = row.querySelector('td').innerText;
                    
                    showConfirm('Atenção!', `Tem certeza que deseja apagar o lote "${fileName}"?\n\nIsso removerá todos os contatos do funil e recalculará as estatísticas.`, () => {
                        row.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                        row.style.transform = 'translateX(-30px)';
                        row.style.opacity = '0';
                        
                        setTimeout(() => {
                            // Remove from state array
                            const uploadId = row.getAttribute('data-upload-id');
                            if (uploadId) {
                                uploadsState = uploadsState.filter(u => u.id !== uploadId);
                            }
                            row.remove();
                            
                            // Handle empty state visualization
                            const tbody = document.querySelector('#upload-table tbody');
                            if (uploadsState.length === 0 && tbody) {
                                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum arquivo processado.</td></tr>';
                            }
                            
                            showToast(`Upload de "${fileName}" foi apagado.`, 'warning');
                            syncRealData(); // Update dashboard with new totals
                        }, 400);
                    });
                });
            });

            const processBtns = document.querySelectorAll('.btn-process');
            processBtns.forEach(btn => {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                newBtn.addEventListener('click', function() {
                    this.innerHTML = '<i class="fas fa-check"></i> Processado';
                    this.disabled = true;
                    this.className = 'btn-action btn-green';
                    showToast('Lote processado. Contatos entraram na régua!', 'success');
                });
            });

            const viewBtns = document.querySelectorAll('.btn-view-list');
            viewBtns.forEach(btn => {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                newBtn.addEventListener('click', function() {
                    const row = this.closest('tr');
                    const fileName = row.querySelector('td').innerText;
                    const qtdCell = row.querySelector('.qtd-cell');
                    const contactCount = qtdCell ? parseInt(qtdCell.innerText.replace(/\D/g, '')) || 6 : 6;
                    
                    const modalData = document.getElementById('modal-data');
                    const previousHtml = modalData.innerHTML;
                    
                    let rowsHtml = '';
                    const firstNames = ['Carlos', 'Ana', 'Felipe', 'Mariana', 'João', 'Beatriz', 'Lucas', 'Julia', 'Pedro', 'Larissa'];
                    const lastNames = ['Silva', 'Souza', 'Costa', 'Dias', 'Alves', 'Lima', 'Oliveira', 'Mendes', 'Gomes', 'Ferreira'];
                    
                    for (let i = 1; i <= contactCount; i++) {
                        const name = firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)];
                        const isInvalid = Math.random() < 0.05;
                        const statusHtml = isInvalid ? '<span class="mock-badge red">Inválido</span>' : '<span class="mock-badge green">Válido</span>';
                        const phone = isInvalid ? '-' : `(11) 9${Math.floor(Math.random()*9000)+1000}-${Math.floor(Math.random()*9000)+1000}`;
                        const email = `${name.split(' ')[0].toLowerCase()}.${i}@dominio.com`;
                        const codeId = `#${String(i).padStart(4, '0')}`;
                        rowsHtml += `<tr><td><span style="color:var(--text-secondary); margin-right:8px; font-family:monospace;">${codeId}</span> ${name}</td><td style="color:#94a3b8; font-size:0.8rem;">${email}</td><td>${phone}</td><td>${statusHtml}</td></tr>`;
                    }
                    
                    modalData.innerHTML = `
                        <div class="modal-list-view" style="animation: slideUpFade 0.4s forwards;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <button class="btn-action btn-back" style="width: auto; padding: 8px 15px;"><i class="fas fa-arrow-left"></i> Voltar</button>
                                <h4 style="color: #fff; margin:0;">Visualizando: <span style="color:var(--color-blue);">${fileName}</span></h4>
                                <div class="search-bar" style="width: 250px;">
                                    <i class="fas fa-search"></i>
                                    <input type="text" id="search-contact-input" placeholder="Buscar contato...">
                                </div>
                            </div>
                            
                            <div style="max-height: 400px; overflow-y: auto; overflow-x: hidden; padding-right: 5px;">
                                <table class="mock-table" id="contact-list-table">
                                    <thead style="position: sticky; top: 0; background: #0f172a; z-index: 10;">
                                        <tr><th>ID / Nome</th><th>Email</th><th>WhatsApp</th><th>Status</th></tr>
                                    </thead>
                                    <tbody>
                                        ${rowsHtml}
                                    </tbody>
                                </table>
                            </div>
                            <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); font-size: 0.8rem;">
                                <span id="contact-count">Mostrando ${contactCount} contatos analisados</span>
                                <button class="btn-action btn-blue" id="btn-process-batch" style="width: auto; padding: 8px 20px;"><i class="fas fa-paper-plane"></i> Processar Lote Inteiro</button>
                            </div>
                        </div>
                    `;
                    
                    // Bind Back button
                    const btnBack = modalData.querySelector('.btn-back');
                    btnBack.addEventListener('click', () => {
                        modalData.innerHTML = previousHtml;
                        bindTableEvents(); // Re-bind events for the table after restoring html
                        // Re-bind upload button
                        bindModalEvents('01');
                    });
                    
                    // Bind Search Input
                    const searchInput = document.getElementById('search-contact-input');
                    const rows = document.querySelectorAll('#contact-list-table tbody tr');
                    const countSpan = document.getElementById('contact-count');
                    
                    if (searchInput) {
                        searchInput.addEventListener('input', (e) => {
                            const term = e.target.value.toLowerCase();
                            let visibleCount = 0;
                            rows.forEach(r => {
                                const text = r.innerText.toLowerCase();
                                if (text.includes(term)) {
                                    r.style.display = '';
                                    visibleCount++;
                                } else {
                                    r.style.display = 'none';
                                }
                            });
                            countSpan.innerText = `Mostrando ${visibleCount} contatos analisados`;
                        });
                    }
                    
                    // Bind Process Button
                    const btnProcess = document.getElementById('btn-process-batch');
                    if (btnProcess) {
                        btnProcess.addEventListener('click', () => {
                            btnProcess.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
                            btnProcess.disabled = true;
                            
                            setTimeout(() => {
                                showToast(`Todos os contatos de "${fileName}" foram processados e enviados para a régua!`, 'success');
                                btnProcess.innerHTML = '<i class="fas fa-check"></i> Concluído';
                                btnProcess.className = 'btn-action btn-green';
                                
                                // Auto-back to main table
                                setTimeout(() => {
                                    btnBack.click();
                                }, 1500);
                            }, 2000);
                        });
                    }
                });
            });
        }
        
        // Chamada inicial para ligar o evento da primeira linha mockada
        bindTableEvents();
        
        const downloadBtn = document.getElementById('btn-download-template');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async (e) => {
                showToast('Gerando template profissional em Excel...', 'info');
                const originalHtml = e.target.innerHTML;
                e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando .xlsx...';
                
                try {
                    const workbook = new ExcelJS.Workbook();
                    workbook.creator = 'QualiPanel';
                    const sheet = workbook.addWorksheet('Importação', {properties:{tabColor:{argb:'FF10B981'}}});
                    
                    sheet.columns = [
                        { header: 'NOME COMPLETO', key: 'nome', width: 35 },
                        { header: 'EMAIL', key: 'email', width: 35 },
                        { header: 'TELEFONE (WhatsApp)', key: 'telefone', width: 25 },
                        { header: 'CARGO / PERFIL', key: 'cargo', width: 30 }
                    ];
                    
                    // Style Header
                    const headerRow = sheet.getRow(1);
                    headerRow.height = 30;
                    headerRow.eachCell((cell) => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
                        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        cell.border = {
                            top: {style:'thin', color:{argb:'FF38BDF8'}}, bottom: {style:'thin', color:{argb:'FF38BDF8'}},
                            left: {style:'thin', color:{argb:'FF38BDF8'}}, right: {style:'thin', color:{argb:'FF38BDF8'}}
                        };
                    });
                    
                    // Add mock data
                    sheet.addRow({nome: 'João da Silva', email: 'joao.silva@exemplo.com', telefone: '+55 11 99999-9999', cargo: 'Gerente de Projetos'});
                    sheet.addRow({nome: 'Mariana Costa', email: 'mariana.costa@exemplo.com', telefone: '+55 11 98888-8888', cargo: 'UX Designer'});
                    
                    [2, 3].forEach(rowNum => {
                        const row = sheet.getRow(rowNum);
                        row.height = 25;
                        row.eachCell(cell => {
                            cell.alignment = { vertical: 'middle', horizontal: 'left' };
                            cell.border = { bottom: {style:'hair', color: {argb:'FFDDDDDD'}} };
                        });
                    });
                    
                    const buffer = await workbook.xlsx.writeBuffer();
                    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'Template_QualiPanel.xlsx';
                    link.click();
                    URL.revokeObjectURL(link.href);
                    
                    e.target.innerHTML = '<i class="fas fa-check"></i> Baixado';
                    e.target.style.color = 'var(--color-green)';
                    
                    setTimeout(() => { e.target.innerHTML = originalHtml; e.target.style.color = ''; }, 3000);
                } catch (err) {
                    console.error(err);
                    showToast('Erro ao gerar Excel.', 'error');
                    e.target.innerHTML = originalHtml;
                }
            });
        }
    }
    else if (stepNum === '02') {
        const btns = document.querySelectorAll('#modal-data .btn-action');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const isWpp = e.target.innerText.includes('WhatsApp');
                e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Disparando...';
                setTimeout(() => {
                    showToast(`Campanha de ${isWpp ? 'WhatsApp' : 'E-mail'} enviada para a fila de envio (Evolution API).`, 'success');
                    e.target.innerHTML = `<i class="fas fa-check"></i> Disparado`;
                }, 1500);
            });
        });
    }
    else if (stepNum === '03') {
        // Softphone
        const softphone = document.querySelector('#modal-data .btn-orange');
        if (softphone) {
            softphone.addEventListener('click', (e) => {
                showToast('Conectando ao Softphone (VoIP)...', 'info');
                setTimeout(() => showToast('Ramal Conectado.', 'success'), 1500);
            });
        }
        // Responder
        const answerBtns = document.querySelectorAll('#modal-data tbody .btn-action.btn-green');
        answerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                showToast('Abrindo interface do Webchat (WhatsApp)...', 'info');
                e.target.innerHTML = '<i class="fab fa-whatsapp"></i> Em Atendimento';
                e.target.style.background = '#ea580c';
                e.target.style.borderColor = '#ea580c';
                e.target.style.color = '#fff';
            });
        });
    }
    else if (stepNum === '04') {
        // Send batch TCLE
        const batchBtn = document.querySelector('#modal-data .btn-green');
        if (batchBtn) {
            batchBtn.addEventListener('click', (e) => {
                e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Disparando 5 TCLEs...';
                setTimeout(() => {
                    showToast('5 TCLEs enviados via Docusign/Resend com sucesso.', 'success');
                    e.target.innerHTML = 'Concluído';
                    e.target.disabled = true;
                    // Update rows
                    document.querySelectorAll('#modal-data tbody tr').forEach(tr => {
                        const badge = tr.querySelector('.mock-badge.orange');
                        if (badge) {
                            badge.className = 'mock-badge green';
                            badge.innerText = 'Enviado';
                        }
                        const btn = tr.querySelector('.btn-action');
                        if (btn) btn.disabled = true;
                    });
                }, 2000);
            });
        }
        
        // Single TCLE
        const sendBtns = document.querySelectorAll('#modal-data tbody .btn-action');
        sendBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                setTimeout(() => {
                    showToast('Link do TCLE enviado ao candidato.', 'success');
                    e.target.innerHTML = 'Enviado';
                    e.target.disabled = true;
                    e.target.closest('tr').querySelector('.mock-badge.orange').className = 'mock-badge green';
                    e.target.closest('tr').querySelector('.mock-badge.green').innerText = 'Enviado';
                }, 1000);
            });
        });
    }
    else if (stepNum === '05') {
        const libBtns = document.querySelectorAll('#modal-data tbody .btn-action');
        libBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                setTimeout(() => {
                    showToast('Candidato liberado! Link de Agendamento (Cal.com) enviado.', 'success');
                    e.target.innerHTML = 'Liberado';
                    e.target.classList.replace('btn-blue', 'btn-green');
                    e.target.disabled = true;
                }, 1000);
            });
        });
    }
    else if (stepNum === '06') {
        const enterBtns = document.querySelectorAll('#modal-data tbody .btn-action');
        enterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                showToast('Conectando ao Zoom...', 'info');
                // Simulate opening link
            });
        });
    }
    else if (stepNum === '07') {
        const playBtn = document.querySelector('#modal-data tbody tr:first-child .btn-action:not(.btn-orange)');
        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                showToast('Carregando gravação na nuvem...', 'info');
            });
        }
        const reqPayBtn = document.querySelector('#modal-data tbody tr:first-child .btn-orange');
        if (reqPayBtn) {
            reqPayBtn.addEventListener('click', (e) => {
                e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                setTimeout(() => {
                    showToast('Solicitação de pagamento (Pix) enviada ao setor financeiro.', 'success');
                    e.target.innerHTML = 'Solicitado';
                    e.target.disabled = true;
                }, 1500);
            });
        }
    }
    else if (stepNum === '08') {
        const pixBtn = document.querySelector('#modal-data .btn-green');
        if (pixBtn) {
            pixBtn.addEventListener('click', (e) => {
                e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando Lote...';
                setTimeout(() => {
                    showToast('Remessa Pix gerada! Integração bancária concluída.', 'success');
                    e.target.innerHTML = '<i class="fas fa-check"></i> Remessa Concluída';
                    
                    const badges = document.querySelectorAll('#modal-data tbody .mock-badge.orange');
                    badges.forEach(b => {
                        b.className = 'mock-badge green';
                        b.innerText = 'Pago';
                    });
                }, 2000);
            });
        }
    }
}

// Bind Click Events to Cards & Setup Lock Toggle
document.querySelectorAll('.station-card').forEach((card, index) => {
    
    // Add Lock Toggle Button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'lock-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-lock-open"></i>';
    toggleBtn.setAttribute('data-tooltip', 'Bloquear Etapa');
    
    // Style the toggle button
    Object.assign(toggleBtn.style, {
        position: 'absolute', top: '15px', right: '15px',
        background: 'transparent', border: 'none',
        color: 'var(--text-secondary)', cursor: 'pointer',
        fontSize: '1.2rem', zIndex: '10', transition: 'all 0.3s'
    });
    
    card.appendChild(toggleBtn);
    
    // Toggle Logic
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger modal
        
        const isLocked = card.classList.toggle('station-locked');
        const btn = card.querySelector('.btn-action');
        
        if (isLocked) {
            toggleBtn.innerHTML = '<i class="fas fa-lock"></i>';
            toggleBtn.style.color = 'var(--color-red)';
            toggleBtn.setAttribute('data-tooltip', 'Desbloquear Etapa');
            
            if (btn) {
                if (!btn.dataset.originalHtml) {
                    btn.dataset.originalHtml = btn.innerHTML;
                    btn.dataset.originalClass = btn.className;
                }
                btn.innerHTML = '<i class="fas fa-lock"></i> Bloqueado';
                btn.className = 'btn-action btn-locked';
            }
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-lock-open"></i>';
            toggleBtn.style.color = '#34d399'; // Greenish
            toggleBtn.setAttribute('data-tooltip', 'Bloquear Etapa');
            
            if (btn && btn.dataset.originalHtml) {
                btn.innerHTML = btn.dataset.originalHtml;
                btn.className = btn.dataset.originalClass;
            }
            
            // Unlock Animation
            gsap.fromTo(card, {scale: 1.05, boxShadow: '0 0 30px rgba(56,189,248,0.4)'}, {scale: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', duration: 1});
        }
        
        drawBelt(); // Redraw the line to match unlocked progress
    });
    
    // Initially lock stages 4 through 8 for progressive demo
    if (index >= 3) {
        toggleBtn.click();
    }

    // Modal click logic
    card.addEventListener('click', (e) => {
        if (card.classList.contains('station-locked')) return; // Do nothing if locked
        
        const titleEl = card.querySelector('h3');
        const numEl = card.querySelector('.step-num');
        const iconEl = card.querySelector('.station-icon');
        
        if (titleEl && numEl && iconEl) {
            const title = titleEl.textContent;
            const num = numEl.textContent;
            const iconHtml = iconEl.innerHTML;
            const iconClass = Array.from(iconEl.classList).find(c => c.startsWith('icon-')) || 'icon-blue';
            
            openModal(num, title, iconHtml, iconClass);
        }
    });
});

// Close Modal Events
modalClose.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});

// Sidebar & Notification Logic
const btnOpenSidebar = document.getElementById('btn-open-sidebar');
const btnCloseSidebar = document.getElementById('btn-close-sidebar');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const btnNotification = document.getElementById('btn-notification');
const notificationDropdown = document.getElementById('notification-dropdown');

if (btnOpenSidebar && sidebar && sidebarOverlay) {
    btnOpenSidebar.addEventListener('click', () => {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
    });
    
    const closeSidebar = () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    };
    
    btnCloseSidebar.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // Make Sidebar Items Interactive
    const sidebarItems = document.querySelectorAll('.sidebar-nav li:not(.nav-divider)');
    const views = {
        'Projetos': document.getElementById('board'),
        'Equipe': document.getElementById('view-equipe'),
        'Relatórios': document.getElementById('view-relatorios'),
        'Configurações': document.getElementById('view-configuracoes')
    };
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            if (this.classList.contains('logout')) {
                showToast('Saindo do sistema...', 'info');
                setTimeout(() => closeSidebar(), 800);
                return;
            }
            
            // Remove active from all
            sidebarItems.forEach(el => el.classList.remove('active'));
            // Add active to clicked
            this.classList.add('active');
            
            const sectionName = this.innerText.trim();
            showToast(`Acessando a área de ${sectionName}...`, 'success');
            
            // Swap Views
            if (views[sectionName]) {
                Object.values(views).forEach(v => {
                    if (v) v.style.display = 'none';
                });
                
                const targetView = views[sectionName];
                targetView.style.display = 'block';
                targetView.style.opacity = '0';
                gsap.to(targetView, {opacity: 1, duration: 0.5});
            }
            
            // Close sidebar after short delay
            setTimeout(() => {
                closeSidebar();
            }, 600);
        });
    });
}

if (btnNotification && notificationDropdown) {
    btnNotification.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!notificationDropdown.contains(e.target) && e.target !== btnNotification) {
            notificationDropdown.classList.remove('active');
        }
    });
}

// End of script

