export class UIManager {
    constructor() {
        this.currentFiadoId = null;
        this.isCreating = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Filtros
        document.getElementById('dataInicio').addEventListener('change', () => this.onFiltersChanged());
        document.getElementById('dataFim').addEventListener('change', () => this.onFiltersChanged());
        document.getElementById('filtroStatus').addEventListener('change', () => this.onFiltersChanged());
        document.getElementById('filtroCliente').addEventListener('input', () => this.onFiltersChanged());
        
        // Botão novo fiado
        document.getElementById('btnNovoFiado').addEventListener('click', () => this.openCreateModal());
        
        // Delegação de eventos para os botões na lista
        document.getElementById('listaFiados').addEventListener('click', (event) => {
            if (event.target.classList.contains('btn-editar')) {
                const fiadoId = event.target.dataset.id;
                this.openEditModal(fiadoId);
            } else if (event.target.classList.contains('btn-excluir')) {
                const fiadoId = event.target.dataset.id;
                this.openDeleteModal(fiadoId);
            }
        });

        // Listeners do Modal de Edição
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeEditModal());
        document.getElementById('btnCancelar').addEventListener('click', () => this.closeEditModal());
        document.getElementById('editModal').addEventListener('click', (event) => {
            if (event.target.id === 'editModal') {
                this.closeEditModal();
            }
        });
        document.getElementById('formFiado').addEventListener('submit', (event) => this.handleFormSubmit(event));

        // Listeners do Modal de Exclusão
        document.getElementById('closeDeleteModalBtn').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('btnCancelarExclusao').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('deleteConfirmModal').addEventListener('click', (event) => {
            if (event.target.id === 'deleteConfirmModal') {
                this.closeDeleteModal();
            }
        });
        document.getElementById('btnConfirmarExclusao').addEventListener('click', () => this.handleDeleteConfirm());

        // Listener para mudança de status
        document.getElementById('editStatus').addEventListener('change', (event) => {
            this.toggleDataPagamentoField(event.target.value);
        });
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
    updateMetricsCards(fiados) {
        const totalFiados = fiados.length;
        const valorTotal = fiados.reduce((sum, fiado) => sum + (parseFloat(fiado.valor) || 0), 0);
        const fiadosPendentes = fiados.filter(fiado => fiado.status === 'Pendente').length;
        const valorPendente = fiados
            .filter(fiado => fiado.status === 'Pendente')
            .reduce((sum, fiado) => sum + (parseFloat(fiado.valor) || 0), 0);

        document.getElementById('totalFiados').textContent = totalFiados;
        document.getElementById('valorTotal').textContent = this.formatCurrency(valorTotal);
        document.getElementById('fiadosPendentes').textContent = fiadosPendentes;
        document.getElementById('valorPendente').textContent = this.formatCurrency(valorPendente);
    }

    // Renderização da Lista de Fiados
    renderFiadosList(fiados) {
        const listaEl = document.getElementById('listaFiados');
        listaEl.innerHTML = '';

        if (fiados.length === 0) {
            listaEl.innerHTML = '<p>Nenhum fiado encontrado para os filtros selecionados.</p>';
            return;
        }

        fiados.forEach(fiado => {
            const dataFormatada = this.formatDate(fiado.data);
            
            const cardEl = document.createElement('div');
            cardEl.className = `fiado-card ${fiado.status.toLowerCase()}`;
            
            cardEl.innerHTML = `
                <div class="card-header">
                    <h4>${fiado.cliente}</h4>
                    <p class="cliente">${fiado.telefone || 'Sem telefone'}</p>
                </div>
                <div class="info-row">
                    <span>Data</span>
                    <span>${dataFormatada}</span>
                </div>
                <div class="info-row">
                    <span>Produto</span>
                    <span>${fiado.produto || 'Não informado'}</span>
                </div>
                <div class="info-row">
                    <span>Status</span>
                    <span class="status ${fiado.status.toLowerCase()}">${fiado.status}</span>
                </div>
                <div class="card-footer">
                    <div class="valor">${this.formatCurrency(fiado.valor)}</div>
                    <div class="card-actions">
                        <button class="btn-editar" data-id="${fiado.id}">Editar</button>
                        <button class="btn-excluir" data-id="${fiado.id}">Excluir</button>
                    </div>
                </div>
            `;
            listaEl.appendChild(cardEl);
        });
    }

    // Gerenciamento de Modais
    openCreateModal() {
        this.isCreating = true;
        this.currentFiadoId = null;
        
        document.getElementById('modalTitle').textContent = 'Novo Fiado';
        document.getElementById('editFiadoId').value = '';
        document.getElementById('formFiado').reset();
        
        // Define data atual como padrão
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('editData').value = hoje;
        
        // Esconde campo de data de pagamento
        document.getElementById('dataPagamentoGroup').style.display = 'none';
        
        document.getElementById('editModal').style.display = 'flex';
    }

    openEditModal(fiadoId) {
        this.isCreating = false;
        this.currentFiadoId = fiadoId;
        
        document.getElementById('modalTitle').textContent = 'Editar Fiado';
        
        // Busca o fiado na lista atual
        const fiado = this.findFiadoById(fiadoId);
        if (!fiado) {
            this.showToast('Fiado não encontrado', 'error');
            return;
        }

        // Preenche o formulário
        document.getElementById('editFiadoId').value = fiadoId;
        document.getElementById('editCliente').value = fiado.cliente || '';
        document.getElementById('editTelefone').value = fiado.telefone || '';
        document.getElementById('editData').value = fiado.data || '';
        document.getElementById('editValor').value = fiado.valor || 0;
        document.getElementById('editProduto').value = fiado.produto || '';
        document.getElementById('editObservacoes').value = fiado.observacoes || '';
        document.getElementById('editStatus').value = fiado.status || 'Pendente';
        document.getElementById('editDataPagamento').value = fiado.dataPagamento || '';

        // Mostra/esconde campo de data de pagamento
        this.toggleDataPagamentoField(fiado.status);

        document.getElementById('editModal').style.display = 'flex';
    }

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('formFiado').reset();
        this.isCreating = false;
        this.currentFiadoId = null;
    }

    openDeleteModal(fiadoId) {
        this.currentFiadoId = fiadoId;
        document.getElementById('deleteConfirmModal').style.display = 'flex';
    }

    closeDeleteModal() {
        document.getElementById('deleteConfirmModal').style.display = 'none';
        this.currentFiadoId = null;
    }

    // Toggle campo de data de pagamento
    toggleDataPagamentoField(status) {
        const dataPagamentoGroup = document.getElementById('dataPagamentoGroup');
        if (status === 'Pago') {
            dataPagamentoGroup.style.display = 'block';
            // Define data atual se estiver vazio
            if (!document.getElementById('editDataPagamento').value) {
                document.getElementById('editDataPagamento').value = new Date().toISOString().split('T')[0];
            }
        } else {
            dataPagamentoGroup.style.display = 'none';
            document.getElementById('editDataPagamento').value = '';
        }
    }

    // Validação de Formulário
    validateForm() {
        const cliente = document.getElementById('editCliente').value;
        const data = document.getElementById('editData').value;
        const valor = document.getElementById('editValor').value;
        const status = document.getElementById('editStatus').value;

        if (!cliente.trim()) {
            this.showToast('Por favor, informe o nome do cliente', 'error');
            return false;
        }

        if (!data) {
            this.showToast('Por favor, selecione uma data', 'error');
            return false;
        }

        if (!valor || parseFloat(valor) <= 0) {
            this.showToast('Por favor, informe um valor válido', 'error');
            return false;
        }

        if (status === 'Pago' && !document.getElementById('editDataPagamento').value) {
            this.showToast('Por favor, informe a data do pagamento', 'error');
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
            cliente: document.getElementById('editCliente').value.trim(),
            telefone: document.getElementById('editTelefone').value.trim(),
            data: document.getElementById('editData').value,
            valor: document.getElementById('editValor').value,
            produto: document.getElementById('editProduto').value.trim(),
            observacoes: document.getElementById('editObservacoes').value.trim(),
            status: document.getElementById('editStatus').value,
            dataPagamento: document.getElementById('editDataPagamento').value || null
        };

        this.setButtonLoading('btnSalvar', true);

        try {
            if (this.isCreating) {
                await this.onCreateFiado(formData);
                this.showWhatsappButton(formData);
            } else {
                await this.onUpdateFiado(this.currentFiadoId, formData);
                this.showWhatsappButton(formData);
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.setButtonLoading('btnSalvar', false);
        }
    }

    showWhatsappButton(fiado) {
        // Remove botão anterior se existir
        let existingBtn = document.getElementById('btnWhatsappShare');
        if (existingBtn) existingBtn.remove();

        const btn = document.createElement('button');
        btn.id = 'btnWhatsappShare';
        btn.className = 'btn btn-success';
        btn.style.marginTop = '1rem';
        btn.innerHTML = 'Enviar por WhatsApp';

        btn.onclick = () => {
            const msg = this.formatWhatsappMessage(fiado);
            const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        };

        // Adiciona o botão abaixo do modal
        const modal = document.getElementById('editModal');
        modal.querySelector('.modal-footer').appendChild(btn);
    }

    formatWhatsappMessage(fiado) {
        let msg = `🆕 NOVO FIADO REGISTRADO - AÇAÍ SABOR DA TERRA 🌿\n\n`;
        msg += `👤 CLIENTE: ${fiado.cliente}\n`;
        msg += `💰 VALOR: R$ ${parseFloat(fiado.valor).toFixed(2)}\n`;
        msg += `📅 DATA: ${this.formatDate(fiado.data)}\n`;
        if (fiado.telefone) msg += `📱 TELEFONE: ${fiado.telefone}\n`;
        if (fiado.produto) msg += `🛒 PRODUTO: ${fiado.produto}\n`;
        if (fiado.observacoes) msg += `📝 OBSERVAÇÕES: ${fiado.observacoes}\n`;
        msg += `✅ STATUS: ${fiado.status}`;
        if (fiado.status === 'Pago' && fiado.dataPagamento) {
            msg += ` (Pago em ${this.formatDate(fiado.dataPagamento)})`;
        }
        // Remove qualquer caractere estranho
        return msg.normalize('NFKC').replace(/[^\x00-\x7F\u00A0-\uFFFF]/g, '');
    }

    async handleDeleteConfirm() {
        if (!this.currentFiadoId) return;

        this.setButtonLoading('btnConfirmarExclusao', true);

        try {
            await this.onDeleteFiado(this.currentFiadoId);
            this.closeDeleteModal();
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.setButtonLoading('btnConfirmarExclusao', false);
        }
    }

    // Callbacks para serem definidos pelo app.js
    onCreateFiado = null;
    onUpdateFiado = null;
    onDeleteFiado = null;
    onFiltersChanged = null;

    // Funções auxiliares
    findFiadoById(id) {
        // Esta função será implementada pelo app.js
        return null;
    }

    formatCurrency(value) {
        return parseFloat(value || 0).toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        });
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    // Persistência de Filtros
    saveFilters() {
        const filters = {
            dataInicio: document.getElementById('dataInicio').value,
            dataFim: document.getElementById('dataFim').value,
            status: document.getElementById('filtroStatus').value,
            cliente: document.getElementById('filtroCliente').value
        };
        localStorage.setItem('fiadosFiltros', JSON.stringify(filters));
    }

    loadFilters() {
        const savedFilters = localStorage.getItem('fiadosFiltros');
        if (savedFilters) {
            const filters = JSON.parse(savedFilters);
            document.getElementById('dataInicio').value = filters.dataInicio || '';
            document.getElementById('dataFim').value = filters.dataFim || '';
            document.getElementById('filtroStatus').value = filters.status || 'Todos';
            document.getElementById('filtroCliente').value = filters.cliente || '';
        }
    }
}
