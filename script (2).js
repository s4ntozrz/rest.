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
    
    // --- VARIÁVEIS DE EDIÇÃO (NOVO) ---
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
                resetFormState(); // Garante que abre limpo, sem edição pendente
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
    // 6. SALVAMENTO, EDIÇÃO E EXCLUSÃO (CORE)
    // ==========================================

    function saveOrUpdateRecord(record) {
        const storageKey = `rast_${currentSelectedDateKey}`;
        let records = JSON.parse(localStorage.getItem(storageKey)) || [];

        if (isEditMode && editId) {
            // MODO EDIÇÃO: Substitui o item existente
            const index = records.findIndex(r => r.id === editId);
            if (index !== -1) {
                // Mantém o ID original para não quebrar lógica de data/turno
                record.id = editId; 
                records[index] = record;
            }
        } else {
            // MODO CRIAÇÃO: Adiciona novo
            records.push(record);
        }
        
        localStorage.setItem(storageKey, JSON.stringify(records));
        
        resetFormState(); // Sai do modo edição e limpa forms
        renderDayRecords(); 
        renderCalendar(currentMonth, currentYear); 
        
        // Atualiza resumo
        const dateParts = currentSelectedDateKey.split('-');
        const dayString = `${dateParts[2]} de ${months[dateParts[1]]}`;
        updateDailySummary(currentSelectedDateKey, dayString);
    }

    // --- FORMULÁRIO ESTUDO ---
    document.getElementById('study-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const subject = e.target.querySelector('input[type="text"]').value;
        const timeInput = e.target.querySelector('input[placeholder="60"]').value;
        const notes = e.target.querySelector('textarea').value;

        saveOrUpdateRecord({
            id: Date.now(), // Será sobrescrito se for edição
            type: 'study',
            title: subject,
            detail: `${timeInput} min`,
            notes: notes,
            rawTime: timeInput // Guarda o número puro para facilitar edição futura
        });
    });

    // --- FORMULÁRIO AGENDA ---
    document.getElementById('agenda-form').addEventListener('submit', (e) => {
        e.preventDefault();
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

    // --- FUNÇÃO DE INICIAR EDIÇÃO ---
    window.startEdit = function(id) {
        const storageKey = `rast_${currentSelectedDateKey}`;
        const records = JSON.parse(localStorage.getItem(storageKey)) || [];
        const item = records.find(r => r.id === id);

        if (!item) return;

        // 1. Ativa Modo Edição
        isEditMode = true;
        editId = id;

        // 2. Troca para a aba correta e preenche inputs
        if (item.type === 'study') {
            switchTab('study');
            const form = document.getElementById('study-form');
            form.querySelector('input[type="text"]').value = item.title;
            // Tenta pegar o tempo cru (rawTime) ou extrai do texto "60 min"
            const timeVal = item.rawTime || parseInt(item.detail); 
            form.querySelector('input[placeholder="60"]').value = timeVal;
            form.querySelector('textarea').value = item.notes;
            form.querySelector('button').textContent = "Atualizar Sessão"; // Muda texto do botão
        } else {
            switchTab('agenda');
            const form = document.getElementById('agenda-form');
            form.querySelector('input[type="text"]').value = item.title;
            const timeVal = item.rawTime || item.detail.replace('Horário: ', '').trim();
            form.querySelector('input[type="time"]').value = timeVal;
            form.querySelector('textarea').value = item.notes;
            form.querySelector('button').textContent = "Atualizar Evento"; // Muda texto do botão
        }

        // Rola suavemente para o topo do modal para ver o form
        document.querySelector('.modal-content').scrollTop = 0;
    };

    // --- FUNÇÃO PARA LIMPAR ESTADO DO FORM ---
    function resetFormState() {
        isEditMode = false;
        editId = null;
        
        // Limpa forms
        document.getElementById('study-form').reset();
        document.getElementById('agenda-form').reset();
        
        // Volta botões ao texto original
        document.querySelector('#study-form button').textContent = "Salvar Sessão";
        document.querySelector('#agenda-form button').textContent = "Adicionar Evento";
    }

    // --- FUNÇÃO EXCLUIR ---
    window.deleteRecord = function(id) {
        if(!confirm("Deseja realmente excluir?")) return;

        const storageKey = `rast_${currentSelectedDateKey}`;
        let records = JSON.parse(localStorage.getItem(storageKey)) || [];
        records = records.filter(record => record.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(records));
        
        // Se estava editando esse item, cancela a edição
        if (isEditMode && editId === id) resetFormState();

        renderDayRecords();
        renderCalendar(currentMonth, currentYear);
        
        const dateParts = currentSelectedDateKey.split('-');
        const dayString = `${dateParts[2]} de ${months[dateParts[1]]}`;
        updateDailySummary(currentSelectedDateKey, dayString);
    };


    // ==========================================
    // 7. MENU E SISTEMA
    // ==========================================
    const sidebar = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    const menuIcon = document.querySelector('.menu-icon');
    const themeSwitch = document.getElementById('menu-theme-toggle');

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

    const savedTheme = localStorage.getItem('rast_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeSwitch.checked = true;
    }

    themeSwitch.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('rast_theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('rast_theme', 'light');
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
        resetFormState(); // Limpa se fechar sem salvar
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
            
            // Renderiza botões de Editar (Lápis) e Excluir (X)
            div.innerHTML = `
                <div class="record-info">
                    <h4>${item.title}</h4>
                    <p>${item.detail}</p>
                </div>
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
    // ================================
    
    renderCalendar(currentMonth, currentYear);

    const initDate = new Date();
    const initKey = `${initDate.getFullYear()}-${initDate.getMonth()}-${initDate.getDate()}`;
    const initString = `${initDate.getDate()} de ${months[initDate.getMonth()]}`;
    updateDailySummary(initKey, initString);
    currentSelectedDateKey = initKey;
    });