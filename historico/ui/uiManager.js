export class UIManager {
    constructor() {
        this.charts = {
            saldoChart: null,
            entradasChart: null
        };
        this.currentRecordId = null;
        this.isCreating = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Filtros
        document.getElementById('dataInicio').addEventListener('change', () => this.onFiltersChanged());
        document.getElementById('dataFim').addEventListener('change', () => this.onFiltersChanged());
        document.getElementById('filtroFuncionario').addEventListener('change', () => this.onFiltersChanged());
        
        // Botão novo registro
        document.getElementById('btnNovoRegistro').addEventListener('click', () => this.openCreateModal());
        
        // Botão exportar CSV
        document.getElementById('btnExportarCsv').addEventListener('click', () => this.exportToCSV());
        
        // Delegação de eventos para os botões na lista
        document.getElementById('listaRegistros').addEventListener('click', (event) => {
            if (event.target.classList.contains('btn-editar')) {
                const recordId = event.target.dataset.id;
                this.openEditModal(recordId);
            } else if (event.target.classList.contains('btn-excluir')) {
                const recordId = event.target.dataset.id;
                this.openDeleteModal(recordId);
            }
        });

        // Listeners do Modal de Edição
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeEditModal());
        document.getElementById('btnCancelarEdicao').addEventListener('click', () => this.closeEditModal());
        document.getElementById('editModal').addEventListener('click', (event) => {
            if (event.target.id === 'editModal') {
                this.closeEditModal();
            }
        });
        document.getElementById('formEdicao').addEventListener('submit', (event) => this.handleFormSubmit(event));

        // Listeners do Modal de Exclusão
        document.getElementById('closeDeleteModalBtn').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('btnCancelarExclusao').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('deleteConfirmModal').addEventListener('click', (event) => {
            if (event.target.id === 'deleteConfirmModal') {
                this.closeDeleteModal();
            }
        });
        document.getElementById('btnConfirmarExclusao').addEventListener('click', () => this.handleDeleteConfirm());
    }

    // Sistema de Toasts
    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <span class="toast-icon"></span>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remove o toast após 5 segundos
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    // Estados de Loading
    setButtonLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        const textSpan = button.querySelector('.btn-text');
        const spinnerSpan = button.querySelector('.btn-spinner');
        
        if (isLoading) {
            button.disabled = true;
            textSpan.style.display = 'none';
            spinnerSpan.style.display = 'inline';
        } else {
            button.disabled = false;
            textSpan.style.display = 'inline';
            spinnerSpan.style.display = 'none';
        }
    }

    // Atualização dos Cards de Métricas
    updateMetricsCards(registros) {
        let faturamentoBruto = 0;
        let totalSaidas = 0;

        registros.forEach(registro => {
            const entradas = (parseFloat(registro.dinheiroEntrada) || 0) + 
                           (parseFloat(registro.pixEntrada) || 0) + 
                           (parseFloat(registro.cartaoEntrada) || 0);
            faturamentoBruto += entradas;
            totalSaidas += parseFloat(registro.totalSaidas) || 0;
        });

        const saldoLiquido = faturamentoBruto - totalSaidas;
        const mediaDiaria = registros.length > 0 ? saldoLiquido / registros.length : 0;

        document.getElementById('faturamentoBruto').textContent = this.formatCurrency(faturamentoBruto);
        document.getElementById('totalSaidas').textContent = this.formatCurrency(totalSaidas);
        document.getElementById('saldoLiquido').textContent = this.formatCurrency(saldoLiquido);
        document.getElementById('mediaDiaria').textContent = this.formatCurrency(mediaDiaria);
    }

    // Renderização da Lista de Registros
    renderRegistrosList(registros) {
        const listaEl = document.getElementById('listaRegistros');
        listaEl.innerHTML = '';

        if (registros.length === 0) {
            listaEl.innerHTML = '<p>Nenhum registro encontrado para os filtros selecionados.</p>';
            return;
        }

        registros.forEach(registro => {
            const dataObj = registro.timestamp ? 
                new Date(registro.timestamp.seconds * 1000) : 
                new Date(registro.data + "T00:00:00");
            const dataFormatada = dataObj.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
            
            const cardEl = document.createElement('div');
            cardEl.className = 'registro-card';
            
            const entradas = (parseFloat(registro.dinheiroEntrada) || 0) + 
                           (parseFloat(registro.pixEntrada) || 0) + 
                           (parseFloat(registro.cartaoEntrada) || 0);
            const saidas = parseFloat(registro.totalSaidas) || 0;
            const saldo = entradas - saidas;

            cardEl.innerHTML = `
                <div class="card-header">
                    <h4>${dataFormatada}</h4>
                    <p class="funcionario">${registro.funcionario}</p>
                </div>
                <div class="card-body">
                    <div class="info-row">
                        <span>Entradas</span>
                        <span class="valor-positivo">${this.formatCurrency(entradas)}</span>
                    </div>
                    <div class="info-row">
                        <span>Saídas</span>
                        <span class="valor-negativo">${this.formatCurrency(saidas)}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="card-footer-total">
                        <span>Saldo do Dia</span>
                        <strong>${this.formatCurrency(saldo)}</strong>
                    </div>
                    <div class="card-actions">
                        <button class="btn-editar" data-id="${registro.id}">Editar</button>
                        <button class="btn-excluir" data-id="${registro.id}">Excluir</button>
                    </div>
                </div>
            `;
            listaEl.appendChild(cardEl);
        });
    }

    // Renderização dos Gráficos
    renderCharts(registros) {
        this.renderSaldoChart(registros);
        this.renderEntradasChart(registros);
    }

    renderSaldoChart(registros) {
        const ctx = document.getElementById('saldoChart');
        
        // Destrói o gráfico anterior se existir
        if (this.charts.saldoChart) {
            this.charts.saldoChart.destroy();
        }

        if (registros.length === 0) {
            ctx.style.display = 'none';
            return;
        }

        ctx.style.display = 'block';

        // Prepara os dados para o gráfico
        const sortedRegistros = [...registros].sort((a, b) => {
            const dateA = a.timestamp ? new Date(a.timestamp.seconds * 1000) : new Date(a.data);
            const dateB = b.timestamp ? new Date(b.timestamp.seconds * 1000) : new Date(b.data);
            return dateA - dateB;
        });

        const labels = [];
        const saldoData = [];
        let saldoAcumulado = 0;

        sortedRegistros.forEach(registro => {
            const dataObj = registro.timestamp ? 
                new Date(registro.timestamp.seconds * 1000) : 
                new Date(registro.data);
            const dataFormatada = dataObj.toLocaleDateString('pt-BR');
            
            const entradas = (parseFloat(registro.dinheiroEntrada) || 0) + 
                           (parseFloat(registro.pixEntrada) || 0) + 
                           (parseFloat(registro.cartaoEntrada) || 0);
            const saidas = parseFloat(registro.totalSaidas) || 0;
            const saldoDia = entradas - saidas;
            
            saldoAcumulado += saldoDia;
            
            labels.push(dataFormatada);
            saldoData.push(saldoAcumulado);
        });

        this.charts.saldoChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Saldo Líquido Acumulado',
                    data: saldoData,
                    borderColor: '#4A0E68',
                    backgroundColor: 'rgba(74, 14, 104, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(value);
                            }
                        }
                    }
                }
            }
        });
    }

    renderEntradasChart(registros) {
        const ctx = document.getElementById('entradasChart');
        
        // Destrói o gráfico anterior se existir
        if (this.charts.entradasChart) {
            this.charts.entradasChart.destroy();
        }

        if (registros.length === 0) {
            ctx.style.display = 'none';
            return;
        }

        ctx.style.display = 'block';

        // Calcula totais por tipo de entrada
        let totalDinheiro = 0;
        let totalPix = 0;
        let totalCartao = 0;

        registros.forEach(registro => {
            totalDinheiro += parseFloat(registro.dinheiroEntrada) || 0;
            totalPix += parseFloat(registro.pixEntrada) || 0;
            totalCartao += parseFloat(registro.cartaoEntrada) || 0;
        });

        const totalGeral = totalDinheiro + totalPix + totalCartao;

        if (totalGeral === 0) {
            ctx.style.display = 'none';
            return;
        }

        ctx.style.display = 'block';

        this.charts.entradasChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Dinheiro', 'Pix', 'Cartão'],
                datasets: [{
                    data: [totalDinheiro, totalPix, totalCartao],
                    backgroundColor: [
                        '#28a745',
                        '#007bff',
                        '#ffc107'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const percentage = ((value / totalGeral) * 100).toFixed(1);
                                return `${context.label}: ${new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Gerenciamento de Modais
    openCreateModal() {
        this.isCreating = true;
        this.currentRecordId = null;
        
        document.getElementById('modalTitle').textContent = 'Adicionar Novo Registro';
        document.getElementById('editRecordId').value = '';
        document.getElementById('formEdicao').reset();
        
        // Define data atual como padrão
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('editData').value = hoje;
        
        document.getElementById('editModal').style.display = 'flex';
    }

    openEditModal(recordId) {
        this.isCreating = false;
        this.currentRecordId = recordId;
        
        document.getElementById('modalTitle').textContent = 'Editar Registro';
        
        // Busca o registro na lista atual
        const registro = this.findRecordById(recordId);
        if (!registro) {
            this.showToast('Registro não encontrado', 'error');
            return;
        }

        // Preenche o formulário
        document.getElementById('editRecordId').value = recordId;
        document.getElementById('editData').value = registro.data;
        document.getElementById('editFuncionario').value = registro.funcionario || '';
        document.getElementById('editDinheiroEntrada').value = registro.dinheiroEntrada || 0;
        document.getElementById('editPixEntrada').value = registro.pixEntrada || 0;
        document.getElementById('editCartaoEntrada').value = registro.cartaoEntrada || 0;
        document.getElementById('editTotalSaidas').value = registro.totalSaidas || 0;

        document.getElementById('editModal').style.display = 'flex';
    }

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('formEdicao').reset();
        this.isCreating = false;
        this.currentRecordId = null;
    }

    openDeleteModal(recordId) {
        this.currentRecordId = recordId;
        document.getElementById('deleteConfirmModal').style.display = 'flex';
    }

    closeDeleteModal() {
        document.getElementById('deleteConfirmModal').style.display = 'none';
        this.currentRecordId = null;
    }

    // Validação de Formulário
    validateForm() {
        const data = document.getElementById('editData').value;
        const funcionario = document.getElementById('editFuncionario').value;

        if (!data) {
            this.showToast('Por favor, selecione uma data', 'error');
            return false;
        }

        if (!funcionario) {
            this.showToast('Por favor, selecione um funcionário', 'error');
            return false;
        }

        return true;
    }

    // Handlers de Eventos
    async handleFormSubmit(event) {
        event.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const formData = {
            data: document.getElementById('editData').value,
            funcionario: document.getElementById('editFuncionario').value,
            dinheiroEntrada: document.getElementById('editDinheiroEntrada').value,
            pixEntrada: document.getElementById('editPixEntrada').value,
            cartaoEntrada: document.getElementById('editCartaoEntrada').value,
            totalSaidas: document.getElementById('editTotalSaidas').value
        };

        this.setButtonLoading('btnSalvar', true);

        try {
            if (this.isCreating) {
                await this.onCreateRecord(formData);
            } else {
                await this.onUpdateRecord(this.currentRecordId, formData);
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.setButtonLoading('btnSalvar', false);
        }
    }

    async handleDeleteConfirm() {
        if (!this.currentRecordId) return;

        this.setButtonLoading('btnConfirmarExclusao', true);

        try {
            await this.onDeleteRecord(this.currentRecordId);
            this.closeDeleteModal();
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.setButtonLoading('btnConfirmarExclusao', false);
        }
    }

    // Callbacks para serem definidos pelo app.js
    onCreateRecord = null;
    onUpdateRecord = null;
    onDeleteRecord = null;
    onFiltersChanged = null;

    // Funções auxiliares
    findRecordById(id) {
        // Esta função será implementada pelo app.js
        return null;
    }

    formatCurrency(value) {
        return parseFloat(value || 0).toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        });
    }

    // Exportação para CSV
    exportToCSV(registros) {
        if (!registros || registros.length === 0) {
            this.showToast('Nenhum dado para exportar', 'warning');
            return;
        }

        const headers = ['Data', 'Funcionário', 'Dinheiro', 'Pix', 'Cartão', 'Total Entradas', 'Saídas', 'Saldo'];
        const csvContent = [
            headers.join(','),
            ...registros.map(registro => {
                const dataObj = registro.timestamp ? 
                    new Date(registro.timestamp.seconds * 1000) : 
                    new Date(registro.data);
                const dataFormatada = dataObj.toLocaleDateString('pt-BR');
                
                const dinheiro = parseFloat(registro.dinheiroEntrada) || 0;
                const pix = parseFloat(registro.pixEntrada) || 0;
                const cartao = parseFloat(registro.cartaoEntrada) || 0;
                const totalEntradas = dinheiro + pix + cartao;
                const saidas = parseFloat(registro.totalSaidas) || 0;
                const saldo = totalEntradas - saidas;

                return [
                    dataFormatada,
                    registro.funcionario,
                    dinheiro.toFixed(2),
                    pix.toFixed(2),
                    cartao.toFixed(2),
                    totalEntradas.toFixed(2),
                    saidas.toFixed(2),
                    saldo.toFixed(2)
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `registros_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast('Arquivo CSV exportado com sucesso!', 'success');
    }

    // Persistência de Filtros
    saveFilters() {
        const filters = {
            dataInicio: document.getElementById('dataInicio').value,
            dataFim: document.getElementById('dataFim').value,
            funcionario: document.getElementById('filtroFuncionario').value
        };
        localStorage.setItem('painelFiltros', JSON.stringify(filters));
    }

    loadFilters() {
        const savedFilters = localStorage.getItem('painelFiltros');
        if (savedFilters) {
            const filters = JSON.parse(savedFilters);
            document.getElementById('dataInicio').value = filters.dataInicio || '';
            document.getElementById('dataFim').value = filters.dataFim || '';
            document.getElementById('filtroFuncionario').value = filters.funcionario || 'Todos';
        }
    }

    // Limpeza
    cleanup() {
        if (this.charts.saldoChart) {
            this.charts.saldoChart.destroy();
        }
        if (this.charts.entradasChart) {
            this.charts.entradasChart.destroy();
        }
    }
}
