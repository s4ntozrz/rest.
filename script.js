document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. INICIALIZAÇÃO E UI BÁSICA
    // ==========================================
    const splash = document.getElementById('splash-screen');
    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => { splash.style.display = 'none'; }, 600);
    }, 3000);

    const dateElement = document.getElementById('current-date');
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('pt-BR', { 
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' 
    }).toLowerCase();

    const locationElement = document.getElementById('current-location');
    locationElement.textContent = "📍 recife, pe";

    const header = document.getElementById('app-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });


    // ==========================================
    // 2. VARIÁVEIS GLOBAIS DE CONTROLE
    // ==========================================
    let currentSelectedDateKey = null;
    let myChart = null;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    
    // Variáveis de Edição
    let isEditMode = false;
    let editId = null;
    
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];


    // ==========================================
    // 3. LÓGICA DO CALENDÁRIO
    // ==========================================
    const monthYearDisplay = document.getElementById('month-year-display');
    const calendarDays = document.getElementById('calendar-days');

    function renderCalendar(month, year) {
        calendarDays.innerHTML = "";
        monthYearDisplay.textContent = `${months[month]} ${year}`;
        
        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('empty');
            calendarDays.appendChild(emptyDiv);
        }

        for (let i = 1; i <= lastDay; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = i;
            
            const dayKey = `${year}-${month}-${i}`;
            const savedData = localStorage.getItem(`rast_${dayKey}`);
            
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (parsedData.length > 0) dayDiv.classList.add('has-data');
            }

            if (i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                dayDiv.classList.add('today');
            }

            dayDiv.addEventListener('click', () => {
                const dayString = `${i} de ${months[month]}`;
                const key = `${year}-${month}-${i}`;
                currentSelectedDateKey = key;
                resetFormState(); 
                openModal(dayString);
                updateDailySummary(key, dayString);
            });

            calendarDays.appendChild(dayDiv);
        }
        updateStats(month, year);
    }

    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar(currentMonth, currentYear);
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar(currentMonth, currentYear);
    });


    // ==========================================
    // 4. RESUMO DO DIA (ACORDEÃO)
    // ==========================================
    const summaryBtn = document.getElementById('summary-toggle');
    const summaryContent = document.getElementById('summary-content');
    const summaryList = document.getElementById('summary-list');
    const summaryDateDisplay = document.getElementById('summary-date-display');

    summaryBtn.addEventListener('click', () => {
        summaryBtn.classList.toggle('active');
        summaryContent.classList.toggle('open');
    });

    function updateDailySummary(dateKey, dateString) {
        summaryDateDisplay.textContent = dateString;
        summaryBtn.classList.remove('active');
        summaryContent.classList.remove('open');

        const storageKey = `rast_${dateKey}`;
        const records = JSON.parse(localStorage.getItem(storageKey)) || [];

        summaryList.innerHTML = ''; 
        if (records.length === 0) {
            summaryList.innerHTML = '<p class="empty-summary">Nenhum registro.</p>';
            return;
        }

        records.forEach(item => {
            const div = document.createElement('div');
            div.className = `record-item ${item.type === 'agenda' ? 'agenda-type' : ''}`;
            div.style.marginBottom = "8px";
            div.innerHTML = `
                <div class="record-info"><h4>${item.title}</h4><p>${item.detail}</p></div>
            `;
            summaryList.appendChild(div);
        });
    }


    // ==========================================
    // 5. ESTATÍSTICAS
    // ==========================================
    function updateStats(month, year) {
        let totalMinutes = 0;
        let studySessions = 0;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const labels = Array.from({length: daysInMonth}, (_, i) => i + 1);
        const dataPoints = new Array(daysInMonth).fill(0);
        const timeOfDayCount = { manha: 0, tarde: 0, noite: 0 };

        for (let day = 1; day <= daysInMonth; day++) {
            const key = `rast_${year}-${month}-${day}`;
            const saved = JSON.parse(localStorage.getItem(key));
            if (saved && saved.length > 0) {
                let dayMinutes = 0;
                let hasStudy = false;
                saved.forEach(item => {
                    if (item.type === 'study') {
                        const mins = parseInt(item.detail) || 0;
                        dayMinutes += mins;
                        totalMinutes += mins;
                        studySessions++;
                        hasStudy = true;
                        const hour = new Date(item.id).getHours();
                        if (hour >= 5 && hour < 12) timeOfDayCount.manha++;
                        else if (hour >= 12 && hour < 18) timeOfDayCount.tarde++;
                        else timeOfDayCount.noite++;
                    }
                });
                if (hasStudy) dataPoints[day - 1] = dayMinutes / 60; 
            }
        }

        const hours = Math.floor(totalMinutes / 60);
        const minsRest = totalMinutes % 60;
        document.getElementById('total-hours').textContent = `${hours}h ${minsRest}m`;
        document.getElementById('total-sessions').textContent = studySessions;
        const avg = studySessions > 0 ? Math.round(totalMinutes / studySessions) : 0;
        document.getElementById('average-time').textContent = `${avg}m`;

        const insightText = document.getElementById('insight-text');
        if (studySessions === 0) {
            insightText.textContent = "Nenhum dado neste mês. Que tal começar hoje?";
        } else {
            const topTurno = Object.keys(timeOfDayCount).reduce((a, b) => timeOfDayCount[a] > timeOfDayCount[b] ? a : b);
            const nomes = { manha: "manhã", tarde: "tarde", noite: "noite" };
            insightText.textContent = `Você rende mais na parte da ${nomes[topTurno]}. Continue o foco!`;
        }
        renderChart(labels, dataPoints);
    }

    function renderChart(labels, data) {
        const ctx = document.getElementById('studyChart').getContext('2d');
        const isDark = document.body.classList.contains('dark-mode');
        const lineColor = isDark ? '#ffffff' : '#000000';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
        if (myChart) myChart.destroy();
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Horas',
                    data: data,
                    borderColor: lineColor,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { displayColors: false } },
                scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: isDark ? '#888' : '#aaa' } }, x: { display: false } }
            }
        });
    }


    // ==========================================
    // 6. CRUD (SALVAR, EDITAR, EXCLUIR) + AUTO SAVE
    // ==========================================

    function saveOrUpdateRecord(record) {
        const storageKey = `rast_${currentSelectedDateKey}`;
        let records = JSON.parse(localStorage.getItem(storageKey)) || [];

        if (isEditMode && editId) {
            const index = records.findIndex(r => r.id === editId);
            if (index !== -1) {
                record.id = editId; 
                records[index] = record;
            }
        } else {
            records.push(record);
        }
        
        localStorage.setItem(storageKey, JSON.stringify(records));
        
        resetFormState();
        renderDayRecords(); 
        renderCalendar(currentMonth, currentYear); 
        
        const dateParts = currentSelectedDateKey.split('-');
        const dayString = `${dateParts[2]} de ${months[dateParts[1]]}`;
        updateDailySummary(currentSelectedDateKey, dayString);

        // --- TRIGGER AUTOMÁTICO DE UPLOAD ---
        if (typeof autoSaveToDrive === "function") {
            autoSaveToDrive();
        }
    }

    document.getElementById('study-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const subject = e.target.querySelector('input[type="text"]').value;
        const timeInput = e.target.querySelector('input[placeholder="60"]').value;
        const notes = e.target.querySelector('textarea').value;

        saveOrUpdateRecord({
            id: Date.now(),
            type: 'study',
            title: subject,
            detail: `${timeInput} min`,
            notes: notes,
            rawTime: timeInput
        });
    });

    document.getElementById('agenda-form').addEventListener('submit', (e) => {
        e.preventDefault();
        requestNotificationPermission(); // Pede permissão ao tentar salvar
        const title = e.target.querySelector('input[type="text"]').value;
        const timeInput = e.target.querySelector('input[type="time"]').value;
        const notes = e.target.querySelector('textarea').value;

        saveOrUpdateRecord({
            id: Date.now(),
            type: 'agenda',
            title: title,
            detail: `Horário: ${timeInput}`,
            notes: notes,
            rawTime: timeInput
        });
    });

    window.startEdit = function(id) {
        const storageKey = `rast_${currentSelectedDateKey}`;
        const records = JSON.parse(localStorage.getItem(storageKey)) || [];
        const item = records.find(r => r.id === id);

        if (!item) return;

        isEditMode = true;
        editId = id;

        if (item.type === 'study') {
            switchTab('study');
            const form = document.getElementById('study-form');
            form.querySelector('input[type="text"]').value = item.title;
            const timeVal = item.rawTime || parseInt(item.detail); 
            form.querySelector('input[placeholder="60"]').value = timeVal;
            form.querySelector('textarea').value = item.notes;
            form.querySelector('button').textContent = "Atualizar Sessão"; 
        } else {
            switchTab('agenda');
            const form = document.getElementById('agenda-form');
            form.querySelector('input[type="text"]').value = item.title;
            const timeVal = item.rawTime || item.detail.replace('Horário: ', '').trim();
            form.querySelector('input[type="time"]').value = timeVal;
            form.querySelector('textarea').value = item.notes;
            form.querySelector('button').textContent = "Atualizar Evento"; 
        }

        document.querySelector('.modal-content').scrollTop = 0;
    };

    function resetFormState() {
        isEditMode = false;
        editId = null;
        document.getElementById('study-form').reset();
        document.getElementById('agenda-form').reset();
        document.querySelector('#study-form button').textContent = "Salvar Sessão";
        document.querySelector('#agenda-form button').textContent = "Adicionar Evento";
    }

    window.deleteRecord = function(id) {
        if(!confirm("Deseja realmente excluir?")) return;

        const storageKey = `rast_${currentSelectedDateKey}`;
        let records = JSON.parse(localStorage.getItem(storageKey)) || [];
        records = records.filter(record => record.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(records));
        
        if (isEditMode && editId === id) resetFormState();

        renderDayRecords();
        renderCalendar(currentMonth, currentYear);
        
        const dateParts = currentSelectedDateKey.split('-');
        const dayString = `${dateParts[2]} de ${months[dateParts[1]]}`;
        updateDailySummary(currentSelectedDateKey, dayString);

        // --- TRIGGER AUTOMÁTICO DE UPLOAD ---
        if (typeof autoSaveToDrive === "function") {
            autoSaveToDrive();
        }
    };


    // ==========================================
    // 7. MENU, TEMA E STATUS BAR
    // ==========================================
    const sidebar = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    const menuIcon = document.querySelector('.menu-icon');
    const themeSwitch = document.getElementById('menu-theme-toggle');
    const metaThemeColor = document.querySelector("meta[name=theme-color]");

    window.toggleMenu = function(x) {
        x.classList.toggle("change");
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
    }

    window.toggleMenuViaOverlay = function() {
        menuIcon.classList.remove("change");
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    }

    function updateStatusBar(isDark) {
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", isDark ? "#121212" : "#f8f9fa");
        }
    }

    const savedTheme = localStorage.getItem('rast_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeSwitch.checked = true;
        updateStatusBar(true);
    } else {
        updateStatusBar(false);
    }

    themeSwitch.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('rast_theme', 'dark');
            updateStatusBar(true);
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('rast_theme', 'light');
            updateStatusBar(false);
        }
        updateStats(currentMonth, currentYear);
    });

    window.exportData = function() {
        const dataToExport = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('rast_')) dataToExport[key] = localStorage.getItem(key);
        }
        let fileName = prompt("Nome do arquivo:", "rast_backup");
        if (!fileName) return;
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${fileName}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    window.triggerImport = function() { document.getElementById('import-file').click(); };
    document.getElementById('import-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                Object.keys(data).forEach(key => { if (key.startsWith('rast_')) localStorage.setItem(key, data[key]); });
                alert("Importado com sucesso!"); location.reload();
            } catch (err) { alert("Erro ao ler arquivo."); }
        };
        reader.readAsText(file);
    });

    window.resetAllData = function() {
        if (confirm("ATENÇÃO: Apagar TUDO?")) { localStorage.clear(); location.reload(); }
    };


    // ==========================================
    // 8. INTERFACE DO MODAL
    // ==========================================
    const modal = document.getElementById('event-modal');
    const modalTitle = document.getElementById('selected-date-title');

    window.openModal = function(dateString) {
        modalTitle.textContent = dateString;
        modal.classList.add('open');
        renderDayRecords();
    }

    window.closeModal = function() {
        modal.classList.remove('open');
        resetFormState();
    }

    window.switchTab = function(tabName) {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.add('active');
        const btns = document.querySelectorAll('.tab-btn');
        if(tabName === 'study') btns[0].classList.add('active'); 
        else btns[1].classList.add('active');
    }

    window.renderDayRecords = function() {
        const list = document.getElementById('day-records');
        const key = `rast_${currentSelectedDateKey}`;
        const records = JSON.parse(localStorage.getItem(key)) || [];
        
        list.innerHTML = '';
        if (records.length === 0) {
            list.innerHTML = '<p class="empty-msg">Nada registrado ainda.</p>';
            return;
        }

        records.forEach(item => {
            const div = document.createElement('div');
            div.className = `record-item ${item.type === 'agenda' ? 'agenda-type' : ''}`;
            div.innerHTML = `
                <div class="record-info"><h4>${item.title}</h4><p>${item.detail}</p></div>
                <div class="btns-container">
                    <div class="edit-btn" onclick="startEdit(${item.id})" title="Editar">✎</div>
                    <div class="delete-btn" onclick="deleteRecord(${item.id})" title="Excluir">&times;</div>
                </div>
            `;
            list.appendChild(div);
        });
    }

    // ==========================================
    // 9. INICIALIZAÇÃO FINAL
    // ==========================================
    renderCalendar(currentMonth, currentYear);

    const initDate = new Date();
    const initKey = `${initDate.getFullYear()}-${initDate.getMonth()}-${initDate.getDate()}`;
    const initString = `${initDate.getDate()} de ${months[initDate.getMonth()]}`;
    updateDailySummary(initKey, initString);
    currentSelectedDateKey = initKey;
});

// ==========================================
// 10. SISTEMA DE NOTIFICAÇÕES E ALARMES
// ==========================================

function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("Este navegador não suporta notificações de sistema.");
        return;
    }
    if (Notification.permission === "granted") return;
    if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                new Notification("rast.", {
                    body: "Notificações ativadas!",
                    icon: "icon-192.png"
                });
            }
        });
    }
}

function checkAlarms() {
    if (Notification.permission !== "granted") return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const y = now.getFullYear();
    const m = now.getMonth(); 
    const d = now.getDate();
    
    const todayKey = `rast_${y}-${m}-${d}`;
    const records = JSON.parse(localStorage.getItem(todayKey)) || [];

    records.forEach(item => {
        if (item.type === 'agenda' && item.rawTime && item.detail.includes('antes')) {
            const [eventH, eventM] = item.rawTime.split(':').map(Number);
            let alarmOffset = 0;
            if (item.detail.includes('15 min')) alarmOffset = 15;
            if (item.detail.includes('1 hora')) alarmOffset = 60;
            if (alarmOffset === 0) return;

            const eventDate = new Date();
            eventDate.setHours(eventH, eventM, 0);
            const triggerDate = new Date(eventDate.getTime() - (alarmOffset * 60000));
            
            if (triggerDate.getHours() === currentHour && triggerDate.getMinutes() === currentMin) {
                new Notification(`Lembrete: ${item.title}`, {
                    body: `Seu evento é às ${item.rawTime}. Prepare-se!`,
                    icon: "icon-192.png",
                    tag: `alarm-${item.id}`
                });
            }
        }
    });
}
setInterval(checkAlarms, 60000);

// ==========================================
// 11. INTEGRAÇÃO GOOGLE DRIVE (AUTOMÁTICA)
// ==========================================

// ⚠️ MANTENHA SUAS CHAVES AQUI
const API_KEY = 'AIzaSyCiH4-8UWDtnx332M5UiJZBsm0PJUVNG5g';
const CLIENT_ID = '525104877878-9eog1kg4ftijip7p4cfr26hf3a0rmq3r.apps.googleusercontent.com';

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;

window.gapiLoaded = function() { gapi.load('client', initializeGapiClient); }
async function initializeGapiClient() {
    await gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
    gapiInited = true;
}

window.gisLoaded = function() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPES, callback: '',
    });
    gisInited = true;
}

const script1 = document.createElement('script');
script1.src = "https://apis.google.com/js/api.js";
script1.onload = window.gapiLoaded;
document.head.appendChild(script1);

const script2 = document.createElement('script');
script2.src = "https://accounts.google.com/gsi/client";
script2.onload = window.gisLoaded;
document.head.appendChild(script2);

// BOTÃO DE LOGIN MANUAL
window.handleAuthClick = function() {
    const btn = document.getElementById('google-sync-btn');
    btn.textContent = "⌛ Conectando...";

    tokenClient.callback = async (resp) => {
        if (resp.error) throw (resp);
        await syncDriveData(false); // Falso = Modo Manual (Pergunta)
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

// FUNÇÃO PRINCIPAL DE SINCRONIZAÇÃO
async function syncDriveData(silent = false) {
    const btn = document.getElementById('google-sync-btn');
    if (!silent) btn.textContent = "🔄 ...";

    try {
        const response = await gapi.client.drive.files.list({
            q: "name = 'rast_backup.json' and trashed = false",
            fields: 'files(id, modifiedTime)',
            spaces: 'drive'
        });

        const files = response.result.files;

        if (files && files.length > 0) {
            const fileId = files[0].id;
            
            // LÓGICA AUTOMÁTICA
            if (silent) {
                // Se foi chamado silenciosamente (por salvar), apenas sobe
                await updateFile(fileId);
                console.log("Upload automático concluído.");
            } else {
                // Modo Manual
                const userChoice = confirm("Backup encontrado!\n[OK] Baixar do Drive\n[CANCELAR] Subir Local");
                if (userChoice) {
                    const content = await gapi.client.drive.files.get({fileId: fileId, alt: 'media'});
                    updateLocalStorageFromDrive(content.result, false);
                } else {
                    await updateFile(fileId);
                    alert("Salvo no Drive!");
                }
            }
            
            // Salva timestamp para o vigia
            localStorage.setItem('rast_last_sync', Date.now());

        } else {
            // Se não existe, cria (mesmo no modo silencioso)
            if (silent || confirm("Criar primeiro backup no Drive?")) {
                await createNewFile();
                if(!silent) alert("Backup criado!");
            }
        }
    } catch (err) {
        console.error(err);
        if (!silent) alert("Erro sync: " + err.message);
    } finally {
        if (!silent) btn.textContent = "☁️ Sincronizar Google Drive";
    }
}

// FUNÇÕES AUXILIARES DE DRIVE
function getLocalData() {
    const dataToExport = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('rast_')) dataToExport[key] = localStorage.getItem(key);
    }
    return JSON.stringify(dataToExport, null, 2);
}

function updateLocalStorageFromDrive(data, silent) {
    localStorage.clear();
    Object.keys(data).forEach(key => { if (key.startsWith('rast_')) localStorage.setItem(key, data[key]); });
    if (!silent) alert("Dados atualizados!");
    location.reload();
}

async function createNewFile() {
    const fileContent = getLocalData();
    const file = new Blob([fileContent], {type: 'application/json'});
    const metadata = { 'name': 'rast_backup.json', 'mimeType': 'application/json' };
    const accessToken = gapi.client.getToken().access_token;
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
    form.append('file', file);
    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({'Authorization': 'Bearer ' + accessToken}),
        body: form
    });
}

async function updateFile(fileId) {
    const fileContent = getLocalData();
    const file = new Blob([fileContent], {type: 'application/json'});
    const metadata = { 'mimeType': 'application/json' };
    const accessToken = gapi.client.getToken().access_token;
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
    form.append('file', file);
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: new Headers({'Authorization': 'Bearer ' + accessToken}),
        body: form
    });
}

// ==========================================
// 12. TRIGGERS AUTOMÁTICOS
// ==========================================

// Trigger de Upload Automático (Chamado ao salvar/deletar)
window.autoSaveToDrive = function() {
    if (gapiInited && gapi.client.getToken()) {
        syncDriveData(true); // Modo silencioso = true
    }
}

// Trigger de Download Automático (Monitoramento a cada 60s)
setInterval(() => {
    if (gapiInited && gapi.client.getToken()) {
        checkForRemoteUpdates();
    }
}, 60000);

async function checkForRemoteUpdates() {
    try {
        const response = await gapi.client.drive.files.list({
            q: "name = 'rast_backup.json' and trashed = false",
            fields: 'files(id, modifiedTime)',
            spaces: 'drive'
        });

        const files = response.result.files;
        if (files && files.length > 0) {
            const remoteTime = new Date(files[0].modifiedTime).getTime();
            const lastSync = parseInt(localStorage.getItem('rast_last_sync') || '0');

            // Se o arquivo do Drive for mais novo que nossa última sincronização (+ margem de 10s)
            if (remoteTime > (lastSync + 10000)) {
                console.log("Nova versão encontrada no Drive! Baixando...");
                const fileId = files[0].id;
                const content = await gapi.client.drive.files.get({fileId: fileId, alt: 'media'});
                
                // Atualiza timestamp e recarrega
                localStorage.setItem('rast_last_sync', Date.now());
                updateLocalStorageFromDrive(content.result, true); // true = sem alerta, só reload
            }
        }
    } catch (err) {
        console.log("Erro no check automático (ignore se offline):", err);
    }
}