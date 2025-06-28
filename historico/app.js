import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Configuração do Firebase ---
// Substitua com suas credenciais reais do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCyzA-QWhXZTUahk13tKhMEAt8AqLpCzDc",
    authDomain: "acai-sabordaterra-fiados.firebaseapp.com",
    projectId: "acai-sabordaterra-fiados",
    storageBucket: "acai-sabordaterra-fiados.appspot.com",
    messagingSenderId: "95507357232",
    appId: "1:95507357232:web:22d0264b98bd5ab0ff57f5"
};

// --- Módulo de Utilitários ---
const Utils = {
    /**
     * Formata um valor numérico como moeda brasileira (BRL).
     * @param {number} value O valor a ser formatado.
     * @returns {string} A string formatada.
     */
    formatCurrency(value) {
        return (parseFloat(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    /**
     * Formata um objeto Timestamp do Firestore para uma string de data legível.
     * @param {object} timestamp O timestamp do Firestore (com a propriedade 'seconds').
     * @returns {string} A data formatada para o fuso horário local do usuário.
     */
    formatDate(timestamp) {
        if (!timestamp || typeof timestamp.seconds !== 'number') return 'N/A';
        // Converte segundos para milissegundos e cria o objeto Date
        const date = new Date(timestamp.seconds * 1000);
        // Usa toLocaleDateString para formatar corretamente no fuso horário do navegador do usuário
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
};

// --- Módulo Principal do Histórico ---
const HistoricoModule = {
    db: null,
    allRecords: [],
    currentFilteredRecords: [], // Armazena os registros atualmente filtrados

    /**
     * Inicializa o módulo, configura o banco de dados e os ouvintes de eventos.
     * @param {object} dbInstance Instância do Firestore.
     */
    init(dbInstance) {
        this.db = dbInstance;
        this.listenForRecords();
        this.setupFilters();
        this.setupExportButton(); // Configura o botão de exportação
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
    },

    /**
     * Ouve por atualizações em tempo real na coleção 'registrosDiarios'.
     */
    listenForRecords() {
        const recordsRef = collection(this.db, "registrosDiarios");
        onSnapshot(recordsRef, (snapshot) => {
            this.allRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Ordena os registros pela data, do mais recente para o mais antigo
            this.allRecords.sort((a, b) => b.dataDeRegistro.seconds - a.dataDeRegistro.seconds);
            
            this.populateEmployeeFilter(this.allRecords);
            this.applyFilters(); // Aplica filtros e renderiza
        }, (error) => {
            console.error("Erro ao ouvir registros: ", error);
            Toastify({ text: "Erro ao carregar dados. Verifique o console.", backgroundColor: "var(--danger-color)" }).showToast();
        });
    },

    /**
     * Configura os ouvintes de eventos para os campos de filtro.
     */
    setupFilters() {
        document.getElementById('filter-start-date').addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-end-date').addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-employee').addEventListener('change', () => this.applyFilters());
    },

    /**
     * Popula o menu suspenso de funcionários com base nos registros.
     * @param {Array} records Array de todos os registros.
     */
    populateEmployeeFilter(records) {
        const employeeFilter = document.getElementById('filter-employee');
        const employees = [...new Set(records.map(r => r.funcionario).filter(Boolean))]; // Filtra nomes vazios
        
        const selectedValue = employeeFilter.value;
        
        employeeFilter.innerHTML = '<option value="">Todos</option>'; // Reseta as opções
        employees.sort().forEach(employee => {
            const option = document.createElement('option');
            option.value = employee;
            option.textContent = employee;
            employeeFilter.appendChild(option);
        });

        employeeFilter.value = selectedValue; // Mantém o valor selecionado se ainda existir
    },

    /**
     * Aplica os filtros selecionados aos registros e renderiza o resultado.
     */
    applyFilters() {
        let filteredRecords = [...this.allRecords];
        const startDateStr = document.getElementById('filter-start-date').value;
        const endDateStr = document.getElementById('filter-end-date').value;
        const employee = document.getElementById('filter-employee').value;

        if (startDateStr) {
            // Converte a data de início para o início do dia (00:00:00) no fuso local
            const start = new Date(startDateStr);
            start.setHours(0, 0, 0, 0);
            const startTimestamp = start.getTime() / 1000;
            filteredRecords = filteredRecords.filter(r => r.dataDeRegistro.seconds >= startTimestamp);
        }
        if (endDateStr) {
            // Converte a data de fim para o final do dia (23:59:59) no fuso local
            const end = new Date(endDateStr);
            end.setHours(23, 59, 59, 999);
            const endTimestamp = end.getTime() / 1000;
            filteredRecords = filteredRecords.filter(r => r.dataDeRegistro.seconds <= endTimestamp);
        }
        if (employee) {
            filteredRecords = filteredRecords.filter(r => r.funcionario === employee);
        }
        
        this.currentFilteredRecords = filteredRecords; // Salva para uso na exportação
        this.renderHistory(filteredRecords);
        this.updateKPIs(filteredRecords);
    },

    /**
     * Atualiza os cartões de KPI com base nos registros filtrados.
     * @param {Array} records Registros filtrados.
     */
    updateKPIs(records) {
        const totals = records.reduce((acc, r) => {
            acc.faturamentoBruto += (parseFloat(r.dinheiroEntrada) || 0) + (parseFloat(r.pixEntrada) || 0) + (parseFloat(r.cartaoEntrada) || 0);
            acc.totalSaidas += (parseFloat(r.dinheiroSaida) || 0) + (parseFloat(r.pixSaida) || 0);
            return acc;
        }, { faturamentoBruto: 0, totalSaidas: 0 });

        const saldoLiquido = totals.faturamentoBruto - totals.totalSaidas;
        const mediaDiaria = records.length > 0 ? saldoLiquido / records.length : 0;

        document.getElementById('kpi-faturamento').textContent = Utils.formatCurrency(totals.faturamentoBruto);
        document.getElementById('kpi-saidas').textContent = Utils.formatCurrency(totals.totalSaidas);
        document.getElementById('kpi-saldo').textContent = Utils.formatCurrency(saldoLiquido);
        document.getElementById('kpi-media').textContent = Utils.formatCurrency(mediaDiaria);
    },

    /**
     * Renderiza os cartões de histórico no contêiner.
     * @param {Array} records Registros a serem exibidos.
     */
    renderHistory(records) {
        const container = document.getElementById('history-container');
        container.innerHTML = '';
        if (records.length === 0) {
            container.innerHTML = '<p>Nenhum registro encontrado para os filtros selecionados.</p>';
            return;
        }
        records.forEach(record => {
            const faturamentoBruto = (parseFloat(record.dinheiroEntrada) || 0) + (parseFloat(record.pixEntrada) || 0) + (parseFloat(record.cartaoEntrada) || 0);
            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <h4>${Utils.formatDate(record.dataDeRegistro)}</h4>
                <p><strong>Funcionário(a):</strong> ${record.funcionario || 'N/A'}</p>
                <p><strong>Termômetro:</strong> ${record.climaLoja || 'N/A'}</p>
                <p class="total">${Utils.formatCurrency(faturamentoBruto)}</p>
                <button data-id="${record.id}">Ver Detalhes</button>
            `;
            container.appendChild(card);
        });

        container.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => this.openModal(e.target.dataset.id));
        });
    },

    /**
     * Abre o modal com os detalhes de um registro específico para edição.
     * @param {string} recordId O ID do documento no Firestore.
     */
    openModal(recordId) {
        const record = this.allRecords.find(r => r.id === recordId);
        if (!record) return;

        const modalBody = document.getElementById('modal-body');
        const dateForInput = record.dataDeRegistro ? new Date(record.dataDeRegistro.seconds * 1000).toISOString().split('T')[0] : '';

        modalBody.innerHTML = `
            <form id="edit-form" data-id="${record.id}">
                <div class="form-grid">
                    <div class="form-group"><label>Funcionário(a)</label><input type="text" id="edit-funcionario" value="${record.funcionario || ''}"></div>
                    <div class="form-group"><label>Data</label><input type="date" id="edit-data" value="${dateForInput}"></div>
                    
                    <div class="form-group full-width">
                        <label>Entradas</label>
                        <div class="form-grid">
                            <div class="form-group"><label>💰 Dinheiro</label><input type="number" step="0.01" id="edit-dinheiroEntrada" value="${record.dinheiroEntrada || 0}"></div>
                            <div class="form-group"><label>📱 PIX</label><input type="number" step="0.01" id="edit-pixEntrada" value="${record.pixEntrada || 0}"></div>
                            <div class="form-group"><label>💳 Cartão</label><input type="number" step="0.01" id="edit-cartaoEntrada" value="${record.cartaoEntrada || 0}"></div>
                        </div>
                    </div>
                    
                    <div class="form-group full-width">
                        <label>Saídas</label>
                        <div class="form-grid">
                            <div class="form-group full-width"><label>Motivo</label><input type="text" id="edit-motivoSaida" value="${record.motivoSaida || ''}"></div>
                            <div class="form-group"><label>💰 Dinheiro</label><input type="number" step="0.01" id="edit-dinheiroSaida" value="${record.dinheiroSaida || 0}"></div>
                            <div class="form-group"><label>📱 PIX</label><input type="number" step="0.01" id="edit-pixSaida" value="${record.pixSaida || 0}"></div>
                        </div>
                    </div>
                    
                    <div class="form-group full-width"><label>Cartões Fidelidade Utilizados</label><input type="number" id="edit-fidelidadeQuantidade" value="${record.fidelidadeQuantidade || 0}"></div>
                    
                    <div class="form-group full-width">
                        <label>Ajuste de Caixa</label>
                        <div class="form-grid">
                            <div class="form-group"><label>Real Dinheiro</label><input type="number" step="0.01" id="edit-realDinheiro" value="${record.ajuste?.realDinheiro || 0}"></div>
                            <div class="form-group"><label>Real PIX</label><input type="number" step="0.01" id="edit-realPix" value="${record.ajuste?.realPix || 0}"></div>
                            <div class="form-group full-width"><label>Motivo Ajuste</label><textarea id="edit-motivoAjuste">${record.ajuste?.motivo || ''}</textarea></div>
                        </div>
                    </div>

                    <div class="form-group full-width"><label>Observações do Dia</label><textarea id="edit-observacoesDia">${record.observacoesDia || ''}</textarea></div>
                </div>
                <div class="button-group">
                    <button type="button" id="btn-delete" class="btn btn-danger">Excluir Registro</button>
                    <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                </div>
            </form>
        `;
        document.getElementById('details-modal').style.display = 'flex';
        
        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveChanges(record.id, e.currentTarget);
        });
        document.getElementById('btn-delete').addEventListener('click', (e) => {
            this.confirmDelete(record.id, e.currentTarget);
        });
    },

    /**
     * Fecha o modal de detalhes.
     */
    closeModal() {
        document.getElementById('details-modal').style.display = 'none';
    },

    /**
     * Salva as alterações feitas em um registro.
     * @param {string} recordId O ID do documento.
     * @param {HTMLFormElement} form O elemento do formulário.
     */
    async saveChanges(recordId, form) {
        const saveButton = form.querySelector('button[type="submit"]');
        saveButton.disabled = true;
        saveButton.textContent = 'Salvando...';

        // Garante que todos os valores numéricos sejam salvos como 'number'
        const updatedData = {
            funcionario: form.querySelector('#edit-funcionario').value,
            // A data de registro original (Timestamp) não deve ser alterada aqui.
            // Se precisar alterar, deve ser feito com cuidado para criar um novo Timestamp.
            dinheiroEntrada: parseFloat(form.querySelector('#edit-dinheiroEntrada').value) || 0,
            pixEntrada: parseFloat(form.querySelector('#edit-pixEntrada').value) || 0,
            cartaoEntrada: parseFloat(form.querySelector('#edit-cartaoEntrada').value) || 0,
            motivoSaida: form.querySelector('#edit-motivoSaida').value,
            dinheiroSaida: parseFloat(form.querySelector('#edit-dinheiroSaida').value) || 0,
            pixSaida: parseFloat(form.querySelector('#edit-pixSaida').value) || 0,
            fidelidadeQuantidade: parseInt(form.querySelector('#edit-fidelidadeQuantidade').value, 10) || 0,
            observacoesDia: form.querySelector('#edit-observacoesDia').value,
            ajuste: {
                realDinheiro: parseFloat(form.querySelector('#edit-realDinheiro').value) || 0,
                realPix: parseFloat(form.querySelector('#edit-realPix').value) || 0,
                motivo: form.querySelector('#edit-motivoAjuste').value,
            }
        };
        
        const recordRef = doc(this.db, "registrosDiarios", recordId);
        try {
            await updateDoc(recordRef, updatedData);
            Toastify({ text: "Registro atualizado com sucesso!", backgroundColor: "var(--success-color)" }).showToast();
            this.closeModal();
        } catch (error) {
            console.error("Erro ao atualizar:", error);
            Toastify({ text: "Falha ao atualizar o registro.", backgroundColor: "var(--danger-color)" }).showToast();
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Salvar Alterações';
        }
    },

    /**
     * Exibe uma confirmação antes de excluir um registro.
     * @param {string} recordId O ID do documento.
     * @param {HTMLButtonElement} deleteButton O botão de exclusão.
     */
    confirmDelete(recordId, deleteButton) {
        Toastify({
            text: "Tem certeza? Esta ação é irreversível.",
            duration: -1, // Fica aberto até ser dispensado
            gravity: "top",
            position: "center",
            backgroundColor: "var(--warning-color)",
            close: true,
            actions: [
                {
                    text: 'EXCLUIR',
                    backgroundColor: 'var(--danger-color)',
                    onClick: (toastElement) => {
                        toastElement.hideToast();
                        this.deleteRecord(recordId, deleteButton);
                    }
                }
            ]
        }).showToast();
    },

    /**
     * Exclui um registro do Firestore.
     * @param {string} recordId O ID do documento.
     * @param {HTMLButtonElement} deleteButton O botão de exclusão.
     */
    async deleteRecord(recordId, deleteButton) {
        deleteButton.disabled = true;
        const originalText = deleteButton.textContent;
        deleteButton.textContent = "Excluindo...";

        const recordRef = doc(this.db, "registrosDiarios", recordId);
        try {
            await deleteDoc(recordRef);
            Toastify({ text: "Registro excluído com sucesso!", backgroundColor: "var(--success-color)" }).showToast();
            this.closeModal();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            Toastify({ text: "Falha ao excluir o registro.", backgroundColor: "var(--danger-color)" }).showToast();
            deleteButton.disabled = false;
            deleteButton.textContent = originalText;
        }
    },

    /**
     * Configura o botão de exportação para CSV.
     */
    setupExportButton() {
        document.getElementById('export-csv-btn').addEventListener('click', () => {
            if (this.currentFilteredRecords.length === 0) {
                Toastify({ text: "Não há dados para exportar.", backgroundColor: "var(--warning-color)" }).showToast();
                return;
            }
            this.exportToCSV(this.currentFilteredRecords);
        });
    },

    /**
     * Exporta os registros fornecidos para um arquivo CSV.
     * @param {Array} records Os registros a serem exportados.
     */
    exportToCSV(records) {
        const headers = [
            "Data", "Funcionario", "Faturamento Bruto", "Total Saidas", "Saldo Liquido",
            "Entrada Dinheiro", "Entrada PIX", "Entrada Cartao", "Saida Dinheiro", "Saida PIX",
            "Motivo Saida", "Fidelidade Qtd", "Obs Dia"
        ];
        const csvRows = [headers.join(',')];

        for (const record of records) {
            const faturamentoBruto = (parseFloat(record.dinheiroEntrada) || 0) + (parseFloat(record.pixEntrada) || 0) + (parseFloat(record.cartaoEntrada) || 0);
            const totalSaidas = (parseFloat(record.dinheiroSaida) || 0) + (parseFloat(record.pixSaida) || 0);
            const saldoLiquido = faturamentoBruto - totalSaidas;
            // Remove vírgulas da data para não quebrar o CSV
            const dataFormatada = Utils.formatDate(record.dataDeRegistro).replace(/,/g, '');

            const values = [
                `"${dataFormatada}"`,
                `"${record.funcionario || ''}"`,
                faturamentoBruto.toFixed(2),
                totalSaidas.toFixed(2),
                saldoLiquido.toFixed(2),
                (parseFloat(record.dinheiroEntrada) || 0).toFixed(2),
                (parseFloat(record.pixEntrada) || 0).toFixed(2),
                (parseFloat(record.cartaoEntrada) || 0).toFixed(2),
                (parseFloat(record.dinheiroSaida) || 0).toFixed(2),
                (parseFloat(record.pixSaida) || 0).toFixed(2),
                `"${record.motivoSaida || ''}"`,
                parseInt(record.fidelidadeQuantidade) || 0,
                `"${(record.observacoesDia || '').replace(/"/g, '""')}"` // Escapa aspas duplas
            ];
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\r\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // Adiciona BOM para Excel
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `historico_sabordaterra_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Toastify({ text: "Download do CSV iniciado!", backgroundColor: "var(--info-color)" }).showToast();
    }
};

// --- Ponto de Entrada da Aplicação ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // Ouve por mudanças no estado de autenticação
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Usuário está autenticado, inicializa o módulo principal
                console.log("Usuário autenticado:", user.uid);
                HistoricoModule.init(db);
            } else {
                // Usuário não está autenticado, tenta login anônimo
                console.log("Nenhum usuário. Tentando login anônimo...");
                signInAnonymously(auth).catch(error => {
                     console.error("Falha na autenticação anônima:", error);
                     Toastify({ text: "Falha na autenticação. A aplicação pode não funcionar.", backgroundColor: "var(--danger-color)" }).showToast();
                });
            }
        });

    } catch (error) {
        console.error("Erro ao inicializar o Firebase:", error);
        document.body.innerHTML = "<h1>Erro Crítico ao Inicializar a Aplicação. Verifique o console.</h1>";
    }
});
